"use client";

import { useState, useEffect } from "react";
import { UserPlus, Search, Trash2, ShieldCheck, Edit2, X } from "lucide-react";
import { maskPhone } from "@/lib/utils";
import { useSession } from "next-auth/react";
import { fetchBackend } from "@/lib/apiClient";
import { toast } from "sonner";

export default function StaffManagementPage() {
  const [staff, setStaff] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const { data: session } = useSession();

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    eventId: "", // Initial assignment
  });
  const [editingStaffId, setEditingStaffId] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      const [staffData, eventsData] = await Promise.all([
        fetchBackend("/staff"),
        fetchBackend("/events"),
      ]);

      setStaff(staffData);
      setEvents(eventsData.filter((e: any) => e.status === "ACTIVE" || e.status === "DRAFT"));
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");

    try {
      if (editingStaffId) {
        await fetchBackend(`/staff/${editingStaffId}`, {
          method: "PATCH",
          body: JSON.stringify({ 
            name: formData.name, 
            phone: formData.phone,
            eventId: formData.eventId || undefined
          }),
        });
      } else {
        await fetchBackend("/staff", {
          method: "POST",
          body: JSON.stringify(formData),
        });
      }

      setFormData({ name: "", phone: "", eventId: "" });
      setEditingStaffId(null);
      toast.success(editingStaffId ? "Staff updated" : "Staff added");
      fetchData();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditStaff = (member: any) => {
    setEditingStaffId(member.id);
    setFormData({
      name: member.name,
      phone: member.phone,
      eventId: "", // Cannot change initial assignment after creation via this form
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDeleteStaff = async (staffId: string) => {
    if (!confirm("Are you sure you want to delete this staff member? This will also remove them from all assigned events.")) return;

    try {
      await fetchBackend(`/staff/${staffId}`, {
        method: "DELETE",
      });
      fetchData();
    } catch (err) {
      console.error(err);
      alert("Failed to delete staff member");
    }
  };

  const handleRemoveAssignment = async (staffId: string, eventId: string) => {
    if (!confirm("Remove this staff member from the event?")) return;

    try {
      await fetchBackend(`/events/${eventId}/staff/${staffId}`, {
        method: "DELETE",
      });
      fetchData();
    } catch (err) {
      console.error(err);
      alert("Failed to remove assignment");
    }
  };

  if (isLoading) {
    return <div className="flex justify-center p-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1A7A4A]"></div></div>;
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <div>
        <h2 className="text-3xl font-bold text-[#111827] font-['Outfit'] tracking-tight">Staff Management</h2>
        <p className="text-[#6B7280] mt-1">Add scanners and manage their event assignments.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Add Staff Form */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm overflow-hidden sticky top-6">
            <div className="p-6 border-b border-[#E5E7EB] bg-gray-50 flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-[#6B7280]" />
              <h3 className="font-bold text-[#111827] font-['Outfit'] text-lg">
                {editingStaffId ? "Edit Staff Member" : "Add New Staff"}
              </h3>
            </div>
            
            <div className="p-6">
              {error && (
                <div className="mb-4 p-3 rounded-xl bg-red-50 text-red-600 text-sm border border-red-100">
                  {error}
                </div>
              )}
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[#111827] mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="Selam Tadesse"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2 rounded-xl border border-[#E5E7EB] focus:border-[#1A7A4A] focus:outline-none transition-colors text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#111827] mb-1">Phone Number *</label>
                  <input
                    type="tel"
                    required
                    placeholder="+251922..."
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-4 py-2 rounded-xl border border-[#E5E7EB] focus:border-[#1A7A4A] focus:outline-none transition-colors text-sm"
                  />
                  <p className="text-xs text-[#6B7280] mt-1">They will use this to login via SMS OTP.</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#111827] mb-1">Assign to Event (Optional)</label>
                  <select
                    value={formData.eventId}
                    onChange={(e) => setFormData({ ...formData, eventId: e.target.value })}
                    className="w-full px-4 py-2 rounded-xl border border-[#E5E7EB] focus:border-[#1A7A4A] focus:outline-none transition-colors text-sm bg-white"
                  >
                    <option value="">-- No initial assignment --</option>
                    {events.map((e) => (
                      <option key={e.id} value={e.id}>{e.title}</option>
                    ))}
                  </select>
                </div>
                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={isSubmitting || !formData.name || !formData.phone}
                    className="flex-1 py-2.5 rounded-xl font-medium tracking-wide bg-[#1A7A4A] text-white hover:bg-[#0F4D2E] disabled:opacity-50 transition-colors shadow-sm"
                  >
                    {isSubmitting ? (editingStaffId ? "Saving..." : "Adding...") : (editingStaffId ? "Save Changes" : "Add Staff Member")}
                  </button>
                  {editingStaffId && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingStaffId(null);
                        setFormData({ name: "", phone: "", eventId: "" });
                      }}
                      className="px-3 py-2.5 rounded-xl border border-[#E5E7EB] text-[#6B7280] hover:bg-gray-50 transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  )}
                </div>
              </form>
            </div>
          </div>
        </div>

        {/* Staff List */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm overflow-hidden">
            <div className="p-6 border-b border-[#E5E7EB] bg-white flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <h3 className="font-bold text-[#111827] font-['Outfit'] text-lg">Active Staff</h3>
              <div className="relative w-full sm:w-auto">
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                <input 
                  type="text" 
                  placeholder="Search staff..." 
                  className="w-full sm:w-64 pl-9 pr-4 py-2 rounded-full border border-gray-200 text-sm focus:outline-none focus:border-[#1A7A4A]"
                />
              </div>
            </div>

            <div className="divide-y divide-[#E5E7EB]">
              {staff.length === 0 ? (
                <div className="p-12 text-center text-[#6B7280]">
                  No staff members added yet.
                </div>
              ) : (
                staff.map((member) => (
                  <div key={member.id} className="p-6 hover:bg-gray-50 transition-colors flex flex-col sm:flex-row gap-6 justify-between">
                    <div>
                      <h4 className="font-bold text-[#111827] flex items-center gap-2">
                        {member.name}
                        <ShieldCheck className="w-4 h-4 text-[#1A7A4A]" />
                      </h4>
                      <p className="text-sm text-[#6B7280] mt-1">{member.phone}</p>
                      <div className="flex gap-3 mt-3">
                        <button 
                          onClick={() => handleEditStaff(member)}
                          className="text-xs font-medium text-[#1A7A4A] hover:underline flex items-center gap-1"
                        >
                          <Edit2 className="w-3 h-3" /> Edit
                        </button>
                        <button 
                          onClick={() => handleDeleteStaff(member.id)}
                          className="text-xs font-medium text-red-500 hover:underline flex items-center gap-1"
                        >
                          <Trash2 className="w-3 h-3" /> Delete
                        </button>
                      </div>
                    </div>

                    <div className="sm:w-64 shrink-0">
                      <p className="text-xs font-medium text-[#6B7280] uppercase tracking-wider mb-2">Assigned Events</p>
                      {member.assignments.length === 0 ? (
                        <span className="text-sm text-gray-400 italic">No events assigned</span>
                      ) : (
                        <div className="space-y-2">
                          {member.assignments.map((assignment: any) => (
                            <div key={assignment.eventId} className="flex items-center justify-between bg-white border border-gray-200 rounded-lg px-3 py-1.5 shadow-sm">
                              <span className="text-sm font-medium text-[#111827] truncate mr-2" title={assignment.event.title}>
                                {assignment.event.title}
                                {assignment.event.status === 'DRAFT' && (
                                  <span className="ml-2 text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">DRAFT</span>
                                )}
                              </span>
                              <button 
                                onClick={() => handleRemoveAssignment(member.id, assignment.eventId)}
                                className="text-gray-400 hover:text-red-500 transition-colors"
                                title="Remove assignment"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
