import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { resetPasswordSchema } from "../schema";
import {
  handleRouteError,
  AppError,
  NotFoundError,
} from "@/lib/errors";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const { token, password } = resetPasswordSchema.parse(body);

    const passwordResetToken = await prisma.passwordResetToken.findUnique({
      where: { token },
    });

    if (!passwordResetToken) {
      throw new AppError("Invalid or expired password reset token", 400);
    }

    const hasExpired = new Date() > new Date(passwordResetToken.expires);

    if (hasExpired) {
      await prisma.passwordResetToken.delete({
        where: { token },
      }).catch(() => null);

      throw new AppError("Password reset token has expired", 400);
    }

    const user = await prisma.user.findUnique({
      where: { email: passwordResetToken.email },
      select: { id: true },
    });

    if (!user) {
      throw new NotFoundError("User associated with this reset token not found");
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await prisma.$transaction([
      prisma.user.update({
        where: { id: user.id },
        data: { password: hashedPassword },
      }),
      prisma.passwordResetToken.delete({
        where: { token },
      }),
    ]);

    return NextResponse.json(
      {
        ok: true,
        message: "Password reset successfully.",
      },
      { status: 200 }
    );
  } catch (error) {
    return handleRouteError(error);
  }
}