import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/token";
import { getUserSubResourceSchema } from "../../schema";
import {
  handleRouteError,
  UnauthorizedError,
  ForbiddenError,
} from "@/lib/errors";
import { z } from "zod";

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
    const { page, limit } = getUserSubResourceSchema.parse(
      Object.fromEntries(searchParams)
    );

    await getAuthenticatedAdmin(req);

    const skip = (page - 1) * limit;

    const [listings, total] = await Promise.all([
      prisma.listing.findMany({
        where: { sellerId: id },
        select: {
          id: true,
          name: true,
          price: true,
          status: true,
          images: { select: { id: true, url: true } },
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.listing.count({ where: { sellerId: id } }),
    ]);

    return NextResponse.json(
      {
        ok: true,
        items: listings ?? [],
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