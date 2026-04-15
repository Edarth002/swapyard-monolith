"use client";

import { useState } from "react";
import { useCart } from "@/app/context/CartContext";
import Link from "next/link";
import { useRouter } from "next/navigation"; 
import { Check, Lock, RotateCcw, Star, ArrowLeft } from "lucide-react";
import ValuePropsSection from "@/components/buyer/listings/ValuePropsSection";
import { useCountriesAndStates } from "@/hooks/buyer/useCountriesAndStates";

// Updated Delivery methods
const DELIVERY_METHODS = [
    { id: "door-step", name: "Door-step delivery", price: 5000, arrival: "Tomorrow" },
    { id: "post-office", name: "Post-office pick up", price: 3000, arrival: "Friday, 01.02.2026" },
];

export default function CheckoutPage() {
    const router = useRouter(); 
    const { cartItems, cartTotal, cartCount } = useCart();
    const [selectedDelivery, setSelectedDelivery] = useState(DELIVERY_METHODS[0]); // Default to first option

    // --- Form State ---
    const [formData, setFormData] = useState({
        firstName: "",
        lastName: "",
        street: "",
        city: "",
        zipCode: "",
        phone: ""
    });

    // --- Validation Errors State ---
    const [errors, setErrors] = useState<Record<string, string>>({});

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

    // --- Handle Input Changes ---
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        
        // Clear error for this field when the user starts typing
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: "" }));
        }
    };

    // --- Handle Validation & Next Step ---
    const handleNextStep = (e: React.MouseEvent) => {
        e.preventDefault();
        const newErrors: Record<string, string> = {};

        // Validate text fields
        if (!formData.firstName.trim()) newErrors.firstName = "First name is required";
        if (!formData.lastName.trim()) newErrors.lastName = "Second name is required";
        if (!formData.street.trim()) newErrors.street = "Street address is required";
        if (!formData.city.trim()) newErrors.city = "City is required";
        if (!formData.zipCode.trim()) newErrors.zipCode = "Zip code is required";
        if (!formData.phone.trim()) newErrors.phone = "Phone number is required";

        // Validate dropdowns
        if (!selectedCountry || selectedCountry === "Loading...") newErrors.country = "Country is required";
        if (!selectedState || selectedState === "Loading..." || selectedState === "") newErrors.state = "State is required";

        // If errors exist, update state and halt
        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        // ===============================================
        // NEW: Save data to sessionStorage before routing
        // ===============================================
        const checkoutData = {
            ...formData,
            country: selectedCountry,
            state: selectedState,
            deliveryMethod: selectedDelivery,
        };
        sessionStorage.setItem("swapyard_checkout", JSON.stringify(checkoutData));

        // If no errors, proceed to payment
        router.push("/payment");
    };

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
                                    <input 
                                        type="text" 
                                        name="firstName"
                                        value={formData.firstName}
                                        onChange={handleInputChange}
                                        placeholder="James" 
                                        className={`w-full px-4 py-3 bg-gray-50/50 border ${errors.firstName ? 'border-red-500' : 'border-gray-200 focus:border-[#EB3B18]'} outline-none text-sm text-gray-800 transition-colors`} 
                                    />
                                    {errors.firstName && <span className="text-red-500 text-[10px] mt-1 font-semibold">{errors.firstName}</span>}
                                </div>
                                <div className="flex-1 flex flex-col">
                                    <label className="text-[10px] font-bold text-gray-600 uppercase tracking-wide mb-2">SECOND NAME</label>
                                    <input 
                                        type="text" 
                                        name="lastName"
                                        value={formData.lastName}
                                        onChange={handleInputChange}
                                        placeholder="Garett" 
                                        className={`w-full px-4 py-3 bg-gray-50/50 border ${errors.lastName ? 'border-red-500' : 'border-gray-200 focus:border-[#EB3B18]'} outline-none text-sm text-gray-800 transition-colors`} 
                                    />
                                    {errors.lastName && <span className="text-red-500 text-[10px] mt-1 font-semibold">{errors.lastName}</span>}
                                </div>
                            </div>

                            {/* Row 2: Street Address */}
                            <div className="flex flex-col">
                                <label className="text-[10px] font-bold text-gray-600 uppercase tracking-wide mb-2">STREET ADDRESS</label>
                                <input 
                                    type="text" 
                                    name="street"
                                    value={formData.street}
                                    onChange={handleInputChange}
                                    placeholder="Street and number" 
                                    className={`w-full px-4 py-3 bg-gray-50/50 border ${errors.street ? 'border-red-500' : 'border-gray-200 focus:border-[#EB3B18]'} outline-none text-sm text-gray-800 transition-colors`} 
                                />
                                {errors.street && <span className="text-red-500 text-[10px] mt-1 font-semibold">{errors.street}</span>}
                            </div>

                            {/* Row 3: City & Zip */}
                            <div className="flex flex-col sm:flex-row gap-5">
                                <div className="flex-[2] flex flex-col">
                                    <label className="text-[10px] font-bold text-gray-600 uppercase tracking-wide mb-2">CITY</label>
                                    <input 
                                        type="text" 
                                        name="city"
                                        value={formData.city}
                                        onChange={handleInputChange}
                                        placeholder="City" 
                                        className={`w-full px-4 py-3 bg-gray-50/50 border ${errors.city ? 'border-red-500' : 'border-gray-200 focus:border-[#EB3B18]'} outline-none text-sm text-gray-800 transition-colors`} 
                                    />
                                    {errors.city && <span className="text-red-500 text-[10px] mt-1 font-semibold">{errors.city}</span>}
                                </div>
                                <div className="flex-1 flex flex-col">
                                    <label className="text-[10px] font-bold text-gray-600 uppercase tracking-wide mb-2">ZIP CODE</label>
                                    <input 
                                        type="text" 
                                        name="zipCode"
                                        value={formData.zipCode}
                                        onChange={handleInputChange}
                                        placeholder="00-000" 
                                        className={`w-full px-4 py-3 bg-gray-50/50 border ${errors.zipCode ? 'border-red-500' : 'border-gray-200 focus:border-[#EB3B18]'} outline-none text-sm text-gray-800 transition-colors`} 
                                    />
                                    {errors.zipCode && <span className="text-red-500 text-[10px] mt-1 font-semibold">{errors.zipCode}</span>}
                                </div>
                            </div>

                            {/* Row 4: Country & State */}
                            <div className="flex flex-col sm:flex-row gap-5">
                                <div className="flex-1 flex flex-col">
                                    <label htmlFor="country" className="text-[10px] font-bold text-gray-600 uppercase tracking-wide mb-2">COUNTRY</label>
                                    <select 
                                        id="country" 
                                        value={selectedCountry}
                                        onChange={(e) => {
                                            setSelectedCountry(e.target.value);
                                            if (errors.country) setErrors(prev => ({ ...prev, country: "" }));
                                        }}
                                        disabled={loading}
                                        className={`w-full px-4 py-3 bg-gray-50/50 border ${errors.country ? 'border-red-500' : 'border-gray-200 focus:border-[#EB3B18]'} outline-none text-sm text-gray-800 transition-colors appearance-none cursor-pointer disabled:opacity-50`}
                                    >
                                        {loading ? (
                                            <option>Loading...</option>
                                        ) : (
                                            countries.map((country, index) => (
                                                <option key={`${country}-${index}`} value={country}>{country}</option>
                                            ))
                                        )}
                                    </select>
                                    {errors.country && <span className="text-red-500 text-[10px] mt-1 font-semibold">{errors.country}</span>}
                                </div>
                                <div className="flex-1 flex flex-col">
                                    <label htmlFor="state" className="text-[10px] font-bold text-gray-600 uppercase tracking-wide mb-2">STATE / PROVINCE</label>
                                    <select 
                                        id="state" 
                                        value={selectedState}
                                        onChange={(e) => {
                                            setSelectedState(e.target.value);
                                            if (errors.state) setErrors(prev => ({ ...prev, state: "" }));
                                        }}
                                        disabled={loading || states.length === 0}
                                        className={`w-full px-4 py-3 bg-gray-50/50 border ${errors.state ? 'border-red-500' : 'border-gray-200 focus:border-[#EB3B18]'} outline-none text-sm text-gray-800 transition-colors appearance-none cursor-pointer disabled:opacity-50`}
                                    >
                                        {loading ? (
                                            <option>Loading...</option>
                                        ) : states.length === 0 ? (
                                            <option value="">No states available</option>
                                        ) : (
                                            states.map((state, index) => (
                                                <option key={`${state}-${index}`} value={state}>{state}</option>
                                            ))
                                        )}
                                    </select>
                                    {errors.state && <span className="text-red-500 text-[10px] mt-1 font-semibold">{errors.state}</span>}
                                </div>
                            </div>

                            {/* Row 5: Phone */}
                            <div className="flex flex-col sm:flex-row gap-5">
                                <div className="flex-1 flex flex-col">
                                    <label htmlFor="Phone" className="text-[10px] font-bold text-gray-600 uppercase tracking-wide mb-2">PHONE NUMBER</label>
                                    <input 
                                        id="Phone" 
                                        type="tel" 
                                        name="phone"
                                        value={formData.phone}
                                        onChange={handleInputChange}
                                        placeholder="+234 800 000 0000" 
                                        className={`w-full px-4 py-3 bg-gray-50/50 border ${errors.phone ? 'border-red-500' : 'border-gray-200 focus:border-[#EB3B18]'} outline-none text-sm text-gray-800 transition-colors`} 
                                    />
                                    {errors.phone && <span className="text-red-500 text-[10px] mt-1 font-semibold">{errors.phone}</span>}
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
                        <Link 
                            href="/cart"
                            aria-label="Go back to previous step"
                            className="px-6 py-2.5 text-[10px] font-bold text-white uppercase tracking-widest bg-[#EB3B18] rounded-sm hover:bg-[#d93616] transition-colors flex items-center gap-2 cursor-pointer"
                        >
                            <span className="text-sm leading-none">&lsaquo;</span> BACK
                        </Link>
                        {/* Changed from Link to button to handle validation before routing */}
                        <button 
                            onClick={handleNextStep}
                            aria-label="Proceed to next step"
                            className="px-6 py-2.5 text-[10px] font-bold text-white uppercase tracking-widest bg-[#EB3B18] rounded-sm hover:bg-[#d93616] transition-colors flex items-center gap-2 cursor-pointer"
                        >
                            NEXT STEP <span className="text-sm leading-none">&rsaquo;</span>
                        </button>
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