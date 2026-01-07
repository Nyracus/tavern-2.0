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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    setError(null);
    setSubmitting(true);

    try {
      await api.post(
        "/adventurers/me/profile",
        {
          ...form,
          level: 1,
        },
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
            Set up your character to begin your journey. All stats start at 10, rank starts at F.
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
            <label className="text-xs font-semibold text-amber-200 uppercase tracking-wide mb-3 block">
              Attributes (All start at 10)
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {Object.entries(form.attributes).map(([key, value]) => (
                <div key={key}>
                  <label className="text-xs text-slate-300 capitalize">
                    {key}
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="20"
                    className="input bg-slate-800 border-slate-600 text-slate-100 w-full"
                    value={value}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        attributes: {
                          ...form.attributes,
                          [key]: Number(e.target.value),
                        },
                      })
                    }
                    required
                  />
                </div>
              ))}
            </div>
            <p className="text-xs text-slate-400 mt-2">
              All attributes are set to 10 by default. You can adjust them now, but remember you'll gain stat points as you level up!
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
