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
          (errorMessage) => {
            // Ignore normal scanning errors (e.g. no code found)
          }
        );
      } catch (err: any) {
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
      <div className="w-full h-full flex items-center justify-center bg-gray-100 rounded-xl border border-gray-200 p-6">
        <p className="text-red-500 text-center">{error}</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-sm mx-auto overflow-hidden rounded-2xl shadow-sm relative bg-black">
      <div id="reader" className="w-full !border-none" />
      <div className="absolute inset-0 border-4 border-[#1A7A4A] opacity-50 rounded-2xl pointer-events-none" />
    </div>
  );
}
