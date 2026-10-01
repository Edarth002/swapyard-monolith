import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { handleRouteError, NotFoundError } from "@/lib/errors";
import { z } from "zod";

export const runtime = "nodejs";

const slugParamSchema = z.object({
  slug: z
    .string()
    .trim()
    .min(1, "Slug cannot be empty")
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Invalid slug format"),
});

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = slugParamSchema.parse(await ctx.params);

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
      return NextResponse.json(
        {
          ok: true,
          listing: {
            ...listing,
            images: listing.images ?? [],
          },
        },
        { status: 200 }
      );
    }

    const historyMatch = await prisma.listingSlugHistory.findFirst({
      where: { slug },
      select: {
        listing: { select: { slug: true } },
      },
    });

    if (historyMatch?.listing?.slug) {
      return NextResponse.json(
        {
          ok: false,
          message: "Listing has moved",
          redirectSlug: historyMatch.listing.slug,
        },
        { status: 404 }
      );
    }

    throw new NotFoundError("Listing not found");
  } catch (err) {
    return handleRouteError(err);
  }
}