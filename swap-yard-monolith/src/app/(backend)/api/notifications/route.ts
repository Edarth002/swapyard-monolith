import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/token";
import { getNotificationsSchema } from "./schema";
import { handleRouteError, UnauthorizedError } from "@/lib/errors";

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

export async function GET(req: Request) {
  try {
    const token = await getCookie(req, "session");
    if (!token) throw new UnauthorizedError("Authentication required");

    const payload = await verifyToken(token);
    const userId = typeof payload === "string" ? payload : payload?.userId;
    if (!userId) throw new UnauthorizedError("Invalid or expired session token");

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });
    if (!user) throw new UnauthorizedError("User account not found");

    const { searchParams } = new URL(req.url);
    const rawParams = {
      page: searchParams.get("page") ?? undefined,
      limit: searchParams.get("limit") ?? undefined,
      read: searchParams.get("read") ?? undefined,
    };
    
    const { page, limit, read } = getNotificationsSchema.parse(rawParams);
    const skip = (page - 1) * limit;

    const where = {
      userId: user.id,
      ...(read !== undefined && { read }),
    };

    const [notifications, total, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.notification.count({ where }),
      prisma.notification.count({ where: { userId: user.id, read: false } }),
    ]);

    return NextResponse.json(
      {
        ok: true,
        items: notifications ?? [],
        meta: {
          total,
          unreadCount,
          page,
          limit,
          pages: Math.ceil(total / limit) || 0,
        },
      },
      { status: 200 }
    );
  } catch (err) {
    return handleRouteError(err);
  }
}