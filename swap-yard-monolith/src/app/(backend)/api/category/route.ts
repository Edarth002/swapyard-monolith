import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/token";
import { uploadOneImageFile, deleteImageByPublicId } from "@/app/(backend)/utils/cloudinary";
import { createCategorySchema } from "./schema";
import { createCategorySlug } from "@/lib/slugGenerator";

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
  if (!token) return null;

  const payload = await verifyToken(token);
  const userId = typeof payload === "string" ? payload : payload?.userId;

  if (!userId) return null;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, role: true },
  });

  if (!user || user.role !== "SELLER") return null;

  return user;
}

export async function POST(req: Request) {
  let uploadedImage: any = null;
  const idempotencyKey = req.headers.get("idempotency-key");
  
  if (!idempotencyKey) {
    return NextResponse.json({ message: "Idempotency-Key header is required" }, { status: 400 });
  }

  try {
    const seller = await getSeller(req);
    if (!seller) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

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
    const rawInput = { name: String(formData.get("name") || "").trim() };
    const parsed = createCategorySchema.safeParse(rawInput);

    if (!parsed.success) {
      return NextResponse.json({
        message: "Invalid input",
        errors: parsed.error.flatten().fieldErrors,
      }, { status: 400 });
    }

    const { name } = parsed.data;

    let slug = createCategorySlug(name);
    let existing = await prisma.category.findUnique({ where: { slug } });
    let counter = 1;
    while (existing) {
      slug = `${createCategorySlug(name)}`;
      existing = await prisma.category.findUnique({ where: { slug } });
      counter++;
    }

    const file = formData.get("image");
    if (file instanceof File && file.size > 0) {
      uploadedImage = await uploadOneImageFile(file, { subfolder: "categories" });
    }

    const categoryItem = await prisma.$transaction(async (tx) => {
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

      const responseData = { message: "Category created", category };

      await tx.idempotencyKey.update({
        where: { key: idempotencyKey },
        data: {
          status: "COMPLETED",
          response: responseData as any,
        },
      });

      return responseData;
    }, { timeout: 10000 });

    return NextResponse.json(categoryItem, { status: 201 });

  } catch (err: any) {
    console.error("CATEGORY ERROR:", err);

    if (uploadedImage?.public_id) {
      await deleteImageByPublicId(uploadedImage.public_id).catch(console.error);
    }

    return NextResponse.json({ message: err.message || "Server error" }, { status: 500 });
  }
}
