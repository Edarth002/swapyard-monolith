import { cookies } from "next/headers";
import { verifyToken } from "@/lib/token";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { updateProfileSchema } from "../schema";
import {
  handleRouteError,
  UnauthorizedError,
  ConflictError,
} from "@/lib/errors";

export const runtime = "nodejs";

async function getSessionUserId(): Promise<string> {
  const cookieStore = await cookies();
  const token = cookieStore.get("session")?.value;

  if (!token) {
    throw new UnauthorizedError("Authentication required");
  }

  const payload = await verifyToken(token);
  const userId = typeof payload === "string" ? payload : payload?.userId;

  if (!userId) {
    throw new UnauthorizedError("Invalid or expired session token");
  }

  return userId;
}

export async function GET() {
  try {
    const userId = await getSessionUserId();

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        firstname: true,
        lastname: true,
        email: true,
        phoneNumber: true,
        role: true,
        state: true,
        deliveryAddress: true,
        bio: true,
        contract: true,
        sellerAccount: {
          select: {
            id: true,
            bankName: true,
            accountName: true,
            accountNumber: true,
            accountType: true,
            isVerified: true,
          },
        },
      },
    });

    if (!user) {
      throw new UnauthorizedError("User account not found");
    }

    return NextResponse.json({ ok: true, user }, { status: 200 });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function PATCH(req: Request) {
  try {
    const userId = await getSessionUserId();

    const body = await req.json();
    const parsed = updateProfileSchema.parse(body);

    const {
      firstname,
      lastname,
      phoneNumber,
      email,
      state,
      bio,
      deliveryAddress,
      bankName,
      accountName,
      accountNumber,
      accountType,
    } = parsed;

    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        sellerAccount: {
          select: {
            id: true,
          },
        },
      },
    });

    if (!existingUser) {
      throw new UnauthorizedError("User account not found");
    }

    if (email && email !== existingUser.email) {
      const emailTaken = await prisma.user.findUnique({
        where: { email },
        select: { id: true },
      });

      if (emailTaken) {
        throw new ConflictError("Email address is already in use");
      }
    }

    const userData: {
      firstname?: string;
      lastname?: string;
      phoneNumber?: string;
      email?: string;
      state?: string;
      bio?: string;
      deliveryAddress?: string;
    } = {};

    if (firstname !== undefined) userData.firstname = firstname;
    if (lastname !== undefined) userData.lastname = lastname;
    if (phoneNumber !== undefined) userData.phoneNumber = phoneNumber;
    if (email !== undefined) userData.email = email;
    if (state !== undefined) userData.state = state;
    if (bio !== undefined) userData.bio = bio;
    if (deliveryAddress !== undefined) userData.deliveryAddress = deliveryAddress;

    const payoutFieldsProvided =
      bankName !== undefined ||
      accountName !== undefined ||
      accountNumber !== undefined ||
      accountType !== undefined;

    await prisma.$transaction(async (tx) => {
      if (Object.keys(userData).length > 0) {
        await tx.user.update({
          where: { id: userId },
          data: userData,
        });
      }

      if (payoutFieldsProvided) {
        if (existingUser.sellerAccount?.id) {
          await tx.sellerAccount.update({
            where: { userId },
            data: {
              ...(bankName !== undefined ? { bankName } : {}),
              ...(accountName !== undefined ? { accountName } : {}),
              ...(accountNumber !== undefined ? { accountNumber } : {}),
              ...(accountType !== undefined ? { accountType } : {}),
            },
          });
        } else {
          await tx.sellerAccount.create({
            data: {
              userId,
              bankName: bankName ?? "",
              accountName: accountName ?? "",
              accountNumber: accountNumber ?? "",
              accountType: accountType ?? "Savings",
            },
          });

          await tx.user.update({
            where: { id: userId },
            data: { role: "SELLER" },
          });
        }
      }
    });

    const updatedUser = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        firstname: true,
        lastname: true,
        email: true,
        phoneNumber: true,
        role: true,
        state: true,
        deliveryAddress: true,
        bio: true,
        contract: true,
        sellerAccount: {
          select: {
            id: true,
            bankName: true,
            accountName: true,
            accountNumber: true,
            accountType: true,
            isVerified: true,
          },
        },
      },
    });

    return NextResponse.json(
      {
        ok: true,
        message: "Profile updated successfully",
        user: updatedUser,
      },
      { status: 200 }
    );
  } catch (error) {
    return handleRouteError(error);
  }
}