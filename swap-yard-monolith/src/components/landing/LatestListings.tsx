"use client";

import { useEffect, useState } from "react";
import { Star, MapPin, ShieldCheck, Heart, ShoppingCart, Loader2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useCart } from "@/app/context/CartContext"; 
import { useWishlist } from "@/app/context/WishlistContext"; 
import toast from "react-hot-toast"; 

/**
 * Custom Verified Badge matching your visual requirement
 */
const VerifiedBadge = () => (
  <div className="flex items-center gap-1.5 bg-white/90 px-2 py-1 rounded-md shadow-sm border border-gray-100">
    <div className="flex items-center justify-center w-4 h-4 rounded-full border-[1.5px] border-[#27AE60] text-[#27AE60]">
      <ShieldCheck size={10} strokeWidth={4} />
    </div>
    <span className="text-[10px] font-bold text-gray-800 uppercase">Verified</span>
  </div>
);

const HomeListingCard = ({ item }: { item: any }) => {
  const { addToCart } = useCart();
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
  const isWishlisted = isInWishlist(item.id);

  const formattedPrice = new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 0,
  }).format(item.price);

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault(); 
    e.stopPropagation();
    
    addToCart({
      id: item.id,
      title: item.title,
      price: item.price,
      imageUrl: item.imageUrl,
      quantity: 1
    });
    
    toast.success(`Added to cart!`);

    try {
      await fetch('/api/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ listingId: item.id, quantity: 1 }),
      });
    } catch (err) {
      console.error("Cart sync error:", err);
    }
  };

  const handleFavorite = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (isWishlisted) {
      removeFromWishlist(item.id);
      toast.success("Removed from wishlist");
    } else {
      addToWishlist({ ...item });
      toast.success("Added to wishlist!");
    }
  };

  return (
    <div className="group flex flex-col bg-white rounded-[1.5rem] overflow-hidden border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300 font-sans">
      <div className="relative aspect-[4/5] w-full bg-gray-100">
        <Link href={`/listings/${item.id}`} className="absolute inset-0 z-0">
          <Image 
            src={item.imageUrl} 
            alt={item.title} 
            fill 
            className="object-cover group-hover:scale-105 transition-transform duration-500" 
          />
        </Link>
        
        <div className="absolute top-4 left-4 flex flex-col gap-2 z-10">
          <div className="bg-white/90 px-3 py-1.5 rounded-lg text-[10px] font-bold text-gray-900 uppercase">
            {item.condition}
          </div>
          {item.isVerified && <VerifiedBadge />}
        </div>

        <button 
          onClick={handleFavorite}
          className={`absolute top-4 right-4 p-2 bg-white rounded-full shadow-sm transition-all z-10 cursor-pointer ${
            isWishlisted ? "text-red-500" : "text-gray-400 hover:text-red-500"
          }`}
        >
          <Heart className={`w-5 h-5 ${isWishlisted ? "fill-current" : ""}`} />
        </button>
      </div>

      <div className="p-5 flex flex-col flex-1">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-bold text-gray-400 tracking-widest uppercase">
            {item.category}
          </span>
          <div className="flex items-center gap-1">
            <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
            <span className="text-xs font-bold text-gray-700">{item.rating.toFixed(1)}</span>
            <span className="text-xs text-gray-400">({item.reviewsCount})</span>
          </div>
        </div>

        <Link href={`/listings/${item.id}`} className="hover:text-[#EB3B18] transition-colors mb-4">
          <h3 className="font-bold text-lg text-[#002147] leading-tight line-clamp-2 min-h-[3rem]">
            {item.title}
          </h3>
        </Link>

        <div className="flex items-center text-xs text-gray-400 mb-6 mt-auto">
          <MapPin className="w-3.5 h-3.5 mr-1" />
          <span className="line-clamp-1">{item.location}</span>
        </div>

        <hr className="border-gray-100 mb-5" />

        <div className="flex items-center justify-between">
          <span className="font-black text-xl text-[#002147]">{formattedPrice}</span>
          <div className="flex items-center gap-2">
            <Link 
              href={`/listings/${item.id}`} 
              className="text-[11px] font-bold px-4 py-2.5 border-2 border-[#002147] rounded-xl text-[#002147] hover:bg-[#002147] hover:text-white transition-all"
            >
              View
            </Link>
            <button
              onClick={handleAddToCart}
              className="p-2.5 bg-[#EB3B18] text-white rounded-xl hover:bg-[#d93616] transition-colors shadow-sm"
            >
              <ShoppingCart size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export const LatestListings = () => {
  const [listings, setListings] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchListings = async () => {
      setIsLoading(true);
      try {
        const res = await fetch("/api/listing?limit=8");
        const data = await res.json();
        
        if (data.ok) {
          const mappedData = data.items.map((item: any) => ({
            id: item.id,
            title: item.name,
            category: item.category?.name || "Uncategorized",
            price: item.price,
            location: item.location || "Lagos, Nigeria",
            condition: item.condition || "New",
            imageUrl: item.images?.[0]?.url || "/placeholder.jpg",
            isVerified: true, 
            rating: 4.8,
            reviewsCount: 12,
          }));
          setListings(mappedData);
        }
      } catch (error) {
        console.error("Error fetching latest listings:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchListings();
  }, []);

  return (
    <section className="py-20 bg-[#F9FAFB]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-end mb-10">
          <div>
            <h2 className="text-3xl font-extrabold text-[#002147]">Latest Arrivals</h2>
            <p className="text-gray-500 mt-1">Discover our newest inventory</p>
          </div>
          <Link href="/listings" className="text-sm font-bold text-[#EB3B18] hover:underline">
            See all →
          </Link>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-24">
            <Loader2 className="w-10 h-10 text-[#EB3B18] animate-spin mb-4" />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
            {listings.map((item) => (
              <HomeListingCard key={item.id} item={item} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
};