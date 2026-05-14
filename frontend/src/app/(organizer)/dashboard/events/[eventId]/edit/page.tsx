"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { PAYMENT_METHODS } from "@/lib/constants";
import { ArrowRight, ArrowLeft, CheckCircle2, Save } from "lucide-react";
import { fetchBackend } from "@/lib/apiClient";
import { toast } from "sonner";

export default function EditEventPage({ params }: { params: { eventId: string } }) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

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

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const event = await fetchBackend(`/events/${params.eventId}`);
        
        const dt = new Date(event.dateTime);
        const dateStr = dt.toISOString().split('T')[0];
        const timeStr = dt.toTimeString().slice(0, 5);

        let mkTime = "";
        if (event.matchKickoff) {
            mkTime = new Date(event.matchKickoff).toTimeString().slice(0, 5);
        }

        setFormData({
          title: event.title,
          description: event.description || "",
          venue: event.venue,
          venueMapUrl: event.venueMapUrl || "",
          city: event.city || "",
          date: dateStr,
          time: timeStr,
          ticketPrice: (event.ticketPrice / 100).toString(),
          maxCapacity: event.maxCapacity.toString(),
          homeTeam: event.homeTeam || "",
          awayTeam: event.awayTeam || "",
          competition: event.competition || "",
          matchKickoffTime: mkTime,
          paymentInstructions: event.paymentInstructions || "",
          paymentAccounts: event.paymentAccounts || [],
        });
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };
    fetchEvent();
  }, [params.eventId]);

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

      await fetchBackend(`/events/${params.eventId}`, {
        method: "PATCH",
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

      toast.success("Event updated successfully");
      router.push(`/dashboard/events/${params.eventId}`);
    } catch (err: any) {
      setError(err.message);
      setIsSubmitting(false);
    }
  };

  if (isLoading) return <div className="p-12 text-center">Loading event...</div>;

  return (
    <div className="max-w-2xl mx-auto pb-12">
      <div className="mb-8 flex justify-between items-end">
        <div>
            <h2 className="text-3xl font-bold text-[#111827] font-['Outfit'] tracking-tight">Edit Event</h2>
            <p className="text-[#6B7280] mt-1">Update your event details.</p>
        </div>
        <button onClick={handleSubmit} disabled={isSubmitting} className="bg-[#1A7A4A] text-white px-5 py-2.5 rounded-xl font-medium flex items-center gap-2">
            <Save className="w-5 h-5" /> {isSubmitting ? "Saving..." : "Save Changes"}
        </button>
      </div>

      {/* Stepper Progress */}
      <div className="flex items-center justify-between mb-8 relative">
        <div className="absolute left-0 right-0 top-1/2 h-0.5 bg-gray-200 -z-10 transform -translate-y-1/2"></div>
        <div className="absolute left-0 top-1/2 h-0.5 bg-[#1A7A4A] -z-10 transform -translate-y-1/2 transition-all duration-300" style={{ width: step === 1 ? "0%" : step === 2 ? "33%" : step === 3 ? "66%" : "100%" }}></div>
        
        {[1, 2, 3, 4].map((num) => (
          <button 
            key={num} 
            onClick={() => setStep(num)}
            className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-colors shadow-sm
              ${step >= num ? "bg-[#1A7A4A] text-white" : "bg-white text-gray-400 border-2 border-gray-200"}
            `}
          >
            {num}
          </button>
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
            <div className="space-y-5">
              <h3 className="text-xl font-bold font-['Outfit'] border-b pb-2 mb-6">1. Event Basics</h3>
              <div>
                <label className="block text-sm font-medium text-[#111827] mb-1">Event Title *</label>
                <input name="title" type="text" required value={formData.title} onChange={handleChange} className="w-full px-4 py-3 rounded-xl border-2 border-[#E5E7EB] focus:border-[#1A7A4A] focus:outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#111827] mb-1">Description</label>
                <textarea name="description" rows={3} value={formData.description} onChange={handleChange} className="w-full px-4 py-3 rounded-xl border-2 border-[#E5E7EB] focus:border-[#1A7A4A] focus:outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-5">
                <input name="venue" type="text" placeholder="Venue" value={formData.venue} onChange={handleChange} className="w-full px-4 py-3 rounded-xl border-2 border-[#E5E7EB]" />
                <input name="city" type="text" placeholder="City" value={formData.city} onChange={handleChange} className="w-full px-4 py-3 rounded-xl border-2 border-[#E5E7EB]" />
              </div>
              <div className="grid grid-cols-2 gap-5">
                <input name="date" type="date" value={formData.date} onChange={handleChange} className="w-full px-4 py-3 rounded-xl border-2 border-[#E5E7EB]" />
                <input name="time" type="time" value={formData.time} onChange={handleChange} className="w-full px-4 py-3 rounded-xl border-2 border-[#E5E7EB]" />
              </div>
              <div className="pt-6 flex justify-end">
                <button type="button" onClick={() => setStep(2)} className="bg-[#1A7A4A] text-white px-6 py-3 rounded-xl font-medium">Next</button>
              </div>
            </div>
          )}

          {/* Other steps simplified for brevity but fully functional */}
          {step === 2 && (
             <div className="space-y-5">
                <h3 className="text-xl font-bold font-['Outfit'] border-b pb-2 mb-6">2. Match Details</h3>
                <div className="grid grid-cols-2 gap-5">
                    <input name="homeTeam" type="text" placeholder="Home Team" value={formData.homeTeam} onChange={handleChange} className="w-full px-4 py-3 rounded-xl border-2 border-[#E5E7EB]" />
                    <input name="awayTeam" type="text" placeholder="Away Team" value={formData.awayTeam} onChange={handleChange} className="w-full px-4 py-3 rounded-xl border-2 border-[#E5E7EB]" />
                </div>
                <div className="grid grid-cols-2 gap-5">
                    <input name="competition" type="text" placeholder="Competition" value={formData.competition} onChange={handleChange} className="w-full px-4 py-3 rounded-xl border-2 border-[#E5E7EB]" />
                    <input name="matchKickoffTime" type="time" value={formData.matchKickoffTime} onChange={handleChange} className="w-full px-4 py-3 rounded-xl border-2 border-[#E5E7EB]" />
                </div>
                <div className="pt-6 flex justify-between">
                    <button type="button" onClick={() => setStep(1)} className="text-gray-500">Back</button>
                    <button type="button" onClick={() => setStep(3)} className="bg-[#1A7A4A] text-white px-6 py-3 rounded-xl font-medium">Next</button>
                </div>
             </div>
          )}

          {step === 3 && (
            <div className="space-y-5">
                <h3 className="text-xl font-bold font-['Outfit'] border-b pb-2 mb-6">3. Ticket & Payment Settings</h3>
                <div className="grid grid-cols-2 gap-5">
                    <div>
                        <label className="block text-sm font-medium text-[#111827] mb-1">Price (ETB)</label>
                        <input name="ticketPrice" type="number" value={formData.ticketPrice} onChange={handleChange} className="w-full px-4 py-3 rounded-xl border-2 border-[#E5E7EB] focus:border-[#1A7A4A] focus:outline-none" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-[#111827] mb-1">Capacity</label>
                        <input name="maxCapacity" type="number" value={formData.maxCapacity} onChange={handleChange} className="w-full px-4 py-3 rounded-xl border-2 border-[#E5E7EB] focus:border-[#1A7A4A] focus:outline-none" />
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
                      <label className="block text-xs font-bold text-gray-700 uppercase">Payment Accounts</label>
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
                      <p className="text-sm text-gray-500 text-center py-4 border-2 border-dashed rounded-xl">No accounts added. Fans won't know where to send money.</p>
                    )}
                  </div>
                </div>

                <div className="pt-6 flex justify-between">
                    <button type="button" onClick={() => setStep(2)} className="text-gray-500">Back</button>
                    <button type="button" onClick={() => setStep(4)} className="bg-[#1A7A4A] text-white px-6 py-3 rounded-xl font-medium">Next</button>
                </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-5">
                <h3 className="text-xl font-bold font-['Outfit'] border-b pb-2 mb-6">4. Review</h3>
                <div className="bg-gray-50 p-6 rounded-xl border border-gray-200">
                    <p className="font-bold">{formData.title}</p>
                    <p className="text-sm text-gray-600 mt-2">{formData.date} at {formData.time}</p>
                    <p className="text-sm text-gray-600">{formData.venue}</p>
                    <p className="text-sm font-bold text-[#1A7A4A] mt-2">{formData.ticketPrice} ETB • {formData.maxCapacity} spots</p>
                </div>
                <div className="pt-6 flex justify-between">
                    <button type="button" onClick={() => setStep(3)} className="text-gray-500">Back</button>
                    <button type="button" onClick={handleSubmit} disabled={isSubmitting} className="bg-[#1A7A4A] text-white px-8 py-3 rounded-xl font-bold">
                        {isSubmitting ? "Saving..." : "Save Changes"}
                    </button>
                </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
