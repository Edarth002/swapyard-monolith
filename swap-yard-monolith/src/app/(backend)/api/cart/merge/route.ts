import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/token";
import { mergeCartSchema } from "../schema";
import {
  handleRouteError,
  UnauthorizedError,
  AppError,
} from "@/lib/errors";

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
  if (!token) throw new UnauthorizedError("Authentication required");

  const payload = await verifyToken(token);
  const userId = typeof payload === "string" ? payload : payload?.userId;
  if (!userId) throw new UnauthorizedError("Invalid or expired session token");

  const user = await prisma.user.findUnique({
    where: { id: userId, role: "BUYER" },
    select: { id: true },
  });

  if (!user) {
    throw new UnauthorizedError("Buyer authentication required");
  }

  return user;
}

export async function POST(req: Request) {
  try {
    const user = await getUser(req);

    const body = await req.json();
    // Direct parse -> throws ZodError automatically mapped to 400 Bad Request
    const { items } = mergeCartSchema.parse(body);

    let cart = await prisma.cart.findUnique({
      where: { buyerId: user.id },
      select: { id: true },
    });

    if (!cart) {
      cart = await prisma.cart.create({
        data: { buyerId: user.id },
        select: { id: true },
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
      throw new AppError("Some listings do not exist", 400);
    }

    await prisma.$transaction(
      items.map((item) =>
        prisma.cartItem.upsert({
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
        })
      )
    );

    return NextResponse.json(
      {
        ok: true,
        message: "Cart merged successfully",
      },
      { status: 200 }
    );
  } catch (err) {
    return handleRouteError(err);
  }
}