import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { handleRouteError, NotFoundError } from "@/lib/errors";

export const runtime = "nodejs";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await ctx.params;

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