"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { fetchBackend } from "@/lib/apiClient";
import { Loader2, CheckCircle2, XCircle, Clock, AlertCircle, ArrowRight } from "lucide-react";
import Link from "next/link";

import { TicketDisplay } from "@/types";

export default function TicketStatusPage({ params }: { params: { ticketId: string } }) {
  const router = useRouter();
  const [status, setStatus] = useState<TicketDisplay | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const data = await fetchBackend(`/tickets/${params.ticketId}/status`, { requireAuth: false });
        setStatus(data);

        if (data.verificationStatus === "VERIFIED" || data.verificationStatus === "REJECTED") {
          clearInterval(intervalId);
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Failed to load status";
        setError(msg);
        clearInterval(intervalId);
      }
    };

    checkStatus();
    const intervalId = setInterval(checkStatus, 15000);

    return () => clearInterval(intervalId);
  }, [params.ticketId]);

  if (error) {
    return (
      <div className="min-h-screen bg-[#F8FAF9] flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-3xl text-center max-w-md shadow-sm border border-[#E5E7EB]">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold font-['Outfit'] mb-2">Error</h2>
          <p className="text-[#6B7280]">{error}</p>
        </div>
      </div>
    );
  }

  if (!status) {
    return (
      <div className="min-h-screen bg-[#F8FAF9] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#1A7A4A] animate-spin" />
      </div>
    );
  }

  const { verificationStatus, event, rejectionReason } = status;
  const isPending = ["PENDING_EXTRACTION", "EXTRACTED_HIGH_CONFIDENCE", "EXTRACTED_LOW_CONFIDENCE", "MANUAL_REVIEW_REQUIRED"].includes(verificationStatus);
  const isApproved = verificationStatus === "VERIFIED";
  const isRejected = verificationStatus === "REJECTED";

  return (
    <div className="min-h-screen bg-[#F8FAF9] flex flex-col items-center justify-center p-4 py-12">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-sm border border-[#E5E7EB] overflow-hidden">
        
        {/* Header Area */}
        <div className={`p-8 text-center ${
          isPending ? 'bg-yellow-50/50' : 
          isApproved ? 'bg-green-50/50' : 
          'bg-red-50/50'
        }`}>
          {isPending && (
            <>
              <div className="w-16 h-16 bg-yellow-100 text-yellow-600 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                <Clock className="w-8 h-8" />
              </div>
              <h1 className="text-2xl font-bold font-['Outfit'] text-[#111827] mb-2">Review in Progress</h1>
              <p className="text-[#6B7280] text-sm">We are reviewing your payment receipt for {event.title}. This usually takes a few minutes.</p>
            </>
          )}

          {isApproved && (
            <>
              <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h1 className="text-2xl font-bold font-['Outfit'] text-[#111827] mb-2">Ticket Issued!</h1>
              <p className="text-[#6B7280] text-sm">Your payment for {event.title} was approved.</p>
            </>
          )}

          {isRejected && (
            <>
              <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <XCircle className="w-8 h-8" />
              </div>
              <h1 className="text-2xl font-bold font-['Outfit'] text-[#111827] mb-2">Payment Rejected</h1>
              <p className="text-[#6B7280] text-sm">We could not verify your payment for {event.title}.</p>
            </>
          )}
        </div>

        {/* Content Area */}
        <div className="p-8 space-y-6 text-center">
          
          {isPending && (
             <div className="flex flex-col items-center justify-center text-sm text-[#6B7280]">
                <Loader2 className="w-5 h-5 text-[#1A7A4A] animate-spin mb-3" />
                <p>This page will update automatically.</p>
                <p>We will also send you an SMS when it is ready.</p>
             </div>
          )}

          {isApproved && (
             <div>
                <Link href={`/tickets/${params.ticketId}`} className="w-full inline-flex items-center justify-center gap-2 bg-[#111827] hover:bg-[#1A7A4A] text-white py-4 rounded-xl font-bold transition-colors">
                  View your ticket
                  <ArrowRight className="w-5 h-5" />
                </Link>
             </div>
          )}

          {isRejected && (
             <div className="space-y-6">
                <div className="bg-red-50 p-4 rounded-xl border border-red-100 text-left">
                  <p className="text-sm font-medium text-red-800 mb-1">Reason for rejection:</p>
                  <p className="text-sm text-red-600">{rejectionReason || "Not specified"}</p>
                </div>
                
                <p className="text-sm text-[#6B7280]">
                  Please ensure you sent the correct amount and uploaded a clear, unedited screenshot of the successful transfer.
                </p>

                <button 
                  onClick={() => router.back()}
                  className="w-full bg-[#111827] text-white py-3 rounded-xl font-medium transition-colors"
                >
                  Try Again
                </button>
             </div>
          )}

        </div>
      </div>
    </div>
  );
}
