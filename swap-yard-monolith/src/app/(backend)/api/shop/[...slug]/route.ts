import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { fetchListings } from "@/lib/getListingLogic";
import { handleRouteError, NotFoundError } from "@/lib/errors";
import { z } from "zod";

export const runtime = "nodejs";

const catchAllSlugParamSchema = z.object({
  slug: z
    .array(
      z
        .string()
        .trim()
        .min(1, "Slug segment cannot be empty")
        .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Invalid slug segment format")
    )
    .min(1, "At least one path segment is required"),
});

export async function GET(
  req: Request,
  { params }: { params: Promise<{ slug: string[] }> }
) {
  try {
    const { slug } = catchAllSlugParamSchema.parse(await params);
    const targetSlug = slug[slug.length - 1];

    const { searchParams } = new URL(req.url);

    const category = await prisma.category.findUnique({
      where: { slug: targetSlug },
    });

    if (category) {
      const result = await fetchListings(searchParams, {
        categoryId: category.id,
      });

      return NextResponse.json(
        {
          ok: true,
          type: "CATEGORY",
          data: category,
          items: result.items ?? [],
          meta: {
            total: result.total,
            page: result.page,
            pages: Math.ceil(result.total / result.limit) || 0,
          },
        },
        { status: 200 }
      );
    }

    const listing = await prisma.listing.findUnique({
      where: { slug: targetSlug },
      include: {
        images: true,
        category: true,
        seller: {
          select: { firstname: true, lastname: true, image: true },
        },
      },
    });

    if (listing) {
      return NextResponse.json(
        {
          ok: true,
          type: "LISTING",
          data: {
            ...listing,
            images: listing.images ?? [],
          },
        },
        { status: 200 }
      );
    }

    throw new NotFoundError("Resource not found");
  } catch (error) {
    return handleRouteError(error);
  }
}