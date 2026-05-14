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

  let stats: any = {
    totalEvents: 0,
    totalTicketsSold: 0,
    totalSalesValue: 0,
    totalOrganizers: 0
  };

  try {
    const response = await fetchBackend("/admin/stats");
    stats = response.data;
  } catch (error) {
    console.error("AdminDashboard: Error fetching stats", error);
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-[#111827] font-['Outfit'] tracking-tight flex items-center gap-3">
            <ShieldCheck className="w-8 h-8 text-[#1A7A4A]" />
            Platform Overview
          </h2>
          <p className="text-[#6B7280] mt-1">Global monitoring and platform health</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-[#E5E7EB] shadow-sm flex items-start gap-4">
          <div className="bg-blue-50 p-3 rounded-xl text-blue-600">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-[#6B7280] uppercase tracking-wider mb-1">Total Ticket Value</p>
            <p className="text-2xl font-bold font-['Outfit'] text-[#111827]">{formatCurrency(stats.totalSalesValue)}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-[#E5E7EB] shadow-sm flex items-start gap-4">
          <div className="bg-green-50 p-3 rounded-xl text-green-600">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-[#6B7280] uppercase tracking-wider mb-1">Organizers</p>
            <p className="text-2xl font-bold font-['Outfit'] text-[#111827]">{stats.totalOrganizers}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-[#E5E7EB] shadow-sm flex items-start gap-4">
          <div className="bg-purple-50 p-3 rounded-xl text-purple-600">
            <Calendar className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-[#6B7280] uppercase tracking-wider mb-1">Live Events</p>
            <p className="text-2xl font-bold font-['Outfit'] text-[#111827]">{stats.totalEvents}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-[#E5E7EB] shadow-sm flex items-start gap-4">
          <div className="bg-orange-50 p-3 rounded-xl text-orange-600">
            <Wallet className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-[#6B7280] uppercase tracking-wider mb-1">Tickets Sold</p>
            <p className="text-2xl font-bold font-['Outfit'] text-[#111827]">{stats.totalTicketsSold.toLocaleString()}</p>
          </div>
        </div>
      </div>

      {/* Quick Actions / Recent Activity Placeholder */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-8 rounded-2xl border border-[#E5E7EB] shadow-sm">
          <h3 className="text-xl font-bold text-[#111827] font-['Outfit'] mb-6">Platform Actions</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button className="p-4 border border-[#E5E7EB] rounded-xl text-left hover:border-[#1A7A4A] hover:bg-[#F8FAF9] transition-all group">
              <Users className="w-6 h-6 text-[#1A7A4A] mb-3" />
              <p className="font-bold text-[#111827]">Manage Organizers</p>
              <p className="text-sm text-[#6B7280]">Review and approve hosts</p>
            </button>
            <button className="p-4 border border-[#E5E7EB] rounded-xl text-left hover:border-[#1A7A4A] hover:bg-[#F8FAF9] transition-all group">
              <Settings className="w-6 h-6 text-[#1A7A4A] mb-3" />
              <p className="font-bold text-[#111827]">System Health</p>
              <p className="text-sm text-[#6B7280]">Monitor logs and metrics</p>
            </button>
          </div>
        </div>

        <div className="bg-[#111827] p-8 rounded-2xl shadow-xl text-white">
          <h3 className="text-xl font-bold font-['Outfit'] mb-6">Security & Monitoring</h3>
          <ul className="space-y-4">
            <li className="flex items-center gap-3 text-sm text-gray-400">
              <div className="w-2 h-2 rounded-full bg-green-500" />
              All systems operational
            </li>
            <li className="flex items-center gap-3 text-sm text-gray-400">
              <div className="w-2 h-2 rounded-full bg-green-500" />
              Receipt verification active
            </li>
            <li className="flex items-center gap-3 text-sm text-gray-400">
              <div className="w-2 h-2 rounded-full bg-green-500" />
              SMS gateway connected
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
