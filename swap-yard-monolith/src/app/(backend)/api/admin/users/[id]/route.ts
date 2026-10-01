import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/token";
import {
  handleRouteError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
} from "@/lib/errors";
import { z } from "zod";

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

export async function GET(
  req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    

    const { id } = z.object({ id: z.string().trim().cuid() }).parse(await ctx.params);
    
    await getAuthenticatedAdmin(req);

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        firstname: true,
        lastname: true,
        username: true,
        email: true,
        role: true,
        state: true,
        address: true,
        deliveryAddress: true,
        phoneNumber: true,
        dateOfBirth: true,
        emailVerified: true,
        image: true,
        contract: true,
        bio: true,
        createdAt: true,
        updatedAt: true,
        verification: true,
        sellerAccount: {
          select: {
            id: true,
            bankName: true,
            accountName: true,
            accountNumber: true,
            accountType: true,
            isVerified: true,
          },
        },
        _count: {
          select: {
            listings: true,
            receivedReviews: true,
            givenReviews: true,
            buyerOrders: true,
            reports: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundError("User not found");
    }

    return NextResponse.json({ ok: true, user }, { status: 200 });
  } catch (error) {
    return handleRouteError(error);
  }
}