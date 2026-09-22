import { NextResponse } from "next/server";
import { createRemoteJWKSet, jwtVerify } from "jose";
import { prisma } from "@/lib/prisma";
import { createToken } from "@/lib/token";
import { googleAuthSchema, googleClientIdSchema } from "../../schema";
import {
  handleRouteError,
  UnauthorizedError,
  AppError,
} from "@/lib/errors";

export const runtime = "nodejs";

const googleJWKs = createRemoteJWKSet(
  new URL("https://www.googleapis.com/oauth2/v3/certs")
);

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // Throws ZodError directly -> automatically mapped to 400 Bad Request
    const { idToken } = googleAuthSchema.parse(body);

    const validatedEnv = googleClientIdSchema.safeParse({
      GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
    });

    if (!validatedEnv.success) {
      console.error(
        "Google env configuration error:",
        validatedEnv.error.flatten()
      );
      throw new AppError("Google OAuth configuration missing or invalid", 500);
    }

    const { GOOGLE_CLIENT_ID } = validatedEnv.data;

    let payload: Awaited<ReturnType<typeof jwtVerify>>["payload"];
    try {
      const verified = await jwtVerify(idToken, googleJWKs, {
        issuer: ["https://accounts.google.com", "accounts.google.com"],
        audience: GOOGLE_CLIENT_ID,
      });
      payload = verified.payload;
    } catch {
      throw new UnauthorizedError("Invalid or expired Google token");
    }

    const email = payload?.email;
    const emailVerified = payload?.email_verified;

    if (typeof email !== "string" || !email) {
      throw new AppError("Google token did not contain an email address", 400);
    }

    if (emailVerified !== true) {
      throw new UnauthorizedError("Google email address is not verified");
    }

    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        firstname: true,
        lastname: true,
        phoneNumber: true,
        role: true,
        state: true,
        contract: true,
      },
    });

    if (!user) {
      throw new UnauthorizedError(
        "No account found associated with this Google email. Please sign up first."
      );
    }

    const sessionToken = await createToken(user.id, user.role);

    const res = NextResponse.json(
      {
        ok: true,
        message: "Login successful",
        user,
      },
      { status: 200 }
    );

    res.cookies.set("session", sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: 7 * 24 * 60 * 60,
    });

    return res;
  } catch (err) {
    return handleRouteError(err);
  }
}