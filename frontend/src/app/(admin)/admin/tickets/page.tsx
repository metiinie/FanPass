"use client";

import { useEffect, useState } from "react";
import { fetchBackend } from "@/lib/apiClient";
import { format } from "date-fns";
import { Ticket, Search, Filter, ArrowUpRight, CheckCircle2, XCircle, Clock } from "lucide-react";
import { toast } from "sonner";
import { formatCurrency } from "@/lib/utils";

export default function AdminTicketsPage() {
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    loadTickets();
  }, []);

  const loadTickets = async () => {
    try {
      const data = await fetchBackend("/admin/tickets");
      setTickets(data);
    } catch (error) {
      toast.error("Failed to load tickets");
    } finally {
      setLoading(false);
    }
  };

  const filteredTickets = tickets.filter(t => 
    t.buyerPhone.includes(searchTerm) || 
    t.event.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ISSUED': return 'bg-green-100 text-green-700';
      case 'SCANNED': return 'bg-blue-100 text-blue-700';
      case 'REFUNDED': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold text-[#111827] font-['Outfit'] tracking-tight">Tickets & Transactions</h2>
          <p className="text-[#6B7280] mt-1">Audit all issued tickets and payment statuses</p>
        </div>
        
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF]" />
          <input 
            type="text"
            placeholder="Search phone or event..."
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-[#E5E7EB] focus:ring-2 focus:ring-[#1A7A4A] outline-none text-sm"
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
                <th className="px-6 py-4 text-xs font-bold text-[#6B7280] uppercase tracking-wider">Ticket / ID</th>
                <th className="px-6 py-4 text-xs font-bold text-[#6B7280] uppercase tracking-wider">Event</th>
                <th className="px-6 py-4 text-xs font-bold text-[#6B7280] uppercase tracking-wider">Buyer Phone</th>
                <th className="px-6 py-4 text-xs font-bold text-[#6B7280] uppercase tracking-wider">Amount</th>
                <th className="px-6 py-4 text-xs font-bold text-[#6B7280] uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-bold text-[#6B7280] uppercase tracking-wider text-right">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E7EB]">
              {loading ? (
                <tr><td colSpan={6} className="px-6 py-12 text-center text-[#6B7280]">Loading...</td></tr>
              ) : filteredTickets.length === 0 ? (
                <tr><td colSpan={6} className="px-6 py-12 text-center text-[#6B7280]">No tickets found</td></tr>
              ) : (
                filteredTickets.map((t) => (
                  <tr key={t.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="bg-gray-100 p-2 rounded-lg"><Ticket className="w-4 h-4 text-gray-500" /></div>
                        <span className="font-mono text-xs text-[#6B7280]">{t.id.slice(0, 8)}...</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-bold text-[#111827] text-sm truncate max-w-[150px]">{t.event.title}</p>
                    </td>
                    <td className="px-6 py-4 text-sm text-[#111827]">{t.buyerPhone}</td>
                    <td className="px-6 py-4 text-sm font-bold text-[#111827]">
                      {formatCurrency(t.event.ticketPrice * (t.ticketCount || 1))}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${getStatusColor(t.status)}`}>
                        {t.status === 'SCANNED' ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                        {t.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right text-xs text-[#6B7280]">
                      {format(new Date(t.issuedAt), 'MMM d, HH:mm')}
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
