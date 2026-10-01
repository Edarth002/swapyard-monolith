import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/token";
import { addToCartSchema, updateCartItemSchema } from "./schema";
import { z } from "zod";
import {
  handleRouteError,
  UnauthorizedError,
  NotFoundError,
  ForbiddenError,
} from "@/lib/errors";

export const runtime = "nodejs";

const deleteCartItemSchema = z.object({
  listingId: z.string().trim().min(1, "Listing ID is required"),
});

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
    where: { id: userId },
    select: { id: true, role: true },
  });

  if (!user) throw new UnauthorizedError("User account not found");

  if (user.role !== "BUYER" && user.role !== "ADMIN") {
    throw new ForbiddenError("Only buyers or admins can access cart operations");
  }

  return user;
}

export async function GET(req: Request) {
  try {
    const user = await getUser(req);

    const cart = await prisma.cart.findUnique({
      where: { buyerId: user.id },
      include: {
        items: {
          include: {
            listing: {
              select: {
                id: true,
                name: true,
                price: true,
                images: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json(
      { ok: true, data: cart ?? { items: [] } },
      { status: 200 }
    );
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(req: Request) {
  try {
    const user = await getUser(req);

    const body = await req.json();
    const { listingId, quantity } = addToCartSchema.parse(body);

    const listing = await prisma.listing.findUnique({
      where: { id: listingId },
      select: { id: true },
    });

    if (!listing) {
      throw new NotFoundError("Listing not found");
    }

    let cart = await prisma.cart.findUnique({
      where: { buyerId: user.id },
      select: { id: true },
    });

    if (!cart) {
      cart = await prisma.cart.create({
        data: {
          buyerId: user.id,
        },
        select: { id: true },
      });
    }

    const item = await prisma.cartItem.upsert({
      where: {
        cartId_listingId: {
          cartId: cart.id,
          listingId,
        },
      },
      update: {
        quantity: { increment: quantity },
      },
      create: {
        cartId: cart.id,
        listingId,
        quantity,
      },
    });

    return NextResponse.json(
      { ok: true, message: "Added to cart", data: item },
      { status: 200 }
    );
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function PATCH(req: Request) {
  try {
    const user = await getUser(req);

    const body = await req.json();
    const { listingId, quantity } = updateCartItemSchema.parse(body);

    const cart = await prisma.cart.findUnique({
      where: { buyerId: user.id },
      select: { id: true },
    });

    if (!cart) {
      throw new NotFoundError("Cart not found");
    }

    const updatedItem = await prisma.cartItem.update({
      where: {
        cartId_listingId: {
          cartId: cart.id,
          listingId,
        },
      },
      data: { quantity },
    });

    return NextResponse.json(
      { ok: true, message: "Cart updated", data: updatedItem },
      { status: 200 }
    );
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function DELETE(req: Request) {
  try {
    const user = await getUser(req);

    const body = await req.json();
    const { listingId } = deleteCartItemSchema.parse(body);

    const cart = await prisma.cart.findUnique({
      where: { buyerId: user.id },
      select: { id: true },
    });

    if (!cart) {
      throw new NotFoundError("Cart not found");
    }

    await prisma.cartItem.delete({
      where: {
        cartId_listingId: {
          cartId: cart.id,
          listingId,
        },
      },
    });

    return NextResponse.json(
      { ok: true, message: "Item removed" },
      { status: 200 }
    );
  } catch (error) {
    return handleRouteError(error);
  }
}