import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { Prisma } from "@prisma/client";

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

export function handleRouteError(error: unknown) {
  const isProduction = process.env.NODE_ENV === "production";

  if (error instanceof ZodError) {
    return NextResponse.json(
      {
        ok: false,
        message: "Invalid input or parameters",
        errors: error.flatten().fieldErrors,
      },
      { status: 400 }
    );
  }

  if (error instanceof AppError) {
    return NextResponse.json(
      {
        ok: false,
        message: error.message,
        ...(error.code ? { code: error.code } : {}),
      },
      { status: error.statusCode }
    );
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    // P2002: Unique constraint violation (duplicate email, duplicate slug) -> 409 Conflict
    if (error.code === "P2002") {
      const target = (error.meta?.target as string[])?.join(", ") || "field";
      return NextResponse.json(
        {
          ok: false,
          message: `A record with this ${target} already exists.`,
          code: "DUPLICATE_ENTRY",
        },
        { status: 409 }
      );
    }

    // P2025: Record to update/delete not found -> 404 Not Found
    if (error.code === "P2025") {
      return NextResponse.json(
        {
          ok: false,
          message: "The requested resource was not found.",
          code: "NOT_FOUND",
        },
        { status: 404 }
      );
    }

    // P2003: Foreign key constraint failure -> 400 Bad Request
    if (error.code === "P2003") {
      return NextResponse.json(
        {
          ok: false,
          message: "Referenced parent entity does not exist.",
          code: "FOREIGN_KEY_VIOLATION",
        },
        { status: 400 }
      );
    }
  }

  // Fallback / Unhandled Errors -> 500 Sanitized
  console.error("❌ [Unhandled Route Error]:", error);

  return NextResponse.json(
    {
      ok: false,
      message: "An unexpected error occurred. Please try again later.",
      // Information Leakage Prevention: stack & internal error strings only show in dev
      ...(!isProduction && error instanceof Error
        ? { debug: error.message, stack: error.stack }
        : {}),
    },
    { status: 500 }
  );
}