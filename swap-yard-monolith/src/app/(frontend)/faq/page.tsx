"use client";

import React, { useState } from "react";
import { Plus, X, Loader2 } from "lucide-react";
import { Footer } from "@/components/landing/Footer";

const faqData = [
  {
    category: "Getting Started",
    questions: [
      {
        q: "How do I list an item for Sale?",
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
      { q: "How do I deleted my Account?", a: "Please contact support to initiate a permanent account closure." },
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
      <header className="bg-[#002B45] py-12 md:py-16 text-center">
        <h1 className="text-2xl md:text-3xl font-bold text-white uppercase tracking-widest px-4">FAQ</h1>
      </header>

      <main className="max-w-6xl mx-auto px-5 py-10 md:py-16">
        {/* Responsive Grid: Stacks on mobile (flex-col), side-by-side on md+ */}
        <div className="flex flex-col md:grid md:grid-cols-[250px_1fr] lg:grid-cols-[300px_1fr] gap-10 md:gap-12">
          
          {/* Categories Sidebar - Hidden or adjusted on mobile */}
          <aside className="hidden md:flex flex-col gap-24">
            {faqData.map((section) => (
              <h2 key={section.category} className="text-xl lg:text-2xl font-bold text-slate-800">
                {section.category}
              </h2>
            ))}
          </aside>

          {/* Accordion List */}
          <div className="space-y-12 md:space-y-16">
            {faqData.map((section) => (
              <div key={section.category} className="space-y-4">
                {/* Category Title only visible on Mobile */}
                <h2 className="text-xl font-bold text-slate-800 md:hidden mb-6">
                  {section.category}
                </h2>
                
                {section.questions.map((item, idx) => {
                  const id = `${section.category}-${idx}`;
                  const isOpen = openIndex === id;
                  return (
                    <div key={id} className="border-b border-slate-300 pb-4">
                      <button
                        onClick={() => setOpenIndex(isOpen ? null : id)}
                        className="w-full flex justify-between items-start gap-4 text-left py-2 group"
                      >
                        <span className={`text-sm font-medium leading-snug ${isOpen ? "text-slate-900" : "text-slate-600"}`}>
                          {item.q}
                        </span>
                        <div className="mt-1 flex-shrink-0">
                          {isOpen ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                        </div>
                      </button>
                      {isOpen && (
                        <p className="mt-3 text-xs leading-relaxed text-slate-500 max-w-2xl animate-in fade-in slide-in-from-top-1 duration-200">
                          {item.a}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        {/* Contact Form Section */}
        <section className="mt-24 md:mt-32 max-w-3xl mx-auto text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-2">Contact our team</h2>
          <p className="text-slate-500 text-xs md:text-sm mb-10 md:mb-12 px-4">Feel free to reach out to us with your inquiries.</p>

          <form onSubmit={handleContactSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 text-left px-2">
            <div className="space-y-1.5">
              <label className="text-[11px] uppercase tracking-wider font-bold text-slate-700 ml-1">First Name</label>
              <input required name="firstName" className="w-full p-3.5 rounded-lg bg-white border-none text-sm shadow-sm focus:ring-2 focus:ring-orange-500 transition-all" placeholder="Enter your first name" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] uppercase tracking-wider font-bold text-slate-700 ml-1">Last Name</label>
              <input required name="lastName" className="w-full p-3.5 rounded-lg bg-white border-none text-sm shadow-sm focus:ring-2 focus:ring-orange-500 transition-all" placeholder="Enter your last name" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] uppercase tracking-wider font-bold text-slate-700 ml-1">Email Address</label>
              <input required type="email" name="email" className="w-full p-3.5 rounded-lg bg-white border-none text-sm shadow-sm focus:ring-2 focus:ring-orange-500 transition-all" placeholder="Enter your email address" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] uppercase tracking-wider font-bold text-slate-700 ml-1">Phone Number</label>
              <input required type="tel" name="phone" className="w-full p-3.5 rounded-lg bg-white border-none text-sm shadow-sm focus:ring-2 focus:ring-orange-500 transition-all" placeholder="Enter your phone number" />
            </div>
            <div className="col-span-1 md:col-span-2 space-y-1.5">
              <label className="text-[11px] uppercase tracking-wider font-bold text-slate-700 ml-1">Type your Question</label>
              <textarea required name="message" rows={5} className="w-full p-3.5 rounded-lg bg-white border-none text-sm shadow-sm resize-none focus:ring-2 focus:ring-orange-500 transition-all" placeholder="Leave us a message..." />
            </div>

            <div className="col-span-1 md:col-span-2 mt-4 space-y-4">
              {status && (
                <p className={`text-sm font-semibold text-center ${status.type === "success" ? "text-green-600" : "text-red-600"}`}>
                  {status.msg}
                </p>
              )}
              <button
                disabled={loading}
                className="w-full bg-[#F0441D] text-white py-4 rounded-lg font-bold flex justify-center items-center gap-2 hover:bg-[#d63a18] disabled:opacity-70 disabled:cursor-not-allowed transition-all shadow-lg active:scale-[0.98]"
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