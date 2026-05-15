"use client";

import { useState, useRef, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Camera, Save, CheckCircle, AlertCircle, ExternalLink, Loader2 } from "lucide-react";
import { fetchBackend } from "@/lib/apiClient";
import { Influencer } from "@/types";

const TEAM_OPTIONS = [
  { label: "Arsenal", color: "#EF0107" },
  { label: "Man United", color: "#DA020E" },
  { label: "Chelsea", color: "#034694" },
  { label: "Liverpool", color: "#C8102E" },
  { label: "Man City", color: "#6CABDD" },
  { label: "Tottenham", color: "#132257" },
  { label: "Real Madrid", color: "#FEBE10" },
  { label: "Barcelona", color: "#A50044" },
  { label: "PSG", color: "#004170" },
  { label: "Bayern Munich", color: "#DC052D" },
  { label: "Other", color: "#1A7A4A" },
];

export default function InfluencerProfilePage() {
  const { data: session } = useSession();
  const [profile, setProfile] = useState<Influencer | null>(null);
  const [form, setForm] = useState<Partial<Influencer>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;

  useEffect(() => {
    fetchProfile();
  }, []);

  async function fetchProfile() {
    try {
      const data = await fetchBackend("/influencers/me");
      setProfile(data);
      setForm({
        name: data.name || "",
        slug: data.slug || "",
        bio: data.bio || "",
        profilePhoto: data.profilePhoto || "",
        teamSupported: data.teamSupported || "",
        teamColor: data.teamColor || "",
        tiktokUrl: data.tiktokUrl || "",
        instagramUrl: data.instagramUrl || "",
        telegramUrl: data.telegramUrl || "",
      });
    } catch (e) {
      setError("Failed to load profile.");
    } finally {
      setLoading(false);
    }
  }

  async function handlePhotoUpload(file: File) {
    setUploadingPhoto(true);
    setError("");
    try {
      // 1. Get signed upload parameters from backend
      const sigData = await fetchBackend("/influencers/upload-signature", {
        method: "POST",
      });
      const { timestamp, signature, cloudName, apiKey, folder } = sigData;

      // 2. Upload directly to Cloudinary (file never touches our server)
      const formData = new FormData();
      formData.append("file", file);
      formData.append("timestamp", timestamp);
      formData.append("signature", signature);
      formData.append("api_key", apiKey);
      formData.append("folder", folder);

      const uploadRes = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
        { method: "POST", body: formData }
      );
      const uploadData = await uploadRes.json();

      if (uploadData.secure_url) {
        setForm((f: Partial<Influencer>) => ({ ...f, profilePhoto: uploadData.secure_url }));
      } else {
        setError("Photo upload failed. Please try again.");
      }
    } catch {
      setError("Photo upload failed. Check your Cloudinary credentials.");
    } finally {
      setUploadingPhoto(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    setError("");
    setSuccess(false);
    try {
      const data = await fetchBackend("/influencers/me", {
        method: "PATCH",
        body: JSON.stringify(form),
      });
      setProfile(data);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 4000);
    } catch (e: any) {
      setError(e.message || "Failed to save profile.");
    } finally {
      setSaving(false);
    }
  }

  const selectedTeam = TEAM_OPTIONS.find((t) => t.label === form.teamSupported);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-[#1A7A4A] animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-300 max-w-2xl">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-[#111827] font-['Outfit']">My Profile</h2>
          <p className="text-[#6B7280] mt-1">This is what fans see on your public page.</p>
        </div>
        {form.slug && (
          <a
            href={`/influencers/${form.slug}`}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 text-sm text-[#1A7A4A] font-medium hover:underline"
          >
            View Public Profile <ExternalLink className="w-4 h-4" />
          </a>
        )}
      </div>

      {/* Alerts */}
      {success && (
        <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-xl text-green-700">
          <CheckCircle className="w-5 h-5 shrink-0" />
          Profile saved successfully!
        </div>
      )}
      {error && (
        <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700">
          <AlertCircle className="w-5 h-5 shrink-0" />
          {error}
        </div>
      )}

      {/* Profile Photo */}
      <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6 space-y-4">
        <h3 className="font-semibold text-[#111827]">Profile Photo</h3>
        <div className="flex items-center gap-5">
          <div
            className="w-20 h-20 rounded-2xl flex items-center justify-center overflow-hidden text-white text-2xl font-bold shrink-0 border-2"
            style={{ backgroundColor: form.teamColor || "#1A7A4A", borderColor: form.teamColor || "#1A7A4A" }}
          >
            {form.profilePhoto ? (
              <img src={form.profilePhoto} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              (form.name || "?").charAt(0).toUpperCase()
            )}
          </div>
          <div className="space-y-2">
            <button
              onClick={() => fileRef.current?.click()}
              disabled={uploadingPhoto}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#F3F4F6] hover:bg-[#E5E7EB] text-[#374151] font-medium text-sm transition-colors disabled:opacity-50"
            >
              {uploadingPhoto ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Uploading...</>
              ) : (
                <><Camera className="w-4 h-4" /> Upload Photo</>
              )}
            </button>
            <p className="text-xs text-gray-400">JPG, PNG or WEBP. Max 5MB. Uploads to Cloudinary.</p>
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handlePhotoUpload(file);
              }}
            />
          </div>
        </div>
      </div>

      {/* Basic Info */}
      <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6 space-y-5">
        <h3 className="font-semibold text-[#111827]">Basic Info</h3>

        <div className="space-y-1">
          <label className="text-sm font-medium text-[#374151]">Display Name</label>
          <input
            value={form.name || ""}
            onChange={(e) => setForm((f: Partial<Influencer>) => ({ ...f, name: e.target.value }))}
            className="w-full border-2 border-[#E5E7EB] rounded-xl px-4 py-3 text-[#111827] focus:border-[#1A7A4A] outline-none transition-colors"
            placeholder="Your name as fans will see it"
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium text-[#374151]">
            Profile URL Slug
            <span className="text-gray-400 font-normal ml-1">· fanpass.com/influencers/<strong>{form.slug || "your-slug"}</strong></span>
          </label>
          <input
            value={form.slug || ""}
            onChange={(e) => setForm((f: Partial<Influencer>) => ({ ...f, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-") }))}
            className="w-full border-2 border-[#E5E7EB] rounded-xl px-4 py-3 text-[#111827] focus:border-[#1A7A4A] outline-none transition-colors font-mono text-sm"
            placeholder="your-name"
          />
          <p className="text-xs text-gray-400">Lowercase letters, numbers, and hyphens only.</p>
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium text-[#374151]">Bio / Tagline</label>
          <textarea
            value={form.bio || ""}
            onChange={(e) => setForm((f: Partial<Influencer>) => ({ ...f, bio: e.target.value }))}
            rows={3}
            className="w-full border-2 border-[#E5E7EB] rounded-xl px-4 py-3 text-[#111827] focus:border-[#1A7A4A] outline-none transition-colors resize-none"
            placeholder="e.g. Addis Ababa's loudest Arsenal fan. Watch parties every big game."
          />
        </div>
      </div>

      {/* Team */}
      <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6 space-y-4">
        <h3 className="font-semibold text-[#111827]">Team Allegiance</h3>
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
          {TEAM_OPTIONS.map((team) => (
            <button
              key={team.label}
              onClick={() => setForm((f: Partial<Influencer>) => ({ ...f, teamSupported: team.label, teamColor: team.color }))}
              className={`p-3 rounded-xl border-2 text-sm font-semibold transition-all ${
                form.teamSupported === team.label
                  ? "border-transparent text-white shadow-md"
                  : "border-[#E5E7EB] text-[#374151] hover:border-gray-300"
              }`}
              style={form.teamSupported === team.label ? { backgroundColor: team.color } : {}}
            >
              {team.label}
            </button>
          ))}
        </div>
      </div>

      {/* Social Links */}
      <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6 space-y-4">
        <h3 className="font-semibold text-[#111827]">Social Media Links</h3>
        {[
          { key: "tiktokUrl", label: "TikTok URL", placeholder: "https://tiktok.com/@yourhandle" },
          { key: "instagramUrl", label: "Instagram URL", placeholder: "https://instagram.com/yourhandle" },
          { key: "telegramUrl", label: "Telegram Group/Channel URL", placeholder: "https://t.me/yourchannel" },
        ].map(({ key, label, placeholder }) => (
          <div key={key} className="space-y-1">
            <label className="text-sm font-medium text-[#374151]">{label}</label>
            <input
              value={(form as any)[key] || ""}
              onChange={(e) => setForm((f: Partial<Influencer>) => ({ ...f, [key]: e.target.value }))}
              className="w-full border-2 border-[#E5E7EB] rounded-xl px-4 py-3 text-[#111827] focus:border-[#1A7A4A] outline-none transition-colors text-sm"
              placeholder={placeholder}
            />
          </div>
        ))}
      </div>

      {/* Save Button */}
      <button
        onClick={handleSave}
        disabled={saving || uploadingPhoto}
        className="flex items-center justify-center gap-2 w-full py-4 rounded-xl bg-[#1A7A4A] text-white font-bold tracking-wide hover:bg-[#0F4D2E] transition-colors shadow-sm disabled:opacity-60"
      >
        {saving ? (
          <><Loader2 className="w-5 h-5 animate-spin" /> Saving...</>
        ) : (
          <><Save className="w-5 h-5" /> Save Profile</>
        )}
      </button>
    </div>
  );
}
