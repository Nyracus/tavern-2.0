// src/pages/AdminConflicts.tsx
import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { api } from "../lib/api";
import { Link } from "react-router-dom";
import QuestChat from "../components/QuestChat";

type ConflictType = "REPORT_REJECTED" | "QUEST_CHANGED" | "DEADLINE_MISSED";
type ConflictStatus = "OPEN" | "RESOLVED" | "CANCELLED";
type ConflictResolution = "ADVENTURER_WIN" | "NPC_WIN" | null;

type Conflict = {
  _id: string;
  questId: {
    _id: string;
    title: string;
    rewardGold?: number;
    status: string;
  };
  type: ConflictType;
  status: ConflictStatus;
  raisedBy: {
    _id: string;
    username: string;
    displayName: string;
  };
  raisedByRole: "ADVENTURER" | "NPC";
  npcId: {
    _id: string;
    username: string;
    displayName: string;
  };
  adventurerId: {
    _id: string;
    username: string;
    displayName: string;
  };
  description: string;
  escrowedAmount: number;
  resolution?: ConflictResolution;
  resolvedBy?: {
    _id: string;
    username: string;
    displayName: string;
  };
  resolvedAt?: string;
  resolutionNotes?: string;
  createdAt: string;
};

export default function AdminConflicts() {
  const { token, user } = useAuth();
  const [conflicts, setConflicts] = useState<Conflict[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedQuestId, setSelectedQuestId] = useState<string | null>(null);
  const [selectedQuestTitle, setSelectedQuestTitle] = useState<string>("");
  const [resolvingId, setResolvingId] = useState<string | null>(null);

  useEffect(() => {
    if (token && user?.role === "GUILD_MASTER") {
      loadConflicts();
    }
  }, [token, user]);

  const loadConflicts = async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const res = await api.get<{ success: boolean; data: Conflict[] }>(
        "/admin/conflicts",
        token
      );
      setConflicts(res.data || []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load conflicts");
    } finally {
      setLoading(false);
    }
  };

  const handleResolve = async (conflictId: string, resolution: "ADVENTURER_WIN" | "NPC_WIN", notes?: string) => {
    if (!token) return;
    setResolvingId(conflictId);
    setError(null);
    try {
      await api.post(
        `/admin/conflicts/${conflictId}/resolve`,
        {
          resolution,
          resolutionNotes: notes || undefined,
        },
        token
      );
      await loadConflicts();
      setSelectedQuestId(null);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to resolve conflict");
    } finally {
      setResolvingId(null);
    }
  };

  const getTypeLabel = (type: ConflictType) => {
    switch (type) {
      case "REPORT_REJECTED":
        return "Report Rejected";
      case "QUEST_CHANGED":
        return "Quest Details Changed";
      case "DEADLINE_MISSED":
        return "Deadline Missed";
      default:
        return type;
    }
  };

  const getTypeColor = (type: ConflictType) => {
    switch (type) {
      case "REPORT_REJECTED":
        return "bg-red-500/20 text-red-300 border-red-400/60";
      case "QUEST_CHANGED":
        return "bg-yellow-500/20 text-yellow-300 border-yellow-400/60";
      case "DEADLINE_MISSED":
        return "bg-orange-500/20 text-orange-300 border-orange-400/60";
      default:
        return "bg-slate-500/20 text-slate-300 border-slate-400/60";
    }
  };

  if (!user || user.role !== "GUILD_MASTER") {
    return (
      <div className="min-h-screen bg-slate-900 text-slate-100 p-8">
        Access denied. Guildmaster only.
      </div>
    );
  }

  const openConflicts = conflicts.filter((c) => c.status === "OPEN");
  const resolvedConflicts = conflicts.filter((c) => c.status === "RESOLVED");

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-950 to-black text-slate-100">
      <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-extrabold tracking-wide flex items-center gap-2">
              ⚖️ Conflict Resolution Center
            </h1>
            <p className="text-sm text-slate-300">Review and resolve quest disputes</p>
          </div>
          <Link
            to="/admin/anomalies"
            className="text-xs md:text-sm px-3 py-2 rounded-lg border border-emerald-500/60 text-emerald-300 hover:bg-emerald-500/10"
          >
            ← Back to Anomalies
          </Link>
        </header>

        {error && (
          <div className="rounded-lg border border-red-500/60 bg-red-900/40 px-4 py-3 text-red-100">
            ⚠️ {error}
          </div>
        )}

        {loading ? (
          <p className="text-slate-400">Loading conflicts…</p>
        ) : (
          <>
            {/* Open Conflicts */}
            <section>
              <h2 className="text-xl font-semibold mb-4">🟢 Open Conflicts ({openConflicts.length})</h2>
              {openConflicts.length === 0 ? (
                <div className="rounded-2xl border border-slate-700 bg-slate-900/70 p-8 text-center">
                  <p className="text-slate-400">No open conflicts at this time.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {openConflicts.map((conflict) => (
                    <div
                      key={conflict._id}
                      className="rounded-2xl border border-yellow-500/40 bg-slate-900/70 p-6 space-y-4"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <span
                              className={`inline-flex items-center px-3 py-1 rounded-full border text-sm font-semibold ${getTypeColor(
                                conflict.type
                              )}`}
                            >
                              {getTypeLabel(conflict.type)}
                            </span>
                            <span className="text-sm text-slate-400">
                              Raised by {conflict.raisedBy.displayName || conflict.raisedBy.username} (
                              {conflict.raisedByRole})
                            </span>
                          </div>
                          <h3 className="text-lg font-semibold mb-2">
                            Quest: {typeof conflict.questId === "object" ? conflict.questId.title : "Unknown"}
                          </h3>
                          <p className="text-slate-300 mb-3">{conflict.description}</p>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                              <span className="text-slate-400">NPC:</span>{" "}
                              {typeof conflict.npcId === "object"
                                ? conflict.npcId.displayName || conflict.npcId.username
                                : "Unknown"}
                            </div>
                            <div>
                              <span className="text-slate-400">Adventurer:</span>{" "}
                              {typeof conflict.adventurerId === "object"
                                ? conflict.adventurerId.displayName || conflict.adventurerId.username
                                : "Unknown"}
                            </div>
                            <div>
                              <span className="text-slate-400">Reward:</span>{" "}
                              {typeof conflict.questId === "object" ? conflict.questId.rewardGold || 0 : 0} gold
                            </div>
                            <div>
                              <span className="text-slate-400">Escrowed:</span> {conflict.escrowedAmount} gold
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 pt-3 border-t border-slate-700">
                        <button
                          onClick={() => {
                            setSelectedQuestId(
                              typeof conflict.questId === "object" ? conflict.questId._id : ""
                            );
                            setSelectedQuestTitle(
                              typeof conflict.questId === "object" ? conflict.questId.title : "Quest Chat"
                            );
                          }}
                          className="btn bg-indigo-600 hover:bg-indigo-700 text-sm px-4 py-2"
                        >
                          💬 View Chat
                        </button>
                        <div className="flex-1" />
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              if (confirm("Resolve conflict in favor of the Adventurer? They will receive 150% payment + 50% escrow returned, and the NPC will be demoted.")) {
                                handleResolve(conflict._id, "ADVENTURER_WIN");
                              }
                            }}
                            disabled={resolvingId === conflict._id}
                            className="btn bg-green-600 hover:bg-green-700 text-sm px-4 py-2 disabled:opacity-50"
                          >
                            {resolvingId === conflict._id ? "Resolving…" : "✓ Adventurer Wins"}
                          </button>
                          <button
                            onClick={() => {
                              if (confirm("Resolve conflict in favor of the NPC? The adventurer will be demoted and their escrow will be forfeited.")) {
                                handleResolve(conflict._id, "NPC_WIN");
                              }
                            }}
                            disabled={resolvingId === conflict._id}
                            className="btn bg-red-600 hover:bg-red-700 text-sm px-4 py-2 disabled:opacity-50"
                          >
                            {resolvingId === conflict._id ? "Resolving…" : "✗ NPC Wins"}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Resolved Conflicts */}
            {resolvedConflicts.length > 0 && (
              <section>
                <h2 className="text-xl font-semibold mb-4">✅ Resolved Conflicts ({resolvedConflicts.length})</h2>
                <div className="space-y-3">
                  {resolvedConflicts.map((conflict) => (
                    <div
                      key={conflict._id}
                      className="rounded-xl border border-slate-700 bg-slate-900/50 p-4 text-sm"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="font-semibold">
                            {typeof conflict.questId === "object" ? conflict.questId.title : "Unknown"}
                          </span>
                          {" - "}
                          <span className="text-slate-400">
                            {conflict.resolution === "ADVENTURER_WIN" ? "✓ Adventurer Won" : "✗ NPC Won"}
                          </span>
                        </div>
                        <span className="text-slate-500">
                          {conflict.resolvedAt
                            ? new Date(conflict.resolvedAt).toLocaleDateString()
                            : "Unknown date"}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </>
        )}

        {/* Chat Modal */}
        {selectedQuestId && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
            <div className="bg-slate-900 rounded-2xl border border-slate-700 w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
              <div className="p-4 border-b border-slate-700 flex items-center justify-between">
                <h3 className="text-lg font-semibold">Quest Chat: {selectedQuestTitle}</h3>
                <button
                  onClick={() => {
                    setSelectedQuestId(null);
                    setSelectedQuestTitle("");
                  }}
                  className="btn bg-slate-700 hover:bg-slate-600 text-sm px-3 py-1"
                >
                  ✕ Close
                </button>
              </div>
              <div className="flex-1 overflow-hidden">
                <QuestChat
                  questId={selectedQuestId}
                  questTitle={selectedQuestTitle}
                  onClose={() => {
                    setSelectedQuestId(null);
                    setSelectedQuestTitle("");
                  }}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

