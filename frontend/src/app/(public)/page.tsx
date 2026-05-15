import Link from "next/link";
import { formatCurrency, formatDate } from "@/lib/utils";
import { fetchBackend } from "@/lib/apiClient";
import { ArrowRight, ShieldCheck, Zap, Ticket, BadgeCheck, PlayCircle } from "lucide-react";

import { EventWithStats, Influencer } from "@/types";

export const revalidate = 60;

export default async function Home({
  searchParams,
}: {
  searchParams: { influencer?: string };
}) {
  const selectedInfluencer = searchParams?.influencer || "";

  let activeEvents: (EventWithStats & { influencer: Influencer; homeTeam?: string; awayTeam?: string; competition?: string; city?: string; coverImage?: string })[] = [];
  let featuredInfluencers: Influencer[] = [];
  let allInfluencers: Influencer[] = [];

  try {
    const url = selectedInfluencer
      ? `/events/public?influencerId=${encodeURIComponent(selectedInfluencer)}&take=9`
      : `/events/public?take=9`;
    activeEvents = await fetchBackend(url, { requireAuth: false });
  } catch (error) {
    console.error("Failed to fetch events:", error);
  }

  try {
    allInfluencers = await fetchBackend("/influencers", { requireAuth: false });
    featuredInfluencers = allInfluencers.slice(0, 6);
  } catch (error) {
    console.error("Failed to fetch influencers:", error);
  }

  const selectedInfluencerName = selectedInfluencer
    ? allInfluencers.find((inf) => inf.id === selectedInfluencer)?.name
    : "";

  return (
    <div className="min-h-screen bg-bg text-white">
      {/* Hero Section */}
      <section className="relative pt-32 pb-24 overflow-hidden border-b border-white/5">
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-brand-neon via-bg to-bg" />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjAyKSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-60" />

        <div className="max-w-7xl mx-auto px-6 relative z-10 text-center flex flex-col items-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-neon/10 border border-brand-neon/20 text-brand-neon text-sm font-semibold mb-8 animate-fade-in">
            <Zap className="w-3.5 h-3.5 fill-current" />
            <span>Ethiopia&apos;s #1 Watch Party App</span>
          </div>

          <h1 className="text-5xl md:text-7xl font-bold text-white font-outfit tracking-tight leading-[1.05] mb-6 max-w-4xl animate-slide-up" style={{animationDelay: '100ms'}}>
            Experience the match<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-brand-neon to-brand-neon">
              with your crew.
            </span>
          </h1>

          <p className="text-lg text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed animate-slide-up" style={{animationDelay: '200ms'}}>
            Your favourite football creators are hosting exclusive watch parties.
            Grab your ticket, show up, and experience the energy live.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-slide-up" style={{animationDelay: '300ms'}}>
            <Link
              href="#events"
              className="w-full sm:w-auto px-8 py-4 bg-brand-neon text-bg rounded-2xl font-bold tracking-wide hover:bg-white transition-all shadow-glow-sm hover:shadow-glow-md flex items-center justify-center gap-2"
            >
              <Ticket className="w-5 h-5" />
              Find Watch Parties
            </Link>
            <Link
              href="/influencers"
              className="w-full sm:w-auto px-8 py-4 bg-brand-surface/50 backdrop-blur-md text-white border border-white/10 rounded-2xl font-bold tracking-wide hover:bg-white/10 transition-all flex items-center justify-center gap-2"
            >
              <PlayCircle className="w-5 h-5" />
              Browse Hosts
            </Link>
          </div>
        </div>
      </section>

      {/* Trust Badges - Glassmorphic Bento */}
      <div className="max-w-5xl mx-auto px-6 -mt-12 relative z-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { icon: ShieldCheck, label: "Secure Payments", sub: "Bank Transfers & Telebirr", color: "text-brand-neon bg-brand-neon/10 border-brand-neon/20" },
            { icon: Zap, label: "Instant Digital Tickets", sub: "Stored on your phone", color: "text-blue-400 bg-blue-500/10 border-blue-500/20" },
            { icon: Ticket, label: "Fast QR Entry", sub: "Seamless scanning at door", color: "text-purple-400 bg-purple-500/10 border-purple-500/20" },
          ].map(({ icon: Icon, label, sub, color }) => (
            <div key={label} className="bg-brand-surface/80 backdrop-blur-xl p-5 rounded-2xl shadow-xl border border-white/5 flex items-center gap-4 hover:border-white/10 transition-colors">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center border ${color}`}>
                <Icon className="w-6 h-6" />
              </div>
              <div>
                <p className="font-bold text-white font-outfit">{label}</p>
                <p className="text-xs text-gray-400">{sub}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Events Section - Bento Grid inspired */}
      <section id="events" className="max-w-7xl mx-auto px-6 py-24">
        <div className="flex flex-col md:flex-row justify-between items-end mb-10 gap-4">
          <div>
            <h2 className="text-4xl font-bold text-white font-outfit tracking-tight">
              Featured Matches
            </h2>
            <p className="text-gray-400 mt-2">
              {selectedInfluencer ? `Showing events for selected host` : "The biggest games, the best crowds."}
            </p>
          </div>
          <Link href="/events" className="text-brand-neon font-semibold flex items-center gap-2 hover:text-white transition-colors shrink-0 bg-brand-neon/10 px-4 py-2 rounded-full">
            View all <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Influencer Filter Pills */}
        <div className="flex gap-2 flex-wrap mb-10">
          <Link
            href="/"
            className={`px-4 py-2 rounded-full text-sm font-semibold border transition-all ${
              selectedInfluencer === ""
                ? "bg-brand-neon text-bg border-brand-neon shadow-glow-sm"
                : "bg-brand-surface/50 text-gray-300 border-white/10 hover:border-brand-neon hover:text-brand-neon"
            }`}
          >
            All Hosts
          </Link>
          {allInfluencers.map((inf) => (
            <Link
              key={inf.id}
              href={`/?influencer=${encodeURIComponent(inf.id)}`}
              className={`px-4 py-2 rounded-full text-sm font-semibold border transition-all ${
                selectedInfluencer === inf.id
                  ? "bg-brand-neon text-bg border-brand-neon shadow-glow-sm"
                  : "bg-brand-surface/50 text-gray-300 border-white/10 hover:border-brand-neon hover:text-brand-neon"
              }`}
            >
              {inf.name}
            </Link>
          ))}
        </div>

        {/* Event Cards */}
        {activeEvents.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {activeEvents.map((event) => {
              const inf = event.influencer;
              
              return (
                <Link
                  key={event.id}
                  href={`/events/${event.slug}`}
                  className="group relative rounded-[2.5rem] border border-white/5 overflow-hidden flex flex-col bg-brand-surface shadow-2xl hover:border-brand-neon/30 transition-all duration-500"
                >
                  {/* Glowing background effect on hover */}
                  <div className="absolute inset-0 bg-brand-neon/0 group-hover:bg-brand-neon/5 transition-colors duration-500 z-0" />

                  {/* Image/Header Section */}
                  <div
                    className="relative overflow-hidden z-10 h-64"
                    style={{ backgroundColor: inf?.teamColor ? `${inf.teamColor}20` : "#101613" }}
                  >
                    <img 
                      src={event.coverImage || "https://images.unsplash.com/photo-1518605368461-1ee7c511d51c?q=80&w=1000&auto=format&fit=crop"} 
                      alt={event.title} 
                      /* eslint-disable-next-line @next/next/no-img-element */
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
                              /* eslint-disable-next-line @next/next/no-img-element */
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
        ) : (
          <div className="bg-brand-surface py-24 px-6 rounded-3xl border border-dashed border-white/10 text-center">
            <Ticket className="w-12 h-12 text-gray-600 mx-auto mb-4 opacity-50" />
            <p className="text-gray-400 text-lg font-medium">
              {selectedInfluencerName
                ? `No upcoming watch parties for ${selectedInfluencerName} yet.`
                : "No active matches found. Check back soon!"}
            </p>
            {selectedInfluencerName && (
              <Link href="/" className="mt-6 inline-block bg-brand-neon text-bg px-6 py-3 rounded-xl font-bold hover:bg-white transition-colors">
                View all matches
              </Link>
            )}
          </div>
        )}
      </section>

      {/* Influencers Section - Horizontal Scroll */}
      {featuredInfluencers.length > 0 && (
        <section className="bg-brand-surface border-y border-white/5 py-24 overflow-hidden relative">
          {/* Subtle background glow */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3/4 h-1/2 bg-brand-neon/5 blur-[100px] pointer-events-none rounded-full" />
          
          <div className="max-w-7xl mx-auto px-6 relative z-10">
            <div className="flex justify-between items-end mb-12">
              <div>
                <h2 className="text-4xl font-bold text-white font-outfit tracking-tight">
                  Top Hosts
                </h2>
                <p className="text-gray-400 mt-2">The voices behind the biggest watch parties.</p>
              </div>
              <Link href="/influencers" className="hidden sm:flex text-brand-neon font-semibold items-center gap-2 hover:text-white transition-colors">
                Browse all <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            {/* Horizontal Snap Scroll */}
            <div className="flex overflow-x-auto snap-x snap-mandatory gap-6 pb-8 -mx-6 px-6 hide-scrollbar">
              {featuredInfluencers.map((inf) => (
                <Link
                  key={inf.id}
                  href={`/influencers/${inf.slug}`}
                  className="snap-start shrink-0 w-64 group bg-bg border border-white/10 rounded-3xl p-6 hover:border-brand-neon/50 hover:bg-white/[0.02] transition-all text-center relative overflow-hidden"
                >
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-brand-neon to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  
                  <div
                    className="w-24 h-24 rounded-full mx-auto mb-4 flex items-center justify-center overflow-hidden text-white text-3xl font-bold border-4 relative"
                    style={{ borderColor: inf.teamColor || "var(--primary)" }}
                  >
                    {inf.profilePhoto ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img src={inf.profilePhoto} alt={inf.name} className="w-full h-full object-cover" />
                    ) : (
                      inf.name.charAt(0).toUpperCase()
                    )}
                    {inf.isVerified && (
                      <div className="absolute bottom-0 right-0 bg-bg rounded-full p-0.5">
                        <BadgeCheck className="w-6 h-6 text-brand-neon" />
                      </div>
                    )}
                  </div>
                  <h3 className="font-bold text-white text-lg font-outfit truncate">
                    {inf.name}
                  </h3>
                  {inf.teamSupported && (
                    <p className="text-sm text-gray-500 mt-1">{inf.teamSupported} Fan</p>
                  )}
                  <div className="mt-6 pt-4 border-t border-white/5">
                    <p className="text-sm text-brand-neon font-semibold">
                      {inf.totalTicketsSold.toLocaleString()} tickets sold
                    </p>
                  </div>
                </Link>
              ))}
            </div>
            
            <Link href="/influencers" className="sm:hidden mt-4 text-brand-neon font-semibold flex items-center justify-center gap-2 w-full py-4 bg-brand-neon/10 rounded-xl">
              Browse all hosts <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="bg-bg border-t border-white/5 py-12 px-6 relative z-10">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8 text-center md:text-left">
          <div className="flex items-center gap-3">
            <div className="bg-brand-surface p-2 rounded-xl border border-white/5">
              <Ticket className="w-5 h-5 text-gray-400" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white font-outfit">FanPass</h2>
              <p className="text-gray-500 text-sm mt-1">© 2026 FanPass Digital. All rights reserved.</p>
            </div>
          </div>
          <div className="flex flex-wrap justify-center md:justify-end items-center gap-6 text-sm font-medium text-gray-400">
            <Link href="/events" className="hover:text-brand-neon transition-colors">Events</Link>
            <Link href="/influencers" className="hover:text-brand-neon transition-colors">Hosts</Link>
            <Link href="/dashboard" className="hover:text-brand-neon transition-colors">Organizer Portal</Link>
            <Link href="/terms" className="hover:text-brand-neon transition-colors">Terms</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
