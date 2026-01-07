// src/pages/Dashboard.tsx
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useWorkload } from "../hooks/useWorkload";
import { NotificationDropdown } from "../components/NotificationDropdown";
import QuestQuickView from "../components/QuestQuickView";
import AdventurerStats from "../components/AdventurerStats";
import { api } from "../lib/api";

type AdventurerProfile = {
  _id: string;
  userId: string;
  title: string;
  summary: string;
  class: string;
  rank?: string;
  xp?: number;
  race?: string;
  background?: string;
  attributes: {
    strength: number;
    dexterity: number;
    intelligence: number;
    charisma: number;
    vitality: number;
    luck: number;
  };
  availableStatPoints?: number;
  logoUrl?: string;
};

export default function Dashboard() {
  const { user, logout, token } = useAuth();
  const { data: workload } = useWorkload();
  const [adventurerProfile, setAdventurerProfile] = useState<AdventurerProfile | null>(null);
  const [npcOrganization, setNpcOrganization] = useState<{ name: string; logoUrl?: string } | null>(null);
  const isGuildMaster = user?.role === "GUILD_MASTER";
  const isNPC = user?.role === "NPC";
  const isAdventurer = user?.role === "ADVENTURER";

  useEffect(() => {
    if (isAdventurer && token) {
      loadProfile();
    }
    if (isNPC && token) {
      loadNpcOrganization();
    }
  }, [isAdventurer, isNPC, token]);

  const loadProfile = async () => {
    if (!token) return;
    try {
      const res = await api.get<{ success: boolean; data: AdventurerProfile }>(
        "/adventurers/me",
        token
      ).catch(() => ({ success: true, data: null }));
      if (res.data) {
        setAdventurerProfile(res.data);
      }
    } catch (err) {
      console.error("Failed to load profile", err);
    }
  };

  const loadNpcOrganization = async () => {
    if (!token) return;
    try {
      const res = await api.get<{ success: boolean; data: { name: string; logoUrl?: string } }>(
        "/npc-organizations/me",
        token
      ).catch(() => ({ success: true, data: null }));
      if (res.data) {
        setNpcOrganization(res.data);
      }
    } catch (err) {
      // Organization might not exist yet
      console.log("No organization found");
    }
  };

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
                  to="/admin/users"
                  className="text-xs md:text-sm px-3 py-2 rounded-lg border border-red-500/60 text-red-300 hover:bg-red-500/10"
                >
                  👥 Manage Users
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
              <>
                <Link
                  to="/adventurer/quests"
                  className="text-xs md:text-sm px-3 py-2 rounded-lg border border-blue-500/60 text-blue-300 hover:bg-blue-500/10"
                >
                  ⚔️ Quest Board
                </Link>
                <Link
                  to="/adventurer/chats"
                  className="text-xs md:text-sm px-3 py-2 rounded-lg border border-indigo-500/60 text-indigo-300 hover:bg-indigo-500/10"
                >
                  💬 Quest Chats
                </Link>
              </>
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
            <b>Name:</b> {user?.displayName}
          </p>
          <p>
            <b>Role:</b> {user?.role}
          </p>
          <p>
            <b>Username:</b> {user?.username}
          </p>
        </section>

        {/* NPC-specific view */}
        {isNPC && (
          <>
            {/* NPC Organization Display */}
            {npcOrganization && (
              <section className="rounded-2xl border border-purple-500/40 bg-slate-900/70 p-4 md:p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold flex items-center gap-2">
                    🏛️ {npcOrganization.name}
                  </h2>
                  {npcOrganization.logoUrl && (
                    <div className="w-16 h-16 rounded-lg border-2 border-purple-600 bg-white overflow-hidden flex-shrink-0">
                      <img
                        src={npcOrganization.logoUrl}
                        alt="Organization logo"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                </div>
                <Link
                  to="/npc/organization"
                  className="inline-block text-xs md:text-sm px-4 py-2 rounded-lg border border-purple-500/60 text-purple-300 hover:bg-purple-500/10"
                >
                  ✏️ Edit Organization
                </Link>
              </section>
            )}
            
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
                to="/npc/organization"
                className="rounded-xl border border-fuchsia-500/40 bg-slate-950/70 px-4 py-3 text-sm hover:bg-fuchsia-500/10"
              >
                <div className="font-semibold">🏛️ Organization</div>
                <div className="text-xs text-slate-300">
                  Manage your organization identity and trust.
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
              <Link
                to="/npc/chats"
                className="rounded-xl border border-indigo-500/40 bg-slate-950/70 px-4 py-3 text-sm hover:bg-indigo-500/10"
              >
                <div className="font-semibold">💬 Quest Chats</div>
                <div className="text-xs text-slate-300">
                  View and continue conversations with adventurers.
                </div>
              </Link>
            </div>
          </section>
          </>
        )}

        {/* Adventurer-specific view */}
        {isAdventurer && (
          <>
            {/* Adventurer Stats: Gold, Rank, XP */}
            <AdventurerStats />
            
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
                <Link
                  to="/adventurer/chats"
                  className="rounded-xl border border-indigo-500/40 bg-slate-950/70 px-4 py-3 text-sm hover:bg-indigo-500/10"
                >
                  <div className="font-semibold">💬 Quest Chats</div>
                  <div className="text-xs text-slate-300">
                    View and continue conversations with NPCs.
                  </div>
                </Link>
              </div>
            </section>

            {/* Skills Shop Button */}
            <section className="rounded-2xl border border-purple-500/40 bg-slate-900/70 p-4 md:p-5 space-y-3">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                💎 Skills Shop
              </h2>
              <p className="text-sm text-slate-300">
                Purchase new skills and abilities to enhance your adventuring capabilities.
              </p>
              <Link
                to="/skills/shop"
                className="block rounded-xl border border-purple-500/40 bg-slate-950/70 px-4 py-3 text-sm hover:bg-purple-500/10 transition-colors"
              >
                <div className="font-semibold text-purple-300">💎 Visit Skills Shop →</div>
                <div className="text-xs text-slate-300 mt-1">
                  Browse and purchase skills with your earned gold.
                </div>
              </Link>
            </section>

            {/* Adventurer Profile Section */}
            <section className="rounded-2xl border border-purple-500/40 bg-slate-900/70 p-4 md:p-5 space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  🧝 Adventurer Profile
                </h2>
                <Link
                  to="/adventurer/profile"
                  className="text-xs md:text-sm px-3 py-2 rounded-lg border border-purple-500/60 text-purple-300 hover:bg-purple-500/10"
                >
                  ✏️ Edit Profile
                </Link>
              </div>
              {adventurerProfile && (
                <>
                  {/* Prompt for stat points */}
                  {adventurerProfile.availableStatPoints && adventurerProfile.availableStatPoints > 0 && (
                    <div className="rounded-lg border border-purple-500/60 bg-purple-900/40 px-4 py-3">
                      <p className="text-sm text-purple-200 mb-2">
                        ⭐ <strong>Rank Up Complete!</strong> You have {adventurerProfile.availableStatPoints} unallocated stat point{adventurerProfile.availableStatPoints !== 1 ? 's' : ''}!
                      </p>
                      <Link
                        to="/adventurer/profile"
                        className="inline-block text-xs md:text-sm px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white transition-colors"
                      >
                        Distribute Stat Points →
                      </Link>
                    </div>
                  )}
                  
                  {/* Profile Card */}
                  <div className="rounded-xl border border-amber-700 bg-[#fdf3d0] text-slate-900 shadow-lg shadow-amber-900/30 p-5 space-y-2">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <h3 className="text-xl font-bold flex items-center gap-2">
                          📜 {adventurerProfile.title}
                        </h3>
                      </div>
                      {adventurerProfile.logoUrl && (
                        <div className="w-16 h-16 rounded-lg border-2 border-amber-800 bg-white overflow-hidden flex-shrink-0">
                          <img
                            src={adventurerProfile.logoUrl}
                            alt="Adventurer logo"
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                    </div>
                    <p>
                      <b>Class:</b> {adventurerProfile.class} <span className="mx-2">|</span>{" "}
                      <b>Rank:</b> <span className="font-semibold">{adventurerProfile.rank || "F"}</span>
                    </p>
                    {adventurerProfile.race && (
                      <p>
                        <b>Race:</b> {adventurerProfile.race}
                      </p>
                    )}
                    {adventurerProfile.background && (
                      <p>
                        <b>Background:</b> {adventurerProfile.background}
                      </p>
                    )}
                    {adventurerProfile.summary && (
                      <p>
                        <b>Summary:</b> {adventurerProfile.summary}
                      </p>
                    )}
                    <div className="grid grid-cols-3 gap-2 mt-3 text-sm font-semibold">
                      <p>STR: {adventurerProfile.attributes.strength}</p>
                      <p>DEX: {adventurerProfile.attributes.dexterity}</p>
                      <p>INT: {adventurerProfile.attributes.intelligence}</p>
                      <p>CHA: {adventurerProfile.attributes.charisma}</p>
                      <p>VIT: {adventurerProfile.attributes.vitality}</p>
                      <p>LUCK: {adventurerProfile.attributes.luck}</p>
                    </div>
                  </div>
                </>
              )}
            </section>
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
