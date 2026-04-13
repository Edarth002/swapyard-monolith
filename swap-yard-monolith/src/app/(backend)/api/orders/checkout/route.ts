import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/token";
import { checkoutSchema } from "../schema";

export const runtime = "nodejs";

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
  if (!token) return null;

  const payload = await verifyToken(token);
  const userId = typeof payload === "string" ? payload : payload?.userId;

  if (!userId) return null;

  return prisma.user.findUnique({
    where: { id: userId, role: "BUYER" },
  });
}

export async function POST(req: Request) {
  const idempotencyKey = req.headers.get("Idempotency-Key");
  if (!idempotencyKey) {
    return NextResponse.json(
      { message: "Idempotency-Key header is required" },
      { status: 400 }
    );
  }

  try {
    const user = await getUser(req);

    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const existingEntry = await prisma.idempotencyKey.findUnique({
      where: { key: idempotencyKey },
    });

    if (existingEntry?.status === "COMPLETED") {
      return NextResponse.json(existingEntry.response, { status: 200 });
    }

    if (existingEntry?.status === "PENDING") {
      const twoMinutesAgo = new Date(Date.now() - 2 * 60000);
      if (existingEntry.updatedAt > twoMinutesAgo) {
        return NextResponse.json({ message: "Request is already being processed" }, { status: 409 });
      }
    }

    const body = await req.json();
    const parsed = checkoutSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          message: "Invalid input",
          errors: parsed.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { pickupLocation, pickupNote } = parsed.data;

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
      return NextResponse.json(
        { message: "Cart is empty" },
        { status: 400 }
      );
    }

    let subtotal = 0;
    const orderItemsData = cart.items.map((item) => {
      const listing = item.listing;
      if (listing.status !== "AVAILABLE") {
        throw new Error(`Item ${listing.name} is no longer available`);
      }
      subtotal += listing.price * item.quantity;
      return {
        listingId: listing.id,
        sellerId: listing.sellerId,
        listingName: listing.name,
        unitPrice: listing.price,
        quantity: item.quantity,
      };
    });

    const deliveryFee = 0;
    const platformCommission = subtotal * 0.015; 
    const totalAmount = subtotal + deliveryFee;

    const order = await prisma.$transaction(async (tx) => {
       if (!cart || cart.items.length === 0) {
      throw new Error("Cart is empty");
    }

      await tx.idempotencyKey.upsert({
        where: { key: idempotencyKey },
        update: { status: "PENDING" },
        create: { key: idempotencyKey, status: "PENDING" },
      });

      const newOrder = await tx.order.create({
        data: {
          buyerId: user.id,
          pickupLocation,
          pickupNote,
          subtotal,
          deliveryFee,
          platformCommission,
          totalAmount,
          items: {
            create: orderItemsData,
          },
          payment: {
            create: {
              buyerId: user.id,
              amount: totalAmount,
              status: "PENDING",
              provider: "PAYSTACK",
            },
          },
        },
        include: {
          payment: true,
        },
      });

      //Mark listings as sold to prevent overselling - this is done within the transaction to ensure atomicity and data integrity. The safety lock on the update ensures that only listings that are still available will be marked as sold, preventing race conditions
      const listingIds = orderItemsData.map(item => item.listingId);

      await tx.listing.updateMany({
        where: { 
          id: { in: listingIds },
          status: "AVAILABLE"
        },
        data: { status: "SOLD" },
      });

      await tx.cartItem.deleteMany({
        where: { cartId: cart.id },
      });

      const responseData = { message: "Order created", order: newOrder };
      
      await tx.idempotencyKey.update({
        where: { key: idempotencyKey },
        data: {
          status: "COMPLETED",
          response: responseData,
        },
      });

      return responseData;
    });

    // Initialize payment with Paystack not implemented in transaction to avoid long-running transactions and potential timeouts and also because it involves external API calls which should be handled separately from database operations. Also, developer paystack acct is nonexistent
    const paystackRes = await fetch(
      "https://api.api.paystack.co/transaction/initialize",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: user.email,
          amount: Math.round(totalAmount * 100),
          reference: order.order.payment?.id,
          callback_url: `${process.env.NEXT_PUBLIC_APP_URL}/payment/success`,
        }),
      }
    );

    const paystackData = await paystackRes.json();

    if (!paystackData.status) {
      return NextResponse.json(
        { message: "Payment initialization failed" },
        { status: 400 }
      );
    }

   const finalResponse = {
      message: "Order created",
      paymentUrl: paystackData.data.authorization_url,
      order: order.order, 
    };

    await prisma.idempotencyKey.update({
      where: { key: idempotencyKey },
      data: { response: finalResponse as any },
    });

    return NextResponse.json(finalResponse, { status: 200 });
  } catch (error: any) {

    if (error.message === "Cart is empty") {
      return NextResponse.json({ message: "Cart is empty" }, { status: 400 });
    }
    console.error("CHECKOUT ERROR:", error);
    return NextResponse.json(
      { message: error.message || "Server error" },
      { status: 500 }
    );
  }
}