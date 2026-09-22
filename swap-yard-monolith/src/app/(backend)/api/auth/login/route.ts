import { prisma } from "@/lib/prisma";
import { createToken, verifyToken } from "@/lib/token";
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { loginSchema } from "../schema";
import { handleRouteError, UnauthorizedError } from "@/lib/errors";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    const { email, password } = loginSchema.parse(body);

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user || !user.password) {
      throw new UnauthorizedError("Invalid email or password");
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedError("Invalid email or password");
    }

    const token = await createToken(user.id, user.role);

    const response = NextResponse.json(
      {
        ok: true,
        message: "Login successful",
        user: { id: user.id, email: user.email, role: user.role },
      },
      { status: 200 }
    );

    response.cookies.set("session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: 7 * 24 * 60 * 60,
    });

    if (process.env.NODE_ENV !== "production") {
      console.log("Role from DB:", user.role);
      console.log("Token verification:", await verifyToken(token));
    }

    return response;
  } catch (error) {
    return handleRouteError(error);
  }
}