import Link from "next/link";
import { formatCurrency, formatDate } from "@/lib/utils";
import { fetchBackend } from "@/lib/apiClient";
import { ArrowRight, ShieldCheck, Zap, Ticket, BadgeCheck } from "lucide-react";

export const revalidate = 60;

// Dynamic influencer filters will replace TEAM_FILTERS

export default async function Home({
  searchParams,
}: {
  searchParams: { influencer?: string };
}) {
  const selectedInfluencer = searchParams?.influencer || "";

  let activeEvents: any[] = [];
  let featuredInfluencers: any[] = [];
  let allInfluencers: any[] = [];

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
    featuredInfluencers = allInfluencers.slice(0, 4);
  } catch (error) {
    console.error("Failed to fetch influencers:", error);
  }

  const selectedInfluencerName = selectedInfluencer
    ? allInfluencers.find((inf) => inf.id === selectedInfluencer)?.name
    : "";

  return (
    <div className="min-h-screen bg-[#F8FAF9]">
      {/* Hero Section */}
      <section className="relative bg-[#0F1A14] pt-32 pb-24 overflow-hidden">
        <div className="absolute inset-0 opacity-30 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#1A7A4A] via-transparent to-transparent" />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjAzKSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-40" />

        <div className="max-w-7xl mx-auto px-6 relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#1A7A4A]/20 border border-[#1A7A4A]/30 text-[#22C55E] text-sm font-semibold mb-8">
            <Zap className="w-3.5 h-3.5 fill-current" />
            <span>Ethiopia's #1 Football Watch Party Platform</span>
          </div>

          <h1 className="text-5xl md:text-7xl font-bold text-white font-['Outfit'] tracking-tight leading-[1.05] mb-6">
            Watch the game<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#1A7A4A] to-[#22C55E]">
              with your crew.
            </span>
          </h1>

          <p className="text-lg text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            Your favourite football influencer is hosting a watch party.
            Grab your ticket, show up, and experience the match with your community.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="#events"
              className="w-full sm:w-auto px-8 py-4 bg-[#1A7A4A] text-white rounded-2xl font-bold tracking-wide hover:bg-[#0F4D2E] transition-all shadow-[0_8px_30px_rgb(26,122,74,0.35)]"
            >
              Find Watch Parties
            </Link>
            <Link
              href="/influencers"
              className="w-full sm:w-auto px-8 py-4 bg-white/5 text-white border border-white/10 rounded-2xl font-bold tracking-wide hover:bg-white/10 transition-all"
            >
              Browse Influencers
            </Link>
          </div>
        </div>
      </section>

      {/* Trust Badges */}
      <div className="max-w-4xl mx-auto px-6 -mt-8 relative z-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { icon: ShieldCheck, label: "Secure Payments", sub: "Secure Bank Transfers", color: "text-[#1A7A4A] bg-green-50" },
            { icon: Zap, label: "Instant Tickets", sub: "Receive via SMS & QR", color: "text-blue-600 bg-blue-50" },
            { icon: Ticket, label: "Easy Check-in", sub: "Fast QR entry validation", color: "text-orange-600 bg-orange-50" },
          ].map(({ icon: Icon, label, sub, color }) => (
            <div key={label} className="bg-white p-5 rounded-2xl shadow-xl border border-gray-100 flex items-center gap-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
                <Icon className="w-6 h-6" />
              </div>
              <div>
                <p className="font-bold text-[#111827]">{label}</p>
                <p className="text-xs text-gray-500">{sub}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Events Section */}
      <section id="events" className="max-w-7xl mx-auto px-6 py-20">
        {/* Section header */}
        <div className="flex flex-col md:flex-row justify-between items-end mb-8 gap-4">
          <div>
            <h2 className="text-3xl font-bold text-[#111827] font-['Outfit'] tracking-tight">
              Upcoming Watch Parties
            </h2>
            <p className="text-gray-500 mt-1">
              {selectedInfluencer ? `Showing events for selected influencer` : "All matches, all influencers"}
            </p>
          </div>
          <Link href="/events" className="text-[#1A7A4A] font-semibold flex items-center gap-2 hover:underline shrink-0">
            View all <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Influencer Filter Pills */}
        <div className="flex gap-2 flex-wrap mb-10">
          <Link
            href="/"
            className={`px-4 py-2 rounded-full text-sm font-semibold border transition-all ${
              selectedInfluencer === ""
                ? "bg-[#1A7A4A] text-white border-[#1A7A4A] shadow-md"
                : "bg-white text-[#374151] border-gray-200 hover:border-[#1A7A4A] hover:text-[#1A7A4A]"
            }`}
          >
            All
          </Link>
          {allInfluencers.map((inf) => (
            <Link
              key={inf.id}
              href={`/?influencer=${encodeURIComponent(inf.id)}`}
              className={`px-4 py-2 rounded-full text-sm font-semibold border transition-all ${
                selectedInfluencer === inf.id
                  ? "bg-[#1A7A4A] text-white border-[#1A7A4A] shadow-md"
                  : "bg-white text-[#374151] border-gray-200 hover:border-[#1A7A4A] hover:text-[#1A7A4A]"
              }`}
            >
              {inf.name}
            </Link>
          ))}
        </div>

        {/* Event Cards */}
        {activeEvents.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {activeEvents.map((event: any) => {
              const inf = event.influencer;
              const seatsLeft = event.maxCapacity - event.ticketsSold;
              const seatsPercent = Math.min(100, (event.ticketsSold / event.maxCapacity) * 100);

              return (
                <Link
                  key={event.id}
                  href={`/events/${event.slug}`}
                  className="group bg-white rounded-3xl border border-gray-100 overflow-hidden hover:shadow-2xl hover:border-[#1A7A4A]/20 transition-all duration-300 flex flex-col"
                >
                  {/* Cover / Match Header */}
                  <div
                    className="h-40 relative flex flex-col items-center justify-center overflow-hidden"
                    style={{
                      background: `linear-gradient(135deg, ${inf?.teamColor || "#0F1A14"}22 0%, #0F1A14 100%)`,
                      backgroundColor: "#0F1A14",
                    }}
                  >
                    {event.coverImage ? (
                      <img src={event.coverImage} alt={event.title} className="absolute inset-0 w-full h-full object-cover opacity-50" />
                    ) : null}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />

                    {/* Match label */}
                    {event.homeTeam && event.awayTeam ? (
                      <div className="relative z-10 text-center px-4">
                        <p className="text-white/60 text-xs font-medium uppercase tracking-widest mb-1">
                          {event.competition || "Watch Party"}
                        </p>
                        <p className="text-white font-bold text-lg font-['Outfit'] leading-tight">
                          {event.homeTeam} vs {event.awayTeam}
                        </p>
                      </div>
                    ) : (
                      <p className="relative z-10 text-white/40 text-5xl font-bold font-['Outfit'] select-none">
                        {event.title.charAt(0)}
                      </p>
                    )}

                    {/* Price badge */}
                    <div className="absolute bottom-3 right-3 z-10">
                      <span className="bg-[#1A7A4A] text-white text-xs font-bold px-2.5 py-1 rounded-lg">
                        {formatCurrency(event.ticketPrice, event.currency)}
                      </span>
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="p-5 flex-1 flex flex-col">
                    {/* Influencer Row */}
                    {inf && (
                      <div className="flex items-center gap-2.5 mb-3">
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 overflow-hidden border-2 text-white text-xs font-bold"
                          style={{ borderColor: inf.teamColor || "#1A7A4A", backgroundColor: inf.teamColor || "#1A7A4A" }}
                        >
                          {inf.profilePhoto ? (
                            <img src={inf.profilePhoto} alt={inf.name} className="w-full h-full object-cover" />
                          ) : (
                            inf.name.charAt(0).toUpperCase()
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-[#111827] truncate flex items-center gap-1">
                            {inf.name}
                            {inf.isVerified && <BadgeCheck className="w-3.5 h-3.5 text-[#1A7A4A]" />}
                          </p>
                          {inf.teamSupported && (
                            <p className="text-[10px] text-gray-400">{inf.teamSupported} Fan</p>
                          )}
                        </div>
                      </div>
                    )}

                    <h3 className="font-bold text-[#111827] font-['Outfit'] text-base leading-snug mb-2 group-hover:text-[#1A7A4A] transition-colors">
                      {event.title}
                    </h3>

                    <p className="text-sm text-gray-500 mb-4">
                      {formatDate(event.dateTime)} · {event.city || event.venue}
                    </p>

                    {/* Seats Progress */}
                    <div className="mt-auto">
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-gray-400">{seatsLeft} seats left</span>
                        <span className="text-gray-400">{event.maxCapacity} total</span>
                      </div>
                      <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${seatsPercent}%`,
                            backgroundColor: seatsPercent > 80 ? "#EF4444" : "#1A7A4A",
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* CTA Footer */}
                  <div className="px-5 pb-5">
                    <span className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-[#F3F4F6] group-hover:bg-[#1A7A4A] text-[#374151] group-hover:text-white font-semibold text-sm transition-all">
                      Get Ticket <ArrowRight className="w-4 h-4" />
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="bg-white py-20 px-6 rounded-3xl border border-dashed border-gray-200 text-center">
            <p className="text-gray-400 text-lg">
              {selectedInfluencerName
                ? `No upcoming watch parties for ${selectedInfluencerName} yet.`
                : "No active events yet. Check back soon!"}
            </p>
            {selectedInfluencerName && (
              <Link href="/" className="mt-4 inline-block text-[#1A7A4A] font-semibold hover:underline">
                View all events →
              </Link>
            )}
          </div>
        )}
      </section>

      {/* Influencers Section */}
      {featuredInfluencers.length > 0 && (
        <section className="bg-[#0F1A14] py-20 px-6">
          <div className="max-w-7xl mx-auto">
            <div className="flex justify-between items-end mb-10">
              <div>
                <h2 className="text-3xl font-bold text-white font-['Outfit']">
                  Top Influencers
                </h2>
                <p className="text-gray-500 mt-1">Ethiopia's biggest football watch party hosts</p>
              </div>
              <Link href="/influencers" className="text-[#22C55E] font-semibold flex items-center gap-2 hover:underline shrink-0">
                See all <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {featuredInfluencers.map((inf: any) => (
                <Link
                  key={inf.id}
                  href={`/influencers/${inf.slug}`}
                  className="group bg-white/5 border border-white/10 rounded-2xl p-5 hover:bg-white/10 hover:border-[#1A7A4A]/40 transition-all text-center"
                >
                  <div
                    className="w-16 h-16 rounded-2xl mx-auto mb-3 flex items-center justify-center overflow-hidden text-white text-2xl font-bold border-2"
                    style={{ borderColor: inf.teamColor || "#1A7A4A", backgroundColor: inf.teamColor || "#1A7A4A" }}
                  >
                    {inf.profilePhoto ? (
                      <img src={inf.profilePhoto} alt={inf.name} className="w-full h-full object-cover" />
                    ) : (
                      inf.name.charAt(0).toUpperCase()
                    )}
                  </div>
                  <p className="font-bold text-white text-sm font-['Outfit'] flex items-center justify-center gap-1">
                    {inf.name}
                    {inf.isVerified && <BadgeCheck className="w-3.5 h-3.5 text-[#22C55E]" />}
                  </p>
                  {inf.teamSupported && (
                    <p className="text-xs text-gray-500 mt-0.5">{inf.teamSupported} Fan</p>
                  )}
                  <p className="text-xs text-[#22C55E] mt-2 font-semibold">
                    {inf.totalTicketsSold.toLocaleString()} fans served
                  </p>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="bg-white border-t border-gray-100 py-12 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8 text-center md:text-left">
          <div>
            <h2 className="text-2xl font-bold text-[#111827] font-['Outfit']">FanPass</h2>
            <p className="text-gray-500 text-sm mt-1">© 2026 FanPass Digital. All rights reserved.</p>
          </div>
          <div className="flex items-center gap-8 text-sm font-medium text-gray-500">
            <Link href="/influencers" className="hover:text-[#1A7A4A]">Influencers</Link>
            <Link href="/dashboard" className="hover:text-[#1A7A4A]">For Organizers</Link>
            <Link href="/login" className="hover:text-[#1A7A4A]">Staff Login</Link>
            <Link href="/terms" className="hover:text-[#1A7A4A]">Terms</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
