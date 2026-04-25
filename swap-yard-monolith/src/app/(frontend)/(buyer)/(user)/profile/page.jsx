"use client";

import Image from "next/image";
import {
  Camera,
  Pencil,
  Save,
  X,
  CheckCircle2,
  Shield,
  MapPin,
  User,
} from "lucide-react";
import { useBuyerAccount } from "@/hooks/buyer/useBuyerAccount";
import { useRouter } from "next/navigation";

export default function BuyerAccount() {
  const { state, setters, refs, handlers } = useBuyerAccount();
  const router = useRouter();

  if (state.isLoading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-[#002147]" />
      </div>
    );
  }

  const initials =
    `${state.formData.firstName?.[0] || ""}${state.formData.lastName?.[0] || ""}` ||
    "U";

  const fullName =
    `${state.formData.firstName} ${state.formData.lastName}`.trim();

  return (
    <div className="min-h-screen w-full bg-slate-50">
      <div className="mx-auto max-w-7xl px-4 py-8 md:px-8">

        {state.error && (
          <div className="mb-6 rounded-xl bg-red-50 p-4 text-sm font-medium text-red-600">
            {state.error}
          </div>
        )}

        {state.success && (
          <div className="mb-6 rounded-xl bg-green-50 p-4 text-sm font-medium text-green-700">
            {state.success}
          </div>
        )}

        <div className="mb-8 rounded-3xl bg-gradient-to-r from-[#002147] to-[#0b3766] p-8 text-white shadow-xl">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-col items-center gap-6 md:flex-row md:items-start">
              <div
                onClick={() => refs.fileInputRef.current?.click()}
                className="group relative cursor-pointer"
              >
                <div className="relative h-28 w-28 overflow-hidden rounded-full border-4 border-white/20 bg-white/10">
                  {state.profileImageUrl ? (
                    <Image
                      src={state.profileImageUrl}
                      alt={fullName}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-4xl font-bold">
                      {initials}
                    </div>
                  )}

                  <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition group-hover:opacity-100">
                    <Camera className="text-white" />
                  </div>
                </div>

                <input
                  ref={refs.fileInputRef}
                  type="file"
                  className="hidden"
                  onChange={handlers.handleImageChange}
                />

                <div className="absolute bottom-1 right-1 rounded-full bg-white p-1">
                  <CheckCircle2
                    size={20}
                    className="text-green-500"
                  />
                </div>
              </div>

              <div className="text-center md:text-left">
                <h1 className="text-3xl font-bold">
                  {fullName}
                </h1>

                <p className="mt-2 text-white/80">
                  Buyer Account Dashboard
                </p>

                <p className="mt-3 max-w-xl text-sm text-white/70">
                  {state.formData.bio ||
                    "Manage your profile details, addresses and account security."}
                </p>
              </div>
            </div>

            <button
              onClick={() =>
                setters.setEditingSection("personal")
              }
              className="cursor-pointer rounded-xl bg-white px-5 py-3 font-medium text-[#002147] shadow transition hover:scale-[1.02]"
            >
              Edit Profile
            </button>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-3">
          <div className="space-y-6 xl:col-span-2">

            <div className="rounded-3xl border border-slate-100 bg-white p-8 shadow-sm">
              <div className="mb-8 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="rounded-xl bg-slate-100 p-3">
                    <User className="h-5 w-5 text-[#002147]" />
                  </div>

                  <h2 className="text-xl font-semibold">
                    Personal Information
                  </h2>
                </div>

                {state.editingSection === "personal" ? (
                  <div className="flex gap-3">
                    <button
                      onClick={handlers.handleCancelEdit}
                      className="cursor-pointer rounded-lg border px-4 py-2 text-sm hover:bg-slate-50"
                    >
                      <X className="mr-1 inline h-4 w-4" />
                      Cancel
                    </button>

                    <button
                      disabled={state.isSaving}
                      onClick={() =>
                        handlers.handleSave("personal")
                      }
                      className="cursor-pointer rounded-lg bg-[#002147] px-4 py-2 text-sm text-white hover:bg-[#001733]"
                    >
                      <Save className="mr-1 inline h-4 w-4" />
                      {state.isSaving ? "Saving..." : "Save"}
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() =>
                      setters.setEditingSection("personal")
                    }
                    className="cursor-pointer rounded-lg border px-4 py-2 text-sm hover:bg-slate-50"
                  >
                    <Pencil className="mr-1 inline h-4 w-4" />
                    Edit
                  </button>
                )}
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                {[
                  ["First Name", "firstName"],
                  ["Last Name", "lastName"],
                  ["Phone", "phone"],
                  ["Email", "email"],
                ].map(([label, name]) => (
                  <div key={name}>
                    <label className="mb-2 block text-sm text-slate-500">
                      {label}
                    </label>

                    {state.editingSection === "personal" ? (
                      <input
                        name={name}
                        value={state.formData[name]}
                        onChange={handlers.handleInputChange}
                        className="w-full rounded-xl border px-4 py-3"
                      />
                    ) : (
                      <div className="rounded-xl bg-slate-50 px-4 py-3 font-medium">
                        {state.formData[name] || "—"}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="mt-6">
                <label className="mb-2 block text-sm text-slate-500">
                  Bio
                </label>

                {state.editingSection === "personal" ? (
                  <textarea
                    name="bio"
                    value={state.formData.bio}
                    onChange={handlers.handleInputChange}
                    className="min-h-32 w-full rounded-xl border p-4"
                  />
                ) : (
                  <div className="rounded-xl bg-slate-50 p-4">
                    {state.formData.bio ||
                      "No bio added yet"}
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-3xl border border-slate-100 bg-white p-8 shadow-sm">
              <div className="mb-8 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="rounded-xl bg-slate-100 p-3">
                    <MapPin className="h-5 w-5 text-[#002147]" />
                  </div>

                  <h2 className="text-xl font-semibold">
                    Delivery Address
                  </h2>
                </div>

                {state.editingSection === "address" ? (
                  <div className="flex gap-3">
                    <button
                      onClick={handlers.handleCancelEdit}
                      className="cursor-pointer rounded-lg border px-4 py-2 text-sm hover:bg-slate-50"
                    >
                      <X className="mr-1 inline h-4 w-4" />
                      Cancel
                    </button>

                    <button
                      disabled={state.isSaving}
                      onClick={() =>
                        handlers.handleSave("address")
                      }
                      className="cursor-pointer rounded-lg bg-[#002147] px-4 py-2 text-sm text-white hover:bg-[#001733]"
                    >
                      <Save className="mr-1 inline h-4 w-4" />
                      {state.isSaving ? "Saving..." : "Save"}
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() =>
                      setters.setEditingSection("address")
                    }
                    className="cursor-pointer rounded-lg border px-4 py-2 text-sm hover:bg-slate-50"
                  >
                    <Pencil className="mr-1 inline h-4 w-4" />
                    Edit
                  </button>
                )}
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <div>
                  <label className="text-sm text-slate-500">
                    Address
                  </label>

                  {state.editingSection === "address" ? (
                    <input
                      name="deliveryAddress"
                      value={state.formData.deliveryAddress}
                      onChange={handlers.handleInputChange}
                      className="mt-2 w-full rounded-xl border px-4 py-3"
                    />
                  ) : (
                    <div className="mt-2 rounded-xl bg-slate-50 p-4">
                      {state.formData.deliveryAddress || "—"}
                    </div>
                  )}
                </div>

                <div>
                  <label className="text-sm text-slate-500">
                    State / Country
                  </label>

                  {state.editingSection === "address" ? (
                    <input
                      name="stateCountry"
                      value={state.formData.stateCountry}
                      onChange={handlers.handleInputChange}
                      className="mt-2 w-full rounded-xl border px-4 py-3"
                    />
                  ) : (
                    <div className="mt-2 rounded-xl bg-slate-50 p-4">
                      {state.formData.stateCountry || "—"}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div>
            <div className="rounded-3xl border border-slate-100 bg-white p-8 shadow-sm">
              <div className="mb-6 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="rounded-xl bg-slate-100 p-3">
                    <Shield className="h-5 w-5 text-[#002147]" />
                  </div>

                  <h3 className="text-xl font-semibold">
                    Security
                  </h3>
                </div>

                <button
                  onClick={() =>
                    router.push("/onboarding/reset-password")
                  }
                  className="cursor-pointer rounded-lg border px-4 py-2 text-sm hover:bg-slate-50"
                >
                  <Pencil className="mr-1 inline h-4 w-4" />
                  Edit
                </button>
              </div>

              <div className="space-y-5">
                <div className="rounded-2xl bg-slate-50 p-5">
                  <p className="text-sm text-slate-500">
                    Password
                  </p>

                  <p className="mt-2 font-medium">
                    ••••••••
                  </p>
                </div>

                <div className="rounded-2xl bg-slate-50 p-5">
                  <p className="text-sm text-slate-500">
                    Security Settings
                  </p>

                  <p className="mt-2 text-sm leading-relaxed text-slate-700">
                    Update your password and manage
                    account security from the password
                    reset page.
                  </p>
                </div>

                <button
                  onClick={() =>
                    router.push("/onboarding/reset-password")
                  }
                  className="w-full cursor-pointer rounded-xl bg-[#002147] py-3 font-medium text-white transition hover:bg-[#001733]"
                >
                  Change Password
                </button>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}