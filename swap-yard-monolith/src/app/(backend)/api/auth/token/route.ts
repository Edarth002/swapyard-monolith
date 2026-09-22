import { prisma } from "@/lib/prisma";
import { NextResponse, after } from "next/server";
import crypto from "crypto";
import { Resend } from "resend";
import { requestPasswordResetSchema } from "../schema";
import { handleRouteError } from "@/lib/errors";

export const runtime = "nodejs";

const resend = new Resend(process.env.RESEND_API_KEY);

const GENERIC_RESET_MESSAGE =
  "If an account exists, a reset link has been sent.";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // Direct parse: fails with 400 Bad Request via handleRouteError on bad input
    const { email } = requestPasswordResetSchema.parse(body);

    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true },
    });

    if (!user) {
      return NextResponse.json(
        { ok: true, message: GENERIC_RESET_MESSAGE },
        { status: 200 }
      );
    }

    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetTokenExpiry = new Date(Date.now() + 5 * 60 * 1000);

    // Atomically rotate token
    await prisma.$transaction([
      prisma.passwordResetToken.deleteMany({
        where: { email: user.email },
      }),
      prisma.passwordResetToken.create({
        data: {
          email: user.email,
          token: resetToken,
          expires: resetTokenExpiry,
        },
      }),
    ]);

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    const resetLink = `${baseUrl}/reset-password?token=${resetToken}`;

    after(async () => {
      try {
        const { error } = await resend.emails.send({
          from: "SwapYard <onboarding@resend.dev>",
          to: [user.email],
          subject: "Reset Your Password",
          html: `
            <div>
              <h1>Reset your password</h1>
              <p>Click the link below to reset your password. This link expires in 5 minutes.</p>
              <a href="${resetLink}" style="background:#000;color:#fff;padding:10px 20px;border-radius:5px;text-decoration:none;">
                Reset Password
              </a>
              <p>If you didn't request this, you can safely ignore this email.</p>
            </div>
          `,
        });

        if (error) {
          console.error("[Resend Error]:", error);
        }
      } catch (err) {
        console.error("[Resend Dispatch Exception]:", err);
      }
    });

    return NextResponse.json(
      { ok: true, message: GENERIC_RESET_MESSAGE },
      { status: 200 }
    );
  } catch (error) {
    return handleRouteError(error);
  }
}