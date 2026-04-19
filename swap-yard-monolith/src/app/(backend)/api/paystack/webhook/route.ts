import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

export async function POST(req: Request) {

    try{
        const body = await req.text();

        const hashedPayload = crypto.createHmac("sha512", process.env.PAYSTACK_SECRET_KEY!).update(body).digest("hex");

        const signature = req.headers.get("x-paystack-signature") || "";

        if(hashedPayload !== signature) {
            return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
        }

        const event = JSON.parse(body);

        if(event.event === "charge.success") {
            return NextResponse.json({received: true}, { status: 200 });
        }

        const reference = event.data.reference;

        const verifyResponse = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
            method: "GET",
            headers: {
                Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`
            }
        });
        const verifyData = await verifyResponse.json();

        if(!verifyData.status || verifyData.data.status !== "success") {
            return NextResponse.json({ error: "Payment verification failed" }, { status: 400 });
        }


        const payment = await prisma.payment.findUnique({
        where: { providerRef: reference },
        });

        if (!payment) {
            return NextResponse.json({ error: "Payment record not found" }, { status: 404 });
        }

        if (payment.status === "SUCCESS") {
            return NextResponse.json({ message: "Payment already processed" }, { status: 200 });
        }

        if (payment.amount !== verifyData.data.amount / 100) {
            return NextResponse.json({ error: "Paid more than or less than required amount" }, { status: 400 });
        }
            
        if (payment.status === "PENDING") {

            const order = await prisma.$transaction (async (tx) => {
                await tx.payment.update({
                    where: { id: payment.id },
                    data: { 
                        status: "SUCCESS",
                        paidAt: new Date(),
                    },
                });

                const updatedOrder = await tx.order.update({
                    where: { id: payment.orderId },
                    data: { status: "PAID" },
                });

                return updatedOrder;

            });

            return NextResponse.json({ message: "Payment processed successfully", order }, { status: 200 });

        }
        }

    catch (error) {
        console.error("Error processing Paystack webhook:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
