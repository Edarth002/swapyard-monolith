import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/token";
import { getUserReviewsSchema } from "../../schema";
import {
  handleRouteError,
  UnauthorizedError,
  ForbiddenError,
} from "@/lib/errors";

export const runtime = "nodejs";

const idParamSchema = z.object({
  id: z.string().trim().cuid({ message: "Invalid user ID format" }),
});

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

export async function GET(
  req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = idParamSchema.parse(await ctx.params);

    const { searchParams } = new URL(req.url);
    const { page, limit, type } = getUserReviewsSchema.parse(
      Object.fromEntries(searchParams)
    );

    await getAuthenticatedAdmin(req);

    const skip = (page - 1) * limit;
    const where = type === "received" ? { sellerId: id } : { buyerId: id };

    const [reviews, total] = await Promise.all([
      prisma.review.findMany({
        where,
        select: {
          id: true,
          rating: true,
          comment: true,
          createdAt: true,
          ...(type === "received"
            ? { buyer: { select: { id: true, firstname: true, lastname: true } } }
            : { seller: { select: { id: true, firstname: true, lastname: true } } }),
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
        type,
        items: reviews ?? [],
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