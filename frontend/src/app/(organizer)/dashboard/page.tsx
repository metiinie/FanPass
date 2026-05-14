import { auth } from "@/server/auth";
import { formatCurrency, formatDate } from "@/lib/utils";
import { EVENT_STATUS_LABELS } from "@/lib/constants";
import { fetchBackend } from "@/lib/apiClient";
import Link from "next/link";
import { Calendar, Ticket, Wallet, ChevronRight, Plus, Edit } from "lucide-react";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "ORGANIZER") {
    redirect("/login");
  }

  let events = [];
  try {
    events = await fetchBackend("/events");
  } catch (error) {
    console.error("Dashboard: Error fetching events", error);
  }

  const totalEvents = events.length;
  const totalTicketsSold = events.reduce((sum: number, e: any) => sum + e.ticketsSold, 0);
  const totalTicketValue = events.reduce((sum: number, e: any) => sum + (e.ticketsSold * e.ticketPrice), 0);

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-[#111827] font-['Outfit'] tracking-tight">Dashboard</h2>
          <p className="text-[#6B7280] mt-1">Welcome back, {session.user.name}</p>
        </div>
        <Link 
          href="/dashboard/events/new"
          className="flex items-center gap-2 bg-[#1A7A4A] text-white px-5 py-2.5 rounded-xl font-medium hover:bg-[#0F4D2E] transition-colors shadow-sm"
        >
          <Plus className="w-5 h-5" />
          <span className="hidden sm:inline">Create Event</span>
        </Link>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-[#E5E7EB] shadow-sm flex items-start gap-4">
          <div className="bg-blue-50 p-3 rounded-xl text-blue-600">
            <Calendar className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-[#6B7280] uppercase tracking-wider mb-1">Total Events</p>
            <p className="text-3xl font-bold font-['Outfit'] text-[#111827]">{totalEvents}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-[#E5E7EB] shadow-sm flex items-start gap-4">
          <div className="bg-green-50 p-3 rounded-xl text-green-600">
            <Ticket className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-[#6B7280] uppercase tracking-wider mb-1">Tickets Sold</p>
            <p className="text-3xl font-bold font-['Outfit'] text-[#111827]">{totalTicketsSold.toLocaleString()}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-[#E5E7EB] shadow-sm flex items-start gap-4">
          <div className="bg-orange-50 p-3 rounded-xl text-orange-600">
            <Wallet className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-[#6B7280] uppercase tracking-wider mb-1">Total Ticket Value</p>
            <p className="text-3xl font-bold font-['Outfit'] text-[#111827]">{formatCurrency(totalTicketValue)}</p>
          </div>
        </div>
      </div>

      {/* Recent Events List */}
      <div>
        <h3 className="text-xl font-bold text-[#111827] font-['Outfit'] mb-4">Recent Events</h3>
        {events.length === 0 ? (
          <div className="bg-white p-12 rounded-2xl border border-[#E5E7EB] border-dashed text-center">
            <div className="bg-gray-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400">
              <Calendar className="w-8 h-8" />
            </div>
            <h4 className="text-lg font-medium text-[#111827] mb-2">No events yet</h4>
            <p className="text-[#6B7280] mb-6 max-w-sm mx-auto">Create your first event to start selling tickets and managing entry.</p>
            <Link 
              href="/dashboard/events/new"
              className="inline-flex items-center justify-center px-6 py-3 bg-[#1A7A4A] text-white rounded-xl font-medium hover:bg-[#0F4D2E] transition-colors"
            >
              Create Event
            </Link>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm overflow-hidden flex flex-col divide-y divide-[#E5E7EB]">
            {events.slice(0, 5).map((event: any) => {
              const statusConfig = EVENT_STATUS_LABELS[event.status];
              const progress = Math.min(100, (event.ticketsSold / event.maxCapacity) * 100);

              return (
                <div 
                  key={event.id}
                  className="p-6 hover:bg-gray-50 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <Link href={`/dashboard/events/${event.id}`} className="flex-1 group">
                    <div className="flex items-center gap-3 mb-1">
                      <h4 className="font-bold text-[#111827] text-lg font-['Outfit'] truncate group-hover:text-[#1A7A4A] transition-colors">{event.title}</h4>
                      <span className={`text-xs font-semibold px-2 py-1 rounded-md uppercase tracking-wider ${statusConfig?.color} bg-gray-50 border border-gray-100`}>
                        {statusConfig?.label || event.status}
                      </span>
                    </div>
                    <p className="text-[#6B7280] text-sm flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      {formatDate(event.dateTime)} • {event.venue}
                    </p>
                  </Link>

                  <div className="flex items-center justify-between sm:justify-end gap-6 sm:w-64">
                    <div className="flex-1 max-w-[120px]">
                      <div className="flex justify-between text-xs mb-1.5 font-medium">
                        <span className="text-[#111827]">{event.ticketsSold} sold</span>
                        <span className="text-[#6B7280]">{event.maxCapacity}</span>
                      </div>
                      <div className="h-1.5 w-full bg-[#E5E7EB] rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-[#1A7A4A] rounded-full" 
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Link 
                        href={`/dashboard/events/${event.id}/edit`}
                        className="p-2 text-gray-400 hover:text-[#1A7A4A] transition-colors"
                      >
                        <Edit className="w-4 h-4" />
                      </Link>
                      <Link href={`/dashboard/events/${event.id}`}>
                        <ChevronRight className="w-5 h-5 text-[#9CA3AF] hover:text-[#111827] transition-colors" />
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
            
            {events.length > 5 && (
              <div className="p-4 text-center bg-gray-50">
                <button className="text-sm font-medium text-[#1A7A4A] hover:underline">View all events</button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
