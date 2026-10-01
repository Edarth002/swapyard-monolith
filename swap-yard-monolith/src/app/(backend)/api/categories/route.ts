import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/token";
import {
  uploadOneImageFile,
  deleteImageByPublicId,
} from "@/app/(backend)/utils/cloudinary";
import { createCategorySchema } from "./schema";
import { createCategorySlug } from "@/lib/slugGenerator";
import {
  handleRouteError,
  UnauthorizedError,
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

  if (!user || user.role !== "SELLER") {
    throw new UnauthorizedError("Seller authorization required");
  }

  return user;
}

export async function POST(req: Request) {
  let uploadedImage: any = null;

  try {
    const idempotencyKey = req.headers.get("idempotency-key");
    if (!idempotencyKey) {
      throw new AppError("Idempotency-Key header is required", 400);
    }

    await getSeller(req);

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
    const rawInput = { name: String(formData.get("name") || "").trim() };

    // Throws ZodError directly -> handleRouteError yields 400 Bad Request
    const { name } = createCategorySchema.parse(rawInput);

    const baseSlug = createCategorySlug(name);
    let slug = baseSlug;
    let existing = await prisma.category.findUnique({ where: { slug } });
    let counter = 1;

    while (existing) {
      slug = `${baseSlug}-${counter}`;
      existing = await prisma.category.findUnique({ where: { slug } });
      counter++;
    }

    const file = formData.get("image");
    if (file instanceof File && file.size > 0) {
      uploadedImage = await uploadOneImageFile(file, {
        subfolder: "categories",
      });
    }

    const categoryItem = await prisma.$transaction(
      async (tx) => {
        await tx.idempotencyKey.upsert({
          where: { key: idempotencyKey },
          update: { status: "PENDING" },
          create: { key: idempotencyKey, status: "PENDING" },
        });

        const category = await tx.category.create({
          data: {
            name,
            slug,
            image: uploadedImage?.url || null,
            publicId: uploadedImage?.public_id || null,
          },
        });

        const responseData = {
          ok: true,
          message: "Category created",
          category,
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
      { timeout: 10000 }
    );

    return NextResponse.json(categoryItem, { status: 201 });
  } catch (err) {
    if (uploadedImage?.public_id) {
      await deleteImageByPublicId(uploadedImage.public_id).catch(() => null);
    }

    return handleRouteError(err);
  }
}

export async function GET() {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        slug: true,
        image: true,
      },
    });

    return NextResponse.json(
      { ok: true, data: categories ?? [] },
      { status: 200 }
    );
  } catch (err) {
    return handleRouteError(err);
  }
}