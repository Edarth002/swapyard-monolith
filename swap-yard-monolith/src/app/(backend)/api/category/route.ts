import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/token";
import { uploadOneImageFile } from "@/app/(backend)/utils/cloudinary";
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
  const idempotencyKey = req.headers.get("idempotency-key")
  if (!idempotencyKey) {
    return NextResponse.json({ message: "Idempotency-Key header is required" }, { status: 400 });
  }

  try {
    const seller = await getSeller(req);

    if (!seller) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();

    const rawInput = {
      name: String(formData.get("name") || "").trim(),
    };

    const parsed = createCategorySchema.safeParse(rawInput);

    if (!parsed.success) {
      return NextResponse.json(
        {
          message: "Invalid input",
          errors: parsed.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { name } = parsed.data;

    let slug = createCategorySlug(name);

    let existing = await prisma.category.findUnique({
      where: { slug },
    });

    let counter = 1;
    while (existing) {
      slug = `${createCategorySlug(name)}-${counter}`;
      existing = await prisma.category.findUnique({
        where: { slug },
      });
      counter++;
    }

    const file = formData.get("image");

    if (file instanceof File && file.size > 0) {
      uploadedImage = await uploadOneImageFile(file, {
        subfolder: "categories",
      });
    }

    const categoryItem = await prisma.$transaction(async (tx) => {
      
      try {
        await tx.idempotencyKey.create({
          data: {
            key: idempotencyKey,
            status: "PENDING",
          },
        });
      } catch (error: any) {
        if (error.code === "P2002") {
          const existingKey = await tx.idempotencyKey.findUnique({
            where: { key: idempotencyKey },
          });
          if (!existingKey) {
            throw new Error("Idempotency key conflict");
          }
          if (existingKey?.status === "COMPLETED") {
            return existingKey.response as any; 
          }
          throw new Error("Request is already being processed");
        }
      }
      
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
          response: responseData,
        },
      });

      return responseData;
    });
    
    return NextResponse.json(categoryItem, { status: 201 });
  } catch (err: any) {
    console.error(err);

    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}
