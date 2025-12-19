// src/pages/NPCCompletions.tsx
import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { api } from "../lib/api";
import { Link } from "react-router-dom";

type Quest = {
  _id: string;
  title: string;
  description: string;
  difficulty: string;
  status: string;
  rewardGold?: number;
  deadline?: string;
  adventurerId?: string;
  adventurerName?: string;
  completionReportUrl?: string;
  completionSubmittedAt?: string;
  paidGold?: number;
  paidAt?: string;
};

export default function NPCCompletions() {
  const { token, user } = useAuth();
  const [quests, setQuests] = useState<Quest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<Record<string, number>>({});

  useEffect(() => {
    if (token) loadQuests();
  }, [token]);

  const loadQuests = async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const res = await api.get<{ success: boolean; data: Quest[] }>(
        "/quests/mine",
        token
      );
      // Filter to only completed quests
      const completed = res.data.filter((q) => q.status === "Completed");
      setQuests(completed);
      // Initialize payment amounts
      const amounts: Record<string, number> = {};
      completed.forEach((q) => {
        amounts[q._id] = q.rewardGold || 0;
      });
      setPaymentAmount(amounts);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load completions");
    } finally {
      setLoading(false);
    }
  };

  const handlePay = async (questId: string) => {
    if (!token) return;
    const amount = paymentAmount[questId];
    if (!amount || amount <= 0) {
      setError("Payment amount must be greater than 0");
      return;
    }

    setError(null);
    try {
      await api.post<{ success: boolean; data: Quest }>(
        `/quests/${questId}/pay`,
        { amount },
        token
      );
      await loadQuests();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to process payment");
    }
  };

  if (!user || user.role !== "NPC") {
    return <div className="min-h-screen bg-slate-900 text-slate-100 p-8">Access denied. NPC only.</div>;
  }

  return (
    <div className="min-h-screen bg-linear-to-b from-slate-900 via-slate-950 to-black text-slate-100">
      <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-extrabold tracking-wide flex items-center gap-2">
              ✅ Review Completions
            </h1>
            <p className="text-sm text-slate-300">Review submitted reports and approve payments</p>
          </div>
          <Link
            to="/npc/quests"
            className="text-xs md:text-sm px-3 py-2 rounded-lg border border-slate-600 text-slate-300 hover:bg-slate-700/50"
          >
            ← Back to Quest Board
          </Link>
        </header>

        {error && (
          <div className="rounded-lg border border-red-500/60 bg-red-900/40 px-4 py-3 text-red-100">
            ⚠️ {error}
          </div>
        )}

        {loading ? (
          <p className="text-slate-400">Loading completions…</p>
        ) : quests.length === 0 ? (
          <div className="rounded-2xl border border-slate-700 bg-slate-900/70 p-8 text-center">
            <p className="text-slate-400">No completed quests awaiting review.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {quests.map((quest) => (
              <div
                key={quest._id}
                className="rounded-2xl border border-emerald-500/40 bg-slate-900/70 p-5 space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold mb-2">{quest.title}</h3>
                    <p className="text-xs text-slate-500 font-mono mb-2">Quest ID: {quest._id}</p>
                    <p className="text-slate-300 mb-3">{quest.description}</p>
                    <div className="text-sm text-slate-400 space-y-1">
                      <p>
                        <b>Adventurer:</b> {quest.adventurerName || quest.adventurerId}
                      </p>
                      <p>
                        <b>Submitted:</b>{" "}
                        {quest.completionSubmittedAt
                          ? new Date(quest.completionSubmittedAt).toLocaleString()
                          : "N/A"}
                      </p>
                      {quest.deadline && (
                        <p>
                          <b>Deadline:</b> {new Date(quest.deadline).toLocaleString()}
                          {quest.completionSubmittedAt &&
                            new Date(quest.completionSubmittedAt) > new Date(quest.deadline) && (
                              <span className="text-red-400 ml-2">⚠️ Late submission</span>
                            )}
                        </p>
                      )}
                      {quest.completionReportUrl && (
                        <p>
                          <b>Report:</b>{" "}
                          <a
                            href={quest.completionReportUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-400 hover:underline"
                          >
                            View PDF Report
                          </a>
                        </p>
                      )}
                      <p>
                        <b>Reward:</b> {quest.rewardGold || 0} gold | <b>Difficulty:</b> {quest.difficulty}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="border-t border-slate-700 pt-3">
                  <div className="flex items-center gap-3">
                    <label className="text-sm font-semibold">Payment Amount:</label>
                    <input
                      className="input bg-slate-800 w-32"
                      type="number"
                      min="0"
                      value={paymentAmount[quest._id] || quest.rewardGold || 0}
                      onChange={(e) =>
                        setPaymentAmount({
                          ...paymentAmount,
                          [quest._id]: Number(e.target.value),
                        })
                      }
                    />
                    <span className="text-sm text-slate-400">gold</span>
                    <button
                      onClick={() => handlePay(quest._id)}
                      className="btn bg-emerald-600 hover:bg-emerald-700 text-sm px-4 py-2 ml-auto"
                    >
                      💰 Approve & Pay
                    </button>
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

