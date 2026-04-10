"use client";

import { useCart } from "@/app/context/CartContext";
import Link from "next/link";
import { Check, Lock, RotateCcw, Star, ArrowLeft, MapPin, CreditCard } from "lucide-react";
import ValuePropsSection from "@/components/buyer/listings/ValuePropsSection";

export default function ReviewOrderPage() {
    const { cartItems, cartTotal, cartCount } = useCart();

    // Format price to Naira
    const formatPrice = (price: number) => {
        return new Intl.NumberFormat("en-NG", {
            style: "currency",
            currency: "NGN",
            minimumFractionDigits: 2,
        }).format(price);
    };

    // Dummy values representing data that would usually come from a form state or context
    const shippingMethod = { name: "Door-step delivery", price: 5000 };
    const finalTotal = cartTotal + shippingMethod.price;

    return (
        <div className="min-h-screen bg-white font-sans text-gray-800 pb-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <Link 
                href="/payment" 
                aria-label="Go back to payment method"
                className="text-[10px] font-bold text-gray-500 uppercase tracking-widest hover:text-gray-900 transition-colors cursor-pointer flex items-center px-6 pt-8 pb-10 max-w-6xl mx-auto"
            >
                <ArrowLeft className="w-3.5 h-3.5 mr-2" />
                BACK TO PAYMENT
            </Link>

            {/* MAIN CONTENT */}
            <div className="max-w-6xl mx-auto mt-4 px-6 flex flex-col lg:flex-row justify-between gap-12 lg:gap-16">
                
                {/* LEFT COLUMN: Summary Review */}
                <div className="w-full lg:w-[58%] flex flex-col">
                    <div className="mb-10">
                        <h1 className="text-3xl font-semibold text-gray-900 tracking-tight mb-3">Review your order</h1>
                        <p className="text-xs text-gray-500 text-visible">Please check your details before completing the purchase.</p>
                    </div>

                    <div className="flex flex-col gap-8">
                        {/* Shipping Summary */}
                        <div className="border border-gray-200 rounded-md p-6 relative">
                            <div className="flex justify-between items-start mb-4">
                                <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2">
                                    <MapPin size={16} className="text-[#EB3B18]" /> Shipping Address
                                </h2>
                                <Link href="/checkout" className="text-[10px] font-bold text-[#EB3B18] hover:underline cursor-pointer">EDIT</Link>
                            </div>
                            <div className="text-sm text-gray-600 leading-relaxed">
                                <p className="font-bold text-gray-800">James Garett</p>
                                <p>123 SwapYard Street, Lekki Phase 1</p>
                                <p>Lagos, Nigeria</p>
                                <p>+234 812 345 6789</p>
                            </div>
                        </div>

                        {/* Payment Summary */}
                        <div className="border border-gray-200 rounded-md p-6 relative">
                            <div className="flex justify-between items-start mb-4">
                                <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2">
                                    <CreditCard size={16} className="text-[#EB3B18]" /> Payment Method
                                </h2>
                                <Link href="/payment" className="text-[10px] font-bold text-[#EB3B18] hover:underline cursor-pointer">EDIT</Link>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-6 bg-gray-100 rounded border border-gray-200 flex items-center justify-center">
                                    <span className="text-[8px] font-black italic text-blue-800">VISA</span>
                                </div>
                                <div className="text-sm text-gray-600">
                                    Visa ending in <span className="font-bold text-gray-800">4242</span>
                                </div>
                            </div>
                        </div>

                        {/* Delivery Option Summary */}
                        <div className="border border-gray-200 rounded-md p-6">
                            <div className="flex justify-between items-start mb-2">
                                <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Delivery Method</h2>
                                <Link href="/checkout" className="text-[10px] font-bold text-[#EB3B18] hover:underline cursor-pointer">EDIT</Link>
                            </div>
                            <p className="text-sm text-gray-600">{shippingMethod.name} — <span className="font-bold text-gray-800">{formatPrice(shippingMethod.price)}</span></p>
                        </div>
                    </div>

                    {/* Final Action Buttons */}
                    <div className="flex justify-between items-center pt-10 border-t border-gray-100 mt-10">
                        <Link 
                            href="/payment"
                            className="px-6 py-2.5 text-[10px] font-bold text-white uppercase tracking-widest bg-[#EB3B18] rounded-sm hover:bg-[#d93616] transition-colors flex items-center gap-2 cursor-pointer"
                        >
                            <span className="text-sm leading-none">&lsaquo;</span> BACK
                        </Link>
                        <Link 
                            href="/order-success" // <-- Point this to your new success page
                            aria-label={`Complete purchase for ${formatPrice(finalTotal)}`}
                            className="px-8 py-3 text-[11px] font-extrabold text-white uppercase tracking-widest bg-[#EB3B18] rounded-sm hover:bg-[#d93616] transition-all transform hover:scale-[1.02] shadow-lg flex items-center gap-2 cursor-pointer"
                        >
                            COMPLETE PURCHASE <span className="text-sm leading-none">&rsaquo;</span>
                        </Link>
                    </div>
                </div>

                {/* RIGHT COLUMN: Sidebar (Summary) */}
                <div className="w-full lg:w-[35%] max-w-[400px] flex flex-col">
                    <div className="bg-gray-50/50 border border-gray-100 rounded-md p-6 mb-8">
                        <h3 className="font-bold text-gray-900 text-sm mb-6">Order summary</h3>
                        
                        <div className="flex justify-between items-center text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-4 pb-2 border-b border-gray-200">
                            <span className="flex-1">PRODUCT</span>
                            <span className="w-12 text-center">QTY</span>
                            <span className="w-20 text-right">PRICE</span>
                        </div>

                        <div className="flex flex-col gap-4 mb-6 pb-6 border-b border-gray-200">
                            {cartItems.map((item) => (
                                <div key={item.id} className="flex justify-between items-start w-full">
                                    <div className="flex flex-1 gap-3 pr-2">
                                        <div className="w-12 h-12 bg-gray-200 shrink-0 relative overflow-hidden">
                                            <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover absolute inset-0" />
                                        </div>
                                        <div className="flex flex-col pt-0.5">
                                            <span className="text-sm font-bold text-gray-900 leading-tight mb-1 line-clamp-1">{item.title}</span>
                                            <span className="text-xs text-gray-500 uppercase">Qty: {item.quantity}</span>
                                        </div>
                                    </div>
                                    <div className="w-20 text-right text-sm font-bold text-gray-900 pt-0.5">{formatPrice(item.price)}</div>
                                </div>
                            ))}
                        </div>

                        <div className="flex flex-col gap-2 mb-6 pb-6 border-b border-gray-200 text-visible">
                            <div className="flex justify-between items-center">
                                <span className="text-sm font-semibold text-gray-600">Subtotal</span>
                                <span className="text-sm font-bold text-gray-900">{formatPrice(cartTotal)}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-sm font-semibold text-gray-600">Shipping</span>
                                <span className="text-sm font-bold text-gray-900">{formatPrice(shippingMethod.price)}</span>
                            </div>
                        </div>

                        <div className="flex justify-between items-center pt-2">
                            <span className="font-bold text-gray-900">Total</span>
                            <span className="text-xl font-black text-[#EB3B18]">{formatPrice(finalTotal)}</span>
                        </div>
                    </div>

                    {/* Final Security Notice */}
                    <div className="px-2 flex items-start gap-3">
                        <Lock size={14} className="text-gray-400 mt-1" />
                        <p className="text-[10px] text-gray-500 leading-relaxed">
                            Your transaction is secured with industry-standard encryption. By clicking "Complete Purchase", you agree to SwapYard's Terms of Service.
                        </p>
                    </div>
                </div>
            </div>

            <ValuePropsSection />
        </div>
    );
}