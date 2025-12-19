// src/pages/Dashboard.tsx
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import AdventurerProfileManager from "../components/AdventurerProfileManager";
import { useWorkload } from "../hooks/useWorkload";
import QuestChat from "../components/QuestChat";
import EscrowVault from "../components/EscrowVault";
import { useState } from "react";

export default function Dashboard() {
  const { user, logout } = useAuth();
  const { data: workload } = useWorkload();
  const [showChatDemo, setShowChatDemo] = useState(false);
  const [demoQuestId, setDemoQuestId] = useState("");

  return (
    <div className="min-h-screen bg-linear-to-b from-slate-900 via-slate-950 to-black text-slate-100">
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        {/* Header */}
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-extrabold tracking-wide flex items-center gap-2">
              🛡️ Tavern Adventurer Ledger
            </h1>
            <p className="text-sm text-slate-300">
              Welcome to the guild hall, {user?.displayName || "traveler"}.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              to="/leaderboard"
              className="text-xs md:text-sm px-3 py-2 rounded-lg border border-sky-500/60 text-sky-300 hover:bg-sky-500/10"
            >
              🏆 Leaderboard
            </Link>
            <button
              className="btn bg-red-700 hover:bg-red-800 text-sm px-4 py-2"
              onClick={logout}
            >
              Leave Tavern
            </button>
          </div>
        </header>

        {/* Navigation Menu - Role Based */}
        <nav className="rounded-2xl border border-violet-500/40 bg-gradient-to-r from-violet-900/30 to-slate-900/70 p-4 md:p-5">
          <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
            🗺️ Quest Menu
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {user?.role === "ADVENTURER" && (
              <>
                <Link
                  to="/adventurer/quests"
                  className="p-4 rounded-lg bg-emerald-900/30 border border-emerald-500/40 hover:bg-emerald-900/50 transition-colors"
                >
                  <div className="text-2xl mb-1">📜</div>
                  <div className="font-semibold text-emerald-200">Quest Board</div>
                  <div className="text-xs text-slate-400">Browse & apply to quests</div>
                </Link>
                <Link
                  to="/adventurer/applications"
                  className="p-4 rounded-lg bg-sky-900/30 border border-sky-500/40 hover:bg-sky-900/50 transition-colors"
                >
                  <div className="text-2xl mb-1">📋</div>
                  <div className="font-semibold text-sky-200">My Applications</div>
                  <div className="text-xs text-slate-400">Track your quests</div>
                </Link>
              </>
            )}
            {user?.role === "NPC" && (
              <>
                <Link
                  to="/npc/quests"
                  className="p-4 rounded-lg bg-amber-900/30 border border-amber-500/40 hover:bg-amber-900/50 transition-colors"
                >
                  <div className="text-2xl mb-1">✍️</div>
                  <div className="font-semibold text-amber-200">My Quests</div>
                  <div className="text-xs text-slate-400">Post & manage quests</div>
                </Link>
                <Link
                  to="/npc/applications"
                  className="p-4 rounded-lg bg-purple-900/30 border border-purple-500/40 hover:bg-purple-900/50 transition-colors"
                >
                  <div className="text-2xl mb-1">👥</div>
                  <div className="font-semibold text-purple-200">Applications</div>
                  <div className="text-xs text-slate-400">Review adventurers</div>
                </Link>
                <Link
                  to="/npc/completions"
                  className="p-4 rounded-lg bg-emerald-900/30 border border-emerald-500/40 hover:bg-emerald-900/50 transition-colors"
                >
                  <div className="text-2xl mb-1">✅</div>
                  <div className="font-semibold text-emerald-200">Completions</div>
                  <div className="text-xs text-slate-400">Review & pay</div>
                </Link>
              </>
            )}
            {user?.role === "GUILD_MASTER" && (
              <>
                <Link
                  to="/admin/anomalies"
                  className="p-4 rounded-lg bg-red-900/30 border border-red-500/40 hover:bg-red-900/50 transition-colors"
                >
                  <div className="text-2xl mb-1">⚠️</div>
                  <div className="font-semibold text-red-200">Anomalies</div>
                  <div className="text-xs text-slate-400">Monitor issues</div>
                </Link>
                <Link
                  to="/admin/chats"
                  className="p-4 rounded-lg bg-purple-900/30 border border-purple-500/40 hover:bg-purple-900/50 transition-colors"
                >
                  <div className="text-2xl mb-1">💬</div>
                  <div className="font-semibold text-purple-200">All Chats</div>
                  <div className="text-xs text-slate-400">Monitor communications</div>
                </Link>
                <Link
                  to="/admin/escrows"
                  className="p-4 rounded-lg bg-amber-900/30 border border-amber-500/40 hover:bg-amber-900/50 transition-colors"
                >
                  <div className="text-2xl mb-1">🏦</div>
                  <div className="font-semibold text-amber-200">Escrow Vault</div>
                  <div className="text-xs text-slate-400">View all locked funds</div>
                </Link>
              </>
            )}
          </div>
        </nav>

        {/* Basic user info (guild record) */}
        <section className="mt-2 rounded-2xl border border-amber-500/40 bg-slate-900/70 shadow-[0_0_25px_rgba(245,158,11,0.2)] p-4 md:p-5 space-y-1">
          <h2 className="text-lg font-semibold mb-2 flex items-center gap-2">
            📜 Guild Record
          </h2>
          <p>
            <b>ID:</b> {user?.id}
          </p>
          <p>
            <b>Name:</b> {user?.displayName}
          </p>
          <p>
            <b>Role:</b> {user?.role}
          </p>
          <p>
            <b>Username:</b> {user?.username}
          </p>
          <p>
            <b>Email:</b> {user?.email}
          </p>
        </section>

        {/* Workload / burnout status */}
        <section className="rounded-2xl border border-sky-500/40 bg-slate-900/70 p-4 md:p-5 space-y-2">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            🧠 Workload & Burnout Watch
          </h2>
          {workload ? (
            <>
              <p className="text-sm text-slate-200">
                Active quests:{" "}
                <span className="font-semibold">
                  {workload.activeCount} / {workload.maxActive}
                </span>
              </p>
              <p
                className={
                  "text-sm " +
                  (workload.status === "OK"
                    ? "text-emerald-400"
                    : workload.status === "WARNING"
                    ? "text-amber-400"
                    : "text-red-400")
                }
              >
                {workload.message}
              </p>
            </>
          ) : (
            <p className="text-sm text-slate-400">Checking your workload…</p>
          )}
        </section>

        {/* NPC Escrow Vault */}
        {user?.role === "NPC" && <EscrowVault />}

        {/* Feature 1: Adventurer profile & skills */}
        <AdventurerProfileManager />

        {/* Quest Chat Demo Section */}
        <section className="rounded-2xl border border-purple-500/40 bg-slate-900/70 p-4 md:p-5 space-y-3">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            💬 Quest Chat Channels
          </h2>
          <p className="text-sm text-slate-300">
            Enter a Quest ID to access its chat channel. Only the NPC owner and
            assigned adventurer can access each quest's chat.
          </p>
          <div className="flex gap-2">
            <input
              type="text"
              value={demoQuestId}
              onChange={(e) => setDemoQuestId(e.target.value)}
              placeholder="Enter Quest ID"
              className="flex-1 px-3 py-2 bg-slate-800/80 border border-slate-600/40 rounded-lg text-sm text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
            />
            <button
              onClick={() => setShowChatDemo(!!demoQuestId)}
              disabled={!demoQuestId}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-slate-700 disabled:text-slate-500 text-white rounded-lg text-sm font-medium transition-colors"
            >
              Open Chat
            </button>
          </div>
          {showChatDemo && demoQuestId && (
            <div className="mt-4">
              <QuestChat
                questId={demoQuestId}
                questTitle={`Quest #${demoQuestId.slice(0, 8)}...`}
              />
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
