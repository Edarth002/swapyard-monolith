import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { deleteManyByPublicIds, uploadManyImageFiles } from "@/app/(backend)/utils/cloudinary";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/token";
import { createListingSchema, getListingsSchema } from "./schema";
import { createSlug } from "@/lib/slugGenerator";
import { fetchListings } from "@/lib/getListingLogic";

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

export async function POST(req: Request) {
  const idempotencyKey = req.headers.get("idempotency-key");
  if (!idempotencyKey) {
    return NextResponse.json({ message: "Idempotency-Key header is required" }, { status: 400 });
  }

  let uploaded: Array<{ url: string; public_id: string }> = [];

  try {
    const token = await getCookie(req, "session");
    if (!token) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const payload = await verifyToken(token);
    const userId = typeof payload === "string" ? payload : payload?.userId;
    if (!userId) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true },
    });

    if (!user || user.role !== "SELLER") {
      return NextResponse.json({ message: "Forbidden: Sellers only" }, { status: 403 });
    }

    const existingEntry = await prisma.idempotencyKey.findUnique({
      where: { key: idempotencyKey },
    });

    if (existingEntry?.status === "COMPLETED") {
      return NextResponse.json(existingEntry.response, { status: 200 });
    }

    if (existingEntry?.status === "PENDING") {
      const twoMinutesAgo = new Date(Date.now() - 2 * 60000);
      if (existingEntry.updatedAt > twoMinutesAgo) {
        return NextResponse.json({ message: "Request is already being processed" }, { status: 409 });
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

    const validatedInput = createListingSchema.safeParse(rawInput);
    if (!validatedInput.success) {
      return NextResponse.json({
        message: "Validation Error",
        errors: validatedInput.error.flatten().fieldErrors,
      }, { status: 400 });
    }

    if (validatedInput.data.categoryId) {
      const categoryExists = await prisma.category.findUnique({
        where: { id: validatedInput.data.categoryId },
      });
      if (!categoryExists) return NextResponse.json({ message: "Invalid Category" }, { status: 400 });
    }

    const images = formData.getAll("images").filter((file): file is File => file instanceof File && file.size > 0);
    uploaded = images.length ? await uploadManyImageFiles(images, { subfolder: "listings" }) : [];

    const result = await prisma.$transaction(async (tx) => {
      await tx.idempotencyKey.upsert({
        where: { key: idempotencyKey },
        update: { status: "PENDING" },
        create: { key: idempotencyKey, status: "PENDING" },
      });

      const product = await tx.listing.create({
        data: {
          ...validatedInput.data,
          slug: `${createSlug(validatedInput.data.name)}`,
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

      const responseData = { message: "Listing created successfully", listing: product };
      
      await tx.idempotencyKey.update({
        where: { key: idempotencyKey },
        data: {
          status: "COMPLETED",
          response: responseData as any,
        },
      });

      return responseData;
    }, { timeout: 15000 });

    return NextResponse.json(result, { status: 201 });

  } catch (err: any) {
    // 5. CLEANUP: If DB transaction fails, delete the images from Cloudinary
    if (uploaded.length > 0) {
      const publicIds = uploaded.map(img => img.public_id);
      await deleteManyByPublicIds(publicIds).catch(console.error);
    }

    console.error("Error creating listing:", err);
    return NextResponse.json({ message: err.message || "Server Error" }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const result = await fetchListings(searchParams);
    
    return NextResponse.json({
      ok: true,
      items: result.items,
      meta: {
        total: result.total,
        page: result.page,
        pages: Math.ceil(result.total / result.limit),
      },
      orderBy: { createdAt: "desc" }
    })
    ;
  } catch (err: any) {
    if (err.message === "INVALID_PARAMS") return NextResponse.json({ message: "Bad Request" }, { status: 400 });
    return NextResponse.json({ message: "Server Error" }, { status: 500 });
  }
}