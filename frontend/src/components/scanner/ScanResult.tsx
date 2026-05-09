"use client";

import { CheckCircle, XCircle, RefreshCw } from "lucide-react";
import { SCAN_RESULT_LABELS } from "@/lib/constants";
import { maskPhone } from "@/lib/utils";

interface ScanResultProps {
  result: "VALID" | "ALREADY_USED" | "INVALID" | "WRONG_EVENT" | "RETRYING";
  buyerName?: string | null;
  buyerPhone?: string;
  onClose: () => void;
}

export default function ScanResult({ result, buyerName, buyerPhone, onClose }: ScanResultProps) {
  const isSuccess = result === "VALID";
  const config = SCAN_RESULT_LABELS[result] || SCAN_RESULT_LABELS.INVALID;

  return (
    <div 
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center p-6 ${config.bgColor} animate-in fade-in duration-200`}
      onClick={onClose}
    >
      <div className="flex flex-col items-center text-center text-white">
        {result === "VALID" ? (
          <CheckCircle className="w-32 h-32 mb-6" />
        ) : result === "RETRYING" ? (
          <RefreshCw className="w-32 h-32 mb-6 animate-spin" />
        ) : (
          <XCircle className="w-32 h-32 mb-6" />
        )}
        
        <h1 className="text-4xl font-bold tracking-tight mb-2">
          {config.label}
        </h1>
        
        {isSuccess && (buyerName || buyerPhone) && (
          <div className="mt-6 bg-white/20 p-6 rounded-2xl backdrop-blur-sm min-w-[250px]">
            <p className="text-sm font-medium uppercase tracking-wider text-green-100 mb-1">Admit</p>
            <p className="text-2xl font-semibold">{buyerName || "Guest"}</p>
            {buyerPhone && <p className="text-green-50 mt-1">{maskPhone(buyerPhone)}</p>}
          </div>
        )}

        {!isSuccess && result === "ALREADY_USED" && (
          <div className="mt-6 bg-white/20 p-6 rounded-2xl backdrop-blur-sm min-w-[250px]">
            <p className="text-lg font-medium">Ticket has already been scanned.</p>
            <p className="text-sm text-red-100 mt-2">Do not admit.</p>
          </div>
        )}
      </div>
      
      <p className="absolute bottom-12 text-white/70 text-sm font-medium">
        Tap anywhere to continue
      </p>
    </div>
  );
}
