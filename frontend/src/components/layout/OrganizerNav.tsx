"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { LayoutDashboard, CalendarPlus, Users, LogOut, Ticket } from "lucide-react";

export default function OrganizerNav({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const navItems = [
    { name: "Overview", href: "/dashboard", icon: LayoutDashboard },
    { name: "My Profile", href: "/dashboard/profile", icon: Users },
    { name: "Create Event", href: "/dashboard/events/new", icon: CalendarPlus },
    { name: "Staff Management", href: "/dashboard/staff", icon: Users },
  ];

  return (
    <div className="min-h-screen bg-bg flex flex-col md:flex-row font-outfit text-white">
      {/* Sidebar - Desktop / Topbar - Mobile */}
      <aside className="w-full md:w-64 bg-brand-surface border-b md:border-b-0 md:border-r border-white/5 flex flex-col shrink-0 relative z-20">
        <div className="p-8 flex items-center gap-4">
          <div className="bg-brand-neon p-2.5 rounded-2xl text-bg shadow-glow-sm">
            <Ticket className="w-6 h-6 stroke-[2.5px]" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white tracking-tighter leading-none">FanPass</h1>
            <p className="text-[10px] font-black text-brand-neon uppercase tracking-[0.2em] mt-1">Organizer</p>
          </div>
        </div>

        <nav className="flex-1 px-4 py-2 md:py-8 flex md:flex-col gap-2 overflow-x-auto md:overflow-x-visible no-scrollbar">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`
                  flex items-center gap-3 px-5 py-3.5 rounded-2xl font-bold transition-all whitespace-nowrap tracking-tight
                  ${isActive 
                    ? "bg-brand-neon/10 text-brand-neon border border-brand-neon/20 shadow-glow-sm" 
                    : "text-gray-400 hover:bg-white/5 hover:text-white"
                  }
                `}
              >
                <Icon className={`w-5 h-5 ${isActive ? "text-brand-neon" : "text-gray-500"}`} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="p-6 mt-auto hidden md:block">
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="flex items-center gap-3 px-5 py-4 w-full rounded-2xl font-bold text-gray-500 hover:bg-red-500/10 hover:text-red-500 transition-all border border-transparent hover:border-red-500/20"
          >
            <LogOut className="w-5 h-5" />
            Sign out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto relative">
        {/* Background Decorative Glow */}
        <div className="fixed top-0 right-0 w-[800px] h-[800px] bg-brand-neon/5 blur-[150px] rounded-full pointer-events-none -z-10" />
        
        <div className="p-8 md:p-12 max-w-6xl mx-auto min-h-full">
          {children}
        </div>
      </main>
    </div>
  );
}
