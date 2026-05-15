import React from 'react';
import Head from 'next/head';
import { 
  Search, 
  MessageSquare, 
  ShoppingBag, 
  Bell, 
  ShieldCheck, 
  RefreshCw, 
  MapPin, 
  Send 
} from 'lucide-react';
import { Footer } from '@/components/landing/Footer';

const TermsOfUse = () => {
  return (
    <div className="min-h-screen bg-white font-sans text-slate-800">
      <Head>
        <title>Terms of Use | SwapYard</title>
      </Head>

    
      <header className="bg-[#002B45] py-20 text-center">
        <h1 className="text-4xl font-bold text-white">Terms of Use</h1>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-16">
        <section className="space-y-10">
          <div>
            <h2 className="text-2xl font-bold mb-4">Terms of Use</h2>
            <h3 className="text-lg font-semibold mb-2">Introduction</h3>
            <p className="text-slate-600 leading-relaxed text-sm">
              Welcome to SwapYard! These Terms of Use govern your access to and use of SwapYard and the services we provide. By accessing or using our Platform, you agree to be bound by these Terms. Please read them carefully before using the Platform. If you do not agree to these Terms, you should not use the Platform.
            </p>
            <ul className="mt-4 space-y-2 text-sm text-slate-600 list-disc pl-5">
              <li>You agree to use the Platform only for lawful purposes. You are responsible for your actions while using our services.</li>
              <li>You agree not to use the Platform to:
                <ul className="list-circle pl-6 mt-2 space-y-1">
                  <li>Violate any laws or regulations.</li>
                  <li>Post or distribute harmful content, including viruses or malware.</li>
                  <li>Impersonate any person or entity or mislead others about your identity or affiliations.</li>
                  <li>Infringe on intellectual property rights or use the Platform for unauthorized commercial purposes.</li>
                </ul>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-2">Account Registration</h3>
            <p className="text-slate-600 leading-relaxed text-sm">
              To access certain features of the Platform, you may be required to create an account. You agree to provide accurate, complete, and current information when registering. You are responsible for maintaining the confidentiality of your account information, including your username and password. You agree to immediately notify us of any unauthorized use of your account.
            </p>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-2">User Content and Listings</h3>
            <p className="text-slate-600 leading-relaxed text-sm">
              You retain ownership of any content or listings you upload to the Platform. However, by uploading content, you grant SwapYard a non-exclusive, royalty-free license to use, display, and distribute the content on our platform and in our promotional materials. You agree that any listings you post will accurately reflect the product or service you are offering, including all relevant details and pricing.
            </p>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-2">Transactions</h3>
            <p className="text-slate-600 leading-relaxed text-sm">
              All transactions between buyers and sellers are subject to the Platform's payment processing services, which will handle payments and transfer funds according to the terms agreed upon by the parties. You agree to pay for any items or services purchased through the Platform in accordance with the posted price and transaction terms. You understand and agree that SwapYard is not responsible for disputes between buyers and sellers regarding transactions, including but not limited to product delivery, condition, and refunds.
            </p>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-2">Limitation of Liability</h3>
            <p className="text-slate-600 leading-relaxed text-sm">
              SwapYard is not liable for any indirect, incidental, or consequential damages that arise from using the Platform. We do not guarantee that the Platform will be uninterrupted or error-free, and we are not responsible for any issues that arise from technical failures, errors, or issues outside of our control.
            </p>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-2">Termination of Account</h3>
            <p className="text-slate-600 leading-relaxed text-sm">
              We reserve the right to suspend or terminate your account if you violate these Terms. Upon termination, you will lose access to your account and all related services.
            </p>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-2">Governing Law</h3>
            <p className="text-slate-600 leading-relaxed text-sm">
              These Terms are governed by and construed in accordance with the laws of Nigeria. Any disputes that arise under these Terms will be resolved in the courts of Nigeria, and you consent to the exclusive jurisdiction of those courts.
            </p>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-2">Changes to the Terms</h3>
            <p className="text-slate-600 leading-relaxed text-sm">
              We reserve the right to update these Terms at any time. When changes are made, we will post the updated version on this page, along with the date of the most recent revision. You are encouraged to review these Terms periodically for any changes.
            </p>
          </div>
        </section>

        <section className="grid md:grid-cols-3 gap-8 mt-24">
          <div className="flex items-start gap-4">
            <div className="bg-[#002B45] p-3 rounded-full">
              <ShieldCheck className="text-white w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-sm">Secure Transactions</h4>
              <p className="text-xs text-slate-500 mt-1">Your transactions are secure and with the latest encryption.</p>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <div className="bg-[#002B45] p-3 rounded-full">
              <RefreshCw className="text-white w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-sm">Easy Returns & Refunds</h4>
              <p className="text-xs text-slate-500 mt-1">Hassle-free returns, refunds and exchanges on eligible items.</p>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <div className="bg-[#002B45] p-3 rounded-full">
              <MapPin className="text-white w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-sm">Localized Experience</h4>
              <p className="text-xs text-slate-500 mt-1">Browse and sell items locally with location-based listings.</p>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default TermsOfUse;