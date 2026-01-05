import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../lib/api";
import { useAuth } from "../context/AuthContext";

type AnomalyStatus = "OPEN" | "ACKNOWLEDGED" | "RESOLVED" | "IGNORED";

type Anomaly = {
  _id: string;
  subjectUserId: {
    _id: string;
    username: string;
    displayName: string;
    role: "ADVENTURER" | "NPC" | "GUILD_MASTER";
  } | string;
  subjectRole: "ADVENTURER" | "NPC" | "GUILD_MASTER";
  type: string;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  summary: string;
  details?: string;
  status: AnomalyStatus;
  createdAt: string;
};

export default function AdminAnomalies() {
  const { token } = useAuth();
  const [items, setItems] = useState<Anomaly[]>([]);
  const [loading, setLoading] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchAnomalies = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await api.get<{ success: boolean; data: Anomaly[] }>(
        "/admin/anomalies",
        token
      );
      setItems(res.data);
    } finally {
      setLoading(false);
    }
  };

  const triggerScan = async () => {
    if (!token) return;
    setLoading(true);
    try {
      await api.post("/admin/anomalies/scan", {}, token);
      await fetchAnomalies();
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id: string, status: AnomalyStatus) => {
    if (!token) return;
    setUpdatingId(id);
    try {
      await api.patch(`/admin/anomalies/${id}/status`, { status }, token);
      await fetchAnomalies();
    } finally {
      setUpdatingId(null);
    }
  };

  useEffect(() => {
    fetchAnomalies();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
              🧩 Guildmaster Anomalies Board
            </h1>
            <p className="text-sm text-slate-300">
              Review strange behavior from NPCs and adventurers across the realm.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={triggerScan}
              disabled={loading}
              className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-sm font-medium"
            >
              {loading ? "Scanning…" : "Scan for anomalies"}
            </button>
            <Link
              to="/admin/conflicts"
              className="text-xs md:text-sm px-3 py-2 rounded-lg border border-orange-500/60 text-orange-300 hover:bg-orange-500/10"
            >
              ⚖️ Conflicts
            </Link>
            <Link
              to="/admin/transactions"
              className="text-xs md:text-sm px-3 py-2 rounded-lg border border-amber-500/60 text-amber-300 hover:bg-amber-500/10"
            >
              📜 Ledger
            </Link>
            <Link
              to="/"
              className="text-xs md:text-sm px-3 py-2 rounded-lg border border-slate-600 text-slate-300 hover:bg-slate-700/50"
            >
              ← Dashboard
            </Link>
          </div>
        </header>

        <section className="rounded-2xl border border-slate-700 bg-slate-900/70 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              📋 Current Anomalies
            </h2>
            <span className="text-xs text-slate-400">
              {items.length} record{items.length === 1 ? "" : "s"}
            </span>
          </div>

          {items.length === 0 ? (
            <p className="text-sm text-slate-400">
              No anomalies recorded. The guild hall is calm… for now.
            </p>
          ) : (
            <div className="space-y-3">
              {items.map((a) => {
                const subject =
                  typeof a.subjectUserId === "string"
                    ? a.subjectUserId
                    : `${a.subjectUserId.displayName} (@${a.subjectUserId.username})`;

                return (
                  <div
                    key={a._id}
                    className="rounded-xl border border-slate-700 bg-slate-950/70 px-4 py-3 flex flex-col md:flex-row md:items-start md:justify-between gap-3"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-sm">
                        <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-100 text-xs">
                          {a.type}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs ${
                            a.severity === "CRITICAL"
                              ? "bg-red-600/20 text-red-300"
                              : a.severity === "HIGH"
                              ? "bg-orange-500/20 text-orange-300"
                              : a.severity === "MEDIUM"
                              ? "bg-amber-500/20 text-amber-200"
                              : "bg-emerald-500/20 text-emerald-200"
                          }`}
                        >
                          {a.severity}
                        </span>
                        <span className="text-xs text-slate-400">
                          {new Date(a.createdAt).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-sm font-medium">{a.summary}</p>
                      <p className="text-xs text-slate-400">
                        Subject: <span className="font-semibold">{subject}</span>{" "}
                        ({a.subjectRole})
                      </p>
                      {a.details && (
                        <p className="text-xs text-slate-300">{a.details}</p>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-2 items-center">
                      <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-200">
                        Status: {a.status}
                      </span>
                      {(["OPEN", "ACKNOWLEDGED", "RESOLVED", "IGNORED"] as AnomalyStatus[])
                        .filter((s) => s !== a.status)
                        .map((s) => (
                          <button
                            key={s}
                            disabled={updatingId === a._id}
                            onClick={() => updateStatus(a._id, s)}
                            className="text-xs px-2 py-1 rounded-lg border border-slate-600 hover:bg-slate-800 disabled:opacity-60"
                          >
                            Mark {s.toLowerCase()}
                          </button>
                        ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}


