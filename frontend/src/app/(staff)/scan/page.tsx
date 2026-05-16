"use client";

import { useState, useCallback, useEffect } from "react";
import QRScanner from "@/components/scanner/QRScanner";
import ScanResult from "@/components/scanner/ScanResult";
import type { ScanResult as IScanResult } from "@/types";
import { LogOut } from "lucide-react";
import { signOut, getSession } from "next-auth/react";
import { useRouter } from "next/navigation";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001";

interface ManifestTicket {
  id: string;
  status: string;
  buyerName: string | null;
  buyerPhone: string;
}

interface ScanLog {
  id: string;
  result: string;
  scannedAt: string;
  ticket: {
    buyerPhone: string;
  };
}

interface PendingScan {
  token: string;
  ticketId: string;
  scannedAt: string;
}

export default function ScannerPage() {
  const router = useRouter();
  const [scanResult, setScanResult] = useState<IScanResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [eventId, setEventId] = useState<string | null>(null);
  const [eventTitle, setEventTitle] = useState<string>("");
  const [scans, setScans] = useState<ScanLog[]>([]);
  
  // Offline State
  const [manifest, setManifest] = useState<ManifestTicket[]>([]);
  const [pendingScans, setPendingScans] = useState<PendingScan[]>([]);
  const [, setLastSync] = useState<string | null>(null);
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
    } catch {
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
        const ticketInManifest = manifest.find((t: ManifestTicket) => t.id === ticketId);

        if (ticketInManifest) {
          if (ticketInManifest.status === "SCANNED" || pendingScans.some((s: PendingScan) => s.ticketId === ticketId)) {
            setScanResult({ result: "ALREADY_USED" });
          } else {
            setScanResult({
              result: "VALID",
              buyerName: ticketInManifest.buyerName,
              buyerPhone: ticketInManifest.buyerPhone,
            });
            const newPending: PendingScan[] = [...pendingScans, { token, ticketId, scannedAt: new Date().toISOString() }];
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
    <div className="min-h-screen bg-bg flex flex-col font-outfit text-white">
      {/* Header */}
      <header className="bg-brand-surface/80 backdrop-blur-xl border-b border-white/10 p-4 flex justify-between items-center sticky top-0 z-30">
        <div className="flex-1">
          <h1 className="font-bold text-white tracking-tight text-lg">Staff Portal</h1>
          <p className="text-xs text-gray-400 font-medium truncate max-w-[200px]">{eventTitle || "Connecting..."}</p>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={handleSync}
            disabled={isSyncing || !eventId}
            className={`relative flex flex-col items-end group transition-all ${isSyncing ? "opacity-50" : ""}`}
          >
            <div className="flex items-center gap-2 text-[10px] font-bold text-brand-neon bg-brand-neon/10 px-3 py-1.5 rounded-full border border-brand-neon/20 hover:bg-brand-neon/20 transition-colors">
              <div className={`w-2 h-2 rounded-full bg-brand-neon ${isSyncing ? "animate-pulse shadow-[0_0_8px_rgba(25,210,107,0.8)]" : ""}`} />
              {isSyncing ? "Syncing..." : "Sync"}
            </div>
            {pendingScans.length > 0 && (
              <div className="absolute -top-1 -left-1 w-5 h-5 bg-brand-neon text-bg text-[10px] font-bold flex items-center justify-center rounded-full border-2 border-bg animate-bounce shadow-glow-sm">
                {pendingScans.length}
              </div>
            )}
          </button>

          <div className="h-8 w-[1px] bg-white/5 mx-1" />

          <button 
            onClick={() => signOut()}
            className="text-gray-400 hover:text-red-500 transition-colors p-2 hover:bg-white/5 rounded-xl"
            title="Sign Out"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Main Scanner Area */}
      <main className="flex-1 flex flex-col items-center justify-center p-6 relative overflow-hidden">
        {/* Decorative background glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-brand-neon/5 blur-[100px] pointer-events-none" />

        <div className="w-full max-w-sm mb-8 text-center relative z-10">
          <p className="text-gray-400 font-medium">
            Scan Ticket QR Code
          </p>
          <div className="mt-2 h-1 w-12 bg-brand-neon mx-auto rounded-full opacity-50" />
        </div>

        {eventId ? (
          <div className="relative z-10 w-full max-w-sm">
            <QRScanner 
              onScanSuccess={handleScan}
              isPaused={isProcessing || !!scanResult}
            />
          </div>
        ) : (
          <div className="w-full max-w-sm aspect-square bg-brand-surface rounded-3xl border border-white/5 animate-pulse flex items-center justify-center relative z-10">
             <span className="text-gray-500 font-medium italic">Assigning event...</span>
          </div>
        )}

        {isProcessing && !scanResult && (
          <div className="absolute inset-0 bg-bg/60 backdrop-blur-md flex flex-col items-center justify-center z-40">
            <div className="relative w-16 h-16">
              <div className="absolute inset-0 rounded-full border-4 border-brand-neon/20"></div>
              <div className="absolute inset-0 rounded-full border-4 border-t-brand-neon animate-spin"></div>
            </div>
            <p className="mt-6 font-bold text-white tracking-wide animate-pulse">VERIFYING...</p>
          </div>
        )}
      </main>

      {/* Result Overlay */}
      {scanResult && (
        <ScanResult 
          result={scanResult.result}
          buyerName={scanResult.buyerName}
          buyerPhone={scanResult.buyerPhone}
          onClose={handleCloseResult}
        />
      )}

      {/* Recent Scans Drawer */}
      <div className="bg-brand-surface border-t border-white/10 mt-auto relative z-20">
        <div className="p-4 border-b border-white/5 flex items-center justify-between">
          <h3 className="font-bold text-xs text-gray-400 uppercase tracking-widest">Entry History</h3>
          <span className="text-[10px] bg-brand-neon/10 px-2 py-0.5 rounded font-bold text-brand-neon border border-brand-neon/20">
            {scans.length} TOTAL
          </span>
        </div>
        <div className="max-h-56 overflow-y-auto hide-scrollbar">
          {scans.length === 0 ? (
            <div className="p-10 text-center text-sm text-gray-500 italic font-medium">
              No tickets scanned in this session
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {scans.map((s: ScanLog) => (
                <div key={s.id} className="p-4 flex items-center justify-between hover:bg-white/[0.02] transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-brand-neon/10 flex items-center justify-center text-brand-neon font-bold text-xs">
                      {s.ticket.buyerPhone.slice(-2)}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white">{s.ticket.buyerPhone}</p>
                      <p className="text-[10px] text-gray-500 font-medium">
                        {new Date(s.scannedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </p>
                    </div>
                  </div>
                  <div className="px-2.5 py-1 rounded-full bg-brand-neon/10 text-brand-neon text-[9px] font-black uppercase tracking-tighter border border-brand-neon/30 shadow-[0_0_10px_rgba(25,210,107,0.1)]">
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
