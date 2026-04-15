import { useState, ChangeEvent, FormEvent, useEffect } from "react";

interface KycFormData {
    fullName: string;
    emailAddress: string;
    phoneNumber: string;
    dateOfBirth: string;
    businessName: string;
    vatNumber: string;
    ninNumber: string;
}

export function useSellerKyc() {
    const [isFetchingProfile, setIsFetchingProfile] = useState(true);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);

    const [formData, setFormData] = useState<KycFormData>({
        fullName: "",
        emailAddress: "",
        phoneNumber: "",
        dateOfBirth: "",
        businessName: "",
        vatNumber: "",
        ninNumber: ""
    });

    const [files, setFiles] = useState({
        profilePicture: null as File | null,
        businessLicense: null as File | null,
        verifiedId: null as File | null
    });

    // --- NEW: Fetch Profile Data on Mount ---
    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const res = await fetch("/api/auth/me");
                if (res.ok) {
                    const data = await res.json();
                    const user = data.user;
                    
                    setFormData(prev => ({
                        ...prev,
                        fullName: `${user.firstname || ""} ${user.lastname || ""}`.trim(),
                        emailAddress: user.email || "",
                        phoneNumber: user.phoneNumber || "",
                        // Format date for the HTML date input (YYYY-MM-DD)
                        dateOfBirth: user.dateOfBirth ? new Date(user.dateOfBirth).toISOString().split('T')[0] : ""
                    }));
                }
            } catch (err) {
                console.error("Failed to load user profile", err);
            } finally {
                setIsFetchingProfile(false);
            }
        };

        fetchUserData();
    }, []);

    const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
        const { id, value } = e.target;
        setFormData(prev => ({ ...prev, [id]: value }));
    };

    const handleFileChange = (e: ChangeEvent<HTMLInputElement>, fileType: keyof typeof files) => {
        if (e.target.files && e.target.files[0]) {
            setFiles(prev => ({ ...prev, [fileType]: e.target.files![0] }));
        }
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError("");
        setSuccess(false);

        try {
            const submitData = new FormData();
            
            // Map text fields correctly to match backend schema
            if (formData.fullName) submitData.append("fullName", formData.fullName);
            if (formData.businessName) submitData.append("businessName", formData.businessName);
            if (formData.vatNumber) submitData.append("vatNumber", formData.vatNumber);
            if (formData.ninNumber) submitData.append("nin", formData.ninNumber); // Mapped

            // Append files with exact names backend expects
            if (files.businessLicense) submitData.append("businessLicense", files.businessLicense);
            if (files.verifiedId) submitData.append("idDocument", files.verifiedId); // Mapped

            const res = await fetch("/api/verification", { 
                method: "POST",
                body: submitData
            });

            const data = await res.json();

            if (!res.ok) {
                if (data.error && typeof data.error === 'object') {
                    const firstError = Object.values(data.error).flat()[0];
                    throw new Error(typeof firstError === 'string' ? firstError : "Validation failed");
                }
                throw new Error(data.error || data.message || "Failed to submit verification");
            }

            setSuccess(true);
            window.scrollTo({ top: 0, behavior: 'smooth' });
            
        } catch (err: any) {
            console.error("KYC Submit Error:", err);
            setError(err.message || "An error occurred during submission");
        } finally {
            setIsLoading(false);
        }
    };

    return {
        formData,
        files,
        isLoading,
        isFetchingProfile,
        error,
        success,
        handleInputChange,
        handleFileChange,
        handleSubmit
    };
}