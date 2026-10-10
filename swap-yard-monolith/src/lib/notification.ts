import type { Prisma, PrismaClient } from "@prisma/client";
import { prisma } from "@/lib/prisma";

type DbClient = PrismaClient | Prisma.TransactionClient;

export const NotificationType = {
  ORDER_PAID: "ORDER_PAID",
  ORDER_RECEIVED: "ORDER_RECEIVED",
  ORDER_SHIPPED: "ORDER_SHIPPED",
  ORDER_DELIVERED: "ORDER_DELIVERED",
  ORDER_COMPLETED: "ORDER_COMPLETED",
  ORDER_CANCELLED: "ORDER_CANCELLED",
  VERIFICATION_APPROVED: "VERIFICATION_APPROVED",
  VERIFICATION_REJECTED: "VERIFICATION_REJECTED",
  REPORT_UNDER_REVIEW: "REPORT_UNDER_REVIEW",
  REPORT_RESOLVED: "REPORT_RESOLVED",
  REPORT_REJECTED: "REPORT_REJECTED",
  REPORT_REOPENED: "REPORT_REOPENED",
  LISTING_CREATED: "LISTING_CREATED",
} as const;

export type NotificationTypeValue =
  (typeof NotificationType)[keyof typeof NotificationType];

export interface NotificationInput {
  userId: string;
  type: NotificationTypeValue;
  message: string;
}

export function shortOrderId(orderId: string) {
  return `#${orderId.slice(-8).toUpperCase()}`;
}

export async function createNotification(
  input: NotificationInput,
  client: DbClient = prisma
) {
  return client.notification.create({ data: input });
}

export async function createNotifications(
  inputs: NotificationInput[],
  client: DbClient = prisma
) {
  if (inputs.length === 0) return { count: 0 };
  return client.notification.createMany({ data: inputs });
}

export async function notify(input: NotificationInput | NotificationInput[]) {
  try {
    if (Array.isArray(input)) {
      await createNotifications(input);
    } else {
      await createNotification(input);
    }
  } catch (error) {
    console.error("[notify] Failed to create notification:", error);
  }
}