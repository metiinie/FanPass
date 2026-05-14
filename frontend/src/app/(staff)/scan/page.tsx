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
  
  // Offline State
  const [manifest, setManifest] = useState<any[]>([]);
  const [pendingScans, setPendingScans] = useState<any[]>([]);
  const [lastSync, setLastSync] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    if (!eventId) return;
    const savedManifest = localStorage.getItem(`manifest_${eventId}`);
    if (savedManifest) {
      const data = JSON.parse(savedManifest);
      setManifest(data.tickets);
      setLastSync(data.timestamp);
    }
    const savedPending = localStorage.getItem(`pending_scans_${eventId}`);
    if (savedPending) {
      setPendingScans(JSON.parse(savedPending));
    }
  }, [eventId]);

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

  const handleSync = async () => {
    if (!eventId || isSyncing) return;
    setIsSyncing(true);
    try {
      const session = await getSession();
      const res = await fetch(`${BACKEND_URL}/tickets/sync/${eventId}`, {
        headers: { "Authorization": `Bearer ${session?.accessToken}` },
      });
      const json = await res.json();
      if (json.success) {
        const timestamp = new Date().toISOString();
        setManifest(json.data);
        setLastSync(timestamp);
        localStorage.setItem(`manifest_${eventId}`, JSON.stringify({ tickets: json.data, timestamp }));
        
        // Use new bulk sync endpoint
        const savedPending = localStorage.getItem(`pending_scans_${eventId}`);
        if (savedPending) {
          const pending = JSON.parse(savedPending);
          if (pending.length > 0) {
            await fetch(`${BACKEND_URL}/tickets/sync/${eventId}`, {
              method: "POST",
              headers: { 
                "Content-Type": "application/json",
                "Authorization": `Bearer ${session?.accessToken}`
              },
              body: JSON.stringify({ scans: pending }),
            });
          }
          setPendingScans([]);
          localStorage.removeItem(`pending_scans_${eventId}`);
        }
        fetchScans();
      }
    } catch (error) {
      console.error("Sync failed:", error);
    } finally {
      setIsSyncing(false);
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

  const decodeTicketId = (token: string) => {
    try {
      const base64Url = token.split(".")[1];
      const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split("")
          .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
          .join("")
      );
      return JSON.parse(jsonPayload).ticketId;
    } catch (e) {
      return null;
    }
  };

  const handleScan = useCallback(async (token: string) => {
    if (isProcessing || scanResult || !eventId) return;

    setIsProcessing(true);
    let attempts = 0;
    const maxAttempts = 2;

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
          setScanResult({ 
            result: json.result || "INVALID", 
            message: json.message 
          });
          return true;
        }

        setScanResult({
          result: "VALID",
          buyerName: json.buyerName,
          buyerPhone: json.buyerPhone,
        });
        fetchScans();
        return true;
      } catch (error) {
        // Fallback to offline manifest if network error
        const ticketId = decodeTicketId(token);
        const ticketInManifest = manifest.find(t => t.id === ticketId);

        if (ticketInManifest) {
          if (ticketInManifest.status === "SCANNED" || pendingScans.some(s => s.ticketId === ticketId)) {
            setScanResult({ result: "ALREADY_USED" });
          } else {
            setScanResult({
              result: "VALID",
              buyerName: ticketInManifest.buyerName,
              buyerPhone: ticketInManifest.buyerPhone,
            });
            const newPending = [...pendingScans, { token, ticketId, scannedAt: new Date().toISOString() }];
            setPendingScans(newPending);
            localStorage.setItem(`pending_scans_${eventId}`, JSON.stringify(newPending));
          }
          return true;
        }

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

    setTimeout(() => {
      setScanResult(null);
      setIsProcessing(false);
    }, 3000);
  }, [eventId, isProcessing, scanResult, manifest, pendingScans]);

  const handleCloseResult = () => {
    setScanResult(null);
    setIsProcessing(false);
  };

  return (
    <div className="min-h-screen bg-[#F8FAF9] flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-[#E5E7EB] p-4 flex justify-between items-center">
        <div className="flex-1">
          <h1 className="font-semibold text-[#111827] font-['Outfit'] text-lg">Scanner Portal</h1>
          <p className="text-xs text-[#6B7280]">{eventTitle || "Loading event..."}</p>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={handleSync}
            disabled={isSyncing || !eventId}
            className={`flex flex-col items-end group transition-all ${isSyncing ? "opacity-50" : ""}`}
          >
            <div className="flex items-center gap-1.5 text-xs font-bold text-[#1A7A4A] bg-[#F0FDF4] px-2 py-1 rounded-lg border border-[#DCFCE7] group-hover:bg-[#DCFCE7]">
              <div className={`w-1.5 h-1.5 rounded-full bg-[#1A7A4A] ${isSyncing ? "animate-pulse" : ""}`} />
              {isSyncing ? "Syncing..." : "Sync Event"}
            </div>
            {pendingScans.length > 0 && (
              <div className="absolute -top-1 -left-1 w-4 h-4 bg-orange-500 text-white text-[9px] flex items-center justify-center rounded-full border-2 border-white animate-bounce">
                {pendingScans.length}
              </div>
            )}
            {lastSync && (
              <span className="text-[9px] text-gray-400 mt-1">
                Last: {new Date(lastSync).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
          </button>

          <div className="h-8 w-[1px] bg-gray-100 mx-1" />

          <button 
            onClick={() => signOut()}
            className="text-[#6B7280] hover:text-red-600 transition-colors p-2"
            title="Sign Out"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
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
      {scanResult && (
        <ScanResult 
          result={scanResult.result as any}
          buyerName={scanResult.buyerName}
          buyerPhone={scanResult.buyerPhone}
          onClose={handleCloseResult}
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
