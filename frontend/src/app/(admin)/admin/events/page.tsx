"use client";

import { useEffect, useState } from "react";
import { fetchBackend } from "@/lib/apiClient";
import { format } from "date-fns";
import { Calendar, Search, MapPin, Ticket, ExternalLink, User } from "lucide-react";
import { toast } from "sonner";
import { EVENT_STATUS_LABELS } from "@/lib/constants";
import Link from "next/link";

export default function AllEventsPage() {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    try {
      const data = await fetchBackend("/admin/events");
      setEvents(data);
    } catch (error) {
      toast.error("Failed to load events");
    } finally {
      setLoading(false);
    }
  };

  const filteredEvents = events.filter(e => 
    e.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    e.influencer.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold text-[#111827] font-['Outfit'] tracking-tight">Platform Events</h2>
          <p className="text-[#6B7280] mt-1">Global view of all ticketed events</p>
        </div>
        
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF]" />
          <input 
            type="text"
            placeholder="Search title or owner..."
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-[#E5E7EB] focus:ring-2 focus:ring-[#1A7A4A] focus:border-transparent outline-none transition-all text-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {loading ? (
          <div className="p-12 text-center text-[#6B7280]">Loading events...</div>
        ) : filteredEvents.length === 0 ? (
          <div className="p-12 text-center text-[#6B7280]">No events found</div>
        ) : (
          filteredEvents.map((event) => {
            const statusConfig = EVENT_STATUS_LABELS[event.status];
            
            return (
              <div key={event.id} className="bg-white p-6 rounded-2xl border border-[#E5E7EB] shadow-sm hover:shadow-md transition-shadow flex flex-col md:flex-row gap-6">
                <div className="flex-1 space-y-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider ${statusConfig?.color} border border-current opacity-70`}>
                          {statusConfig?.label || event.status}
                        </span>
                        <h3 className="text-xl font-bold text-[#111827] font-['Outfit']">{event.title}</h3>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-[#6B7280]">
                        <span className="flex items-center gap-1.5"><Calendar className="w-4 h-4" /> {format(new Date(event.dateTime), 'MMM d, p')}</span>
                        <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4" /> {event.venue}</span>
                      </div>
                    </div>
                    <Link 
                      href={`/events/${event.slug}`} 
                      target="_blank"
                      className="p-2 text-[#6B7280] hover:text-[#1A7A4A] transition-colors"
                    >
                      <ExternalLink className="w-5 h-5" />
                    </Link>
                  </div>

                  <div className="flex flex-wrap gap-4 pt-2">
                    <div className="bg-[#F8FAF9] px-3 py-2 rounded-xl flex items-center gap-2">
                      <User className="w-4 h-4 text-[#1A7A4A]" />
                      <div className="text-xs">
                        <p className="text-[#6B7280]">Organizer</p>
                        <p className="font-bold text-[#111827]">{event.influencer.name}</p>
                      </div>
                    </div>
                    <div className="bg-[#F8FAF9] px-3 py-2 rounded-xl flex items-center gap-2">
                      <Ticket className="w-4 h-4 text-[#1A7A4A]" />
                      <div className="text-xs">
                        <p className="text-[#6B7280]">Sales</p>
                        <p className="font-bold text-[#111827]">{event.ticketsSold} / {event.maxCapacity}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
