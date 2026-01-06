// src/pages/NPCApplications.tsx
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
  applications: Array<{
    _id: string;
    adventurerId: string | { _id: string; username: string; displayName: string };
    note?: string;
    status: "PENDING" | "ACCEPTED" | "REJECTED";
    createdAt: string;
  }>;
};

export default function NPCApplications() {
  const { token, user } = useAuth();
  const [quests, setQuests] = useState<Quest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedQuest, setSelectedQuest] = useState<Quest | null>(null);
  const [deadline, setDeadline] = useState("");

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
      // Filter to only quests with pending applications
      const withApplications = res.data.filter(
        (q) => q.applications && q.applications.some((a) => a.status === "PENDING")
      );
      setQuests(withApplications);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load applications");
    } finally {
      setLoading(false);
    }
  };

  const handleDecision = async (
    questId: string,
    applicationId: string,
    decision: "ACCEPT" | "REJECT"
  ) => {
    if (!token) return;
    if (decision === "ACCEPT" && !deadline) {
      setError("Please set a deadline when accepting an application");
      return;
    }

    setError(null);
    try {
      const payload: any = { decision };
      if (decision === "ACCEPT" && deadline) {
        payload.deadline = new Date(deadline).toISOString();
      }
      await api.post<{ success: boolean; data: Quest }>(
        `/quests/${questId}/applications/${applicationId}/decision`,
        payload,
        token
      );
      setDeadline("");
      setSelectedQuest(null);
      await loadQuests();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to process application");
    }
  };

  if (!user || user.role !== "NPC") {
    return <div className="min-h-screen bg-slate-900 text-slate-100 p-8">Access denied. NPC only.</div>;
  }

  const pendingApps = quests.flatMap((q) =>
    q.applications
      .filter((a) => a.status === "PENDING")
      .map((a) => ({ quest: q, application: a }))
  );

  return (
    <div className="min-h-screen bg-linear-to-b from-slate-900 via-slate-950 to-black text-slate-100">
      <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-extrabold tracking-wide flex items-center gap-2">
              📋 Quest Applications
            </h1>
            <p className="text-sm text-slate-300">Review and accept/reject adventurer applications</p>
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
          <p className="text-slate-400">Loading applications…</p>
        ) : pendingApps.length === 0 ? (
          <div className="rounded-2xl border border-slate-700 bg-slate-900/70 p-8 text-center">
            <p className="text-slate-400">No pending applications at this time.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {pendingApps.map(({ quest, application }) => (
              <div
                key={application._id}
                className="rounded-2xl border border-blue-500/40 bg-slate-900/70 p-5 space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold mb-2">{quest.title}</h3>
                    <p className="text-slate-300 mb-3">{quest.description}</p>
                    <div className="text-sm text-slate-400 space-y-1">
                      <p>
                        <b>Applicant:</b>{" "}
                        {typeof application.adventurerId === "object"
                          ? application.adventurerId.displayName || application.adventurerId.username
                          : application.adventurerId}
                      </p>
                      <p>
                        <b>Applied:</b> {new Date(application.createdAt).toLocaleString()}
                      </p>
                      {application.note && (
                        <p>
                          <b>Note:</b> {application.note}
                        </p>
                      )}
                      <p>
                        <b>Reward:</b> {quest.rewardGold || 0} gold | <b>Difficulty:</b> {quest.difficulty}
                      </p>
                    </div>
                  </div>
                </div>
                {selectedQuest?._id === quest._id && selectedQuest.applications.find((a) => a._id === application._id) ? (
                  <div className="border-t border-slate-700 pt-3 space-y-3">
                    <div>
                      <label className="text-sm font-semibold">Set Deadline (required for acceptance)</label>
                      <input
                        className="input bg-slate-800 mt-1"
                        type="datetime-local"
                        value={deadline}
                        onChange={(e) => setDeadline(e.target.value)}
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() =>
                          handleDecision(quest._id, application._id, "ACCEPT")
                        }
                        className="btn bg-green-600 hover:bg-green-700 text-sm px-4 py-2"
                        disabled={!deadline}
                      >
                        ✅ Accept
                      </button>
                      <button
                        onClick={() =>
                          handleDecision(quest._id, application._id, "REJECT")
                        }
                        className="btn bg-red-600 hover:bg-red-700 text-sm px-4 py-2"
                      >
                        ❌ Reject
                      </button>
                      <button
                        onClick={() => {
                          setSelectedQuest(null);
                          setDeadline("");
                        }}
                        className="btn bg-slate-600 hover:bg-slate-700 text-sm px-4 py-2"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setSelectedQuest(quest);
                        setDeadline("");
                      }}
                      className="btn bg-blue-600 hover:bg-blue-700 text-sm px-4 py-2"
                    >
                      Review Application
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

