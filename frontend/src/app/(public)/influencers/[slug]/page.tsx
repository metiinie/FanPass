import { fetchBackend } from "@/lib/apiClient";
import { formatCurrency, formatDate } from "@/lib/utils";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Influencer, InfluencerEvent } from "@/types";
import { BadgeCheck, Calendar, MapPin, ArrowRight, Ticket, Users, Trophy } from "lucide-react";

export const revalidate = 60;

export async function generateMetadata({ params }: { params: { slug: string } }) {
  try {
    const inf = await fetchBackend(`/influencers/${params.slug}`, { requireAuth: false });
    return {
      title: `${inf.name} | FanPass`,
      description: inf.bio || `Watch the game with ${inf.name} — ${inf.teamSupported || "football"} fan and watch party host.`,
    };
  } catch {
    return { title: "Host Profile | FanPass" };
  }
}

export default async function InfluencerProfilePage({ params }: { params: { slug: string } }) {
  let inf: Influencer | null = null;
  try {
    inf = await fetchBackend(`/influencers/${params.slug}`, { requireAuth: false });
  } catch {
    notFound();
  }

  if (!inf) return null;

  const upcomingEvents = (inf.events || []).filter(
    (e: InfluencerEvent) => e.status === "ACTIVE" && new Date(e.dateTime) > new Date()
  );
  const pastEvents = (inf.events || []).filter(
    (e: InfluencerEvent) => e.status === "CLOSED" || new Date(e.dateTime) <= new Date()
  );

  return (
    <div className="min-h-screen bg-bg text-white pb-20">
      {/* Hero Banner */}
      <div className="relative pt-32 pb-0 overflow-hidden border-b border-white/5">
        <div
          className="absolute inset-0 opacity-20"
          style={{
            background: `radial-gradient(ellipse at 50% 0%, ${inf.teamColor || "var(--brand-neon)"} 0%, transparent 70%)`,
          }}
        />

        <div className="max-w-5xl mx-auto px-6 pt-12 pb-0 relative z-10">
          <div className="flex flex-col md:flex-row items-center md:items-end gap-8">
            {/* Avatar */}
            <div
              className="w-32 h-32 md:w-48 md:h-48 rounded-full flex-shrink-0 flex items-center justify-center overflow-hidden border-4 shadow-2xl text-white text-5xl font-bold relative -mb-12 md:-mb-16 z-20"
              style={{ backgroundColor: inf.teamColor || "var(--primary)", borderColor: "var(--bg)" }}
            >
              {inf.profilePhoto ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img src={inf.profilePhoto} alt={inf.name} className="w-full h-full object-cover" />
              ) : (
                inf.name.charAt(0).toUpperCase()
              )}
            </div>

            {/* Info */}
            <div className="text-center md:text-left flex-1 pb-6 md:pb-8 mt-12 md:mt-0">
              <div className="flex flex-col md:flex-row md:items-center gap-4 justify-between mb-4">
                <div>
                  <div className="flex items-center justify-center md:justify-start gap-2 mb-2">
                    <h1 className="text-4xl md:text-5xl font-bold text-white font-outfit tracking-tight">{inf.name}</h1>
                    {inf.isVerified && (
                      <BadgeCheck className="w-8 h-8 text-brand-neon shrink-0" />
                    )}
                  </div>
                  {inf.teamSupported && (
                    <div
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-semibold text-white/90 border border-white/10 shadow-lg"
                      style={{ backgroundColor: inf.teamColor ? `${inf.teamColor}80` : "rgba(255,255,255,0.1)" }}
                    >
                      {inf.teamSupported} Fan
                    </div>
                  )}
                </div>
                
                {/* Social links */}
                <div className="flex items-center justify-center md:justify-end gap-3 mt-4 md:mt-0">
                  {inf.tiktokUrl && (
                    <a href={inf.tiktokUrl} target="_blank" rel="noreferrer" className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 hover:border-white/20 transition-all text-white">
                      <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-1-.05A6.33 6.33 0 005 15.66a6.34 6.34 0 0010.86-4.43v-7a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-1.04-.06z"/></svg>
                    </a>
                  )}
                  {inf.instagramUrl && (
                    <a href={inf.instagramUrl} target="_blank" rel="noreferrer" className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-gradient-to-tr hover:from-yellow-400 hover:via-red-500 hover:to-purple-500 hover:border-transparent transition-all text-white">
                      <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
                    </a>
                  )}
                  {inf.telegramUrl && (
                    <a href={inf.telegramUrl} target="_blank" rel="noreferrer" className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-[#229ed9] hover:border-[#229ed9] transition-all text-white">
                      <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path d="M11.944 0A12 12 0 000 12a12 12 0 0012 12 12 12 0 0012-12A12 12 0 0012 0a12 12 0 00-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 01.171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>
                    </a>
                  )}
                </div>
              </div>
              
              {inf.bio && <p className="text-gray-400 max-w-2xl mx-auto md:mx-0 text-lg">{inf.bio}</p>}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-16 space-y-12">
        {/* Stats Row - Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="glass-card rounded-[2.5rem] p-10 flex flex-col items-center justify-center text-center shadow-2xl group hover:border-brand-neon/30 transition-all">
            <div className="bg-brand-neon/10 p-4 rounded-2xl mb-4 text-brand-neon group-hover:scale-110 transition-transform">
              <Users className="w-8 h-8" />
            </div>
            <p className="text-4xl md:text-5xl font-black text-white tracking-tighter mb-2">
              {inf.totalTicketsSold.toLocaleString()}
            </p>
            <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">Fans Served</p>
          </div>
          <div className="glass-card rounded-[2.5rem] p-10 flex flex-col items-center justify-center text-center shadow-2xl group hover:border-blue-500/30 transition-all">
            <div className="bg-blue-500/10 p-4 rounded-2xl mb-4 text-blue-400 group-hover:scale-110 transition-transform">
              <Ticket className="w-8 h-8" />
            </div>
            <p className="text-4xl md:text-5xl font-black text-white tracking-tighter mb-2">
              {upcomingEvents.length}
            </p>
            <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">Upcoming Matches</p>
          </div>
          <div className="glass-card rounded-[2.5rem] p-10 flex flex-col items-center justify-center text-center shadow-2xl group hover:border-purple-500/30 transition-all">
            <div className="bg-purple-500/10 p-4 rounded-2xl mb-4 text-purple-400 group-hover:scale-110 transition-transform">
              <Trophy className="w-8 h-8" />
            </div>
            <p className="text-4xl md:text-5xl font-black text-white tracking-tighter mb-2">
              {pastEvents.length}
            </p>
            <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">Successful parties</p>
          </div>
        </div>

        {/* Upcoming Events */}
        <section>
          <div className="flex items-center justify-between mb-10">
            <h2 className="text-4xl font-black text-white tracking-tighter">Upcoming Matches</h2>
          </div>
          
          {upcomingEvents.length === 0 ? (
            <div className="glass-card rounded-[2.5rem] border-2 border-dashed border-white/5 p-20 text-center flex flex-col items-center">
              <div className="bg-white/5 w-20 h-20 rounded-full flex items-center justify-center mb-6 text-gray-600">
                <Ticket className="w-10 h-10" />
              </div>
              <p className="text-gray-400 text-xl font-medium max-w-sm">No upcoming watch parties scheduled yet. Check back soon!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {upcomingEvents.map((event: InfluencerEvent) => {
                const seatsLeft = event.maxCapacity - event.ticketsSold;
                const isSoldOut = seatsLeft <= 0;
                
                return (
                  <Link
                    key={event.id}
                    href={`/events/${event.slug}`}
                    className="group glass-card rounded-[2.5rem] p-8 glass-card-hover shadow-2xl relative overflow-hidden"
                  >
                    {/* Hover Glow */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-brand-neon/5 blur-[50px] group-hover:bg-brand-neon/10 transition-colors" />

                    <div className="relative z-10">
                      {event.competition && (
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-white/70 text-xs font-bold uppercase tracking-wider mb-4">
                          <Trophy className="w-3.5 h-3.5 text-brand-neon" />
                          {event.competition}
                        </div>
                      )}

                      <h3 className="font-bold text-white font-outfit text-2xl mb-4 leading-tight group-hover:text-brand-neon transition-colors">
                        {event.homeTeam && event.awayTeam
                          ? `${event.homeTeam} vs ${event.awayTeam}`
                          : event.title}
                      </h3>
                      
                      <div className="space-y-2 text-sm text-gray-400 mb-6">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-brand-neon" />
                          <span className="text-white/90">{formatDate(event.dateTime)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-brand-neon" />
                          <span className="text-white/90 truncate">{event.city || event.venue}</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-4 border-t border-white/5">
                        <div>
                          <p className="text-xs text-gray-500 uppercase tracking-wide mb-0.5">Price</p>
                          <span className="font-bold text-white text-lg font-outfit">
                            {formatCurrency(event.ticketPrice, event.currency)}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-3">
                          <span
                            className={`text-xs font-bold px-3 py-1.5 rounded-xl border ${
                              isSoldOut 
                                ? "bg-red-500/10 text-red-400 border-red-500/20" 
                                : "bg-brand-neon/10 text-brand-neon border-brand-neon/20"
                            }`}
                          >
                            {isSoldOut ? "Sold Out" : `${seatsLeft} left`}
                          </span>
                          
                          <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-brand-neon transition-colors">
                            <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-bg transition-colors" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </section>

        {/* Past Events */}
        {pastEvents.length > 0 && (
          <section>
            <h2 className="text-2xl font-black text-white tracking-tighter mb-8 uppercase tracking-[0.1em] opacity-50">Past Experiences</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {pastEvents.slice(0, 6).map((event: InfluencerEvent) => (
                <div
                  key={event.id}
                  className="glass-card rounded-[2rem] p-6 opacity-60 hover:opacity-100 transition-all group"
                >
                  <h3 className="font-bold text-white text-lg tracking-tight mb-3 line-clamp-1 group-hover:text-brand-neon transition-colors">
                    {event.homeTeam && event.awayTeam
                      ? `${event.homeTeam} vs ${event.awayTeam}`
                      : event.title}
                  </h3>
                  <div className="flex flex-col gap-2">
                    <p className="text-xs text-gray-500 font-bold flex items-center gap-2 uppercase tracking-widest">
                      <Calendar className="w-3.5 h-3.5 text-brand-neon" />
                      {formatDate(event.dateTime)}
                    </p>
                    <div className="inline-flex items-center gap-2 mt-2">
                      <div className="flex -space-x-2">
                        {[1, 2, 3].map(i => (
                          <div key={i} className="w-6 h-6 rounded-full border-2 border-brand-surface bg-gray-800" />
                        ))}
                      </div>
                      <span className="text-[10px] text-gray-400 font-black uppercase tracking-widest">
                        {event.ticketsSold} FANS
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
