import { fetchBackend } from "@/lib/apiClient";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Calendar, MapPin, ChevronRight, Search } from "lucide-react";
import Link from "next/link";

export const metadata = {
  title: "Explore Events | FanPass",
  description: "Discover the best concerts, festivals, and sports events happening near you.",
};

export const revalidate = 60; // Cache for 1 minute

export default async function EventsListPage() {
  let events = [];
  try {
    events = await fetchBackend("/events/public", { requireAuth: false });
  } catch (error) {
    console.error("Failed to fetch events:", error);
  }

  return (
    <div className="min-h-screen bg-[#F8FAF9] pb-20">
      {/* Header */}
      <div className="bg-[#0F1A14] pt-24 pb-16 px-4">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold text-white font-['Outfit'] mb-4">
            Discover Events
          </h1>
          <p className="text-gray-400 text-lg max-w-2xl">
            Join thousands of fans at the most exciting events. Fast, secure, and purely digital.
          </p>
        </div>
      </div>

      <main className="max-w-6xl mx-auto px-4 -mt-8">
        {/* Events Grid */}
        {events.length === 0 ? (
          <div className="bg-white rounded-3xl p-16 text-center shadow-sm border border-[#E5E7EB]">
            <div className="bg-gray-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
              <Search className="w-10 h-10 text-gray-300" />
            </div>
            <h2 className="text-2xl font-semibold text-[#111827] mb-2">No events found</h2>
            <p className="text-[#6B7280]">Check back later for new upcoming events.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {events.map((event: any) => (
              <Link 
                key={event.id}
                href={`/events/${event.slug}`}
                className="group bg-white rounded-3xl overflow-hidden border border-[#E5E7EB] hover:border-[#1A7A4A] transition-all hover:shadow-xl flex flex-col"
              >
                <div className="h-48 bg-[#0F1A14] relative flex items-center justify-center overflow-hidden">
                   <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-[#1A7A4A] to-transparent group-hover:scale-110 transition-transform duration-500" />
                   <span className="text-white/20 text-6xl font-bold font-['Outfit'] tracking-tighter select-none">
                     {event.title.split(' ')[0]}
                   </span>
                </div>
                
                <div className="p-6 flex-1 flex flex-col">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-xl font-bold text-[#111827] font-['Outfit'] leading-tight group-hover:text-[#1A7A4A] transition-colors">
                      {event.title}
                    </h3>
                  </div>

                  <div className="space-y-3 mb-6">
                    <div className="flex items-center text-[#6B7280] text-sm">
                      <Calendar className="w-4 h-4 mr-2 text-[#1A7A4A]" />
                      {formatDate(event.dateTime)}
                    </div>
                    <div className="flex items-center text-[#6B7280] text-sm">
                      <MapPin className="w-4 h-4 mr-2 text-[#1A7A4A]" />
                      {event.venue}
                    </div>
                  </div>

                  <div className="mt-auto pt-4 border-t border-gray-50 flex items-center justify-between">
                    <div>
                      <p className="text-[10px] text-[#6B7280] uppercase tracking-wider font-bold mb-0.5">Tickets from</p>
                      <p className="text-xl font-bold text-[#111827]">
                        {formatCurrency(event.ticketPrice, event.currency)}
                      </p>
                    </div>
                    <div className="bg-[#F3F4F6] group-hover:bg-[#1A7A4A] group-hover:text-white p-2 rounded-xl transition-colors">
                      <ChevronRight className="w-5 h-5" />
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
