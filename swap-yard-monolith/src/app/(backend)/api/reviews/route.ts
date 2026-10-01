import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/token";
import { createReviewSchema, getReviewsSchema } from "./schema";
import {
  handleRouteError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  AppError,
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

async function getAuthBuyer(req: Request) {
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
  if (user.role !== "BUYER") {
    throw new ForbiddenError("Only buyers are permitted to create reviews");
  }

  return user;
}

export async function POST(req: Request) {
  try {
    const user = await getAuthBuyer(req);

    const body = await req.json();
    const rawInput = {
      rating: body?.rating,
      comment: body?.comment ? String(body.comment).trim() : null,
      sellerId: String(body?.sellerId || "").trim(),
    };

    const { rating, comment, sellerId } = createReviewSchema.parse(rawInput);

    if (sellerId === user.id) {
      throw new AppError("You cannot review yourself", 400);
    }

    const seller = await prisma.user.findUnique({
      where: { id: sellerId },
      select: { id: true, role: true },
    });

    if (!seller) {
      throw new NotFoundError("Seller not found");
    }

    if (seller.role !== "SELLER") {
      throw new AppError("Target user is not a registered seller", 400);
    }

    const review = await prisma.review.create({
      data: {
        rating,
        comment,
        buyerId: user.id,
        sellerId,
      },
      include: {
        buyer: { select: { id: true, firstname: true, lastname: true } },
        seller: { select: { id: true, firstname: true, lastname: true } },
      },
    });

    return NextResponse.json(
      {
        ok: true,
        message: "Review created successfully",
        review,
      },
      { status: 201 }
    );
  } catch (err) {
    return handleRouteError(err);
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    const rawQuery = {
      sellerId: searchParams.get("sellerId") ?? undefined,
      buyerId: searchParams.get("buyerId") ?? undefined,
      page: searchParams.get("page") ?? undefined,
      limit: searchParams.get("limit") ?? undefined,
    };

    // Validates query parameters -> throws ZodError mapped to 400 Bad Request
    const { sellerId, buyerId, page, limit } = getReviewsSchema.parse(rawQuery);

    const skip = (page - 1) * limit;

    const where: Prisma.ReviewWhereInput = {
      ...(sellerId && { sellerId }),
      ...(buyerId && { buyerId }),
    };

    const [items, total] = await Promise.all([
      prisma.review.findMany({
        where,
        include: {
          buyer: { select: { id: true, firstname: true, lastname: true } },
          seller: { select: { id: true, firstname: true, lastname: true } },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.review.count({ where }),
    ]);

    return NextResponse.json(
      {
        ok: true,
        items: items ?? [],
        meta: {
          total,
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