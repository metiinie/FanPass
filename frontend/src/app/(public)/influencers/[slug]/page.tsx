import { fetchBackend } from "@/lib/apiClient";
import { formatCurrency, formatDate } from "@/lib/utils";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BadgeCheck, Calendar, MapPin, ArrowRight, ExternalLink } from "lucide-react";

export const revalidate = 60;

export async function generateMetadata({ params }: { params: { slug: string } }) {
  try {
    const inf = await fetchBackend(`/influencers/${params.slug}`, { requireAuth: false });
    return {
      title: `${inf.name} | FanPass`,
      description: inf.bio || `Watch the game with ${inf.name} — ${inf.teamSupported || "football"} fan and watch party host.`,
    };
  } catch {
    return { title: "Influencer | FanPass" };
  }
}

export default async function InfluencerProfilePage({ params }: { params: { slug: string } }) {
  let inf: any = null;
  try {
    inf = await fetchBackend(`/influencers/${params.slug}`, { requireAuth: false });
  } catch {
    notFound();
  }

  const upcomingEvents = (inf.events || []).filter(
    (e: any) => e.status === "ACTIVE" && new Date(e.dateTime) > new Date()
  );
  const pastEvents = (inf.events || []).filter(
    (e: any) => e.status === "CLOSED" || new Date(e.dateTime) <= new Date()
  );

  return (
    <div className="min-h-screen bg-[#F8FAF9]">
      {/* Hero Banner */}
      <div
        className="relative pt-16 pb-0 overflow-hidden"
        style={{ backgroundColor: inf.teamColor ? `${inf.teamColor}18` : "#0F1A14" }}
      >
        <div
          className="absolute inset-0 opacity-20"
          style={{
            background: `radial-gradient(ellipse at 50% 0%, ${inf.teamColor || "#1A7A4A"} 0%, transparent 70%)`,
          }}
        />

        <div className="max-w-4xl mx-auto px-6 pt-12 pb-0 relative z-10">
          <div className="flex flex-col sm:flex-row items-center sm:items-end gap-6">
            {/* Avatar */}
            <div
              className="w-28 h-28 sm:w-36 sm:h-36 rounded-3xl flex-shrink-0 flex items-center justify-center overflow-hidden border-4 border-white shadow-2xl text-white text-5xl font-bold"
              style={{ backgroundColor: inf.teamColor || "#1A7A4A" }}
            >
              {inf.profilePhoto ? (
                <img src={inf.profilePhoto} alt={inf.name} className="w-full h-full object-cover" />
              ) : (
                inf.name.charAt(0).toUpperCase()
              )}
            </div>

            {/* Info */}
            <div className="text-center sm:text-left pb-4">
              <div className="flex items-center justify-center sm:justify-start gap-2 mb-1">
                <h1 className="text-3xl font-bold text-[#111827] font-['Outfit']">{inf.name}</h1>
                {inf.isVerified && (
                  <BadgeCheck className="w-6 h-6 text-[#1A7A4A] shrink-0" title="Verified Influencer" />
                )}
              </div>
              {inf.teamSupported && (
                <div
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-semibold text-white mb-2"
                  style={{ backgroundColor: inf.teamColor || "#1A7A4A" }}
                >
                  {inf.teamSupported} Fan
                </div>
              )}
              {inf.bio && <p className="text-gray-600 max-w-md">{inf.bio}</p>}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8 space-y-10">
        {/* Stats + Social Row */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-wrap gap-8 items-center justify-between">
          {/* Stats */}
          <div className="flex gap-8">
            <div className="text-center">
              <p className="text-2xl font-bold text-[#111827] font-['Outfit']">
                {inf.totalTicketsSold.toLocaleString()}
              </p>
              <p className="text-xs text-gray-400 uppercase tracking-wide mt-0.5">Fans Served</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-[#111827] font-['Outfit']">
                {upcomingEvents.length}
              </p>
              <p className="text-xs text-gray-400 uppercase tracking-wide mt-0.5">Upcoming</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-[#111827] font-['Outfit']">
                {pastEvents.length}
              </p>
              <p className="text-xs text-gray-400 uppercase tracking-wide mt-0.5">Past Events</p>
            </div>
          </div>

          {/* Social links */}
          <div className="flex items-center gap-3">
            {inf.tiktokUrl && (
              <a
                href={inf.tiktokUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-black text-white text-sm font-semibold hover:bg-gray-800 transition-colors"
              >
                TikTok <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
            {inf.instagramUrl && (
              <a
                href={inf.instagramUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white text-sm font-semibold hover:opacity-90 transition-opacity"
              >
                Instagram <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
            {inf.telegramUrl && (
              <a
                href={inf.telegramUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#2AABEE] text-white text-sm font-semibold hover:bg-[#229ed9] transition-colors"
              >
                Telegram <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
          </div>
        </div>

        {/* Upcoming Events */}
        <section>
          <h2 className="text-xl font-bold text-[#111827] font-['Outfit'] mb-4">Upcoming Watch Parties</h2>
          {upcomingEvents.length === 0 ? (
            <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-10 text-center">
              <p className="text-gray-400">No upcoming events scheduled yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {upcomingEvents.map((event: any) => {
                const seatsLeft = event.maxCapacity - event.ticketsSold;
                return (
                  <Link
                    key={event.id}
                    href={`/events/${event.slug}`}
                    className="group bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-lg hover:border-[#1A7A4A]/20 transition-all"
                  >
                    {event.homeTeam && event.awayTeam && (
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
                        {event.competition || "Watch Party"}
                      </p>
                    )}
                    <h3 className="font-bold text-[#111827] font-['Outfit'] text-base mb-3 group-hover:text-[#1A7A4A] transition-colors">
                      {event.homeTeam && event.awayTeam
                        ? `${event.homeTeam} vs ${event.awayTeam}`
                        : event.title}
                    </h3>
                    <div className="space-y-1.5 text-sm text-gray-500 mb-4">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-[#1A7A4A]" />
                        {formatDate(event.dateTime)}
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-[#1A7A4A]" />
                        {event.city || event.venue}
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[#111827]">
                        {formatCurrency(event.ticketPrice, event.currency)}
                      </span>
                      <span
                        className={`text-xs font-semibold px-2 py-1 rounded-lg ${
                          seatsLeft <= 10 ? "bg-red-50 text-red-600" : "bg-green-50 text-green-700"
                        }`}
                      >
                        {seatsLeft} left
                      </span>
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
            <h2 className="text-xl font-bold text-[#111827] font-['Outfit'] mb-4">Past Events</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {pastEvents.slice(0, 6).map((event: any) => (
                <div
                  key={event.id}
                  className="bg-white rounded-2xl border border-gray-100 p-5 opacity-70"
                >
                  <h3 className="font-semibold text-[#374151] font-['Outfit'] mb-1">
                    {event.homeTeam && event.awayTeam
                      ? `${event.homeTeam} vs ${event.awayTeam}`
                      : event.title}
                  </h3>
                  <p className="text-sm text-gray-400 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5" />
                    {formatDate(event.dateTime)}
                  </p>
                  <p className="text-xs text-gray-400 mt-2">
                    {event.ticketsSold} fans attended
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
