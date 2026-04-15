"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";

interface LogoProps {
    forceBlackTheme?: boolean; 
}

export default function Logo({ forceBlackTheme }: LogoProps) {
    const pathname = usePathname();

    const authPages = ["/login", "/signup", "/verify", "/forgot-password", "/auth/login", "/auth/signup"];
    
    const useBlackTheme = forceBlackTheme !== undefined 
        ? forceBlackTheme 
        : (authPages.some(page => pathname?.startsWith(page)) || pathname?.startsWith("/seller") || pathname?.startsWith("/listings"));

    return (
        <Link href="/" className="flex items-center gap-2">
            <div className="w-7.5 h-7.5 relative flex items-center justify-center"> 
                <Image 
                    src={useBlackTheme ? "/assets/icons/swapyard-logo-black.svg" : "/assets/icons/swapyard-logo.svg"} 
                    alt="SwapYard Logo" 
                    width={52} 
                    height={52}
                    className="object-contain"
                    priority 
                />
            </div>
            <span 
                className={`font-bold text-lg md:text-2xl leading-[33.97px] transition-colors duration-300 ${
                    useBlackTheme ? "text-gray-900" : "text-white"
                }`}
            >
                SwapYard
            </span>
        </Link>
    );
}