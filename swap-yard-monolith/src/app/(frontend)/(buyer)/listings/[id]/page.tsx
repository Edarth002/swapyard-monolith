"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation"; 
import { 
  Heart, 
  Share2, 
  Clock, 
  ShieldCheck, 
  Minus, 
  Plus, 
  MessageSquare, 
  Tag, 
  MapPin, 
  Star, 
  ChevronRight,
  ShoppingCart,
  ArrowLeft,
  Loader2
} from "lucide-react";
import ValuePropsSection from "@/components/buyer/listings/ValuePropsSection";
import { useCart } from "@/app/context/CartContext"; 
import { useWishlist } from "@/app/context/WishlistContext"; // <-- Added Wishlist Context
import toast, { Toaster } from "react-hot-toast"; 

const relatedListings = [
  {
    id: "101",
    title: "Wireless earbuds with neon lighting",
    price: 35000,
    location: "Ogun, Ago-Iwoye",
    rating: 4.8,
    reviewsCount: 11,
    imageUrl: "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?auto=format&fit=crop&w=500&q=80"
  },
  {
    id: "102",
    title: "Hardcover books by Sidney Sheldon",
    price: 35000,
    location: "Ogun, Ago-Iwoye",
    rating: 4.9,
    reviewsCount: 24,
    imageUrl: "https://images.unsplash.com/photo-1589829085413-56de8ae18c73?auto=format&fit=crop&w=500&q=80"
  },
  {
    id: "103",
    title: "Wireless Cyberpunk Headphones",
    price: 35000,
    location: "Ogun, Ago-Iwoye",
    rating: 4.7,
    reviewsCount: 8,
    imageUrl: "https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?auto=format&fit=crop&w=500&q=80"
  },
  {
    id: "104",
    title: "Modern Arm Chair Black and White Upholstery",
    price: 35000,
    location: "Ogun, Ago-Iwoye",
    rating: 4.5,
    reviewsCount: 16,
    imageUrl: "https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?auto=format&fit=crop&w=500&q=80"
  },
  {
    id: "105",
    title: "Modern Arm Chair Black and White Upholstery",
    price: 35000,
    location: "Ogun, Ago-Iwoye",
    rating: 4.5,
    reviewsCount: 16,
    imageUrl: "https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?auto=format&fit=crop&w=500&q=80"
  }
];

// Fallback images if the product has none uploaded
const FALLBACK_IMAGES = [
  "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=1000&q=80",
];

export default function ProductDetailsPage() {
  const router = useRouter(); 
  const params = useParams(); // Grab the ID from the URL

  const { addToCart } = useCart(); 
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist(); // <-- Added Wishlist Hook

  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);

  // Data fetching state
  const [product, setProduct] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      minimumFractionDigits: 0,
    }).format(price);
  };

  useEffect(() => {
    if (!params.id) return;

    const fetchProductDetails = async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/listing/${params.id}`);
        const data = await res.json();
        
        if (data.ok) {
          setProduct(data.listing);
        } else {
          setError(data.message || "Failed to load product details.");
        }
      } catch (err) {
        console.error("Fetch error:", err);
        setError("Network error occurred.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchProductDetails();
  }, [params.id]);

  // Determine images to use
  const displayImages = product?.images && product.images.length > 0 
    ? product.images.map((img: any) => img.url) 
    : FALLBACK_IMAGES;

  const handleAddToCart = async () => {
    if (!product || product.status !== 'AVAILABLE') return;
    
    // 1. Instantly update the cart context (UI)
    addToCart({
      id: product.id,
      title: product.name,
      price: product.price,
      imageUrl: displayImages[0], 
      quantity: quantity,
    });

    // 2. Instantly show the success toast
    toast.success(`Successfully added ${quantity} item(s) to your cart!`);
    
    // 3. Quietly sync with the database in the background
    try {
      const res = await fetch('/api/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          listingId: product.id,
          quantity: quantity,
        }),
      });

      if (!res.ok) {
        if (res.status === 401) {
          toast.error("Please log in as a buyer to save items across devices.");
        } else {
          const data = await res.json();
          console.error("Cart sync error:", data.message);
        }
      }
    } catch (err) {
      console.error("Error syncing cart to database:", err);
    }
  };

  // <-- NEW: Toggle Wishlist Function for Main Product
  const handleToggleWishlist = () => {
    if (!product) return;
    
    if (isInWishlist(product.id)) {
      removeFromWishlist(product.id);
      toast.success("Removed from wishlist");
    } else {
      addToWishlist({
        id: product.id,
        title: product.name,
        price: product.price,
        imageUrl: displayImages[0],
        location: [product.location, product.state].filter(Boolean).join(", "),
        rating: 4.8, 
        reviewsCount: 12,
      });
      toast.success("Added to wishlist!");
    }
  };

  // <-- NEW: Generic Toggle for Related Products
  const toggleRelatedWishlist = (e: React.MouseEvent, item: any) => {
    e.preventDefault(); 
    e.stopPropagation();
    
    if (isInWishlist(item.id)) {
      removeFromWishlist(item.id);
      toast.success("Removed from wishlist");
    } else {
      addToWishlist(item);
      toast.success("Added to wishlist!");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white">
        <Loader2 className="w-10 h-10 text-[#EB3B18] animate-spin mb-4" />
        <p className="text-gray-500 font-medium">Loading listing details...</p>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Listing Not Found</h2>
        <p className="text-gray-500 mb-6">{error || "The item you are looking for does not exist or has been removed."}</p>
        <button onClick={() => router.back()} className="px-6 py-2 bg-[#EB3B18] text-white font-bold rounded-lg hover:bg-[#d93616] transition-colors">
          Go Back
        </button>
      </div>
    );
  }

  // Format the date
  const createdDaysAgo = Math.max(0, Math.floor((new Date().getTime() - new Date(product.createdAt).getTime()) / (1000 * 3600 * 24)));
  const isMainProductWishlisted = isInWishlist(product.id); // <-- Check if main product is in wishlist

  return (
    <div className="min-h-screen bg-white">
      <Toaster position="top-center" />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Back Button */}
        <button 
          onClick={() => router.back()} 
          className="flex items-center gap-2 text-sm font-bold text-gray-600 hover:text-gray-900 transition-colors mb-6 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Listings
        </button>

        {/* Breadcrumbs */}
        <nav className="flex items-center text-xs text-gray-500 mb-6 font-semibold">
          <Link href="/" className="hover:text-gray-900 transition-colors cursor-pointer">Home</Link>
          <ChevronRight className="w-3 h-3 mx-1" />
          <Link href="/listings" className="hover:text-gray-900 transition-colors cursor-pointer">Listings</Link>
          <ChevronRight className="w-3 h-3 mx-1" />
          <span className="text-gray-900 font-extrabold line-clamp-1">{product.category?.name || "Uncategorized"}</span>
        </nav>

        {/* MAIN LAYOUT: Unbreakable Flexbox Layout */}
        <div className="flex flex-col lg:flex-row gap-8 lg:gap-12 xl:gap-16 mb-16">
          
          {/* ======================================================== */}
          {/* LEFT COLUMN - Images & Description                         */}
          {/* ======================================================== */}
          <div className="w-full lg:w-[60%] flex flex-col gap-8">

            {/* Image Gallery */}
            <div className="flex flex-col gap-4">
              {/* Main Large Image - Forced Height */}
              <div 
                className="relative w-full rounded-2xl overflow-hidden bg-gray-100 border border-gray-200" 
                style={{ height: '450px' }} 
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img 
                  src={displayImages[activeImageIndex]} 
                  alt={product.name} 
                  className="w-full h-full object-cover absolute inset-0 animate-in fade-in duration-300" 
                />
                <button 
                  onClick={handleToggleWishlist}
                  aria-label={isMainProductWishlisted ? "Remove from wishlist" : "Add to wishlist"}
                  className={`absolute top-4 right-4 p-2.5 bg-white/90 backdrop-blur-sm rounded-full shadow-sm transition-colors cursor-pointer z-10 ${
                    isMainProductWishlisted ? "text-red-500 hover:text-red-600" : "text-gray-400 hover:text-red-500"
                  }`}
                >
                  <Heart className={`w-5 h-5 ${isMainProductWishlisted ? "fill-current" : ""}`} />
                </button>
              </div>

              {/* Thumbnails - Forced Height */}
              {displayImages.length > 1 && (
                <div className="flex flex-row w-full gap-3 sm:gap-4 overflow-x-auto p-2">
                  {displayImages.map((img: string, idx: number) => (
                    <button 
                      key={idx}
                      aria-label={`View image ${idx + 1}`}
                      onClick={() => setActiveImageIndex(idx)}
                      style={{ height: '110px', minWidth: '110px' }} 
                      className={`relative rounded-xl overflow-hidden transition-all cursor-pointer shrink-0 ${
                        activeImageIndex === idx ? "ring-2 ring-[#EB3B18] ring-offset-2 opacity-100" : "opacity-60 hover:opacity-100"
                      }`}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={img} alt={`Thumbnail ${idx + 1}`} className="w-full h-full object-cover absolute inset-0" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Product Description */}
            <div className="mt-4">
              <div className="mb-4">
                <h2 className="text-2xl font-extrabold text-gray-900">
                  Product Description
                </h2>
              </div>
              <div className="text-[15px] text-gray-700 space-y-4 leading-relaxed font-medium whitespace-pre-wrap">
                {product.description || "No description provided by the seller."}
              </div>
            </div>
          </div>

          {/* ======================================================== */}
          {/* RIGHT COLUMN - Details, Price & Actions                    */}
          {/* ======================================================== */}
          <div className="w-full lg:w-[40%] flex flex-col">
            
            {/* Title & Price */}
            <div className="flex flex-col">
              <div className="flex flex-wrap gap-2 mb-4">
                <span className="px-3 py-1 bg-white border border-gray-200 text-gray-800 text-[11px] font-bold rounded-md tracking-wide shadow-sm">
                  Verified Listing
                </span>
                <span className={`px-3 py-1 border text-[11px] font-bold rounded-md tracking-wide shadow-sm ${
                  product.status === 'AVAILABLE' ? 'bg-green-50 border-green-200 text-green-700' : 'bg-gray-50 border-gray-200 text-gray-700'
                }`}>
                  {product.status}
                </span>
              </div>
              <h1 className="text-3xl lg:text-4xl font-extrabold text-gray-900 leading-tight mb-3">
                {product.name}
              </h1>
              <div className="text-[2.5rem] font-extrabold text-[#002147] tracking-tight mb-4">
                {formatPrice(product.price)}
              </div>
            </div>

            {/* Meta Stats */}
            <div className="flex items-center gap-6 text-xs font-bold text-gray-600 mb-8 pb-6 border-b border-gray-100">
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-gray-400" /> Active listing
              </div>
              <div className="flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-gray-400" /> {createdDaysAgo === 0 ? "Listed today" : `${createdDaysAgo} days ago`}
              </div>
              <button 
                aria-label="Share listing"
                className="flex items-center gap-1.5 hover:text-gray-900 transition-colors cursor-pointer ml-auto"
              >
                <Share2 className="w-4 h-4 text-gray-400" /> Share
              </button>
            </div>

            {/* Quick Specifications mapped to Real DB Fields */}
            <div className="bg-[#F8F9FA] rounded-2xl p-5 mb-8 border border-gray-100">
              <h3 className="text-sm font-extrabold text-gray-900 mb-4">Quick Specifications</h3>
              <div className="flex flex-col gap-3 text-[13px]">
                <div className="flex justify-between items-center pb-2.5 border-b border-gray-200/60">
                  <span className="text-gray-500 font-semibold">Condition</span>
                  <span className="font-extrabold text-gray-900">{product.condition || "N/A"}</span>
                </div>
                <div className="flex justify-between items-center pb-2.5 border-b border-gray-200/60">
                  <span className="text-gray-500 font-semibold">Category</span>
                  <span className="font-extrabold text-gray-900">{product.category?.name || "N/A"}</span>
                </div>
                <div className="flex justify-between items-center pb-2.5 border-b border-gray-200/60">
                  <span className="text-gray-500 font-semibold">Location</span>
                  <span className="font-extrabold text-gray-900">{product.location || "N/A"}</span>
                </div>
                <div className="flex justify-between items-center pb-2.5 border-b border-gray-200/60">
                  <span className="text-gray-500 font-semibold">State</span>
                  <span className="font-extrabold text-gray-900">{product.state || "N/A"}</span>
                </div>
                <div className="flex justify-between items-center pb-2.5 border-b border-gray-200/60">
                  <span className="text-gray-500 font-semibold">Delivery</span>
                  <span className="font-extrabold text-gray-900">{product.offersDelivery ? "Available" : "Pickup Only"}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500 font-semibold">Negotiable</span>
                  <span className="font-extrabold text-gray-900">{product.negotiable ? "Yes" : "No"}</span>
                </div>
              </div>
            </div>

            {/* Add to Cart & Quantity Row */}
            <div className="flex flex-wrap items-center gap-3 mb-8">
              <button 
                onClick={handleAddToCart}
                disabled={product.status !== 'AVAILABLE'}
                className="flex-1 min-w-[140px] bg-[#EB3B18] hover:bg-[#d93616] disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 transition-colors shadow-sm cursor-pointer"
              >
                <ShoppingCart className="w-5 h-5" />
                {product.status === 'AVAILABLE' ? 'Add to cart' : 'Unavailable'}
              </button>
              
              <div className="flex items-center bg-[#F8F9FA] rounded-xl px-1 h-[52px]">
                <button 
                  aria-label="Decrease quantity"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-10 h-10 flex items-center justify-center text-[#002147] hover:bg-gray-200 rounded-lg transition-colors cursor-pointer"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="w-8 text-center font-extrabold text-gray-900 text-sm">
                  {quantity}
                </span>
                <button 
                  aria-label="Increase quantity"
                  onClick={() => setQuantity(quantity + 1)}
                  className="w-10 h-10 flex items-center justify-center text-white bg-[#002147] hover:bg-[#001733] rounded-lg transition-colors cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              <span className="text-xs font-extrabold text-gray-500 ml-2">
                {quantity} item(s) selected
              </span>
            </div>

            {/* Seller Card */}
            <div className="border border-gray-100 rounded-2xl p-5 mb-6 shadow-sm bg-white">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full overflow-hidden relative bg-gray-100 border border-gray-200">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img 
                      src={product.seller?.image || "https://ui-avatars.com/api/?name=" + (product.seller?.firstname || "User")} 
                      alt="Seller Avatar" 
                      className="w-full h-full object-cover absolute inset-0" 
                    />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <h4 className="font-extrabold text-gray-900 text-sm">
                        {product.seller?.firstname} {product.seller?.lastname}
                      </h4>
                      <ShieldCheck className="w-4 h-4 text-green-600" />
                    </div>
                    <div className="flex items-center text-[11px] text-gray-500 font-semibold">
                      <MapPin className="w-3 h-3 mr-1" /> {product.location || "N/A"}, {product.state || "N/A"}
                    </div>
                  </div>
                </div>
                <button className="text-[11px] font-extrabold text-[#002147] hover:underline cursor-pointer">
                  View Profile
                </button>
              </div>

              <div className="flex items-center gap-10 mb-6">
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">RATING</p>
                  <div className="flex items-center gap-1 text-sm font-extrabold text-gray-900">
                    <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" /> 4.8
                  </div>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">MEMBER</p>
                  <p className="text-sm font-extrabold text-gray-900">2024</p>
                </div>
              </div>

              <div className="flex gap-3">
                {product.negotiable && (
                  <button className="flex-1 flex items-center justify-center gap-2 py-3 border-2 border-gray-100 text-gray-800 font-extrabold text-xs rounded-xl hover:bg-gray-50 transition-colors cursor-pointer">
                    <Tag className="w-4 h-4" /> Make Offer
                  </button>
                )}
                <button className="flex-1 flex items-center justify-center gap-2 py-3 bg-[#EB3B18] text-white font-extrabold text-xs rounded-xl hover:bg-[#d93616] transition-colors cursor-pointer shadow-sm">
                  <MessageSquare className="w-4 h-4" /> Message
                </button>
              </div>
            </div>

            {/* Static Map Snippet */}
            <div className="relative w-full rounded-2xl overflow-hidden border border-gray-200 shadow-sm bg-gray-100" style={{ height: '140px' }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img 
                src="https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&w=600&q=80" 
                alt="Map snippet" 
                className="w-full h-full object-cover opacity-80 absolute inset-0" 
              />
              
              <div className="absolute top-[40%] left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#002147] text-white w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shadow-lg z-10 cursor-pointer">
                1
              </div>

              <div className="absolute bottom-0 inset-x-0 bg-white/95 backdrop-blur-sm p-3 flex justify-between items-center border-t border-gray-200">
                <div className="flex items-center text-[11px] font-extrabold text-gray-800 line-clamp-1 pr-2">
                  <MapPin className="w-4 h-4 mr-1.5 text-gray-500 shrink-0" /> {product.location || "N/A"}, {product.state || "N/A"}
                </div>
                <button className="text-[11px] font-extrabold text-[#002147] hover:underline cursor-pointer shrink-0">
                  Get Directions
                </button>
              </div>
            </div>

          </div>
        </div>

        {/* ========================================= */}
        {/* You Might Also Like Section               */}
        {/* ========================================= */}
        <div className="mt-12 mb-16 border-t border-gray-100 pt-16">
          <h2 className="text-2xl font-extrabold text-gray-900 mb-1">You Might Also Like</h2>
          <p className="text-sm text-gray-500 font-medium mb-8">Handpicked items based on your browsing history.</p>
          
          <div className="flex overflow-x-auto gap-4 sm:gap-6 pb-4">
            {relatedListings.map((item, i) => {
              const isRelatedWishlisted = isInWishlist(item.id); // <-- Check if item is in wishlist

              return (
                <div key={i} className="flex flex-col gap-3 group cursor-pointer shrink-0" style={{ width: '217.71px' }}>
                  <div className="relative w-full rounded-2xl overflow-hidden bg-gray-100 border border-gray-100" style={{ height: '190px' }}>
                      <Link href={`/listings/${item.id}`} className="absolute inset-0 z-0">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 absolute inset-0" />
                      </Link>
                      <button 
                        onClick={(e) => toggleRelatedWishlist(e, item)}
                        aria-label={isRelatedWishlisted ? "Remove from wishlist" : "Add to wishlist"}
                        className={`absolute top-3 right-3 p-1.5 bg-white rounded-full shadow-sm transition-colors cursor-pointer z-10 ${
                          isRelatedWishlisted ? "text-red-500 hover:text-red-600" : "text-gray-400 hover:text-red-500"
                        }`}
                      >
                          <Heart className={`w-4 h-4 ${isRelatedWishlisted ? "fill-current" : ""}`} />
                      </button>
                  </div>
                  <div className="flex flex-col flex-1">
                      <Link href={`/listings/${item.id}`} className="hover:text-[#EB3B18] transition-colors z-10 inline-block w-fit">
                        <h3 className="font-bold text-[13px] text-gray-900 leading-tight mb-1 line-clamp-2 min-h-[2.5rem]">
                            {item.title}
                        </h3>
                      </Link>
                      <div className="flex items-center text-[11px] text-gray-500 font-medium mb-1">
                          <MapPin className="w-3 h-3 mr-1 shrink-0" />
                          <span className="line-clamp-1">{item.location}</span>
                      </div>
                      <div className="flex items-center text-[11px] text-gray-500 font-medium mb-3">
                          <Star className="w-3 h-3 mr-1 text-gray-400" /> {item.rating.toFixed(1)} ({item.reviewsCount})
                      </div>
                      <div className="flex items-center justify-between mt-auto border-t border-gray-100 pt-3">
                          <span className="font-extrabold text-[15px] text-[#002147] tracking-tight">{formatPrice(item.price)}</span>
                          <Link href={`/listings/${item.id}`} className="text-[10px] font-bold px-3 py-1.5 border border-gray-200 rounded-md text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer z-10">
                              View Listing
                          </Link>
                      </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <ValuePropsSection />
      </main>
    </div>
  );
}