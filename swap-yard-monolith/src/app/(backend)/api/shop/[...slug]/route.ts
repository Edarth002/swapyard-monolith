import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ slug: string[] }> }
) {
  const { slug } = await params;

  const targetSlug = slug[slug.length - 1];

  try {
    const category = await prisma.category.findUnique({
      where: { slug: targetSlug },
      include: {
        listings: {
          include: { images: true }
        }
      }
    });

    if (category) {
      return NextResponse.json({ 
        type: "CATEGORY", 
        data: category 
      });
    }

    const listing = await prisma.listing.findUnique({
      where: { slug: targetSlug },
      include: {
        images: true,
        category: true,
        seller: {
          select: { firstname: true, lastname: true, image: true }
        }
      }
    });

    if (listing) {
      return NextResponse.json({ 
        type: "LISTING", 
        data: listing 
      });
    }

    return NextResponse.json({ message: "Resource not found" }, { status: 404 });

  } catch (error) {
    console.error("Routing Error:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}