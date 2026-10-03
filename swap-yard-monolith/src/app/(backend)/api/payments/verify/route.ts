import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { handleRouteError, AppError } from "@/lib/errors";
import { logger } from "@/lib/logger"; 
export const runtime = "nodejs";

const verifyPaymentQuerySchema = z.object({
  reference: z.string().trim().min(1, "Reference is required"),
});

export async function GET(req: Request) {
  const requestId =
    req.headers.get("x-request-id") ||
    (typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID()
      : `req_${Date.now()}`);

  try {
    const { searchParams } = new URL(req.url);

    const { reference } = verifyPaymentQuerySchema.parse({
      reference: searchParams.get("reference"),
    });

    const log = logger.child({
      requestId,
      reference,
      endpoint: "/api/payments/paystack/verify",
    });

    log.info("Contacting Paystack gateway to verify payment");

    const paystackRes = await fetch(
      `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
      {
        headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}` },
      }
    );

    const paystackData = await paystackRes.json();

    if (!paystackRes.ok || !paystackData.status) {
      log.error(
        {
          statusCode: paystackRes.status,
          paystackData,
        },
        "Paystack verification request rejected"
      );

      throw new AppError(
        paystackData?.message ?? "Payment verification failed with provider",
        paystackRes.status || 502
      );
    }

    const { status, amount, metadata } = paystackData.data ?? {};
    const paymentId = metadata?.paymentId;
    const orderId = metadata?.orderId;

    if (status !== "success") {
      log.warn(
        { gatewayStatus: status, orderId, paymentId },
        "Transaction verified but status is not successful"
      );

      return NextResponse.json(
        {
          ok: true,
          status,
          verified: false,
          orderId: orderId ?? null,
        },
        { status: 200, headers: { "x-request-id": requestId } }
      );
    }

    if (paymentId && orderId) {
      const payment = await prisma.payment.findUnique({
        where: { id: paymentId },
        select: { id: true, amount: true, status: true },
      });

      if (payment && payment.status !== "SUCCESS") {
        const expectedKobo = Math.round(payment.amount.toNumber() * 100);

        if (amount === expectedKobo) {
          await prisma.$transaction([
            prisma.payment.update({
              where: { id: paymentId },
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

          log.info(
            { orderId, paymentId, amountKobo: amount },
            "Order and payment successfully transitioned to PAID/SUCCESS"
          );
        } else {
          log.error(
            {
              event: "PAYMENT_AMOUNT_MISMATCH",
              expectedKobo,
              receivedKobo: amount,
              paymentId,
              orderId,
            },
            "Payment amount mismatch detected during verification"
          );
        }
      } else if (payment?.status === "SUCCESS") {
        log.info(
          { orderId, paymentId },
          "Payment was already transitioned to SUCCESS (idempotent pass)"
        );
      }
    }

    return NextResponse.json(
      {
        ok: true,
        status,
        verified: true,
        orderId: orderId ?? null,
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