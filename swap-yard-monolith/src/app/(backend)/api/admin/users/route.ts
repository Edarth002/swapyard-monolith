import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/token";
import { getUsersSchema } from "./schema";
import {
  handleRouteError,
  UnauthorizedError,
  ForbiddenError,
} from "@/lib/errors";

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

async function getAuthenticatedAdmin(req: Request) {
  const token = await getCookie(req, "session");
  if (!token) throw new UnauthorizedError("Authentication required");

  const payload = await verifyToken(token);
  const userId = typeof payload === "string" ? payload : payload?.userId;
  if (!userId) throw new UnauthorizedError("Invalid or expired session token");

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, role: true },
  });

  if (!user) throw new UnauthorizedError("User does not exist");
  if (user.role !== "ADMIN") throw new ForbiddenError("Admin access required");

  return user;
}

export async function GET(req: Request) {
  try {
    await getAuthenticatedAdmin(req);

    const { searchParams } = new URL(req.url);
    const rawQuery = {
      search: searchParams.get("search") ?? undefined,
      role: searchParams.get("role") ?? undefined,
      page: searchParams.get("page") ?? undefined,
      limit: searchParams.get("limit") ?? undefined,
    };

    // Zod throws ZodError automatically on invalid params -> maps to 400 Bad Request
    const { search, role, page, limit } = getUsersSchema.parse(rawQuery);
    const skip = (page - 1) * limit;

    const where: Prisma.UserWhereInput = {
      ...(role ? { role } : {}),
      ...(search
        ? {
            OR: [
              { firstname: { contains: search } },
              { lastname: { contains: search } },
              { username: { contains: search } },
              { email: { contains: search } },
            ],
          }
        : {}),
    };

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          firstname: true,
          lastname: true,
          username: true,
          email: true,
          role: true,
          image: true,
          emailVerified: true,
          createdAt: true,
          _count: {
            select: {
              listings: true,
              receivedReviews: true,
              buyerOrders: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.user.count({ where }),
    ]);

    return NextResponse.json(
      {
        ok: true,
        items: users ?? [],
        meta: {
          total,
          page,
          limit,
          pages: Math.ceil(total / limit) || 0,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    return handleRouteError(error);
  }
}