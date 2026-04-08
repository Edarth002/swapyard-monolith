import { fetchListings } from "@/lib/getListingLogic";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ slug: string[] }> }
) {
  const { slug } = await params;

  const targetSlug = slug[slug.length - 1];

  const { searchParams } = new URL(req.url);

  try {
    const category = await prisma.category.findUnique({ where: { slug: targetSlug } });
  
  
    if (category) {
    const result = await fetchListings(searchParams, { categoryId: category.id });
    return NextResponse.json({ type: "CATEGORY", data: category, items: result.items, meta: result.total }, { status: 200 });
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
      }, { status: 200 });
    }

    return NextResponse.json({ message: "Resource not found" }, { status: 404 });

  } catch (error) {
    console.error("Routing Error:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}