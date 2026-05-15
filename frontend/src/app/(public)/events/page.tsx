import { fetchBackend } from "@/lib/apiClient";
import { formatCurrency, formatDate } from "@/lib/utils";
import { MapPin, ChevronRight, Search, BadgeCheck, ArrowRight, Ticket } from "lucide-react";
import Link from "next/link";

export const metadata = {
  title: "Explore Events | FanPass",
  description: "Discover the best watch parties and sports events happening near you.",
};

export const revalidate = 60; // Cache for 1 minute

export default async function EventsListPage({
  searchParams,
}: {
  searchParams: { influencer?: string; city?: string };
}) {
  const selectedInfluencer = searchParams?.influencer || "";

  let events = [];
  let allInfluencers = [];

  try {
    let url = "/events/public";
    const params = new URLSearchParams();
    if (selectedInfluencer) params.append("influencerId", selectedInfluencer);
    if (params.toString()) url += `?${params.toString()}`;
    
    events = await fetchBackend(url, { requireAuth: false });
  } catch (error) {
    console.error("Failed to fetch events:", error);
  }

  try {
    allInfluencers = await fetchBackend("/influencers", { requireAuth: false });
  } catch (error) {
    console.error("Failed to fetch influencers:", error);
  }

  return (
    <div className="min-h-screen bg-bg text-white pb-20">
      {/* Header */}
      <div className="pt-40 pb-20 px-6 relative overflow-hidden border-b border-white/5">
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_center,_var(--brand-neon)_0%,_transparent_70%)]" />
        <div className="max-w-7xl mx-auto relative z-10">
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-black text-white font-outfit mb-6 tracking-tighter uppercase leading-none">
            Find Your <span className="text-brand-neon neon-text">Crew</span>
          </h1>
          <p className="text-gray-400 text-xl max-w-3xl font-medium leading-relaxed">
            Discover exclusive football watch parties hosted by your favourite influencers and creators. Live the game like never before.
          </p>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-6 -mt-10 relative z-20">
        {/* Filters */}
        <div className="glass-card rounded-[2rem] p-5 shadow-2xl overflow-x-auto hide-scrollbar">
          <div className="flex gap-3 flex-nowrap min-w-max">
            <Link
              href="/events"
              className={`px-8 py-3.5 rounded-2xl text-xs font-black uppercase tracking-[0.2em] transition-all border ${
                selectedInfluencer === ""
                  ? "bg-brand-neon text-bg border-brand-neon shadow-glow-sm"
                  : "bg-white/5 text-gray-400 border-white/5 hover:border-brand-neon/30 hover:text-brand-neon"
              }`}
            >
              All Events
            </Link>
            {allInfluencers.map((inf: any) => (
              <Link
                key={inf.id}
                href={`/events?influencer=${encodeURIComponent(inf.id)}`}
                className={`px-8 py-3.5 rounded-2xl text-xs font-black uppercase tracking-[0.2em] transition-all border ${
                  selectedInfluencer === inf.id
                    ? "bg-brand-neon text-bg border-brand-neon shadow-glow-sm"
                    : "bg-white/5 text-gray-400 border-white/5 hover:border-brand-neon/30 hover:text-brand-neon"
                }`}
              >
                {inf.name}
              </Link>
            ))}
          </div>
        </div>

        {/* Events Grid */}
        {events.length === 0 ? (
          <div className="glass-card py-32 px-6 rounded-[2.5rem] border-2 border-dashed border-white/5 text-center flex flex-col items-center">
            <div className="bg-white/5 w-24 h-24 rounded-full flex items-center justify-center mb-8 text-gray-600">
              <Ticket className="w-12 h-12" />
            </div>
            <h2 className="text-3xl font-black text-white tracking-tighter mb-3">No matches found</h2>
            <p className="text-gray-400 font-medium max-w-sm">Check back later for new upcoming watch parties in your city.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10 mt-12">
            {events.map((event: any) => {
              const inf = event.influencer;
              const seatsLeft = event.maxCapacity - event.ticketsSold;
              const seatsPercent = Math.min(100, (event.ticketsSold / event.maxCapacity) * 100);

              return (
                <Link
                  key={event.id}
                  href={`/events/${event.slug}`}
                  className="group relative rounded-[2.5rem] border border-white/5 overflow-hidden flex flex-col bg-brand-surface shadow-2xl hover:border-brand-neon/30 transition-all duration-500"
                >
                  {/* Image/Header Section */}
                  <div
                    className="relative overflow-hidden z-10 h-64"
                    style={{ backgroundColor: inf?.teamColor ? `${inf.teamColor}20` : "#101613" }}
                  >
                    <img 
                      src={event.coverImage || "https://images.unsplash.com/photo-1518605368461-1ee7c511d51c?q=80&w=1000&auto=format&fit=crop"} 
                      alt={event.title} 
                      className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:scale-110 group-hover:opacity-80 transition-all duration-700" 
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-brand-surface via-transparent to-transparent" />
                    
                    {/* Match label */}
                    <div className="absolute top-6 left-6 z-10">
                      {event.competition && (
                        <span className="bg-bg/60 backdrop-blur-md border border-white/10 text-white text-[10px] font-black px-4 py-2 rounded-full uppercase tracking-[0.2em] shadow-xl">
                          {event.competition}
                        </span>
                      )}
                    </div>

                    <div className="absolute bottom-6 left-6 right-6 z-10">
                      {event.homeTeam && event.awayTeam ? (
                        <h3 className="text-white font-black text-2xl md:text-3xl font-outfit tracking-tighter leading-none group-hover:text-brand-neon transition-colors">
                          {event.homeTeam} <span className="text-white/20 mx-1">vs</span> {event.awayTeam}
                        </h3>
                      ) : (
                        <h3 className="text-white font-black text-2xl md:text-3xl font-outfit tracking-tighter leading-none truncate group-hover:text-brand-neon transition-colors">
                          {event.title}
                        </h3>
                      )}
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="p-8 flex-1 flex flex-col relative z-10">
                    <div className="flex justify-between items-start mb-8">
                      <div>
                        <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1.5">Kick-off</p>
                        <p className="text-white font-bold text-lg">{formatDate(event.dateTime)}</p>
                      </div>
                      <div className="text-right">
                        <span className="bg-brand-neon text-bg text-[11px] font-black px-4 py-2 rounded-2xl shadow-glow-sm uppercase tracking-widest">
                          {formatCurrency(event.ticketPrice, event.currency)}
                        </span>
                      </div>
                    </div>

                    <div className="mb-8">
                      <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1.5">Location</p>
                      <p className="text-white font-bold text-lg truncate mb-1">{event.venue}</p>
                      <p className="text-xs text-gray-500 font-medium tracking-tight truncate uppercase">{event.city}</p>
                    </div>

                    {/* Influencer Profile (Footer of card) */}
                    <div className="mt-auto pt-4 border-t border-white/5 flex items-center justify-between">
                      {inf && (
                        <div className="flex items-center gap-3">
                          <div
                            className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 overflow-hidden border-2"
                            style={{ borderColor: inf.teamColor || "var(--primary)" }}
                          >
                            {inf.profilePhoto ? (
                              <img src={inf.profilePhoto} alt={inf.name} className="w-full h-full object-cover" />
                            ) : (
                              <span className="text-white font-bold">{inf.name.charAt(0).toUpperCase()}</span>
                            )}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-white flex items-center gap-1">
                              {inf.name}
                              {inf.isVerified && <BadgeCheck className="w-4 h-4 text-brand-neon" />}
                            </p>
                            <p className="text-xs text-gray-400">Host</p>
                          </div>
                        </div>
                      )}

                      {/* Hover Action Button */}
                      <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center group-hover:bg-brand-neon group-hover:border-brand-neon group-hover:text-bg transition-all">
                        <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-bg transition-colors" />
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
