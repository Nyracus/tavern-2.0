// src/pages/CreateNPCProfile.tsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { api } from "../lib/api";

type ProfileForm = {
  title: string;
  summary: string;
  organization?: string;
  location?: string;
};

export default function CreateNPCProfile() {
  const { token, user } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState<ProfileForm>({
    title: "",
    summary: "",
    organization: "",
    location: "",
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
        "/npcs/me",
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

  if (!user || user.role !== "NPC") {
    return (
      <div className="min-h-screen bg-slate-900 text-slate-100 p-8">
        Access denied. NPC only.
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-950 to-black text-slate-100 flex items-center justify-center px-4">
      <div className="w-full max-w-2xl rounded-2xl border border-purple-500/40 bg-slate-900/90 shadow-[0_0_35px_rgba(147,51,234,0.35)] p-6 space-y-6">
        <div className="space-y-1 text-center">
          <h1 className="text-2xl font-extrabold tracking-wide text-purple-200">
            🏛️ Create Your NPC Profile
          </h1>
          <p className="text-sm text-slate-300">
            Set up your profile to start posting quests and hiring adventurers.
          </p>
        </div>

        {error && (
          <div className="rounded-lg border border-red-500/60 bg-red-900/40 px-4 py-3 text-red-100">
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-purple-200 uppercase tracking-wide">
              Title *
            </label>
            <input
              className="input bg-slate-950/70 border-slate-700 text-slate-100 w-full"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="e.g., Merchant, Town Mayor, Guild Master"
              required
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-purple-200 uppercase tracking-wide">
              Summary *
            </label>
            <textarea
              className="input bg-slate-950/70 border-slate-700 text-slate-100 w-full min-h-[100px]"
              value={form.summary}
              onChange={(e) => setForm({ ...form, summary: e.target.value })}
              placeholder="Describe your NPC and their role..."
              required
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-purple-200 uppercase tracking-wide">
              Organization (Optional)
            </label>
            <input
              className="input bg-slate-950/70 border-slate-700 text-slate-100 w-full"
              value={form.organization}
              onChange={(e) => setForm({ ...form, organization: e.target.value })}
              placeholder="e.g., Royal Guild, Merchant's Association"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-purple-200 uppercase tracking-wide">
              Location (Optional)
            </label>
            <input
              className="input bg-slate-950/70 border-slate-700 text-slate-100 w-full"
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
              placeholder="e.g., Capital City, Northern Outpost"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="btn w-full bg-purple-600 hover:bg-purple-700 disabled:opacity-50"
          >
            {submitting ? "Creating Profile..." : "Create Profile"}
          </button>
        </form>
      </div>
    </div>
  );
}
