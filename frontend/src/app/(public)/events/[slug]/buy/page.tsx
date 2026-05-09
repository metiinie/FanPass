"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { PAYMENT_METHODS } from "@/lib/constants";
import { formatCurrency } from "@/lib/utils";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001";

export default function TicketPurchasePage({ params }: { params: { slug: string } }) {
  const router = useRouter();
  const [event, setEvent] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");

  useEffect(() => {
    async function fetchEvent() {
      try {
        const res = await fetch(`${BACKEND_URL}/events/public/${params.slug}`);
        if (!res.ok) {
          if (res.status === 404) router.replace("/404");
          throw new Error("Failed to load event details");
        }
        const data = await res.json();
        
        if (data.status !== "ACTIVE" || data.ticketsSold >= data.maxCapacity) {
          router.replace(`/events/${params.slug}`);
          return;
        }
        
        setEvent(data);
        if (data.paymentMethods?.length > 0) {
          setPaymentMethod(data.paymentMethods[0]);
        } else {
          setPaymentMethod("TELEBIRR"); // Fallback
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    }
    fetchEvent();
  }, [params.slug, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");

    try {
      // Step 1: Initiate ticket
      const res = await fetch(`${BACKEND_URL}/tickets/initiate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventId: event.id,
          buyerPhone: phone,
          buyerName: name || undefined,
          paymentMethod,
        }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.message || "Failed to initiate purchase");

      // Step 2: Redirect to payment (Simulation for now)
      // In a real app, data.paymentUrl would be returned.
      // For this demo, we'll simulate the webhook automatically if it's a simulation.
      
      const simRes = await fetch(`${BACKEND_URL}/payments/simulate-success`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transactionId: data.transaction.id }),
      });

      if (simRes.ok) {
        router.push(`/tickets/${data.ticket.id}`);
      } else {
        throw new Error("Payment simulation failed");
      }
    } catch (err: any) {
      setError(err.message);
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F8FAF9] flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1A7A4A]"></div>
      </div>
    );
  }

  if (!event) return null;

  return (
    <div className="min-h-screen bg-[#F8FAF9] flex flex-col pt-8 pb-24 px-4 sm:pt-16">
      <div className="w-full max-w-md mx-auto">
        <button 
          onClick={() => router.back()}
          className="text-sm font-medium text-[#6B7280] hover:text-[#111827] mb-6 flex items-center"
        >
          ← Back to event
        </button>

        <div className="bg-white rounded-2xl shadow-sm border border-[#E5E7EB] overflow-hidden">
          {/* Order Summary */}
          <div className="bg-[#1A7A4A] p-6 text-white">
            <p className="text-sm text-green-100 font-medium uppercase tracking-wider mb-1">Order Summary</p>
            <h2 className="text-xl font-semibold font-['Outfit'] mb-4 line-clamp-1">{event.title}</h2>
            <div className="flex justify-between items-end border-t border-green-700/50 pt-4 mt-2">
              <span className="text-sm text-green-50">1x Ticket</span>
              <span className="text-2xl font-bold font-['Outfit']">{formatCurrency(event.ticketPrice, event.currency)}</span>
            </div>
          </div>

          {/* Form */}
          <div className="p-6">
            {error && (
              <div className="mb-6 p-3 rounded-xl bg-red-50 text-red-600 text-sm border border-red-100">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-[#111827] mb-1">
                  Phone Number *
                </label>
                <input
                  id="phone"
                  type="tel"
                  placeholder="+251911..."
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border-2 border-[#E5E7EB] focus:border-[#1A7A4A] focus:outline-none transition-colors"
                  required
                />
                <p className="text-xs text-[#6B7280] mt-1">Your ticket will be sent via SMS to this number.</p>
              </div>

              <div>
                <label htmlFor="name" className="block text-sm font-medium text-[#111827] mb-1">
                  Full Name (Optional)
                </label>
                <input
                  id="name"
                  type="text"
                  placeholder="Abebe Kebede"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border-2 border-[#E5E7EB] focus:border-[#1A7A4A] focus:outline-none transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#111827] mb-2">
                  Payment Method
                </label>
                <div className="grid gap-3">
                  {(event.paymentMethods?.length > 0 ? event.paymentMethods : ["TELEBIRR"]).map((method: string) => {
                    const info = PAYMENT_METHODS[method as keyof typeof PAYMENT_METHODS];
                    const isSelected = paymentMethod === method;
                    return (
                      <label 
                        key={method} 
                        className={`
                          flex items-center p-4 border-2 rounded-xl cursor-pointer transition-colors
                          ${isSelected ? "border-[#1A7A4A] bg-[#E8F5EE]" : "border-[#E5E7EB] hover:border-gray-300"}
                        `}
                      >
                        <input
                          type="radio"
                          name="paymentMethod"
                          value={method}
                          checked={isSelected}
                          onChange={(e) => setPaymentMethod(e.target.value)}
                          className="w-4 h-4 text-[#1A7A4A] border-gray-300 focus:ring-[#1A7A4A]"
                        />
                        <span className="ml-3 text-lg">{info?.icon}</span>
                        <span className="ml-3 font-medium text-[#111827]">{info?.label || method}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  disabled={isSubmitting || !phone || !paymentMethod}
                  className="w-full py-4 rounded-xl font-semibold tracking-wide bg-[#1A7A4A] text-white hover:bg-[#0F4D2E] disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
                >
                  {isSubmitting ? "Processing..." : `Pay ${formatCurrency(event.ticketPrice, event.currency)}`}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
