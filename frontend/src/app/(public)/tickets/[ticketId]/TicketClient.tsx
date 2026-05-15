"use client";

import { useEffect, useState } from "react";
import { formatDateTime, maskPhone } from "@/lib/utils";
import { TICKET_STATUS_LABELS } from "@/lib/constants";
import { MapPin, Calendar, CheckCircle2, Ticket as TicketIcon, AlertCircle } from "lucide-react";
import Image from "next/image";
import QRCode from "qrcode";
import InstallPrompt from "@/components/pwa/InstallPrompt";

import { TicketDisplay } from "@/types";

interface TicketClientProps {
  initialTicket: TicketDisplay;
}

export default function TicketClient({ initialTicket }: TicketClientProps) {
  const [ticket, setTicket] = useState(initialTicket);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string | null>(null);

  useEffect(() => {
    // Generate initial QR code if ready
    const generateQR = async () => {
      if (ticket.qrToken && (ticket.status === "ISSUED" || ticket.status === "SCANNED")) {
        const url = await QRCode.toDataURL(ticket.qrToken, {
          width: 512,
          margin: 2,
          color: { dark: "#111827", light: "#FFFFFF" },
        });
        setQrCodeDataUrl(url);
      }
    };
    generateQR();

    // Only poll if pending
    if (ticket.status !== "PENDING") return;

    const interval = setInterval(async () => {
      try {
        // We use window.fetch here since we are in a client component
        const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001";
        const res = await fetch(`${BACKEND_URL}/tickets/${ticket.id}`);
        const json = await res.json();
        
        if (json.success && json.data) {
          const updatedTicket = json.data;
          setTicket(updatedTicket);
          
          if (updatedTicket.status !== "PENDING") {
            clearInterval(interval);
            // Generate QR if it's now ready
            if (updatedTicket.qrToken) {
              const url = await QRCode.toDataURL(updatedTicket.qrToken, {
                width: 512,
                margin: 2,
                color: { dark: "#111827", light: "#FFFFFF" },
              });
              setQrCodeDataUrl(url);
            }
          }
        }
      } catch (error) {
        console.error("Polling error:", error);
      }
    }, 5000); // Poll every 5 seconds

    return () => clearInterval(interval);
  }, [ticket.id, ticket.status, ticket.qrToken]);

  const isPending = ticket.status === "PENDING";
  const statusInfo = TICKET_STATUS_LABELS[ticket.status] || { label: ticket.status, color: "text-gray-500" };
  const [currentUrl, setCurrentUrl] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      setCurrentUrl(window.location.href);
    }
  }, []);

  return (
    <>
      <div className="min-h-screen bg-[#F8FAF9] flex flex-col items-center pt-8 pb-12 px-4 sm:pt-12">
        <div className="w-full max-w-md">
          
          {/* Ticket Header */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[#1A7A4A] text-white mb-3 shadow-[0_4px_14px_0_rgba(26,122,74,0.39)]">
              <TicketIcon className="w-6 h-6" />
            </div>
            <h1 className="text-2xl font-semibold text-[#111827] font-['Outfit']">Your Ticket</h1>
            <p className="text-[#6B7280] text-sm mt-1">Keep this ready for scanning at the entrance</p>
          </div>

          {/* Ticket Card */}
          <div className="bg-white rounded-[2rem] shadow-lg border border-[#E5E7EB] overflow-hidden relative">
            
            {/* Card Top / Event Info */}
            <div className="bg-[#1A7A4A] p-8 text-center text-white relative overflow-hidden">
              <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white to-transparent" />
              <div className="relative z-10">
                <h2 className="text-2xl font-bold font-['Outfit'] mb-4 leading-tight">{ticket.event.title}</h2>
                <div className="flex flex-col gap-2 items-center text-sm font-medium text-green-50">
                  <span className="flex items-center gap-1.5"><Calendar className="w-4 h-4" /> {formatDateTime(ticket.event.dateTime)}</span>
                  <span className="flex items-center gap-1.5">
                    <MapPin className="w-4 h-4" /> {ticket.event.venue}
                    {ticket.event.venueMapUrl && (
                      <a 
                        href={ticket.event.venueMapUrl} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="ml-2 px-2 py-0.5 bg-white/20 rounded text-[10px] uppercase font-bold hover:bg-white/30 transition-colors"
                      >
                        View Map
                      </a>
                    )}
                  </span>
                </div>
              </div>
            </div>

            {/* Ticket perforations */}
            <div className="relative h-8 bg-white flex items-center justify-between px-[-10px] z-10">
              <div className="w-8 h-8 rounded-full bg-[#F8FAF9] absolute -left-4 border-r border-[#E5E7EB] shadow-inner" />
              <div className="w-full border-t-[3px] border-dashed border-[#E5E7EB]" />
              <div className="w-8 h-8 rounded-full bg-[#F8FAF9] absolute -right-4 border-l border-[#E5E7EB] shadow-inner" />
            </div>

            {/* Card Bottom / QR Code */}
            <div className="p-8 text-center bg-white flex flex-col items-center">
              
              {isPending ? (
                <div className="py-12 flex flex-col items-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1A7A4A] mb-4"></div>
                  <h3 className="text-lg font-medium text-[#111827]">Payment Pending</h3>
                  <p className="text-[#6B7280] mt-2 text-sm max-w-[250px]">Waiting for confirmation. This page will update automatically.</p>
                </div>
              ) : qrCodeDataUrl ? (
                <div className="flex flex-col items-center animate-in fade-in zoom-in duration-500">
                  <div className="bg-white p-4 rounded-2xl border-2 border-[#E5E7EB] shadow-sm mb-6 inline-block">
                    <Image 
                      src={qrCodeDataUrl} 
                      alt="Ticket QR Code" 
                      width={256} 
                      height={256}
                      className="w-48 h-48 sm:w-64 sm:h-64"
                      priority
                    />
                  </div>
                  
                  <div className="flex items-center gap-2 mb-4">
                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                    <span className="font-semibold text-green-600 tracking-wide uppercase text-sm">Valid Ticket</span>
                  </div>
                  
                  <p className="font-mono text-sm text-[#6B7280] tracking-wider mb-2">ID: {ticket.id.slice(-8).toUpperCase()}</p>
                </div>
              ) : (
                <div className="py-12 flex flex-col items-center animate-in fade-in duration-500">
                  <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-4">
                    <span className="text-2xl">⚠️</span>
                  </div>
                  <h3 className="text-lg font-medium text-[#111827] mb-1">Ticket Unavailable</h3>
                  <p className={`font-semibold ${statusInfo.color}`}>{statusInfo.label}</p>
                </div>
              )}

              <div className="w-full bg-gray-50 rounded-xl p-4 mt-6 text-left border border-[#E5E7EB]">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-[#6B7280] font-medium mb-0.5">Attendee</p>
                    <p className="text-[#111827] font-semibold">{ticket.buyerName || "Guest"}</p>
                  </div>
                  <div>
                    <p className="text-[#6B7280] font-medium mb-0.5">Phone</p>
                    <p className="text-[#111827] font-semibold">{maskPhone(ticket.buyerPhone)}</p>
                  </div>
                </div>
              </div>

            </div>

            {ticket.event.status === "CANCELLED" && (
              <div className="mt-6 p-6 bg-red-50 rounded-2xl border border-red-100 text-left w-full">
                <h3 className="text-red-800 font-bold mb-2 flex items-center gap-2">
                   <AlertCircle className="w-5 h-5" /> Event Cancelled
                </h3>
                <p className="text-red-700 text-sm mb-4">This event has been cancelled by the organizer.</p>
                
                <div className="space-y-4">
                  <div>
                    <p className="text-xs font-bold text-red-900 uppercase tracking-wider mb-1">Refund Policy</p>
                    <p className="text-sm text-red-700">{ticket.event.refundPolicy || "Please contact the organizer for refund details."}</p>
                  </div>
                  {ticket.event.organizerContact && (
                    <div>
                      <p className="text-xs font-bold text-red-900 uppercase tracking-wider mb-1">Organizer Contact</p>
                      <p className="text-sm text-red-700 font-bold">{ticket.event.organizerContact}</p>
                    </div>
                  )}
                  <div className="pt-2 border-t border-red-200">
                    <p className="text-xs text-red-600 italic">Note: FanPass is a verification tool. Refunds are handled manually by the event organizer.</p>
                  </div>
                </div>
              </div>
            )}

          </div>
          
          {/* Share Buttons */}
          {!isPending && (ticket.status === "ISSUED" || ticket.status === "SCANNED") && (
            <div className="mt-8 space-y-4 animate-in slide-in-from-bottom-4 duration-500">
              <p className="text-center text-[#6B7280] text-sm">Share your ticket or bookmark this page.</p>
              <div className="flex gap-3">
                <a 
                  href={`https://wa.me/?text=${encodeURIComponent(`Got my FanPass ticket for ${ticket.event.title}! ${currentUrl}`)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-[#25D366] text-white font-bold text-sm shadow-sm hover:bg-[#20bd5b] transition-colors"
                >
                  Share on WhatsApp
                </a>
                <a 
                  href={`https://t.me/share/url?url=${encodeURIComponent(currentUrl)}&text=${encodeURIComponent(`Got my FanPass ticket for ${ticket.event.title}!`)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-[#0088CC] text-white font-bold text-sm shadow-sm hover:bg-[#0077b5] transition-colors"
                >
                  Share on Telegram
                </a>
              </div>
            </div>
          )}
        </div>
        <InstallPrompt />
      </div>
    </>
  );
}
