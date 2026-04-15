"use client";

import React, { useState, useCallback, useEffect } from "react";
import { GoogleMap, useJsApiLoader, OverlayView } from "@react-google-maps/api";
import Image from "next/image";
import { Loader2, X, ShieldCheck, Heart, MapPin, Star } from "lucide-react";

const CONTAINER_STYLE = {
    width: "100%",
    height: "100%",
    borderRadius: "0.75rem",
};

// Default center (Lagos)
const CENTER = {
    lat: 6.5244,
    lng: 3.3792
};

const MAP_STYLES = [
    { featureType: "water", elementType: "geometry", stylers: [{ color: "#a2c4eb" }] },
    { featureType: "landscape", elementType: "geometry", stylers: [{ color: "#f3f4f6" }] },
    { featureType: "poi", stylers: [{ visibility: "off" }] },
    { featureType: "transit", stylers: [{ visibility: "off" }] },
    { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#ffffff" }] },
    { featureType: "road.arterial", elementType: "geometry", stylers: [{ color: "#ffffff" }] },
    { featureType: "road.local", elementType: "geometry", stylers: [{ color: "#ffffff" }] },
    { featureType: "administrative", elementType: "labels.text.fill", stylers: [{ color: "#6b7280" }] },
];

interface ListingsMapProps {
    listings: Array<{
        id: string;
        title: string;
        price: string;
        location: string;
        image: string;
        lat?: number;
        lng?: number;
    }>;
}

// Utility to format "₦85,000" to "₦85k"
const formatShortPrice = (priceStr: string) => {
    const num = parseInt(priceStr.replace(/[^0-9]/g, ''), 10);
    if (isNaN(num)) return priceStr;
    if (num >= 1000) return `₦${(num / 1000).toFixed(0)}k`;
    return `₦${num}`;
};

export const ListingsMap = ({ listings }: ListingsMapProps) => {
    const { isLoaded } = useJsApiLoader({
        id: 'google-map-script',
        googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY || "", 
    });

    const [map, setMap] = useState<google.maps.Map | null>(null);
    const [selectedListingId, setSelectedListingId] = useState<string | null>(null);

    const onLoad = useCallback((map: google.maps.Map) => {
        setMap(map);
    }, []);

    const onUnmount = useCallback(() => {
        setMap(null);
    }, []);

    useEffect(() => {
        if (map && listings.length > 0) {
            const bounds = new google.maps.LatLngBounds();
            let hasValidCoords = false;
            listings.forEach(listing => {
                if (listing.lat && listing.lng) {
                    bounds.extend({ lat: listing.lat, lng: listing.lng });
                    hasValidCoords = true;
                }
            });
            if (hasValidCoords) {
                map.fitBounds(bounds);
            }
        }
    }, [map, listings]);

    if (!isLoaded) {
        return (
            <div className="w-full h-150 md:h-[calc(100vh-200px)] bg-gray-100 rounded-xl flex items-center justify-center border border-gray-200">
                <Loader2 className="animate-spin text-gray-400" size={32} />
            </div>
        );
    }

    return (
        <div className="relative w-full h-150 md:h-[calc(100vh-200px)] rounded-xl overflow-hidden border border-gray-200 shadow-inner">
            <GoogleMap
                mapContainerStyle={CONTAINER_STYLE}
                center={CENTER}
                zoom={10}
                onLoad={onLoad}
                onUnmount={onUnmount}
                onClick={() => setSelectedListingId(null)}
                options={{
                    styles: MAP_STYLES,
                    disableDefaultUI: true, 
                    zoomControl: true,
                    gestureHandling: "greedy", 
                    draggable: true,
                }}
            >
                {listings.map((listing) => {
                    if (!listing.lat || !listing.lng) return null;

                    const isSelected = selectedListingId === listing.id;

                    return (
                        <OverlayView
                            key={listing.id}
                            position={{ lat: listing.lat, lng: listing.lng }}
                            mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
                        >
                            <div className="relative">
                                {isSelected ? (
                                    <div 
                                        className="relative transform -translate-x-1/2 -translate-y-full pb-3 z-50 cursor-default animate-in fade-in zoom-in duration-200 font-sans"
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        <div className="bg-white rounded-2xl shadow-xl w-[260px] md:w-[280px] p-3 border border-gray-100">
                                            <div className="flex justify-between items-center mb-2">
                                                <div className="flex gap-2 items-center">
                                                    <span className="text-[10px] font-extrabold text-gray-800 tracking-tight bg-gray-50 px-2 py-1 rounded-md">Like New</span>
                                                    <span className="text-[10px] font-extrabold text-gray-800 tracking-tight bg-gray-50 px-2 py-1 rounded-md flex items-center gap-1">
                                                        <ShieldCheck className="w-3 h-3 text-green-600" /> Verified
                                                    </span>
                                                </div>
                                                {/* ADDED ARIA-LABEL HERE */}
                                                <button aria-label="Save to favorites" className="text-gray-400 hover:text-red-500 transition-colors">
                                                    <Heart className="w-4 h-4" />
                                                </button>
                                            </div>

                                            <div className="relative w-full h-32 rounded-xl overflow-hidden mb-3">
                                                <Image src={listing.image} alt={listing.title} fill className="object-cover" sizes="280px" />
                                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                                                <div className="absolute bottom-2 left-2 text-white text-sm font-extrabold tracking-tight">
                                                    {listing.price}
                                                </div>
                                                <div className="absolute bottom-2 right-2 text-white text-[10px] font-bold flex items-center gap-1">
                                                    <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" /> 4.8
                                                </div>
                                            </div>

                                            <h4 className="text-[13px] font-bold text-gray-900 mb-1 leading-tight line-clamp-1">{listing.title}</h4>
                                            <div className="flex items-center text-[10px] text-gray-500 mb-3">
                                                <MapPin className="w-3 h-3 mr-1 shrink-0" /> <span className="line-clamp-1">{listing.location}</span>
                                            </div>

                                            <div className="flex items-center justify-between pt-1">
                                                <button className="text-[11px] font-bold text-gray-500 hover:text-gray-900 transition-colors">
                                                    Quick view
                                                </button>
                                                <div className="flex overflow-hidden rounded-lg shadow-sm">
                                                    <div className="bg-[#EB3B18] text-white text-[10px] font-bold px-2.5 py-1.5 flex items-center justify-center">
                                                        {formatShortPrice(listing.price)}
                                                    </div>
                                                    <button className="bg-[#2B3F5C] hover:bg-[#1E2C41] text-white text-[11px] font-bold px-3 py-1.5 flex items-center justify-center transition-colors">
                                                        View listing
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="absolute bottom-[2px] left-1/2 -translate-x-1/2 w-0 h-0 border-l-[10px] border-r-[10px] border-t-[12px] border-l-transparent border-r-transparent border-t-white drop-shadow-md"></div>
                                    </div>
                                ) : (
                                    <div 
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setSelectedListingId(listing.id);
                                        }}
                                        className="relative transform -translate-x-1/2 -translate-y-full cursor-pointer hover:scale-105 transition-transform z-10 group pb-1"
                                    >
                                        <div className="bg-[#2B3F5C] text-white text-[11px] font-bold px-3 py-1.5 rounded-full shadow-lg border-[1.5px] border-white whitespace-nowrap">
                                            {formatShortPrice(listing.price)}
                                        </div>
                                        <div className="absolute bottom-[1px] left-1/2 -translate-x-1/2 w-0 h-0 border-l-[5px] border-r-[5px] border-t-[6px] border-l-transparent border-r-transparent border-t-[#2B3F5C]"></div>
                                    </div>
                                )}
                            </div>
                        </OverlayView>
                    );
                })}
            </GoogleMap>
        </div>
    );
};