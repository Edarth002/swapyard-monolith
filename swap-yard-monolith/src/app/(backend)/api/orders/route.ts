import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/token";
import { getOrdersSchema } from "./schema";
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

async function getAuthenticatedUser(req: Request) {
  const token = await getCookie(req, "session");
  if (!token) throw new UnauthorizedError("Authentication required");

  const payload = await verifyToken(token);
  const userId = typeof payload === "string" ? payload : payload?.userId;
  if (!userId) throw new UnauthorizedError("Invalid or expired session token");

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      role: true,
      firstname: true,
      lastname: true,
      email: true,
    },
  });

  if (!user) throw new UnauthorizedError("User account not found");

  return user;
}

export async function GET(req: Request) {
  try {
    const user = await getAuthenticatedUser(req);
    const { searchParams } = new URL(req.url);

    const rawQuery = {
      status: searchParams.get("status") ?? undefined,
      scope: searchParams.get("scope") ?? undefined,
      page: searchParams.get("page") ?? undefined,
      limit: searchParams.get("limit") ?? undefined,
    };

    // Parse query parameters directly: throws ZodError -> 400 Bad Request
    const { status, scope, page, limit } = getOrdersSchema.parse(rawQuery);

    if (scope === "admin" && user.role !== "ADMIN") {
      throw new ForbiddenError("Admin access required for this scope");
    }

    const skip = (page - 1) * limit;

    const where: Prisma.OrderWhereInput = {
      ...(status ? { status } : {}),
      ...(scope === "buyer"
        ? { buyerId: user.id }
        : scope === "seller"
        ? {
            items: {
              some: {
                sellerId: user.id,
              },
            },
          }
        : {}),
    };

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: {
          buyer: {
            select: {
              id: true,
              firstname: true,
              lastname: true,
              email: true,
            },
          },
          items: {
            include: {
              listing: {
                select: {
                  id: true,
                  name: true,
                  price: true,
                  status: true,
                  condition: true,
                  images: {
                    select: {
                      id: true,
                      url: true,
                      publicId: true,
                    },
                  },
                },
              },
              seller: {
                select: {
                  id: true,
                  firstname: true,
                  lastname: true,
                  email: true,
                },
              },
            },
          },
          payment: true,
          // Payouts contain seller bank details; expose only to admins
          ...(user.role === "ADMIN" ? { payouts: true } : {}),
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.order.count({ where }),
    ]);

    return NextResponse.json(
      {
        ok: true,
        items: orders ?? [],
        meta: {
          total,
          page,
          limit,
          pages: Math.ceil(total / limit) || 0,
          scope,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    return handleRouteError(error);
  }
}