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
  logoUrl?: string;
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
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

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
        setSuccess("Organization profile created successfully! A verification email has been sent to your registered email address.");
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
      const response = await fetch(`${BASE}/npc-organizations/me/logo`, {
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
      await load(); // Reload organization to get updated logo URL
      
      // Clear success message after 5 seconds
      setTimeout(() => setSuccess(null), 5000);
    } catch (e: any) {
      setError(String(e?.message || e));
    } finally {
      setUploadingLogo(false);
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
              
              {/* Logo Upload */}
              <div className="border-t border-slate-700 pt-4 mt-2">
                <h3 className="text-sm font-semibold text-slate-300 mb-3">🖼️ Organization Logo</h3>
                <div className="flex flex-col md:flex-row items-start gap-4">
                  {/* Current Logo or Preview */}
                  <div className="flex-shrink-0">
                    {(logoPreview || org?.logoUrl) && (
                      <div className="w-32 h-32 rounded-lg border border-slate-700 bg-slate-950 overflow-hidden">
                        <img
                          src={logoPreview || org?.logoUrl || ''}
                          alt="Logo preview"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    {!logoPreview && !org?.logoUrl && (
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
                      id="org-logo-upload"
                    />
                    <label
                      htmlFor="org-logo-upload"
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
                  {submitting ? "Saving..." : isCreateMode ? "Create Profile" : "Update Profile"}
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


