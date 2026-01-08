// src/pages/EditAdventurerProfile.tsx
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { api } from "../lib/api";

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
  race?: string;
  background?: string;
  attributes: Attributes;
  xp?: number;
  rank?: string;
  availableStatPoints?: number;
  logoUrl?: string;
};

export default function EditAdventurerProfile() {
  const { token, user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<AdventurerProfile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

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
    setSuccess(null);
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
      if (msg.includes("404") || msg.toLowerCase().includes("no adventurer profile")) {
        navigate("/create-adventurer-profile");
      } else {
        setError(msg);
      }
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
    
    // Check if decreasing would work (freeing points)
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
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-950 to-black text-slate-100">
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-extrabold tracking-wide flex items-center gap-2">
              🧝 Edit Adventurer Profile
            </h1>
            <p className="text-sm text-slate-300">
              Update your adventurer profile and manage your attributes.
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

        <div className="rounded-2xl border border-violet-500/40 bg-slate-900/70 p-4 md:p-5 space-y-4">
          {loading ? (
            <p className="text-slate-300">Loading…</p>
          ) : !profile ? (
            <p className="text-slate-300">Profile not found. Please create your profile first.</p>
          ) : (
            <>
              {profile.class && (
                <div className="rounded-lg border border-amber-500/60 bg-amber-900/30 p-3 text-sm text-amber-200">
                  <p>
                    ⚠️ <strong>Class is Fixed:</strong> Your class "{profile.class}" cannot be changed after creation. 
                    To change your class, submit an anomaly application to the Guild Master.
                  </p>
                </div>
              )}

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-violet-200 uppercase tracking-wide mb-1 block">
                    Title *
                  </label>
                  <input
                    className="input bg-slate-950/70 border-slate-700 text-slate-100 w-full"
                    placeholder="Dragon Slayer"
                    value={form.title}
                    onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-violet-200 uppercase tracking-wide mb-1 block">
                    Class
                  </label>
                  <div className="input bg-slate-800/50 border-slate-700 flex items-center h-[42px] text-sm text-slate-300">
                    <span className="font-medium">{profile.class}</span>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-violet-200 uppercase tracking-wide mb-1 block">
                    Race (Optional)
                  </label>
                  <input
                    className="input bg-slate-950/70 border-slate-700 text-slate-100 w-full"
                    placeholder="Human, Elf, Dwarf"
                    value={form.race}
                    onChange={(e) => setForm((prev) => ({ ...prev, race: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-violet-200 uppercase tracking-wide mb-1 block">
                    Rank
                  </label>
                  <div className="flex items-center gap-2 h-[42px]">
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
                <label className="text-xs font-semibold text-violet-200 uppercase tracking-wide mb-1 block">
                  Background (Optional)
                </label>
                <input
                  className="input bg-slate-950/70 border-slate-700 text-slate-100 w-full"
                  placeholder="Former knight of the Eastern Kingdom…"
                  value={form.background}
                  onChange={(e) => setForm((prev) => ({ ...prev, background: e.target.value }))}
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-violet-200 uppercase tracking-wide mb-1 block">
                  Summary *
                </label>
                <textarea
                  className="input bg-slate-950/70 border-slate-700 text-slate-100 w-full min-h-[70px]"
                  placeholder="Veteran warrior who hunts dragons…"
                  value={form.summary}
                  onChange={(e) => setForm((prev) => ({ ...prev, summary: e.target.value }))}
                  required
                />
              </div>

              <div className="rounded-lg border border-slate-700 bg-slate-950/50 p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-xs font-semibold text-violet-200 uppercase tracking-wide">💠 Core Attributes</h4>
                  {availablePoints > 0 && (
                    <span className="text-sm font-bold text-purple-300">
                      {availablePoints} point{availablePoints !== 1 ? 's' : ''} available
                    </span>
                  )}
                </div>
                {availablePoints > 0 && (
                  <div className="mb-3 p-3 rounded-lg border border-purple-500/40 bg-purple-900/20">
                    <p className="text-sm text-purple-200">
                      💡 You have unallocated stat points from ranking up! Distribute them before saving.
                    </p>
                  </div>
                )}
                <div className="grid md:grid-cols-3 gap-4">
                  {(Object.keys(form.attributes) as Array<keyof Attributes>).map(
                    (key) => (
                      <div key={key} className="flex flex-col gap-2">
                        <label className="block text-xs font-semibold uppercase tracking-wide text-slate-300">
                          {key}
                        </label>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            className="btn bg-slate-700 hover:bg-slate-600 w-8 h-8 p-0 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                            onClick={() => handleStatChange(key, form.attributes[key] - 1)}
                            disabled={form.attributes[key] <= 10 || loading}
                          >
                            -
                          </button>
                          <input
                            className="input bg-slate-950/70 border-slate-700 text-slate-100 text-center w-20 font-semibold"
                            type="number"
                            min="10"
                            max="20"
                            value={form.attributes[key]}
                            onChange={(e) => {
                              const newValue = parseInt(e.target.value) || 10;
                              if (newValue >= 10 && newValue <= 20) {
                                handleStatChange(key, newValue);
                              }
                            }}
                          />
                          <button
                            type="button"
                            className="btn bg-slate-700 hover:bg-slate-600 w-8 h-8 p-0 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                            onClick={() => handleStatChange(key, form.attributes[key] + 1)}
                            disabled={form.attributes[key] >= 20 || availablePoints <= 0 || loading}
                          >
                            +
                          </button>
                        </div>
                      </div>
                    )
                  )}
                </div>
                <p className="text-xs text-slate-400 mt-3">
                  All attributes must be between 10 and 20. Minimum stat value is 10.
                </p>
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
                  className="btn bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white" 
                  onClick={submit} 
                  disabled={loading || submitting || !form.title.trim() || !form.summary.trim()}
                >
                  {submitting ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
