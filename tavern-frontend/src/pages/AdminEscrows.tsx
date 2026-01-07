// src/pages/AdminEscrows.tsx
import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { api } from "../lib/api";
import { Link } from "react-router-dom";

type Escrow = {
  _id: string;
  questId: {
    _id: string;
    title: string;
    status: string;
  };
  npcId: {
    _id: string;
    username: string;
    displayName: string;
  };
  adventurerId?: {
    _id: string;
    username: string;
    displayName: string;
  };
  amount: number;
  status: "ACTIVE" | "RELEASED" | "REFUNDED" | "CANCELLED";
  createdAt: string;
  releasedAt?: string;
  refundedAt?: string;
  notes?: string;
};

export default function AdminEscrows() {
  const { token, user } = useAuth();
  const [escrows, setEscrows] = useState<Escrow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<"ALL" | "ACTIVE" | "RELEASED" | "REFUNDED">("ACTIVE");

  useEffect(() => {
    if (token && user?.role === "GUILD_MASTER") {
      loadEscrows();
    }
  }, [token, user]);

  const loadEscrows = async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      // This endpoint needs to be implemented in backend
      const res = await api.get<{ success: boolean; data: Escrow[] }>(
        "/admin/escrows",
        token
      );
      setEscrows(res.data || []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load escrows");
    } finally {
      setLoading(false);
    }
  };

  const filteredEscrows = escrows.filter((e) => {
    if (filter === "ALL") return true;
    return e.status === filter;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return "text-amber-400 border-amber-500/40 bg-amber-900/20";
      case "RELEASED":
        return "text-emerald-400 border-emerald-500/40 bg-emerald-900/20";
      case "REFUNDED":
        return "text-blue-400 border-blue-500/40 bg-blue-900/20";
      default:
        return "text-slate-400 border-slate-500/40 bg-slate-900/20";
    }
  };

  const totalActive = escrows.filter((e) => e.status === "ACTIVE").reduce((sum, e) => sum + e.amount, 0);
  const totalReleased = escrows.filter((e) => e.status === "RELEASED").reduce((sum, e) => sum + e.amount, 0);
  const totalRefunded = escrows.filter((e) => e.status === "REFUNDED").reduce((sum, e) => sum + e.amount, 0);

  if (!user || user.role !== "GUILD_MASTER") {
    return (
      <div className="min-h-screen bg-slate-900 text-slate-100 p-8">
        Access denied. Guild Master only.
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-b from-slate-900 via-slate-950 to-black text-slate-100">
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-extrabold tracking-wide flex items-center gap-2">
              🏦 Guild Escrow Management
            </h1>
            <p className="text-sm text-slate-300">
              Monitor all locked funds and escrow transactions
            </p>
          </div>
          <Link
            to="/"
            className="text-xs md:text-sm px-3 py-2 rounded-lg border border-slate-600 text-slate-300 hover:bg-slate-700/50"
          >
            ← Back to Dashboard
          </Link>
        </header>

        {error && (
          <div className="rounded-lg border border-red-500/60 bg-red-900/40 px-4 py-3 text-red-100">
            ⚠️ {error}
          </div>
        )}

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rounded-2xl border border-amber-500/40 bg-amber-900/20 p-5">
            <div className="text-sm text-slate-400 mb-1">Active Escrows</div>
            <div className="text-3xl font-bold text-amber-400">{totalActive} 💰</div>
            <div className="text-xs text-slate-500 mt-1">
              {escrows.filter((e) => e.status === "ACTIVE").length} transactions
            </div>
          </div>
          <div className="rounded-2xl border border-emerald-500/40 bg-emerald-900/20 p-5">
            <div className="text-sm text-slate-400 mb-1">Total Released</div>
            <div className="text-3xl font-bold text-emerald-400">{totalReleased} 💰</div>
            <div className="text-xs text-slate-500 mt-1">
              {escrows.filter((e) => e.status === "RELEASED").length} transactions
            </div>
          </div>
          <div className="rounded-2xl border border-blue-500/40 bg-blue-900/20 p-5">
            <div className="text-sm text-slate-400 mb-1">Total Refunded</div>
            <div className="text-3xl font-bold text-blue-400">{totalRefunded} 💰</div>
            <div className="text-xs text-slate-500 mt-1">
              {escrows.filter((e) => e.status === "REFUNDED").length} transactions
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-2">
          {["ALL", "ACTIVE", "RELEASED", "REFUNDED"].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f as any)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === f
                  ? "bg-purple-600 text-white"
                  : "bg-slate-800 text-slate-300 hover:bg-slate-700"
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        {loading ? (
          <p className="text-slate-400">Loading escrows…</p>
        ) : filteredEscrows.length === 0 ? (
          <div className="rounded-2xl border border-slate-700 bg-slate-900/70 p-8 text-center">
            <p className="text-slate-400">No escrows found for this filter.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredEscrows.map((escrow) => (
              <div
                key={escrow._id}
                className="rounded-2xl border border-slate-700 bg-slate-900/70 p-5 space-y-2"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-lg font-semibold">
                        {escrow.questId?.title || "Unknown Quest"}
                      </h3>
                      <span
                        className={`text-xs px-2 py-1 rounded border ${getStatusColor(
                          escrow.status
                        )}`}
                      >
                        {escrow.status}
                      </span>
                    </div>
                    <div className="text-sm text-slate-400 space-y-1">
                      <p>
                        <b>Escrow ID:</b> {escrow._id}
                      </p>
                      <p>
                        <b>Quest ID:</b> {escrow.questId?._id || "N/A"}
                      </p>
                      <p>
                        <b>NPC:</b>{" "}
                        {escrow.npcId?.displayName || escrow.npcId?.username || "Unknown"}
                      </p>
                      {escrow.adventurerId && (
                        <p>
                          <b>Adventurer:</b>{" "}
                          {escrow.adventurerId.displayName ||
                            escrow.adventurerId.username}
                        </p>
                      )}
                      <p>
                        <b>Amount:</b>{" "}
                        <span className="text-amber-400 font-semibold">
                          {escrow.amount} gold
                        </span>
                      </p>
                      <p>
                        <b>Created:</b> {new Date(escrow.createdAt).toLocaleString()}
                      </p>
                      {escrow.releasedAt && (
                        <p>
                          <b>Released:</b>{" "}
                          {new Date(escrow.releasedAt).toLocaleString()}
                        </p>
                      )}
                      {escrow.refundedAt && (
                        <p>
                          <b>Refunded:</b>{" "}
                          {new Date(escrow.refundedAt).toLocaleString()}
                        </p>
                      )}
                      {escrow.notes && (
                        <p>
                          <b>Notes:</b> {escrow.notes}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
