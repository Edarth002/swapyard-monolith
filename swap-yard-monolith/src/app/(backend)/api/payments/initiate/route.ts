import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/token";
import { z } from "zod";
import {
  handleRouteError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  AppError,
} from "@/lib/errors";
import { logger } from "@/lib/logger"; //

export const runtime = "nodejs";

const initiatePaymentSchema = z.object({
  orderId: z.string().trim().min(1, "orderId is required"),
});

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
  const requestId =
    req.headers.get("x-request-id") ||
    (typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID()
      : `req_${Date.now()}`);

  try {
    const user = await getUser(req);

    const body = await req.json();
    const { orderId } = initiatePaymentSchema.parse(body);

    const log = logger.child({
      requestId,
      orderId,
      userId: user.id,
      endpoint: "/api/payments/paystack/initiate",
    });

    log.info("Initiating Paystack payment flow");

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { payment: true },
    });

    if (!order) {
      throw new NotFoundError("Order not found");
    }

    if (order.buyerId !== user.id) {
      throw new ForbiddenError("You do not have access to pay for this order");
    }

    if (order.status !== "PENDING_PAYMENT") {
      throw new AppError("This order is not awaiting payment", 400);
    }

    if (!order.payment) {
      throw new AppError("No payment record found for this order", 400);
    }

    const amountInKobo = Math.round(order.totalAmount.toNumber() * 100);

    const reference = await prisma.$transaction(async (tx) => {
      const [locked] = await tx.$queryRaw<{ status: string }[]>`
        SELECT status FROM Payment WHERE id = ${order.payment!.id} FOR UPDATE
      `;

      if (!locked) {
        throw new AppError("No payment record found for this order", 400);
      }

      if (locked.status === "SUCCESS") {
        throw new AppError("This order has already been paid for", 409);
      }

      const ref = `${order.payment!.id}-${Date.now()}`;

      await tx.payment.update({
        where: { id: order.payment!.id },
        data: { providerRef: ref },
      });

      return ref;
    });

    log.info({ reference, amountInKobo }, "Acquired payment lock and generated reference");

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    const paystackRes = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
      },
      body: JSON.stringify({
        email: user.email,
        amount: amountInKobo,
        currency: "NGN",
        reference,
        callback_url: `${baseUrl}/payment/success`,
        metadata: {
          orderId: order.id,
          paymentId: order.payment.id,
        },
      }),
    });

    const paystackData = await paystackRes.json();

    if (!paystackRes.ok || !paystackData.status) {
      log.error(
        {
          statusCode: paystackRes.status,
          paystackError: paystackData,
          reference,
        },
        "Paystack initialization rejected by payment gateway"
      );
      throw new AppError(
        paystackData?.message ?? "Paystack payment initialization failed",
        502
      );
    }

    log.info({ reference }, "Paystack initialization successful");

    return NextResponse.json(
      {
        ok: true,
        authorizationUrl: paystackData.data.authorization_url,
        email: user.email,
        amountInKobo,
        reference,
      },
      {
        status: 200,
        headers: { "x-request-id": requestId },
      }
    );
  } catch (error) {
    return handleRouteError(error, req);
  }
}