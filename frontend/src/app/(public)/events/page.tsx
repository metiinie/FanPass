import { fetchBackend } from "@/lib/apiClient";
import { formatCurrency, formatDate } from "@/lib/utils";
import { MapPin, ChevronRight, Search, BadgeCheck } from "lucide-react";
import Link from "next/link";

export const metadata = {
  title: "Explore Events | FanPass",
  description: "Discover the best watch parties and sports events happening near you.",
};

export const revalidate = 60; // Cache for 1 minute

// Dynamic influencer filters will replace TEAM_FILTERS

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
    <div className="min-h-screen bg-[#F8FAF9] pb-20">
      {/* Header */}
      <div className="bg-[#0F1A14] pt-24 pb-16 px-4 relative overflow-hidden">
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-[#1A7A4A] to-transparent" />
        <div className="max-w-6xl mx-auto relative z-10">
          <h1 className="text-4xl md:text-5xl font-bold text-white font-['Outfit'] mb-4">
            Discover Watch Parties
          </h1>
          <p className="text-gray-400 text-lg max-w-2xl">
            Find the best football watch parties hosted by your favourite influencers.
          </p>
        </div>
      </div>

      <main className="max-w-6xl mx-auto px-4 -mt-8 relative z-20">
        {/* Filters */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-[#E5E7EB] mb-8 overflow-x-auto">
          <div className="flex gap-2 flex-nowrap min-w-max">
            <Link
              href="/events"
              className={`px-4 py-2 rounded-full text-sm font-semibold border transition-all ${
                selectedInfluencer === ""
                  ? "bg-[#1A7A4A] text-white border-[#1A7A4A] shadow-md"
                  : "bg-gray-50 text-[#374151] border-gray-200 hover:border-[#1A7A4A] hover:text-[#1A7A4A]"
              }`}
            >
              All
            </Link>
            {allInfluencers.map((inf: any) => (
              <Link
                key={inf.id}
                href={`/events?influencer=${encodeURIComponent(inf.id)}`}
                className={`px-4 py-2 rounded-full text-sm font-semibold border transition-all ${
                  selectedInfluencer === inf.id
                    ? "bg-[#1A7A4A] text-white border-[#1A7A4A] shadow-md"
                    : "bg-gray-50 text-[#374151] border-gray-200 hover:border-[#1A7A4A] hover:text-[#1A7A4A]"
                }`}
              >
                {inf.name}
              </Link>
            ))}
          </div>
        </div>

        {/* Events Grid */}
        {events.length === 0 ? (
          <div className="bg-white rounded-3xl p-16 text-center shadow-sm border border-[#E5E7EB]">
            <div className="bg-gray-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
              <Search className="w-10 h-10 text-gray-300" />
            </div>
            <h2 className="text-2xl font-semibold text-[#111827] mb-2">No events found</h2>
            <p className="text-[#6B7280]">Check back later for new upcoming watch parties.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((event: any) => {
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
                        <span className="font-medium text-[#1A7A4A]">{seatsPercent.toFixed(0)}% Sold</span>
                      </div>
                      <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-[#1A7A4A]" style={{ width: `${seatsPercent}%` }} />
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
