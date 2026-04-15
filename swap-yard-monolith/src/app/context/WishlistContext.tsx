"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";

// 1. Define the shape of a Wishlist Item
export interface WishlistItem {
  id: string;
  title: string;
  price: number;
  imageUrl: string;
  location?: string;
  rating?: number;
  reviewsCount?: number;
}

// 2. Define what our Context will provide
interface WishlistContextType {
  wishlistItems: WishlistItem[];
  addToWishlist: (item: WishlistItem) => void;
  removeFromWishlist: (id: string) => void;
  isInWishlist: (id: string) => boolean;
}

// 3. Create the Context
const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

// 4. Create the Provider Component
export function WishlistProvider({ children }: { children: ReactNode }) {
  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([]);
  const [isMounted, setIsMounted] = useState(false);

  // Load wishlist from LocalStorage on initial mount
  useEffect(() => {
    setIsMounted(true);
    const storedWishlist = localStorage.getItem("swapyard_wishlist");
    if (storedWishlist) {
      try {
        setWishlistItems(JSON.parse(storedWishlist));
      } catch (error) {
        console.error("Failed to load wishlist from local storage", error);
      }
    }
  }, []);

  // Save to LocalStorage whenever wishlistItems change
  useEffect(() => {
    if (isMounted) {
      localStorage.setItem("swapyard_wishlist", JSON.stringify(wishlistItems));
    }
  }, [wishlistItems, isMounted]);

  // Core Functions
  const addToWishlist = (newItem: WishlistItem) => {
    setWishlistItems((prev) => {
      if (!prev.find((item) => item.id === newItem.id)) {
        return [...prev, newItem];
      }
      return prev;
    });
  };

  const removeFromWishlist = (id: string) => {
    setWishlistItems((prev) => prev.filter((item) => item.id !== id));
  };

  const isInWishlist = (id: string) => {
    return wishlistItems.some((item) => item.id === id);
  };

  return (
    <WishlistContext.Provider value={{ wishlistItems, addToWishlist, removeFromWishlist, isInWishlist }}>
      {children}
    </WishlistContext.Provider>
  );
}

// 5. Custom hook to use the wishlist easily
export function useWishlist() {
  const context = useContext(WishlistContext);
  if (context === undefined) {
    throw new Error("useWishlist must be used within a WishlistProvider");
  }
  return context;
}