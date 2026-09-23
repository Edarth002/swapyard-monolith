import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/token";
import {
  uploadOneImageFile,
  deleteImageByPublicId,
} from "../../utils/cloudinary";
import { z } from "zod";
import {
  handleRouteError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  AppError,
} from "@/lib/errors";

export const runtime = "nodejs";

const createVerificationSchema = z.object({
  fullName: z.string().trim().min(2, "Full name is required"),
  businessName: z.string().trim().min(2, "Business name is required"),
  vatNumber: z.string().trim().optional(),
  nin: z.string().trim().length(11, "NIN must be 11 characters"),
});

const updateVerificationSchema = z.object({
  userId: z.string().trim().min(1, "User ID is required"),
  status: z.enum(["APPROVED", "REJECTED"], {
    message: "Invalid status",
  }),
  reviewNote: z.string().trim().optional(),
});

const listVerificationsSchema = z.object({
  userId: z.string().trim().optional(),
  status: z.enum(["NOT_SUBMITTED", "PENDING", "APPROVED", "REJECTED"]).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

const ALLOWED_FILE_TYPES = ["image/jpeg", "image/png"];

function getCookie(req: Request, name: string): string | null {
  const cookie = req.headers.get("cookie");
  if (!cookie) return null;
  return (
    cookie.split("; ").find((c) => c.startsWith(`${name}=`))?.split("=")[1] ?? null
  );
}

async function getAuthenticatedUser(req: Request) {
  const token = getCookie(req, "session");
  if (!token) throw new UnauthorizedError("Authentication required");

  const payload = await verifyToken(token);
  const userId = typeof payload === "string" ? payload : payload?.userId;
  if (!userId) throw new UnauthorizedError("Invalid or expired session token");

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, role: true },
  });

  if (!user) throw new UnauthorizedError("Invalid or expired session token");

  return user;
}

export async function POST(req: Request) {
  let uploadedLicense: { url: string; public_id: string } | null = null;
  let uploadedIdDoc: { url: string; public_id: string } | null = null;

  try {
    const actor = await getAuthenticatedUser(req);
    // The submitter can only ever create a verification for themselves
    const userId = actor.id;

    const data = await req.formData();
    const fields = Object.fromEntries(data.entries());

    const { fullName, businessName, vatNumber, nin } =
      createVerificationSchema.parse(fields);

    const businessLicenseFile = data.get("businessLicense") as File | null;
    const idDocumentFile = data.get("idDocument") as File | null;

    if (!businessLicenseFile || !idDocumentFile) {
      throw new AppError(
        "Both Business License and ID Document are required",
        400
      );
    }

    if (!ALLOWED_FILE_TYPES.includes(businessLicenseFile.type)) {
      throw new AppError("Business License must be JPG or PNG", 400);
    }

    if (!ALLOWED_FILE_TYPES.includes(idDocumentFile.type)) {
      throw new AppError("ID Document must be JPG or PNG", 400);
    }

    const existing = await prisma.sellerVerification.findUnique({
      where: { userId },
      select: {
        id: true,
        businessLicensePublicId: true,
        idDocumentPublicId: true,
      },
    });

    if (existing) {
      if (existing.businessLicensePublicId) {
        await deleteImageByPublicId(existing.businessLicensePublicId).catch(
          () => null
        );
      }
      if (existing.idDocumentPublicId) {
        await deleteImageByPublicId(existing.idDocumentPublicId).catch(
          () => null
        );
      }

      await prisma.sellerVerification.delete({ where: { userId } });
    }

    uploadedLicense = await uploadOneImageFile(businessLicenseFile, {
      subfolder: "verification",
    });
    uploadedIdDoc = await uploadOneImageFile(idDocumentFile, {
      subfolder: "verification",
    });

    const verification = await prisma.sellerVerification.create({
      data: {
        userId,
        fullName,
        businessName,
        vatNumber,
        nin,
        businessLicenseUrl: uploadedLicense.url,
        businessLicensePublicId: uploadedLicense.public_id,
        idDocumentUrl: uploadedIdDoc.url,
        idDocumentPublicId: uploadedIdDoc.public_id,
        status: "PENDING",
        submittedAt: new Date(),
      },
    });

    return NextResponse.json(
      {
        ok: true,
        message: "Verification submitted successfully",
        verification,
      },
      { status: 201 }
    );
  } catch (err) {
    if (uploadedLicense?.public_id) {
      await deleteImageByPublicId(uploadedLicense.public_id).catch(() => null);
    }
    if (uploadedIdDoc?.public_id) {
      await deleteImageByPublicId(uploadedIdDoc.public_id).catch(() => null);
    }

    return handleRouteError(err);
  }
}

export async function PATCH(req: Request) {
  try {
    const actor = await getAuthenticatedUser(req);

    // Only admins can approve/reject — without this, any authenticated
    // user could PATCH an arbitrary userId and flip their own (or anyone
    // else's) SellerAccount.isVerified to true.
    if (actor.role !== "ADMIN") {
      throw new ForbiddenError("Only admins can review seller verifications");
    }

    const body = await req.json();
    const { userId, status, reviewNote } = updateVerificationSchema.parse(body);

    const existing = await prisma.sellerVerification.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (!existing) {
      throw new NotFoundError("Seller verification not found");
    }

    const updated = await prisma.$transaction(async (tx) => {
      const record = await tx.sellerVerification.update({
        where: { userId },
        data: {
          status,
          reviewNote: reviewNote || undefined,
          reviewedAt: new Date(),
        },
      });

      if (status === "APPROVED") {
        await tx.sellerAccount.updateMany({
          where: { userId },
          data: { isVerified: true },
        });
      } else if (status === "REJECTED") {
        await tx.sellerAccount.updateMany({
          where: { userId },
          data: { isVerified: false },
        });
      }

      return record;
    });

    return NextResponse.json(
      {
        ok: true,
        message: "Verification status updated",
        verification: updated,
      },
      { status: 200 }
    );
  } catch (err) {
    return handleRouteError(err);
  }
}

export async function GET(req: Request) {
  try {
    const actor = await getAuthenticatedUser(req);

    const { searchParams } = new URL(req.url);

    // Non-admins can only ever see their own verification
    if (actor.role !== "ADMIN") {
      const verification = await prisma.sellerVerification.findUnique({
        where: { userId: actor.id },
      });

      if (!verification) {
        throw new NotFoundError("No verification found for this account");
      }

      return NextResponse.json({ ok: true, verification }, { status: 200 });
    }

    const rawUserId = searchParams.get("userId");

    if (rawUserId) {
      const verification = await prisma.sellerVerification.findUnique({
        where: { userId: rawUserId },
        include: {
          user: {
            select: { id: true, firstname: true, lastname: true, email: true },
          },
        },
      });

      if (!verification) {
        throw new NotFoundError("Seller verification not found");
      }

      return NextResponse.json({ ok: true, verification }, { status: 200 });
    }

    const { status, page, limit } = listVerificationsSchema.parse({
      status: searchParams.get("status") ?? undefined,
      page: searchParams.get("page") ?? undefined,
      limit: searchParams.get("limit") ?? undefined,
    });

    const where = status ? { status } : {};
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      prisma.sellerVerification.findMany({
        where,
        include: {
          user: {
            select: { id: true, firstname: true, lastname: true, email: true },
          },
        },
        orderBy: { submittedAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.sellerVerification.count({ where }),
    ]);

    return NextResponse.json(
      {
        ok: true,
        items,
        meta: { total, page, limit, pages: Math.ceil(total / limit) },
      },
      { status: 200 }
    );
  } catch (err) {
    return handleRouteError(err);
  }
}