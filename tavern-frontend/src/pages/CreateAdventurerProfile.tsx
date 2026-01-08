// src/pages/CreateAdventurerProfile.tsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
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

type ProfileForm = {
  title: string;
  summary: string;
  class: string;
  race?: string;
  background?: string;
  attributes: Attributes;
};

const CLASSES = [
  "Fighter",
  "Rogue",
  "Wizard",
  "Cleric",
  "Ranger",
  "Paladin",
  "Bard",
  "Monk",
  "Sorcerer",
  "Warlock",
];

export default function CreateAdventurerProfile() {
  const { token, user } = useAuth();
  const navigate = useNavigate();
  const INITIAL_STAT_POINTS = 8;
  const [availablePoints, setAvailablePoints] = useState(INITIAL_STAT_POINTS);
  const [form, setForm] = useState<ProfileForm>({
    title: "",
    summary: "",
    class: "Fighter",
    race: "",
    background: "",
    attributes: {
      strength: 10,
      dexterity: 10,
      intelligence: 10,
      charisma: 10,
      vitality: 10,
      luck: 10,
    },
  });
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleStatChange = (stat: keyof Attributes, newValue: number) => {
    // Enforce minimum of 10 and maximum of 20
    if (newValue < 10 || newValue > 20) {
      return;
    }
    
    const currentValue = form.attributes[stat];
    const diff = newValue - currentValue;
    
    // Check if we have enough points (when increasing) or if we're reducing (freeing points)
    const newAvailablePoints = availablePoints - diff;
    if (newAvailablePoints < 0 || newAvailablePoints > INITIAL_STAT_POINTS) {
      return; // Invalid point distribution
    }
    
    setForm({
      ...form,
      attributes: {
        ...form.attributes,
        [stat]: newValue,
      },
    });
    
    // Update available points
    setAvailablePoints(newAvailablePoints);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    // Validate all stats are at least 10
    const minStat = Math.min(...Object.values(form.attributes));
    if (minStat < 10) {
      setError("All stats must be at least 10");
      return;
    }
    
    // Validate all points are used
    if (availablePoints !== 0) {
      setError(`Please distribute all ${INITIAL_STAT_POINTS} stat points. ${availablePoints} remaining.`);
      return;
    }

    setError(null);
    setSubmitting(true);

    try {
      await api.post(
        "/adventurers/me",
        form,
        token
      );
      navigate("/dashboard");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create profile");
    } finally {
      setSubmitting(false);
    }
  };

  if (!user || user.role !== "ADVENTURER") {
    return (
      <div className="min-h-screen bg-slate-900 text-slate-100 p-8">
        Access denied. Adventurer only.
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-950 to-black text-slate-100 flex items-center justify-center px-4">
      <div className="w-full max-w-2xl rounded-2xl border border-amber-500/40 bg-slate-900/90 shadow-[0_0_35px_rgba(245,158,11,0.35)] p-6 space-y-6">
        <div className="space-y-1 text-center">
          <h1 className="text-2xl font-extrabold tracking-wide text-amber-200">
            ⚔️ Create Your Adventurer Profile
          </h1>
          <p className="text-sm text-slate-300">
            Set up your character to begin your journey. All stats start at 10 (minimum). You have {INITIAL_STAT_POINTS} points to distribute across your stats. Rank starts at F.
          </p>
        </div>

        {error && (
          <div className="rounded-lg border border-red-500/60 bg-red-900/40 px-4 py-3 text-red-100">
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-amber-200 uppercase tracking-wide">
              Title *
            </label>
            <input
              className="input bg-slate-950/70 border-slate-700 text-slate-100 w-full"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="e.g., Dragon Slayer, Master Thief"
              required
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-amber-200 uppercase tracking-wide">
              Summary *
            </label>
            <textarea
              className="input bg-slate-950/70 border-slate-700 text-slate-100 w-full min-h-[100px]"
              value={form.summary}
              onChange={(e) => setForm({ ...form, summary: e.target.value })}
              placeholder="Describe your adventurer..."
              required
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-amber-200 uppercase tracking-wide">
              Class *
            </label>
            <select
              className="input bg-slate-950/70 border-slate-700 text-slate-100 w-full"
              value={form.class}
              onChange={(e) => setForm({ ...form, class: e.target.value })}
              required
            >
              {CLASSES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-amber-200 uppercase tracking-wide">
              Race (Optional)
            </label>
            <input
              className="input bg-slate-950/70 border-slate-700 text-slate-100 w-full"
              value={form.race}
              onChange={(e) => setForm({ ...form, race: e.target.value })}
              placeholder="e.g., Human, Elf, Dwarf"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-amber-200 uppercase tracking-wide">
              Background (Optional)
            </label>
            <input
              className="input bg-slate-950/70 border-slate-700 text-slate-100 w-full"
              value={form.background}
              onChange={(e) => setForm({ ...form, background: e.target.value })}
              placeholder="e.g., Noble, Outlander, Criminal"
            />
          </div>

          <div className="rounded-lg border border-slate-700 bg-slate-950/50 p-4">
            <div className="flex items-center justify-between mb-3">
              <label className="text-xs font-semibold text-amber-200 uppercase tracking-wide">
                Attributes (Min: 10 each)
              </label>
              <div className={`text-sm font-bold px-3 py-1 rounded ${
                availablePoints === 0 
                  ? "bg-emerald-500/20 text-emerald-200" 
                  : "bg-amber-500/20 text-amber-200"
              }`}>
                Points Remaining: {availablePoints} / {INITIAL_STAT_POINTS}
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {Object.entries(form.attributes).map(([key, value]) => (
                <div key={key}>
                  <label className="text-xs text-slate-300 capitalize">
                    {key}
                  </label>
                  <input
                    type="number"
                    min="10"
                    max="20"
                    className="input bg-slate-800 border-slate-600 text-slate-100 w-full"
                    value={value}
                    onChange={(e) => {
                      const newValue = Number(e.target.value);
                      if (newValue >= 10) {
                        handleStatChange(key as keyof Attributes, newValue);
                      }
                    }}
                    required
                  />
                </div>
              ))}
            </div>
            <p className="text-xs text-slate-400 mt-2">
              All attributes start at 10. You have {INITIAL_STAT_POINTS} points to distribute. Minimum stat value is 10.
              {availablePoints > 0 && (
                <span className="text-amber-300 font-semibold block mt-1">
                  ⚠️ You must use all {INITIAL_STAT_POINTS} points before creating your profile.
                </span>
              )}
            </p>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="btn w-full bg-violet-600 hover:bg-violet-700 disabled:opacity-50"
          >
            {submitting ? "Creating Profile..." : "Create Profile"}
          </button>
        </form>
      </div>
    </div>
  );
}
