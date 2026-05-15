import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { GoogleOAuthProvider } from "@react-oauth/google";
import FacebookProvider from "./auth/components/facebooksdk";
import { CartProvider } from "./context/CartContext";
import { NotificationProvider } from "./context/NotificationContext";
import { WishlistProvider } from "./context/WishlistContext";
import { Toaster } from "react-hot-toast"; 
import { ClientNavigation } from "@/components/layouts/ClientNavigation"; 
import "./globals.css";

const geistSans = Geist({
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "SwapYard",
  description: "Buy and Sell Furniture & Household Items Locally",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body 
        className={`${geistSans.className} min-h-screen flex flex-col bg-[#F9FAFB] antialiased`} 
        suppressHydrationWarning
      >
        <Toaster position="top-center" />
        <GoogleOAuthProvider clientId={process.env.GOOGLE_CLIENT_ID!}>
          <FacebookProvider />
          <CartProvider>
            <WishlistProvider>
              <NotificationProvider>
                <ClientNavigation>
                  {children}
                </ClientNavigation>
              </NotificationProvider>
            </WishlistProvider>
          </CartProvider>
        </GoogleOAuthProvider>
      </body>
    </html>
  );
}