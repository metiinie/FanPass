"use client";

import { useEffect, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";

interface QRScannerProps {
  onScanSuccess: (decodedText: string) => void;
  isPaused: boolean;
}

export default function QRScanner({ onScanSuccess, isPaused }: QRScannerProps) {
  const [error, setError] = useState<string>("");

  useEffect(() => {
    const scannerId = "reader";
    let html5QrCode: Html5Qrcode | null = null;

    const startScanner = async () => {
      try {
        html5QrCode = new Html5Qrcode(scannerId);
        
        await html5QrCode.start(
          { facingMode: "environment" },
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1.0,
          },
          (decodedText) => {
            if (!isPaused) {
              onScanSuccess(decodedText);
            }
          },
          () => {
            // Ignore normal scanning errors (e.g. no code found)
          }
        );
      } catch (err: unknown) {
        console.error("Scanner Error:", err);
        setError("Camera permission denied or camera not available.");
      }
    };

    startScanner();

    return () => {
      if (html5QrCode && html5QrCode.isScanning) {
        html5QrCode.stop().catch(console.error);
      }
    };
  }, [isPaused, onScanSuccess]);

  if (error) {
    return (
      <div className="w-full aspect-square flex flex-col items-center justify-center bg-brand-surface rounded-3xl border border-white/5 p-8">
        <p className="text-red-400 text-center text-sm font-medium leading-relaxed">{error}</p>
        <button 
          onClick={() => window.location.reload()} 
          className="mt-6 px-4 py-2 bg-brand-neon/10 text-brand-neon rounded-xl text-xs font-bold border border-brand-neon/20"
        >
          Retry Camera
        </button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-sm mx-auto overflow-hidden rounded-[2.5rem] shadow-2xl relative bg-black border-4 border-white/5">
      <div id="reader" className="w-full !border-none" />
      {/* Target area overlay */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-[250px] h-[250px] border-2 border-brand-neon/40 rounded-3xl shadow-[0_0_20px_rgba(25,210,107,0.1)] relative">
          {/* Corner accents */}
          <div className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-brand-neon rounded-tl-xl shadow-glow-sm" />
          <div className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-brand-neon rounded-tr-xl shadow-glow-sm" />
          <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-brand-neon rounded-bl-xl shadow-glow-sm" />
          <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-brand-neon rounded-br-xl shadow-glow-sm" />
          
          {/* Scanning line animation */}
          <div className="absolute left-4 right-4 h-[2px] bg-brand-neon/50 shadow-glow-sm top-0 animate-[scan_2s_infinite]" />
        </div>
      </div>
    </div>
  );
}
