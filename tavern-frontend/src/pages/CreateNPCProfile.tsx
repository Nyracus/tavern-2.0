// src/pages/CreateNPCProfile.tsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { api } from "../lib/api";

type ProfileForm = {
  name: string;
  description?: string;
  domain?: string;
  website?: string;
};

export default function CreateNPCProfile() {
  const { token, user } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState<ProfileForm>({
    name: "",
    description: "",
    domain: "",
    website: "",
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
        "/npc-organizations/me",
        {
          name: form.name,
          description: form.description || undefined,
          domain: form.domain || undefined,
          website: form.website || undefined,
        },
        token
      );
      navigate("/dashboard");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create organization profile");
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
            🏛️ Create Your NPC Organization Profile
          </h1>
          <p className="text-sm text-slate-300">
            Set up your organization profile to start posting quests and hiring adventurers.
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
              Organization Name *
            </label>
            <input
              className="input bg-slate-950/70 border-slate-700 text-slate-100 w-full"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g., Royal Guild, Merchant's Association"
              required
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-purple-200 uppercase tracking-wide">
              Description (Optional)
            </label>
            <textarea
              className="input bg-slate-950/70 border-slate-700 text-slate-100 w-full min-h-[100px]"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Describe your organization..."
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-purple-200 uppercase tracking-wide">
              Domain (Optional)
            </label>
            <input
              className="input bg-slate-950/70 border-slate-700 text-slate-100 w-full"
              value={form.domain}
              onChange={(e) => setForm({ ...form, domain: e.target.value })}
              placeholder="e.g., Software, Art, Research"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-purple-200 uppercase tracking-wide">
              Website (Optional)
            </label>
            <input
              className="input bg-slate-950/70 border-slate-700 text-slate-100 w-full"
              value={form.website}
              onChange={(e) => setForm({ ...form, website: e.target.value })}
              placeholder="e.g., https://example.com"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="btn w-full bg-purple-600 hover:bg-purple-700 disabled:opacity-50"
          >
            {submitting ? "Creating Organization..." : "Create Organization Profile"}
          </button>
        </form>
      </div>
    </div>
  );
}
