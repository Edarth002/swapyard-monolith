"use client";

import { CheckCircle2, FileText, Shield, Upload, Loader2 } from "lucide-react";
import { useSellerKyc } from "@/hooks/seller/useSellerKyc";
import { useRef } from "react";

export default function SellerGetVerified() {
    const { 
        formData, files, isLoading, isFetchingProfile, error, success, 
        handleInputChange, handleFileChange, handleSubmit 
    } = useSellerKyc();

    const profilePicRef = useRef<HTMLInputElement>(null);
    const businessLicenseRef = useRef<HTMLInputElement>(null);
    const verifiedIdRef = useRef<HTMLInputElement>(null);

    // Show a loading state while fetching the profile data
    if (isFetchingProfile) {
        return (
            <div className="flex items-center justify-center min-h-100 bg-white rounded-xl shadow-sm border border-gray-100">
                <Loader2 className="w-8 h-8 animate-spin text-[#002147]" />
            </div>
        );
    }

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 md:p-10 w-full max-w-4xl">
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
                <div>
                    <div className="flex items-center gap-2 mb-3">
                        <CheckCircle2 size={20} className="text-gray-900" aria-hidden="true" />
                        <h3 className="font-bold text-gray-900">Why Verify?</h3>
                    </div>
                    <p className="text-sm text-gray-600 leading-relaxed">
                        Verification helps buyers trust you. Verified sellers get more views and faster responses. Build credibility and stand out from the crowd.
                    </p>
                </div>
                <div>
                    <div className="flex items-center gap-2 mb-3">
                        <FileText size={20} className="text-gray-900" aria-hidden="true" />
                        <h3 className="font-bold text-gray-900">What We Need?</h3>
                    </div>
                    <p className="text-sm text-gray-600 leading-relaxed">
                        Just a quick ID check or phone number confirmation. We'll never share your info—it's just to keep things safe. It only takes 2 minutes.
                    </p>
                </div>
                <div>
                    <div className="flex items-center gap-2 mb-3">
                        <Shield size={20} className="text-gray-900" aria-hidden="true" />
                        <h3 className="font-bold text-gray-900">Security Note</h3>
                    </div>
                    <p className="text-sm text-gray-600 leading-relaxed">
                        All uploaded documents are securely encrypted. We adhere strictly to data protection laws and do not sell your personal data.
                    </p>
                </div>
            </div>

            {error && (
                <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-lg text-sm font-medium">
                    {error}
                </div>
            )}
            
            {success && (
                <div className="mb-6 p-4 bg-green-50 text-green-700 rounded-lg text-sm font-medium border border-green-200">
                    Your verification documents have been submitted successfully and are currently under review.
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-10">
                {/* Personal Information */}
                <div className="space-y-5">
                    <h3 className="text-xl font-bold text-gray-900 border-b border-gray-100 pb-2">Personal Information</h3>
                    
                    <div>
                        <label htmlFor="fullName" className="block text-sm text-gray-700 mb-1.5">Full Name</label>
                        <input id="fullName" value={formData.fullName} onChange={handleInputChange} required type="text" placeholder="Enter your Full Name" className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-[#002147]" />
                    </div>
                    <div>
                        <label htmlFor="emailAddress" className="text-sm text-gray-700 mb-1.5 flex justify-between">
                            Email Address <span className="text-xs text-gray-400 font-normal">Tied to account</span>
                        </label>
                        {/* DISABLED INPUT */}
                        <input id="emailAddress" value={formData.emailAddress} disabled type="email" className="w-full border border-gray-200 bg-gray-50 text-gray-500 rounded-lg px-4 py-3 text-sm cursor-not-allowed" />
                    </div>
                    <div>
                        <label htmlFor="phoneNumber" className="text-sm text-gray-700 mb-1.5 flex justify-between">
                            Phone Number <span className="text-xs text-gray-400 font-normal">Tied to account</span>
                        </label>
                        {/* DISABLED INPUT */}
                        <input id="phoneNumber" value={formData.phoneNumber} disabled type="tel" className="w-full border border-gray-200 bg-gray-50 text-gray-500 rounded-lg px-4 py-3 text-sm cursor-not-allowed" />
                    </div>
                    <div>
                        <label htmlFor="dateOfBirth" className="block text-sm text-gray-700 mb-1.5">Date of Birth</label>
                        <input id="dateOfBirth" value={formData.dateOfBirth} onChange={handleInputChange} required type="date" className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-[#002147]" />
                    </div>
                    <div>
                        <label htmlFor="profilePictureInput" className="block text-sm text-gray-700 mb-1.5">Upload Profile Picture</label>
                        <input id="profilePictureInput" type="file" accept="image/*" className="hidden" ref={profilePicRef} onChange={(e) => handleFileChange(e, 'profilePicture')} />
                        <button type="button" onClick={() => profilePicRef.current?.click()} className="w-full bg-[#374151] hover:bg-[#1f2937] text-white rounded-lg py-3.5 flex items-center justify-center gap-2 transition-colors text-sm font-medium">
                            {files.profilePicture ? files.profilePicture.name : "Upload"} <Upload size={16} />
                        </button>
                    </div>
                </div>

                {/* Business Information */}
                <div className="space-y-5">
                    <h3 className="text-xl font-bold text-gray-900 border-b border-gray-100 pb-2">Business Information</h3>
                    
                    <div>
                        <label htmlFor="businessName" className="block text-sm text-gray-700 mb-1.5">Business Name</label>
                        <input id="businessName" value={formData.businessName} onChange={handleInputChange} type="text" placeholder="Enter Business Name" className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-[#002147]" />
                    </div>
                    <div>
                        <label htmlFor="vatNumber" className="block text-sm text-gray-700 mb-1.5">VAT Number</label>
                        <input id="vatNumber" value={formData.vatNumber} onChange={handleInputChange} type="text" placeholder="Enter VAT Number (Optional)" className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-[#002147]" />
                    </div>
                    <div>
                        <label htmlFor="businessLicenseInput" className="block text-sm text-gray-700 mb-1.5">Upload Business License</label>
                        <input id="businessLicenseInput" type="file" accept="image/*,.pdf" className="hidden" ref={businessLicenseRef} onChange={(e) => handleFileChange(e, 'businessLicense')} />
                        <button type="button" onClick={() => businessLicenseRef.current?.click()} className="w-full bg-[#374151] hover:bg-[#1f2937] text-white rounded-lg py-3.5 flex items-center justify-center gap-2 transition-colors text-sm font-medium">
                            {files.businessLicense ? files.businessLicense.name : "Upload"} <Upload size={16} />
                        </button>
                    </div>
                </div>

                {/* Identity Verification */}
                <div className="space-y-5">
                    <h3 className="text-xl font-bold text-gray-900 border-b border-gray-100 pb-2">Identity Verification</h3>
                    
                    <div>
                        <label htmlFor="ninNumber" className="block text-sm text-gray-700 mb-1.5">NIN</label>
                        <input id="ninNumber" value={formData.ninNumber} onChange={handleInputChange} required type="text" placeholder="Enter 11-digit NIN" className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-[#002147]" />
                    </div>
                    <div>
                        <label htmlFor="verifiedIdInput" className="block text-sm text-gray-700 mb-1.5">Upload any verified ID</label>
                        <input id="verifiedIdInput" type="file" accept="image/*,.pdf" className="hidden" ref={verifiedIdRef} onChange={(e) => handleFileChange(e, 'verifiedId')} />
                        <button type="button" onClick={() => verifiedIdRef.current?.click()} className="w-full bg-[#374151] hover:bg-[#1f2937] text-white rounded-lg py-3.5 flex items-center justify-center gap-2 transition-colors text-sm font-medium mb-2">
                            {files.verifiedId ? files.verifiedId.name : "Upload"} <Upload size={16} />
                        </button>
                        <p className="text-xs text-gray-500 flex items-center gap-1.5">
                            <span className="w-3.5 h-3.5 rounded-full bg-gray-900 text-white flex items-center justify-center text-[10px] font-bold">!</span>
                            Document Review time: 24hours
                        </p>
                    </div>
                </div>

                {/* Footer / Submit */}
                <div className="pt-4">
                    <p className="text-center text-sm font-bold text-gray-900 mb-6">
                        You can still sell without verifying - But verified sellers get priority in search
                    </p>
                    <button disabled={isLoading} type="submit" className="w-full border border-[#EB3B18] text-[#EB3B18] bg-white rounded-lg py-3.5 font-bold hover:bg-red-50 transition-colors disabled:opacity-50">
                        {isLoading ? "Submitting..." : "Submit For Review"}
                    </button>
                </div>
            </form>

        </div>
    );
}