import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { registerSchema } from "../schema";
import { handleRouteError, ConflictError } from "@/lib/errors";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const {
      email,
      password,
      firstname,
      lastname,
      phoneNumber,
      role,
      state,
      contract,
    } = registerSchema.parse(body);

    const existingUser = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });

    if (existingUser) {
      // Deterministic 409 Conflict for duplicate resource
      throw new ConflictError("Invalid registration details. Please check your credentials or log in.");
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        firstname,
        lastname,
        role,
        phoneNumber,
        state,
        contract,
      },
      select: {
        id: true,
        email: true,
      },
    });

    return NextResponse.json(
      {
        ok: true,
        message: "User created successfully",
        user: newUser,
      },
      { status: 201 }
    );
  } catch (error) {
    return handleRouteError(error);
  }
}