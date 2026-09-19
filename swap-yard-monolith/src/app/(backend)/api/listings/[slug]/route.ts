import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

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

    if (listing) {
      return NextResponse.json({ ok: true, listing }, { status: 200 });
    }

    // Direct match missed — check whether this used to be a valid slug for
    // a listing that's since been renamed, so we can point the client at
    // its current slug instead of a dead end.
    const historyMatch = await prisma.listingSlugHistory.findFirst({
      where: { slug },
      select: {
        listing: { select: { slug: true } },
      },
    });

    if (historyMatch?.listing) {
      return NextResponse.json(
        {
          ok: false,
          message: "Listing has moved",
          redirectSlug: historyMatch.listing.slug,
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { message: "Listing not found" },
      { status: 404 }
    );
  } catch (err) {
    console.error("Error fetching listing:", err);

    return NextResponse.json(
      { message: "Server error" },
      { status: 500 }
    );
  }
}