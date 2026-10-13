import { NextResponse } from "next/server";
import type { OrderStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/token";
import { updateOrderSchema } from "../schema";
import {
  handleRouteError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ConflictError,
  AppError,
} from "@/lib/errors";
import { z } from "zod";
import {
  notify,
  NotificationType,
  shortOrderId,
  type NotificationInput,
  type NotificationTypeValue,
} from "@/lib/notification";

export const runtime = "nodejs";

const idParamSchema = z.object({
  id: z.string().trim().cuid({ message: "Invalid order ID format" }),
});

interface StatusNotificationTemplate {
  type: NotificationTypeValue;
  buyerMessage: (ref: string) => string;
  sellerMessage: (ref: string) => string;
}

const STATUS_NOTIFICATIONS: Partial<Record<OrderStatus, StatusNotificationTemplate>> = {
  SHIPPED: {
    type: NotificationType.ORDER_SHIPPED,
    buyerMessage: (ref) => `Your order ${ref} has been shipped.`,
    sellerMessage: (ref) => `Order ${ref} has been marked as shipped.`,
  },
  DELIVERED: {
    type: NotificationType.ORDER_DELIVERED,
    buyerMessage: (ref) =>
      `Your order ${ref} has been marked as delivered. Please confirm receipt.`,
    sellerMessage: (ref) => `Order ${ref} has been marked as delivered.`,
  },
  COMPLETED: {
    type: NotificationType.ORDER_COMPLETED,
    buyerMessage: (ref) => `Your order ${ref} is complete.`,
    sellerMessage: (ref) => `Order ${ref} has been marked as completed.`,
  },
  CANCELLED: {
    type: NotificationType.ORDER_CANCELLED,
    buyerMessage: (ref) => `Your order ${ref} has been cancelled.`,
    sellerMessage: (ref) => `Order ${ref} has been cancelled.`,
  },
};

function buildStatusNotifications(params: {
  orderId: string;
  buyerId: string;
  sellerIds: string[];
  previousStatus: OrderStatus;
  newStatus: OrderStatus;
  actorId: string;
}): NotificationInput[] {
  const template = STATUS_NOTIFICATIONS[params.newStatus];
  if (!template) return [];

  const ref = shortOrderId(params.orderId);
  const sellersKnowOfOrder = params.previousStatus !== "PENDING_PAYMENT";

  const recipients: NotificationInput[] = [
    {
      userId: params.buyerId,
      type: template.type,
      message: template.buyerMessage(ref),
    },
  ];

  if (sellersKnowOfOrder) {
    for (const sellerId of params.sellerIds) {
      recipients.push({
        userId: sellerId,
        type: template.type,
        message: template.sellerMessage(ref),
      });
    }
  }

  return recipients.filter((n) => n.userId !== params.actorId);
}

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

async function getAuthenticatedUser(req: Request) {
  const token = await getCookie(req, "session");
  if (!token) throw new UnauthorizedError("Authentication required");

  const payload = await verifyToken(token);
  const userId = typeof payload === "string" ? payload : payload?.userId;
  if (!userId) throw new UnauthorizedError("Invalid or expired session token");

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, role: true },
  });

  if (!user) throw new UnauthorizedError("User account not found");

  return user;
}

export async function GET(
  req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthenticatedUser(req);
    const { id } = idParamSchema.parse(await ctx.params);

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        buyer: {
          select: { id: true, firstname: true, lastname: true, email: true },
        },
        items: {
          include: {
            listing: { select: { id: true, name: true, price: true } },
            seller: {
              select: { id: true, firstname: true, lastname: true, email: true },
            },
          },
        },
        payment: true,
        ...(user.role === "ADMIN" ? { payouts: true } : {}),
      },
    });

    if (!order) {
      throw new NotFoundError("Order not found");
    }

    const isBuyer = order.buyerId === user.id;
    const isSeller = order.items.some((item) => item.sellerId === user.id);

    if (user.role !== "ADMIN" && !isBuyer && !isSeller) {
      throw new ForbiddenError("You do not have access to view this order");
    }

    return NextResponse.json(
      {
        ok: true,
        order: {
          ...order,
          items: order.items ?? [],
        },
      },
      { status: 200 }
    );
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthenticatedUser(req);
    const { id } = idParamSchema.parse(await ctx.params);
    const { status: newStatus } = updateOrderSchema.parse(await req.json());

    const existingOrder = await prisma.order.findFirst({
      where: {
        id,
        ...(user.role === "ADMIN"
          ? {}
          : {
              OR: [
                { buyerId: user.id },
                { items: { some: { sellerId: user.id } } },
              ],
            }),
      },
      include: { items: true },
    });

    if (!existingOrder) {
      throw new NotFoundError("Order not found");
    }

    const isBuyer = existingOrder.buyerId === user.id;
    const isSeller = existingOrder.items.some((item) => item.sellerId === user.id);
    const currentStatus = existingOrder.status;

    if (currentStatus === newStatus) {
      throw new ConflictError(`Order is already ${newStatus}`);
    }

    if (user.role !== "ADMIN") {
      if (newStatus === "SHIPPED") {
        if (!isSeller) throw new ForbiddenError("Only seller can mark order as shipped");
        if (currentStatus !== "PAID") {
          throw new AppError("Order must be paid before it can be shipped", 400);
        }
      }

      if (newStatus === "DELIVERED") {
        if (!isSeller) throw new ForbiddenError("Only seller can mark order as delivered");
        if (currentStatus !== "SHIPPED") {
          throw new AppError("Order must be shipped before it can be marked delivered", 400);
        }
      }

      if (newStatus === "COMPLETED") {
        if (!isBuyer) throw new ForbiddenError("Only buyer can complete order");
        if (currentStatus !== "DELIVERED") {
          throw new AppError("Order must be delivered before completion", 400);
        }
      }

      if (newStatus === "CANCELLED") {
        if (!isBuyer) throw new ForbiddenError("Only buyer can cancel order");
        if (currentStatus !== "PENDING_PAYMENT") {
          throw new AppError("Cannot cancel order after payment", 400);
        }
      }
    }

    const updateData: {
      status: typeof newStatus;
      deliveredAt?: Date;
      completedAt?: Date;
      cancelledAt?: Date;
    } = { status: newStatus };

    if (newStatus === "DELIVERED") updateData.deliveredAt = new Date();
    if (newStatus === "COMPLETED") updateData.completedAt = new Date();
    if (newStatus === "CANCELLED") updateData.cancelledAt = new Date();

    const order = await prisma.$transaction(
      async (tx) => {
        const { count } = await tx.order.updateMany({
          where: { id, status: currentStatus },
          data: updateData,
        });

        if (count === 0) {
          throw new ConflictError(
            "Order status changed while processing. Please refresh and try again."
          );
        }

        if (newStatus === "CANCELLED" || newStatus === "REFUNDED") {
          const listingIds = existingOrder.items.map((item) => item.listingId);

          if (listingIds.length > 0) {
            await tx.listing.updateMany({
              where: { id: { in: listingIds }, status: "SOLD" },
              data: { status: "AVAILABLE" },
            });
          }
        }

        return tx.order.findUniqueOrThrow({
          where: { id },
          include: {
            buyer: {
              select: { id: true, firstname: true, lastname: true, email: true },
            },
            items: {
              include: {
                listing: { select: { id: true, name: true, price: true } },
                seller: {
                  select: { id: true, firstname: true, lastname: true, email: true },
                },
              },
            },
            payment: true,
          },
        });
      },
      { timeout: 10000 }
    );

    await notify(
      buildStatusNotifications({
        orderId: order.id,
        buyerId: order.buyerId,
        sellerIds: [...new Set(order.items.map((item) => item.sellerId))],
        previousStatus: currentStatus,
        newStatus,
        actorId: user.id,
      })
    );

    return NextResponse.json(
      {
        ok: true,
        message: "Order updated successfully",
        order: {
          ...order,
          items: order.items ?? [],
        },
      },
      { status: 200 }
    );
  } catch (error) {
    return handleRouteError(error);
  }
}