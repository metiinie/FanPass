"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { SCAN_RESULT_LABELS } from "@/lib/constants";
import { 
  Users, 
  Ticket, 
  Wallet, 
  Activity, 
  CheckCircle2, 
  UserPlus, 
  StopCircle, 
  RefreshCw, 
  Trash2, 
  Settings,
  ChevronRight,
  AlertCircle
} from "lucide-react";
import Link from "next/link";
import { fetchBackend } from "@/lib/apiClient";
import { toast } from "sonner";

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
    // Poll every 10 seconds for live updates
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
      toast.error(err.message || "Failed to publish event");
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
      toast.error(err.message || "Failed to delete event. Only DRAFT or CANCELLED events can be deleted.");
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1A7A4A]"></div>
        <p className="text-gray-500 font-medium animate-pulse">Loading dashboard...</p>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="bg-red-50 text-red-600 p-8 rounded-3xl border border-red-100 max-w-2xl mx-auto mt-12 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <AlertCircle className="w-6 h-6" />
          <h3 className="text-xl font-bold font-['Outfit']">Error Loading Dashboard</h3>
        </div>
        <p className="text-red-500 mb-6 font-medium">{error || "Event not found"}</p>
        <button 
          onClick={() => router.push("/dashboard")} 
          className="bg-white px-6 py-2.5 rounded-xl border border-red-200 text-red-600 font-bold hover:bg-red-50 transition-colors shadow-sm"
        >
          Back to Dashboard
        </button>
      </div>
    );
  }

  const salesProgress = stats ? Math.min(100, (stats.ticketsSold / stats.maxCapacity) * 100) : 0;
  const entryProgress = (stats && stats.ticketsSold > 0) ? Math.min(100, (stats.attendeesEntered / stats.ticketsSold) * 100) : 0;

  return (
    <div className="space-y-8 pb-20 animate-in fade-in duration-500">
      
      {/* Breadcrumbs & Live Indicator */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-sm text-gray-500 font-medium">
          <Link href="/dashboard" className="hover:text-[#1A7A4A] transition-colors">Dashboard</Link>
          <ChevronRight className="w-4 h-4" />
          <span className="text-gray-900 truncate max-w-[200px]">{event.title}</span>
        </div>
        
        <div className="flex items-center gap-2 text-xs font-bold text-[#1A7A4A] bg-[#E8F5EE] px-3 py-1.5 rounded-full border border-[#D1EADB]">
          <RefreshCw className="w-3.5 h-3.5 animate-spin-slow" />
          <span className="uppercase tracking-wider">Live Monitoring Active</span>
        </div>
      </div>

      {/* Header Section */}
      <div className="bg-white rounded-[2rem] p-8 border border-[#E5E7EB] shadow-sm relative overflow-hidden group">
        {/* Subtle background decoration */}
        <div className="absolute -right-20 -top-20 w-64 h-64 bg-[#1A7A4A]/5 rounded-full blur-3xl group-hover:bg-[#1A7A4A]/10 transition-colors duration-700"></div>
        
        <div className="relative flex flex-col lg:flex-row lg:items-start justify-between gap-8">
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-3xl md:text-4xl font-extrabold text-[#111827] font-['Outfit'] tracking-tight">
                {event.title}
              </h1>
              <span className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest border shadow-sm ${
                event.status === 'ACTIVE' ? 'bg-green-100 text-green-700 border-green-200' :
                event.status === 'DRAFT' ? 'bg-gray-100 text-gray-600 border-gray-200' :
                event.status === 'LIVE' ? 'bg-blue-100 text-blue-700 border-blue-200 animate-pulse' :
                'bg-red-100 text-red-700 border-red-200'
              }`}>
                {event.status}
              </span>
            </div>
            
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-[#6B7280] font-medium">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-[#1A7A4A]"></div>
                <span>{formatDateTime(event.dateTime)}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                <span>{event.venue}</span>
              </div>
              {event.city && (
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                  <span>{event.city}</span>
                </div>
              )}
            </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <Link 
              href={`/dashboard/events/${params.eventId}/edit`} 
              className="px-5 py-2.5 bg-white border border-[#E5E7EB] text-[#111827] rounded-xl text-sm font-bold hover:bg-gray-50 transition-all shadow-sm flex items-center gap-2 active:scale-95"
            >
              <Settings className="w-4 h-4 text-gray-400" /> Edit Event
            </Link>
            
            <Link 
              href={`/dashboard/events/${params.eventId}/approvals`}
              className="flex items-center gap-2 bg-[#1A7A4A] text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-[#14623b] transition-all shadow-md shadow-green-100 relative active:scale-95"
            >
              <CheckCircle2 className="w-4 h-4" /> Review Tickets
              {submissionsStatus?.needsReview > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] font-black w-6 h-6 flex items-center justify-center rounded-full border-2 border-white ring-4 ring-red-500/10">
                  {submissionsStatus.needsReview}
                </span>
              )}
            </Link>

            <div className="w-full sm:w-auto flex gap-2 pt-2 lg:pt-0 lg:border-l lg:pl-6 lg:ml-2 border-gray-100">
              {event.status === "DRAFT" && (
                <button 
                  onClick={handlePublishEvent}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all active:scale-95"
                >
                  <Activity className="w-4 h-4" /> Publish
                </button>
              )}
              
              {event.status === "ACTIVE" && (
                <>
                  <button onClick={() => handleUpdateStatus("SALES_CLOSED")} className="px-4 py-2 bg-orange-50 text-orange-700 rounded-xl text-sm font-bold border border-orange-100 hover:bg-orange-100 transition-colors">
                    Close Sales
                  </button>
                  <button onClick={() => handleUpdateStatus("LIVE")} className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-blue-100 hover:bg-blue-700 transition-colors">
                    Go Live
                  </button>
                </>
              )}

              {event.status === "LIVE" && (
                <button onClick={() => handleUpdateStatus("COMPLETED")} className="px-5 py-2.5 bg-gray-900 text-white rounded-xl text-sm font-bold hover:bg-black transition-colors">
                  Complete Event
                </button>
              )}
              
              {!['COMPLETED', 'CANCELLED'].includes(event.status) && (
                <button 
                  onClick={() => setShowCancelModal(true)}
                  className="p-2.5 text-red-500 hover:bg-red-50 rounded-xl transition-colors border border-transparent hover:border-red-100"
                  title="Cancel Event"
                >
                  <StopCircle className="w-5 h-5" />
                </button>
              )}

              {['DRAFT', 'CANCELLED'].includes(event.status) && (
                <button 
                  onClick={handleDeleteEvent}
                  className="p-2.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors border border-transparent hover:border-red-100"
                  title="Delete Event"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Tickets Sold */}
        <div className="bg-white p-7 rounded-[2rem] border border-[#E5E7EB] shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center">
              <Ticket className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-gray-400 uppercase tracking-widest text-[10px]">Tickets Sold</h3>
          </div>
          <div className="flex items-baseline gap-2 mb-4">
            <span className="text-4xl font-black font-['Outfit'] text-[#111827]">{stats?.ticketsSold || 0}</span>
            <span className="text-gray-400 font-medium">/ {stats?.maxCapacity || 0}</span>
          </div>
          <div className="h-2.5 w-full bg-gray-100 rounded-full overflow-hidden">
            <div 
              className="h-full bg-blue-500 rounded-full transition-all duration-1000 ease-out" 
              style={{ width: `${salesProgress}%` }} 
            />
          </div>
        </div>

        {/* Checked In */}
        <div className="bg-white p-7 rounded-[2rem] border border-[#E5E7EB] shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-green-50 text-green-600 rounded-2xl flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-gray-400 uppercase tracking-widest text-[10px]">Checked In</h3>
          </div>
          <div className="flex items-baseline gap-2 mb-4">
            <span className="text-4xl font-black font-['Outfit'] text-[#111827]">{stats?.attendeesEntered || 0}</span>
            <span className="text-gray-400 font-medium">/ {stats?.ticketsSold || 0}</span>
          </div>
          <div className="h-2.5 w-full bg-gray-100 rounded-full overflow-hidden">
            <div 
              className="h-full bg-green-500 rounded-full transition-all duration-1000 ease-out" 
              style={{ width: `${entryProgress}%` }} 
            />
          </div>
        </div>

        {/* Revenue */}
        <div className="bg-white p-7 rounded-[2rem] border border-[#E5E7EB] shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center">
              <Wallet className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-gray-400 uppercase tracking-widest text-[10px]">Total Revenue</h3>
          </div>
          <div>
            <p className="text-3xl font-black font-['Outfit'] text-[#111827] truncate">
              {stats ? formatCurrency(stats.totalSalesValue) : 'ETB 0.00'}
            </p>
            <p className="text-xs text-green-600 font-bold mt-1">Confirmed payments</p>
          </div>
        </div>

        {/* Pending */}
        <div className="bg-white p-7 rounded-[2rem] border border-[#E5E7EB] shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
          <div className="flex items-center gap-3 mb-6">
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${submissionsStatus?.needsReview > 0 ? 'bg-red-50 text-red-600 animate-pulse' : 'bg-gray-50 text-gray-400'}`}>
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-gray-400 uppercase tracking-widest text-[10px]">Pending Approval</h3>
          </div>
          <div>
            <p className={`text-3xl font-black font-['Outfit'] ${submissionsStatus?.needsReview > 0 ? 'text-red-500' : 'text-[#111827]'}`}>
              {submissionsStatus?.needsReview || 0}
            </p>
            <Link href={`/dashboard/events/${params.eventId}/approvals`} className="text-xs text-gray-400 hover:text-[#1A7A4A] font-bold mt-1 underline decoration-dotted">
              Review Submissions
            </Link>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Activity Log */}
        <div className="lg:col-span-2 bg-white rounded-[2rem] border border-[#E5E7EB] shadow-sm overflow-hidden">
          <div className="px-8 py-6 border-b border-[#E5E7EB] bg-gray-50/50 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Activity className="w-5 h-5 text-gray-400" />
              <h3 className="font-bold text-[#111827] font-['Outfit'] text-lg">Recent Scan Activity</h3>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-white text-gray-400 font-bold uppercase tracking-widest text-[10px] border-b border-[#E5E7EB]">
                <tr>
                  <th className="px-8 py-4">Time</th>
                  <th className="px-8 py-4">Attendee</th>
                  <th className="px-8 py-4">Staff</th>
                  <th className="px-8 py-4">Result</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E7EB] bg-white">
                {stats?.recentScans.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-8 py-20 text-center">
                      <div className="flex flex-col items-center gap-2 text-gray-400">
                        <RefreshCw className="w-8 h-8 opacity-20 mb-2" />
                        <p className="font-medium italic">No scans recorded yet. Activity will appear here live.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  stats?.recentScans.map((scan: any) => {
                    const resultConfig = SCAN_RESULT_LABELS[scan.result] || SCAN_RESULT_LABELS.INVALID;
                    return (
                      <tr key={scan.id} className="hover:bg-gray-50/50 transition-colors group">
                        <td className="px-8 py-4 text-gray-500 font-medium">
                          {new Date(scan.scannedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td className="px-8 py-4 font-bold text-[#111827]">
                          {scan.buyerPhone}
                        </td>
                        <td className="px-8 py-4 text-gray-600 font-medium">
                          {scan.staffName}
                        </td>
                        <td className="px-8 py-4">
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                            scan.result === "VALID" 
                              ? "bg-green-50 text-green-700 border-green-100" 
                              : "bg-red-50 text-red-700 border-red-100"
                          }`}>
                            <div className={`w-1.5 h-1.5 rounded-full ${scan.result === "VALID" ? "bg-green-500" : "bg-red-500"}`}></div>
                            {resultConfig.label}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Column: Staff & Quick Info */}
        <div className="space-y-8">
          <div className="bg-white p-8 rounded-[2rem] border border-[#E5E7EB] shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3 text-gray-400">
                <UserPlus className="w-5 h-5" />
                <h3 className="font-bold uppercase tracking-widest text-[10px]">Assigned Staff</h3>
              </div>
              <Link href="/dashboard/staff" className="text-xs font-bold text-[#1A7A4A] hover:underline">Manage</Link>
            </div>
            
            <div className="space-y-4">
              {stats?.staff && stats.staff.length > 0 ? stats.staff.map((s: any) => (
                <div key={s.id} className="flex items-center justify-between group">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-[10px] font-bold text-gray-500 group-hover:bg-[#1A7A4A]/10 group-hover:text-[#1A7A4A] transition-colors">
                      {s.name.charAt(0)}
                    </div>
                    <span className="text-sm font-bold text-[#111827]">{s.name}</span>
                  </div>
                  <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]"></div>
                </div>
              )) : (
                <div className="text-center py-6 border-2 border-dashed border-gray-100 rounded-2xl">
                  <p className="text-xs text-gray-400 font-medium">No staff assigned yet.</p>
                  <Link href="/dashboard/staff" className="text-[10px] font-black text-[#1A7A4A] uppercase mt-2 inline-block">Add Staff Now</Link>
                </div>
              )}
            </div>
          </div>

          <div className="bg-gray-900 rounded-[2rem] p-8 text-white shadow-xl shadow-gray-200">
            <h4 className="font-bold font-['Outfit'] text-lg mb-4">Event Details</h4>
            <div className="space-y-4 text-sm opacity-80">
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Venue Map</p>
                {event.venueMapUrl ? (
                  <a 
                    href={event.venueMapUrl} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="truncate underline text-[#1A7A4A] font-medium block hover:text-[#14623b] transition-colors"
                  >
                    View Map →
                  </a>
                ) : (
                  <p className="text-gray-500 italic text-xs">No map link provided</p>
                )}
              </div>
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Ticket Price</p>
                <p className="text-lg font-bold text-white">{formatCurrency(event.ticketPrice)}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Cancel Event Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-[2.5rem] p-10 max-w-lg w-full shadow-2xl animate-in zoom-in-95 duration-300">
            <div className="w-16 h-16 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center mb-6">
              <AlertCircle className="w-8 h-8" />
            </div>
            <h3 className="text-2xl font-black font-['Outfit'] mb-3 text-[#111827]">Cancel Event?</h3>
            <p className="text-gray-500 text-sm mb-8 leading-relaxed">
              This action is <span className="text-red-600 font-bold">irreversible</span>. All tickets will be invalidated and attendees will be notified. 
              You are responsible for processing refunds manually.
            </p>
            
            <div className="space-y-5 mb-10">
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Refund Instructions</label>
                <textarea 
                  value={cancelForm.refundPolicy}
                  onChange={(e) => setCancelForm({ ...cancelForm, refundPolicy: e.target.value })}
                  className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl p-4 text-sm min-h-[120px] focus:ring-4 focus:ring-red-500/10 focus:border-red-500 focus:outline-none transition-all resize-none"
                  placeholder="How should fans contact you for refunds?"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Organizer Contact Info</label>
                <input 
                  type="text"
                  value={cancelForm.organizerContact}
                  onChange={(e) => setCancelForm({ ...cancelForm, organizerContact: e.target.value })}
                  className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl px-4 py-3.5 text-sm focus:ring-4 focus:ring-red-500/10 focus:border-red-500 focus:outline-none transition-all"
                  placeholder="e.g. Phone or Telegram handle"
                />
              </div>
            </div>

            <div className="flex gap-4">
              <button 
                onClick={() => setShowCancelModal(false)}
                className="flex-1 py-4 rounded-2xl font-bold text-gray-500 hover:bg-gray-50 transition-colors"
              >
                Go Back
              </button>
              <button 
                onClick={handleCancelEvent}
                className="flex-[1.5] py-4 rounded-2xl font-bold bg-red-600 text-white hover:bg-red-700 shadow-xl shadow-red-200 transition-all active:scale-95"
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
