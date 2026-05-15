"use client";

import { CheckCircle, XCircle, RefreshCw } from "lucide-react";
import { SCAN_RESULT_LABELS } from "@/lib/constants";

interface ScanResultProps {
  result: "VALID" | "ALREADY_USED" | "INVALID" | "WRONG_EVENT" | "RETRYING" | "EVENT_CANCELLED";
  buyerName?: string | null;
  buyerPhone?: string;
  onClose: () => void;
}

export default function ScanResult({ result, buyerName, buyerPhone, onClose }: ScanResultProps) {
  const isSuccess = result === "VALID";
  const config = SCAN_RESULT_LABELS[result] || SCAN_RESULT_LABELS.INVALID;

  return (
    <div 
      className="fixed inset-0 z-[60] flex flex-col items-center justify-center p-6 bg-bg/95 backdrop-blur-md animate-in fade-in duration-300"
      onClick={onClose}
    >
      {/* Decorative background glow based on result */}
      <div className={`absolute inset-0 opacity-20 pointer-events-none transition-colors duration-500 ${
        isSuccess ? "bg-brand-neon" : result === "RETRYING" ? "bg-blue-500" : "bg-red-500"
      }`} />
      <div className="flex flex-col items-center text-center text-white">
        {result === "VALID" ? (
          <div className="relative mb-8">
            <div className="absolute inset-0 bg-brand-neon/20 blur-3xl rounded-full" />
            <CheckCircle className="w-40 h-40 text-brand-neon relative z-10" />
          </div>
        ) : result === "RETRYING" ? (
          <div className="relative mb-8">
            <RefreshCw className="w-40 h-40 text-blue-400 animate-spin" />
          </div>
        ) : (
          <div className="relative mb-8">
            <div className="absolute inset-0 bg-red-500/20 blur-3xl rounded-full" />
            <XCircle className="w-40 h-40 text-red-500 relative z-10" />
          </div>
        )}
        
        <h1 className={`text-5xl font-black font-outfit tracking-tighter mb-4 uppercase ${
          isSuccess ? "text-brand-neon" : "text-white"
        }`}>
          {config.label}
        </h1>
        
        {isSuccess && (buyerName || buyerPhone) && (
          <div className="mt-8 bg-brand-surface border border-white/10 p-8 rounded-[2.5rem] min-w-[300px] shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-brand-neon shadow-glow-sm" />
            <p className="text-xs font-black uppercase tracking-[0.2em] text-gray-500 mb-2">Access Granted</p>
            <p className="text-3xl font-bold text-white font-outfit">{buyerName || "Guest"}</p>
            {buyerPhone && <p className="text-brand-neon font-bold mt-2 tracking-widest">{buyerPhone}</p>}
          </div>
        )}

        {!isSuccess && result === "ALREADY_USED" && (
          <div className="mt-8 bg-brand-surface border border-red-500/30 p-8 rounded-[2.5rem] min-w-[300px] shadow-2xl relative overflow-hidden">
             <div className="absolute top-0 left-0 w-full h-1 bg-red-500 shadow-[0_0_15px_rgba(239,68,68,0.5)]" />
            <p className="text-lg font-bold text-red-400 font-outfit uppercase tracking-wider">Warning</p>
            <p className="text-white/80 mt-2 font-medium">Ticket has already been scanned.</p>
            <div className="mt-4 px-4 py-2 bg-red-500/10 rounded-xl border border-red-500/20 text-red-500 font-black text-xs uppercase">
              Do Not Admit
            </div>
          </div>
        )}
      </div>
      
      <p className="absolute bottom-12 text-gray-500 text-xs font-black uppercase tracking-[0.3em] animate-pulse">
        Tap to continue
      </p>
    </div>
  );
}
