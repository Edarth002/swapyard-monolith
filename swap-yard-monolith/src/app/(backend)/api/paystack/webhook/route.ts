import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

export async function POST(req: Request) {
    const body = await req.text();

    const hashedPayload = crypto.createHmac("sha512", process.env.PAYSTACK_SECRET_KEY!).update(body).digest("hex");

    const signature = req.headers.get("x-paystack-signature") || "";

    if(hashedPayload !== signature) {
        return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    const event = JSON.parse(body);

    if(event.event === "charge.success") {

        const reference = event.data.reference;

        const payment = await prisma.payment.findUnique({
            where: { providerRef: reference },
        });

        if (payment) {

            const order = await prisma.$transaction (async (tx) => {
                await tx.payment.update({
                    where: { id: payment.id },
                    data: { status: "SUCCESS" },
                });

                await tx.order.update({
                    where: { id: payment.orderId },
                    data: { status: "PAID" },
                });
           
        }

}
