import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import {
  uploadManyImageFiles,
  deleteManyByPublicIds,
} from "@/app/(backend)/utils/cloudinary";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/token";
import { updateListingSchema } from "../../../listing/schema";
import { createSlug } from "@/lib/slugGenerator";

export const runtime = "nodejs";

async function getCookie(req: Request, name: string) {
  const cookie = req.headers.get("cookie");
  if (!cookie) return null;

  return (
    cookie
      .split("; ")
      .find((c) => c.startsWith(`${name}=`))
      ?.split("=")[1] ?? null
  );
}

function toNullableString(value: FormDataEntryValue | null) {
  if (value === null) return undefined;
  const parsed = String(value).trim();
  return parsed ? parsed : null;
}

async function getAuthenticatedSeller(req: Request) {
  const token = await getCookie(req, "session");

  if (!token) {
    return {
      error: NextResponse.json({ message: "Unauthorized" }, { status: 401 }),
    };
  }

  const payload = await verifyToken(token);
  const userId = typeof payload === "string" ? payload : payload?.userId;

  if (!userId) {
    return {
      error: NextResponse.json({ message: "Unauthorized" }, { status: 401 }),
    };
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, role: true },
  });

  if (!user) {
    return {
      error: NextResponse.json({ message: "User does not exist" }, { status: 404 }),
    };
  }

  if (user.role !== "SELLER") {
    return {
      error: NextResponse.json(
        { message: "User is not authorized" },
        { status: 403 }
      ),
    };
  }

  return { user };
}

export async function GET(
  req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await ctx.params;
    const auth = await getAuthenticatedSeller(req);
    if ("error" in auth) return auth.error;

    const listing = await prisma.listing.findFirst({
      where: {
        id,
        sellerId: auth.user.id,
      },
      include: {
        images: true,
        category: true,
      },
    });

    if (!listing) {
      return NextResponse.json({ message: "Listing not found" }, { status: 404 });
    }

    return NextResponse.json({ ok: true, listing }, { status: 200 });
  } catch (err) {
    console.error("Error fetching seller listing:", err);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  let newlyUploaded: Array<{ url: string; public_id: string }> = [];

  try {
    const { id } = await ctx.params;

    const auth = await getAuthenticatedSeller(req);
    if ("error" in auth) return auth.error;
    const { user } = auth;

    const existing = await prisma.listing.findFirst({
      where: {
        id,
        sellerId: user.id,
      },
      include: { images: true },
    });

    if (!existing) {
      return NextResponse.json({ message: "Listing not found" }, { status: 404 });
    }

    const formData = await req.formData();

    const rawInput = {
      name:
        formData.get("name") !== null
          ? String(formData.get("name")).trim()
          : undefined,
      description:
        formData.get("description") !== null
          ? String(formData.get("description")).trim()
          : undefined,
      location: toNullableString(formData.get("location")),
      state: toNullableString(formData.get("state")),
      status:
        formData.get("status") !== null
          ? String(formData.get("status")).trim()
          : undefined,
      condition:
        formData.get("condition") !== null
          ? String(formData.get("condition")).trim()
          : undefined,
      price:
        formData.get("price") !== null
          ? Number(formData.get("price"))
          : undefined,
      negotiable:
        formData.get("negotiable") !== null
          ? String(formData.get("negotiable")) === "true"
          : undefined,
      offersDelivery:
        formData.get("offersDelivery") !== null
          ? String(formData.get("offersDelivery")) === "true"
          : undefined,
      contact: toNullableString(formData.get("contact")),
      categoryId: toNullableString(formData.get("categoryId")),
      replaceImages:
        formData.get("replaceImages") !== null
          ? String(formData.get("replaceImages")) === "true"
          : false,
    };

    const validatedInput = updateListingSchema.safeParse(rawInput);

    if (!validatedInput.success) {
      return NextResponse.json(
        {
          message: "Input does not meet required schema",
          errors: validatedInput.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const {
      name,
      description,
      location,
      state,
      status,
      condition,
      price,
      negotiable,
      offersDelivery,
      contact,
      categoryId,
      replaceImages,
    } = validatedInput.data;

    const data: Prisma.ListingUpdateInput = {};

    if (name !== undefined) data.name = name;
    if (description !== undefined) data.description = description;
    if (location !== undefined) data.location = location;
    if (state !== undefined) data.state = state;
    if (status !== undefined) data.status = status;
    if (condition !== undefined) data.condition = condition;
    if (price !== undefined) data.price = price;
    if (negotiable !== undefined) data.negotiable = negotiable;
    if (offersDelivery !== undefined) data.offersDelivery = offersDelivery;
    if (contact !== undefined) data.contact = contact;

    if (name !== undefined && name !== existing.name) {
      const baseSlug = createSlug(name);
      let newSlug = baseSlug;

      const slugTaken = async (candidate: string) => {
        const [liveMatch, historyMatch] = await Promise.all([
          prisma.listing.findUnique({ where: { slug: candidate } }),
          prisma.listingSlugHistory.findFirst({ where: { slug: candidate } }),
        ]);
        const liveConflict = liveMatch && liveMatch.id !== existing.id;
        return Boolean(liveConflict || historyMatch);
      };

      let counter = 1;
      while (await slugTaken(newSlug)) {
        newSlug = `${baseSlug}-${counter}`;
        counter++;
      }

      data.slug = newSlug;
      data.SlugHistory = {
        create: {
          slug: existing.slug,
        },
      };
    }

    if (categoryId !== undefined) {
      if (categoryId) {
        const categoryExists = await prisma.category.findUnique({
          where: { id: categoryId },
          select: { id: true },
        });

        if (!categoryExists) {
          return NextResponse.json(
            { message: "Selected category does not exist" },
            { status: 400 }
          );
        }

        data.category = { connect: { id: categoryId } };
      } else {
        data.category = { disconnect: true };
      }
    }

    const images = formData
      .getAll("images")
      .filter(
        (file): file is File => file instanceof File && file.size > 0
      );

    if (images.length > 0) {
      newlyUploaded = await uploadManyImageFiles(images, {
        subfolder: "listings",
      });

      data.images = replaceImages
        ? {
            deleteMany: {},
            create: newlyUploaded.map((img) => ({
              url: img.url,
              publicId: img.public_id,
            })),
          }
        : {
            create: newlyUploaded.map((img) => ({
              url: img.url,
              publicId: img.public_id,
            })),
          };
    }

    const listing = await prisma.listing.update({
      where: { id: existing.id },
      data,
      include: {
        images: true,
        category: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
        seller: {
          select: {
            id: true,
            firstname: true,
            lastname: true,
            image: true,
          },
        },
      },
    });

    if (images.length > 0 && replaceImages) {
      const oldPublicIds = existing.images
        .map((img) => img.publicId)
        .filter((oldId): oldId is string => Boolean(oldId));

      if (oldPublicIds.length) {
        await deleteManyByPublicIds(oldPublicIds);
      }
    }

    return NextResponse.json(
      { message: "Listing updated successfully", listing },
      { status: 200 }
    );
  } catch (err) {
    console.error("Error updating listing:", err);

    if (newlyUploaded.length) {
      const ids = newlyUploaded.map((img) => img.public_id).filter(Boolean);
      if (ids.length) {
        await deleteManyByPublicIds(ids);
      }
    }

    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await ctx.params;

    const auth = await getAuthenticatedSeller(req);
    if ("error" in auth) return auth.error;
    const { user } = auth;

    const existing = await prisma.listing.findFirst({
      where: {
        id,
        sellerId: user.id,
      },
    });

    if (!existing) {
      return NextResponse.json({ message: "Listing not found" }, { status: 404 });
    }

    const listing = await prisma.$transaction(async (tx) => {
      await tx.cartItem.deleteMany({
        where: { listingId: existing.id },
      });

      return await tx.listing.update({
        where: { id: existing.id },
        data: { status: "REMOVED" },
      });
    });

    return NextResponse.json(
      { message: "Listing removed successfully", listing },
      { status: 200 }
    );
  } catch (err) {
    console.error("Error removing listing:", err);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}