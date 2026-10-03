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
import { Prisma } from "@prisma/client";
import { logger } from "@/lib/logger"; // 👈 1. Import logger

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
  // 👈 2. Extract or generate trace correlation ID
  const requestId =
    req.headers.get("x-request-id") ||
    (typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID()
      : `req_${Date.now()}`);

  const idempotencyKey = req.headers.get("Idempotency-Key");
  if (!idempotencyKey) {
    return handleRouteError(
      new AppError("Idempotency-Key header is required", 400),
      req
    );
  }

  // 👈 3. Scoped child logger for checkout lifecycle
  const log = logger.child({
    requestId,
    idempotencyKey,
    endpoint: "/api/checkout",
  });

  try {
    const user = await getUser(req);
    log.info({ userId: user.id }, "Checkout process started");

    const existingEntry = await prisma.idempotencyKey.findUnique({
      where: { key: idempotencyKey },
    });

    if (existingEntry?.status === "COMPLETED") {
      log.info("Idempotency match: Returning cached completed response");
      return NextResponse.json(existingEntry.response, {
        status: 200,
        headers: { "x-request-id": requestId },
      });
    }

    if (existingEntry?.status === "PENDING") {
      const twoMinutesAgo = new Date(Date.now() - 2 * 60_000);
      if (existingEntry.updatedAt > twoMinutesAgo) {
        log.warn("Concurrent request detected with active PENDING idempotency key");
        throw new ConflictError("Request is already being processed");
      }
    }

    await prisma.idempotencyKey.upsert({
      where: { key: idempotencyKey },
      update: { status: "PENDING" },
      create: { key: idempotencyKey, status: "PENDING" },
    });

    const body = await req.json();
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

    let subtotal = new Prisma.Decimal(0);
    const orderItemsData = cart.items.map((item) => {
      if (item.listing.status !== "AVAILABLE") {
        throw new AppError(
          `Item "${item.listing.name}" is no longer available`,
          400
        );
      }
      const lineItemTotal = item.listing.price.mul(item.quantity);
      subtotal = subtotal.plus(lineItemTotal);
      return {
        listingId: item.listing.id,
        sellerId: item.listing.sellerId,
        listingName: item.listing.name,
        unitPrice: item.listing.price,
        quantity: item.quantity,
      };
    });

    const deliveryFee = new Prisma.Decimal(500);
    const platformCommission = subtotal.mul(new Prisma.Decimal("0.015"));
    const totalAmount = subtotal.plus(deliveryFee);
    const listingIds = orderItemsData.map((i) => i.listingId);

    // 👈 4. Atomic database mutation (order + items + payment + stock hold + cart purge)
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

    log.info(
      {
        orderId: newOrder.id,
        paymentId: newOrder.payment?.id,
        itemCount: orderItemsData.length,
        totalAmount: totalAmount.toString(),
      },
      "Order created and stock marked SOLD successfully in transaction"
    );

    // 👈 5. Paystack initialization (external HTTP boundary outside DB transaction)
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    const amountInKobo = Math.round(totalAmount.mul(100).toNumber());

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
          amount: amountInKobo,
          reference: newOrder.payment?.id,
          callback_url: `${baseUrl}/payment/success`,
          metadata: {
            orderId: newOrder.id,
            paymentId: newOrder.payment?.id,
          },
        }),
      }
    );

    const paystackData = await paystackRes.json();

    if (!paystackRes.ok || !paystackData.status) {
      log.warn(
        {
          orderId: newOrder.id,
          paymentId: newOrder.payment?.id,
          paystackError: paystackData,
        },
        "Order created but Paystack initialization failed"
      );

      return NextResponse.json(
        {
          ok: false,
          message: "Order created, but payment initialization failed.",
          order: newOrder,
          error:
            paystackData?.message ??
            "Failed to initialize payment with Paystack",
        },
        {
          status: 207,
          headers: { "x-request-id": requestId },
        }
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

    log.info(
      { orderId: newOrder.id, paymentId: newOrder.payment?.id },
      "Checkout completed and idempotency state marked COMPLETED"
    );

    return NextResponse.json(finalResponse, {
      status: 200,
      headers: { "x-request-id": requestId },
    });
  } catch (error) {
    // 👈 6. Pass req to error handler for uniform trace and status logging
    return handleRouteError(error, req);
  }
}