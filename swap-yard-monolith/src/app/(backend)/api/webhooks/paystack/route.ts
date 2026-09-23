import { NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { handleRouteError, UnauthorizedError, AppError } from "@/lib/errors";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get("x-paystack-signature");
    const secretKey = process.env.PAYSTACK_SECRET_KEY;

    if (!secretKey) {
      console.error("[Paystack Webhook] PAYSTACK_SECRET_KEY is not defined");
      throw new AppError("Internal configuration error", 500);
    }

    const expectedSignature = crypto
      .createHmac("sha512", secretKey)
      .update(rawBody)
      .digest("hex");

    if (!signature || signature !== expectedSignature) {
      throw new UnauthorizedError("Invalid webhook signature");
    }

    let event: any;
    try {
      event = JSON.parse(rawBody);
    } catch {
      throw new AppError("Invalid webhook payload format", 400);
    }

    // Always return 200 for non-charge events or malformed payload metadata
    // to prevent Paystack from aggressively hammering retries on unsupported hooks.
    if (event.event !== "charge.success") {
      return NextResponse.json({ ok: true, received: true }, { status: 200 });
    }

    const { reference, amount, metadata } = event.data ?? {};
    const paymentId = metadata?.paymentId;
    const orderId = metadata?.orderId;

    if (!paymentId || !orderId) {
      console.error("[Paystack Webhook] Missing metadata on event:", event.data);
      return NextResponse.json({ ok: true, received: true }, { status: 200 });
    }

    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      select: { id: true, amount: true, status: true },
    });

    if (!payment) {
      console.error("[Paystack Webhook] Payment not found:", paymentId);
      return NextResponse.json({ ok: true, received: true }, { status: 200 });
    }

    // Idempotency check: Ignore duplicate delivery or orders processed via client verification
    if (payment.status === "SUCCESS") {
      return NextResponse.json({ ok: true, received: true }, { status: 200 });
    }

    const expectedKobo = Math.round(payment.amount * 100);
    if (amount !== expectedKobo) {
      console.error("[Paystack Webhook] Amount mismatch", {
        expectedKobo,
        received: amount,
        paymentId,
      });
      return NextResponse.json({ ok: true, received: true }, { status: 200 });
    }

    await prisma.$transaction([
      prisma.payment.update({
        where: {
          id: paymentId,
          status: { not: "SUCCESS" },
        },
        data: {
          status: "SUCCESS",
          providerRef: reference,
          paidAt: new Date(),
        },
      }),
      prisma.order.update({
        where: { id: orderId },
        data: { status: "PAID" },
      }),
    ]);

    return NextResponse.json({ ok: true, received: true }, { status: 200 });
  } catch (error) {
    return handleRouteError(error);
  }
}