"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import { Search, X, Ticket, Users, Command, ArrowRight } from "lucide-react";

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
  const [searchOpen, setSearchOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Handle scroll for sticky nav background
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Keyboard shortcut to open search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen(true);
        setTimeout(() => searchInputRef.current?.focus(), 100);
      }
      if (e.key === "Escape") {
        setSearchOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleSearch = (value: string) => {
    setQuery(value);
    if (!value.trim()) {
      setResults([]);
      return;
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/influencers?search=${encodeURIComponent(value)}`,
          { cache: "no-store" }
        );
        const data = await res.json();
        setResults(Array.isArray(data) ? data.slice(0, 5) : []);
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
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${
          isScrolled
            ? "bg-bg/80 backdrop-blur-xl border-b border-white/5 py-3 shadow-lg"
            : "bg-transparent py-5"
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between gap-4">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 shrink-0 group">
            <div className="bg-brand-surface p-2.5 rounded-2xl border border-white/5 group-hover:border-brand-neon/30 group-hover:shadow-glow-sm transition-all">
              <Ticket className="w-5 h-5 text-brand-neon" />
            </div>
            <span className="text-white font-black font-outfit text-2xl tracking-tighter uppercase">
              FanPass
            </span>
          </Link>

          {/* Nav Links */}
          <nav className="hidden md:flex items-center gap-8 bg-brand-surface/40 backdrop-blur-xl px-10 py-3 rounded-full border border-white/5 shadow-2xl">
            <Link href="/events" className="text-xs font-black uppercase tracking-[0.2em] text-gray-400 hover:text-brand-neon transition-colors">
              Discover
            </Link>
            <Link href="/influencers" className="text-xs font-black uppercase tracking-[0.2em] text-gray-400 hover:text-brand-neon transition-colors">
              Hosts
            </Link>
          </nav>

          {/* Right Actions */}
          <div className="flex items-center gap-4">
            {/* Search Trigger */}
            <button
              onClick={() => {
                setSearchOpen(true);
                setTimeout(() => searchInputRef.current?.focus(), 100);
              }}
              className="hidden sm:flex items-center gap-3 bg-brand-surface border border-white/5 hover:border-brand-neon/30 rounded-2xl px-5 py-3 text-xs font-medium text-gray-500 transition-all group shadow-lg"
            >
              <Search className="w-4 h-4 text-gray-500 group-hover:text-brand-neon transition-colors" />
              <span className="uppercase tracking-widest">Search matches...</span>
              <div className="flex items-center gap-0.5 ml-6 bg-white/5 px-2 py-1 rounded-lg text-[10px] text-gray-600">
                <Command className="w-3 h-3" />
                <span>K</span>
              </div>
            </button>
            <button
              onClick={() => setSearchOpen(true)}
              className="sm:hidden p-3.5 rounded-2xl bg-brand-surface border border-white/5 text-gray-400"
            >
              <Search className="w-5 h-5" />
            </button>

            <Link
              href="/dashboard"
              className="hidden lg:flex px-8 py-3 text-xs font-black uppercase tracking-[0.2em] text-bg bg-brand-neon hover:bg-white rounded-2xl transition-all shadow-glow-brand hover:shadow-glow-md"
            >
              Organizer Portal
            </Link>
          </div>
        </div>
      </header>

      {/* Command Palette Modal */}
      {searchOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 sm:pt-32 px-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in"
            onClick={() => setSearchOpen(false)}
          />
          <div className="relative w-full max-w-xl bg-brand-surface border border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-slide-up flex flex-col max-h-[80vh]">
            <div className="flex items-center px-4 py-4 border-b border-white/5">
              <Search className="w-5 h-5 text-brand-neon shrink-0" />
              <input
                ref={searchInputRef}
                type="text"
                value={query}
                onChange={(e) => handleSearch(e.target.value)}
                placeholder="Search hosts or matches..."
                className="flex-1 bg-transparent px-4 py-1 text-lg text-white placeholder-gray-500 outline-none"
              />
              <button
                onClick={() => setSearchOpen(false)}
                className="p-1 rounded-md text-gray-500 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-y-auto p-2">
              {!query ? (
                <div className="p-8 text-center text-gray-500">
                  <Ticket className="w-8 h-8 mx-auto mb-3 opacity-20" />
                  <p>Type to search across FanPass</p>
                </div>
              ) : loading ? (
                <div className="p-8 text-center text-gray-400 animate-pulse">
                  Searching...
                </div>
              ) : results.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  No results found for &quot;{query}&quot;
                </div>
              ) : (
                <div className="flex flex-col gap-1">
                  <p className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">Hosts</p>
                  {results.map((inf) => (
                    <Link
                      key={inf.id}
                      href={`/influencers/${inf.slug}`}
                      onClick={() => setSearchOpen(false)}
                      className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors group"
                    >
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 overflow-hidden border-2"
                        style={{ borderColor: inf.teamColor || "var(--primary)" }}
                      >
                        {inf.profilePhoto ? (
                          <img src={inf.profilePhoto} alt={inf.name} className="w-full h-full object-cover" />
                        ) : (
                          <span
                            className="text-sm font-bold text-white"
                            style={{ backgroundColor: inf.teamColor || "var(--primary)" }}
                          >
                            {inf.name.charAt(0).toUpperCase()}
                          </span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-white truncate flex items-center gap-1.5">
                          {inf.name}
                          {inf.isVerified && (
                            <span className="text-brand-neon text-xs">✓</span>
                          )}
                        </p>
                        {inf.teamSupported && (
                          <p className="text-xs text-gray-400">{inf.teamSupported} Fan</p>
                        )}
                      </div>
                      <ArrowRight className="w-4 h-4 text-gray-500 group-hover:text-white transition-colors" />
                    </Link>
                  ))}
                  <Link
                    href={`/influencers?search=${encodeURIComponent(query)}`}
                    onClick={() => setSearchOpen(false)}
                    className="flex items-center justify-between p-3 mt-2 rounded-xl bg-brand-neon/10 text-brand-neon hover:bg-brand-neon/20 transition-colors"
                  >
                    <span className="text-sm font-medium flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      See all hosts
                    </span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              )}
            </div>
            
            <div className="px-4 py-3 bg-white/[0.02] border-t border-white/5 text-xs text-gray-500 flex items-center gap-4">
              <span className="flex items-center gap-1"><kbd className="bg-white/10 px-1.5 py-0.5 rounded">↑</kbd><kbd className="bg-white/10 px-1.5 py-0.5 rounded">↓</kbd> to navigate</span>
              <span className="flex items-center gap-1"><kbd className="bg-white/10 px-1.5 py-0.5 rounded">esc</kbd> to close</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

