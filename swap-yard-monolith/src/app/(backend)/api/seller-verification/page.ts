// app/api/seller-verification/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma"; // adjust path
import { uploadOneImageFile, deleteImageByPublicId } from "../../utils/cloudinary";
import { z } from "zod";

// --- ZOD SCHEMAS ---
const createVerificationSchema = z.object({
  userId: z.string().min(1, "User ID is required"),
  fullName: z.string().min(2, "Full name is required"),
  businessName: z.string().min(2, "Business name is required"),
  vatNumber: z.string().optional(),
  nin: z.string().min(11, "NIN must be 11 characters"),
});

const updateVerificationSchema = z.object({
  userId: z.string().min(1, "User ID is required"),
  status: z.enum(["SUBMITTED", "APPROVED", "REJECTED"], "Invalid status"),
  reviewNote: z.string().optional(),
});

// Allowed file types
const ALLOWED_FILE_TYPES = ["image/jpeg", "image/png"];

// --- POST ROUTE ---
export async function POST(req: Request) {
  try {
    const data = await req.formData();
    const fields = Object.fromEntries(data.entries());

    // Validate fields
    const parsed = createVerificationSchema.safeParse(fields);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }

    // Validate files
    const businessLicenseFile = data.get("businessLicense") as File | null;
    const idDocumentFile = data.get("idDocument") as File | null;

    if (!businessLicenseFile || !idDocumentFile) {
      return NextResponse.json({ error: "Both Business License and ID Document are required" }, { status: 400 });
    }

    if (!ALLOWED_FILE_TYPES.includes(businessLicenseFile.type)) {
      return NextResponse.json({ error: "Business License must be JPG/PNG" }, { status: 400 });
    }

    if (!ALLOWED_FILE_TYPES.includes(idDocumentFile.type)) {
      return NextResponse.json({ error: "ID Document must be JPG/PNG" }, { status: 400 });
    }

    // Upload to Cloudinary
    const businessLicense = await uploadOneImageFile(businessLicenseFile, { subfolder: "verification" });
    const idDocument = await uploadOneImageFile(idDocumentFile, { subfolder: "verification" });

    // Save to database
    const verification = await prisma.sellerVerification.create({
      data: {
        userId: parsed.data.userId,
        fullName: parsed.data.fullName,
        businessName: parsed.data.businessName,
        vatNumber: parsed.data.vatNumber,
        nin: parsed.data.nin,
        businessLicenseUrl: businessLicense.url,
        businessLicensePublicId: businessLicense.public_id,
        idDocumentUrl: idDocument.url,
        idDocumentPublicId: idDocument.public_id,
        status: "PENDING",
        submittedAt: new Date(),
      },
    });

    return NextResponse.json({ verification }, { status: 201 });
  } catch (err: any) {
    console.error("POST verification error:", err);
    return NextResponse.json({ error: err.message || "Something went wrong" }, { status: 500 });
  }
}

// --- PATCH ROUTE ---
export async function PATCH(req: Request) {
  try {
    const body = await req.json();

    const parsed = updateVerificationSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }

    const { userId, status, reviewNote } = parsed.data;

    // Fetch existing verification
    const existing = await prisma.sellerVerification.findUnique({ where: { userId } });
    if (!existing) {
      return NextResponse.json({ error: "Seller verification not found" }, { status: 404 });
    }

    const updated = await prisma.sellerVerification.update({
      where: { userId },
      data: {
        status: "APPROVED",
        reviewNote: reviewNote || undefined,
        reviewedAt: new Date(),
      },
    });

    // Optionally: mark SellerAccount as verified if approved
    if (status === "APPROVED") {
      await prisma.sellerAccount.updateMany({
        where: { userId },
        data: { isVerified: true },
      });
    }

    return NextResponse.json({ verification: updated });
  } catch (err: any) {
    console.error("PATCH verification error:", err);
    return NextResponse.json({ error: err.message || "Something went wrong" }, { status: 500 });
  }
}