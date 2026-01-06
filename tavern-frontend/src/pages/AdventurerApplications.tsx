// src/pages/AdventurerApplications.tsx
import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { api } from "../lib/api";
import { Link } from "react-router-dom";
import QuestChat from "../components/QuestChat";

type Quest = {
  _id: string;
  title: string;
  description: string;
  difficulty: string;
  status: string;
  rewardGold?: number;
  deadline?: string;
  npcId: string;
  npcName?: string;
  applications: Array<{
    _id: string;
    adventurerId: string;
    note?: string;
    status: "PENDING" | "ACCEPTED" | "REJECTED";
    createdAt: string;
  }>;
  completionReportUrl?: string;
  completionSubmittedAt?: string;
  hasConflict?: boolean;
  originalDescription?: string;
  originalDeadline?: string;
};

export default function AdventurerApplications() {
  const { token, user } = useAuth();
  const [quests, setQuests] = useState<Quest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedQuest, setSelectedQuest] = useState<Quest | null>(null);
  const [reportFile, setReportFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [showSubmitForm, setShowSubmitForm] = useState(false);
  const [chatQuest, setChatQuest] = useState<Quest | null>(null);
  const [showConflictForm, setShowConflictForm] = useState(false);
  const [conflictQuest, setConflictQuest] = useState<Quest | null>(null);
  const [conflictType, setConflictType] = useState<"REPORT_REJECTED" | "QUEST_CHANGED">("REPORT_REJECTED");
  const [conflictDescription, setConflictDescription] = useState("");
  const [raisingConflict, setRaisingConflict] = useState(false);

  useEffect(() => {
    if (!token) return;
    
    // Initial load
    loadQuests();
    
    // Poll for application status updates every 10 seconds
    const interval = setInterval(() => {
      loadQuests(true); // Silent polling
    }, 10000);
    
    return () => clearInterval(interval);
  }, [token]);

  const loadQuests = async (silent = false) => {
    if (!token) return;
    if (!silent) setLoading(true);
    setError(null);
    try {
      const res = await api.get<{ success: boolean; data: Quest[] }>(
        "/quests/applications/mine",
        token
      );
      setQuests(res.data);
    } catch (err: unknown) {
      // Don't show error on polling failures, only on initial load
      if (!silent) {
        setError(err instanceof Error ? err.message : "Failed to load applications");
      }
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const handleSubmitCompletion = async (questId: string) => {
    if (!token) return;

    // Check if deadline has passed before submitting
    if (selectedQuest?.deadline && new Date() > new Date(selectedQuest.deadline)) {
      setError("Cannot submit completion after deadline has passed.");
      return;
    }

    setError(null);
    setUploading(true);
    try {
      let reportUrl: string | undefined;

      // Upload PDF if provided (optional)
      if (reportFile) {
        const formData = new FormData();
        formData.append('file', reportFile);
        formData.append('questId', questId);

        const BASE = import.meta.env.VITE_API_URL as string;
        const uploadRes = await fetch(`${BASE}/quests/upload-report`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        });

        if (uploadRes.ok) {
          const uploadData = await uploadRes.json();
          reportUrl = uploadData.url;
        }
        // If upload fails, continue without PDF (don't block completion)
      }

      // Submit completion (with or without PDF)
      await api.post<{ success: boolean; data: Quest }>(
        `/quests/${questId}/submit-completion`,
        { reportUrl },
        token
      );
      setShowSubmitForm(false);
      setReportFile(null);
      setSelectedQuest(null);
      await loadQuests();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to submit completion");
    } finally {
      setUploading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PENDING": return "text-yellow-400";
      case "ACCEPTED": return "text-green-400";
      case "REJECTED": return "text-red-400";
      case "Completed": return "text-emerald-400";
      case "Paid": return "text-purple-400";
      default: return "text-slate-400";
    }
  };

  const getMyApplication = (quest: Quest) => {
    if (!user) return null;
    return quest.applications.find((app) => app.adventurerId === user.id);
  };

  const handleRaiseConflict = async () => {
    if (!token || !conflictQuest || !conflictDescription.trim()) {
      setError("Please provide a description for the conflict");
      return;
    }

    setRaisingConflict(true);
    setError(null);
    try {
      await api.post(
        `/quests/${conflictQuest._id}/conflicts/raise`,
        {
          type: conflictType,
          description: conflictDescription.trim(),
        },
        token
      );
      setShowConflictForm(false);
      setConflictQuest(null);
      setConflictDescription("");
      await loadQuests();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to raise conflict");
    } finally {
      setRaisingConflict(false);
    }
  };

  const canRaiseReportRejectedConflict = (quest: Quest) => {
    // Can raise if completion was submitted but status is back to Accepted (rejected)
    return quest.status === "Accepted" && quest.completionSubmittedAt !== undefined;
  };

  const canRaiseQuestChangedConflict = (quest: Quest) => {
    // Can raise if quest details changed (description or deadline different from original)
    if (quest.status !== "Accepted") return false;
    if (!quest.originalDescription && !quest.originalDeadline) return false; // No original details stored
    if (quest.description !== quest.originalDescription) return true;
    if (quest.deadline && quest.originalDeadline && quest.deadline !== quest.originalDeadline) return true;
    return false;
  };

  if (!user || user.role !== "ADVENTURER") {
    return <div className="min-h-screen bg-slate-900 text-slate-100 p-8">Access denied. Adventurer only.</div>;
  }

  return (
    <div className="min-h-screen bg-linear-to-b from-slate-900 via-slate-950 to-black text-slate-100">
      <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-extrabold tracking-wide flex items-center gap-2">
              📋 My Quest Applications
            </h1>
            <p className="text-sm text-slate-300">Track your applications and submit completions</p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              to="/adventurer/quests"
              className="text-xs md:text-sm px-3 py-2 rounded-lg border border-blue-500/60 text-blue-300 hover:bg-blue-500/10"
            >
              ⚔️ Browse Quests
            </Link>
            <Link
              to="/"
              className="text-xs md:text-sm px-3 py-2 rounded-lg border border-slate-600 text-slate-300 hover:bg-slate-700/50"
            >
              ← Back to Dashboard
            </Link>
          </div>
        </header>

        {error && (
          <div className="rounded-lg border border-red-500/60 bg-red-900/40 px-4 py-3 text-red-100">
            ⚠️ {error}
          </div>
        )}

        {loading ? (
          <p className="text-slate-400">Loading applications…</p>
        ) : quests.length === 0 ? (
          <div className="rounded-2xl border border-slate-700 bg-slate-900/70 p-8 text-center">
            <p className="text-slate-400">No applications yet. Browse quests to get started!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {quests.map((quest) => {
              const myApp = getMyApplication(quest);
              if (!myApp) return null;

              return (
                <div
                  key={quest._id}
                  className="rounded-2xl border border-blue-500/40 bg-slate-900/70 p-5 space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-semibold">{quest.title}</h3>
                        <span className={`text-sm font-medium ${getStatusColor(quest.status)}`}>
                          {quest.status}
                        </span>
                        <span className={`text-sm font-medium ${getStatusColor(myApp.status)}`}>
                          Application: {myApp.status}
                        </span>
                      </div>
                      <p className="text-slate-300 mb-3">{quest.description}</p>
                      <div className="text-sm text-slate-400 space-y-1">
                        <p>
                          <b>Applied:</b> {new Date(myApp.createdAt).toLocaleString()}
                        </p>
                        {myApp.note && (
                          <p>
                            <b>Your Note:</b> {myApp.note}
                          </p>
                        )}
                        {quest.deadline && (
                          <p>
                            <b>Deadline:</b> {new Date(quest.deadline).toLocaleString()}
                            {quest.status === "Accepted" && new Date() > new Date(quest.deadline) && (
                              <span className="text-red-400 ml-2">⚠️ Deadline passed - Cannot submit completion</span>
                            )}
                          </p>
                        )}
                        <p>
                          <b>Reward:</b> {quest.rewardGold || 0} gold | <b>Difficulty:</b> {quest.difficulty}
                        </p>
                        {quest.completionReportUrl && (
                          <p>
                            <b>Report Submitted:</b>{" "}
                            <a
                              href={quest.completionReportUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-400 hover:underline"
                            >
                              View Report
                            </a>
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {quest.status === "Accepted" && !quest.completionReportUrl && (
                      <>
                        {quest.deadline && new Date() > new Date(quest.deadline) ? (
                          <span className="text-sm text-red-400 px-4 py-2 border border-red-500/40 rounded-lg">
                            ⛔ Deadline Passed - Submission Blocked
                          </span>
                        ) : (
                          <button
                            onClick={() => {
                              // Double-check deadline before opening form
                              if (quest.deadline && new Date() > new Date(quest.deadline)) {
                                setError("Cannot submit completion after deadline has passed.");
                                return;
                              }
                              setSelectedQuest(quest);
                              setShowSubmitForm(true);
                            }}
                            className="btn bg-emerald-600 hover:bg-emerald-700 text-sm px-4 py-2"
                          >
                            ✅ Submit Completion
                          </button>
                        )}
                      </>
                    )}
                    {quest.status === "Accepted" && (
                      <>
                        <button
                          onClick={() => setChatQuest(quest)}
                          className="btn bg-indigo-600 hover:bg-indigo-700 text-sm px-4 py-2"
                        >
                          💬 Chat
                        </button>
                        {!quest.hasConflict && (canRaiseReportRejectedConflict(quest) || canRaiseQuestChangedConflict(quest)) && (
                          <button
                            onClick={() => {
                              setConflictQuest(quest);
                              setConflictType(canRaiseReportRejectedConflict(quest) ? "REPORT_REJECTED" : "QUEST_CHANGED");
                              setShowConflictForm(true);
                            }}
                            className="btn bg-orange-600 hover:bg-orange-700 text-sm px-4 py-2"
                          >
                            ⚖️ Raise Conflict
                          </button>
                        )}
                        {quest.hasConflict && (
                          <span className="text-sm text-orange-400 px-4 py-2 border border-orange-500/40 rounded-lg">
                            ⚖️ Conflict Raised
                          </span>
                        )}
                      </>
                    )}
                    {quest.status === "Completed" && (
                      <span className="text-sm text-emerald-400 px-4 py-2 border border-emerald-500/40 rounded-lg">
                        ⏳ Awaiting Payment
                      </span>
                    )}
                    {quest.status === "Paid" && (
                      <span className="text-sm text-purple-400 px-4 py-2 border border-purple-500/40 rounded-lg">
                        ✅ Payment Received
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Submit completion form */}
        {showSubmitForm && selectedQuest && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-slate-900 rounded-2xl border border-emerald-500/40 w-full max-w-md p-6 space-y-4">
              <h3 className="text-xl font-semibold">Submit Completion: {selectedQuest.title}</h3>
              <div>
                <label className="text-sm font-semibold mb-2 block">Upload PDF Report (Optional)</label>
                <input
                  className="input bg-slate-800 mt-1"
                  type="file"
                  accept=".pdf,application/pdf"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      if (file.size > 10 * 1024 * 1024) {
                        setError("File size must be less than 10MB");
                        return;
                      }
                      setReportFile(file);
                      setError(null);
                    }
                  }}
                />
                {reportFile && (
                  <p className="text-xs text-slate-300 mt-2">
                    Selected: {reportFile.name} ({(reportFile.size / 1024 / 1024).toFixed(2)} MB)
                  </p>
                )}
                <p className="text-xs text-slate-400 mt-1">
                  Optional: Upload a PDF report documenting your quest completion. Max size: 10MB. You can submit without a report.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleSubmitCompletion(selectedQuest._id)}
                  className="btn bg-emerald-600 hover:bg-emerald-700 flex-1"
                  disabled={uploading}
                >
                  {uploading ? "Submitting..." : reportFile ? "Upload & Submit" : "Submit Completion"}
                </button>
                <button
                  onClick={() => {
                    setShowSubmitForm(false);
                    setSelectedQuest(null);
                    setReportFile(null);
                  }}
                  className="btn bg-slate-600 hover:bg-slate-700"
                  disabled={uploading}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {chatQuest && (
          <QuestChat
            questId={chatQuest._id}
            questTitle={chatQuest.title}
            onClose={() => setChatQuest(null)}
          />
        )}

        {/* Raise Conflict Form */}
        {showConflictForm && conflictQuest && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-slate-900 rounded-2xl border border-orange-500/40 w-full max-w-md p-6 space-y-4">
              <h3 className="text-xl font-semibold">
                Raise Conflict: {conflictType === "REPORT_REJECTED" ? "Report Rejected" : "Quest Changed"}
              </h3>
              <p className="text-sm text-slate-300">
                {conflictType === "REPORT_REJECTED"
                  ? "Your completion report was rejected. Raising a conflict requires escrowing 50% of the quest reward."
                  : "The quest details were changed after acceptance. Raising a conflict requires escrowing 50% of the quest reward."}
              </p>
              <div>
                <label className="text-sm font-semibold mb-2 block">Conflict Description *</label>
                <textarea
                  className="input bg-slate-800 mt-1 min-h-[100px]"
                  placeholder="Explain the issue and why you're raising this conflict..."
                  value={conflictDescription}
                  onChange={(e) => setConflictDescription(e.target.value)}
                />
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleRaiseConflict}
                  className="btn bg-orange-600 hover:bg-orange-700 flex-1"
                  disabled={raisingConflict || !conflictDescription.trim()}
                >
                  {raisingConflict ? "Raising Conflict..." : `Raise Conflict (50% Escrow)`}
                </button>
                <button
                  onClick={() => {
                    setShowConflictForm(false);
                    setConflictQuest(null);
                    setConflictDescription("");
                  }}
                  className="btn bg-slate-600 hover:bg-slate-700"
                  disabled={raisingConflict}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

