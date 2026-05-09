"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PAYMENT_METHODS } from "@/lib/constants";
import { ArrowRight, ArrowLeft, CheckCircle2 } from "lucide-react";
import { useSession } from "next-auth/react";

export default function CreateEventPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const { data: session } = useSession();

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    venue: "",
    venueMapUrl: "",
    date: "",
    time: "",
    ticketPrice: "",
    maxCapacity: "",
    paymentMethods: ["TELEBIRR"],
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleCheckboxChange = (method: string) => {
    setFormData((prev) => {
      const methods = prev.paymentMethods.includes(method)
        ? prev.paymentMethods.filter((m) => m !== method)
        : [...prev.paymentMethods, method];
      return { ...prev, paymentMethods: methods };
    });
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setError("");

    try {
      // Combine date and time
      const dateTime = new Date(`${formData.date}T${formData.time}`).toISOString();
      const ticketPriceInSantim = Math.round(parseFloat(formData.ticketPrice) * 100);

      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';
      const res = await fetch(`${backendUrl}/events`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session?.accessToken}`
        },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          venue: formData.venue,
          venueMapUrl: formData.venueMapUrl,
          dateTime,
          ticketPrice: ticketPriceInSantim,
          maxCapacity: parseInt(formData.maxCapacity, 10),
          paymentMethods: formData.paymentMethods,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to create event");
      }

      router.push(`/dashboard/events/${data.id}`);
    } catch (err: any) {
      setError(err.message);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto pb-12">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-[#111827] font-['Outfit'] tracking-tight">Create New Event</h2>
        <p className="text-[#6B7280] mt-1">Set up your next watch party or live event.</p>
      </div>

      {/* Stepper Progress */}
      <div className="flex items-center justify-between mb-8 relative">
        <div className="absolute left-0 right-0 top-1/2 h-0.5 bg-gray-200 -z-10 transform -translate-y-1/2"></div>
        <div className="absolute left-0 top-1/2 h-0.5 bg-[#1A7A4A] -z-10 transform -translate-y-1/2 transition-all duration-300" style={{ width: step === 1 ? "0%" : step === 2 ? "50%" : "100%" }}></div>
        
        {[1, 2, 3].map((num) => (
          <div 
            key={num} 
            className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-colors shadow-sm
              ${step >= num ? "bg-[#1A7A4A] text-white" : "bg-white text-gray-400 border-2 border-gray-200"}
            `}
          >
            {step > num ? <CheckCircle2 className="w-5 h-5" /> : num}
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-[#E5E7EB] overflow-hidden">
        <div className="p-6 md:p-8">
          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-50 text-red-600 text-sm border border-red-100">
              {error}
            </div>
          )}

          {/* STEP 1: Details */}
          {step === 1 && (
            <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
              <h3 className="text-xl font-bold font-['Outfit'] border-b pb-2 mb-6">1. Event Details</h3>
              
              <div>
                <label className="block text-sm font-medium text-[#111827] mb-1">Event Title *</label>
                <input
                  name="title"
                  type="text"
                  required
                  placeholder="e.g., EPL Match Night - Arsenal vs Man City"
                  value={formData.title}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-xl border-2 border-[#E5E7EB] focus:border-[#1A7A4A] focus:outline-none transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#111827] mb-1">Description</label>
                <textarea
                  name="description"
                  rows={3}
                  placeholder="What's this event about?"
                  value={formData.description}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-xl border-2 border-[#E5E7EB] focus:border-[#1A7A4A] focus:outline-none transition-colors resize-none"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-[#111827] mb-1">Venue Name *</label>
                  <input
                    name="venue"
                    type="text"
                    required
                    placeholder="e.g., Sky Lounge Hall"
                    value={formData.venue}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-xl border-2 border-[#E5E7EB] focus:border-[#1A7A4A] focus:outline-none transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#111827] mb-1">Google Maps URL (Optional)</label>
                  <input
                    name="venueMapUrl"
                    type="url"
                    placeholder="https://maps.google.com/..."
                    value={formData.venueMapUrl}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-xl border-2 border-[#E5E7EB] focus:border-[#1A7A4A] focus:outline-none transition-colors"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-[#111827] mb-1">Date *</label>
                  <input
                    name="date"
                    type="date"
                    required
                    value={formData.date}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-xl border-2 border-[#E5E7EB] focus:border-[#1A7A4A] focus:outline-none transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#111827] mb-1">Time *</label>
                  <input
                    name="time"
                    type="time"
                    required
                    value={formData.time}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-xl border-2 border-[#E5E7EB] focus:border-[#1A7A4A] focus:outline-none transition-colors"
                  />
                </div>
              </div>

              <div className="pt-6 flex justify-end">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  disabled={!formData.title || !formData.venue || !formData.date || !formData.time}
                  className="flex items-center gap-2 bg-[#1A7A4A] text-white px-6 py-3 rounded-xl font-medium hover:bg-[#0F4D2E] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Next Step <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: Settings */}
          {step === 2 && (
            <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
              <h3 className="text-xl font-bold font-['Outfit'] border-b pb-2 mb-6">2. Ticket Settings</h3>
              
              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-[#111827] mb-1">Ticket Price (ETB) *</label>
                  <input
                    name="ticketPrice"
                    type="number"
                    min="0"
                    step="0.01"
                    required
                    placeholder="150"
                    value={formData.ticketPrice}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-xl border-2 border-[#E5E7EB] focus:border-[#1A7A4A] focus:outline-none transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#111827] mb-1">Max Capacity *</label>
                  <input
                    name="maxCapacity"
                    type="number"
                    min="1"
                    required
                    placeholder="200"
                    value={formData.maxCapacity}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-xl border-2 border-[#E5E7EB] focus:border-[#1A7A4A] focus:outline-none transition-colors"
                  />
                </div>
              </div>

              <div className="pt-4">
                <label className="block text-sm font-medium text-[#111827] mb-3">Accepted Payment Methods *</label>
                <div className="space-y-3">
                  {Object.entries(PAYMENT_METHODS).map(([key, info]) => (
                    <label key={key} className="flex items-center p-4 border-2 rounded-xl cursor-pointer hover:bg-gray-50 transition-colors border-[#E5E7EB]">
                      <input
                        type="checkbox"
                        checked={formData.paymentMethods.includes(key)}
                        onChange={() => handleCheckboxChange(key)}
                        className="w-5 h-5 text-[#1A7A4A] rounded border-gray-300 focus:ring-[#1A7A4A]"
                      />
                      <span className="ml-3 text-xl">{info.icon}</span>
                      <span className="ml-3 font-medium text-[#111827]">{info.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="pt-6 flex justify-between">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="flex items-center gap-2 text-[#6B7280] hover:text-[#111827] px-4 py-2 font-medium transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" /> Back
                </button>
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  disabled={!formData.ticketPrice || !formData.maxCapacity || formData.paymentMethods.length === 0}
                  className="flex items-center gap-2 bg-[#1A7A4A] text-white px-6 py-3 rounded-xl font-medium hover:bg-[#0F4D2E] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Review <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: Review */}
          {step === 3 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              <h3 className="text-xl font-bold font-['Outfit'] border-b pb-2 mb-6">3. Review & Publish</h3>
              
              <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                <h4 className="font-bold text-[#111827] text-lg mb-4">{formData.title}</h4>
                <div className="grid grid-cols-2 gap-y-4 gap-x-8 text-sm">
                  <div>
                    <span className="text-[#6B7280] block mb-1">Date & Time</span>
                    <span className="font-medium">{formData.date} at {formData.time}</span>
                  </div>
                  <div>
                    <span className="text-[#6B7280] block mb-1">Venue</span>
                    <span className="font-medium">{formData.venue}</span>
                  </div>
                  <div>
                    <span className="text-[#6B7280] block mb-1">Ticket Price</span>
                    <span className="font-medium">{formData.ticketPrice} ETB</span>
                  </div>
                  <div>
                    <span className="text-[#6B7280] block mb-1">Capacity</span>
                    <span className="font-medium">{formData.maxCapacity} people</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-[#6B7280] block mb-1">Payments</span>
                    <span className="font-medium">{formData.paymentMethods.join(", ")}</span>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 text-blue-800 p-4 rounded-xl text-sm border border-blue-100 flex gap-3">
                <InfoIcon className="w-5 h-5 shrink-0" />
                <p>Publishing will immediately make this event active and generate a public link for ticket sales.</p>
              </div>

              <div className="pt-6 flex justify-between">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="flex items-center gap-2 text-[#6B7280] hover:text-[#111827] px-4 py-2 font-medium transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" /> Edit
                </button>
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="flex items-center gap-2 bg-[#1A7A4A] text-white px-8 py-3 rounded-xl font-bold tracking-wide hover:bg-[#0F4D2E] disabled:opacity-50 transition-colors shadow-sm"
                >
                  {isSubmitting ? "Publishing..." : "Publish Event"}
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

function InfoIcon(props: any) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="12" cy="12" r="10"/>
      <path d="M12 16v-4"/>
      <path d="M12 8h.01"/>
    </svg>
  );
}
