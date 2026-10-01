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

    const category = await prisma.category.findUnique({
      where: { slug },
      include: {
        listings: {
          include: {
            images: true,
          },
        },
      },
    });

    if (!category) {
      throw new NotFoundError("Category not found");
    }

    return NextResponse.json(
      {
        ok: true,
        data: {
          ...category,
          listings: category.listings ?? [],
        },
      },
      { status: 200 }
    );
  } catch (error) {
    return handleRouteError(error);
  }
}