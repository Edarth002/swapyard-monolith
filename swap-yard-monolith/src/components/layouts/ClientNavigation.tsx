"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { Sidebar } from "@/components/layouts/Sidebar";
import { Navbar } from "@/components/layouts/Navbar";
import { SellerNavbar } from "@/components/seller/SellerNavbar"; 

export const ClientNavigation = ({ children }: { children: React.ReactNode }) => {
    const [isSidebarOpen, setSidebarOpen] = useState(false);
    const pathname = usePathname();

    const isSellerRoute = pathname?.startsWith("/seller");
    
    // Check if navbar is hidden on this route
    const hiddenRoutes = ["/auth/login", "/auth/signup", "/auth/verify", "/seller/verify"];
    const isHiddenRoute = hiddenRoutes.some(route => pathname?.startsWith(route));

    return (
        <>
            <Sidebar isOpen={isSidebarOpen} onClose={() => setSidebarOpen(false)} />
            
            {!isHiddenRoute && (
                isSellerRoute ? (
                    <SellerNavbar onOpenSidebar={() => setSidebarOpen(true)} />
                ) : (
                    <Navbar onOpenSidebar={() => setSidebarOpen(true)} />
                )
            )}
            
            <main className="flex-1">
                {children}
            </main>
        </>
    );
};