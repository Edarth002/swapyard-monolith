"use client";

import { useState } from "react";
import { useCart } from "@/app/context/CartContext";
import Link from "next/link";
import { Check, Lock, RotateCcw, Star, ArrowLeft } from "lucide-react";
import ValuePropsSection from "@/components/buyer/listings/ValuePropsSection";
import { useCountriesAndStates } from "@/hooks/buyer/useCountriesAndStates";

// Updated Delivery methods
const DELIVERY_METHODS = [
    { id: "door-step", name: "Door-step delivery", price: 5000, arrival: "Tomorrow" },
    { id: "post-office", name: "Post-office pick up", price: 3000, arrival: "Friday, 01.02.2026" },
];

export default function CheckoutPage() {
    const { cartItems, cartTotal, cartCount } = useCart();
    const [selectedDelivery, setSelectedDelivery] = useState(DELIVERY_METHODS[0]); // Default to first option

    // --- Initialize the custom hook ---
    const {
        countries,
        states,
        selectedCountry,
        setSelectedCountry,
        selectedState,
        setSelectedState,
        loading
    } = useCountriesAndStates("Nigeria");

    // Format price to Naira
    const formatPrice = (price: number) => {
        return new Intl.NumberFormat("en-NG", {
            style: "currency",
            currency: "NGN",
            minimumFractionDigits: 2,
        }).format(price);
    };

    const finalTotal = cartTotal + selectedDelivery.price;

    return (
        <div className="min-h-screen bg-white font-sans text-gray-800 pb-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <Link 
                href="/cart" 
                aria-label="Go back to shopping cart"
                className="text-[10px] font-bold text-gray-500 uppercase tracking-widest hover:text-gray-900 transition-colors cursor-pointer flex items-center px-6 pt-8 pb-10 max-w-6xl mx-auto"
            >
                <ArrowLeft className="w-3.5 h-3.5 mr-2" />
                BACK TO SHOPPING CART
            </Link>

            {/* MAIN CONTENT - STRICTLY FLEX-ROW */}
            <div className="max-w-6xl mx-auto mt-4 px-6 flex flex-col lg:flex-row justify-between gap-12 lg:gap-16">
                
                {/* LEFT COLUMN: Form Details */}
                <div className="w-full lg:w-[58%] flex flex-col">
                    <div className="mb-10">
                        <h1 className="text-3xl font-semibold text-gray-900 tracking-tight mb-3">Delivery address</h1>
                    </div>

                    {/* Delivery Address Section */}
                    <div className="mb-10">
                        <div className="flex flex-col gap-5">
                            {/* Row 1: Names */}
                            <div className="flex flex-col sm:flex-row gap-5">
                                <div className="flex-1 flex flex-col">
                                    <label className="text-[10px] font-bold text-gray-600 uppercase tracking-wide mb-2">FIRST NAME</label>
                                    <input type="text" placeholder="James" defaultValue="" className="w-full px-4 py-3 bg-gray-50/50 border border-gray-200 focus:border-[#EB3B18] outline-none text-sm text-gray-800 transition-colors" />
                                </div>
                                <div className="flex-1 flex flex-col">
                                    <label className="text-[10px] font-bold text-gray-600 uppercase tracking-wide mb-2">SECOND NAME</label>
                                    <input type="text" placeholder="Garett" defaultValue="" className="w-full px-4 py-3 bg-gray-50/50 border border-gray-200 focus:border-[#EB3B18] outline-none text-sm text-gray-800 transition-colors" />
                                </div>
                            </div>

                            {/* Row 2: Street Address */}
                            <div className="flex flex-col">
                                <label className="text-[10px] font-bold text-gray-600 uppercase tracking-wide mb-2">STREET ADDRESS</label>
                                <input type="text" placeholder="Street and number" className="w-full px-4 py-3 bg-gray-50/50 border border-gray-200 focus:border-[#EB3B18] outline-none text-sm text-gray-800 transition-colors" />
                            </div>

                            {/* Row 3: City & Zip */}
                            <div className="flex flex-col sm:flex-row gap-5">
                                <div className="flex-[2] flex flex-col">
                                    <label className="text-[10px] font-bold text-gray-600 uppercase tracking-wide mb-2">CITY</label>
                                    <input type="text" placeholder="City" className="w-full px-4 py-3 bg-gray-50/50 border border-gray-200 focus:border-[#EB3B18] outline-none text-sm text-gray-800 transition-colors" />
                                </div>
                                <div className="flex-1 flex flex-col">
                                    <label className="text-[10px] font-bold text-gray-600 uppercase tracking-wide mb-2">ZIP CODE</label>
                                    <input type="text" placeholder="00-000" className="w-full px-4 py-3 bg-gray-50/50 border border-gray-200 focus:border-[#EB3B18] outline-none text-sm text-gray-800 transition-colors" />
                                </div>
                            </div>

                            {/* Row 4: Country & State */}
                            <div className="flex flex-col sm:flex-row gap-5">
                                <div className="flex-1 flex flex-col">
                                    <label htmlFor="country" className="text-[10px] font-bold text-gray-600 uppercase tracking-wide mb-2">COUNTRY</label>
                                    <select 
                                        id="country" 
                                        value={selectedCountry}
                                        onChange={(e) => setSelectedCountry(e.target.value)}
                                        disabled={loading}
                                        className="w-full px-4 py-3 bg-gray-50/50 border border-gray-200 focus:border-[#EB3B18] outline-none text-sm text-gray-800 transition-colors appearance-none cursor-pointer disabled:opacity-50"
                                    >
                                        {loading ? (
                                            <option>Loading...</option>
                                        ) : (
                                            /* CHANGED: Added index to key to prevent duplicate React key errors */
                                            countries.map((country, index) => (
                                                <option key={`${country}-${index}`} value={country}>{country}</option>
                                            ))
                                        )}
                                    </select>
                                </div>
                                <div className="flex-1 flex flex-col">
                                    <label htmlFor="state" className="text-[10px] font-bold text-gray-600 uppercase tracking-wide mb-2">STATE / PROVINCE</label>
                                    <select 
                                        id="state" 
                                        value={selectedState}
                                        onChange={(e) => setSelectedState(e.target.value)}
                                        disabled={loading || states.length === 0}
                                        className="w-full px-4 py-3 bg-gray-50/50 border border-gray-200 focus:border-[#EB3B18] outline-none text-sm text-gray-800 transition-colors appearance-none cursor-pointer disabled:opacity-50"
                                    >
                                        {loading ? (
                                            <option>Loading...</option>
                                        ) : states.length === 0 ? (
                                            <option value="">No states available</option>
                                        ) : (
                                            /* CHANGED: Added index to key to prevent duplicate React key errors */
                                            states.map((state, index) => (
                                                <option key={`${state}-${index}`} value={state}>{state}</option>
                                            ))
                                        )}
                                    </select>
                                </div>
                            </div>

                            {/* Row 5: Phone */}
                            <div className="flex flex-col sm:flex-row gap-5">
                                <div className="flex-1 flex flex-col">
                                    <label htmlFor="Phone" className="text-[10px] font-bold text-gray-600 uppercase tracking-wide mb-2">PHONE NUMBER</label>
                                    <input id="Phone" type="tel" defaultValue="123456789" className="w-full px-4 py-3 bg-gray-50/50 border border-gray-200 focus:border-[#EB3B18] outline-none text-sm text-gray-800 transition-colors" />
                                </div>
                                <div className="flex-1 hidden sm:block"></div> {/* Empty space for alignment */}
                            </div>
                        </div>
                    </div>

                    {/* Billing Address Section */}
                    <div className="mb-12">
                        <h2 className="text-base font-bold text-gray-900 mb-4">Billing address</h2>
                        <label 
                            aria-label="Use delivery address as billing address"
                            className="flex items-center gap-3 cursor-pointer group w-fit"
                        >
                            <div className="w-4 h-4 rounded-sm bg-[#EB3B18] flex items-center justify-center">
                                <Check size={12} strokeWidth={4} className="text-white" />
                            </div>
                            <span className="text-xs font-bold text-gray-800">Use delivery address as billing address</span>
                        </label>
                    </div>

                    {/* Delivery Method Section */}
                    <div className="mb-10">
                        <h2 className="text-base font-bold text-gray-900 mb-6">Delivery method</h2>
                        <div className="flex flex-col sm:flex-row gap-4">
                            {DELIVERY_METHODS.map((method) => (
                                <div 
                                    key={method.id}
                                    onClick={() => setSelectedDelivery(method)}
                                    aria-label={`Select ${method.name} delivery`}
                                    className={`flex-1 p-5 border cursor-pointer transition-all flex flex-col relative ${
                                        selectedDelivery.id === method.id 
                                            ? "border-[#EB3B18] border-[1.5px]" 
                                            : "border-gray-200 hover:border-gray-300"
                                    }`}
                                >
                                    {/* Radio Button Indicator */}
                                    {selectedDelivery.id === method.id && (
                                        <div className="absolute top-4 right-4 w-3.5 h-3.5 rounded-full border border-[#EB3B18] flex items-center justify-center">
                                            <div className="w-1.5 h-1.5 bg-[#EB3B18] rounded-full"></div>
                                        </div>
                                    )}
                                    <div className="text-[10px] font-bold text-gray-600 uppercase tracking-widest mb-1">{method.name}</div>
                                    <div className="text-[13px] font-bold text-gray-900 mb-6">{formatPrice(method.price)}</div>
                                    <div className="mt-auto">
                                        <div className="text-[8px] text-gray-400 uppercase tracking-widest mb-0.5">Package arrives:</div>
                                        <div className="text-xs font-bold text-gray-900">{method.arrival}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Form Action Buttons */}
                    <div className="flex justify-between items-center pt-8 border-t border-gray-100">
                        <button 
                            aria-label="Go back to previous step"
                            className="px-6 py-2.5 text-[10px] font-bold text-white uppercase tracking-widest bg-[#EB3B18] rounded-sm hover:bg-[#d93616] transition-colors flex items-center gap-2 cursor-pointer"
                        >
                            <span className="text-sm leading-none">&lsaquo;</span> BACK
                        </button>
                        <Link 
                            href="/payment"
                            aria-label="Proceed to next step"
                            className="px-6 py-2.5 text-[10px] font-bold text-white uppercase tracking-widest bg-[#EB3B18] rounded-sm hover:bg-[#d93616] transition-colors flex items-center gap-2 cursor-pointer"
                        >
                            NEXT STEP <span className="text-sm leading-none">&rsaquo;</span>
                        </Link>
                    </div>
                </div>

                {/* RIGHT COLUMN: Sidebar (Summary & Info) */}
                <div className="w-full lg:w-[35%] max-w-[400px] flex flex-col">
                    
                    {/* Order Summary Box */}
                    <div className="bg-gray-50/50 border border-gray-100 rounded-md p-6 mb-8">
                        <h3 className="font-bold text-gray-900 mb-6">Order summary</h3>
                        
                        <div className="flex justify-between items-center text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-4 pb-2 border-b border-gray-200">
                            <span className="flex-1">PRODUCT</span>
                            <span className="w-12 text-center">QTY</span>
                            <span className="w-20 text-right">PRICE</span>
                        </div>

                        <div className="flex flex-col gap-4 mb-6 pb-6 border-b border-gray-200">
                            {cartItems.length === 0 ? (
                                <p className="text-xs text-gray-500 py-4">No items in cart</p>
                            ) : (
                                cartItems.map((item) => (
                                    <div key={item.id} className="flex justify-between items-start w-full">
                                        <div className="flex flex-1 gap-3 pr-2">
                                            <div className="w-12 h-12 bg-gray-200 shrink-0 relative overflow-hidden">
                                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                                <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover absolute inset-0" />
                                            </div>
                                            <div className="flex flex-col pt-0.5">
                                                <span className="text-sm font-bold text-gray-900 leading-tight mb-1 line-clamp-1">{item.title}</span>
                                                <span className="text-xs text-gray-500 uppercase tracking">Color: <span className="font-semibold text-gray-700">N/A</span></span>
                                                <span className="text-xs text-gray-500 uppercase tracking-wider">Size: <span className="font-semibold text-gray-700">N/A</span></span>
                                            </div>
                                        </div>
                                        <div className="w-12 text-center text-sm font-semibold text-gray-800 pt-0.5">{item.quantity}</div>
                                        <div className="w-20 text-right text-sm font-bold text-gray-900 pt-0.5">{formatPrice(item.price)}</div>
                                    </div>
                                ))
                            )}
                        </div>

                        <div className="flex flex-col gap-2 mb-6 pb-6 border-b border-gray-200">
                            <div className="flex justify-between items-center">
                                <span className="text-sm font-semibold text-gray-600">Subtotal ({cartCount} items)</span>
                                <span className="text-sm font-bold text-gray-900">{formatPrice(cartTotal)}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-sm font-semibold text-gray-600">Shipping cost</span>
                                <span className="text-sm font-bold text-gray-900">{formatPrice(selectedDelivery.price)}</span>
                            </div>
                        </div>

                        <div className="flex justify-between items-center pt-2">
                            <span className=" font-bold text-gray-900">Total</span>
                            <span className="text-lg font-extrabold text-gray-900">{formatPrice(finalTotal)}</span>
                        </div>
                    </div>

                    {/* Contact Info Block */}
                    <div className="mb-8 px-2">
                        <h3 className="font-bold text-gray-900 text-sm mb-3">Need help? Contact us!</h3>
                        <p className="text-gray-500 mb-1">Please call:</p>
                        <p className="text-sm font-bold text-gray-900 mb-4">+234 812 345 6789</p>
                        <div className="text-gray-500 space-y-0.5">
                            <p>Monday - Friday: 8:00 - 20:00</p>
                            <p>Saturday: 8:00 - 16:00</p>
                        </div>
                    </div>

                    {/* Delivery Methods Representation */}
                    <div className="mb-6 px-2">
                        <h3 className="text-sm font-bold text-gray-900 mb-3">Delivery methods</h3>
                        <div className="flex gap-2 items-center">
                            <div className="border border-gray-200 bg-white px-3 py-1 flex items-center justify-center min-w-[60px]">
                                <span className="text-[10px] font-extrabold text-red-600 italic tracking-tighter">DHL</span>
                            </div>
                            <div className="border border-gray-200 bg-white px-3 py-1 flex items-center justify-center min-w-[60px]">
                                <span className="text-[10px] font-extrabold text-purple-800 tracking-tighter">FedEx</span>
                            </div>
                            <div className="border border-gray-200 bg-white px-3 py-1 flex items-center justify-center min-w-[60px]">
                                <span className="text-[10px] font-extrabold text-blue-900 italic tracking-tighter">GLS</span>
                            </div>
                        </div>
                    </div>

                    {/* Payment Methods Representation */}
                    <div className="px-2">
                        <h3 className="text-sm font-bold text-gray-900 mb-3">Payment methods</h3>
                        <div className="flex gap-2 items-center flex-wrap">
                            <div className="border border-gray-200 bg-white px-3 py-1 flex items-center justify-center min-w-[50px]">
                                <span className="text-[10px] font-extrabold text-blue-800 italic">VISA</span>
                            </div>
                            <div className="border border-gray-200 bg-white px-3 py-1 flex items-center justify-center min-w-[50px]">
                                <span className="text-[9px] font-bold text-blue-500">Paystack</span>
                            </div>
                            <div className="border border-gray-200 bg-white px-3 py-1 flex items-center justify-center min-w-[50px]">
                                <div className="flex w-6 h-4 relative">
                                    <div className="w-3 h-3 rounded-full bg-red-500 absolute left-0 opacity-80"></div>
                                    <div className="w-3 h-3 rounded-full bg-yellow-500 absolute left-2 opacity-80"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <ValuePropsSection />
        </div>
    );
}