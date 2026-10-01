import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createToken } from "@/lib/token";
import { z } from "zod";
import {
  handleRouteError,
  UnauthorizedError,
  AppError,
} from "@/lib/errors";

export const runtime = "nodejs";

const facebookAuthSchema = z.object({
  accessToken: z.string().trim().min(1, "Facebook access token is required"),
});

const facebookEnvSchema = z.object({
  FACEBOOK_APP_ID: z.string().trim().min(5, "Invalid Facebook app ID"),
  FACEBOOK_APP_SECRET: z.string().trim().min(5, "Invalid Facebook app secret"),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // Throws ZodError on bad body -> handleRouteError returns 400 Bad Request
    const { accessToken } = facebookAuthSchema.parse(body);

    const validatedEnv = facebookEnvSchema.safeParse({
      FACEBOOK_APP_ID: process.env.FACEBOOK_APP_ID,
      FACEBOOK_APP_SECRET: process.env.FACEBOOK_APP_SECRET,
    });

    if (!validatedEnv.success) {
      console.error(
        "Facebook env configuration error:",
        validatedEnv.error.flatten()
      );
      throw new AppError("Facebook OAuth configuration missing or invalid", 500);
    }

    const { FACEBOOK_APP_ID, FACEBOOK_APP_SECRET } = validatedEnv.data;
    const appAccessToken = `${FACEBOOK_APP_ID}|${FACEBOOK_APP_SECRET}`;

    const debugUrl =
      `https://graph.facebook.com/debug_token` +
      `?input_token=${encodeURIComponent(accessToken)}` +
      `&access_token=${encodeURIComponent(appAccessToken)}`;

    const debugRes = await fetch(debugUrl);
    const debugJson = await debugRes.json();

    // Guardrail against undefined external response structure
    const data = debugJson?.data;

    if (!debugRes.ok || !data?.is_valid || data?.app_id !== FACEBOOK_APP_ID) {
      throw new UnauthorizedError("Invalid or expired Facebook access token");
    }

    const meUrl =
      `https://graph.facebook.com/me` +
      `?fields=id,name,email` +
      `&access_token=${encodeURIComponent(accessToken)}`;

    const meRes = await fetch(meUrl);
    const meJson = await meRes.json();

    if (!meRes.ok) {
      throw new UnauthorizedError("Failed to retrieve Facebook profile data");
    }

    const email = meJson?.email;

    if (typeof email !== "string" || !email) {
      throw new AppError(
        "Facebook did not return a valid email address. Please authenticate using standard credentials.",
        400
      );
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
        "No account found associated with this Facebook email. Please sign up first."
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