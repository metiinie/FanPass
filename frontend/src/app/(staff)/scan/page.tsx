"use client";

import { useState, useCallback, useEffect } from "react";
import QRScanner from "@/components/scanner/QRScanner";
import ScanResult from "@/components/scanner/ScanResult";
import type { ScanResult as IScanResult } from "@/types";
import { LogOut } from "lucide-react";
import { signOut, getSession } from "next-auth/react";
import { useRouter } from "next/navigation";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001";

export default function ScannerPage() {
  const router = useRouter();
  const [scanResult, setScanResult] = useState<IScanResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [eventId, setEventId] = useState<string | null>(null);
  const [eventTitle, setEventTitle] = useState<string>("");

  const [scans, setScans] = useState<any[]>([]);
  
  const fetchScans = async () => {
    try {
      const session = await getSession();
      const res = await fetch(`${BACKEND_URL}/staff/me/scans`, {
        headers: { "Authorization": `Bearer ${session?.accessToken}` },
      });
      const data = await res.json();
      if (data.success) setScans(data.data);
    } catch (error) {
      console.error("Failed to fetch scans:", error);
    }
  };

  useEffect(() => {
    const fetchAssignments = async () => {
      try {
        const session = await getSession();
        if (!session?.accessToken) {
          router.push("/login");
          return;
        }

        const res = await fetch(`${BACKEND_URL}/staff/me/assignments`, {
          headers: {
            "Authorization": `Bearer ${session.accessToken}`,
          },
        });

        const json = await res.json();
        if (json.success && json.data && json.data.length > 0) {
          setEventId(json.data[0].eventId);
          setEventTitle(json.data[0].event.title);
        }
      } catch (error) {
        console.error("Failed to fetch assignments:", error);
      }
    };

    fetchAssignments();
    fetchScans();
  }, [router]);

  const handleScan = useCallback(async (token: string) => {
    if (isProcessing || scanResult || !eventId) return;

    setIsProcessing(true);
    let attempts = 0;
    const maxAttempts = 3;

    const validate = async (): Promise<boolean> => {
      try {
        const session = await getSession();
        const res = await fetch(`${BACKEND_URL}/tickets/validate`, {
          method: "POST",
          headers: { 
            "Content-Type": "application/json",
            "Authorization": `Bearer ${session?.accessToken}`
          },
          body: JSON.stringify({ token, eventId }),
        });

        const json = await res.json();
        
        if (!res.ok || json.success === false) {
          const msg = json.message;
          // If it's a known non-transient error, don't retry
          if (msg === 'Ticket already scanned') {
            setScanResult({ result: 'ALREADY_USED' });
            return true;
          }
          if (msg === 'Ticket not valid for this event') {
            setScanResult({ result: 'WRONG_EVENT' });
            return true;
          }
          if (msg === 'Invalid ticket token' || msg === 'Ticket not found' || msg === 'Ticket not valid for entry') {
            setScanResult({ result: 'INVALID' });
            return true;
          }
          // Otherwise, it might be a network/server issue
          throw new Error(msg || "Validation failed");
        }

        const data = json.data;
        setScanResult({
          result: "VALID",
          buyerName: data.ticket.buyerName,
          buyerPhone: data.ticket.buyerPhone,
        });
        fetchScans();
        return true;
      } catch (error) {
        console.error(`Attempt ${attempts + 1} failed:`, error);
        return false;
      }
    };

    while (attempts < maxAttempts) {
      if (attempts > 0) {
        setScanResult({ result: "RETRYING" });
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      const success = await validate();
      if (success) break;

      attempts++;
      if (attempts === maxAttempts) {
        setScanResult({ result: "INVALID" });
      }
    }

    // Auto clear after 3 seconds
    setTimeout(() => {
      setScanResult(null);
      setIsProcessing(false);
    }, 3000);
  }, [eventId, isProcessing, scanResult]);

  const handleCloseResult = () => {
    setScanResult(null);
    setIsProcessing(false);
  };

  return (
    <div className="min-h-screen bg-[#F8FAF9] flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-[#E5E7EB] p-4 flex justify-between items-center">
        <div>
          <h1 className="font-semibold text-[#111827] font-['Outfit'] text-lg">Scanner Portal</h1>
          <p className="text-xs text-[#6B7280]">{eventTitle || "Loading event..."}</p>
        </div>
        <button 
          onClick={() => signOut()}
          className="text-[#6B7280] hover:text-red-600 transition-colors flex items-center gap-2 text-sm font-medium"
        >
          <LogOut className="w-4 h-4" />
          <span>Exit</span>
        </button>
      </header>

      {/* Main Scanner Area */}
      <main className="flex-1 flex flex-col items-center justify-center p-4 relative">
        <div className="w-full max-w-sm mb-6 text-center">
          <p className="text-[#6B7280]">
            Point camera at the ticket QR code
          </p>
        </div>

        {eventId ? (
          <QRScanner 
            onScanSuccess={handleScan}
            isPaused={isProcessing || !!scanResult}
          />
        ) : (
          <div className="w-full max-w-sm aspect-square bg-gray-200 rounded-2xl animate-pulse flex items-center justify-center">
             <span className="text-gray-500">Loading assignments...</span>
          </div>
        )}

        {isProcessing && !scanResult && (
          <div className="absolute inset-0 bg-white/80 flex flex-col items-center justify-center z-10 backdrop-blur-sm">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1A7A4A] mb-4"></div>
            <p className="font-medium text-[#111827]">Verifying ticket...</p>
          </div>
        )}
      </main>

      {/* Result Overlay */}
        />
      )}

      {/* Recent Scans Drawer / List */}
      <div className="bg-white border-t border-[#E5E7EB] mt-auto">
        <div className="p-4 border-b border-[#E5E7EB] flex items-center justify-between">
          <h3 className="font-bold text-sm text-[#111827] uppercase tracking-wider">Session History</h3>
          <span className="text-xs bg-gray-100 px-2 py-0.5 rounded text-[#6B7280]">{scans.length} scans</span>
        </div>
        <div className="max-h-48 overflow-y-auto">
          {scans.length === 0 ? (
            <div className="p-8 text-center text-sm text-[#6B7280]">No scans in this session yet</div>
          ) : (
            <div className="divide-y divide-gray-50">
              {scans.map((s) => (
                <div key={s.id} className="p-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold text-[#111827]">{s.ticket.buyerPhone}</p>
                    <p className="text-[10px] text-[#6B7280]">{new Date(s.scannedAt).toLocaleTimeString()}</p>
                  </div>
                  <div className="px-2 py-1 rounded-md bg-green-50 text-green-700 text-[10px] font-bold uppercase">
                    {s.result}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
