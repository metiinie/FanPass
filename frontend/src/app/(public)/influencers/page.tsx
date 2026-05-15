import { fetchBackend } from "@/lib/apiClient";
import { Influencer } from "@/types";
import Link from "next/link";
import { BadgeCheck, Search, Users } from "lucide-react";

export const metadata = {
  title: "Football Hosts | FanPass",
  description: "Browse Ethiopia's top football watch party hosts. Find your favourite creator and book a ticket to watch the game together.",
};

export const revalidate = 120;

export default async function InfluencersPage({
  searchParams,
}: {
  searchParams: { search?: string };
}) {
  const search = searchParams?.search || "";
  let influencers: Influencer[] = [];

  try {
    const url = search
      ? `/influencers?search=${encodeURIComponent(search)}`
      : `/influencers`;
    influencers = await fetchBackend(url, { requireAuth: false });
  } catch (error) {
    console.error("Failed to fetch influencers:", error);
  }

  return (
    <div className="min-h-screen bg-bg text-white pb-20">
      {/* Header */}
      <div className="pt-32 pb-16 px-6 relative overflow-hidden border-b border-white/5">
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-brand-neon to-transparent" />
        <div className="max-w-7xl mx-auto relative z-10 text-center">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white font-outfit mb-4 tracking-tight">
            Meet the Hosts
          </h1>
          <p className="text-gray-400 text-lg max-w-xl mx-auto">
            Ethiopia&apos;s biggest football watch party creators. Find your crew.
          </p>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-6 -mt-8 relative z-20">
        {/* Search Bar */}
        <div className="bg-brand-surface/80 backdrop-blur-xl rounded-2xl shadow-xl border border-white/10 p-3 mb-10 flex items-center gap-3 max-w-2xl mx-auto">
          <Search className="w-5 h-5 text-gray-400 ml-2 shrink-0" />
          <form className="flex-1">
            <input
              name="search"
              defaultValue={search}
              placeholder="Search by name or team (e.g. Arsenal)..."
              className="w-full text-white placeholder-gray-500 outline-none text-sm bg-transparent"
            />
          </form>
          {search && (
            <Link href="/influencers" className="text-sm text-brand-neon font-medium hover:underline shrink-0 px-2">
              Clear
            </Link>
          )}
        </div>

        {influencers.length === 0 ? (
          <div className="bg-brand-surface py-24 px-6 rounded-3xl border border-dashed border-white/10 text-center max-w-3xl mx-auto">
            <Users className="w-12 h-12 text-gray-600 mx-auto mb-4 opacity-50" />
            <p className="text-gray-400 text-lg font-medium">
              {search ? `No hosts found matching "${search}"` : "No hosts yet."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {influencers.map((inf: Influencer) => (
              <Link
                key={inf.id}
                href={`/influencers/${inf.slug}`}
                className="group bg-brand-surface rounded-3xl border border-white/10 overflow-hidden hover:border-brand-neon/50 transition-all duration-500 relative block"
              >
                {/* Background glow on hover */}
                <div className="absolute inset-0 bg-brand-neon/0 group-hover:bg-brand-neon/5 transition-colors duration-500 z-0" />

                {/* Team color banner */}
                <div
                  className="h-24 relative z-10"
                  style={{ backgroundColor: inf.teamColor ? `${inf.teamColor}22` : "#101613" }}
                >
                  <div
                    className="absolute inset-0 opacity-20"
                    style={{ background: `radial-gradient(circle at 50% 50%, ${inf.teamColor || "var(--primary)"}, transparent)` }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-brand-surface to-transparent" />
                </div>

                {/* Avatar overlapping banner */}
                <div className="px-6 pb-6 -mt-10 relative z-20">
                  <div
                    className="w-20 h-20 rounded-full flex items-center justify-center overflow-hidden border-4 border-brand-surface shadow-lg text-white text-3xl font-bold mb-4 relative"
                    style={{ backgroundColor: inf.teamColor || "var(--primary)", borderColor: "var(--brand-surface)" }}
                  >
                    {inf.profilePhoto ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img src={inf.profilePhoto} alt={inf.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                    ) : (
                      inf.name.charAt(0).toUpperCase()
                    )}
                    
                    {inf.isVerified && (
                      <div className="absolute bottom-0 right-0 bg-brand-surface rounded-full p-0.5">
                        <BadgeCheck className="w-5 h-5 text-brand-neon" />
                      </div>
                    )}
                  </div>

                  <div className="mb-2">
                    <h3 className="font-bold text-white font-outfit text-xl truncate">
                      {inf.name}
                    </h3>
                    {inf.teamSupported && (
                      <p className="text-sm text-gray-400 mt-0.5">{inf.teamSupported} Fan</p>
                    )}
                  </div>

                  {inf.bio && (
                    <p className="text-sm text-gray-500 mt-3 line-clamp-2 h-10">{inf.bio}</p>
                  )}

                  {/* Stats row */}
                  <div className="flex items-center gap-6 mt-6 pt-5 border-t border-white/5">
                    <div>
                      <p className="text-xl font-bold text-brand-neon font-outfit leading-none">
                        {inf.totalTicketsSold.toLocaleString()}
                      </p>
                      <p className="text-xs text-gray-500 uppercase tracking-wide mt-1">Fans</p>
                    </div>
                    <div>
                      <p className="text-xl font-bold text-white font-outfit leading-none">
                        {inf._count?.events ?? 0}
                      </p>
                      <p className="text-xs text-gray-500 uppercase tracking-wide mt-1">Events</p>
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
