import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),

  NEXTAUTH_SECRET: z.string().min(1, "NEXTAUTH_SECRET is required"),
  NEXTAUTH_URL: z.string().url("NEXTAUTH_URL must be a valid URL"),
  NEXT_PUBLIC_APP_URL: z.string().url("NEXT_PUBLIC_APP_URL must be a valid URL"),

  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),

  GOOGLE_CLIENT_ID: z.string().min(1, "GOOGLE_CLIENT_ID is required"),
  GOOGLE_CLIENT_SECRET: z.string().min(1, "GOOGLE_CLIENT_SECRET is required"),
  NEXT_PUBLIC_GOOGLE_CLIENT_ID: z.string().min(1, "NEXT_PUBLIC_GOOGLE_CLIENT_ID is required"),

  NEXT_PUBLIC_FACEBOOK_APP_ID: z.string().min(1, "NEXT_PUBLIC_FACEBOOK_APP_ID is required"),
  NEXT_PUBLIC_FACEBOOK_APP_SECRET: z.string().min(1, "NEXT_PUBLIC_FACEBOOK_APP_SECRET is required"),
  FACEBOOK_APP_ID: z.string().min(1, "FACEBOOK_APP_ID is required"),
  FACEBOOK_APP_SECRET: z.string().min(1, "FACEBOOK_APP_SECRET is required"),

  JWT_SECRET: z.string().min(16, "JWT_SECRET must be at least 16 characters"),

  RESEND_API_KEY: z
    .string()
    .min(1, "RESEND_API_KEY is required")
    .startsWith("re_", "RESEND_API_KEY must start with 're_'"),

  CLOUDINARY_API_SECRET: z.string().min(1, "CLOUDINARY_API_SECRET is required"),
  CLOUDINARY_API_KEY: z.string().min(1, "CLOUDINARY_API_KEY is required"),
  CLOUDINARY_CLOUD_NAME: z.string().min(1, "CLOUDINARY_CLOUD_NAME is required"),
  CLOUDINARY_FOLDER: z.string().default("swapyard"),

  PAYSTACK_SECRET_KEY: z
    .string()
    .min(1, "PAYSTACK_SECRET_KEY is required")
    .regex(/^sk_(test|live)_/, "PAYSTACK_SECRET_KEY must start with 'sk_test_' or 'sk_live_'"),
});

const result = envSchema.safeParse(process.env);

if (!result.success) {
  console.error("❌ [BOOT ERROR] Missing or invalid environment variables:");
  console.error(JSON.stringify(result.error.flatten().fieldErrors, null, 2));
  process.exit(1);
}

export const env = result.data;