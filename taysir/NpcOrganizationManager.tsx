import { useEffect, useMemo, useState } from "react";
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
  completionRate: number;
  disputeRate: number;
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
  // if user types "example.com" make it a valid URL
  if (!/^https?:\/\//i.test(w)) return `https://${w}`;
  return w;
}

export default function NpcOrganizationManager() {
  const { token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [org, setOrg] = useState<Org | null>(null);
  const [trust, setTrust] = useState<TrustOverview | null>(null);
  const [error, setError] = useState<string | null>(null);

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
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  async function submit() {
    if (!token) return;
    setError(null);

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
      }

      const trustRes = await api.get<{ success: boolean; data: TrustOverview }>(
        "/npc-organizations/me/trust",
        token
      );
      setTrust(trustRes.data);
    } catch (e: any) {
      setError(String(e?.message || e));
    }
  }

  const tierBadge = (tier?: string) => {
    if (!tier) return "badge bg-slate-700/50 text-slate-100";
    if (tier === "HIGH") return "badge bg-emerald-500/20 text-emerald-200";
    if (tier === "MEDIUM") return "badge bg-amber-500/20 text-amber-200";
    return "badge bg-rose-500/20 text-rose-200";
  };

  return (
    <div className="space-y-6">
      <div className="card">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold">🏰 NPC Organization Profile</h2>
            <p className="text-sm text-slate-300">
              Create and manage your organization identity. 
            </p>
          </div>
          <button className="btn" onClick={load} disabled={loading}>
            Refresh
          </button>
        </div>

        {loading ? (
          <p className="mt-4 text-slate-300">Loading…</p>
        ) : (
          <div className="mt-4 grid gap-3">
            <input
              className="input"
              placeholder="Organization name"
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
            />
            <input
              className="input"
              placeholder="Domain (e.g., Software, Blacksmithing)"
              value={form.domain}
              onChange={(e) => setForm((p) => ({ ...p, domain: e.target.value }))}
            />
            <input
              className="input"
              placeholder="Website (optional) e.g. example.com"
              value={form.website}
              onChange={(e) => setForm((p) => ({ ...p, website: e.target.value }))}
            />
            <textarea
              className="input min-h-[96px]"
              placeholder="Description"
              value={form.description}
              onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
            />

            {error && <p className="text-rose-300 text-sm">{error}</p>}

            <div className="flex gap-2">
              <button className="btn" onClick={submit} disabled={loading}>
                {isCreateMode ? "Create Profile" : "Update Profile"}
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="card">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold">🧾 Trust Overview</h3>
            
          </div>
          {trust?.trustTier && (
            <span className={tierBadge(trust.trustTier)}>
              {trust.trustTier} • {trust.trustScore}
            </span>
          )}
        </div>

        {!org ? (
          <p className="mt-4 text-slate-300">Create your organization profile to view trust metrics.</p>
        ) : !trust ? (
          <p className="mt-4 text-slate-300">No trust overview available yet.</p>
        ) : (
          <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-xl bg-white/5 p-3">
              <div className="text-slate-300">Verified</div>
              <div className="font-semibold">{trust.verified ? "Yes" : "No"}</div>
            </div>
            <div className="rounded-xl bg-white/5 p-3">
              <div className="text-slate-300">Flagged</div>
              <div className="font-semibold">{trust.isFlagged ? "Yes" : "No"}</div>
            </div>
            <div className="rounded-xl bg-white/5 p-3">
              <div className="text-slate-300">Quests Posted</div>
              <div className="font-semibold">{trust.totalQuestsPosted}</div>
            </div>
            <div className="rounded-xl bg-white/5 p-3">
              <div className="text-slate-300">Gold Spent (MVP sum)</div>
              <div className="font-semibold">{trust.totalGoldSpent}</div>
            </div>
            <div className="rounded-xl bg-white/5 p-3">
              <div className="text-slate-300">Completion Rate</div>
              <div className="font-semibold">{trust.completionRate}%</div>
            </div>
            <div className="rounded-xl bg-white/5 p-3">
              <div className="text-slate-300">Dispute Rate</div>
              <div className="font-semibold">{trust.disputeRate}%</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}


