import { z } from "zod";


export const addToCartSchema = z.object({
  listingId: z.string().min(1, "Listing ID is required"),
  quantity: z.number().min(1, "Quantity must be at least 1").default(1),
});

export const updateCartItemSchema = z.object({
  listingId: z.string().min(1, "Listing ID is required"),
  quantity: z.number().min(1, "Quantity must be at least 1"),
});

export const mergeCartSchema = z.object({
  items: z.array(
    z.object({
      listingId: z.string().min(1, "Listing ID is required"),
      quantity: z.number().int().min(1, "Quantity must be at least 1"),
    })
  ).min(1, "At least one item is required"),
});