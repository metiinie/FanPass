import Link from "next/link";
import { formatCurrency, formatDate } from "@/lib/utils";
import { fetchBackend } from "@/lib/apiClient";
import { Ticket, Calendar, MapPin, ArrowRight, ShieldCheck, Zap } from "lucide-react";

export const revalidate = 60; // Revalidate every minute

export default async function Home() {
  let activeEvents = [];
  try {
    activeEvents = await fetchBackend("/events/public", { requireAuth: false });
  } catch (error) {
    console.error("Failed to fetch events:", error);
  }

  return (
    <div className="min-h-screen bg-[#F8FAF9]">
      {/* Hero Section */}
      <section className="relative bg-[#0F1A14] pt-20 pb-32 overflow-hidden">
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-[#1A7A4A] via-transparent to-transparent" />
        
        <div className="max-w-7xl mx-auto px-6 relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-[#1A7A4A] text-sm font-medium mb-8 backdrop-blur-sm">
            <Zap className="w-4 h-4 fill-current" />
            <span>Digital Ticketing for Ethiopia</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold text-white font-['Outfit'] tracking-tight leading-[1.1] mb-6">
            Entry simplified.<br />
            <span className="text-[#1A7A4A]">Memories preserved.</span>
          </h1>
          
          <p className="text-lg text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            The fastest way to buy and sell tickets for watch parties, concerts, and live events. 
            Automated payments, instant QR delivery, and secure venue entry.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link 
              href="#events" 
              className="w-full sm:w-auto px-8 py-4 bg-[#1A7A4A] text-white rounded-2xl font-bold tracking-wide hover:bg-[#0F4D2E] transition-all shadow-[0_8px_30px_rgb(26,122,74,0.3)]"
            >
              Browse Events
            </Link>
            <Link 
              href="/dashboard" 
              className="w-full sm:w-auto px-8 py-4 bg-white/5 text-white border border-white/10 rounded-2xl font-bold tracking-wide hover:bg-white/10 transition-all backdrop-blur-sm"
            >
              Organizer Portal
            </Link>
          </div>
        </div>
      </section>

      {/* Trust Badges */}
      <div className="max-w-4xl mx-auto px-6 -mt-10 relative z-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-5 rounded-2xl shadow-xl border border-gray-100 flex items-center gap-4">
            <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center text-[#1A7A4A]">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <p className="font-bold text-[#111827]">Secure Payments</p>
              <p className="text-xs text-gray-500">Telebirr & Bank integration</p>
            </div>
          </div>
          <div className="bg-white p-5 rounded-2xl shadow-xl border border-gray-100 flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
              <Zap className="w-6 h-6" />
            </div>
            <div>
              <p className="font-bold text-[#111827]">Instant Tickets</p>
              <p className="text-xs text-gray-500">Receive via SMS & QR</p>
            </div>
          </div>
          <div className="bg-white p-5 rounded-2xl shadow-xl border border-gray-100 flex items-center gap-4">
            <div className="w-12 h-12 bg-orange-50 rounded-xl flex items-center justify-center text-orange-600">
              <Ticket className="w-6 h-6" />
            </div>
            <div>
              <p className="font-bold text-[#111827]">Easy Check-in</p>
              <p className="text-xs text-gray-500">Fast entry validation</p>
            </div>
          </div>
        </div>
      </div>

      {/* Events Section */}
      <section id="events" className="max-w-7xl mx-auto px-6 py-24">
        <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-4">
          <div>
            <h2 className="text-3xl font-bold text-[#111827] font-['Outfit'] tracking-tight">Upcoming Events</h2>
            <p className="text-gray-500 mt-2">Discover the best watch parties and live experiences.</p>
          </div>
          <Link href="/events" className="text-[#1A7A4A] font-semibold flex items-center gap-2 hover:underline">
            View all <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {activeEvents.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {activeEvents.map((event: any) => (
              <Link 
                key={event.id}
                href={`/events/${event.slug}`}
                className="group bg-white rounded-[2rem] border border-gray-100 overflow-hidden hover:shadow-2xl transition-all duration-500"
              >
                <div className="aspect-[16/9] bg-gray-100 relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="absolute bottom-4 left-6">
                    <span className="px-3 py-1 bg-[#1A7A4A] text-white text-xs font-bold rounded-lg uppercase tracking-wider">
                      {formatCurrency(event.ticketPrice, event.currency)}
                    </span>
                  </div>
                </div>
                
                <div className="p-8">
                  <h3 className="text-xl font-bold text-[#111827] font-['Outfit'] mb-4 group-hover:text-[#1A7A4A] transition-colors">
                    {event.title}
                  </h3>
                  
                  <div className="space-y-3 mb-6">
                    <div className="flex items-center gap-3 text-sm text-gray-500">
                      <Calendar className="w-4 h-4 text-[#1A7A4A]" />
                      <span>{formatDate(event.dateTime)}</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-gray-500">
                      <MapPin className="w-4 h-4 text-[#1A7A4A]" />
                      <span className="truncate">{event.venue}</span>
                    </div>
                  </div>
                  
                  <div className="pt-6 border-t border-gray-50 flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-400">
                      {event.maxCapacity - event.ticketsSold} tickets left
                    </span>
                    <span className="text-[#1A7A4A] font-bold inline-flex items-center gap-1 group-hover:gap-2 transition-all">
                      Get Ticket <ArrowRight className="w-4 h-4" />
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="bg-white py-20 px-6 rounded-[3rem] border border-dashed border-gray-200 text-center">
            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <Calendar className="w-10 h-10 text-gray-300" />
            </div>
            <h3 className="text-xl font-bold text-[#111827] mb-2">No active events yet</h3>
            <p className="text-gray-500 max-w-sm mx-auto">
              We're getting ready for some amazing experiences. Check back soon or create your own event!
            </p>
            <Link 
              href="/dashboard/events/new"
              className="inline-block mt-8 text-[#1A7A4A] font-bold hover:underline"
            >
              Start Organizing →
            </Link>
          </div>
        )}
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-100 py-12 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8 text-center md:text-left">
          <div>
            <h2 className="text-2xl font-bold text-[#111827] font-['Outfit']">FanPass</h2>
            <p className="text-gray-500 text-sm mt-1">© 2026 FanPass Digital. All rights reserved.</p>
          </div>
          <div className="flex items-center gap-8 text-sm font-medium text-gray-500">
            <Link href="/dashboard" className="hover:text-[#1A7A4A]">For Organizers</Link>
            <Link href="/login" className="hover:text-[#1A7A4A]">Staff Login</Link>
            <Link href="/terms" className="hover:text-[#1A7A4A]">Terms</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
