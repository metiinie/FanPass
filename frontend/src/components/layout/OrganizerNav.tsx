"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { LayoutDashboard, CalendarPlus, Users, LogOut, Ticket } from "lucide-react";

export default function OrganizerNav({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const navItems = [
    { name: "Overview", href: "/dashboard", icon: LayoutDashboard },
    { name: "Create Event", href: "/dashboard/events/new", icon: CalendarPlus },
    { name: "Staff Management", href: "/dashboard/staff", icon: Users },
  ];

  return (
    <div className="min-h-screen bg-[#F8FAF9] flex flex-col md:flex-row">
      {/* Sidebar - Desktop / Topbar - Mobile */}
      <aside className="w-full md:w-64 bg-white border-b md:border-b-0 md:border-r border-[#E5E7EB] flex flex-col shrink-0">
        <div className="p-6 flex items-center gap-3">
          <div className="bg-[#1A7A4A] p-2 rounded-xl text-white shadow-sm">
            <Ticket className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold font-['Outfit'] text-[#111827] tracking-tight">FanPass</h1>
            <p className="text-xs font-medium text-[#6B7280] uppercase tracking-wider">Organizer</p>
          </div>
        </div>

        <nav className="flex-1 px-4 py-2 md:py-6 flex md:flex-col gap-2 overflow-x-auto md:overflow-x-visible no-scrollbar">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`
                  flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all whitespace-nowrap
                  ${isActive 
                    ? "bg-[#E8F5EE] text-[#1A7A4A]" 
                    : "text-[#6B7280] hover:bg-gray-50 hover:text-[#111827]"
                  }
                `}
              >
                <Icon className={`w-5 h-5 ${isActive ? "text-[#1A7A4A]" : "text-[#9CA3AF]"}`} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 mt-auto hidden md:block">
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="flex items-center gap-3 px-4 py-3 w-full rounded-xl font-medium text-[#6B7280] hover:bg-red-50 hover:text-red-600 transition-colors"
          >
            <LogOut className="w-5 h-5 text-[#9CA3AF]" />
            Sign out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="p-6 md:p-8 max-w-6xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
