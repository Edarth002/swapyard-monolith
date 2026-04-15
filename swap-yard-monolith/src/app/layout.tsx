import type { Metadata } from "next";
import { Manrope } from "next/font/google";
import { GoogleOAuthProvider } from "@react-oauth/google";
import FacebookProvider from "./auth/components/facebooksdk";
import { CartProvider } from "./context/CartContext";
import { NotificationProvider } from "./context/NotificationContext";
import { WishlistProvider } from "./context/WishlistContext"; // <-- Added WishlistProvider
import { Toaster } from "react-hot-toast"; // <-- Added global Toaster
import { ClientNavigation } from "@/components/layouts/ClientNavigation"; 
import "./globals.css"

const manrope = Manrope({ 
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
            <body className={`${manrope.className} min-h-screen flex flex-col bg-[#F9FAFB]`} suppressHydrationWarning>
                
                {/* Global Toaster: Now toasts will show up anywhere in the app */}
                <Toaster position="top-center" />

                <GoogleOAuthProvider clientId={process.env.GOOGLE_CLIENT_ID!}>
                
                    <FacebookProvider/>
                    
                    {/* Wrap the app with CartProvider to enable global cart state */}
                    <CartProvider>
                        {/* Wrap with WishlistProvider to enable global wishlist state */}
                        <WishlistProvider>
                            <NotificationProvider>
                                {/* Wrap the children inside our new smart ClientNavigation */}
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