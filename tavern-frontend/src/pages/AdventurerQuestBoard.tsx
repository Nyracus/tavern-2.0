// src/pages/AdventurerQuestBoard.tsx
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
  npcId: string;
  npcName?: string;
  adventurerId?: string;
  applications?: Array<{
    _id: string;
    adventurerId: string;
    note?: string;
    status: "PENDING" | "ACCEPTED" | "REJECTED";
    createdAt: string;
  }>;
  recommendationScore?: number;
  recommendationRank?: string;
  createdAt: string;
};

type AdventurerProfile = {
  level: number;
  xp?: number;
  rank?: string;
};

export default function AdventurerQuestBoard() {
  const { token, user } = useAuth();
  const [quests, setQuests] = useState<Quest[]>([]);
  const [recommendedQuests, setRecommendedQuests] = useState<Quest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "recommended" | "open">("recommended");
  const [selectedQuest, setSelectedQuest] = useState<Quest | null>(null);
  const [applyNote, setApplyNote] = useState("");
  const [showApplyForm, setShowApplyForm] = useState(false);
  const [profile, setProfile] = useState<AdventurerProfile | null>(null);
  const [chatQuest, setChatQuest] = useState<Quest | null>(null);
  
  // Search and filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [difficultyFilter, setDifficultyFilter] = useState<string[]>([]);
  const [minReward, setMinReward] = useState("");
  const [maxReward, setMaxReward] = useState("");
  const [sortBy, setSortBy] = useState<"createdAt" | "rewardGold" | "difficulty">("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    if (token) {
      loadProfile();
      loadQuests();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const loadProfile = async () => {
    if (!token) return;
    try {
      const res = await api.get<{ success: boolean; data: AdventurerProfile }>(
        "/adventurers/me",
        token
      );
      setProfile(res.data);
    } catch (err) {
      // Profile might not exist yet, that's ok
      console.log("No profile found");
    }
  };

  const loadQuests = async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      // Build query params for search/filter
      const params = new URLSearchParams();
      params.append("status", "Open");
      
      if (searchQuery) params.append("search", searchQuery);
      if (difficultyFilter.length > 0) params.append("difficulty", difficultyFilter.join(","));
      if (minReward) params.append("minReward", minReward);
      if (maxReward) params.append("maxReward", maxReward);
      params.append("sortBy", sortBy);
      params.append("sortOrder", sortOrder);

      // Load all open quests with filters
      const res = await api.get<{ success: boolean; data: Quest[] }>(
        `/quests?${params.toString()}`,
        token
      );
      
      // Load recommended quests (with ranking) - only if no search/filters
      if (!searchQuery && difficultyFilter.length === 0 && !minReward && !maxReward) {
        const recommendedRes = await api.get<{ success: boolean; data: Quest[] }>(
          "/quests/recommended",
          token
        ).catch(() => ({ success: true, data: [] }));
        setRecommendedQuests(recommendedRes.data || []);
      } else {
        setRecommendedQuests([]);
      }

      setQuests(res.data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load quests");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      const timeoutId = setTimeout(() => {
        loadQuests();
      }, searchQuery ? 500 : 0); // Debounce search
      return () => clearTimeout(timeoutId);
    }
  }, [searchQuery, difficultyFilter, minReward, maxReward, sortBy, sortOrder]);

  const handleApply = async (questId: string) => {
    if (!token) return;
    setError(null);
    try {
      await api.post<{ success: boolean; data: Quest }>(
        `/quests/${questId}/apply`,
        { note: applyNote || undefined },
        token
      );
      setShowApplyForm(false);
      setApplyNote("");
      setSelectedQuest(null);
      await loadQuests();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to apply to quest");
    }
  };

  const getDifficultyColor = (difficulty: QuestDifficulty) => {
    switch (difficulty) {
      case "Easy": return "text-green-400";
      case "Medium": return "text-yellow-400";
      case "Hard": return "text-orange-400";
      case "Epic": return "text-red-400";
      default: return "text-slate-400";
    }
  };

  const getRankColor = (rank?: string) => {
    if (!rank) return "text-slate-400";
    switch (rank) {
      case "SSS": return "text-purple-400";
      case "SS": return "text-pink-400";
      case "S": return "text-red-400";
      case "A": return "text-orange-400";
      case "B": return "text-yellow-400";
      case "C": return "text-lime-400";
      case "D": return "text-green-400";
      case "E": return "text-blue-400";
      case "F": return "text-slate-400";
      default: return "text-slate-400";
    }
  };

  const hasApplied = (quest: Quest) => {
    if (!user) return false;
    return quest.applications?.some(
      (app) => app.adventurerId === user.id && app.status === "PENDING"
    );
  };

  if (!user || user.role !== "ADVENTURER") {
    return <div className="min-h-screen bg-slate-900 text-slate-100 p-8">Access denied. Adventurer only.</div>;
  }

  const displayQuests = filter === "recommended" ? recommendedQuests : quests.filter(q => filter === "open" ? q.status === "Open" : true);

  return (
    <div className="min-h-screen bg-linear-to-b from-slate-900 via-slate-950 to-black text-slate-100">
      <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-extrabold tracking-wide flex items-center gap-2">
              ⚔️ Quest Board
            </h1>
            <p className="text-sm text-slate-300">
              Browse available quests and find your next adventure
              {profile && (
                <span className="ml-2">
                  | Level {profile.level} | Rank: <span className={getRankColor(profile.rank)}>{profile.rank || "F"}</span>
                </span>
              )}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              to="/adventurer/applications"
              className="text-xs md:text-sm px-3 py-2 rounded-lg border border-blue-500/60 text-blue-300 hover:bg-blue-500/10"
            >
              📋 My Applications
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

        {/* Search and Filter Bar */}
        <div className="rounded-2xl border border-blue-500/40 bg-slate-900/70 p-4 space-y-3">
          <div className="flex items-center gap-3">
            <input
              className="input bg-slate-800 flex-1"
              type="text"
              placeholder="🔍 Search quests by title or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="btn bg-slate-700 hover:bg-slate-600 px-4 py-2"
            >
              {showFilters ? "Hide Filters" : "Show Filters"}
            </button>
          </div>

          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 pt-3 border-t border-slate-700">
              <div>
                <label className="text-sm font-semibold mb-1 block">Difficulty</label>
                <div className="flex flex-wrap gap-2">
                  {["Easy", "Medium", "Hard", "Epic"].map((diff) => (
                    <label key={diff} className="flex items-center gap-1 text-sm">
                      <input
                        type="checkbox"
                        checked={difficultyFilter.includes(diff)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setDifficultyFilter([...difficultyFilter, diff]);
                          } else {
                            setDifficultyFilter(difficultyFilter.filter((d) => d !== diff));
                          }
                        }}
                        className="rounded"
                      />
                      {diff}
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-sm font-semibold mb-1 block">Min Reward</label>
                <input
                  className="input bg-slate-800"
                  type="number"
                  min="0"
                  placeholder="0"
                  value={minReward}
                  onChange={(e) => setMinReward(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-semibold mb-1 block">Max Reward</label>
                <input
                  className="input bg-slate-800"
                  type="number"
                  min="0"
                  placeholder="∞"
                  value={maxReward}
                  onChange={(e) => setMaxReward(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-semibold mb-1 block">Sort By</label>
                <select
                  className="input bg-slate-800"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                >
                  <option value="createdAt">Date</option>
                  <option value="rewardGold">Reward</option>
                  <option value="difficulty">Difficulty</option>
                </select>
                <select
                  className="input bg-slate-800 mt-2"
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value as any)}
                >
                  <option value="desc">Descending</option>
                  <option value="asc">Ascending</option>
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Filter tabs */}
        <div className="flex items-center gap-2 border-b border-slate-700">
          <button
            onClick={() => {
              setFilter("recommended");
              setSearchQuery("");
              setDifficultyFilter([]);
              setMinReward("");
              setMaxReward("");
            }}
            className={`px-4 py-2 text-sm font-semibold border-b-2 ${
              filter === "recommended"
                ? "border-purple-500 text-purple-300"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            ⭐ Recommended ({recommendedQuests.length})
          </button>
          <button
            onClick={() => setFilter("open")}
            className={`px-4 py-2 text-sm font-semibold border-b-2 ${
              filter === "open"
                ? "border-blue-500 text-blue-300"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            📜 All Open ({quests.filter(q => q.status === "Open").length})
          </button>
          <button
            onClick={() => setFilter("all")}
            className={`px-4 py-2 text-sm font-semibold border-b-2 ${
              filter === "all"
                ? "border-slate-500 text-slate-300"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            🌐 All Quests ({quests.length})
          </button>
        </div>

        {loading ? (
          <p className="text-slate-400">Loading quests…</p>
        ) : displayQuests.length === 0 ? (
          <div className="rounded-2xl border border-slate-700 bg-slate-900/70 p-8 text-center">
            <p className="text-slate-400">No quests available at this time.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {displayQuests.map((quest) => (
              <div
                key={quest._id}
                className="rounded-2xl border border-blue-500/40 bg-slate-900/70 p-5 space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-semibold">{quest.title}</h3>
                      <span className={`text-sm font-medium ${getDifficultyColor(quest.difficulty)}`}>
                        {quest.difficulty}
                      </span>
                      {quest.recommendationRank && (
                        <span className={`text-xs font-bold px-2 py-1 rounded ${getRankColor(quest.recommendationRank)} bg-slate-800`}>
                          Match: {quest.recommendationRank}
                        </span>
                      )}
                      {quest.recommendationScore !== undefined && (
                        <span className="text-xs text-slate-400">
                          Score: {Math.round(quest.recommendationScore * 100)}%
                        </span>
                      )}
                    </div>
                    <p className="text-slate-300 mb-3">{quest.description}</p>
                    <div className="flex items-center gap-4 text-sm text-slate-400">
                      <span>💰 {quest.rewardGold || 0} gold</span>
                      {quest.deadline && (
                        <span>⏰ {new Date(quest.deadline).toLocaleString()}</span>
                      )}
                      <span>👤 {quest.npcName || "NPC"}</span>
                      {quest.applications && quest.applications.length > 0 && (
                        <span>📋 {quest.applications.length} application(s)</span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {quest.status === "Open" && !hasApplied(quest) && (
                    <button
                      onClick={() => {
                        setSelectedQuest(quest);
                        setShowApplyForm(true);
                      }}
                      className="btn bg-blue-600 hover:bg-blue-700 text-sm px-4 py-2"
                    >
                      ✍️ Apply
                    </button>
                  )}
                  {hasApplied(quest) && (
                    <span className="text-sm text-yellow-400 px-4 py-2 border border-yellow-500/40 rounded-lg">
                      ⏳ Application Pending
                    </span>
                  )}
                  {(quest.status === "Accepted" || quest.status === "Completed") && quest.adventurerId === user.id && (
                    <button
                      onClick={() => setChatQuest(quest)}
                      className="btn bg-indigo-600 hover:bg-indigo-700 text-sm px-4 py-2"
                    >
                      💬 Chat
                    </button>
                  )}
                  <button
                    onClick={() => setSelectedQuest(quest)}
                    className="btn bg-slate-600 hover:bg-slate-700 text-sm px-4 py-2"
                  >
                    View Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Apply form modal */}
        {showApplyForm && selectedQuest && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-slate-900 rounded-2xl border border-blue-500/40 w-full max-w-md p-6 space-y-4">
              <h3 className="text-xl font-semibold">Apply to Quest: {selectedQuest.title}</h3>
              <div>
                <label className="text-sm font-semibold">Application Note (optional)</label>
                <textarea
                  className="input bg-slate-800 min-h-[100px] mt-1"
                  value={applyNote}
                  onChange={(e) => setApplyNote(e.target.value)}
                  placeholder="Why are you the right adventurer for this quest?"
                />
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleApply(selectedQuest._id)}
                  className="btn bg-blue-600 hover:bg-blue-700 flex-1"
                >
                  Submit Application
                </button>
                <button
                  onClick={() => {
                    setShowApplyForm(false);
                    setSelectedQuest(null);
                    setApplyNote("");
                  }}
                  className="btn bg-slate-600 hover:bg-slate-700"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Quest details modal */}
        {selectedQuest && !showApplyForm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-slate-900 rounded-2xl border border-blue-500/40 w-full max-w-2xl p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              <div className="flex items-center justify-between">
                <h3 className="text-2xl font-semibold">{selectedQuest.title}</h3>
                <button
                  onClick={() => setSelectedQuest(null)}
                  className="text-slate-400 hover:text-slate-100"
                >
                  ✕
                </button>
              </div>
              <div className="space-y-2">
                <p className="text-slate-300">{selectedQuest.description}</p>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-slate-400">Difficulty:</span>{" "}
                    <span className={getDifficultyColor(selectedQuest.difficulty)}>
                      {selectedQuest.difficulty}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400">Reward:</span>{" "}
                    <span className="text-yellow-400">{selectedQuest.rewardGold || 0} gold</span>
                  </div>
                  {selectedQuest.deadline && (
                    <div>
                      <span className="text-slate-400">Deadline:</span>{" "}
                      <span className="text-slate-300">
                        {new Date(selectedQuest.deadline).toLocaleString()}
                      </span>
                    </div>
                  )}
                  <div>
                    <span className="text-slate-400">Employer:</span>{" "}
                    <span className="text-slate-300">{selectedQuest.npcName || "NPC"}</span>
                  </div>
                </div>
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
      </div>
    </div>
  );
}

