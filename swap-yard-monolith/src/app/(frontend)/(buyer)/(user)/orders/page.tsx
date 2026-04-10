"use client";

import React, { useState } from "react";
import { Search, Filter, ChevronDown, Clock, Truck, CheckCircle2, X } from "lucide-react";

// Mock data based exactly on your design
const MOCK_ORDERS = [
    {
        id: "ORD-1234",
        title: "Mid-Century Modern Blue Accent Chair",
        seller: "Fine Home living",
        price: 85000,
        status: "Shipped",
        progress: 2, // 1: Placed, 2: Shipped, 3: Delivered
        image: "https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?auto=format&fit=crop&q=80&w=400"
    },
    {
        id: "ORD-1235",
        title: "Ceramic Modern Vases Set of 3 different colors",
        seller: "Fine Home living",
        price: 85000,
        status: "Delivered",
        progress: 3,
        image: "https://images.unsplash.com/photo-1612152605347-f8e1781eb509?auto=format&fit=crop&q=80&w=400"
    },
    {
        id: "ORD-1236",
        title: "Minimalist armless office chair.",
        seller: "Fine Home living",
        price: 85000,
        status: "Ordered",
        progress: 1,
        image: "https://images.unsplash.com/photo-1505843490538-5133c6c7d0e1?auto=format&fit=crop&q=80&w=400"
    }
];

export default function OrdersPage() {
    const [searchQuery, setSearchQuery] = useState("");

    // Format price to Naira
    const formatPrice = (price: number) => {
        return new Intl.NumberFormat("en-NG", {
            style: "currency",
            currency: "NGN",
            minimumFractionDigits: 0,
        }).format(price);
    };

    return (
        <div className="p-4 md:p-8 lg:p-12 max-w-6xl mx-auto w-full">
            
            {/* Page Header */}
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                    Orders <span className="text-sm font-medium text-gray-500">({MOCK_ORDERS.length} items)</span>
                </h1>
            </div>

            {/* Search and Filters Bar */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                <div className="relative w-120">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input 
                        type="text" 
                        placeholder="Search for Saved items" 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#EB3B18] focus:ring-1 focus:ring-[#EB3B18] transition-all"
                    />
                </div>
                
                <div className="flex items-center gap-4 w-full md:w-auto">
                    <div className="flex items-center gap-2 text-sm font-medium text-gray-600">
                        <span className="text-xs text-gray-400 uppercase tracking-wider">SORT BY:</span>
                        <button className="flex items-center gap-1 hover:text-gray-900 transition-colors cursor-pointer">
                            Newest <ChevronDown size={16} />
                        </button>
                    </div>
                    <button className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors cursor-pointer">
                        <Filter size={16} /> Filters
                    </button>
                </div>
            </div>

            {/* Active Filter Tags */}
            <div className="flex flex-wrap items-center gap-2 mb-8">
                {["Furniture", "Used", "Delivery Available"].map((tag) => (
                    <span key={tag} className="flex items-center gap-1.5 px-3 py-1 bg-gray-100 border border-gray-200 text-xs font-medium text-gray-700 rounded-md">
                        {tag}
                        <button aria-label={`Remove ${tag} filter`} className="hover:text-[#EB3B18] transition-colors cursor-pointer">
                            <X size={12} />
                        </button>
                    </span>
                ))}
                <button className="text-xs font-bold text-gray-900 hover:text-[#EB3B18] ml-2 transition-colors underline decoration-gray-300 underline-offset-4 cursor-pointer">
                    Clear All Filters
                </button>
            </div>

            {/* ORDER CARDS LIST */}
            <div className="flex flex-col gap-6">
                {MOCK_ORDERS.map((order) => (
                    <div key={order.id} className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm border border-gray-100 flex flex-col md:flex-row gap-6 transition-all">
                        
                        {/* Product Image with Overlay ID */}
                        {/* CHANGED: h-48 changed to w-32 h-32 md:w-40 md:h-40 to make it a perfect, smaller square */}
                        <div className="relative w-32 h-32 md:w-40 md:h-40 rounded-xl overflow-hidden shrink-0 bg-gray-100 border border-gray-200">
                            <div className="absolute top-2 left-2 bg-white/90 backdrop-blur-sm px-2.5 py-1 rounded-md z-10 text-[10px] font-extrabold text-gray-800 shadow-sm border border-white/20">
                                #{order.id}
                            </div>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            {/* CHANGED: Added w-full so the image fills the new square boundaries */}
                            <img src={order.image} alt={order.title} className="w-full h-full object-cover" />
                        </div>

                        {/* Middle Content: Details & Timeline */}
                        <div className="flex-1 flex flex-col justify-between py-1 min-w-0">
                            <div className="mb-4 lg:mb-0">
                                <h3 className="text-base font-bold text-gray-900 mb-1 truncate">{order.title}</h3>
                                <p className="text-xs text-gray-500 mb-6">Sold by <span className="font-semibold text-gray-700">{order.seller}</span></p>
                                
                                {/* Custom Order Progress Timeline */}
                                <div className="relative flex items-center justify-between w-full max-w-sm mb-6">
                                    {/* Connecting Background Line */}
                                    <div className="absolute top-4 left-4 right-4 h-0.5 bg-gray-100 -z-10"></div>
                                    
                                    {/* Step 1: Ordered */}
                                    <div className="flex flex-col items-center gap-2">
                                        <div className={`w-9 h-9 rounded-full flex items-center justify-center transition-all duration-300 shadow-md ${order.progress >= 1 ? 'bg-gray-400 text-white' : 'bg-gray-100 text-gray-400 border border-gray-200'} ${order.progress === 1 ? 'animate-pulse ring-4 ring-orange-500/30' : ''}`}>
                                            <Clock size={18} />
                                        </div>
                                        <span className={`text-xs font-bold uppercase tracking ${order.progress >= 1 ? 'text-gray-900' : 'text-gray-400'}`}>Order placed</span>
                                    </div>

                                    {/* Step 2: Shipped */}
                                    <div className="flex flex-col items-center gap-2">
                                        <div className={`w-9 h-9 rounded-full flex items-center justify-center transition-all duration-300 shadow-md ${order.progress >= 2 ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-400 border border-gray-200'} ${order.progress === 2 ? 'animate-pulse ring-4 ring-green-500/30' : ''}`}>
                                            <Truck size={18} />
                                        </div>
                                        <span className={`text-xs font-bold uppercase tracking ${order.progress >= 2 ? 'text-gray-900' : 'text-gray-400'}`}>Shipped</span>
                                    </div>

                                    {/* Step 3: Delivered */}
                                    <div className="flex flex-col items-center gap-2">
                                        <div className={`w-9 h-9 rounded-full flex items-center justify-center transition-all duration-300 shadow-md ${order.progress >= 3 ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-400 border border-gray-200'} ${order.progress === 3 ? 'animate-pulse ring-4 ring-blue-500/30' : ''}`}>
                                            <CheckCircle2 size={18} />
                                        </div>
                                        <span className={`text-xs font-bold uppercase tracking ${order.progress >= 3 ? 'text-gray-900' : 'text-gray-400'}`}>Delivered</span>
                                    </div>
                                </div>

                                <button aria-label={`Message seller for ${order.title}`} className="px-5 py-2 text-xs font-bold text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors shadow-sm cursor-pointer">
                                    Message Seller
                                </button>
                            </div>
                        </div>

                        {/* Right Content: Price & Status */}
                        <div className="flex flex-row md:flex-col gap-3 justify-between items-center md:items-end shrink-0 md:w-32 lg:w-40 border-t md:border-t-0 md:border-l border-gray-100 pt-4 md:pt-0 md:pl-4 lg:pl-6">
                            <span className="text-xl font-black text-gray-900 tracking-tight">
                                {formatPrice(order.price)}
                            </span>
                            
                            {/* Dynamic Status Badge matching design colors */}
                            <div className={`px-4 py-1.5 rounded-full text-[10px] font-extrabold uppercase tracking-widest mt-2 md:mt-auto text-white ${
                                order.progress === 1 ? 'bg-orange-500' : 
                                order.progress === 2 ? 'bg-green-500' : 
                                order.progress === 3 ? 'bg-blue-500' : 'bg-gray-500'
                            }`}>
                                {order.status}
                            </div>
                        </div>

                    </div>
                ))}
            </div>

        </div>
    );
}