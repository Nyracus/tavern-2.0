// src/pages/Dashboard.tsx
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import AdventurerProfileManager from "../components/AdventurerProfileManager";
import { useWorkload } from "../hooks/useWorkload";
import { NotificationDropdown } from "../components/NotificationDropdown";
import QuestQuickView from "../components/QuestQuickView";

export default function Dashboard() {
  const { user, logout } = useAuth();
  const { data: workload } = useWorkload();
  const isGuildMaster = user?.role === "GUILD_MASTER";
  const isNPC = user?.role === "NPC";
  const isAdventurer = user?.role === "ADVENTURER";

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
            <NotificationDropdown />
            <Link
              to="/leaderboard"
              className="text-xs md:text-sm px-3 py-2 rounded-lg border border-sky-500/60 text-sky-300 hover:bg-sky-500/10"
            >
              🏆 Leaderboard
            </Link>
            {user?.role === "GUILD_MASTER" && (
              <>
                <Link
                  to="/admin/anomalies"
                  className="text-xs md:text-sm px-3 py-2 rounded-lg border border-emerald-500/60 text-emerald-300 hover:bg-emerald-500/10"
                >
                  🧩 Admin Anomalies
                </Link>
                <Link
                  to="/admin/chats"
                  className="text-xs md:text-sm px-3 py-2 rounded-lg border border-purple-500/60 text-purple-300 hover:bg-purple-500/10"
                >
                  💬 All Chats
                </Link>
              </>
            )}
            {isNPC && (
              <Link
                to="/npc/quests"
                className="text-xs md:text-sm px-3 py-2 rounded-lg border border-purple-500/60 text-purple-300 hover:bg-purple-500/10"
              >
                📜 My Quests
              </Link>
            )}
            {isAdventurer && (
              <Link
                to="/adventurer/quests"
                className="text-xs md:text-sm px-3 py-2 rounded-lg border border-blue-500/60 text-blue-300 hover:bg-blue-500/10"
              >
                ⚔️ Quest Board
              </Link>
            )}
            <button
              className="btn bg-red-700 hover:bg-red-800 text-sm px-4 py-2"
              onClick={logout}
            >
              Leave Tavern
            </button>
          </div>
        </header>

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

        {/* NPC-specific view */}
        {isNPC && (
          <section className="rounded-2xl border border-purple-500/40 bg-slate-900/70 p-4 md:p-5 space-y-3">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              🏛️ Employer Console
            </h2>
            <p className="text-sm text-slate-300">
              Manage your quest postings, review applications, and oversee completed work.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Link
                to="/npc/quests"
                className="rounded-xl border border-purple-500/40 bg-slate-950/70 px-4 py-3 text-sm hover:bg-purple-500/10"
              >
                <div className="font-semibold">📜 Quest Board</div>
                <div className="text-xs text-slate-300">
                  Post, edit, and manage your quests.
                </div>
              </Link>
              <Link
                to="/npc/applications"
                className="rounded-xl border border-blue-500/40 bg-slate-950/70 px-4 py-3 text-sm hover:bg-blue-500/10"
              >
                <div className="font-semibold">📋 Applications</div>
                <div className="text-xs text-slate-300">
                  Review and accept/reject adventurer applications.
                </div>
              </Link>
              <Link
                to="/npc/completions"
                className="rounded-xl border border-emerald-500/40 bg-slate-950/70 px-4 py-3 text-sm hover:bg-emerald-500/10"
              >
                <div className="font-semibold">✅ Review Completions</div>
                <div className="text-xs text-slate-300">
                  Review submitted reports and approve payments.
                </div>
              </Link>
              <div className="rounded-xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-sm opacity-80">
                <div className="font-semibold">💬 Quest Chats</div>
                <div className="text-xs text-slate-400">
                  Coming soon: communicate with adventurers and guildmaster.
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Adventurer-specific view */}
        {isAdventurer && (
          <>
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
                <p className="text-sm text-slate-400">
                  Checking your workload…
                </p>
              )}
            </section>

            {/* Quest browsing - quick access */}
            <section className="rounded-2xl border border-blue-500/40 bg-slate-900/70 p-4 md:p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold flex items-center gap-2">
                    ⚔️ Available Quests
                  </h2>
                  <p className="text-sm text-slate-300">
                    Browse and apply to quests matching your rank
                  </p>
                </div>
                <Link
                  to="/adventurer/quests"
                  className="text-xs md:text-sm px-3 py-2 rounded-lg border border-blue-500/60 text-blue-300 hover:bg-blue-500/10"
                >
                  View All →
                </Link>
              </div>
              <QuestQuickView />
            </section>

            {/* Quest management console */}
            <section className="rounded-2xl border border-yellow-500/40 bg-slate-900/70 p-4 md:p-5 space-y-3">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                📋 My Quest Applications
              </h2>
              <p className="text-sm text-slate-300">
                Track your applications and submit completions.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Link
                  to="/adventurer/applications"
                  className="rounded-xl border border-yellow-500/40 bg-slate-950/70 px-4 py-3 text-sm hover:bg-yellow-500/10"
                >
                  <div className="font-semibold">📋 My Applications</div>
                  <div className="text-xs text-slate-300">
                    Track your applications and submit completions.
                  </div>
                </Link>
                <Link
                  to="/adventurer/quests"
                  className="rounded-xl border border-blue-500/40 bg-slate-950/70 px-4 py-3 text-sm hover:bg-blue-500/10"
                >
                  <div className="font-semibold">⚔️ Full Quest Board</div>
                  <div className="text-xs text-slate-300">
                    Browse all quests with search and filters.
                  </div>
                </Link>
              </div>
            </section>

            {/* Feature 1: Adventurer profile & skills */}
            <AdventurerProfileManager />
          </>
        )}

        {/* Guildmaster-specific view */}
        {isGuildMaster && (
          <section className="rounded-2xl border border-emerald-500/40 bg-slate-900/70 p-4 md:p-5 space-y-3">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              🧭 Guildmaster Console
            </h2>
            <p className="text-sm text-slate-300">
              From here you can oversee the realm, review anomalies, and soon
              manage ledgers and search through guild members.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Link
                to="/leaderboard"
                className="rounded-xl border border-sky-500/40 bg-slate-950/70 px-4 py-3 text-sm hover:bg-sky-500/10"
              >
                <div className="font-semibold">🏆 Adventurer Leaderboard</div>
                <div className="text-xs text-slate-300">
                  Review the most renowned heroes of the tavern.
                </div>
              </Link>
              <Link
                to="/admin/anomalies"
                className="rounded-xl border border-emerald-500/40 bg-slate-950/70 px-4 py-3 text-sm hover:bg-emerald-500/10"
              >
                <div className="font-semibold">🧩 Anomaly Board</div>
                <div className="text-xs text-slate-300">
                  Inspect strange patterns in NPC and adventurer behavior.
                </div>
              </Link>
              <div className="rounded-xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-sm opacity-80">
                <div className="font-semibold">💰 Transactions Ledger</div>
                <div className="text-xs text-slate-400">
                  Coming soon: review gold flow and quest payouts across the
                  guild.
                </div>
              </div>
              <div className="rounded-xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-sm opacity-80">
                <div className="font-semibold">🔎 Search NPC / Adventurer</div>
                <div className="text-xs text-slate-400">
                  Coming soon: quickly look up any guild member or employer in
                  the realm.
                </div>
              </div>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
