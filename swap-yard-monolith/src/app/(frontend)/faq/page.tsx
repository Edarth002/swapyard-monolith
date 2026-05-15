"use client";

import React, { useState } from "react";
import { Plus, X, Loader2 } from "lucide-react";
import { Footer } from "@/components/landing/Footer";

const faqData = [
  {
    category: "Getting Started",
    questions: [
      {
        q: "How do I list an item for sale?",
        a: "Log in: Sign in to your account (or create one if needed). Go to 'Sell' Section: Click the 'Start Selling' button on the homepage. Upload Photos: Add 3-5 high-quality photos of the item. Provide Description: Detail the item's condition, price, and other details required. Review & Post: Double-check details and click 'Post Listing'.",
      },
      { q: "How can I buy items on SwapYard?", a: "Browse categories, select an item, and contact the seller directly through our secure messaging system." },
      { q: "What is the Mapview about?", a: "Mapview allows you to see items listed specifically in your immediate neighborhood for easier pickup." },
    ],
  },
  {
    category: "Services",
    questions: [
      { q: "How do I make payment?", a: "Payments can be made via our integrated secure payment gateway using cards or bank transfers." },
      { q: "What payment methods are accepted?", a: "We accept all major Nigerian debit cards, USSD, and bank transfers." },
    ],
  },
  {
    category: "Accounts",
    questions: [
      { q: "How can I change my Password?", a: "Go to Profile Settings > Security and select 'Change Password'." },
      { q: "How do I delete my Account?", a: "Please contact support to initiate a permanent account closure." },
    ],
  },
];

export default function FAQPage() {
  const [openIndex, setOpenIndex] = useState<string | null>("Getting Started-0");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  const handleContactSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setStatus(null);

    try {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      setStatus({ type: "success", msg: "Message sent successfully! We will get back to you soon." });
      (e.target as HTMLFormElement).reset();
    } catch (err) {
      setStatus({ type: "error", msg: "Failed to send message. Please try again later." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F2F4F7]">
      <header className="bg-[#002B45] py-16 text-center">
        <h1 className="text-3xl font-bold text-white uppercase tracking-widest">FAQ</h1>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-16">
        <div className="grid md:grid-cols-[300px_1fr] gap-12">
          <aside className="space-y-24">
            {faqData.map((section) => (
              <h2 key={section.category} className="text-2xl font-bold text-slate-800">
                {section.category}
              </h2>
            ))}
          </aside>

          <div className="space-y-16">
            {faqData.map((section) => (
              <div key={section.category} className="space-y-4">
                {section.questions.map((item, idx) => {
                  const id = `${section.category}-${idx}`;
                  const isOpen = openIndex === id;
                  return (
                    <div key={id} className="border-b border-slate-300 pb-4">
                      <button
                        onClick={() => setOpenIndex(isOpen ? null : id)}
                        className="w-full flex justify-between items-center text-left py-2 group"
                      >
                        <span className={`text-sm font-medium ${isOpen ? "text-slate-900" : "text-slate-600"}`}>
                          {item.q}
                        </span>
                        {isOpen ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                      </button>
                      {isOpen && <p className="mt-4 text-xs leading-relaxed text-slate-500 max-w-2xl">{item.a}</p>}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        <section className="mt-32 max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-2">Contact our team</h2>
          <p className="text-slate-500 text-sm mb-12">Feel free to reach out to us with your inquiries.</p>

          <form onSubmit={handleContactSubmit} className="grid grid-cols-2 gap-4 text-left">
            <div className="space-y-1">
              <label className="text-xs font-semibold">First Name</label>
              <input required name="firstName" className="w-full p-3 rounded-lg bg-white border-none text-sm" placeholder="Enter your first name" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold">Last Name</label>
              <input required name="lastName" className="w-full p-3 rounded-lg bg-white border-none text-sm" placeholder="Enter your last name" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold">Email Address</label>
              <input required type="email" name="email" className="w-full p-3 rounded-lg bg-white border-none text-sm" placeholder="Enter your email address" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold">Phone Number</label>
              <input required type="tel" name="phone" className="w-full p-3 rounded-lg bg-white border-none text-sm" placeholder="Enter your phone number" />
            </div>
            <div className="col-span-2 space-y-1">
              <label className="text-xs font-semibold">Type your Question</label>
              <textarea required name="message" rows={6} className="w-full p-3 rounded-lg bg-white border-none text-sm resize-none" placeholder="Leave us a message..." />
            </div>

            <div className="col-span-2 mt-4 space-y-4">
              {status && (
                <p className={`text-sm font-medium ${status.type === "success" ? "text-green-600" : "text-red-600"}`}>
                  {status.msg}
                </p>
              )}
              <button
                disabled={loading}
                className="w-full bg-[#F0441D] text-white py-4 rounded-lg font-bold flex justify-center items-center gap-2 disabled:opacity-70 transition-opacity"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Submit Now"}
              </button>
            </div>
          </form>
        </section>
      </main>
      <Footer />
    </div>
  );
}