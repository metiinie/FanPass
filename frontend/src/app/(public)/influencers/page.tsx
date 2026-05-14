import { fetchBackend } from "@/lib/apiClient";
import Link from "next/link";
import { BadgeCheck, Search } from "lucide-react";

export const metadata = {
  title: "Football Influencers | FanPass",
  description: "Browse Ethiopia's top football watch party influencers. Find your favourite creator and book a ticket to watch the game together.",
};

export const revalidate = 120;

export default async function InfluencersPage({
  searchParams,
}: {
  searchParams: { search?: string };
}) {
  const search = searchParams?.search || "";
  let influencers: any[] = [];

  try {
    const url = search
      ? `/influencers?search=${encodeURIComponent(search)}`
      : `/influencers`;
    influencers = await fetchBackend(url, { requireAuth: false });
  } catch (error) {
    console.error("Failed to fetch influencers:", error);
  }

  return (
    <div className="min-h-screen bg-[#F8FAF9] pb-20">
      {/* Header */}
      <div className="bg-[#0F1A14] pt-28 pb-16 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-white font-['Outfit'] mb-4">
            Football Influencers
          </h1>
          <p className="text-gray-400 text-lg max-w-xl mx-auto">
            Ethiopia's biggest football watch party hosts. Find your crew.
          </p>
        </div>
      </div>

      <main className="max-w-6xl mx-auto px-4 -mt-8">
        {/* Search Bar */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-3 mb-8 flex items-center gap-3">
          <Search className="w-5 h-5 text-gray-400 ml-2 shrink-0" />
          <form className="flex-1">
            <input
              name="search"
              defaultValue={search}
              placeholder="Search by name or team (e.g. Arsenal)..."
              className="w-full text-[#111827] placeholder-gray-400 outline-none text-sm bg-transparent"
            />
          </form>
          {search && (
            <Link href="/influencers" className="text-sm text-[#1A7A4A] font-medium hover:underline shrink-0 px-2">
              Clear
            </Link>
          )}
        </div>

        {influencers.length === 0 ? (
          <div className="bg-white rounded-3xl p-16 text-center border border-dashed border-gray-200">
            <p className="text-gray-400 text-lg">
              {search ? `No influencers found for "${search}"` : "No influencers yet."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {influencers.map((inf: any) => (
              <Link
                key={inf.id}
                href={`/influencers/${inf.slug}`}
                className="group bg-white rounded-3xl border border-gray-100 overflow-hidden hover:shadow-xl hover:border-[#1A7A4A]/20 transition-all duration-300"
              >
                {/* Team color banner */}
                <div
                  className="h-24 relative"
                  style={{ backgroundColor: inf.teamColor ? `${inf.teamColor}22` : "#E8F5EE" }}
                >
                  <div
                    className="absolute inset-0 opacity-10"
                    style={{ background: `radial-gradient(circle at 50% 50%, ${inf.teamColor || "#1A7A4A"}, transparent)` }}
                  />
                </div>

                {/* Avatar overlapping banner */}
                <div className="px-6 pb-6 -mt-10">
                  <div
                    className="w-20 h-20 rounded-2xl flex items-center justify-center overflow-hidden border-4 border-white shadow-md text-white text-2xl font-bold mb-3"
                    style={{ backgroundColor: inf.teamColor || "#1A7A4A" }}
                  >
                    {inf.profilePhoto ? (
                      <img src={inf.profilePhoto} alt={inf.name} className="w-full h-full object-cover" />
                    ) : (
                      inf.name.charAt(0).toUpperCase()
                    )}
                  </div>

                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-bold text-[#111827] font-['Outfit'] text-base flex items-center gap-1.5">
                        {inf.name}
                        {inf.isVerified && (
                          <BadgeCheck className="w-4 h-4 text-[#1A7A4A] shrink-0" />
                        )}
                      </h3>
                      {inf.teamSupported && (
                        <p className="text-sm text-gray-500 mt-0.5">{inf.teamSupported} Fan</p>
                      )}
                    </div>
                  </div>

                  {inf.bio && (
                    <p className="text-sm text-gray-500 mt-2 line-clamp-2">{inf.bio}</p>
                  )}

                  {/* Stats row */}
                  <div className="flex items-center gap-4 mt-4 pt-4 border-t border-gray-50">
                    <div>
                      <p className="text-lg font-bold text-[#111827] font-['Outfit']">
                        {inf.totalTicketsSold.toLocaleString()}
                      </p>
                      <p className="text-[10px] text-gray-400 uppercase tracking-wide">Fans served</p>
                    </div>
                    <div>
                      <p className="text-lg font-bold text-[#111827] font-['Outfit']">
                        {inf._count?.events ?? 0}
                      </p>
                      <p className="text-[10px] text-gray-400 uppercase tracking-wide">Events</p>
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
