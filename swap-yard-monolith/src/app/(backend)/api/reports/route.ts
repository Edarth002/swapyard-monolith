import { NextResponse } from "next/server";
import {
  deleteManyByPublicIds,
  uploadManyImageFiles,
} from "@/app/(backend)/utils/cloudinary";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/token";
import { createReportSchema, getReportsSchema } from "./schema";
import {
  handleRouteError,
  UnauthorizedError,
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

function toNullableString(value: FormDataEntryValue | null) {
  const parsed = String(value || "").trim();
  return parsed ? parsed : null;
}

export async function POST(req: Request) {
  const idempotencyKey = req.headers.get("idempotency-key");
  if (!idempotencyKey) {
    return handleRouteError(
      new AppError("Idempotency-Key header is required", 400)
    );
  }

  let uploaded: Array<{ url: string; public_id: string }> = [];

  try {
    const user = await getAuthenticatedUser(req);

    const existingReport = await prisma.report.findUnique({
      where: { idempotencyKey },
      include: {
        reporter: { select: { id: true, firstname: true, lastname: true } },
        listing: { select: { id: true, name: true, slug: true } },
      },
    });

    if (existingReport) {
      return NextResponse.json(
        {
          ok: true,
          message: "Report already submitted",
          report: existingReport,
        },
        { status: 200 }
      );
    }

    const formData = await req.formData();
    const rawInput = {
      listingId: String(formData.get("listingId") || "").trim(),
      type: String(formData.get("type") || "").trim(),
      reason: String(formData.get("reason") || "").trim(),
      comment: toNullableString(formData.get("comment")),
    };

    const validatedData = createReportSchema.parse(rawInput);

    const listingExists = await prisma.listing.findUnique({
      where: { id: validatedData.listingId },
      select: { id: true },
    });

    if (!listingExists) {
      throw new NotFoundError("Listing not found");
    }

    const images = formData
      .getAll("images")
      .filter((file): file is File => file instanceof File && file.size > 0);

    if (images.length > 2) {
      throw new AppError("A maximum of 2 images is allowed", 400);
    }

    uploaded = images.length
      ? await uploadManyImageFiles(images, { subfolder: "reports" })
      : [];

    const report = await prisma.report.create({
      data: {
        idempotencyKey,
        reporterId: user.id,
        listingId: validatedData.listingId,
        type: validatedData.type,
        reason: validatedData.reason,
        comment: validatedData.comment,
        imageUrl1: uploaded?.[0]?.url ?? null,
        imagePublicId1: uploaded?.[0]?.public_id ?? null,
        imageUrl2: uploaded?.[1]?.url ?? null,
        imagePublicId2: uploaded?.[1]?.public_id ?? null,
      },
      include: {
        reporter: { select: { id: true, firstname: true, lastname: true } },
        listing: { select: { id: true, name: true, slug: true } },
      },
    });

    return NextResponse.json(
      {
        ok: true,
        message: "Report submitted successfully",
        report,
      },
      { status: 201 }
    );
  } catch (err) {
    if (uploaded.length > 0) {
      const publicIds = uploaded.map((img) => img.public_id);
      await deleteManyByPublicIds(publicIds).catch(() => null);
    }
    return handleRouteError(err);
  }
}

export async function GET(req: Request) {
  try {
    const user = await getAuthenticatedUser(req);
    const { searchParams } = new URL(req.url);

    const rawParams = {
      page: searchParams.get("page") ?? undefined,
      limit: searchParams.get("limit") ?? undefined,
      status: searchParams.get("status") ?? undefined,
      type: searchParams.get("type") ?? undefined,
    };

    // Parse query params directly -> auto-mapped to 400 on schema violation
    const { page, limit, status, type } = getReportsSchema.parse(rawParams);
    const skip = (page - 1) * limit;

    const where = {
      ...(user.role !== "ADMIN" && { reporterId: user.id }),
      ...(status && { status }),
      ...(type && { type }),
    };

    const [reports, total] = await Promise.all([
      prisma.report.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        include: {
          reporter: { select: { id: true, firstname: true, lastname: true } },
          listing: { select: { id: true, name: true, slug: true } },
        },
      }),
      prisma.report.count({ where }),
    ]);

    return NextResponse.json(
      {
        ok: true,
        items: reports ?? [],
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