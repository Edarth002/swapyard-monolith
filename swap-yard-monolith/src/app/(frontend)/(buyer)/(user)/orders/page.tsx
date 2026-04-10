"use client";

import { useState, useEffect, useMemo } from "react";
import { Search, ChevronDown, Clock, Truck, CheckCircle2, X, Loader2 } from "lucide-react";

// 1. Define Style Mappings for Tailwind v4 to see static strings
const statusBgColors: Record<string, string> = {
    PENDING_PAYMENT: "bg-orange-500",
    PAID: "bg-orange-500",
    PROCESSING: "bg-orange-500",
    SHIPPED: "bg-green-500",
    DELIVERED: "bg-blue-500",
    COMPLETED: "bg-blue-500",
    CANCELLED: "bg-gray-500",
};

// 2. Define Progress Mapping (1: Processed, 2: Shipped, 3: Delivered)
const getProgress = (status: string) => {
    if (["PENDING_PAYMENT", "PAID", "PROCESSING"].includes(status)) return 1;
    if (status === "SHIPPED") return 2;
    if (["DELIVERED", "COMPLETED", "BUYER_CONFIRMED"].includes(status)) return 3;
    return 0;
};

export default function OrdersPage() {
    const [orders, setOrders] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("All");

    // 3. Fetch Real Orders from Backend
    useEffect(() => {
        const fetchOrders = async () => {
            try {
                const res = await fetch("/api/orders?scope=buyer&limit=50");
                const data = await res.json();
                if (data.ok) {
                    setOrders(data.items);
                }
            } catch (error) {
                console.error("Failed to fetch orders:", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchOrders();
    }, []);

    const filteredOrders = useMemo(() => {
        return orders.filter(order => {
            const title = order.items[0]?.listingName || "";
            const matchesSearch = title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                                 order.id.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesStatus = statusFilter === "All" || order.status === statusFilter;
            return matchesSearch && matchesStatus;
        });
    }, [searchQuery, statusFilter, orders]);

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat("en-NG", {
            style: "currency",
            currency: "NGN",
            minimumFractionDigits: 0,
        }).format(price);
    };

    // --- REFINED LOADING UI ---
    if (isLoading) {
        return (
            <div className="fixed inset-0 flex flex-col items-center justify-center pointer-events-none">
                {/* The wrapper below ensures we offset the sidebar width visually */}
                <div className="flex flex-col items-center justify-center md:ml-64"> 
                    <Loader2 className="w-12 h-12 text-[#EB3B18] animate-spin mb-4" />
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] animate-pulse">
                        Loading your orders
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-4 md:p-8 lg:p-12 max-w-6xl mx-auto w-full">
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                    Orders <span className="text-sm font-medium text-gray-500">({filteredOrders.length} items)</span>
                </h1>
            </div>

            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                <div className="relative w-full md:w-[500px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input 
                        type="text" 
                        placeholder="Search for Order ID or Item name" 
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
                    <div className="relative">
                        <select
                            aria-label="Filter option"
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="appearance-none flex items-center gap-2 px-4 py-2 pr-10 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors cursor-pointer focus:outline-none focus:border-[#EB3B18]"
                        >
                            <option value="All">All Statuses</option>
                            <option value="PENDING_PAYMENT">Pending</option>
                            <option value="SHIPPED">Shipped</option>
                            <option value="DELIVERED">Delivered</option>
                        </select>
                        <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500" />
                    </div>
                </div>
            </div>

            <div className="flex flex-col gap-6">
                {filteredOrders.length > 0 ? filteredOrders.map((order) => {
                    const firstItem = order.items[0];
                    const progressNum = getProgress(order.status);
                    const statusColorClass = statusBgColors[order.status] || "bg-gray-500";

                    return (
                        <div key={order.id} className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm border border-gray-100 flex flex-col md:flex-row gap-6 transition-all min-h-[220px]">
                            <div className="relative w-40 h-40 md:h-auto rounded-xl overflow-hidden shrink-0 bg-gray-100 border border-gray-200">
                                <div className="absolute top-2 left-2 bg-white/90 backdrop-blur-sm px-2.5 py-1 rounded-md z-10 text-[10px] font-extrabold text-gray-800 shadow-sm border border-white/20">
                                    #{order.id.slice(-6).toUpperCase()}
                                </div>
                                <img 
                                    src={firstItem?.listing?.images[0]?.url || "https://placehold.co/400"} 
                                    alt={firstItem?.listingName} 
                                    className="w-full h-full object-cover" 
                                />
                            </div>

                            <div className="flex-1 flex flex-col justify-between py-1 min-w-0">
                                <div className="mb-4">
                                    <h3 className="text-base font-bold text-gray-900 mb-1 truncate">{firstItem?.listingName}</h3>
                                    <p className="text-xs text-gray-500 mb-6">Sold by <span className="font-semibold text-gray-700">{firstItem?.seller?.firstname}</span></p>
                                    
                                    <div className="relative flex items-center justify-between w-full max-w-sm mb-6">
                                        <div className="absolute top-4 left-4 right-4 h-0.5 bg-gray-100 -z-10"></div>
                                        
                                        <div className="flex flex-col items-center gap-2">
                                            <div className={`w-9 h-9 rounded-full flex items-center justify-center shadow-md bg-orange-500 text-white ${progressNum === 1 ? 'animate-pulse ring-4 ring-orange-500/20' : ''}`}>
                                                <Clock size={18} />
                                            </div>
                                            <span className="text-[10px] font-bold uppercase tracking-tight text-gray-900">Ordered</span>
                                        </div>

                                        <div className="flex flex-col items-center gap-2">
                                            <div className={`w-9 h-9 rounded-full flex items-center justify-center shadow-md bg-green-500 text-white ${progressNum === 2 ? 'animate-pulse ring-4 ring-green-500/20' : ''}`}>
                                                <Truck size={18} />
                                            </div>
                                            <span className="text-[10px] font-bold uppercase tracking-tight text-gray-900">Shipped</span>
                                        </div>

                                        <div className="flex flex-col items-center gap-2">
                                            <div className={`w-9 h-9 rounded-full flex items-center justify-center shadow-md bg-blue-500 text-white ${progressNum === 3 ? 'animate-pulse ring-4 ring-blue-500/20' : ''}`}>
                                                <CheckCircle2 size={18} />
                                            </div>
                                            <span className="text-[10px] font-bold uppercase tracking-tight text-gray-900">Delivered</span>
                                        </div>
                                    </div>

                                    <button className="px-5 py-2 text-xs font-bold text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors shadow-sm cursor-pointer">
                                        Message Seller
                                    </button>
                                </div>
                            </div>

                            <div className="flex flex-row md:flex-col gap-3 justify-between items-center md:items-end shrink-0 md:w-32 lg:w-40 border-t md:border-t-0 md:border-l border-gray-100 pt-4 md:pt-0 md:pl-4 lg:pl-6">
                                <span className="text-xl font-black text-gray-900 tracking-tight">
                                    {formatPrice(order.totalAmount)}
                                </span>
                                
                                <div className={`px-4 py-1.5 rounded-full text-[10px] font-extrabold uppercase tracking-widest mt-2 md:mt-auto text-white shadow-sm ${statusColorClass}`}>
                                    {order.status.replace('_', ' ')}
                                </div>
                            </div>
                        </div>
                    );
                }) : (
                    <div className="text-center py-20 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                        <p className="text-gray-500 font-medium">No orders found.</p>
                    </div>
                )}
            </div>
        </div>
    );
}