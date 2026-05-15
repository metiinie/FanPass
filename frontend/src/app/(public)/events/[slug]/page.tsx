import { notFound } from "next/navigation";
import Link from "next/link";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { EVENT_STATUS_LABELS } from "@/lib/constants";
import { fetchBackend } from "@/lib/apiClient";
import {
  MapPin,
  Calendar,
  Users,
  Info,
  BadgeCheck,
  Trophy,
  Clock,
  Ticket,
  ChevronLeft,
  ArrowRight
} from "lucide-react";

export const revalidate = 30;

export default async function EventPage({ params }: { params: { slug: string } }) {
  let event: any = null;
  try {
    event = await fetchBackend(`/events/public/${params.slug}`, { requireAuth: false });
  } catch (error) {
    notFound();
  }

  const isSoldOut = event.ticketsSold >= event.maxCapacity || event.status === "SOLD_OUT";
  const isClosed = event.status === "CLOSED";
  const isCancelled = event.status === "CANCELLED";
  const availableSeats = Math.max(0, event.maxCapacity - event.ticketsSold);
  const inf = event.influencer;

  return (
    <div className="min-h-screen bg-bg text-white pb-24 md:pb-12">
      {/* Navigation Bar (Overlay) */}
      <div className="fixed top-0 left-0 right-0 z-50 p-4 pointer-events-none">
        <div className="max-w-6xl mx-auto flex">
          <Link href="/" className="pointer-events-auto bg-black/50 backdrop-blur-md text-white p-2.5 rounded-full border border-white/10 hover:bg-white/20 transition-all">
            <ChevronLeft className="w-6 h-6" />
          </Link>
        </div>
      </div>

      {/* Hero Background */}
      <div className="relative h-[50vh] md:h-[60vh] min-h-[400px] w-full">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img 
          src={event.coverImage || "https://images.unsplash.com/photo-1518605368461-1ee7c511d51c?q=80&w=2000&auto=format&fit=crop"} 
          alt={event.title} 
          className="absolute inset-0 w-full h-full object-cover" 
        />
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-bg via-bg/80 to-black/30" />
        {/* Colorful Glow Overlay based on team color */}
        <div 
          className="absolute inset-0 opacity-40 mix-blend-color" 
          style={{ backgroundColor: inf?.teamColor || "var(--primary)" }}
        />

        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-12 max-w-6xl mx-auto z-10 animate-slide-up">
          {event.competition && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/50 backdrop-blur-md border border-white/10 text-white/90 text-xs font-bold uppercase tracking-wider mb-4 shadow-xl">
              <Trophy className="w-3.5 h-3.5 text-brand-neon" />
              {event.competition}
            </div>
          )}

          {event.homeTeam && event.awayTeam ? (
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white font-outfit leading-tight mb-3">
              {event.homeTeam}
              <span className="text-white/30 mx-4 font-light">vs</span>
              {event.awayTeam}
            </h1>
          ) : (
            <h1 className="text-4xl md:text-6xl font-bold text-white font-outfit leading-tight mb-3">
              {event.title}
            </h1>
          )}

          {event.matchKickoff && (
            <p className="text-white/70 text-lg flex items-center gap-2 font-medium">
              <Clock className="w-5 h-5 text-brand-neon" />
              Kick-off: {formatDateTime(event.matchKickoff)}
            </p>
          )}
        </div>
      </div>

      {/* Main Content Area - Split Screen on Desktop */}
      <div className="max-w-6xl mx-auto px-6 -mt-4 relative z-20">
        <div className="flex flex-col md:flex-row gap-8 lg:gap-12 items-start">
          
          {/* Left Column - Details (Bento Grid) */}
          <div className="w-full md:w-2/3 space-y-6">
            
            {/* Status Banner */}
            {event.status !== "ACTIVE" && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-3xl p-6 flex items-center justify-center animate-fade-in shadow-xl">
                <p className="text-red-400 font-black uppercase tracking-[0.2em] text-xs flex items-center gap-3">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.8)]" />
                  {EVENT_STATUS_LABELS[event.status]?.label || event.status}
                </p>
              </div>
            )}

            {/* Influencer Profile Card */}
            {inf && (
              <Link
                href={`/influencers/${inf.slug}`}
                className="flex items-center gap-6 glass-card rounded-[2.5rem] p-6 glass-card-hover group shadow-2xl"
              >
                <div
                  className="w-14 h-14 rounded-full flex-shrink-0 flex items-center justify-center overflow-hidden border-2"
                  style={{ borderColor: inf.teamColor || "var(--primary)" }}
                >
                  {inf.profilePhoto ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img src={inf.profilePhoto} alt={inf.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-white font-bold text-xl">{inf.name.charAt(0).toUpperCase()}</span>
                  )}
                </div>
                <div className="flex-1">
                  <p className="text-xs text-brand-neon uppercase tracking-wider font-semibold mb-1">
                    Hosted by
                  </p>
                  <p className="font-bold text-white text-lg flex items-center gap-1.5">
                    {inf.name}
                    {inf.isVerified && <BadgeCheck className="w-4 h-4 text-brand-neon" />}
                  </p>
                  {inf.teamSupported && (
                    <p className="text-sm text-gray-400">{inf.teamSupported} Fan</p>
                  )}
                </div>
                <div className="hidden sm:flex w-10 h-10 rounded-full bg-white/5 items-center justify-center group-hover:bg-brand-neon transition-colors">
                  <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-bg transition-colors" />
                </div>
              </Link>
            )}

            {/* Info Bento Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* Date & Time */}
              <div className="glass-card rounded-[2.5rem] p-8 flex flex-col justify-center shadow-2xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                  <Calendar className="w-20 h-20" />
                </div>
                <Calendar className="w-8 h-8 text-brand-neon mb-4" />
                <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-2">Watch Party Starts</p>
                <p className="text-white font-bold text-xl tracking-tight leading-tight">{formatDateTime(event.dateTime)}</p>
              </div>

              {/* Venue */}
              <div className="glass-card rounded-[2.5rem] p-8 flex flex-col justify-center shadow-2xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                  <MapPin className="w-20 h-20" />
                </div>
                <MapPin className="w-8 h-8 text-brand-neon mb-4" />
                <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-2">Location Venue</p>
                <p className="text-white font-bold text-xl tracking-tight leading-tight truncate">{event.venue}</p>
                <p className="text-sm text-gray-400 font-medium mt-1">{event.city}</p>
                {event.venueMapUrl && (
                  <a
                    href={event.venueMapUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-brand-neon text-[10px] font-black uppercase tracking-widest hover:underline mt-4 inline-flex items-center gap-1.5"
                  >
                    Open In Maps <ArrowRight className="w-3 h-3" />
                  </a>
                )}
              </div>

              {/* About - Full Width */}
              {event.description && (
                <div className="glass-card rounded-[2.5rem] p-8 sm:col-span-2 shadow-2xl">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-2.5 rounded-xl bg-brand-neon/10 text-brand-neon">
                      <Info className="w-6 h-6" />
                    </div>
                    <h3 className="text-xl font-bold text-white tracking-tight font-outfit">Event Details</h3>
                  </div>
                  <p className="text-gray-300 leading-relaxed whitespace-pre-wrap text-lg font-medium">{event.description}</p>
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Sticky Ticket Widget (Desktop) */}
          <div className="w-full md:w-1/3 md:sticky md:top-32 pb-8">
            <div className="glass-card rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden">
              {/* Glow effect behind widget */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-brand-neon/20 blur-[50px] rounded-full pointer-events-none" />

              <div className="relative z-10">
                <div className="flex justify-between items-end mb-8">
                  <div>
                    <p className="text-sm text-gray-400 font-medium uppercase tracking-wider mb-1">
                      Ticket Price
                    </p>
                    <p className="text-4xl font-bold text-white font-outfit">
                      {formatCurrency(event.ticketPrice, event.currency)}
                    </p>
                  </div>
                  <div
                    className={`px-3 py-1.5 rounded-xl text-sm font-bold flex items-center gap-1.5 border ${
                      isSoldOut
                        ? "bg-red-500/10 text-red-400 border-red-500/20"
                        : "bg-brand-neon/10 text-brand-neon border-brand-neon/20"
                    }`}
                  >
                    <span className={`w-2 h-2 rounded-full ${isSoldOut ? "bg-red-500" : "bg-brand-neon"}`} />
                    {isSoldOut ? "Sold Out" : "Available"}
                  </div>
                </div>

                {/* Capacity Bar */}
                <div className="mb-8">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="font-medium text-white flex items-center gap-1.5">
                      <Users className="w-4 h-4 text-gray-400" />
                      Capacity
                    </span>
                    <span className="text-gray-400">
                      {availableSeats} seats left
                    </span>
                  </div>
                  <div className="h-2.5 w-full bg-white/5 rounded-full overflow-hidden border border-white/5">
                    <div
                      className={`h-full rounded-full ${isSoldOut ? "bg-red-500" : "bg-brand-neon"}`}
                      style={{
                        width: `${Math.min(100, (event.ticketsSold / event.maxCapacity) * 100)}%`,
                      }}
                    />
                  </div>
                </div>

                {/* Action Button - Desktop Only (Mobile uses floating bar) */}
                <div className="hidden md:block">
                  {event.status === "ACTIVE" && !isSoldOut ? (
                    <Link
                      href={`/events/${event.slug}/buy`}
                      className="flex items-center justify-center gap-2 w-full py-4 rounded-2xl font-bold tracking-wide bg-brand-neon text-bg hover:bg-white transition-all shadow-glow-brand hover:shadow-glow-md"
                    >
                      <Ticket className="w-5 h-5" />
                      Get Tickets Now
                    </Link>
                  ) : (
                    <button
                      disabled
                      className="block w-full py-4 rounded-2xl font-bold tracking-wide text-center bg-white/5 text-gray-500 cursor-not-allowed border border-white/5"
                    >
                      {isSoldOut ? "Sold Out" : "Sales Closed"}
                    </button>
                  )}
                </div>
             </div>
          </div>

        </div>
        </div>
      </div>

      {/* Floating Action Bar - Mobile Only */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 p-4 bg-bg/80 backdrop-blur-xl border-t border-white/10 z-50">
        {event.status === "ACTIVE" && !isSoldOut ? (
          <Link
            href={`/events/${event.slug}/buy`}
            className="flex items-center justify-center gap-2 w-full py-4 rounded-2xl font-bold tracking-wide bg-brand-neon text-bg transition-colors shadow-glow-sm"
          >
            <Ticket className="w-5 h-5" />
            Get Tickets
          </Link>
        ) : (
          <button
            disabled
            className="block w-full py-4 rounded-2xl font-bold tracking-wide text-center bg-white/5 text-gray-500 cursor-not-allowed"
          >
            {isSoldOut ? "Sold Out" : "Sales Closed"}
          </button>
        )}
      </div>
    </div>
  );
}
