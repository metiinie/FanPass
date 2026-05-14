"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, ArrowLeft, CheckCircle2 } from "lucide-react";
import { useSession } from "next-auth/react";
import { fetchBackend } from "@/lib/apiClient";

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
    city: "",
    date: "",
    time: "",
    ticketPrice: "",
    maxCapacity: "",
    homeTeam: "",
    awayTeam: "",
    competition: "",
    matchKickoffTime: "",
    paymentInstructions: "",
    paymentAccounts: [] as { type: string; number: string; name: string }[],
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleAddAccount = () => {
    setFormData(prev => ({
      ...prev,
      paymentAccounts: [...prev.paymentAccounts, { type: "Telebirr", number: "", name: "" }]
    }));
  };

  const handleAccountChange = (index: number, field: string, value: string) => {
    const newAccounts = [...formData.paymentAccounts];
    newAccounts[index] = { ...newAccounts[index], [field]: value };
    setFormData({ ...formData, paymentAccounts: newAccounts });
  };

  const handleRemoveAccount = (index: number) => {
    const newAccounts = [...formData.paymentAccounts];
    newAccounts.splice(index, 1);
    setFormData({ ...formData, paymentAccounts: newAccounts });
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setError("");

    try {
      // Combine date and time
      const dateTime = new Date(`${formData.date}T${formData.time}`).toISOString();
      const ticketPriceInSantim = Math.round(parseFloat(formData.ticketPrice) * 100);
      
      let matchKickoff = undefined;
      if (formData.matchKickoffTime) {
        matchKickoff = new Date(`${formData.date}T${formData.matchKickoffTime}`).toISOString();
      }

      const data = await fetchBackend("/events", {
        method: "POST",
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          venue: formData.venue,
          city: formData.city,
          venueMapUrl: formData.venueMapUrl,
          dateTime,
          ticketPrice: ticketPriceInSantim,
          maxCapacity: parseInt(formData.maxCapacity, 10),
          homeTeam: formData.homeTeam || undefined,
          awayTeam: formData.awayTeam || undefined,
          competition: formData.competition || undefined,
          matchKickoff,
          paymentInstructions: formData.paymentInstructions,
          paymentAccounts: formData.paymentAccounts,
          expectedAmount: Math.round(parseFloat(formData.ticketPrice)),
        }),
      });

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
        <div className="absolute left-0 top-1/2 h-0.5 bg-[#1A7A4A] -z-10 transform -translate-y-1/2 transition-all duration-300" style={{ width: step === 1 ? "0%" : step === 2 ? "33%" : step === 3 ? "66%" : "100%" }}></div>
        
        {[1, 2, 3, 4].map((num) => (
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
              <h3 className="text-xl font-bold font-['Outfit'] border-b pb-2 mb-6">1. Event Basics</h3>
              
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
                  <label className="block text-sm font-medium text-[#111827] mb-1">City (for filtering)</label>
                  <input
                    name="city"
                    type="text"
                    placeholder="e.g., Addis Ababa"
                    value={formData.city}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-xl border-2 border-[#E5E7EB] focus:border-[#1A7A4A] focus:outline-none transition-colors"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-[#111827] mb-1">Doors Open (Date) *</label>
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
                  <label className="block text-sm font-medium text-[#111827] mb-1">Doors Open (Time) *</label>
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

          {/* STEP 2: Match Details */}
          {step === 2 && (
            <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
              <h3 className="text-xl font-bold font-['Outfit'] border-b pb-2 mb-6">2. Match Details (Optional)</h3>
              
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 text-sm text-gray-600 mb-4">
                If this is a football watch party, fill out these fields to help fans find the game. If it's a general event, just click Next.
              </div>

              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-[#111827] mb-1">Home Team</label>
                  <input
                    name="homeTeam"
                    type="text"
                    placeholder="e.g., Arsenal"
                    value={formData.homeTeam}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-xl border-2 border-[#E5E7EB] focus:border-[#1A7A4A] focus:outline-none transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#111827] mb-1">Away Team</label>
                  <input
                    name="awayTeam"
                    type="text"
                    placeholder="e.g., Man City"
                    value={formData.awayTeam}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-xl border-2 border-[#E5E7EB] focus:border-[#1A7A4A] focus:outline-none transition-colors"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-[#111827] mb-1">Competition</label>
                  <input
                    name="competition"
                    type="text"
                    placeholder="e.g., Premier League"
                    value={formData.competition}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-xl border-2 border-[#E5E7EB] focus:border-[#1A7A4A] focus:outline-none transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#111827] mb-1">Match Kick-off Time</label>
                  <input
                    name="matchKickoffTime"
                    type="time"
                    value={formData.matchKickoffTime}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-xl border-2 border-[#E5E7EB] focus:border-[#1A7A4A] focus:outline-none transition-colors"
                  />
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
                  className="flex items-center gap-2 bg-[#1A7A4A] text-white px-6 py-3 rounded-xl font-medium hover:bg-[#0F4D2E] transition-colors"
                >
                  Next Step <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: Settings */}
          {step === 3 && (
            <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
              <h3 className="text-xl font-bold font-['Outfit'] border-b pb-2 mb-6">3. Ticket & Payment Settings</h3>
              
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

              <div className="mt-8 border-t pt-6">
                <h4 className="font-bold text-[#111827] mb-4">Payment Instructions</h4>
                <p className="text-sm text-gray-500 mb-4">Instructions shown to fans when they buy tickets.</p>
                
                <div className="mb-6">
                  <label className="block text-xs text-gray-500 mb-1">General Instructions (Optional)</label>
                  <textarea 
                    name="paymentInstructions" 
                    rows={2} 
                    value={formData.paymentInstructions} 
                    onChange={handleChange} 
                    placeholder="e.g. Please transfer the exact amount and upload the screenshot."
                    className="w-full px-4 py-3 rounded-xl border-2 border-[#E5E7EB] focus:border-[#1A7A4A] focus:outline-none" 
                  />
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-gray-700 uppercase">Payment Accounts *</label>
                    <button type="button" onClick={handleAddAccount} className="text-xs font-bold text-[#1A7A4A] bg-[#1A7A4A]/10 px-3 py-1.5 rounded-lg hover:bg-[#1A7A4A]/20">
                      + Add Account
                    </button>
                  </div>
                  
                  {formData.paymentAccounts.map((account, index) => (
                    <div key={index} className="flex gap-2 items-start bg-gray-50 p-4 rounded-xl border border-gray-200">
                      <div className="flex-1 space-y-3">
                        <select 
                          value={account.type}
                          onChange={(e) => handleAccountChange(index, 'type', e.target.value)}
                          className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm"
                        >
                          <option value="Telebirr">Telebirr</option>
                          <option value="CBE Birr">CBE Birr</option>
                          <option value="Bank Transfer">Bank Transfer</option>
                        </select>
                        <input 
                          type="text" 
                          placeholder="Account Number (e.g. 0911...)" 
                          value={account.number}
                          onChange={(e) => handleAccountChange(index, 'number', e.target.value)}
                          className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm"
                        />
                        <input 
                          type="text" 
                          placeholder="Account Name (e.g. Abebe K.)" 
                          value={account.name}
                          onChange={(e) => handleAccountChange(index, 'name', e.target.value)}
                          className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm"
                        />
                      </div>
                      <button type="button" onClick={() => handleRemoveAccount(index)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg">
                        ×
                      </button>
                    </div>
                  ))}
                  {formData.paymentAccounts.length === 0 && (
                    <p className="text-sm text-red-500 text-center py-4 border-2 border-dashed border-red-200 rounded-xl bg-red-50">Please add at least one payment account.</p>
                  )}
                </div>
              </div>

              <div className="pt-6 flex justify-between">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="flex items-center gap-2 text-[#6B7280] hover:text-[#111827] px-4 py-2 font-medium transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" /> Back
                </button>
                <button
                  type="button"
                  onClick={() => setStep(4)}
                  disabled={!formData.ticketPrice || !formData.maxCapacity || formData.paymentAccounts.length === 0}
                  className="flex items-center gap-2 bg-[#1A7A4A] text-white px-6 py-3 rounded-xl font-medium hover:bg-[#0F4D2E] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Review <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 4: Review */}
          {step === 4 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              <h3 className="text-xl font-bold font-['Outfit'] border-b pb-2 mb-6">4. Review & Publish</h3>
              
              <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                <h4 className="font-bold text-[#111827] text-lg mb-4">{formData.title}</h4>
                <div className="grid grid-cols-2 gap-y-4 gap-x-8 text-sm">
                  {formData.homeTeam && formData.awayTeam && (
                    <div className="col-span-2">
                      <span className="text-[#6B7280] block mb-1">Match</span>
                      <span className="font-medium text-[#1A7A4A]">{formData.homeTeam} vs {formData.awayTeam}</span>
                    </div>
                  )}
                  <div>
                    <span className="text-[#6B7280] block mb-1">Date & Time</span>
                    <span className="font-medium">{formData.date} at {formData.time}</span>
                  </div>
                  <div>
                    <span className="text-[#6B7280] block mb-1">Venue</span>
                    <span className="font-medium">{formData.venue} {formData.city ? `(${formData.city})` : ''}</span>
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
                    <span className="text-[#6B7280] block mb-1">Payment Accounts</span>
                    <span className="font-medium">{formData.paymentAccounts.map(a => a.type).join(", ")}</span>
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
                  onClick={() => setStep(3)}
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
