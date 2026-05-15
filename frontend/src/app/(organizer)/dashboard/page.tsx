import { auth } from "@/server/auth";
import { formatCurrency, formatDate } from "@/lib/utils";
import { EVENT_STATUS_LABELS } from "@/lib/constants";
import { fetchBackend } from "@/lib/apiClient";
import Link from "next/link";
import { Calendar, Ticket, Wallet, ChevronRight, Plus, Edit } from "lucide-react";
import { redirect } from "next/navigation";
import { InfluencerEvent } from "@/types";

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
  const totalTicketsSold = events.reduce((sum: number, e: InfluencerEvent) => sum + e.ticketsSold, 0);
  const totalTicketValue = events.reduce((sum: number, e: InfluencerEvent) => sum + (e.ticketsSold * e.ticketPrice), 0);

  return (
    <div className="space-y-12 animate-in fade-in duration-500 font-outfit text-white">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
        <div>
          <h2 className="text-4xl font-black text-white tracking-tighter">Dashboard</h2>
          <p className="text-gray-400 font-medium mt-1">Welcome back, {session.user.name}</p>
        </div>
        <Link 
          href="/dashboard/events/new"
          className="flex items-center gap-2 bg-brand-neon text-bg px-6 py-3.5 rounded-2xl font-bold hover:shadow-glow-md transition-all active:scale-95 group"
        >
          <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
          <span>Create Event</span>
        </Link>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="bg-brand-surface p-8 rounded-[2.5rem] border border-white/5 shadow-2xl flex items-start gap-6 group hover:border-brand-neon/20 transition-colors">
          <div className="bg-blue-500/10 p-4 rounded-2xl text-blue-400 group-hover:scale-110 transition-transform">
            <Calendar className="w-8 h-8" />
          </div>
          <div>
            <p className="text-xs font-black text-gray-500 uppercase tracking-widest mb-2">Total Events</p>
            <p className="text-4xl font-bold text-white">{totalEvents}</p>
          </div>
        </div>

        <div className="bg-brand-surface p-8 rounded-[2.5rem] border border-white/5 shadow-2xl flex items-start gap-6 group hover:border-brand-neon/20 transition-colors">
          <div className="bg-brand-neon/10 p-4 rounded-2xl text-brand-neon group-hover:scale-110 transition-transform">
            <Ticket className="w-8 h-8" />
          </div>
          <div>
            <p className="text-xs font-black text-gray-500 uppercase tracking-widest mb-2">Tickets Sold</p>
            <p className="text-4xl font-bold text-white">{totalTicketsSold.toLocaleString()}</p>
          </div>
        </div>

        <div className="bg-brand-surface p-8 rounded-[2.5rem] border border-white/5 shadow-2xl flex items-start gap-6 group hover:border-brand-neon/20 transition-colors">
          <div className="bg-orange-500/10 p-4 rounded-2xl text-orange-400 group-hover:scale-110 transition-transform">
            <Wallet className="w-8 h-8" />
          </div>
          <div>
            <p className="text-xs font-black text-gray-500 uppercase tracking-widest mb-2">Total Value</p>
            <p className="text-4xl font-bold text-white">{formatCurrency(totalTicketValue)}</p>
          </div>
        </div>
      </div>

      {/* Recent Events List */}
      <div>
        <h3 className="text-2xl font-black text-white tracking-tighter mb-6">Recent Events</h3>
        {events.length === 0 ? (
          <div className="bg-brand-surface p-16 rounded-[2.5rem] border-2 border-white/5 border-dashed text-center flex flex-col items-center">
            <div className="bg-white/5 w-20 h-20 rounded-full flex items-center justify-center mb-6 text-gray-500">
              <Calendar className="w-10 h-10" />
            </div>
            <h4 className="text-2xl font-bold text-white mb-2">No events yet</h4>
            <p className="text-gray-400 mb-8 max-w-sm font-medium">Create your first event to start selling tickets and managing entry.</p>
            <Link 
              href="/dashboard/events/new"
              className="inline-flex items-center justify-center px-8 py-4 bg-brand-neon text-bg rounded-2xl font-bold hover:shadow-glow-md transition-all active:scale-95"
            >
              Create Your First Event
            </Link>
          </div>
        ) : (
          <div className="bg-brand-surface rounded-[2.5rem] border border-white/5 shadow-2xl overflow-hidden flex flex-col divide-y divide-white/5">
            {events.slice(0, 5).map((event: InfluencerEvent) => {
              const statusConfig = EVENT_STATUS_LABELS[event.status];
              const progress = Math.min(100, (event.ticketsSold / event.maxCapacity) * 100);

              return (
                <div 
                  key={event.id}
                  className="p-8 hover:bg-white/[0.02] transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-6"
                >
                  <Link href={`/dashboard/events/${event.id}`} className="flex-1 group">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="font-bold text-white text-xl tracking-tight group-hover:text-brand-neon transition-colors truncate max-w-[300px]">{event.title}</h4>
                      <span className={`text-[10px] font-black px-2.5 py-1 rounded-lg uppercase tracking-wider ${statusConfig?.color} bg-white/5 border border-white/5`}>
                        {statusConfig?.label || event.status}
                      </span>
                    </div>
                    <div className="text-gray-500 text-sm flex items-center gap-3 font-medium">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-4 h-4 text-brand-neon" />
                        {formatDate(event.dateTime)}
                      </div>
                      <span className="w-1 h-1 rounded-full bg-white/10" />
                      <span>{event.venue}</span>
                    </div>
                  </Link>

                  <div className="flex items-center justify-between sm:justify-end gap-10 sm:w-80">
                    <div className="flex-1 max-w-[160px]">
                      <div className="flex justify-between text-[10px] mb-2 font-black uppercase tracking-widest">
                        <span className="text-brand-neon">{event.ticketsSold} SOLD</span>
                        <span className="text-gray-600">{event.maxCapacity} MAX</span>
                      </div>
                      <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-brand-neon rounded-full shadow-glow-sm" 
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      <Link 
                        href={`/dashboard/events/${event.id}/edit`}
                        className="p-2.5 rounded-xl bg-white/5 text-gray-400 hover:text-brand-neon hover:bg-brand-neon/10 transition-all border border-transparent hover:border-brand-neon/20"
                      >
                        <Edit className="w-4 h-4" />
                      </Link>
                      <Link 
                        href={`/dashboard/events/${event.id}`}
                        className="p-2.5 rounded-xl bg-white/5 text-gray-400 hover:text-white transition-all border border-transparent hover:border-white/10"
                      >
                        <ChevronRight className="w-5 h-5" />
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
            
            {events.length > 5 && (
              <div className="p-6 text-center bg-white/[0.01]">
                <button className="text-sm font-black text-brand-neon hover:underline tracking-widest uppercase">View all events</button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
