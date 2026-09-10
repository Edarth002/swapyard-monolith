import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/token";

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

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await ctx.params;

    const listing = await prisma.listing.findUnique({
      where: { slug },
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
      return NextResponse.json(
        { message: "Listing not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { ok: true, listing },
      { status: 200 }
    );
  } catch (err) {
    console.error("Error fetching listing:", err);

    return NextResponse.json(
      { message: "Server error" },
      { status: 500 }
    );
  }
}
