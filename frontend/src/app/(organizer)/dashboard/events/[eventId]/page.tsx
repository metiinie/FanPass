"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { SCAN_RESULT_LABELS } from "@/lib/constants";
import { Users, Ticket, Wallet, Activity, CheckCircle2, UserPlus, StopCircle, RefreshCw } from "lucide-react";
import Link from "next/link";
import { getSession } from "next-auth/react";
import { toast } from "sonner";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001";

export default function EventDashboardPage({ params }: { params: { eventId: string } }) {
  const router = useRouter();
  const [event, setEvent] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchEventData = async () => {
    try {
      const session = await getSession();
      if (!session?.accessToken) {
        router.push("/login");
        return;
      }

      const headers = {
        "Authorization": `Bearer ${session.accessToken}`,
        "Content-Type": "application/json",
      };

      const [eventRes, statsRes] = await Promise.all([
        fetch(`${BACKEND_URL}/events/${params.eventId}`, { headers }),
        fetch(`${BACKEND_URL}/events/${params.eventId}/stats`, { headers }),
      ]);

      if (!eventRes.ok || !statsRes.ok) {
        throw new Error("Failed to load event data");
      }

      const eventData = await eventRes.json();
      const statsData = await statsRes.json();

      setEvent(eventData);
      setStats(statsData);
      setError("");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEventData();
    // Poll every 10 seconds
    const interval = setInterval(fetchEventData, 10000);
    return () => clearInterval(interval);
  }, [params.eventId]);

  const handleEndEvent = async () => {
    if (!confirm("Are you sure you want to close this event? Ticket sales will stop immediately.")) {
      return;
    }

    try {
      const session = await getSession();
      const res = await fetch(`${BACKEND_URL}/events/${params.eventId}`, {
        method: "PATCH",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session?.accessToken}`
        },
        body: JSON.stringify({ status: "CLOSED" }),
      });

      if (res.ok) {
        fetchEventData();
      }
    } catch (err) {
      console.error(err);
      alert("Failed to end event");
    }
  };

  const handleRefund = async (ticketId: string) => {
    if (!confirm("Are you sure you want to refund this ticket? This action cannot be undone.")) {
      return;
    }

    try {
      const session = await getSession();
      const res = await fetch(`${BACKEND_URL}/tickets/${ticketId}/refund`, {
        method: "POST",
        headers: { 
          "Authorization": `Bearer ${session?.accessToken}`
        },
      });

      if (res.ok) {
        toast.success("Ticket refunded successfully");
        fetchEventData();
      } else {
        const errorData = await res.json();
        toast.error(errorData.message || "Failed to refund ticket");
      }
    } catch (err) {
      toast.error("Refund failed");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1A7A4A]"></div>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="bg-red-50 text-red-600 p-6 rounded-2xl border border-red-100">
        <h3 className="text-lg font-bold">Error Loading Dashboard</h3>
        <p>{error || "Event not found"}</p>
        <button onClick={() => router.push("/dashboard")} className="mt-4 underline font-medium">Back to events</button>
      </div>
    );
  }

  const salesProgress = Math.min(100, (stats.ticketsSold / stats.maxCapacity) * 100);
  const entryProgress = stats.ticketsSold > 0 ? Math.min(100, (stats.attendeesEntered / stats.ticketsSold) * 100) : 0;

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-300">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h2 className="text-3xl font-bold text-[#111827] font-['Outfit'] tracking-tight">{event.title}</h2>
            <div className="px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-green-100 text-green-800">
              {stats.eventStatus}
            </div>
          </div>
          <p className="text-[#6B7280] flex items-center gap-2 text-sm">
            <span>{formatDateTime(event.dateTime)}</span>
            <span>•</span>
            <span>{event.venue}</span>
          </p>
        </div>
        
        <div className="flex items-center gap-3 shrink-0">
          <Link 
            href={`/events/${event.slug}`} 
            target="_blank"
            className="px-4 py-2 bg-white border border-[#E5E7EB] text-[#111827] rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors shadow-sm"
          >
            View Public Page
          </Link>
          {stats.eventStatus === "ACTIVE" && (
            <button 
              onClick={handleEndEvent}
              className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-xl text-sm font-medium hover:bg-red-100 transition-colors"
            >
              <StopCircle className="w-4 h-4" /> End Event
            </button>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 text-sm text-[#1A7A4A] bg-[#E8F5EE] px-4 py-2 rounded-lg inline-flex">
        <RefreshCw className="w-4 h-4 animate-spin-slow" />
        <span className="font-medium">Live monitoring active (updates every 10s)</span>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-[#E5E7EB] shadow-sm">
          <div className="flex items-center gap-3 mb-2 text-[#6B7280]">
            <Ticket className="w-5 h-5 text-blue-500" />
            <h3 className="font-medium uppercase tracking-wider text-xs">Tickets Sold</h3>
          </div>
          <div className="flex items-end gap-2 mb-3">
            <span className="text-3xl font-bold font-['Outfit'] text-[#111827]">{stats.ticketsSold}</span>
            <span className="text-[#6B7280] mb-1">/ {stats.maxCapacity}</span>
          </div>
          <div className="h-2 w-full bg-[#E5E7EB] rounded-full overflow-hidden">
            <div className="h-full bg-blue-500" style={{ width: `${salesProgress}%` }} />
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-[#E5E7EB] shadow-sm">
          <div className="flex items-center gap-3 mb-2 text-[#6B7280]">
            <Users className="w-5 h-5 text-green-500" />
            <h3 className="font-medium uppercase tracking-wider text-xs">Entered Venue</h3>
          </div>
          <div className="flex items-end gap-2 mb-3">
            <span className="text-3xl font-bold font-['Outfit'] text-[#111827]">{stats.attendeesEntered}</span>
            <span className="text-[#6B7280] mb-1">/ {stats.ticketsSold}</span>
          </div>
          <div className="h-2 w-full bg-[#E5E7EB] rounded-full overflow-hidden">
            <div className="h-full bg-green-500" style={{ width: `${entryProgress}%` }} />
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-[#E5E7EB] shadow-sm">
          <div className="flex items-center gap-3 mb-2 text-[#6B7280]">
            <Wallet className="w-5 h-5 text-orange-500" />
            <h3 className="font-medium uppercase tracking-wider text-xs">Total Revenue</h3>
          </div>
          <div className="mt-1">
            <span className="text-3xl font-bold font-['Outfit'] text-[#111827]">{formatCurrency(stats.totalRevenue)}</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-[#E5E7EB] shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3 text-[#6B7280]">
              <UserPlus className="w-5 h-5 text-purple-500" />
              <h3 className="font-medium uppercase tracking-wider text-xs">Staff Assigned</h3>
            </div>
            <Link href="/dashboard/staff" className="text-xs text-[#1A7A4A] hover:underline font-medium">Manage</Link>
          </div>
          <div className="space-y-3">
            {stats.staff.length > 0 ? stats.staff.map((s: any) => (
              <div key={s.id} className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                <span className="text-sm font-medium text-[#111827]">{s.name}</span>
              </div>
            )) : (
              <span className="text-sm text-[#6B7280]">No staff assigned yet.</span>
            )}
          </div>
        </div>
      </div>

      {/* Live Scan Log Table */}
      <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-[#E5E7EB] bg-gray-50 flex items-center gap-2">
          <Activity className="w-5 h-5 text-[#6B7280]" />
          <h3 className="font-bold text-[#111827] font-['Outfit'] text-lg">Live Scan Activity</h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-white text-[#6B7280] font-medium uppercase tracking-wider border-b border-[#E5E7EB]">
              <tr>
                <th className="px-6 py-4">Time</th>
                <th className="px-6 py-4">Attendee / Phone</th>
                <th className="px-6 py-4">Scanner Staff</th>
                <th className="px-6 py-4">Result</th>
                <th className="px-6 py-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E7EB] bg-white">
              {stats.recentScans.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-[#6B7280]">
                    No scans recorded yet. Activity will appear here in real-time.
                  </td>
                </tr>
              ) : (
                stats.recentScans.map((scan: any) => {
                  const resultConfig = SCAN_RESULT_LABELS[scan.result] || SCAN_RESULT_LABELS.INVALID;
                  return (
                    <tr key={scan.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 text-[#111827]">
                        {new Date(scan.scannedAt).toLocaleTimeString()}
                      </td>
                      <td className="px-6 py-4 text-[#111827] font-medium">
                        {scan.buyerPhone}
                      </td>
                      <td className="px-6 py-4 text-[#6B7280]">
                        {scan.staffName}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider ${
                          scan.result === "VALID" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                        }`}>
                          {scan.result === "VALID" ? <CheckCircle2 className="w-3.5 h-3.5" /> : null}
                          {resultConfig.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        {scan.result === "VALID" && (
                          <button 
                            onClick={() => handleRefund(scan.ticketId)}
                            className="text-xs font-bold text-red-600 hover:underline"
                          >
                            Refund
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
