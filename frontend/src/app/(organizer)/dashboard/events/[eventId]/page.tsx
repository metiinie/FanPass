"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { SCAN_RESULT_LABELS } from "@/lib/constants";
import { Users, Ticket, Wallet, Activity, CheckCircle2, UserPlus, StopCircle, RefreshCw, Trash2, Edit } from "lucide-react";
import Link from "next/link";
import { fetchBackend } from "@/lib/apiClient";
import { toast } from "sonner";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001";

export default function EventDashboardPage({ params }: { params: { eventId: string } }) {
  const router = useRouter();
  const [event, setEvent] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [submissionsStatus, setSubmissionsStatus] = useState<any>(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelForm, setCancelForm] = useState({
    refundPolicy: "Full refund will be provided. Please contact the organizer with your ticket ID and payment receipt.",
    organizerContact: ""
  });

  const fetchEventData = async () => {
    try {
      const [eventData, statsData, subStats] = await Promise.all([
        fetchBackend(`/events/${params.eventId}`),
        fetchBackend(`/events/${params.eventId}/stats`),
        fetchBackend(`/tickets/events/${params.eventId}/submission-stats`).catch(() => ({ needsReview: 0 })),
      ]);

      setEvent(eventData);
      setStats(statsData);
      setSubmissionsStatus(subStats);
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

  const handleUpdateStatus = async (status: string) => {
    if (!confirm(`Are you sure you want to change event status to ${status}?`)) {
      return;
    }

    try {
      await fetchBackend(`/events/${params.eventId}`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      toast.success(`Event status updated to ${status}`);
      fetchEventData();
    } catch (err: any) {
      toast.error(err.message || "Failed to update status");
    }
  };

  const handleCancelEvent = async () => {
    if (!cancelForm.organizerContact) {
      toast.error("Please provide organizer contact info for refunds.");
      return;
    }

    try {
      await fetchBackend(`/events/${params.eventId}/cancel`, {
        method: "POST",
        body: JSON.stringify(cancelForm),
      });
      toast.success("Event cancelled successfully. Attendees notified.");
      setShowCancelModal(false);
      fetchEventData();
    } catch (err: any) {
      toast.error(err.message || "Failed to cancel event");
    }
  };

  const handlePublishEvent = async () => {
    if (!confirm("Are you sure you want to publish this event? It will become visible to the public immediately.")) {
      return;
    }

    try {
      await fetchBackend(`/events/${params.eventId}`, {
        method: "PATCH",
        body: JSON.stringify({ status: "ACTIVE" }),
      });
      toast.success("Event published successfully!");
      fetchEventData();
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Failed to publish event");
    }
  };

  const handleDeleteEvent = async () => {
    if (!confirm("Are you sure you want to delete this event? This action cannot be undone.")) {
      return;
    }

    try {
      await fetchBackend(`/events/${params.eventId}`, {
        method: "DELETE",
      });
      router.push("/dashboard");
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Failed to delete event. Only DRAFT or CANCELLED events can be deleted.");
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
            href={`/dashboard/events/${params.eventId}/edit`} 
            className="px-4 py-2 bg-white border border-[#E5E7EB] text-[#111827] rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors shadow-sm flex items-center gap-2"
          >
            <Settings className="w-4 h-4" /> Edit Event
          </Link>
          <Link 
            href={`/dashboard/events/${params.eventId}/approvals`}
            className="flex items-center gap-2 bg-[#1A7A4A] text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-[#14623b] transition-colors shadow-sm relative"
          >
            <CheckCircle2 className="w-4 h-4" /> Review Submissions
            {submissionsStatus?.needsReview > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full border-2 border-white">
                {submissionsStatus.needsReview}
              </span>
            )}
          </Link>
          <Link 
            href={`/events/${event.slug}`} 
            target="_blank"
            className="px-4 py-2 bg-white border border-[#E5E7EB] text-[#111827] rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors shadow-sm"
          >
            View Public Page
          </Link>
          <div className="flex flex-wrap gap-3">
          {event.status === "DRAFT" && (
            <button onClick={() => handleUpdateStatus("ACTIVE")} className="flex items-center gap-2 px-4 py-2 bg-[#1A7A4A] text-white rounded-xl text-sm font-bold shadow-sm hover:bg-[#14623b] transition-colors">
              <Activity className="w-4 h-4" />
              Publish Event
            </button>
          )}
          {event.status === "ACTIVE" && (
            <>
              <button onClick={() => handleUpdateStatus("SALES_CLOSED")} className="flex items-center gap-2 px-4 py-2 bg-orange-100 text-orange-700 rounded-xl text-sm font-bold hover:bg-orange-200 transition-colors">
                <StopCircle className="w-4 h-4" />
                Close Sales
              </button>
              <button onClick={() => handleUpdateStatus("LIVE")} className="flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-xl text-sm font-bold hover:bg-blue-200 transition-colors">
                <Activity className="w-4 h-4" />
                Mark Live
              </button>
            </>
          )}
          {event.status === "LIVE" && (
             <button onClick={() => handleUpdateStatus("COMPLETED")} className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-xl text-sm font-bold hover:bg-gray-200 transition-colors">
                <CheckCircle2 className="w-4 h-4" />
                Mark Completed
             </button>
          )}
          
          {!['COMPLETED', 'CANCELLED'].includes(event.status) && (
            <button onClick={() => setShowCancelModal(true)} className="flex items-center gap-2 px-4 py-2 bg-red-100 text-red-700 rounded-xl text-sm font-bold hover:bg-red-200 transition-colors">
              <StopCircle className="w-4 h-4" />
              Cancel Event
            </button>
          )}

          {['DRAFT', 'CANCELLED'].includes(event.status) && (
            <button onClick={handleDeleteEvent} className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-xl text-sm font-bold hover:bg-red-100 transition-colors">
              <Trash2 className="w-4 h-4" />
              Delete
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

        <div className="bg-white p-6 rounded-2xl border border-[#E5E7EB] shadow-sm flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-[#6B7280] mb-1">Total Ticket Value</p>
            <p className="text-3xl font-bold font-['Outfit'] text-[#111827]">{formatCurrency(stats.totalSalesValue)}</p>
          </div>
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
            <Wallet className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-[#E5E7EB] shadow-sm flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-[#6B7280] mb-1">Pending Reviews</p>
            <p className={`text-3xl font-bold font-['Outfit'] ${submissionsStatus?.needsReview > 0 ? 'text-red-500' : 'text-[#111827]'}`}>
              {submissionsStatus?.needsReview || 0}
            </p>
          </div>
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${submissionsStatus?.needsReview > 0 ? 'bg-red-50 text-red-600 animate-pulse' : 'bg-gray-50 text-gray-400'}`}>
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Staff and Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 bg-white p-6 rounded-2xl border border-[#E5E7EB] shadow-sm">
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
                        <span className="text-xs text-gray-400">No action</span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
      {/* Cancel Event Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-8 max-w-lg w-full shadow-2xl animate-in zoom-in-95 duration-200">
            <h3 className="text-2xl font-bold font-['Outfit'] mb-2 text-red-600">Cancel Event</h3>
            <p className="text-gray-500 text-sm mb-6">
              This will immediately invalidate all issued tickets and notify attendees via SMS. 
              <strong> You are responsible for manual refunds.</strong>
            </p>
            
            <div className="space-y-4 mb-8">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5">Refund Policy / Instructions</label>
                <textarea 
                  value={cancelForm.refundPolicy}
                  onChange={(e) => setCancelForm({ ...cancelForm, refundPolicy: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl p-4 text-sm min-h-[100px] focus:ring-2 focus:ring-red-500 focus:outline-none"
                  placeholder="How will you refund the fans?"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5">Organizer Contact Info</label>
                <input 
                  type="text"
                  value={cancelForm.organizerContact}
                  onChange={(e) => setCancelForm({ ...cancelForm, organizerContact: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl p-4 text-sm focus:ring-2 focus:ring-red-500 focus:outline-none"
                  placeholder="e.g. Phone number or Telegram handle"
                />
              </div>
            </div>

            <div className="flex gap-4">
              <button 
                onClick={() => setShowCancelModal(false)}
                className="flex-1 py-3.5 rounded-xl font-bold text-gray-600 border-2 border-gray-100 hover:bg-gray-50"
              >
                Go Back
              </button>
              <button 
                onClick={handleCancelEvent}
                className="flex-[2] py-3.5 rounded-xl font-bold bg-red-600 text-white hover:bg-red-700 shadow-lg shadow-red-200 transition-all"
              >
                Confirm Cancellation
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
