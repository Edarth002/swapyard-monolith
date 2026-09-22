import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/token";
import { checkoutSchema } from "../schema";
import {
  handleRouteError,
  UnauthorizedError,
  ConflictError,
  AppError,
} from "@/lib/errors";

export const runtime = "nodejs";

function getCookie(req: Request, name: string): string | null {
  const cookie = req.headers.get("cookie");
  if (!cookie) return null;
  return (
    cookie.split("; ").find((c) => c.startsWith(`${name}=`))?.split("=")[1] ?? null
  );
}

async function getUser(req: Request) {
  const token = getCookie(req, "session");
  if (!token) throw new UnauthorizedError("Authentication required");

  const payload = await verifyToken(token);
  const userId = typeof payload === "string" ? payload : payload?.userId;
  if (!userId) throw new UnauthorizedError("Invalid or expired session token");

  const user = await prisma.user.findUnique({
    where: { id: userId, role: "BUYER" },
    select: { id: true, email: true },
  });

  if (!user) {
    throw new UnauthorizedError("Buyer authentication required");
  }

  return user;
}

export async function POST(req: Request) {
  const idempotencyKey = req.headers.get("Idempotency-Key");
  if (!idempotencyKey) {
    return handleRouteError(new AppError("Idempotency-Key header is required", 400));
  }

  try {
    const user = await getUser(req);

    const existingEntry = await prisma.idempotencyKey.findUnique({
      where: { key: idempotencyKey },
    });

    if (existingEntry?.status === "COMPLETED") {
      return NextResponse.json(existingEntry.response, { status: 200 });
    }

    if (existingEntry?.status === "PENDING") {
      const twoMinutesAgo = new Date(Date.now() - 2 * 60_000);
      if (existingEntry.updatedAt > twoMinutesAgo) {
        throw new ConflictError("Request is already being processed");
      }
    }

    await prisma.idempotencyKey.upsert({
      where: { key: idempotencyKey },
      update: { status: "PENDING" },
      create: { key: idempotencyKey, status: "PENDING" },
    });

    const body = await req.json();
    // Direct parse -> throws ZodError automatically mapped to 400 Bad Request
    const { pickupLocation, pickupNote } = checkoutSchema.parse(body);

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
                sellerId: true,
                status: true,
              },
            },
          },
        },
      },
    });

    if (!cart || cart.items.length === 0) {
      throw new AppError("Cart is empty", 400);
    }

    let subtotal = 0;
    const orderItemsData = cart.items.map((item) => {
      if (item.listing.status !== "AVAILABLE") {
        throw new AppError(
          `Item "${item.listing.name}" is no longer available`,
          400
        );
      }
      subtotal += item.listing.price * item.quantity;
      return {
        listingId: item.listing.id,
        sellerId: item.listing.sellerId,
        listingName: item.listing.name,
        unitPrice: item.listing.price,
        quantity: item.quantity,
      };
    });

    const deliveryFee = 0;
    const platformCommission = subtotal * 0.015;
    const totalAmount = subtotal + deliveryFee;
    const listingIds = orderItemsData.map((i) => i.listingId);

    const newOrder = await prisma.$transaction(
      async (tx) => {
        const created = await tx.order.create({
          data: {
            buyerId: user.id,
            pickupLocation,
            pickupNote,
            subtotal,
            deliveryFee,
            platformCommission,
            totalAmount,
            items: { create: orderItemsData },
            payment: {
              create: {
                buyerId: user.id,
                amount: totalAmount,
                status: "PENDING",
                provider: "PAYSTACK",
              },
            },
          },
          include: { payment: true },
        });

        await tx.listing.updateMany({
          where: { id: { in: listingIds }, status: "AVAILABLE" },
          data: { status: "SOLD" },
        });

        await tx.cartItem.deleteMany({ where: { cartId: cart.id } });

        return created;
      },
      { timeout: 15_000 }
    );

    // --- Paystack initialization (external call outside atomic DB transaction) ---
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    const paystackRes = await fetch(
      "https://api.paystack.co/transaction/initialize",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: user.email,
          amount: Math.round(totalAmount * 100),
          reference: newOrder.payment?.id,
          callback_url: `${baseUrl}/payment/success`,
        }),
      }
    );

    const paystackData = await paystackRes.json();

    if (!paystackData.status) {
      return NextResponse.json(
        {
          ok: false,
          message: "Order created, but payment initialization failed.",
          order: newOrder,
          error:
            paystackData?.message ??
            "Failed to initialize payment with Paystack",
        },
        { status: 207 }
      );
    }

    const finalResponse = {
      ok: true,
      message: "Order created",
      order: newOrder,
      paymentUrl: paystackData?.data?.authorization_url ?? null,
    };

    await prisma.idempotencyKey.update({
      where: { key: idempotencyKey },
      data: { status: "COMPLETED", response: finalResponse as any },
    });

    return NextResponse.json(finalResponse, { status: 200 });
  } catch (error) {
    return handleRouteError(error);
  }
}