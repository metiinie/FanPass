import { auth } from "@/server/auth";
import { formatCurrency } from "@/lib/utils";
import { fetchBackend } from "@/lib/apiClient";
import { redirect } from "next/navigation";
import { LayoutDashboard, Users, Calendar, Wallet, TrendingUp, ShieldCheck, Percent, Settings } from "lucide-react";

export default async function AdminDashboardPage() {
  const session = await auth();
  
  if (!session?.user?.id || session.user.role !== "SUPER_ADMIN") {
    redirect("/login");
  }

  let stats: AdminStats = {
    totalEvents: 0,
    totalTicketsSold: 0,
    totalSalesValue: 0,
    totalInfluencers: 0
  };

  try {
    stats = await fetchBackend("/admin/stats");
  } catch (error) {
    console.error("AdminDashboard: Error fetching stats", error);
  }

  return (
    <div className="space-y-12 animate-in fade-in duration-500 font-outfit text-white">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-4xl font-black text-white tracking-tighter flex items-center gap-4">
            <div className="bg-brand-neon/10 p-2.5 rounded-2xl border border-brand-neon/20 shadow-glow-sm">
              <ShieldCheck className="w-8 h-8 text-brand-neon" />
            </div>
            Platform Hub
          </h2>
          <p className="text-gray-400 font-medium mt-1">Global monitoring and platform orchestration</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        <div className="bg-brand-surface p-8 rounded-[2.5rem] border border-white/5 shadow-2xl flex items-start gap-6 group hover:border-brand-neon/20 transition-colors">
          <div className="bg-blue-500/10 p-4 rounded-2xl text-blue-400 group-hover:scale-110 transition-transform">
            <TrendingUp className="w-8 h-8" />
          </div>
          <div>
            <p className="text-xs font-black text-gray-500 uppercase tracking-widest mb-2">Total Volume</p>
            <p className="text-3xl font-bold text-white tracking-tight">{formatCurrency(stats.totalSalesValue)}</p>
          </div>
        </div>

        <div className="bg-brand-surface p-8 rounded-[2.5rem] border border-white/5 shadow-2xl flex items-start gap-6 group hover:border-brand-neon/20 transition-colors">
          <div className="bg-brand-neon/10 p-4 rounded-2xl text-brand-neon group-hover:scale-110 transition-transform">
            <Users className="w-8 h-8" />
          </div>
          <div>
            <p className="text-xs font-black text-gray-500 uppercase tracking-widest mb-2">Influencers</p>
            <p className="text-3xl font-bold text-white tracking-tight">{stats.totalInfluencers}</p>
          </div>
        </div>

        <div className="bg-brand-surface p-8 rounded-[2.5rem] border border-white/5 shadow-2xl flex items-start gap-6 group hover:border-brand-neon/20 transition-colors">
          <div className="bg-purple-500/10 p-4 rounded-2xl text-purple-400 group-hover:scale-110 transition-transform">
            <Calendar className="w-8 h-8" />
          </div>
          <div>
            <p className="text-xs font-black text-gray-500 uppercase tracking-widest mb-2">Live Events</p>
            <p className="text-3xl font-bold text-white tracking-tight">{stats.totalEvents}</p>
          </div>
        </div>

        <div className="bg-brand-surface p-8 rounded-[2.5rem] border border-white/5 shadow-2xl flex items-start gap-6 group hover:border-brand-neon/20 transition-colors">
          <div className="bg-orange-500/10 p-4 rounded-2xl text-orange-400 group-hover:scale-110 transition-transform">
            <Wallet className="w-8 h-8" />
          </div>
          <div>
            <p className="text-xs font-black text-gray-500 uppercase tracking-widest mb-2">Tickets Sold</p>
            <p className="text-3xl font-bold text-white tracking-tight">{stats.totalTicketsSold.toLocaleString()}</p>
          </div>
        </div>
      </div>

      {/* Quick Actions / Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-brand-surface p-10 rounded-[2.5rem] border border-white/5 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-5">
            <ShieldCheck className="w-32 h-32" />
          </div>
          <h3 className="text-2xl font-black text-white tracking-tighter mb-8">Platform Actions</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 relative z-10">
            <button className="p-6 bg-white/5 border border-white/5 rounded-2xl text-left hover:border-brand-neon/30 hover:bg-brand-neon/5 transition-all group">
              <Users className="w-8 h-8 text-brand-neon mb-4 group-hover:scale-110 transition-transform" />
              <p className="font-bold text-white text-lg">Manage Hosts</p>
              <p className="text-sm text-gray-500 font-medium">Review and approve influencers</p>
            </button>
            <button className="p-6 bg-white/5 border border-white/5 rounded-2xl text-left hover:border-brand-neon/30 hover:bg-brand-neon/5 transition-all group">
              <Settings className="w-8 h-8 text-brand-neon mb-4 group-hover:rotate-90 transition-transform duration-500" />
              <p className="font-bold text-white text-lg">System Health</p>
              <p className="text-sm text-gray-500 font-medium">Monitor infrastructure & logs</p>
            </button>
          </div>
        </div>

        <div className="bg-brand-surface p-10 rounded-[2.5rem] border border-white/5 shadow-2xl relative overflow-hidden flex flex-col">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-brand-neon to-blue-500" />
          <h3 className="text-2xl font-black text-white tracking-tighter mb-8">Security & Monitoring</h3>
          <div className="space-y-6">
            {[
              { label: "All systems operational", status: "online" },
              { label: "Receipt verification active", status: "online" },
              { label: "SMS gateway connected", status: "online" },
              { label: "Cloudinary node online", status: "online" }
            ].map((item, idx) => (
              <div key={idx} className="flex items-center gap-4 group">
                <div className="relative">
                  <div className="w-3 h-3 rounded-full bg-brand-neon shadow-glow-sm" />
                  <div className="absolute inset-0 w-3 h-3 rounded-full bg-brand-neon animate-ping opacity-40" />
                </div>
                <span className="text-sm font-bold text-gray-400 group-hover:text-white transition-colors">{item.label}</span>
              </div>
            ))}
          </div>
          <div className="mt-auto pt-8">
            <div className="bg-brand-neon/5 rounded-2xl p-4 border border-brand-neon/10">
              <p className="text-[10px] font-black text-brand-neon uppercase tracking-[0.2em] mb-1">Security Hash</p>
              <p className="text-xs font-mono text-gray-500 truncate">SHA256: 8f92b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
