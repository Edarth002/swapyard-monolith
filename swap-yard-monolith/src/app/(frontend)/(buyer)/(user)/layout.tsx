"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { User, Package, Mail, Heart, Ticket, LogOut } from "lucide-react";

export default function UserDashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();
        const router = useRouter();
        const [isLoggingOut, setIsLoggingOut] = useState(false);

    const SIDEBAR_LINKS = [
        { name: "My Account", icon: <User size={20} />, href: "/profile" },
        { name: "Orders", icon: <Package size={20} />, href: "/orders" },
        { name: "Notifications", icon: <Mail size={20} />, href: "/notifications" },
        { name: "Wishlist", icon: <Heart size={20} />, href: "/wishlist" },
    ];

    const handleLogout = async () => {
        try {
            setIsLoggingOut(true);
            const res = await fetch("/api/auth/logout", {
                method: "POST",
            });

            if (res.ok) {
                router.push("/auth/login");
            } else {
                console.error("Logout failed");
                setIsLoggingOut(false);
            }
        } catch (error) {
            console.error("An error occurred during logout:", error);
            setIsLoggingOut(false);
        }
    };


    return (
        <div className="min-h-screen bg-gray-50/50 flex flex-col md:flex-row">
            
            <aside className="md:w-64 bg-white border-r border-gray-200 shrink-0 hidden md:flex flex-col py-8 px-4">
                <div className="mb-8 px-4">
                    <h2 className="text-[11px] font-extrabold text-black uppercase tracking-widest mb-4">ACCOUNT MENU</h2>
                    <nav className="flex flex-col gap-2">
                        {SIDEBAR_LINKS.map((link) => {
                            const isActive = pathname === link.href || pathname?.startsWith(`${link.href}/`);
                            
                            return (
                                <Link 
                                    key={link.name} 
                                    href={link.href}
                                    className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium text-sm ${
                                        isActive 
                                            ? "text-white bg-[#EB3B18]" 
                                            : "text-gray-600 hover:bg-gray-50 hover:text-[#EB3B18]"
                                    }`}
                                >
                                    {link.icon}
                                    {link.name}
                                </Link>
                            );
                        })}
                    </nav>
                </div>

                <button 
                onClick={handleLogout}
                disabled={isLoggingOut}
                aria-label="Log out of account"
                className="mt-auto flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-[#EB3B18] hover:bg-red-50 transition-colors w-full text-left cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <LogOut size={18} />
                    {isLoggingOut ? "Logging out..." : "Log out"}
                </button>
            </aside>

            <main className="w-full">
                {children}
            </main>
            
        </div>
    );
}