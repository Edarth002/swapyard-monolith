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
  try {
    const user = await getUser(req);

    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
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
        throw new Error("Some items are no longer available");
      }

      const total = listing.price * item.quantity;
      subtotal += total;

      return {
        listingId: listing.id,
        sellerId: listing.sellerId,
        listingName: listing.name,
        unitPrice: listing.price,
        quantity: item.quantity,
      };
    });

    const deliveryFee = 0;
    const platformCommission = subtotal * 1.5;
    const totalAmount = subtotal + deliveryFee;

    const order = await prisma.order.create({
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

    await prisma.cartItem.deleteMany({
      where: { cartId: cart.id },
    });

    // ✅ PAYSTACK INIT: Pending final stage of application
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
          reference: order.payment?.id,
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

    await prisma.payment.update({
      where: { id: order.payment!.id },
      data: {
        providerRef: paystackData.data.reference,
      },
    });

    return NextResponse.json(
      {
        message: "Order created",
        paymentUrl: paystackData.data.authorization_url,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("CHECKOUT ERROR:", error);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}