"use client";

import { useEffect, useState } from "react";
import { fetchBackend } from "@/lib/apiClient";
import { Settings, Save, ShieldCheck, Percent, CreditCard } from "lucide-react";
import { toast } from "sonner";

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<any>({
    telebirrAppId: "",
    telebirrAppKey: "",
    telebirrSecret: "",
    telebirrShortCode: "",
    commissionRate: 0.1,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const response = await fetchBackend("/admin/settings");
      setSettings(response.data);
    } catch (error) {
      toast.error("Failed to load settings");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      // Ensure commissionRate is a float
      const payload = {
        ...settings,
        commissionRate: parseFloat(settings.commissionRate)
      };
      await fetchBackend("/admin/settings", {
        method: "PATCH",
        body: JSON.stringify(payload),
      });
      toast.success("Settings updated successfully");
    } catch (error) {
      toast.error("Failed to update settings");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-8 text-center">Loading settings...</div>;

  return (
    <div className="max-w-4xl space-y-8 animate-in fade-in duration-500">
      <div>
        <h2 className="text-3xl font-bold text-[#111827] font-['Outfit'] tracking-tight flex items-center gap-3">
          <Settings className="w-8 h-8 text-[#1A7A4A]" />
          Platform Settings
        </h2>
        <p className="text-[#6B7280] mt-1">Configure global payment providers and system rates</p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Payment Provider Config */}
        <div className="bg-white p-8 rounded-2xl border border-[#E5E7EB] shadow-sm space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-[#E5E7EB]">
            <CreditCard className="w-6 h-6 text-[#1A7A4A]" />
            <h3 className="text-xl font-bold text-[#111827] font-['Outfit']">Telebirr Configuration</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-[#374151]">App ID</label>
              <input 
                type="text"
                value={settings.telebirrAppId || ""}
                onChange={(e) => setSettings({...settings, telebirrAppId: e.target.value})}
                className="w-full px-4 py-2.5 rounded-xl border border-[#E5E7EB] focus:ring-2 focus:ring-[#1A7A4A] outline-none transition-all"
                placeholder="Enter Telebirr App ID"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-[#374151]">App Key</label>
              <input 
                type="password"
                value={settings.telebirrAppKey || ""}
                onChange={(e) => setSettings({...settings, telebirrAppKey: e.target.value})}
                className="w-full px-4 py-2.5 rounded-xl border border-[#E5E7EB] focus:ring-2 focus:ring-[#1A7A4A] outline-none transition-all"
                placeholder="Enter Telebirr App Key"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-[#374151]">Secret Key</label>
              <input 
                type="password"
                value={settings.telebirrSecret || ""}
                onChange={(e) => setSettings({...settings, telebirrSecret: e.target.value})}
                className="w-full px-4 py-2.5 rounded-xl border border-[#E5E7EB] focus:ring-2 focus:ring-[#1A7A4A] outline-none transition-all"
                placeholder="Enter Telebirr Secret"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-[#374151]">Short Code</label>
              <input 
                type="text"
                value={settings.telebirrShortCode || ""}
                onChange={(e) => setSettings({...settings, telebirrShortCode: e.target.value})}
                className="w-full px-4 py-2.5 rounded-xl border border-[#E5E7EB] focus:ring-2 focus:ring-[#1A7A4A] outline-none transition-all"
                placeholder="Enter Telebirr Short Code"
              />
            </div>
          </div>
        </div>

        {/* Commission Config */}
        <div className="bg-white p-8 rounded-2xl border border-[#E5E7EB] shadow-sm space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-[#E5E7EB]">
            <Percent className="w-6 h-6 text-[#1A7A4A]" />
            <h3 className="text-xl font-bold text-[#111827] font-['Outfit']">Financial Rates</h3>
          </div>

          <div className="max-w-xs space-y-2">
            <label className="text-sm font-bold text-[#374151]">Commission Rate (Decimal)</label>
            <div className="relative">
              <input 
                type="number"
                step="0.01"
                min="0"
                max="1"
                value={settings.commissionRate}
                onChange={(e) => setSettings({...settings, commissionRate: e.target.value})}
                className="w-full pl-4 pr-12 py-2.5 rounded-xl border border-[#E5E7EB] focus:ring-2 focus:ring-[#1A7A4A] outline-none transition-all"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 font-bold text-[#6B7280]">
                {(settings.commissionRate * 100).toFixed(0)}%
              </span>
            </div>
            <p className="text-xs text-[#6B7280]">The percentage FanPass takes from each ticket sale.</p>
          </div>
        </div>

        <div className="flex justify-end">
          <button 
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 bg-[#111827] text-white px-8 py-3 rounded-xl font-bold hover:bg-black transition-all shadow-lg disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save Settings"}
            <Save className="w-5 h-5" />
          </button>
        </div>
      </form>
    </div>
  );
}
