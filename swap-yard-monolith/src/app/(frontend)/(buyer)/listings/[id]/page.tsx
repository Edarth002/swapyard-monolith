"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation"; // <-- Added this
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
  ArrowLeft // <-- Added this icon for the back button
} from "lucide-react";
import ValuePropsSection from "@/components/buyer/listings/ValuePropsSection";

// Fresh, verified image URLs
const productImages = [
  "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=1000&q=80",
  "https://images.unsplash.com/photo-1540574163026-643ea20d25b5?auto=format&fit=crop&w=1000&q=80",
  "https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?auto=format&fit=crop&w=1000&q=80",
  "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1000&q=80",
];

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
    title: "Modern Wooden Desk and Chair",
    price: 35000,
    location: "Ogun, Ago-Iwoye",
    rating: 4.8,
    reviewsCount: 32,
    imageUrl: "https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?auto=format&fit=crop&w=500&q=80"
  }
];

export default function ProductDetailsPage() {
  const router = useRouter(); // <-- Added this
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      minimumFractionDigits: 0,
    }).format(price);
  };

  return (
    <div className="min-h-screen bg-white">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* ADDED THIS: Back Button */}
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
          <Link href="/furniture" className="hover:text-gray-900 transition-colors cursor-pointer">Furniture</Link>
          <ChevronRight className="w-3 h-3 mx-1" />
          <span className="text-gray-900 font-extrabold">Luxurious White Leather Sofa</span>
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
                style={{ height: '450px' }} // Hardcoded height so it NEVER collapses
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img 
                  src={productImages[activeImageIndex]} 
                  alt="Luxurious White Leather Sofa" 
                  className="w-full h-full object-cover absolute inset-0 animate-in fade-in duration-300" 
                />
                <button 
                  aria-label="Add to wishlist"
                  className="absolute top-4 right-4 p-2.5 bg-white/90 backdrop-blur-sm rounded-full text-gray-400 hover:text-red-500 shadow-sm transition-colors cursor-pointer z-10"
                >
                  <Heart className="w-5 h-5" />
                </button>
              </div>

              {/* Thumbnails - Forced Height */}
              <div className="flex flex-row w-full gap-3 sm:gap-4">
                {productImages.map((img, idx) => (
                  <button 
                    key={idx}
                    aria-label={`View image ${idx + 1}`}
                    onClick={() => setActiveImageIndex(idx)}
                    style={{ height: '110px' }} // Hardcoded height
                    className={`relative flex-1 rounded-xl overflow-hidden transition-all cursor-pointer ${
                      activeImageIndex === idx ? "ring-2 ring-[#EB3B18] ring-offset-2 opacity-100" : "opacity-60 hover:opacity-100"
                    }`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={img} alt={`Thumbnail ${idx + 1}`} className="w-full h-full object-cover absolute inset-0" />
                  </button>
                ))}
              </div>
            </div>

            {/* Product Description */}
            <div className="mt-4">
              <div className="mb-4">
                <h2 className="text-2xl font-extrabold text-gray-900">
                  Product Description
                </h2>
              </div>
              <div className="text-[15px] text-gray-700 space-y-4 leading-relaxed font-medium">
                <p>
                  Elevate your living space with this exquisite, contemporary White leather Sofa. 
                  Purchased brand new in late 2023, this piece has been meticulously maintained in a 
                  smoke-free and pet-free environment. The premium full-grain leather offers a 
                  buttery-soft texture while ensuring long-term durability.
                </p>
                <p>
                  Designed with comfort in mind, it features high-density foam cushions that provide 
                  exceptional lumbar support without losing their shape. The minimalist chrome legs 
                  add a touch of modern sophistication, making it a perfect fit for both high-end 
                  apartments and cozy modern homes.
                </p>
                <ul className="list-disc pl-5 space-y-2 mt-4 text-gray-800">
                  <li>Included: All 4 original matching throw cushions.</li>
                  <li>Condition: No rips, stains, or major flaws. Barely visible wear.</li>
                  <li>Material: Genuine Italian leather with protective coating.</li>
                </ul>
              </div>
            </div>
          </div>

          {/* ======================================================== */}
          {/* RIGHT COLUMN - Details, Price & Actions                    */}
          {/* ======================================================== */}
          <div className="w-full lg:w-[40%] flex flex-col">
            
            {/* DESKTOP ONLY: Title & Price */}
            <div className="hidden lg:flex flex-col">
              <div className="flex flex-wrap gap-2 mb-4">
                <span className="px-3 py-1 bg-white border border-gray-200 text-gray-800 text-[11px] font-bold rounded-md tracking-wide shadow-sm">
                  Verified Listing
                </span>
                <span className="px-3 py-1 bg-white border border-gray-200 text-gray-800 text-[11px] font-bold rounded-md tracking-wide shadow-sm">
                  New in 2024
                </span>
              </div>
              <h1 className="text-3xl lg:text-4xl font-extrabold text-gray-900 leading-tight mb-3">
                Luxurious White Leather Sofa
              </h1>
              <div className="text-[2.5rem] font-extrabold text-[#002147] tracking-tight mb-4">
                ₦70,000
              </div>
            </div>

            {/* Meta Stats */}
            <div className="flex items-center gap-6 text-xs font-bold text-gray-600 mb-8 pb-6 border-b border-gray-100">
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-gray-400" /> Active listing
              </div>
              <div className="flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-gray-400" /> 5 days ago
              </div>
              <button 
                aria-label="Share listing"
                className="flex items-center gap-1.5 hover:text-gray-900 transition-colors cursor-pointer ml-auto"
              >
                <Share2 className="w-4 h-4 text-gray-400" /> Share
              </button>
            </div>

            {/* Quick Specifications */}
            <div className="bg-[#F8F9FA] rounded-2xl p-5 mb-8 border border-gray-100">
              <h3 className="text-sm font-extrabold text-gray-900 mb-4">Quick Specifications</h3>
              <div className="flex flex-col gap-3 text-[13px]">
                <div className="flex justify-between items-center pb-2.5 border-b border-gray-200/60">
                  <span className="text-gray-500 font-semibold">Condition</span>
                  <span className="font-extrabold text-gray-900">Barely Used</span>
                </div>
                <div className="flex justify-between items-center pb-2.5 border-b border-gray-200/60">
                  <span className="text-gray-500 font-semibold">Category</span>
                  <span className="font-extrabold text-gray-900">Furniture &gt; Sofas</span>
                </div>
                <div className="flex justify-between items-center pb-2.5 border-b border-gray-200/60">
                  <span className="text-gray-500 font-semibold">Color</span>
                  <span className="font-extrabold text-gray-900">White</span>
                </div>
                <div className="flex justify-between items-center pb-2.5 border-b border-gray-200/60">
                  <span className="text-gray-500 font-semibold">Dimensions</span>
                  <span className="font-extrabold text-gray-900">220cm x 95cm x 85cm</span>
                </div>
                <div className="flex justify-between items-center pb-2.5 border-b border-gray-200/60">
                  <span className="text-gray-500 font-semibold">Weight</span>
                  <span className="font-extrabold text-gray-900">Approx. 55kg</span>
                </div>
                <div className="flex justify-between items-center pb-2.5 border-b border-gray-200/60">
                  <span className="text-gray-500 font-semibold">Assembly</span>
                  <span className="font-extrabold text-gray-900">Not required</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500 font-semibold">Material</span>
                  <span className="font-extrabold text-gray-900">Genuine Leather</span>
                </div>
              </div>
            </div>

            {/* Add to Cart & Quantity Row */}
            <div className="flex flex-wrap items-center gap-3 mb-8">
              <button className="flex-1 min-w-[140px] bg-[#EB3B18] hover:bg-[#d93616] text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 transition-colors shadow-sm cursor-pointer">
                <ShoppingCart className="w-5 h-5" />
                Add to cart
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
                {quantity} item(s) added
              </span>
            </div>

            {/* Seller Card */}
            <div className="border border-gray-100 rounded-2xl p-5 mb-6 shadow-sm bg-white">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full overflow-hidden relative bg-gray-100 border border-gray-200">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80" alt="Seller Avatar" className="w-full h-full object-cover absolute inset-0" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <h4 className="font-extrabold text-gray-900 text-sm">Olajide Mobilade</h4>
                      <ShieldCheck className="w-4 h-4 text-green-600" />
                    </div>
                    <div className="flex items-center text-[11px] text-gray-500 font-semibold">
                      <MapPin className="w-3 h-3 mr-1" /> Ikeja, Lagos
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
                    <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" /> 4.7
                  </div>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">MEMBER</p>
                  <p className="text-sm font-extrabold text-gray-900">2024</p>
                </div>
              </div>

              <div className="flex gap-3">
                <button className="flex-1 flex items-center justify-center gap-2 py-3 border-2 border-gray-100 text-gray-800 font-extrabold text-xs rounded-xl hover:bg-gray-50 transition-colors cursor-pointer">
                  <Tag className="w-4 h-4" /> Make Offer
                </button>
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
                2
              </div>
              <div className="absolute top-[25%] right-[20%] text-[#002147] font-extrabold text-[10px] bg-white/80 px-2 py-1 rounded backdrop-blur-sm shadow-sm">
                Odo-Iya mkt<br/>Lagos
              </div>

              <div className="absolute bottom-0 inset-x-0 bg-white/95 backdrop-blur-sm p-3 flex justify-between items-center border-t border-gray-200">
                <div className="flex items-center text-[11px] font-extrabold text-gray-800">
                  <MapPin className="w-4 h-4 mr-1.5 text-gray-500" /> Ikeja, Lagos
                </div>
                <button className="text-[11px] font-extrabold text-[#002147] hover:underline cursor-pointer">
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
            {relatedListings.map((item, i) => (
              <div key={i} className="flex flex-col gap-3 group cursor-pointer shrink-0" style={{ width: '217.71px' }}>
                <div className="relative w-full rounded-2xl overflow-hidden bg-gray-100 border border-gray-100" style={{ height: '190px' }}>
                    <Link href={`/listings/${item.id}`} className="absolute inset-0 z-0">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 absolute inset-0" />
                    </Link>
                    <button 
                      aria-label="Add to wishlist"
                      className="absolute top-3 right-3 p-1.5 bg-white rounded-full text-gray-400 hover:text-red-500 shadow-sm transition-colors cursor-pointer z-10"
                    >
                        <Heart className="w-4 h-4" />
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
            ))}
          </div>
        </div>

        <ValuePropsSection />
      </main>
    </div>
  );
}