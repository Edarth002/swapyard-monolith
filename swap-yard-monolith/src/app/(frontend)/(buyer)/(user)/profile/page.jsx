"use client";

import Image from "next/image";
import { CheckCircle2, Pencil, Save, X, Camera } from "lucide-react";
import { useBuyerAccount } from "@/hooks/buyer/useBuyerAccount";

export default function BuyerAccount() {
  const { state, setters, refs, handlers } = useBuyerAccount();

  if (state.isLoading) {
    return (
      <div className="flex h-64 items-center justify-center rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
        <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-[#002147]" />
      </div>
    );
  }

  const getInitials = () => {
    const first = state.formData.firstName?.charAt(0) || "";
    const last = state.formData.lastName?.charAt(0) || "";
    return (first + last).toUpperCase() || "U";
  };

  const fullName =
    `${state.formData.firstName} ${state.formData.lastName}`.trim() ||
    "Unauthorized";

  return (
    <div className="relative max-w-4xl rounded-xl border border-gray-100 bg-white p-6 shadow-sm md:p-10">
      {state.error && (
        <div className="mb-6 rounded-lg bg-red-50 p-4 text-sm font-medium text-red-600">
          {state.error}
        </div>
      )}

      {state.success && (
        <div className="mb-6 rounded-lg bg-green-50 p-4 text-sm font-medium text-green-700">
          {state.success}
        </div>
      )}

      {/* Profile Header */}
      <div className="mb-12 flex flex-col items-center gap-6 sm:flex-row sm:items-start">
        <div
          onClick={() => refs.fileInputRef.current?.click()}
          className="group relative cursor-pointer shrink-0"
        >
          <div className="relative flex h-24 w-24 items-center justify-center overflow-hidden rounded-full border-4 border-gray-50 bg-[#002147] text-white shadow-sm">
            {state.profileImageUrl ? (
              <Image
                src={state.profileImageUrl}
                alt={`${fullName} avatar`}
                fill
                className="object-cover"
              />
            ) : (
              <span className="text-3xl font-bold tracking-wider">
                {getInitials()}
              </span>
            )}

            <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
              <Camera size={24} className="text-white" />
            </div>
          </div>

          <input
            ref={refs.fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handlers.handleImageChange}
            className="hidden"
          />

          <div className="absolute bottom-0 right-0 rounded-full bg-white">
            <CheckCircle2
              size={24}
              className="fill-white text-[#2ECC71]"
            />
          </div>
        </div>

        <div className="pt-2 text-center sm:text-left">
          <h2 className="mb-1 text-xl font-bold text-gray-900">
            {fullName}
          </h2>

          <p className="mb-2 text-sm font-medium text-gray-600">
            Buyer
          </p>

          <p className="hidden max-w-md truncate text-xs text-gray-500 sm:block">
            {state.formData.bio || "No profile description added."}
          </p>
        </div>
      </div>

      <div className="space-y-10">

        {/* Personal Information */}
        <section>
          <div className="mb-5 flex items-center justify-between border-b border-gray-100 pb-3">
            <h3 className="text-lg font-bold text-gray-900">
              Personal Information
            </h3>

            {state.editingSection === "personal" ? (
              <div className="flex gap-2">
                <button
                  onClick={handlers.handleCancelEdit}
                  className="flex items-center gap-1.5 rounded-md border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50"
                >
                  <X size={14} />
                  Cancel
                </button>

                <button
                  disabled={state.isSaving}
                  onClick={() => handlers.handleSave("personal")}
                  className="flex items-center gap-1.5 rounded-md bg-[#002147] px-3 py-1.5 text-xs font-medium text-white hover:bg-[#001733] disabled:opacity-70"
                >
                  <Save size={14} />
                  {state.isSaving ? "Saving..." : "Save"}
                </button>
              </div>
            ) : (
              <button
                onClick={() => setters.setEditingSection("personal")}
                className="flex items-center gap-1.5 rounded-md border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50"
              >
                Edit
                <Pencil size={12} />
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 gap-x-8 gap-y-6 sm:grid-cols-2">

            {[
              { label: "First Name", name: "firstName" },
              { label: "Last Name", name: "lastName" },
              { label: "Phone Number", name: "phone" },
              { label: "Email Address", name: "email", type: "email" },
            ].map((field) => (
              <div key={field.name}>
                <label className="mb-1 block text-xs text-gray-500">
                  {field.label}
                </label>

                {state.editingSection === "personal" ? (
                  <input
                    name={field.name}
                    type={field.type || "text"}
                    value={state.formData[field.name]}
                    onChange={handlers.handleInputChange}
                    className="w-full rounded border border-gray-300 px-3 py-1.5 text-sm focus:ring-1 focus:ring-[#002147] focus:outline-none"
                  />
                ) : (
                  <p className="text-sm font-medium text-gray-900">
                    {state.formData[field.name] || "—"}
                  </p>
                )}
              </div>
            ))}
          </div>

          <div className="mt-6 border-t border-gray-50 pt-6">
            <label className="mb-2 block text-xs text-gray-500">
              Bio
            </label>

            {state.editingSection === "personal" ? (
              <textarea
                name="bio"
                value={state.formData.bio}
                onChange={handlers.handleInputChange}
                placeholder="Tell us a little about yourself..."
                className="min-h-24 w-full rounded-lg border border-gray-300 px-4 py-3 text-sm focus:ring-1 focus:ring-[#002147] focus:outline-none"
              />
            ) : (
              <p className="max-w-3xl text-sm font-medium leading-relaxed text-gray-900">
                {state.formData.bio || "No bio added yet."}
              </p>
            )}
          </div>
        </section>


        {/* Address */}
        <section>
          <div className="mb-5 flex items-center justify-between border-b border-gray-100 pb-3">
            <h3 className="text-lg font-bold text-gray-900">
              Delivery Address
            </h3>

            {state.editingSection === "address" ? (
              <div className="flex gap-2">
                <button
                  onClick={handlers.handleCancelEdit}
                  className="flex items-center gap-1.5 rounded-md border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50"
                >
                  <X size={14} />
                  Cancel
                </button>

                <button
                  disabled={state.isSaving}
                  onClick={() => handlers.handleSave("address")}
                  className="flex items-center gap-1.5 rounded-md bg-[#002147] px-3 py-1.5 text-xs font-medium text-white hover:bg-[#001733] disabled:opacity-70"
                >
                  <Save size={14} />
                  {state.isSaving ? "Saving..." : "Save"}
                </button>
              </div>
            ) : (
              <button
                onClick={() => setters.setEditingSection("address")}
                className="flex items-center gap-1.5 rounded-md border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50"
              >
                Edit
                <Pencil size={12} />
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 gap-x-8 gap-y-6 sm:grid-cols-2">

            <div>
              <label className="mb-1 block text-xs text-gray-500">
                Delivery Address
              </label>

              {state.editingSection === "address" ? (
                <input
                  name="deliveryAddress"
                  value={state.formData.deliveryAddress}
                  onChange={handlers.handleInputChange}
                  className="w-full rounded border border-gray-300 px-3 py-1.5 text-sm focus:ring-1 focus:ring-[#002147] focus:outline-none"
                />
              ) : (
                <p className="text-sm font-medium text-gray-900">
                  {state.formData.deliveryAddress || "—"}
                </p>
              )}
            </div>

            <div>
              <label className="mb-1 block text-xs text-gray-500">
                State / Country
              </label>

              {state.editingSection === "address" ? (
                <input
                  name="stateCountry"
                  value={state.formData.stateCountry}
                  onChange={handlers.handleInputChange}
                  className="w-full rounded border border-gray-300 px-3 py-1.5 text-sm focus:ring-1 focus:ring-[#002147] focus:outline-none"
                />
              ) : (
                <p className="text-sm font-medium text-gray-900">
                  {state.formData.stateCountry || "—"}
                </p>
              )}
            </div>

          </div>
        </section>


        {/* Security */}
        <section>
          <div className="mb-5 flex items-center justify-between border-b border-gray-100 pb-3">
            <h3 className="text-lg font-bold text-gray-900">
              Security
            </h3>

            <button className="flex items-center gap-1.5 rounded-md border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50">
              Edit
              <Pencil size={12} />
            </button>
          </div>

          <div>
            <p className="mb-1 text-xs text-gray-500">
              Change your password
            </p>
            <p className="text-sm font-medium text-gray-900">
              ********
            </p>
          </div>
        </section>

      </div>
    </div>
  );
}