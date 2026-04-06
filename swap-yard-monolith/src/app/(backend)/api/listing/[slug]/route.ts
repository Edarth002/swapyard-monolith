import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import {
  uploadManyImageFiles,
  deleteManyByPublicIds,
} from "@/app/(backend)/utils/cloudinary";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/token";
import { redisClient } from "@/lib/redis";
import { updateListingSchema } from "../schema";

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
  if (value === null) return undefined;
  const parsed = String(value).trim();
  return parsed ? parsed : null;
}

async function getAuthenticatedSeller(req: Request) {
  const token = await getCookie(req, "session");

  if (!token) {
    return {
      error: NextResponse.json({ message: "Unauthorized" }, { status: 401 }),
    };
  }

  const payload = await verifyToken(token);
  const userId = typeof payload === "string" ? payload : payload?.userId;

  if (!userId) {
    return {
      error: NextResponse.json({ message: "Unauthorized" }, { status: 401 }),
    };
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, role: true },
  });

  if (!user) {
    return {
      error: NextResponse.json({ message: "User does not exist" }, { status: 404 }),
    };
  }

  if (user.role !== "SELLER") {
    return {
      error: NextResponse.json(
        { message: "User is not authorized" },
        { status: 403 }
      ),
    };
  }

  return { user };
}



export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await ctx.params;

    const listing = await prisma.listing.findUnique({
      where: { id },
      include: {
        images: true,
        category: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
        seller: {
          select: {
            id: true,
            firstname: true,
            lastname: true,
            image: true,
          },
        },
      },
    });

    if (!listing) {
      return NextResponse.json({ message: "Listing not found" }, { status: 404 });
    }

    return NextResponse.json({ ok: true, listing }, { status: 200 });
  } catch (err) {
    console.error("Error fetching listing:", err);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}


export async function DELETE(
  req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await ctx.params;

    const auth = await getAuthenticatedSeller(req);
    if ("error" in auth) return auth.error;

    const { user } = auth;

    const existing = await prisma.listing.findUnique({
      where: { id },
      include: { images: true },
    });

    if (!existing) {
      return NextResponse.json({ message: "Listing not found" }, { status: 404 });
    }

    if (existing.sellerId !== user.id) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    await prisma.listing.delete({
      where: { id },
    });

    const publicIds = existing.images
      .map((img) => img.publicId)
      .filter((publicId): publicId is string => Boolean(publicId));

    if (publicIds.length) {
      await deleteManyByPublicIds(publicIds);
    }


    return NextResponse.json(
      { message: "Listing deleted successfully" },
      { status: 200 }
    );
  } catch (err) {
    console.error("Error deleting listing:", err);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}