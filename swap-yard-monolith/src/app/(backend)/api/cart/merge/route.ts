import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/token";
import { mergeCartSchema } from "../schema";

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

async function getUser(req: Request) {
  const token = await getCookie(req, "session");
  if (!token) return null;

  const payload = await verifyToken(token);
  const userId = typeof payload === "string" ? payload : payload?.userId;

  if (!userId) return null;

  return prisma.user.findUnique({
    where: { id: userId, role: "BUYER" },
  });
}

export async function POST(req: Request) {
  try {
    const user = await getUser(req);

    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = mergeCartSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          message: "Invalid input",
          errors: parsed.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { items } = parsed.data;

    let cart = await prisma.cart.findUnique({
      where: { buyerId: user.id },
    });

    if (!cart) {
      cart = await prisma.cart.create({
        data: { buyerId: user.id },
      });
    }

    const listingIds = items.map((i) => i.listingId);

    const existingListings = await prisma.listing.findMany({
      where: {
        id: { in: listingIds },
      },
      select: { id: true },
    });

    const validIds = new Set(existingListings.map((l) => l.id));

    const invalidItems = items.filter((i) => !validIds.has(i.listingId));

    if (invalidItems.length > 0) {
      return NextResponse.json(
        { message: "Some listings do not exist" },
        { status: 400 }
      );
    }

    for (const item of items) {
      await prisma.cartItem.upsert({
        where: {
          cartId_listingId: {
            cartId: cart.id,
            listingId: item.listingId,
          },
        },
        update: {
          quantity: { increment: item.quantity },
        },
        create: {
          cartId: cart.id,
          listingId: item.listingId,
          quantity: item.quantity,
        },
      });
    }

    return NextResponse.json({
      message: "Cart merged successfully",
    });

  } catch (err) {
    console.error("MERGE CART ERROR:", err);
    return NextResponse.json(
      { message: "Server error" },
      { status: 500 }
    );
  }
}