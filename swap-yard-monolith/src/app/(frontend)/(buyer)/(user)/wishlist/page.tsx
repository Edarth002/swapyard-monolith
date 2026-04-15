"use client";

import { useState, useMemo, useEffect } from "react";
import { Search, Loader2, Heart, Star, MapPin, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useWishlist } from "@/app/context/WishlistContext";
import toast from "react-hot-toast";

export default function WishlistPage() {
    // 1. Hook into the Wishlist Context
    const { wishlistItems, removeFromWishlist } = useWishlist();
    
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");

    // Simulate a brief loading state for smoother entry, matching your Orders page style
    useEffect(() => {
        const timer = setTimeout(() => setIsLoading(false), 800);
        return () => clearTimeout(timer);
    }, []);

    // 2. Filter items based on the search query
    const filteredItems = useMemo(() => {
        return wishlistItems.filter(item =>
            item.title.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [searchQuery, wishlistItems]);

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat("en-NG", {
            style: "currency",
            currency: "NGN",
            minimumFractionDigits: 0,
        }).format(price);
    };

    const handleRemove = (id: string) => {
        removeFromWishlist(id);
        toast.success("Removed from wishlist");
    };

    if (isLoading) {
        return (
            <div className="fixed inset-0 flex flex-col items-center justify-center pointer-events-none">
                <div className="flex flex-col items-center justify-center md:ml-64"> 
                    <Loader2 className="w-12 h-12 text-[#EB3B18] animate-spin mb-4" />
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] animate-pulse">
                        Loading your wishlist
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-4 md:p-8 lg:p-12 max-w-7xl mx-auto w-full">
            {/* Page Header */}
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                    Wishlist <span className="text-sm font-medium text-gray-500">({filteredItems.length} items)</span>
                </h1>
            </div>

            {/* Search Bar */}
            <div className="relative w-full md:w-[500px] mb-10">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input 
                    type="text" 
                    placeholder="Search your wishlist" 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#EB3B18] transition-all"
                />
            </div>

            {/* Product Grid - Matches the layout in your provided image */}
            {filteredItems.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-6 gap-y-10">
                    {filteredItems.map((item) => (
                        <div key={item.id} className="group flex flex-col bg-white rounded-xl overflow-hidden relative shadow-2xs border border-[#0000001A]">
                            
                            {/* Image Section */}
                            <div className="relative aspect-square w-full bg-gray-100 rounded-t-xl overflow-hidden">
                                <img 
                                    src={item.imageUrl} 
                                    alt={item.title}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                />
                                
                                {/* Badges: Top Left */}
                                <div className="absolute top-3 left-3 flex flex-col gap-1.5">
                                    <span className="bg-white/90 backdrop-blur-sm px-2.5 py-1 rounded-md text-[10px] font-bold text-gray-800 shadow-sm border border-white/20">
                                        Barely Used
                                    </span>
                                    <span className="bg-white/90 backdrop-blur-sm px-2.5 py-1 rounded-md text-[10px] font-bold text-gray-800 shadow-sm flex items-center gap-1 border border-white/20">
                                        <ShieldCheck size={12} className="text-green-600" /> Verified
                                    </span>
                                </div>

                                {/* Remove Button: Top Right */}
                                <button
                                    aria-label="Favourite option"
                                    onClick={() => handleRemove(item.id)}
                                    className="absolute top-3 right-3 p-2 bg-white rounded-full text-[#EB3B18] shadow-sm hover:scale-110 transition-transform cursor-pointer"
                                >
                                    <Heart size={16} fill="currentColor" />
                                </button>
                            </div>

                            {/* Content Section */}
                            <div className="p-4 flex flex-col flex-grow">
                                <div className="flex justify-between items-start mb-1">
                                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                        FURNITURE
                                    </span>
                                    <div className="flex items-center text-[10px] font-bold text-gray-600">
                                        <Star size={12} className="text-yellow-400 fill-yellow-400 mr-1" />
                                        {item.rating?.toFixed(1) || "4.0"} ({item.reviewsCount || "12"})
                                    </div>
                                </div>

                                <h3 className="font-bold text-sm text-gray-800 leading-tight mb-2 line-clamp-2 min-h-[2.5rem]">
                                    {item.title}
                                </h3>

                                <div className="flex items-center text-[10px] text-gray-400 mb-4">
                                    <MapPin size={12} className="mr-1" />
                                    {item.location || "Lagos, Gbagada"}
                                </div>

                                {/* Bottom Row: Price & Button */}
                                <div className="mt-auto pt-3 border-t border-gray-100 flex items-center justify-between">
                                    <span className="text-lg font-black text-[#1A1A1A] tracking-tight">
                                        {formatPrice(item.price)}
                                    </span>
                                    <Link 
                                        href={`/listings/${item.id}`}
                                        className="px-4 py-2 border border-gray-900 rounded-lg text-[10px] font-bold text-gray-900 hover:bg-gray-900 hover:text-white transition-all cursor-pointer"
                                    >
                                        View Listing
                                    </Link>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-24 border-2 border-dashed border-gray-100 rounded-2xl">
                    <p className="text-gray-400 font-medium">Your wishlist is currently empty.</p>
                    <Link href="/listings" className="mt-4 inline-block text-[#EB3B18] font-bold text-sm hover:underline">
                        Start Shopping
                    </Link>
                </div>
            )}
        </div>
    );
}