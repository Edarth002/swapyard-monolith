import { NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { handleRouteError, UnauthorizedError, AppError } from "@/lib/errors";
import { logger } from "@/lib/logger"; // 👈 1. Import structured logger

export const runtime = "nodejs";

export async function POST(req: Request) {
  // 👈 2. Extract or generate Correlation ID for webhook tracking
  const requestId =
    req.headers.get("x-request-id") ||
    (typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID()
      : `wh_${Date.now()}`);

  const log = logger.child({
    requestId,
    endpoint: "/api/webhooks/paystack",
  });

  const responseHeaders = { "x-request-id": requestId };

  try {
    const rawBody = await req.text();
    const signature = req.headers.get("x-paystack-signature");
    const secretKey = process.env.PAYSTACK_SECRET_KEY;

    if (!secretKey) {
      log.error("PAYSTACK_SECRET_KEY is not defined in environment variables");
      throw new AppError("Internal configuration error", 500);
    }

    const expectedSignature = crypto
      .createHmac("sha512", secretKey)
      .update(rawBody)
      .digest("hex");

    // 👈 3. Timing-safe comparison to prevent HMAC timing attacks
    const signatureBuffer = Buffer.from(signature || "", "utf8");
    const expectedBuffer = Buffer.from(expectedSignature, "utf8");
    const isValidSignature =
      signatureBuffer.length === expectedBuffer.length &&
      crypto.timingSafeEqual(signatureBuffer, expectedBuffer);

    if (!signature || !isValidSignature) {
      log.warn("Invalid Paystack webhook signature rejected");
      throw new UnauthorizedError("Invalid webhook signature");
    }

    let event: any;
    try {
      event = JSON.parse(rawBody);
    } catch {
      log.warn("Malformed JSON received in webhook payload");
      throw new AppError("Invalid webhook payload format", 400);
    }

    const eventType = event?.event;
    log.info({ event: eventType }, "Valid Paystack webhook received");

    // Always return 200 for non-charge events to prevent Paystack retries
    if (eventType !== "charge.success") {
      log.info({ event: eventType }, "Ignoring non-charge.success webhook event");
      return NextResponse.json(
        { ok: true, received: true },
        { status: 200, headers: responseHeaders }
      );
    }

    const { reference, amount, metadata } = event.data ?? {};
    const paymentId = metadata?.paymentId;
    const orderId = metadata?.orderId;

    if (!paymentId || !orderId) {
      log.error(
        { eventData: event.data },
        "Paystack webhook missing paymentId or orderId in metadata"
      );
      return NextResponse.json(
        { ok: true, received: true },
        { status: 200, headers: responseHeaders }
      );
    }

    // Attach contextual metadata to all subsequent logs for this transaction
    const txLog = log.child({ reference, paymentId, orderId });

    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      select: { id: true, amount: true, status: true },
    });

    if (!payment) {
      txLog.error("Referenced payment record not found in database");
      return NextResponse.json(
        { ok: true, received: true },
        { status: 200, headers: responseHeaders }
      );
    }

    // Idempotency check: Ignore duplicate delivery or orders processed via client verification
    if (payment.status === "SUCCESS") {
      txLog.info("Payment already in SUCCESS state. Skipping redundant webhook");
      return NextResponse.json(
        { ok: true, received: true },
        { status: 200, headers: responseHeaders }
      );
    }

    const expectedKobo = Math.round(payment.amount.toNumber() * 100);
    if (amount !== expectedKobo) {
      txLog.error(
        {
          event: "PAYMENT_AMOUNT_MISMATCH",
          expectedKobo,
          receivedKobo: amount,
        },
        "Webhook payment amount does not match order record"
      );
      return NextResponse.json(
        { ok: true, received: true },
        { status: 200, headers: responseHeaders }
      );
    }

    // 👈 4. Atomic database state transition
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

    txLog.info(
      { amountKobo: amount },
      "Webhook processed: Order & Payment moved to PAID/SUCCESS atomically"
    );

    return NextResponse.json(
      { ok: true, received: true },
      { status: 200, headers: responseHeaders }
    );
  } catch (error) {
    // 👈 5. Pass req to error handler for uniform trace logging
    return handleRouteError(error, req);
  }
}