import { NextResponse } from "next/server";
import {
  deleteManyByPublicIds,
  uploadManyImageFiles,
} from "@/app/(backend)/utils/cloudinary";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/token";
import { createListingSchema } from "./schema";
import { createSlug } from "@/lib/slugGenerator";
import { fetchListings } from "@/lib/getListingLogic";
import {
  handleRouteError,
  UnauthorizedError,
  ForbiddenError,
  ConflictError,
  AppError,
} from "@/lib/errors";

export const runtime = "nodejs";

async function getCookie(req: Request, name: string) {
  const cookie = req.headers.get("cookie");
  if (!cookie) return null;

  return (
    cookie
      .split("; ")
      .find((c) => c.startsWith(`${name}=`))
      ?.split("=")[1] ?? null
  );
}

function toNullableString(value: FormDataEntryValue | null) {
  const parsed = String(value || "").trim();
  return parsed ? parsed : null;
}

async function getSeller(req: Request) {
  const token = await getCookie(req, "session");
  if (!token) throw new UnauthorizedError("Authentication required");

  const payload = await verifyToken(token);
  const userId = typeof payload === "string" ? payload : payload?.userId;
  if (!userId) throw new UnauthorizedError("Invalid or expired session token");

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, role: true },
  });

  if (!user) throw new UnauthorizedError("User does not exist");
  if (user.role !== "SELLER") {
    throw new ForbiddenError("Only sellers can create listings");
  }

  return user;
}

export async function POST(req: Request) {
  const idempotencyKey = req.headers.get("idempotency-key");
  if (!idempotencyKey) {
    return handleRouteError(new AppError("Idempotency-Key header is required", 400));
  }

  let uploaded: Array<{ url: string; public_id: string }> = [];

  try {
    const user = await getSeller(req);

    const existingEntry = await prisma.idempotencyKey.findUnique({
      where: { key: idempotencyKey },
    });

    if (existingEntry?.status === "COMPLETED") {
      return NextResponse.json(existingEntry.response, { status: 200 });
    }

    if (existingEntry?.status === "PENDING") {
      const twoMinutesAgo = new Date(Date.now() - 2 * 60000);
      if (existingEntry.updatedAt > twoMinutesAgo) {
        throw new ConflictError("Request is already being processed");
      }
    }

    const formData = await req.formData();
    const rawInput = {
      name: String(formData.get("name") || "").trim(),
      description: String(formData.get("description") || "").trim(),
      location: toNullableString(formData.get("location")),
      state: toNullableString(formData.get("state")),
      status: String(formData.get("status") || "AVAILABLE").trim(),
      condition: String(formData.get("condition") || "").trim(),
      price: Number(formData.get("price")),
      negotiable: String(formData.get("negotiable")) === "true",
      offersDelivery: String(formData.get("offersDelivery")) === "true",
      contact: toNullableString(formData.get("contact")),
      categoryId: toNullableString(formData.get("categoryId")),
    };

    // Throws ZodError directly -> handleRouteError yields 400 Bad Request
    const validatedData = createListingSchema.parse(rawInput);

    if (validatedData.categoryId) {
      const categoryExists = await prisma.category.findUnique({
        where: { id: validatedData.categoryId },
        select: { id: true },
      });
      if (!categoryExists) {
        throw new AppError("Invalid Category", 400);
      }
    }

    const images = formData
      .getAll("images")
      .filter((file): file is File => file instanceof File && file.size > 0);

    uploaded = images.length
      ? await uploadManyImageFiles(images, { subfolder: "listings" })
      : [];

    const baseSlug = createSlug(validatedData.name);
    let slug = baseSlug;
    let existingSlug = await prisma.listing.findUnique({ where: { slug }, select: { id: true } });
    let counter = 1;

    while (existingSlug) {
      slug = `${baseSlug}-${counter}`;
      existingSlug = await prisma.listing.findUnique({ where: { slug }, select: { id: true } });
      counter++;
    }

    const result = await prisma.$transaction(
      async (tx) => {
        await tx.idempotencyKey.upsert({
          where: { key: idempotencyKey },
          update: { status: "PENDING" },
          create: { key: idempotencyKey, status: "PENDING" },
        });

        const product = await tx.listing.create({
          data: {
            ...validatedData,
            slug,
            sellerId: user.id,
            images: {
              create: uploaded.map((img) => ({
                url: img.url,
                publicId: img.public_id,
              })),
            },
          },
          include: {
            images: true,
            category: { select: { id: true, name: true, image: true } },
            seller: { select: { id: true, firstname: true, lastname: true } },
          },
        });

        const responseData = {
          ok: true,
          message: "Listing created successfully",
          listing: product,
        };

        await tx.idempotencyKey.update({
          where: { key: idempotencyKey },
          data: {
            status: "COMPLETED",
            response: responseData as any,
          },
        });

        return responseData;
      },
      { timeout: 15000 }
    );

    return NextResponse.json(result, { status: 201 });
  } catch (err) {
    if (uploaded.length > 0) {
      const publicIds = uploaded.map((img) => img.public_id);
      await deleteManyByPublicIds(publicIds).catch(() => null);
    }

    return handleRouteError(err);
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const result = await fetchListings(searchParams);

    return NextResponse.json(
      {
        ok: true,
        items: result.items ?? [],
        meta: {
          total: result.total,
          page: result.page,
          pages: Math.ceil(result.total / result.limit) || 0,
        },
        orderBy: { createdAt: "desc" },
      },
      { status: 200 }
    );
  } catch (err: any) {
    if (err.message === "INVALID_PARAMS") {
      return handleRouteError(new AppError("Invalid query parameters", 400));
    }
    return handleRouteError(err);
  }
}