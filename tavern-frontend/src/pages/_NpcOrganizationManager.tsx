// src/pages/_NpcOrganizationManager.tsx
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../lib/api";
import { useAuth } from "../context/AuthContext";

type Org = {
  _id: string;
  userId: string;
  name: string;
  description?: string;
  domain?: string;
  website?: string;
  verified: boolean;
  trustScore: number;
  trustTier: "LOW" | "MEDIUM" | "HIGH";
  isFlagged: boolean;
  totalQuestsPosted: number;
  totalGoldSpent: number;
  completionRate: number; // percentage
  disputeRate: number; // percentage
  createdAt: string;
  updatedAt: string;
};

type TrustOverview = {
  trustScore: number;
  trustTier: "LOW" | "MEDIUM" | "HIGH";
  verified: boolean;
  isFlagged: boolean;
  totalQuestsPosted: number;
  totalGoldSpent: number;
  completionRate: number; // 0..100
  disputeRate: number; // 0..100
};

function normalizeWebsite(input: string) {
  const w = input.trim();
  if (!w) return undefined;
  if (!/^https?:\/\//i.test(w)) return `https://${w}`;
  return w;
}

export default function NpcOrganizationManager() {
  const { token, user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [org, setOrg] = useState<Org | null>(null);
  const [trust, setTrust] = useState<TrustOverview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    name: "",
    description: "",
    domain: "",
    website: "",
  });

  const isCreateMode = useMemo(() => !org, [org]);

  async function load() {
    if (!token) return;
    setError(null);
    setSuccess(null);
    setLoading(true);
    try {
      const res = await api.get<{ success: boolean; data: Org }>("/npc-organizations/me", token);
      setOrg(res.data);
      setForm({
        name: res.data.name ?? "",
        description: res.data.description ?? "",
        domain: res.data.domain ?? "",
        website: res.data.website ?? "",
      });

      const trustRes = await api.get<{ success: boolean; data: TrustOverview }>(
        "/npc-organizations/me/trust",
        token
      );
      setTrust(trustRes.data);
    } catch (e: any) {
      const msg = String(e?.message || e);
      if (msg.includes("404") || msg.toLowerCase().includes("no organization")) {
        setOrg(null);
        setTrust(null);
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (user?.role === "NPC") {
      load();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, user]);

  async function submit() {
    if (!token || submitting) return;
    setError(null);
    setSuccess(null);
    setSubmitting(true);
    const website = normalizeWebsite(form.website);
    try {
      if (isCreateMode) {
        const created = await api.post<{ success: boolean; data: Org }>(
          "/npc-organizations/me",
          {
            name: form.name,
            description: form.description || undefined,
            domain: form.domain || undefined,
            website,
          },
          token
        );
        setOrg(created.data);
        setSuccess("Organization profile created successfully!");
      } else {
        const updated = await api.patch<{ success: boolean; data: Org }>(
          "/npc-organizations/me",
          {
            name: form.name,
            description: form.description || undefined,
            domain: form.domain || undefined,
            website,
          },
          token
        );
        setOrg(updated.data);
        setSuccess("Organization profile updated successfully!");
      }
      const trustRes = await api.get<{ success: boolean; data: TrustOverview }>(
        "/npc-organizations/me/trust",
        token
      );
      setTrust(trustRes.data);
      
      // Clear success message after 5 seconds
      setTimeout(() => setSuccess(null), 5000);
    } catch (e: any) {
      setError(String(e?.message || e));
    } finally {
      setSubmitting(false);
    }
  }

  const tierBadge = (tier?: string) => {
    if (!tier) return "badge bg-slate-700/50 text-slate-100";
    if (tier === "HIGH") return "badge bg-emerald-500/20 text-emerald-200";
    if (tier === "MEDIUM") return "badge bg-amber-500/20 text-amber-200";
    return "badge bg-rose-500/20 text-rose-200";
  };

  return (
    <div className="min-h-screen bg-linear-to-b from-slate-900 via-slate-950 to-black text-slate-100">
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-extrabold tracking-wide flex items-center gap-2">
              🏛️ NPC Organization
            </h1>
            <p className="text-sm text-slate-300">
              Create and manage your organization identity.
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
          ) : (
            <div className="grid gap-3">
              <input
                className="input bg-slate-950/70 border-slate-700 text-slate-100"
                placeholder="Organization name"
                value={form.name}
                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              />
              <input
                className="input bg-slate-950/70 border-slate-700 text-slate-100"
                placeholder="Domain (e.g., Software, Blacksmithing)"
                value={form.domain}
                onChange={(e) => setForm((p) => ({ ...p, domain: e.target.value }))}
              />
              <input
                className="input bg-slate-950/70 border-slate-700 text-slate-100"
                placeholder="Website (optional) e.g. example.com"
                value={form.website}
                onChange={(e) => setForm((p) => ({ ...p, website: e.target.value }))}
              />
              <textarea
                className="input bg-slate-950/70 border-slate-700 text-slate-100 min-h-[96px]"
                placeholder="Description"
                value={form.description}
                onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
              />
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
                  disabled={loading || submitting || !form.name.trim()}
                >
                  {submitting ? "Saving..." : isCreateMode ? "Create Profile" : "Save Changes"}
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-purple-500/40 bg-slate-900/70 p-4 md:p-5 space-y-3">
          <div className="flex items-start justify-between">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              🧾 Trust Overview
            </h3>
            {trust?.trustTier && (
              <span className={tierBadge(trust.trustTier)}>
                {trust.trustTier} • {trust.trustScore}
              </span>
            )}
          </div>
          {!org ? (
            <p className="text-slate-300">Create your organization profile to view trust metrics.</p>
          ) : !trust ? (
            <p className="text-slate-300">No trust overview available yet.</p>
          ) : (
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-xl border border-slate-700 bg-slate-950/70 p-3">
                <div className="text-slate-300">Verified</div>
                <div className="font-semibold">{trust.verified ? "Yes" : "No"}</div>
              </div>
              <div className="rounded-xl border border-slate-700 bg-slate-950/70 p-3">
                <div className="text-slate-300">Flagged</div>
                <div className="font-semibold">{trust.isFlagged ? "Yes" : "No"}</div>
              </div>
              <div className="rounded-xl border border-slate-700 bg-slate-950/70 p-3">
                <div className="text-slate-300">Quests Posted</div>
                <div className="font-semibold">{trust.totalQuestsPosted}</div>
              </div>
              <div className="rounded-xl border border-slate-700 bg-slate-950/70 p-3">
                <div className="text-slate-300">Gold Spent</div>
                <div className="font-semibold">{trust.totalGoldSpent}</div>
              </div>
              <div className="rounded-xl border border-slate-700 bg-slate-950/70 p-3">
                <div className="text-slate-300">Completion Rate</div>
                <div className="font-semibold">{trust.completionRate}%</div>
              </div>
              <div className="rounded-xl border border-slate-700 bg-slate-950/70 p-3">
                <div className="text-slate-300">Dispute Rate</div>
                <div className="font-semibold">{trust.disputeRate}%</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


