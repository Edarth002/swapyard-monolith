import React from 'react';
import { ShieldCheck, RefreshCw, MapPin } from 'lucide-react';
import { Footer } from '@/components/landing/Footer';

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-white">
      <header className="bg-[#002B45] py-16 text-center">
        <h1 className="text-3xl font-bold text-white tracking-tight">Privacy Policy</h1>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-16 space-y-12">
        <section>
          <h2 className="text-xl font-bold mb-4">Privacy Policy</h2>
          <h3 className="text-lg font-semibold mb-2">Introduction</h3>
          <p className="text-slate-600 text-sm leading-relaxed">
            At SwapYard, we respect your privacy and are committed to protecting the personal information you share with us. This Privacy Policy outlines how we collect, use, and protect your personal information when you use our Platform.
          </p>
        </section>

        <section>
          <h3 className="text-lg font-semibold mb-2">Information we Collect</h3>
          <p className="text-slate-600 text-sm mb-4">We collect both personal and non-personal information when you use our Platform. This may include:</p>
          <ul className="list-disc pl-5 text-sm text-slate-600 space-y-2">
            <li><span className="font-semibold text-slate-800">Personal Information:</span> Your name, email address, phone number, shipping address, and payment details.</li>
            <li><span className="font-semibold text-slate-800">Non-personal information:</span> Usage data such as IP addresses, browser type, and cookies.</li>
          </ul>
        </section>

        <section>
          <h3 className="text-lg font-semibold mb-2">How we use you information</h3>
          <p className="text-slate-600 text-sm mb-4">We use your information to:</p>
          <ul className="list-disc pl-5 text-sm text-slate-600 space-y-2">
            <li>Process transactions and fulfill your orders.</li>
            <li>Improve our services and Platform functionality.</li>
            <li>Communicate with you about your account, orders, or promotional offers.</li>
            <li>Provide customer support and resolve issues.</li>
          </ul>
        </section>

        <section>
          <h3 className="text-lg font-semibold mb-2">Cookies and Tracking</h3>
          <p className="text-slate-600 text-sm leading-relaxed">
            We use cookies to enhance your experience on the Platform. Cookies are small text files that are stored on your device. They help us track your preferences and improve our website's functionality. You can disable cookies through your browser settings, but this may affect your ability to use some features of the Platform.
          </p>
        </section>

        <section className="grid md:grid-cols-3 gap-8 py-12 border-t border-b border-slate-100">
          <Feature icon={ShieldCheck} title="Secure Transactions" desc="Your transactions are secure and with the latest encryption." />
          <Feature icon={RefreshCw} title="Easy Returns & Refunds" desc="Hassle-free returns, refunds and exchanges on eligible items." />
          <Feature icon={MapPin} title="Localized Experience" desc="Browse and sell items locally with location-based listings." />
        </section>
      </main>
      <Footer />
    </div>
  );
}

function Feature({ icon: Icon, title, desc }: { icon: React.ComponentType<{size?: number}>, title: string, desc: string }) {
  return (
    <div className="flex items-start gap-4">
      <div className="bg-[#002B45] p-2.5 rounded-full text-white">
        <Icon size={20} />
      </div>
      <div>
        <h4 className="font-bold text-sm text-slate-900">{title}</h4>
        <p className="text-[11px] text-slate-500 mt-1">{desc}</p>
      </div>
    </div>
  );
}