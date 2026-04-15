"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";

export interface CartItem {
  id: string; // listingId
  title: string;
  price: number;
  imageUrl: string;
  quantity: number;
}

interface CartContextType {
  cartItems: CartItem[];
  addToCart: (item: CartItem) => void;
  removeFromCart: (id: string) => void;
  updateQuantity: (id: string, type: "increase" | "decrease") => void;
  cartTotal: number;
  cartCount: number;
  clearCart: () => void;
  syncCartWithDB: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    
    const initializeCart = async () => {
      try {
        const res = await fetch("/api/cart");
        if (res.ok) {
          const data = await res.json();
          // FIXED: Map backend listing structure to frontend CartItem interface
          if (data.items && Array.isArray(data.items)) {
            const mappedItems: CartItem[] = data.items.map((dbItem: any) => ({
              id: dbItem.listing.id,
              title: dbItem.listing.name,
              price: Number(dbItem.listing.price), // Force to number
              imageUrl: dbItem.listing.images?.[0]?.url || "",
              quantity: dbItem.quantity,
            }));
            setCartItems(mappedItems);
            return;
          }
        }
      } catch (err) {
        console.error("Failed to sync with DB cart", err);
      }

      const storedCart = localStorage.getItem("swapyard_cart");
      if (storedCart) {
        try {
          setCartItems(JSON.parse(storedCart));
        } catch (error) {
          console.error("Failed to parse local cart", error);
        }
      }
    };

    initializeCart();
  }, []);

  useEffect(() => {
    if (isMounted) {
      localStorage.setItem("swapyard_cart", JSON.stringify(cartItems));
    }
  }, [cartItems, isMounted]);

  const syncItemToDB = async (listingId: string, quantity: number) => {
    try {
      await fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listingId, quantity }),
      });
    } catch (err) {
      console.error("Backend sync failed", err);
    }
  };

  const addToCart = (newItem: CartItem) => {
    setCartItems((prev) => {
      const existingItem = prev.find((item) => item.id === newItem.id);
      let updatedCart;
      if (existingItem) {
        updatedCart = prev.map((item) =>
          item.id === newItem.id ? { ...item, quantity: item.quantity + newItem.quantity } : item
        );
      } else {
        updatedCart = [...prev, newItem];
      }
      
      const targetItem = updatedCart.find(i => i.id === newItem.id);
      if (targetItem) syncItemToDB(targetItem.id, targetItem.quantity);
      
      return updatedCart;
    });
  };

  const removeFromCart = async (id: string) => {
    setCartItems((prev) => prev.filter((item) => item.id !== id));
    try {
      // Your DELETE route expects listingId in the body
      await fetch("/api/cart", { 
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listingId: id })
      });
    } catch (err) {
      console.error("Failed to remove item from DB", err);
    }
  };

  const updateQuantity = (id: string, type: "increase" | "decrease") => {
    setCartItems((prev) => {
      const updated = prev.map((item) => {
        if (item.id === id) {
          const newQty = type === "increase" ? item.quantity + 1 : Math.max(1, item.quantity - 1);
          syncItemToDB(id, newQty);
          return { ...item, quantity: newQty };
        }
        return item;
      });
      return updated;
    });
  };

  const clearCart = () => {
    setCartItems([]);
    localStorage.removeItem("swapyard_cart");
  };

  const syncCartWithDB = async () => {
     // Push local items to DB logic here
  };

  // derived values with safety Number casting to prevent NaN
  const cartTotal = cartItems.reduce((total, item) => {
    return total + (Number(item.price) || 0) * (Number(item.quantity) || 0);
  }, 0);

  const cartCount = cartItems.reduce((count, item) => {
    return count + (Number(item.quantity) || 0);
  }, 0);

  return (
    <CartContext.Provider value={{ cartItems, addToCart, removeFromCart, updateQuantity, cartTotal, cartCount, clearCart, syncCartWithDB }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}