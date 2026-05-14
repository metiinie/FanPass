"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import { Search, X, Ticket, Users } from "lucide-react";

interface Influencer {
  id: string;
  name: string;
  slug: string;
  profilePhoto?: string;
  teamSupported?: string;
  teamColor?: string;
  isVerified: boolean;
}

export default function PublicNav() {
  const pathname = usePathname();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Influencer[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleSearch = (value: string) => {
    setQuery(value);
    if (!value.trim()) {
      setResults([]);
      setOpen(false);
      return;
    }
    setOpen(true);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/influencers?search=${encodeURIComponent(value)}`,
          { cache: "no-store" }
        );
        const data = await res.json();
        setResults(Array.isArray(data) ? data.slice(0, 6) : []);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);
  };

  const isPublicRoute =
    !pathname.startsWith("/dashboard") &&
    !pathname.startsWith("/admin") &&
    !pathname.startsWith("/scan") &&
    !pathname.startsWith("/login");

  if (!isPublicRoute) return null;

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-[#0F1A14]/95 backdrop-blur-md border-b border-white/5">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center gap-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <div className="bg-[#1A7A4A] p-1.5 rounded-lg">
            <Ticket className="w-4 h-4 text-white" />
          </div>
          <span className="text-white font-bold font-['Outfit'] text-lg tracking-tight">
            FanPass
          </span>
        </Link>

        {/* Influencer Search — centre */}
        <div ref={searchRef} className="relative flex-1 max-w-md mx-auto">
          <div className="flex items-center bg-white/8 border border-white/10 rounded-xl px-3 gap-2 hover:border-white/20 transition-colors focus-within:border-[#1A7A4A]/60 focus-within:bg-white/10">
            <Search className="w-4 h-4 text-gray-400 shrink-0" />
            <input
              type="text"
              value={query}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Find your influencer..."
              className="flex-1 bg-transparent py-2.5 text-sm text-white placeholder-gray-500 outline-none"
            />
            {query && (
              <button onClick={() => { setQuery(""); setResults([]); setOpen(false); }}>
                <X className="w-4 h-4 text-gray-500 hover:text-white transition-colors" />
              </button>
            )}
          </div>

          {/* Search Dropdown */}
          {open && (
            <div className="absolute top-full mt-2 left-0 right-0 bg-[#1A2820] border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
              {loading ? (
                <div className="p-4 text-center text-sm text-gray-400 animate-pulse">
                  Searching...
                </div>
              ) : results.length === 0 ? (
                <div className="p-4 text-center text-sm text-gray-500">
                  No influencers found for "{query}"
                </div>
              ) : (
                <ul>
                  {results.map((inf) => (
                    <li key={inf.id}>
                      <Link
                        href={`/influencers/${inf.slug}`}
                        onClick={() => { setOpen(false); setQuery(""); setResults([]); }}
                        className="flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors"
                      >
                        {/* Avatar */}
                        <div
                          className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 overflow-hidden border-2"
                          style={{ borderColor: inf.teamColor || "#1A7A4A" }}
                        >
                          {inf.profilePhoto ? (
                            <img src={inf.profilePhoto} alt={inf.name} className="w-full h-full object-cover" />
                          ) : (
                            <span
                              className="text-sm font-bold text-white"
                              style={{ backgroundColor: inf.teamColor || "#1A7A4A" }}
                            >
                              {inf.name.charAt(0).toUpperCase()}
                            </span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-white truncate flex items-center gap-1">
                            {inf.name}
                            {inf.isVerified && (
                              <span className="text-[#1A7A4A] text-xs">✓</span>
                            )}
                          </p>
                          {inf.teamSupported && (
                            <p className="text-xs text-gray-400">{inf.teamSupported} Fan</p>
                          )}
                        </div>
                        <span className="text-xs text-[#1A7A4A] font-medium shrink-0">
                          View →
                        </span>
                      </Link>
                    </li>
                  ))}
                  <li className="border-t border-white/5">
                    <Link
                      href={`/influencers?search=${encodeURIComponent(query)}`}
                      onClick={() => { setOpen(false); }}
                      className="flex items-center gap-2 px-4 py-3 text-sm text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
                    >
                      <Users className="w-4 h-4" />
                      Browse all influencers
                    </Link>
                  </li>
                </ul>
              )}
            </div>
          )}
        </div>

        {/* Nav Links — right */}
        <nav className="hidden md:flex items-center gap-1 shrink-0">
          <Link
            href="/events"
            className="px-3 py-2 text-sm font-medium text-gray-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
          >
            Events
          </Link>
          <Link
            href="/influencers"
            className="px-3 py-2 text-sm font-medium text-gray-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
          >
            Influencers
          </Link>
          <Link
            href="/dashboard"
            className="ml-1 px-4 py-2 text-sm font-semibold text-[#0F1A14] bg-[#1A7A4A] rounded-xl hover:bg-[#22C55E] transition-colors"
          >
            Organizer Portal
          </Link>
        </nav>
      </div>
    </header>
  );
}
