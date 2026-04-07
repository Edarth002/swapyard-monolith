"use client";

import { useEffect } from "react";
import { redirect } from "next/navigation";

export default function CatchAll404() {
  useEffect(() => {
    redirect("/");
  }, []);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gray-50 text-center">
      <h1 className="text-4xl font-bold text-gray-800">Redirecting…</h1>
      <p className="mt-2 text-gray-600">
        You’ll be taken back to the homepage shortly.
      </p>
      <div className="mt-6 h-12 w-12 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
    </main>
  );
}