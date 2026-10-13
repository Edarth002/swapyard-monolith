"use client";

import { useState } from "react";
import type { LucideIcon } from "lucide-react";
import {
    Package,
    Truck,
    PackageCheck,
    CheckCircle2,
    XCircle,
    ShieldCheck,
    ShieldAlert,
    Flag,
    Tag,
    Star,
    AlertCircle,
    Info,
} from "lucide-react";
import { useNotification } from "@/app/context/NotificationContext";

const COLORS = {
    blue: "bg-blue-100 text-[#3498DB]",
    orange: "bg-orange-100 text-[#EB3B18]",
    green: "bg-green-100 text-[#2ECC71]",
    red: "bg-red-100 text-[#E74C3C]",
    gray: "bg-gray-100 text-gray-600",
};

interface TypeMeta {
    title: string;
    icon: LucideIcon;
    color: string;
}

const TYPE_META: Record<string, TypeMeta> = {
    ORDER_CREATED: { title: "Order Created", icon: Package, color: COLORS.blue },
    ORDER_PAID: { title: "Payment Confirmed", icon: PackageCheck, color: COLORS.green },
    ORDER_RECEIVED: { title: "New Order Received", icon: Package, color: COLORS.blue },
    ORDER_SHIPPED: { title: "Order Shipped", icon: Truck, color: COLORS.blue },
    ORDER_DELIVERED: { title: "Order Delivered", icon: PackageCheck, color: COLORS.green },
    ORDER_COMPLETED: { title: "Order Completed", icon: CheckCircle2, color: COLORS.green },
    ORDER_CANCELLED: { title: "Order Cancelled", icon: XCircle, color: COLORS.red },
    VERIFICATION_APPROVED: { title: "Account Verified", icon: ShieldCheck, color: COLORS.green },
    VERIFICATION_REJECTED: { title: "Verification Rejected", icon: ShieldAlert, color: COLORS.red },
    REPORT_UNDER_REVIEW: { title: "Report Under Review", icon: Flag, color: COLORS.orange },
    REPORT_RESOLVED: { title: "Report Resolved", icon: Flag, color: COLORS.green },
    REPORT_REJECTED: { title: "Report Rejected", icon: Flag, color: COLORS.red },
    REPORT_REOPENED: { title: "Report Reopened", icon: Flag, color: COLORS.orange },
    LISTING_CREATED: { title: "Listing Created", icon: Tag, color: COLORS.orange },
    LISTING_UPDATED: { title: "Listing Updated", icon: Tag, color: COLORS.orange },
    CART_ITEM_UNAVAILABLE: { title: "Item Unavailable", icon: AlertCircle, color: COLORS.orange },
    REVIEW_RECEIVED: { title: "New Review", icon: Star, color: COLORS.orange },
};

const DEFAULT_META: TypeMeta = {
    title: "Notification",
    icon: Info,
    color: COLORS.gray,
};

function timeAgo(iso: string) {
    const seconds = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
    if (seconds < 60) return "Just now";

    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes} minute${minutes === 1 ? "" : "s"} ago`;

    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;

    const days = Math.floor(hours / 24);
    if (days < 7) return `${days} day${days === 1 ? "" : "s"} ago`;

    return new Date(iso).toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
    });
}

export default function SellerNotifications() {
    const { notifications, unreadCount, markAsRead } = useNotification();
    const [isMarkingAll, setIsMarkingAll] = useState(false);

    const handleMarkAsRead = async (id: string) => {
        try {
            await markAsRead(id);
        } catch (error) {
            console.error("Failed to mark notification as read:", error);
        }
    };

    const handleMarkAllAsRead = async () => {
        if (isMarkingAll) return;
        setIsMarkingAll(true);
        try {
            await Promise.all(
                notifications.filter((n) => !n.read).map((n) => markAsRead(n.id))
            );
        } catch (error) {
            console.error("Failed to mark all notifications as read:", error);
        } finally {
            setIsMarkingAll(false);
        }
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 md:p-8 max-w-4xl">

            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-gray-100 pb-6 mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-1">Notifications</h2>
                    <p className="text-sm text-gray-500">
                        You have <span className="font-bold text-[#EB3B18]">{unreadCount} unread</span>{" "}
                        {unreadCount === 1 ? "notification" : "notifications"}
                    </p>
                </div>

                {unreadCount > 0 && (
                    <button
                        onClick={handleMarkAllAsRead}
                        disabled={isMarkingAll}
                        className="flex items-center gap-2 px-4 py-2 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-lg text-sm font-bold transition-colors border border-gray-200 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
                    >
                        <CheckCircle2 size={16} />
                        {isMarkingAll ? "Marking…" : "Mark all as read"}
                    </button>
                )}
            </div>

            <div className="flex flex-col gap-4">
                {notifications.length > 0 ? (
                    notifications.map((notification) => {
                        const meta = TYPE_META[notification.type] ?? DEFAULT_META;
                        const Icon = meta.icon;
                        const unread = !notification.read;

                        return (
                            <div
                                key={notification.id}
                                onClick={() => {
                                    if (unread) handleMarkAsRead(notification.id);
                                }}
                                className={`relative flex items-start gap-4 p-4 rounded-xl border transition-colors cursor-pointer ${
                                    unread
                                        ? "bg-blue-50/50 border-blue-100 hover:bg-blue-50"
                                        : "bg-white border-gray-100 hover:bg-gray-50"
                                }`}
                            >
                                {unread && (
                                    <div className="absolute top-6 right-6 w-2.5 h-2.5 bg-[#EB3B18] rounded-full shadow-sm"></div>
                                )}

                                <div className={`shrink-0 w-12 h-12 rounded-full flex items-center justify-center ${meta.color}`}>
                                    <Icon size={20} />
                                </div>

                                <div className="flex-1 pr-6">
                                    <div className="flex justify-between items-start mb-1">
                                        <h3 className={`text-sm ${unread ? "font-bold text-gray-900" : "font-semibold text-gray-800"}`}>
                                            {meta.title}
                                        </h3>
                                    </div>
                                    <p className={`text-sm mb-2 leading-relaxed ${unread ? "text-gray-700" : "text-gray-500"}`}>
                                        {notification.message}
                                    </p>
                                    <span className="text-xs font-medium text-gray-400">
                                        {timeAgo(notification.createdAt)}
                                    </span>
                                </div>
                            </div>
                        );
                    })
                ) : (
                    <div className="text-center py-16">
                        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Info className="text-gray-400" size={24} />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 mb-2">You're all caught up!</h3>
                        <p className="text-gray-500 text-sm">You don't have any new notifications at the moment.</p>
                    </div>
                )}
            </div>

        </div>
    );
}