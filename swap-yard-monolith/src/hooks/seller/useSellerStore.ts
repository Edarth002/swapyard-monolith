import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export interface Listing {
    id: string;
    name: string;
    price: number;
    condition: string;
    status: string;
    category?: {
        id: string;
        name: string;
        image: string | null;
    } | string;
    views?: number;    
    images: { url: string }[];
}

export interface SellerProfile {
    id: string; 
    firstName: string;
    lastName: string;
    bio: string;
    profileImageUrl: string | null;
    createdAt?: string;
    isVerified?: boolean;
}

// Interface for Reviews
export interface Review {
    id: string;
    rating: number;
    comment: string | null;
    createdAt: string;
    buyer: {
        id: string;
        firstname?: string;
        lastname?: string;
        image?: string;
    };
}

export function useSellerStore() {
    const router = useRouter();
    
    // Core Data States
    const [listings, setListings] = useState<Listing[]>([]);
    const [sellerProfile, setSellerProfile] = useState<SellerProfile | null>(null); 
    const [reviews, setReviews] = useState<Review[]>([]);
    const [reviewStats, setReviewStats] = useState({ rating: 0, count: 0 });
    
    // UI States
    const [isLoading, setIsLoading] = useState(true);
    const [isDeleting, setIsDeleting] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<string | null>(null);
    const [error, setError] = useState("");

    // Filter States
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("All");

    useEffect(() => {
        const initializeStore = async () => {
            setIsLoading(true);
            try {
                const profileData = await fetchSellerProfile();
                
                // Fetch listings and reviews in parallel ONLY after we have the seller's ID
                if (profileData && profileData.id) {
                    await Promise.all([
                        fetchStoreItems(profileData.id),
                        fetchReviews(profileData.id)
                    ]);
                }

            } catch (err) {
                console.error("Initialization error", err);
            } finally {
                setIsLoading(false);
            }
        };

        initializeStore();
    }, []);

    const fetchSellerProfile = async () => {
        try {
            const res = await fetch("/api/auth/me", {
                credentials: "include"
            });
            if (!res.ok) return null;
            const data = await res.json();
            
            const profile = {
                id: data.user.id,
                firstName: data.user.firstname || "",
                lastName: data.user.lastname || "",
                bio: data.user.bio || "",
                profileImageUrl: data.user.image || null, 
                createdAt: data.user.createdAt,
                isVerified: true 
            };
            
            setSellerProfile(profile);
            return profile;
        } catch (err) {
            console.error("Failed to fetch profile data for store header", err);
            return null;
        }
    };

    const fetchStoreItems = async (sellerId: string) => {
        try {
            setError("");
            const res = await fetch(`/api/listing?sellerId=${sellerId}&limit=50`, {
                credentials: "include"
            });
            const data = await res.json();

            if (!res.ok) throw new Error(data.message || "Failed to fetch store items");

            setListings(data.items || []);
        } catch (err: any) {
            setError(err.message);
        }
    };

    // Fetch Reviews Function
    const fetchReviews = async (sellerId: string) => {
        try {
            const res = await fetch(`/api/review?sellerId=${sellerId}&limit=50`);
            const data = await res.json();

            if (!res.ok) throw new Error(data.message || "Failed to fetch reviews");

            const fetchedReviews = data.items || [];
            setReviews(fetchedReviews);

            // Calculate dynamic stats
            if (fetchedReviews.length > 0) {
                const sum = fetchedReviews.reduce((acc: number, curr: Review) => acc + curr.rating, 0);
                setReviewStats({
                    rating: sum / fetchedReviews.length,
                    count: data.meta?.total || fetchedReviews.length
                });
            }
        } catch (err) {
            console.error("Failed to fetch reviews", err);
        }
    };

    const handleEdit = (id: string) => {
        router.push(`/seller/edit-listing/${id}`);
    };

    const confirmDelete = (id: string) => setItemToDelete(id);
    const cancelDelete = () => setItemToDelete(null);

    const executeDelete = async () => {
        if (!itemToDelete) return;

        try {
            setIsDeleting(true);
            setError("");

            const res = await fetch(`/api/listing/${itemToDelete}`, {
                method: "DELETE",
                credentials: "include",
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.message || "Failed to delete listing");
            }

            setListings(prev => prev.filter(item => item.id !== itemToDelete));
            setItemToDelete(null);

        } catch (err: any) {
            console.error("Delete error:", err);
            setError(err.message);
        } finally {
            setIsDeleting(false);
        }
    };

    const filteredItems = listings.filter(item => {
        const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
        const mappedStatus = item.status === "AVAILABLE" ? "Active" : 
                             item.status === "SOLD" ? "Sold" : "Draft";
        const matchesStatus = statusFilter === "All" || mappedStatus === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const formatPrice = (amount: number) => {
        return new Intl.NumberFormat('en-NG', {
            style: 'currency',
            currency: 'NGN',
            minimumFractionDigits: 0
        }).format(amount);
    };

    return {
        state: { 
            searchQuery, 
            statusFilter, 
            filteredItems, 
            isLoading, 
            isDeleting, 
            itemToDelete, 
            error, 
            sellerProfile,
            reviews,      
            reviewStats   
        },
        setters: { setSearchQuery, setStatusFilter },
        handlers: { handleEdit, confirmDelete, cancelDelete, executeDelete },
        helpers: { formatPrice }
    };
}