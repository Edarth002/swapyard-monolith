import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import { verifyToken } from "@/lib/token";
import {
  uploadOneImageFile,
  deleteImageByPublicId,
} from "@/app/(backend)/utils/cloudinary";
import { updateCategorySchema } from "../../../category/schema";
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

async function getAdmin(req: Request) {
  const token = await getCookie(req, "session");
  if (!token) return null;

  const payload = await verifyToken(token);
  const userId = typeof payload === "string" ? payload : payload?.userId;

  if (!userId) return null;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, role: true },
  });

  if (!user || user.role !== "ADMIN") return null;

  return user;
}

export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  let uploadedImage: any = null;

  try {
    const admin = await getAdmin(req);

    if (!admin) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { id } = await ctx.params;

    const existing = await prisma.category.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json({ message: "Not found" }, { status: 404 });
    }

    const formData = await req.formData();

    const rawInput = {
      name:
        formData.get("name") !== null
          ? String(formData.get("name")).trim()
          : undefined,
    };

    const parsed = updateCategorySchema.safeParse(rawInput);

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

    const data: Prisma.CategoryUpdateInput = {};

    if (name !== undefined && name !== existing.name) {
      data.name = name;

      const baseSlug = createCategorySlug(name);
      let newSlug = baseSlug;

      const slugTaken = async (candidate: string) => {
        const [liveMatch, historyMatch] = await Promise.all([
          prisma.category.findUnique({ where: { slug: candidate } }),
          prisma.categorySlugHistory.findFirst({ where: { slug: candidate } }),
        ]);
        const liveConflict = liveMatch && liveMatch.id !== existing.id;
        return Boolean(liveConflict || historyMatch);
      };

      let counter = 1;
      while (await slugTaken(newSlug)) {
        newSlug = `${baseSlug}-${counter}`;
        counter++;
      }

      data.slug = newSlug;
    }

    const file = formData.get("image");

    if (file instanceof File && file.size > 0) {
      uploadedImage = await uploadOneImageFile(file, {
        subfolder: "categories",
      });

      data.image = uploadedImage.url;
      data.publicId = uploadedImage.public_id;
    }

    const updated = await prisma.$transaction(async (tx) => {
      const category = await tx.category.update({
        where: { id: existing.id },
        data,
      });

      if (data.slug && data.slug !== existing.slug) {
        await tx.categorySlugHistory.create({
          data: {
            slug: existing.slug,
            categoryId: existing.id,
          },
        });
      }

      return category;
    });

    if (uploadedImage && existing.publicId) {
      await deleteImageByPublicId(existing.publicId);
    }

    return NextResponse.json(
      { message: "Updated", category: updated },
      { status: 200 }
    );
  } catch (err) {
    console.error(err);

    if (uploadedImage?.public_id) {
      try {
        await deleteImageByPublicId(uploadedImage.public_id);
      } catch {}
    }

    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}