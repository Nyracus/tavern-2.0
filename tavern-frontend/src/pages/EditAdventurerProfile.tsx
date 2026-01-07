// src/pages/EditAdventurerProfile.tsx
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../lib/api";
import { useAuth } from "../context/AuthContext";

type Attributes = {
  strength: number;
  dexterity: number;
  intelligence: number;
  charisma: number;
  vitality: number;
  luck: number;
};

type AdventurerProfile = {
  _id: string;
  userId: string;
  title: string;
  summary: string;
  class: string;
  rank?: string;
  xp?: number;
  race?: string;
  background?: string;
  attributes: Attributes;
  availableStatPoints?: number;
  logoUrl?: string;
};

export default function EditAdventurerProfile() {
  const { token, user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<AdventurerProfile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  const [form, setForm] = useState({
    title: "",
    summary: "",
    race: "",
    background: "",
    attributes: {
      strength: 10,
      dexterity: 10,
      intelligence: 10,
      charisma: 10,
      vitality: 10,
      luck: 10,
    } as Attributes,
  });

  const [availablePoints, setAvailablePoints] = useState(0);

  async function load() {
    if (!token) return;
    setError(null);
    setLoading(true);
    try {
      const res = await api.get<{ success: boolean; data: AdventurerProfile }>(
        "/adventurers/me",
        token
      );
      setProfile(res.data);
      setForm({
        title: res.data.title ?? "",
        summary: res.data.summary ?? "",
        race: res.data.race ?? "",
        background: res.data.background ?? "",
        attributes: res.data.attributes,
      });
      setAvailablePoints(res.data.availableStatPoints ?? 0);
    } catch (e: any) {
      const msg = String(e?.message || e);
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (user?.role === "ADVENTURER") {
      load();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, user]);

  const handleStatChange = (stat: keyof Attributes, newValue: number) => {
    if (!profile) return;
    
    const currentValue = form.attributes[stat];
    const diff = newValue - currentValue;
    
    // Validate min/max
    if (newValue < 10 || newValue > 20) return;
    
    // Check if we have enough points
    const pointsNeeded = diff > 0 ? diff : 0;
    if (pointsNeeded > availablePoints) return;
    
    // Check if decreasing would work
    if (diff < 0) {
      const pointsToAdd = Math.abs(diff);
      setAvailablePoints((prev) => prev + pointsToAdd);
    } else {
      setAvailablePoints((prev) => prev - pointsNeeded);
    }
    
    setForm((prev) => ({
      ...prev,
      attributes: {
        ...prev.attributes,
        [stat]: newValue,
      },
    }));
  };

  async function submit() {
    if (!token || submitting || !profile) return;
    setError(null);
    setSuccess(null);
    setSubmitting(true);
    
    try {
      // Validate that all available points are distributed
      if (availablePoints > 0) {
        setError(`You have ${availablePoints} unallocated stat point${availablePoints !== 1 ? 's' : ''}. Please distribute all points before saving.`);
        setSubmitting(false);
        return;
      }
      
      // Validate that all stats are at least 10
      const minStat = Math.min(...Object.values(form.attributes));
      if (minStat < 10) {
        setError("All stats must be at least 10.");
        setSubmitting(false);
        return;
      }

      const updated = await api.patch<{ success: boolean; data: AdventurerProfile }>(
        "/adventurers/me",
        {
          title: form.title,
          summary: form.summary,
          race: form.race || undefined,
          background: form.background || undefined,
          attributes: form.attributes,
        },
        token
      );
      
      setProfile(updated.data);
      setSuccess("Profile updated successfully!");
      await load(); // Reload to get updated stats
      
      // Clear success message after 5 seconds
      setTimeout(() => setSuccess(null), 5000);
    } catch (e: any) {
      setError(String(e?.message || e));
    } finally {
      setSubmitting(false);
    }
  }

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
      if (!allowedTypes.includes(file.type)) {
        setError('Only image files are allowed (jpg, jpeg, png, gif, webp, svg)');
        return;
      }
      // Validate file size (5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('Logo file size must be less than 5MB');
        return;
      }
      setLogoFile(file);
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  async function uploadLogo() {
    if (!token || !logoFile || uploadingLogo) return;
    setError(null);
    setUploadingLogo(true);
    
    try {
      const formData = new FormData();
      formData.append('logo', logoFile);

      const BASE = import.meta.env.VITE_API_URL as string;
      const response = await fetch(`${BASE}/adventurers/me/logo`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      const result = await response.json();
      
      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Failed to upload logo');
      }

      setSuccess('Logo uploaded successfully!');
      setLogoFile(null);
      setLogoPreview(null);
      await load(); // Reload profile to get updated logo URL
      
      // Clear success message after 5 seconds
      setTimeout(() => setSuccess(null), 5000);
    } catch (e: any) {
      setError(String(e?.message || e));
    } finally {
      setUploadingLogo(false);
    }
  }

  const getRankColor = (rank?: string) => {
    if (!rank) return "text-slate-400";
    const colors: Record<string, string> = {
      F: "text-red-400",
      E: "text-orange-400",
      D: "text-yellow-400",
      C: "text-green-400",
      B: "text-blue-400",
      A: "text-indigo-400",
      S: "text-purple-400",
      SS: "text-pink-400",
      SSS: "text-amber-400",
    };
    return colors[rank] || "text-slate-400";
  };

  if (!user || user.role !== "ADVENTURER") {
    return (
      <div className="min-h-screen bg-slate-900 text-slate-100 flex items-center justify-center">
        <p className="text-slate-300">Access denied. This page is for Adventurers only.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-b from-slate-900 via-slate-950 to-black text-slate-100">
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-extrabold tracking-wide flex items-center gap-2">
              🧝 Edit Adventurer Profile
            </h1>
            <p className="text-sm text-slate-300">
              Update your adventurer profile and distribute stat points.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              to="/dashboard"
              className="text-xs md:text-sm px-3 py-2 rounded-lg border border-indigo-500/60 text-indigo-300 hover:bg-indigo-500/10 transition-colors"
            >
              ← Dashboard
            </Link>
            <button 
              className="text-xs md:text-sm px-3 py-2 rounded-lg border border-slate-600 text-slate-300 hover:bg-slate-700/50" 
              onClick={load} 
              disabled={loading}
            >
              Refresh
            </button>
          </div>
        </div>

        <div className="rounded-2xl border border-purple-500/40 bg-slate-900/70 p-4 md:p-5 space-y-3">
          {loading ? (
            <p className="text-slate-300">Loading…</p>
          ) : !profile ? (
            <p className="text-slate-300">Profile not found. Please create your profile first.</p>
          ) : (
            <div className="grid gap-4">
              {/* Profile Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-1">
                    Title
                  </label>
                  <input
                    className="input bg-slate-950/70 border-slate-700 text-slate-100 w-full"
                    placeholder="e.g., Dragon Slayer"
                    value={form.title}
                    onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-1">
                    Class
                  </label>
                  <input
                    className="input bg-slate-950/70 border-slate-700 text-slate-100 w-full opacity-60"
                    value={profile.class}
                    disabled
                  />
                  <p className="text-xs text-slate-400 mt-1">Class cannot be changed</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-1">
                    Race (optional)
                  </label>
                  <input
                    className="input bg-slate-950/70 border-slate-700 text-slate-100 w-full"
                    placeholder="e.g., Human, Elf"
                    value={form.race}
                    onChange={(e) => setForm((prev) => ({ ...prev, race: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-1">
                    Rank
                  </label>
                  <div className="flex items-center gap-2">
                    <span className={`text-lg font-bold ${getRankColor(profile.rank)}`}>
                      {profile.rank || "F"}
                    </span>
                    {profile.xp !== undefined && (
                      <span className="text-sm text-slate-400">
                        ({profile.xp} XP)
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-1">
                  Background (optional)
                </label>
                <input
                  className="input bg-slate-950/70 border-slate-700 text-slate-100 w-full"
                  placeholder="e.g., Former soldier"
                  value={form.background}
                  onChange={(e) => setForm((prev) => ({ ...prev, background: e.target.value }))}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-1">
                  Summary
                </label>
                <textarea
                  className="input bg-slate-950/70 border-slate-700 text-slate-100 w-full min-h-[96px]"
                  placeholder="Describe your adventurer..."
                  value={form.summary}
                  onChange={(e) => setForm((prev) => ({ ...prev, summary: e.target.value }))}
                />
              </div>

              {/* Logo Upload */}
              <div className="border-t border-slate-700 pt-4 mt-2">
                <h3 className="text-lg font-semibold flex items-center gap-2 mb-3">
                  🖼️ Logo
                </h3>
                <div className="flex flex-col md:flex-row items-start gap-4">
                  {/* Current Logo or Preview */}
                  <div className="flex-shrink-0">
                    {(logoPreview || profile.logoUrl) && (
                      <div className="w-32 h-32 rounded-lg border border-slate-700 bg-slate-950 overflow-hidden">
                        <img
                          src={logoPreview || profile.logoUrl || ''}
                          alt="Logo preview"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    {!logoPreview && !profile.logoUrl && (
                      <div className="w-32 h-32 rounded-lg border border-slate-700 bg-slate-950 flex items-center justify-center text-slate-500 text-sm">
                        No logo
                      </div>
                    )}
                  </div>
                  
                  {/* Upload Controls */}
                  <div className="flex-1 space-y-2">
                    <input
                      type="file"
                      accept="image/jpeg,image/jpg,image/png,image/gif,image/webp,image/svg+xml"
                      onChange={handleLogoChange}
                      className="hidden"
                      id="logo-upload"
                    />
                    <label
                      htmlFor="logo-upload"
                      className="inline-block text-xs md:text-sm px-4 py-2 rounded-lg border border-purple-500/60 text-purple-300 hover:bg-purple-500/10 cursor-pointer transition-colors"
                    >
                      {logoFile ? 'Change Logo' : 'Upload Logo'}
                    </label>
                    {logoFile && (
                      <div className="flex items-center gap-2">
                        <button
                          className="btn bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-sm px-4 py-2"
                          onClick={uploadLogo}
                          disabled={uploadingLogo}
                        >
                          {uploadingLogo ? "Uploading..." : "Save Logo"}
                        </button>
                        <button
                          className="text-xs md:text-sm px-3 py-2 rounded-lg border border-slate-600 text-slate-300 hover:bg-slate-700/50"
                          onClick={() => {
                            setLogoFile(null);
                            setLogoPreview(null);
                          }}
                          disabled={uploadingLogo}
                        >
                          Cancel
                        </button>
                      </div>
                    )}
                    <p className="text-xs text-slate-400">
                      Recommended: Square image, max 5MB (jpg, png, gif, webp, svg)
                    </p>
                  </div>
                </div>
              </div>

              {/* Stat Distribution */}
              <div className="border-t border-slate-700 pt-4 mt-2">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    ⭐ Stat Distribution
                  </h3>
                  {availablePoints > 0 && (
                    <span className="text-sm font-bold text-purple-300">
                      {availablePoints} point{availablePoints !== 1 ? 's' : ''} available
                    </span>
                  )}
                </div>
                {availablePoints > 0 && (
                  <div className="mb-3 p-3 rounded-lg border border-purple-500/40 bg-purple-900/20">
                    <p className="text-sm text-purple-200">
                      💡 You have unallocated stat points from ranking up! Distribute them among your stats before saving.
                    </p>
                  </div>
                )}
                
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {Object.entries(form.attributes).map(([stat, value]) => (
                    <div key={stat} className="flex flex-col gap-2">
                      <label className="text-sm font-semibold text-slate-300 uppercase">
                        {stat}
                      </label>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          className="btn bg-slate-700 hover:bg-slate-600 w-8 h-8 p-0 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                          onClick={() => handleStatChange(stat as keyof Attributes, value - 1)}
                          disabled={value <= 10 || loading}
                        >
                          -
                        </button>
                        <input
                          type="number"
                          className="input bg-slate-950/70 border-slate-700 text-slate-100 text-center w-20 font-semibold"
                          min={10}
                          max={20}
                          value={value}
                          onChange={(e) => {
                            const newValue = parseInt(e.target.value) || 10;
                            if (newValue >= 10 && newValue <= 20) {
                              handleStatChange(stat as keyof Attributes, newValue);
                            }
                          }}
                        />
                        <button
                          type="button"
                          className="btn bg-slate-700 hover:bg-slate-600 w-8 h-8 p-0 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                          onClick={() => handleStatChange(stat as keyof Attributes, value + 1)}
                          disabled={value >= 20 || availablePoints <= 0 || loading}
                        >
                          +
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {error && (
                <div className="rounded-lg border border-red-500/60 bg-red-900/40 px-4 py-3 text-red-100 text-sm">
                  ⚠️ {error}
                </div>
              )}
              {success && (
                <div className="rounded-lg border border-emerald-500/60 bg-emerald-900/40 px-4 py-3 text-emerald-100 text-sm">
                  ✅ {success}
                </div>
              )}
              
              <div>
                <button 
                  className="btn bg-purple-600 hover:bg-purple-700 disabled:opacity-50" 
                  onClick={submit} 
                  disabled={loading || submitting}
                >
                  {submitting ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

