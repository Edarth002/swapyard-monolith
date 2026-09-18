"use client";

import { useEffect, useState, useRef, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { CheckCircle2, XCircle, Loader2, Clock } from "lucide-react";
import Link from "next/link";

type VerifyState = "checking" | "success" | "delayed" | "failed" | "error";

const MAX_ATTEMPTS = 5;
const POLL_INTERVAL_MS = 2000;

function PaymentSuccessContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const [state, setState] = useState<VerifyState>("checking");
    const [message, setMessage] = useState<string | null>(null);
    const [orderId, setOrderId] = useState<string | null>(null);
    const attemptsRef = useRef(0);

    // Paystack appends both `reference` and `trxref` — they're the same value.
    const reference = searchParams.get("reference") ?? searchParams.get("trxref");

    useEffect(() => {
        if (!reference) {
            setState("error");
            setMessage("No payment reference found in the URL.");
            return;
        }

        let cancelled = false;
        let timer: ReturnType<typeof setTimeout>;

        const checkStatus = async () => {
            try {
                const res = await fetch(`/api/payments/verify?reference=${encodeURIComponent(reference)}`);
                const data = await res.json();

                if (cancelled) return;

                if (!res.ok || !data.ok) {
                    if (attemptsRef.current < MAX_ATTEMPTS) {
                        attemptsRef.current += 1;
                        timer = setTimeout(checkStatus, POLL_INTERVAL_MS);
                    } else {
                        setState("delayed");
                    }
                    return;
                }

                if (data.status === "success") {
                    setState("success");
                    setOrderId(data.orderId ?? null);
                    setTimeout(() => {
                        router.push(data.orderId ? `/orders/${data.orderId}` : "/orders");
                    }, 1500);
                    return;
                }

                if (data.status === "failed" || data.status === "abandoned") {
                    setState("failed");
                    setMessage(`Payment status: ${data.status}`);
                    return;
                }

                if (attemptsRef.current < MAX_ATTEMPTS) {
                    attemptsRef.current += 1;
                    timer = setTimeout(checkStatus, POLL_INTERVAL_MS);
                } else {
                    setState("delayed");
                }
            } catch {
                if (cancelled) return;
                if (attemptsRef.current < MAX_ATTEMPTS) {
                    attemptsRef.current += 1;
                    timer = setTimeout(checkStatus, POLL_INTERVAL_MS);
                } else {
                    setState("delayed");
                }
            }
        };

        checkStatus();

        return () => {
            cancelled = true;
            clearTimeout(timer);
        };
    }, [reference, router]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 max-w-md w-full text-center">
                {state === "checking" && (
                    <>
                        <Loader2 className="w-10 h-10 text-[#EB3B18] animate-spin mx-auto mb-4" />
                        <h1 className="text-lg font-bold text-gray-900 mb-1">Confirming your payment…</h1>
                        <p className="text-sm text-gray-500">
                            Please hang tight while we confirm this with Paystack. Don't close this tab.
                        </p>
                    </>
                )}

                {state === "success" && (
                    <>
                        <CheckCircle2 className="w-12 h-12 text-teal-500 mx-auto mb-4" />
                        <h1 className="text-lg font-bold text-gray-900 mb-1">Payment successful</h1>
                        <p className="text-sm text-gray-500 mb-6">
                            Your order has been marked as paid. Redirecting…
                        </p>
                        <button
                            onClick={() => router.push(orderId ? `/orders/${orderId}` : "/orders")}
                            className="w-full py-2.5 rounded-xl bg-[#EB3B18] hover:bg-[#d93616] text-white text-sm font-semibold transition-colors cursor-pointer"
                        >
                            View my orders
                        </button>
                    </>
                )}

                {state === "delayed" && (
                    <>
                        <Clock className="w-12 h-12 text-amber-500 mx-auto mb-4" />
                        <h1 className="text-lg font-bold text-gray-900 mb-1">Still processing your payment</h1>
                        <p className="text-sm text-gray-500 mb-6">
                            Your bank or Paystack is taking a bit longer than usual. If your money was deducted,
                            your order will update to <strong>Paid</strong> automatically once confirmed —
                            no need to pay again.
                        </p>
                        <button
                            onClick={() => router.push("/orders")}
                            className="w-full py-2.5 rounded-xl bg-[#EB3B18] hover:bg-[#d93616] text-white text-sm font-semibold transition-colors cursor-pointer"
                        >
                            Go to my orders
                        </button>
                    </>
                )}

                {(state === "failed" || state === "error") && (
                    <>
                        <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                        <h1 className="text-lg font-bold text-gray-900 mb-1">
                            {state === "failed" ? "Payment not completed" : "Couldn't confirm payment"}
                        </h1>
                        <p className="text-sm text-gray-500 mb-6">
                            {message ?? "Please check your orders page or try again."}
                        </p>
                        <Link
                            href="/orders"
                            className="block w-full py-2.5 rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-700 text-sm font-semibold transition-colors"
                        >
                            Back to orders
                        </Link>
                    </>
                )}
            </div>
        </div>
    );
}

function PaymentSuccessFallback() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 max-w-md w-full text-center">
                <Loader2 className="w-10 h-10 text-[#EB3B18] animate-spin mx-auto mb-4" />
                <h1 className="text-lg font-bold text-gray-900 mb-1">Confirming your payment…</h1>
                <p className="text-sm text-gray-500">This should only take a moment.</p>
            </div>
        </div>
    );
}

export default function PaymentSuccessPage() {
    return (
        <Suspense fallback={<PaymentSuccessFallback />}>
            <PaymentSuccessContent />
        </Suspense>
    );
}