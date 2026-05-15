"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { formatCurrency } from "@/lib/utils";
import { CheckCircle2, Copy, UploadCloud, AlertCircle, Loader2, ArrowRight } from "lucide-react";
import { fetchBackend } from "@/lib/apiClient";
import { toast } from "sonner";
import type { EventWithStats, ReceiptExtraction } from "@/types";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export default function TicketPurchasePage({ params }: { params: { slug: string } }) {
  const router = useRouter();
  const [event, setEvent] = useState<EventWithStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    ticketCount: 1,
    note: "",
  });

  const [receiptImage, setReceiptImage] = useState<{ base64: string; mimeType: string } | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [extraction, setExtraction] = useState<ReceiptExtraction | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const data = await fetchBackend(`/events/public/${params.slug}`, { requireAuth: false });
        setEvent(data);
      } catch (err: any) {
        setError(err.message || "Failed to load event");
      } finally {
        setIsLoading(false);
      }
    };
    fetchEvent();
  }, [params.slug]);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard!");
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_FILE_SIZE) {
      toast.error("File is too large. Maximum size is 10MB.");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      setImagePreview(result);
      
      const base64 = result.split(",")[1];
      setReceiptImage({
        base64,
        mimeType: file.type,
      });
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!event) return;
    if (!receiptImage) {
      toast.error("Please upload a receipt image.");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const response = await fetchBackend("/tickets/submit", {
        method: "POST",
        requireAuth: false,
        body: JSON.stringify({
          eventId: event.id,
          buyerPhone: formData.phone,
          buyerName: formData.name,
          ticketCount: formData.ticketCount,
          screenshotBase64: receiptImage.base64,
          mimeType: receiptImage.mimeType,
          note: formData.note,
        }),
      });

      setExtraction(response.extraction);
      toast.success("Receipt submitted successfully!");
      
      // Delay slightly so user can see extraction success (if we had a middle step),
      // but the spec says redirect to status page.
      router.push(`/tickets/${response.ticketId}/status`);
      
    } catch (err: any) {
      setError(err.message || "Failed to submit receipt");
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F8FAF9] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#1A7A4A] animate-spin" />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-[#F8FAF9] flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-3xl text-center max-w-md shadow-sm border border-[#E5E7EB]">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold font-['Outfit'] mb-2">Event Not Found</h2>
          <p className="text-[#6B7280]">{error}</p>
        </div>
      </div>
    );
  }

  const totalAmountSantim = (event.expectedAmount ? event.expectedAmount * 100 : event.ticketPrice) * formData.ticketCount;

  return (
    <div className="min-h-screen bg-[#F8FAF9] py-12 px-4">
      <div className="max-w-3xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold font-['Outfit'] text-[#111827]">Get Your Ticket</h1>
          <p className="text-[#6B7280]">Complete the payment and upload your receipt.</p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-xl border border-red-100 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <p className="text-sm font-medium">{error}</p>
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-8">
          {/* Left Column: Payment Instructions */}
          <div className="space-y-6">
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-[#E5E7EB]">
              <h2 className="text-xl font-bold font-['Outfit'] mb-4">1. Make Payment</h2>
              
              <div className="bg-[#1A7A4A]/5 p-4 rounded-xl mb-6">
                <p className="text-sm text-[#1A7A4A] font-medium mb-1">Total to pay:</p>
                <div className="text-3xl font-bold text-[#1A7A4A] font-['Outfit']">
                  {formatCurrency(totalAmountSantim, event.currency)}
                </div>
                {formData.ticketCount > 1 && (
                  <p className="text-xs text-[#1A7A4A]/80 mt-1">
                    For {formData.ticketCount} tickets
                  </p>
                )}
              </div>

              {event.paymentInstructions && (
                <p className="text-[#4B5563] text-sm mb-6">{event.paymentInstructions}</p>
              )}

              {event.paymentAccounts && Array.isArray(event.paymentAccounts) && (
                <div className="space-y-3">
                  {event.paymentAccounts.map((account: any, idx: number) => (
                    <div key={idx} className="flex items-center justify-between p-4 rounded-xl border border-[#E5E7EB] hover:border-[#1A7A4A]/30 transition-colors bg-gray-50/50">
                      <div>
                        <p className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider mb-1">{account.type}</p>
                        <p className="font-bold text-[#111827] font-['Outfit']">{account.number}</p>
                        {account.name && <p className="text-xs text-[#6B7280] mt-0.5">{account.name}</p>}
                      </div>
                      <button 
                        onClick={() => handleCopy(account.number)}
                        className="p-2 text-[#1A7A4A] bg-[#1A7A4A]/10 rounded-lg hover:bg-[#1A7A4A]/20 transition-colors"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-[#E5E7EB]">
                <h3 className="font-bold font-['Outfit'] text-lg mb-2">Important</h3>
                <ul className="text-sm text-[#6B7280] space-y-2 list-disc list-inside">
                    <li>Send the exact amount shown above.</li>
                    <li>Take a clear screenshot of the final success screen.</li>
                    <li>Do not upload fake or altered receipts.</li>
                </ul>
            </div>
          </div>

          {/* Right Column: Form & Upload */}
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-[#E5E7EB]">
            <h2 className="text-xl font-bold font-['Outfit'] mb-6">2. Upload & Submit</h2>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-[#111827] mb-1.5">Full Name</label>
                  <input
                    required
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-[#E5E7EB] focus:ring-2 focus:ring-[#1A7A4A] focus:border-[#1A7A4A] outline-none transition-all"
                    placeholder="Abebe Kebede"
                  />
                </div>
                
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-sm font-medium text-[#111827] mb-1.5">Phone Number</label>
                  <input
                    required
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-[#E5E7EB] focus:ring-2 focus:ring-[#1A7A4A] focus:border-[#1A7A4A] outline-none transition-all"
                    placeholder="0911..."
                  />
                </div>

                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-sm font-medium text-[#111827] mb-1.5">Quantity</label>
                  <select
                    value={formData.ticketCount}
                    onChange={(e) => setFormData({ ...formData, ticketCount: parseInt(e.target.value) })}
                    className="w-full px-4 py-3 rounded-xl border border-[#E5E7EB] focus:ring-2 focus:ring-[#1A7A4A] focus:border-[#1A7A4A] outline-none transition-all bg-white"
                  >
                    {[1, 2, 3, 4].map(n => (
                      <option key={n} value={n}>{n} {n === 1 ? 'Ticket' : 'Tickets'}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#111827] mb-1.5">Payment Screenshot</label>
                
                <input 
                  type="file" 
                  accept="image/jpeg,image/png,image/webp,image/heic"
                  className="hidden"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                />

                {!imagePreview ? (
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-[#E5E7EB] rounded-2xl p-8 text-center cursor-pointer hover:bg-gray-50 transition-colors group"
                  >
                    <div className="w-12 h-12 bg-[#1A7A4A]/10 text-[#1A7A4A] rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                      <UploadCloud className="w-6 h-6" />
                    </div>
                    <p className="text-sm font-medium text-[#111827] mb-1">Click to upload screenshot</p>
                    <p className="text-xs text-[#6B7280]">JPG, PNG, WEBP up to 10MB</p>
                  </div>
                ) : (
                  <div className="relative rounded-2xl border border-[#E5E7EB] overflow-hidden group">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={imagePreview} alt="Receipt preview" className="w-full h-48 object-cover" />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <button 
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="bg-white text-black px-4 py-2 rounded-lg text-sm font-medium"
                      >
                        Change Image
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={isSubmitting || !receiptImage}
                className="w-full bg-[#111827] hover:bg-[#1A7A4A] text-white py-4 rounded-xl font-bold font-['Outfit'] transition-colors flex justify-center items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Reading Receipt...
                  </>
                ) : (
                  <>
                    Submit for Review
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>

            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
