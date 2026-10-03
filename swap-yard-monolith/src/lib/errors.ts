import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { Prisma } from "@prisma/client";
import { logger } from "@/lib/logger"; //

export class AppError extends Error {
  constructor(
    public override message: string,
    public statusCode: number = 400,
    public code?: string
  ) {
    super(message);
    this.name = "AppError";
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = "Authentication required") {
    super(message, 401, "UNAUTHORIZED");
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "You do not have permission to perform this action") {
    super(message, 403, "FORBIDDEN");
  }
}

export class NotFoundError extends AppError {
  constructor(message = "Requested resource not found") {
    super(message, 404, "NOT_FOUND");
  }
}

export class ConflictError extends AppError {
  constructor(message = "A resource conflict occurred") {
    super(message, 409, "CONFLICT");
  }
}

export function handleRouteError(error: unknown, req?: Request) {
  const isProduction = process.env.NODE_ENV === "production";

  const requestId =
    req?.headers.get("x-request-id") ||
    (typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID()
      : `req_${Date.now()}`);

  const method = req?.method;
  const path = req?.url ? new URL(req.url).pathname : undefined;

  const responseHeaders = {
    "x-request-id": requestId,
  };

  const logContext = {
    requestId,
    method,
    path,
  };

  if (error instanceof ZodError) {
    const fieldErrors = error.flatten().fieldErrors;

    logger.warn(
      {
        ...logContext,
        statusCode: 400,
        errors: fieldErrors,
      },
      "Request validation failed"
    );

    return NextResponse.json(
      {
        ok: false,
        message: "Invalid input or parameters",
        errors: fieldErrors,
      },
      { status: 400, headers: responseHeaders }
    );
  }

  if (error instanceof AppError) {
    logger.warn(
      {
        ...logContext,
        statusCode: error.statusCode,
        code: error.code,
        message: error.message,
      },
      `Operational AppError: ${error.message}`
    );

    return NextResponse.json(
      {
        ok: false,
        message: error.message,
        ...(error.code ? { code: error.code } : {}),
      },
      { status: error.statusCode, headers: responseHeaders }
    );
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    // P2002: Unique constraint violation (duplicate email, duplicate slug) -> 409 Conflict
    if (error.code === "P2002") {
      let target = "resource";
      if (Array.isArray(error.meta?.target)) {
        target = error.meta.target.join(", ");
      } else if (typeof error.meta?.target === "string") {
        target = error.meta.target.replace(/.*_([^_]+)_(?:key|unique)$/i, "$1");
      }

      logger.warn(
        {
          ...logContext,
          statusCode: 409,
          code: "DUPLICATE_ENTRY",
          target,
        },
        `Database unique constraint collision on ${target}`
      );

      return NextResponse.json(
        {
          ok: false,
          message: `A record with this ${target} already exists.`,
          code: "DUPLICATE_ENTRY",
        },
        { status: 409, headers: responseHeaders }
      );
    }

    // P2025: Record to update/delete not found -> 404 Not Found
    if (error.code === "P2025") {
      logger.warn(
        { ...logContext, statusCode: 404, code: "NOT_FOUND" },
        "Database record to mutate was not found"
      );

      return NextResponse.json(
        {
          ok: false,
          message: "The requested resource was not found.",
          code: "NOT_FOUND",
        },
        { status: 404, headers: responseHeaders }
      );
    }

    // P2003: Foreign key constraint failure -> 400 Bad Request
    if (error.code === "P2003") {
      logger.warn(
        { ...logContext, statusCode: 400, code: "FOREIGN_KEY_VIOLATION" },
        "Database foreign key violation"
      );

      return NextResponse.json(
        {
          ok: false,
          message: "Referenced parent entity does not exist.",
          code: "FOREIGN_KEY_VIOLATION",
        },
        { status: 400, headers: responseHeaders }
      );
    }
  }

  // Logged at 'error' level with full stack trace for observability
  logger.error(
    {
      ...logContext,
      statusCode: 500,
      err:
        error instanceof Error
          ? {
              message: error.message,
              stack: error.stack,
            }
          : error,
    },
    "Unhandled 500 route error"
  );

  return NextResponse.json(
    {
      ok: false,
      message: "An unexpected error occurred. Please try again later.",
      // Information Leakage Prevention: stack & internal error strings only show in dev
      ...(!isProduction && error instanceof Error
        ? { debug: error.message, stack: error.stack }
        : {}),
    },
    { status: 500, headers: responseHeaders }
  );
}