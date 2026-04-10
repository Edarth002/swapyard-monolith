"use client";

import { useState, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { Menu, ShoppingCart, Bell, User, X, Trash2, Minus, Plus, Package, Mail, Heart, Ticket } from "lucide-react"; 
import Link from "next/link";
import Logo from "@/components/ui/Logo";
import { useCart } from "@/app/context/CartContext"; // <-- Imported Global Cart State

interface NavbarProps {
    onOpenSidebar: () => void;
}

interface UserData {
    image?: string; 
    firstname?: string;
    lastname?: string;
    email?: string;
}

export const Navbar = ({ onOpenSidebar }: NavbarProps) => {
    const pathname = usePathname();
    const isLandingPage = pathname === "/";
    const [isScrolled, setIsScrolled] = useState(false);
    
    // Dropdown States & Refs
    const [isCartOpen, setIsCartOpen] = useState(false); 
    const [isAvatarOpen, setIsAvatarOpen] = useState(false); 
    const [isNotificationOpen, setIsNotificationOpen] = useState(false); 
    
    const cartRef = useRef<HTMLDivElement>(null); 
    const avatarRef = useRef<HTMLDivElement>(null); 
    const notificationRef = useRef<HTMLDivElement>(null); 

    const [user, setUser] = useState<UserData | null>(null);
    const [authChecked, setAuthChecked] = useState(false);

    // --- Access Global Cart State ---
    const { cartItems, cartCount, cartTotal, removeFromCart, updateQuantity } = useCart();

    // --- Authentication Check ---
    useEffect(() => {
        const checkAuth = async () => {
            try {
                const res = await fetch("/api/auth/me", { method: "GET" });
                if (res.ok) {
                    const data = await res.json();
                    setUser(data.user);
                } else {
                    setUser(null);
                }
            } catch {
                setUser(null);
            } finally {
                setAuthChecked(true);
            }
        };

        checkAuth();
    }, []);

    // --- Scroll Listener ---
    useEffect(() => {
        const handleScroll = () => setIsScrolled(window.scrollY > 50);
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    // --- Click Outside to Close Dropdowns ---
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            // Close Cart if clicked outside
            if (cartRef.current && !cartRef.current.contains(event.target as Node)) {
                setIsCartOpen(false);
            }
            // Close Avatar Menu if clicked outside
            if (avatarRef.current && !avatarRef.current.contains(event.target as Node)) {
                setIsAvatarOpen(false);
            }
            // Close Notification Menu if clicked outside
            if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
                setIsNotificationOpen(false);
            }
        };

        if (isCartOpen || isAvatarOpen || isNotificationOpen) {
            document.addEventListener("mousedown", handleClickOutside);
        }
        
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [isCartOpen, isAvatarOpen, isNotificationOpen]);

    // Determines if we should show the transparent landing page style or the white app style
    const isTransparent = isLandingPage && !isScrolled;
    
    const navThemeClass = isTransparent
        ? "bg-transparent/10 backdrop-blur-sm py-4 text-white"
        : "bg-white shadow-sm border-b border-gray-100 py-3 text-gray-800";

    const isAuth = user !== null;

    // --- LOGIC TO HIDE NAVBAR ON SPECIFIC PAGES ---
    const hiddenRoutes = ["/auth/login", "/auth/signup", "/auth/verify", "/seller/verify"];
    const shouldHideNavbar = hiddenRoutes.some(route => pathname?.startsWith(route));

    if (shouldHideNavbar) {
        return null;
    }

    const navPositionClass = isLandingPage ? "fixed" : "sticky";

    return (
        <nav
            className={`${navPositionClass} w-full z-30 top-0 transition-all duration-300 ${navThemeClass}`}
            aria-label="Main Navigation"
        >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center">
                
                {/* Left Side: Mobile Menu & Logo */}
                <div className="flex items-center gap-4">
                    <button className="md:hidden text-inherit cursor-pointer" onClick={onOpenSidebar} aria-label="Open main menu">
                        <Menu className="w-6 h-6" />
                    </button>
                    <Logo forceBlackTheme={!isTransparent} />
                </div>

                {/* Center Links (Desktop Only) */}
                <div className="hidden lg:flex gap-8 items-center text-sm font-semibold">
                    <Link href="/listings" className="text-[#EB3B18] transition-colors cursor-pointer">Browse</Link>
                    <Link href="/seller" className="hover:text-[#EB3B18] transition-colors cursor-pointer">Sell Items</Link>
                    <Link href="/getting-started" className="hover:text-[#EB3B18] transition-colors cursor-pointer">Getting Started</Link>
                    <Link href="/categories" className="hover:text-[#EB3B18] transition-colors cursor-pointer">Categories</Link>
                </div>

                {/* Right Side Controls */}
                {!authChecked ? (
                    <div className="flex gap-3 opacity-70">
                        <span className="px-4 py-2">…</span>
                    </div>
                ) : isAuth ? (
                    <div className="flex items-center gap-4 md:gap-5 relative">
                        
                        {/* Cart Dropdown Wrapper */}
                        <div className="relative" ref={cartRef}>
                            <button 
                                onClick={() => {
                                    setIsCartOpen(!isCartOpen);
                                    setIsAvatarOpen(false); 
                                    setIsNotificationOpen(false);
                                }}
                                aria-label="Toggle Cart" 
                                className="hover:text-[#EB3B18] text-gray-500 transition-colors relative flex items-center cursor-pointer"
                            >
                                <ShoppingCart size={20} />
                                {cartCount > 0 && (
                                    <span className="absolute -top-1.5 -right-1 bg-[#EB3B18] text-white text-[9px] font-extrabold w-3.5 h-3.5 rounded-full flex items-center justify-center ring-2 ring-white">
                                        {cartCount}
                                    </span>
                                )}
                            </button>

                            {/* Cart Dropdown Menu */}
                            {isCartOpen && (
                                <div className={`absolute right-0 sm:-right-10 md:right-0 top-full mt-4 z-50 animate-in fade-in zoom-in-95 duration-200`}>
                                    <div className={`${cartItems.length === 0 ? "w-64" : "w-[340px] md:w-[400px]"} bg-white rounded-2xl shadow-xl border border-gray-100 flex flex-col overflow-hidden text-left`}>
                                        {/* Header */}
                                        <div className="flex justify-between items-center p-4 border-b border-gray-100">
                                            <h3 className="font-extrabold text-gray-900 text-lg">Shopping Cart</h3>
                                            <button 
                                                onClick={() => setIsCartOpen(false)} 
                                                className="text-gray-500 hover:text-gray-900 transition-colors p-1 cursor-pointer"
                                                aria-label="Close cart"
                                            >
                                                <X className="w-5 h-5" />
                                            </button>
                                        </div>
                                        
                                        {/* Item List */}
                                        <div className="p-4 flex flex-col gap-3 max-h-[50vh] overflow-y-auto">
                                            {cartItems.length === 0 ? (
                                                <p className="text-sm text-gray-500 text-center py-4">Your cart is empty.</p>
                                            ) : (
                                                cartItems.map((item) => (
                                                    <div key={item.id} className="flex items-center gap-3 p-3 border border-gray-200 rounded-xl bg-white">
                                                        <div className="relative w-16 h-16 rounded-lg overflow-hidden shrink-0 bg-gray-100">
                                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                                            <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover absolute inset-0" />
                                                        </div>
                                                        <div className="flex flex-col flex-1 min-w-0 justify-center">
                                                            <h4 className="text-[13px] font-medium text-gray-900 truncate mb-1">{item.title}</h4>
                                                            <span className="text-sm font-bold text-[#EB3B18]">
                                                                {new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", minimumFractionDigits: 0 }).format(item.price)}
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center gap-3 shrink-0">
                                                            <div className="flex items-center gap-2 text-gray-700">
                                                                <button 
                                                                    onClick={() => updateQuantity(item.id, "decrease")}
                                                                    aria-label={`Decrease quantity for ${item.title}`}
                                                                    className="hover:text-gray-900 cursor-pointer p-0.5"
                                                                >
                                                                    <Minus className="w-3.5 h-3.5" />
                                                                </button>
                                                                <span className="text-sm font-bold w-3 text-center" aria-live="polite">
                                                                    {item.quantity}
                                                                </span>
                                                                <button 
                                                                    onClick={() => updateQuantity(item.id, "increase")}
                                                                    aria-label={`Increase quantity for ${item.title}`}
                                                                    className="hover:text-gray-900 cursor-pointer p-0.5"
                                                                >
                                                                    <Plus className="w-3.5 h-3.5" />
                                                                </button>
                                                            </div>
                                                            <button 
                                                                onClick={() => removeFromCart(item.id)}
                                                                className="text-[#EB3B18] hover:text-[#d93616] ml-2 cursor-pointer p-1" 
                                                                aria-label={`Remove ${item.title} from cart`}
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))
                                            )}
                                        </div>

                                        {/* Footer / Total Area (Only renders if cart has items) */}
                                        {cartItems.length > 0 && (
                                            <div className="p-4 border-t border-gray-100 bg-white">
                                                <div className="flex justify-between items-center mb-4 px-1">
                                                    <span className="font-bold text-gray-900 text-base">Total:</span>
                                                    <span className="font-extrabold text-[#EB3B18] text-2xl tracking-tight">
                                                        {new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", minimumFractionDigits: 0 }).format(cartTotal)}
                                                    </span>
                                                </div>
                                                <Link 
                                                    href="/checkout"
                                                    onClick={() => setIsCartOpen(false)}
                                                    className="w-full bg-[#EB3B18] hover:bg-[#d93616] text-white font-bold py-3.5 rounded-xl flex items-center justify-center text-sm transition-colors shadow-sm cursor-pointer"
                                                >
                                                    Proceed to Checkout
                                                </Link>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Notification Dropdown Wrapper */}
                        <div className="" ref={notificationRef}>
                            <button 
                                onClick={() => {
                                    setIsNotificationOpen(!isNotificationOpen);
                                    setIsCartOpen(false); 
                                    setIsAvatarOpen(false); 
                                }}
                                aria-label="Toggle Notifications" 
                                className="hover:text-[#EB3B18] text-gray-500 transition-colors relative flex items-center cursor-pointer"
                            >
                                <Bell size={20} />
                                {/* Dummy Notification Badge */}
                                <span className="absolute -top-1.5 -right-1 bg-[#EB3B18] text-white text-[9px] font-extrabold w-3.5 h-3.5 rounded-full flex items-center justify-center ring-2 ring-white">
                                    3
                                </span>
                            </button>

                            {/* Notification Dropdown Menu (Matched identically to Cart Dropdown sizing/positioning) */}
                            {isNotificationOpen && (
                                <div className="absolute right-0 sm:-right-10 md:right-0 top-full mt-4 z-50 animate-in fade-in zoom-in-95 duration-200">
                                    
                                    <div className="w-85 bg-white rounded-2xl shadow-xl border border-gray-100 flex flex-col overflow-hidden text-left">
                                        <div className="flex justify-between items-center p-4 border-b border-gray-100">
                                            <h3 className="font-extrabold text-gray-900 text-lg">Notifications</h3>
                                            <button 
                                                onClick={() => setIsNotificationOpen(false)} 
                                                className="text-gray-500 hover:text-gray-900 transition-colors p-1 cursor-pointer"
                                                aria-label="Close notifications"
                                            >
                                                <X className="w-5 h-5" />
                                            </button>
                                        </div>
                                        
                                        <div className="p-2 flex flex-col max-h-[50vh] overflow-y-auto">
                                            {/* Dummy Notification 1 (Unread) */}
                                            <div className="flex gap-3 p-3 hover:bg-gray-50 rounded-xl transition-colors cursor-pointer border-l-2 border-[#EB3B18] bg-orange-50/30">
                                                <div className="mt-0.5 bg-orange-100 p-2 rounded-full shrink-0 h-fit">
                                                    <Package className="w-4 h-4 text-[#EB3B18]" />
                                                </div>
                                                <div className="flex flex-col">
                                                    <h4 className="text-[13px] font-bold text-gray-900 mb-0.5">Order Shipped</h4>
                                                    <p className="text-xs text-gray-600 line-clamp-2">Your recent order for "Luxurious White Leather Sofa" has been shipped.</p>
                                                    <span className="text-[10px] font-semibold text-gray-400 mt-1">2 hours ago</span>
                                                </div>
                                            </div>

                                            {/* Dummy Notification 2 */}
                                            <div className="flex gap-3 p-3 hover:bg-gray-50 rounded-xl transition-colors cursor-pointer">
                                                <div className="mt-0.5 bg-blue-50 p-2 rounded-full shrink-0 h-fit">
                                                    <Mail className="w-4 h-4 text-blue-600" />
                                                </div>
                                                <div className="flex flex-col">
                                                    <h4 className="text-[13px] font-bold text-gray-900 mb-0.5">New Message</h4>
                                                    <p className="text-xs text-gray-600 line-clamp-2">Olajide sent you a message regarding your inquiry.</p>
                                                    <span className="text-[10px] font-semibold text-gray-400 mt-1">5 hours ago</span>
                                                </div>
                                            </div>

                                            {/* Dummy Notification 3 */}
                                            <div className="flex gap-3 p-3 hover:bg-gray-50 rounded-xl transition-colors cursor-pointer">
                                                <div className="mt-0.5 bg-gray-100 p-2 rounded-full shrink-0 h-fit">
                                                    <Heart className="w-4 h-4 text-gray-600" />
                                                </div>
                                                <div className="flex flex-col">
                                                    <h4 className="text-[13px] font-medium text-gray-900 mb-0.5">Item Price Drop</h4>
                                                    <p className="text-xs text-gray-500 line-clamp-2">An item in your wishlist has a new lower price.</p>
                                                    <span className="text-[10px] font-semibold text-gray-400 mt-1">1 day ago</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="p-3 border-t border-gray-100 bg-gray-50">
                                            <Link 
                                                href="/notifications" 
                                                onClick={() => setIsNotificationOpen(false)} 
                                                className="block w-full text-center text-xs font-bold text-[#EB3B18] hover:underline cursor-pointer"
                                            >
                                                View all notifications
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                        
                        {/* Start Selling Button - Hidden on Mobile */}
                        <Link
                            href="/seller/dashboard"
                            className="hidden md:block px-4 py-2 bg-[#EB3B18] text-white rounded-md text-sm font-bold hover:bg-[#bf360c] transition-colors shadow-sm ml-2 cursor-pointer"
                        >
                            Start Selling
                        </Link>

                        {/* User Avatar Dropdown Wrapper */}
                        <div className="relative ml-1 md:ml-2" ref={avatarRef}>
                            <button 
                                onClick={() => {
                                    setIsAvatarOpen(!isAvatarOpen);
                                    setIsCartOpen(false); 
                                    setIsNotificationOpen(false);
                                }}
                                aria-label="User Menu" 
                                className="cursor-pointer block"
                            >
                                <div className="w-8 h-8 md:w-9 md:h-9 rounded-full overflow-hidden border border-gray-200 hover:border-[#EB3B18] transition-all flex items-center justify-center bg-gray-50 text-gray-400">
                                    {user?.image ? (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img 
                                            src={user.image} 
                                            alt="Profile Avatar" 
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <User size={18} />
                                    )}
                                </div>
                            </button>

                            {/* Avatar Dropdown Menu */}
                            {isAvatarOpen && (
                                <div className="absolute right-0 top-full mt-3 w-64 bg-white rounded-xl shadow-lg border border-gray-100 z-50 animate-in fade-in zoom-in-95 duration-200 flex flex-col overflow-hidden text-left">
                                    
                                    <Link 
                                        href="/profile" 
                                        onClick={() => setIsAvatarOpen(false)}
                                        className="flex items-center gap-3 px-4 py-3.5 text-gray-800 hover:bg-gray-50 border-b border-gray-50 font-semibold transition-colors"
                                    >
                                        <User className="w-4 h-4 text-gray-600" /> My Account
                                    </Link>
                                    
                                    <Link 
                                        href="/orders" 
                                        onClick={() => setIsAvatarOpen(false)}
                                        className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-50 transition-colors text-sm"
                                    >
                                        <Package className="w-4 h-4 text-gray-600" /> Orders
                                    </Link>
                                    
                                    <Link 
                                        href="/inbox" 
                                        onClick={() => setIsAvatarOpen(false)}
                                        className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-50 transition-colors text-sm"
                                    >
                                        <Mail className="w-4 h-4 text-gray-600" /> Inbox
                                    </Link>
                                    
                                    <Link 
                                        href="/wishlist" 
                                        onClick={() => setIsAvatarOpen(false)}
                                        className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-50 transition-colors text-sm"
                                    >
                                        <Heart className="w-4 h-4 text-gray-600" /> Wishlist
                                    </Link>

                                    <Link 
                                        href="/vouchers" 
                                        onClick={() => setIsAvatarOpen(false)}
                                        className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-50 border-b border-gray-50 transition-colors text-sm"
                                    >
                                        <Ticket className="w-4 h-4 text-gray-600" /> Voucher
                                    </Link>
                                    
                                    <button 
                                        onClick={() => {
                                            setIsAvatarOpen(false);
                                            // Add actual logout logic here later
                                        }}
                                        className="w-full text-center px-4 py-3.5 text-[#EB3B18] font-bold hover:bg-gray-50 transition-colors text-sm cursor-pointer"
                                    >
                                        Logout
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="hidden md:flex gap-3 items-center">
                        <Link href="/auth/login" className="px-4 py-2 font-medium hover:text-[#EB3B18] transition-colors cursor-pointer">
                            Log In
                        </Link>
                        <Link
                            href="/auth/signup"
                            className="px-5 py-2 bg-[#EB3B18] text-white rounded-md font-bold hover:bg-[#bf360c] transition-colors shadow-sm cursor-pointer"
                        >
                            Sign Up
                        </Link>
                    </div>
                )}
            </div>
        </nav>
    );
};