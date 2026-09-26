import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/token";
import { updateReportStatusSchema } from "../schema";
import {
  handleRouteError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  AppError,
} from "@/lib/errors";
import { z } from "zod";

export const runtime = "nodejs";

const idParamSchema = z.object({
  id: z.string().trim().cuid({ message: "Invalid report ID format" }),
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

const STATUS_NOTIFICATION: Record<
  string,
  { type: string; message: (id: string) => string }
> = {
  UNDER_REVIEW: {
    type: "REPORT_UNDER_REVIEW",
    message: (id) =>
      `Your report (${id}) is now under review. We'll keep you updated.`,
  },
  RESOLVED: {
    type: "REPORT_RESOLVED",
    message: (id) =>
      `Your report (${id}) has been resolved. Thank you for helping keep the platform safe.`,
  },
  REJECTED: {
    type: "REPORT_REJECTED",
    message: (id) =>
      `Your report (${id}) has been reviewed and did not meet our action criteria.`,
  },
  OPEN: {
    type: "REPORT_REOPENED",
    message: (id) => `Your report (${id}) has been re-opened for review.`,
  },
};

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = idParamSchema.parse(await params);

    const user = await getAuthenticatedUser(req);

    const report = await prisma.report.findUnique({
      where: { id },
      include: {
        reporter: { select: { id: true, firstname: true, lastname: true } },
        listing: { select: { id: true, name: true, slug: true } },
      },
    });

    if (!report) {
      throw new NotFoundError("Report not found");
    }

    if (user.role !== "ADMIN" && report.reporterId !== user.id) {
      throw new ForbiddenError("You do not have access to view this report");
    }

    return NextResponse.json({ ok: true, report }, { status: 200 });
  } catch (err) {
    return handleRouteError(err);
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = idParamSchema.parse(await params);
    const body = await req.json();
    const { status } = updateReportStatusSchema.parse(body);

    const user = await getAuthenticatedUser(req);

    if (user.role !== "ADMIN") {
      throw new ForbiddenError("Admin access required to update report status");
    }

    const existingReport = await prisma.report.findUnique({
      where: { id },
      select: { id: true, status: true, reporterId: true },
    });

    if (!existingReport) {
      throw new NotFoundError("Report not found");
    }

    if (existingReport.status === status) {
      throw new AppError(`Report is already ${status}`, 400);
    }

    const notifTemplate = STATUS_NOTIFICATION[status];

    const updated = await prisma.$transaction(
      async (tx) => {
        const report = await tx.report.update({
          where: { id },
          data: { status },
          include: {
            reporter: { select: { id: true, firstname: true, lastname: true } },
            listing: { select: { id: true, name: true, slug: true } },
          },
        });

        if (notifTemplate) {
          await tx.notification.create({
            data: {
              userId: existingReport.reporterId,
              type: notifTemplate.type,
              message: notifTemplate.message(existingReport.id),
            },
          });
        }

        return report;
      },
      { timeout: 10000 }
    );

    return NextResponse.json(
      {
        ok: true,
        message: "Report status updated",
        report: updated,
      },
      { status: 200 }
    );
  } catch (err) {
    return handleRouteError(err);
  }
}