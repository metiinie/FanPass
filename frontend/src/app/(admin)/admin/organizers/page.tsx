"use client";

import { useEffect, useState } from "react";
import { fetchBackend } from "@/lib/apiClient";
import { format } from "date-fns";
import { Users, Search, MoreVertical, ShieldAlert, ShieldCheck, ExternalLink } from "lucide-react";
import { toast } from "sonner";

export default function OrganizersPage() {
  const [organizers, setOrganizers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    loadOrganizers();
  }, []);

  const loadOrganizers = async () => {
    try {
      const response = await fetchBackend("/admin/organizers");
      setOrganizers(response.data);
    } catch (error) {
      toast.error("Failed to load organizers");
    } finally {
      setLoading(false);
    }
  };

  const toggleStatus = async (id: string, currentStatus: boolean) => {
    try {
      await fetchBackend(`/admin/organizers/${id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ isActive: !currentStatus }),
      });
      toast.success(`Organizer ${!currentStatus ? 'activated' : 'suspended'}`);
      loadOrganizers();
    } catch (error) {
      toast.error("Action failed");
    }
  };

  const filteredOrganizers = organizers.filter(o => 
    o.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    o.phone.includes(searchTerm)
  );

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold text-[#111827] font-['Outfit'] tracking-tight">Organizers</h2>
          <p className="text-[#6B7280] mt-1">Manage platform hosts and permissions</p>
        </div>
        
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF]" />
          <input 
            type="text"
            placeholder="Search by name or phone..."
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-[#E5E7EB] focus:ring-2 focus:ring-[#1A7A4A] focus:border-transparent outline-none transition-all text-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-[#E5E7EB]">
                <th className="px-6 py-4 text-xs font-bold text-[#6B7280] uppercase tracking-wider">Organizer</th>
                <th className="px-6 py-4 text-xs font-bold text-[#6B7280] uppercase tracking-wider">Contact</th>
                <th className="px-6 py-4 text-xs font-bold text-[#6B7280] uppercase tracking-wider">Events</th>
                <th className="px-6 py-4 text-xs font-bold text-[#6B7280] uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-bold text-[#6B7280] uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E7EB]">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-[#6B7280]">Loading organizers...</td>
                </tr>
              ) : filteredOrganizers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-[#6B7280]">No organizers found</td>
                </tr>
              ) : (
                filteredOrganizers.map((o) => (
                  <tr key={o.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-[#E8F5EE] flex items-center justify-center text-[#1A7A4A] font-bold">
                          {o.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-bold text-[#111827]">{o.name}</p>
                          <p className="text-xs text-[#6B7280]">Joined {format(new Date(o.createdAt), 'MMM d, yyyy')}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-[#6B7280]">{o.phone}</td>
                    <td className="px-6 py-4 text-sm font-medium text-[#111827]">{o._count?.events || 0} Events</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${o.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {o.isActive ? <ShieldCheck className="w-3 h-3" /> : <ShieldAlert className="w-3 h-3" />}
                        {o.isActive ? 'Active' : 'Suspended'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => toggleStatus(o.id, o.isActive)}
                        className={`text-sm font-bold px-4 py-2 rounded-lg transition-colors ${o.isActive ? 'text-red-600 hover:bg-red-50' : 'text-green-600 hover:bg-green-50'}`}
                      >
                        {o.isActive ? 'Suspend' : 'Activate'}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
