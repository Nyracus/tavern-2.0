// src/pages/NPCQuestBoard.tsx
import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { api } from "../lib/api";
import { Link } from "react-router-dom";
import QuestChat from "../components/QuestChat";

type QuestDifficulty = "Easy" | "Medium" | "Hard" | "Epic";
type QuestStatus = "Open" | "Applied" | "Accepted" | "Completed" | "Paid" | "Cancelled";

type Quest = {
  _id: string;
  title: string;
  description: string;
  difficulty: QuestDifficulty;
  status: QuestStatus;
  rewardGold?: number;
  deadline?: string;
  adventurerId?: string;
  applications?: Array<{
    _id: string;
    adventurerId: string;
    note?: string;
    status: "PENDING" | "ACCEPTED" | "REJECTED";
    createdAt: string;
  }>;
  createdAt: string;
  updatedAt: string;
};

type QuestForm = {
  title: string;
  description: string;
  difficulty: QuestDifficulty;
  rewardGold: number;
  deadline?: string;
};

export default function NPCQuestBoard() {
  const { token, user } = useAuth();
  const [quests, setQuests] = useState<Quest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingQuest, setEditingQuest] = useState<Quest | null>(null);
  const [chatQuest, setChatQuest] = useState<Quest | null>(null);
  const [form, setForm] = useState<QuestForm>({
    title: "",
    description: "",
    difficulty: "Easy",
    rewardGold: 0,
    deadline: "",
  });

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
      setQuests(res.data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load quests");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setError(null);

    const payload: any = {
      title: form.title,
      description: form.description,
      difficulty: form.difficulty,
      rewardGold: form.rewardGold,
    };
    if (form.deadline) {
      payload.deadline = new Date(form.deadline).toISOString();
    }

    try {
      if (editingQuest) {
        await api.patch<{ success: boolean; data: Quest }>(
          `/quests/${editingQuest._id}`,
          payload,
          token
        );
      } else {
        await api.post<{ success: boolean; data: Quest }>(
          "/quests",
          payload,
          token
        );
      }
      setShowForm(false);
      setEditingQuest(null);
      setForm({ title: "", description: "", difficulty: "Easy", rewardGold: 0, deadline: "" });
      await loadQuests();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to save quest");
    }
  };

  const handleEdit = (quest: Quest) => {
    setEditingQuest(quest);
    setForm({
      title: quest.title,
      description: quest.description,
      difficulty: quest.difficulty,
      rewardGold: quest.rewardGold || 0,
      deadline: quest.deadline ? new Date(quest.deadline).toISOString().slice(0, 16) : "",
    });
    setShowForm(true);
  };

  const handleDelete = async (questId: string) => {
    if (!token || !confirm("Are you sure you want to delete this quest?")) return;
    try {
      await api.del(`/quests/${questId}`, token);
      await loadQuests();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to delete quest");
    }
  };

  const getStatusColor = (status: QuestStatus) => {
    switch (status) {
      case "Open": return "text-blue-400";
      case "Applied": return "text-yellow-400";
      case "Accepted": return "text-green-400";
      case "Completed": return "text-emerald-400";
      case "Paid": return "text-purple-400";
      case "Cancelled": return "text-red-400";
      default: return "text-slate-400";
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
              📜 Quest Board
            </h1>
            <p className="text-sm text-slate-300">Manage your posted quests</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setShowForm(!showForm);
                setEditingQuest(null);
                setForm({ title: "", description: "", difficulty: "Easy", rewardGold: 0, deadline: "" });
              }}
              className="btn bg-purple-600 hover:bg-purple-700 text-sm px-4 py-2"
            >
              {showForm ? "Cancel" : "+ Post Quest"}
            </button>
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

        {showForm && (
          <form
            onSubmit={handleSubmit}
            className="rounded-2xl border border-purple-500/40 bg-slate-900/70 p-6 space-y-4"
          >
            <h2 className="text-xl font-semibold">
              {editingQuest ? "✏️ Edit Quest" : "📝 Post New Quest"}
            </h2>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-semibold">Title</label>
                <input
                  className="input bg-slate-800"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="text-sm font-semibold">Difficulty</label>
                <select
                  className="input bg-slate-800"
                  value={form.difficulty}
                  onChange={(e) => setForm({ ...form, difficulty: e.target.value as QuestDifficulty })}
                >
                  <option value="Easy">Easy</option>
                  <option value="Medium">Medium</option>
                  <option value="Hard">Hard</option>
                  <option value="Epic">Epic</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-semibold">Reward Gold</label>
                <input
                  className="input bg-slate-800"
                  type="number"
                  min="0"
                  value={form.rewardGold}
                  onChange={(e) => setForm({ ...form, rewardGold: Number(e.target.value) })}
                  required
                />
              </div>
              <div>
                <label className="text-sm font-semibold">Deadline (optional)</label>
                <input
                  className="input bg-slate-800"
                  type="datetime-local"
                  value={form.deadline}
                  onChange={(e) => setForm({ ...form, deadline: e.target.value })}
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-semibold">Description</label>
              <textarea
                className="input bg-slate-800 min-h-[100px]"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                required
              />
            </div>
            <button type="submit" className="btn bg-purple-600 hover:bg-purple-700">
              {editingQuest ? "Update Quest" : "Post Quest"}
            </button>
          </form>
        )}

        {loading ? (
          <p className="text-slate-400">Loading quests…</p>
        ) : quests.length === 0 ? (
          <div className="rounded-2xl border border-slate-700 bg-slate-900/70 p-8 text-center">
            <p className="text-slate-400">No quests posted yet. Post your first quest above!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {quests.map((quest) => (
              <div
                key={quest._id}
                className="rounded-2xl border border-purple-500/40 bg-slate-900/70 p-5 space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-semibold">{quest.title}</h3>
                      <span className={`text-sm font-medium ${getStatusColor(quest.status)}`}>
                        {quest.status}
                      </span>
                      <span className="text-sm text-slate-400">
                        {quest.difficulty}
                      </span>
                    </div>
                    <p className="text-slate-300 mb-2">{quest.description}</p>
                    <div className="flex items-center gap-4 text-sm text-slate-400">
                      <span>💰 {quest.rewardGold || 0} gold</span>
                      {quest.deadline && (
                        <span>⏰ {new Date(quest.deadline).toLocaleString()}</span>
                      )}
                      {quest.applications && quest.applications.length > 0 && (
                        <span>📋 {quest.applications.length} application(s)</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {quest.status === "Open" && (
                      <button
                        onClick={() => handleEdit(quest)}
                        className="btn bg-blue-600 hover:bg-blue-700 text-sm px-3 py-1"
                      >
                        Edit
                      </button>
                    )}
                    {quest.status === "Open" && (
                      <button
                        onClick={() => handleDelete(quest._id)}
                        className="btn bg-red-600 hover:bg-red-700 text-sm px-3 py-1"
                      >
                        Delete
                      </button>
                    )}
                    {quest.status === "Applied" && (
                      <Link
                        to="/npc/applications"
                        className="btn bg-yellow-600 hover:bg-yellow-700 text-sm px-3 py-1"
                      >
                        Review Applications
                      </Link>
                    )}
                    {quest.status === "Completed" && (
                      <Link
                        to="/npc/completions"
                        className="btn bg-emerald-600 hover:bg-emerald-700 text-sm px-3 py-1"
                      >
                        Review & Pay
                      </Link>
                    )}
                    {(quest.status === "Accepted" || quest.status === "Completed") && (
                      <button
                        onClick={() => setChatQuest(quest)}
                        className="btn bg-indigo-600 hover:bg-indigo-700 text-sm px-3 py-1"
                      >
                        💬 Chat
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {chatQuest && (
          <QuestChat
            questId={chatQuest._id}
            questTitle={chatQuest.title}
            onClose={() => setChatQuest(null)}
          />
        )}
      </div>
    </div>
  );
}

