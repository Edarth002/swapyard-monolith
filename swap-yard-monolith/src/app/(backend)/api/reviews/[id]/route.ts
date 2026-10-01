import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/token";
import { z } from "zod";
import {
  handleRouteError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  AppError,
} from "@/lib/errors";

export const runtime = "nodejs";

const idParamSchema = z.object({
  id: z.string().trim().cuid({ message: "Invalid review ID format" }),
});

const updateReviewSchema = z
  .object({
    rating: z.coerce.number().int().min(1).max(5).optional(),
    comment: z
      .string()
      .trim()
      .nullable()
      .transform((val) => (val === "" ? null : val))
      .optional(),
  })
  .strict()
  .refine(
    (data) => data.rating !== undefined || data.comment !== undefined,
    {
      message: "At least one of 'rating' or 'comment' must be provided",
    }
  );

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
    throw new ForbiddenError("Only buyers are authorized for this action");
  }

  return user;
}

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = idParamSchema.parse(await ctx.params);

    const review = await prisma.review.findUnique({
      where: { id },
      include: {
        buyer: { select: { id: true, firstname: true, lastname: true } },
        seller: { select: { id: true, firstname: true, lastname: true } },
      },
    });

    if (!review) {
      throw new NotFoundError("Review not found");
    }

    return NextResponse.json({ ok: true, review }, { status: 200 });
  } catch (err) {
    return handleRouteError(err);
  }
}

export async function PUT(
  req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = idParamSchema.parse(await ctx.params);
    const body = await req.json();
    const validatedData = updateReviewSchema.parse(body);

    const user = await getAuthBuyer(req);

    const existing = await prisma.review.findUnique({
      where: { id },
      select: { id: true, buyerId: true },
    });

    if (!existing) {
      throw new NotFoundError("Review not found");
    }

    if (existing.buyerId !== user.id) {
      throw new ForbiddenError("You do not have permission to edit this review");
    }

    const review = await prisma.review.update({
      where: { id },
      data: validatedData,
      include: {
        buyer: { select: { id: true, firstname: true, lastname: true } },
        seller: { select: { id: true, firstname: true, lastname: true } },
      },
    });

    return NextResponse.json(
      {
        ok: true,
        message: "Review updated successfully",
        review,
      },
      { status: 200 }
    );
  } catch (err) {
    return handleRouteError(err);
  }
}

export async function DELETE(
  req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = idParamSchema.parse(await ctx.params);

    const user = await getAuthBuyer(req);

    const existing = await prisma.review.findUnique({
      where: { id },
      select: { id: true, buyerId: true },
    });

    if (!existing) {
      throw new NotFoundError("Review not found");
    }

    if (existing.buyerId !== user.id) {
      throw new ForbiddenError("You do not have permission to delete this review");
    }

    await prisma.review.delete({ where: { id } });

    return NextResponse.json(
      {
        ok: true,
        message: "Review deleted successfully",
      },
      { status: 200 }
    );
  } catch (err) {
    return handleRouteError(err);
  }
}