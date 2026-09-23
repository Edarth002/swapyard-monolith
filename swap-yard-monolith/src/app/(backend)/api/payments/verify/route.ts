import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { handleRouteError, AppError } from "@/lib/errors";

export const runtime = "nodejs";

const verifyPaymentQuerySchema = z.object({
  reference: z.string().trim().min(1, "Reference is required"),
});

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    const { reference } = verifyPaymentQuerySchema.parse({
      reference: searchParams.get("reference"),
    });

    const paystackRes = await fetch(
      `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
      {
        headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}` },
      }
    );

    const paystackData = await paystackRes.json();

    if (!paystackRes.ok || !paystackData.status) {
      throw new AppError(
        paystackData?.message ?? "Payment verification failed with provider",
        paystackRes.status || 502
      );
    }

    const { status, amount, metadata } = paystackData.data ?? {};
    const paymentId = metadata?.paymentId;
    const orderId = metadata?.orderId;

    if (status !== "success") {
      return NextResponse.json(
        {
          ok: true,
          status,
          verified: false,
          orderId: orderId ?? null,
        },
        { status: 200 }
      );
    }

    // Best-effort local update for immediate frontend redirect responsiveness
    if (paymentId && orderId) {
      const payment = await prisma.payment.findUnique({
        where: { id: paymentId },
        select: { id: true, amount: true, status: true },
      });

      if (payment && payment.status !== "SUCCESS") {
        const expectedKobo = Math.round(payment.amount * 100);

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
        } else {
          console.error("[Payments verify] Amount mismatch", {
            expectedKobo,
            received: amount,
            paymentId,
          });
        }
      }
    }

    return NextResponse.json(
      {
        ok: true,
        status,
        verified: true,
        orderId: orderId ?? null,
      },
      { status: 200 }
    );
  } catch (error) {
    return handleRouteError(error);
  }
}