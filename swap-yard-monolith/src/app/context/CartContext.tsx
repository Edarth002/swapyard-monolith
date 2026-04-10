"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";

// 1. Define the shape of a Cart Item
export interface CartItem {
  id: string;
  title: string;
  price: number;
  imageUrl: string;
  quantity: number;
}

// 2. Define what our Context will provide
interface CartContextType {
  cartItems: CartItem[];
  addToCart: (item: CartItem) => void;
  removeFromCart: (id: string) => void;
  updateQuantity: (id: string, type: "increase" | "decrease") => void;
  cartTotal: number;
  cartCount: number;
  clearCart: () => void;
}

// 3. Create the Context
const CartContext = createContext<CartContextType | undefined>(undefined);

// 4. Create the Provider Component
export function CartProvider({ children }: { children: ReactNode }) {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isMounted, setIsMounted] = useState(false);

  // --- Step A: Load cart from LocalStorage on initial mount ---
  useEffect(() => {
    setIsMounted(true); // Tells Next.js it's safe to use client-side APIs
    const storedCart = localStorage.getItem("swapyard_cart");
    if (storedCart) {
      try {
        setCartItems(JSON.parse(storedCart));
      } catch (error) {
        console.error("Failed to load cart from local storage", error);
      }
    }
  }, []);

  // --- Step B: Save to LocalStorage whenever cartItems change ---
  useEffect(() => {
    // Only save if the component has mounted to prevent overwriting saved data with initial empty state
    if (isMounted) {
      localStorage.setItem("swapyard_cart", JSON.stringify(cartItems));
    }
  }, [cartItems, isMounted]);

  // --- Core Cart Functions ---
  const addToCart = (newItem: CartItem) => {
    setCartItems((prev) => {
      const existingItem = prev.find((item) => item.id === newItem.id);
      if (existingItem) {
        // If item exists, increase its quantity
        return prev.map((item) =>
          item.id === newItem.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      // If item is new, add it to the array
      return [...prev, { ...newItem, quantity: 1 }];
    });
  };

  const removeFromCart = (id: string) => {
    setCartItems((prev) => prev.filter((item) => item.id !== id));
  };

  const clearCart = () => {
    setCartItems([]);
    localStorage.removeItem("swapyard_cart"); // Wipe it from memory
  };

  const updateQuantity = (id: string, type: "increase" | "decrease") => {
    setCartItems((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          if (type === "increase") return { ...item, quantity: item.quantity + 1 };
          if (type === "decrease" && item.quantity > 1) return { ...item, quantity: item.quantity - 1 };
        }
        return item;
      })
    );
  };

  // --- Derived Values ---
  const cartTotal = cartItems.reduce((total, item) => total + item.price * item.quantity, 0);
  const cartCount = cartItems.reduce((count, item) => count + item.quantity, 0);

  return (
    <CartContext.Provider value={{ cartItems, addToCart, removeFromCart, updateQuantity, cartTotal, cartCount, clearCart }}>
      {children}
    </CartContext.Provider>
  );
}

// 5. Custom hook to use the cart easily
export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}