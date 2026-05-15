"use client";

import { useEffect, useState } from "react";
import { fetchBackend } from "@/lib/apiClient";
import { format } from "date-fns";
import { 
  Users, Search, ShieldAlert, ShieldCheck, 
  Plus, Edit2, Trash2, X, Info
} from "lucide-react";
import { toast } from "sonner";
import { Influencer } from "@/types";

export default function InfluencersPage() {
  const [influencers, setInfluencers] = useState<Influencer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingInfluencer, setEditingInfluencer] = useState<Influencer | null>(null);
  
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    teamSupported: "",
    bio: "",
    slug: ""
  });

  useEffect(() => {
    loadInfluencers();
  }, []);

  const loadInfluencers = async () => {
    try {
      const data = await fetchBackend("/admin/influencers");
      setInfluencers(data);
    } catch (error) {
      toast.error("Failed to load influencers");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (editingInfluencer) {
        await fetchBackend(`/admin/influencers/${editingInfluencer.id}`, {
          method: "PATCH",
          body: JSON.stringify(formData),
        });
      } else {
        await fetchBackend("/admin/influencers", {
          method: "POST",
          body: JSON.stringify(formData),
        });
      }

      toast.success(editingInfluencer ? "Influencer updated" : "Influencer onboarded");
      setIsModalOpen(false);
      setEditingInfluencer(null);
      setFormData({ name: "", phone: "", teamSupported: "", bio: "", slug: "" });
      loadInfluencers();
    } catch (error: any) {
      toast.error(error.message || "Operation failed. Check if phone/slug is unique.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEdit = (influencer: Influencer) => {
    setEditingInfluencer(influencer);
    setFormData({
      name: influencer.name,
      phone: influencer.phone,
      teamSupported: influencer.teamSupported || "",
      bio: influencer.bio || "",
      slug: influencer.slug || ""
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to suspend this influencer? This will hide them from public discovery.")) return;
    try {
      await fetchBackend(`/admin/influencers/${id}`, { method: "DELETE" });
      toast.success("Influencer suspended successfully");
      loadInfluencers();
    } catch (error: any) {
      toast.error(error.message || "Action failed");
    }
  };

  const toggleStatus = async (id: string, currentStatus: boolean) => {
    try {
      await fetchBackend(`/admin/influencers/${id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ isActive: !currentStatus }),
      });
      toast.success(`Influencer ${!currentStatus ? 'activated' : 'suspended'}`);
      loadInfluencers();
    } catch (error: any) {
      toast.error(error.message || "Status update failed");
    }
  };

  const filteredInfluencers = influencers.filter((o: Influencer) => 
    o.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    o.phone.includes(searchTerm)
  );

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold text-[#111827] font-['Outfit'] tracking-tight">Influencers</h2>
          <p className="text-[#6B7280] mt-1">Manage platform hosts and overall permissions</p>
        </div>
        
        <button 
          onClick={() => {
            setEditingInfluencer(null);
            setFormData({ name: "", phone: "", teamSupported: "", bio: "", slug: "" });
            setIsModalOpen(true);
          }}
          className="flex items-center gap-2 bg-[#1A7A4A] text-white px-6 py-2.5 rounded-xl font-bold hover:bg-[#0F4D2E] transition-all shadow-sm"
        >
          <Plus className="w-5 h-5" /> Onboard Influencer
        </button>
      </div>

      {/* Filters */}
      <div className="flex justify-end">
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

      {/* Table */}
      <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-[#E5E7EB]">
                <th className="px-6 py-4 text-xs font-bold text-[#6B7280] uppercase tracking-wider">Influencer</th>
                <th className="px-6 py-4 text-xs font-bold text-[#6B7280] uppercase tracking-wider">Contact</th>
                <th className="px-6 py-4 text-xs font-bold text-[#6B7280] uppercase tracking-wider">Team</th>
                <th className="px-6 py-4 text-xs font-bold text-[#6B7280] uppercase tracking-wider">Events</th>
                <th className="px-6 py-4 text-xs font-bold text-[#6B7280] uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-bold text-[#6B7280] uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E7EB]">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-[#6B7280]">Loading influencers...</td>
                </tr>
              ) : filteredInfluencers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-[#6B7280]">No influencers found</td>
                </tr>
              ) : (
                filteredInfluencers.map((o: Influencer) => (
                  <tr key={o.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {o.profilePhoto ? (
                          <img src={o.profilePhoto} className="w-10 h-10 rounded-full object-cover border" alt="" />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-[#E8F5EE] flex items-center justify-center text-[#1A7A4A] font-bold">
                            {o.name.charAt(0)}
                          </div>
                        )}
                        <div>
                          <div className="flex items-center gap-1">
                            <p className="font-bold text-[#111827]">{o.name}</p>
                            {o.isVerified && <ShieldCheck className="w-3.5 h-3.5 text-[#1A7A4A]" />}
                          </div>
                          <p className="text-xs text-[#6B7280]">Joined {format(new Date(o.createdAt), 'MMM d, yyyy')}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-[#6B7280]">{o.phone}</td>
                    <td className="px-6 py-4 text-sm font-medium text-[#111827]">{o.teamSupported || "N/A"}</td>
                    <td className="px-6 py-4 text-sm font-medium text-[#111827]">{o._count?.events || 0} Events</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${o.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {o.isActive ? 'Active' : 'Suspended'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <button 
                        onClick={() => openEdit(o)}
                        className="p-2 text-gray-400 hover:text-[#1A7A4A] transition-colors"
                        title="Edit Profile"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => toggleStatus(o.id, o.isActive)}
                        className={`p-2 transition-colors ${o.isActive ? 'text-gray-400 hover:text-red-600' : 'text-gray-400 hover:text-green-600'}`}
                        title={o.isActive ? "Suspend" : "Activate"}
                      >
                        <ShieldAlert className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-[#E5E7EB] flex justify-between items-center bg-gray-50">
              <h3 className="font-bold text-lg text-[#111827] font-['Outfit']">
                {editingInfluencer ? 'Edit Influencer' : 'Onboard New Influencer'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-xs font-bold text-[#6B7280] uppercase mb-1">Full Name</label>
                  <input 
                    required
                    type="text"
                    className="w-full px-4 py-2 rounded-xl border border-[#E5E7EB] outline-none focus:border-[#1A7A4A]"
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                  />
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-xs font-bold text-[#6B7280] uppercase mb-1">Phone Number</label>
                  <input 
                    required
                    type="tel"
                    placeholder="+251..."
                    className="w-full px-4 py-2 rounded-xl border border-[#E5E7EB] outline-none focus:border-[#1A7A4A]"
                    value={formData.phone}
                    onChange={e => setFormData({...formData, phone: e.target.value})}
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-[#6B7280] uppercase mb-1">Team Supported</label>
                  <input 
                    type="text"
                    placeholder="e.g. Arsenal"
                    className="w-full px-4 py-2 rounded-xl border border-[#E5E7EB] outline-none focus:border-[#1A7A4A]"
                    value={formData.teamSupported}
                    onChange={e => setFormData({...formData, teamSupported: e.target.value})}
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-[#6B7280] uppercase mb-1">Profile Slug (Optional)</label>
                  <input 
                    type="text"
                    placeholder="e.g. awol-arsenal"
                    className="w-full px-4 py-2 rounded-xl border border-[#E5E7EB] outline-none focus:border-[#1A7A4A]"
                    value={formData.slug}
                    onChange={e => setFormData({...formData, slug: e.target.value})}
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-[#6B7280] uppercase mb-1">Bio</label>
                  <textarea 
                    rows={3}
                    className="w-full px-4 py-2 rounded-xl border border-[#E5E7EB] outline-none focus:border-[#1A7A4A]"
                    value={formData.bio}
                    onChange={e => setFormData({...formData, bio: e.target.value})}
                  />
                </div>
              </div>

              <div className="bg-blue-50 p-3 rounded-xl flex gap-3 text-sm text-blue-700 border border-blue-100 mt-2">
                <Info className="w-5 h-5 shrink-0" />
                <p>Creating an influencer account allows them to log in via phone OTP and start hosting events.</p>
              </div>

              <div className="flex gap-3 pt-4">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-6 py-2.5 rounded-xl border border-gray-200 font-bold hover:bg-gray-50 transition-all"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 bg-[#1A7A4A] text-white px-6 py-2.5 rounded-xl font-bold hover:bg-[#0F4D2E] transition-all disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving...' : editingInfluencer ? 'Update' : 'Onboard'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
