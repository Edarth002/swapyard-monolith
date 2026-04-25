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
  User
} from "lucide-react";
import { useBuyerAccount } from "@/hooks/buyer/useBuyerAccount";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function BuyerAccount() {
const { state, setters, refs, handlers } = useBuyerAccount();
const router = useRouter();

if (state.isLoading) {
return (
<div className="min-h-[70vh] flex items-center justify-center">
<div className="h-12 w-12 animate-spin rounded-full border-b-2 border-[#002147]" />
</div>
);
}

const initials =
`${state.formData.firstName?.[0] || ""}${state.formData.lastName?.[0] || ""}` || "U";

const fullName =
`${state.formData.firstName} ${state.formData.lastName}`.trim();

return (
<div className="w-full min-h-screen bg-slate-50">
<div className="mx-auto max-w-7xl px-4 md:px-8 py-8">

{/* Header */}
<div className="mb-8 rounded-3xl bg-gradient-to-r from-[#002147] to-[#0b3766] p-8 text-white shadow-xl">
<div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">

<div className="flex flex-col md:flex-row items-center md:items-start gap-6">
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
<CheckCircle2 className="text-green-500" size={20}/>
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
{state.formData.bio || "Manage your profile details, addresses and account security."}
</p>
</div>
</div>

<button
onClick={() => setters.setEditingSection("personal")}
className="rounded-xl bg-white px-5 py-3 font-medium text-[#002147] shadow hover:scale-[1.02] transition"
>
Edit Profile
</button>

</div>
</div>


{/* Main Grid */}
<div className="grid gap-6 xl:grid-cols-3">

{/* Left Column */}
<div className="space-y-6 xl:col-span-2">

{/* Personal Card */}
<div className="rounded-3xl bg-white p-8 shadow-sm border border-slate-100">
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
className="rounded-lg border px-4 py-2 text-sm"
>
<X className="inline mr-1 h-4 w-4"/>
Cancel
</button>

<button
disabled={state.isSaving}
onClick={() => handlers.handleSave("personal")}
className="rounded-lg bg-[#002147] px-4 py-2 text-sm text-white"
>
<Save className="inline mr-1 h-4 w-4"/>
Save
</button>
</div>
) : (
<button
onClick={() => setters.setEditingSection("personal")}
className="rounded-lg border px-4 py-2 text-sm"
>
<Pencil className="inline mr-1 h-4 w-4"/>
Edit
</button>
)}
</div>

<div className="grid md:grid-cols-2 gap-6">

{[
["First Name","firstName"],
["Last Name","lastName"],
["Phone","phone"],
["Email","email"],
].map(([label,name]) => (
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
{state.formData.bio || "No bio added yet"}
</div>
)}
</div>
</div>



{/* Address */}
<div className="rounded-3xl bg-white p-8 shadow-sm border border-slate-100">
<div className="mb-8 flex items-center justify-between">
<div className="flex items-center gap-3">
<div className="rounded-xl bg-slate-100 p-3">
<MapPin className="h-5 w-5 text-[#002147]" />
</div>
<h2 className="text-xl font-semibold">
Delivery Address
</h2>
</div>

<button
onClick={() => setters.setEditingSection("address")}
className="rounded-lg border px-4 py-2 text-sm"
>
<Pencil className="inline mr-1 h-4 w-4"/>
Edit
</button>
</div>

<div className="grid md:grid-cols-2 gap-6">

<div>
<label className="text-sm text-slate-500">
Address
</label>

<div className="mt-2 rounded-xl bg-slate-50 p-4">
{state.formData.deliveryAddress || "—"}
</div>
</div>

<div>
<label className="text-sm text-slate-500">
State / Country
</label>

<div className="mt-2 rounded-xl bg-slate-50 p-4">
{state.formData.stateCountry || "—"}
</div>
</div>

</div>
</div>

</div>



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
onClick={() => router.push("/forgot-password")}
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
Update your password and manage account security from the password reset page.
</p>
</div>

<button className="w-full cursor-pointer rounded-xl bg-[#002147] py-3 font-medium text-white transition hover:bg-[#001733]"
>
    <Link href="/forgot-password">
        Change Password
    </Link>
</button>

</div>
</div>



</div>

</div>

</div>
);
}