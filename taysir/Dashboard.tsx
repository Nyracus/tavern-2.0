import { useMemo, useState } from "react";
import { useAuth } from "../context/AuthContext";
import AdventurerProfileManager from "../components/AdventurerProfileManager";
import NpcOrganizationManager from "../components/NpcOrganizationManager";
import NpcQuestManager from "../components/NpcQuestManager";

type ModuleKey = "HOME" | "ADV_PROFILE" | "NPC_ORG" | "NPC_QUESTS";

export default function Dashboard() {
  const { user, logout } = useAuth();
  const [active, setActive] = useState<ModuleKey>("HOME");

  const role = user?.role;

  const availableModules = useMemo(() => {
    if (!role) return [];
    if (role === "ADVENTURER")
      return [
        { key: "ADV_PROFILE" as const, title: "🧙 Adventurer Profile", desc: "Manage your profile and skills." },
      ];
    if (role === "NPC")
      return [
        { key: "NPC_ORG" as const, title: "🏰 Organization & Trust", desc: "Organization profile ." },
        { key: "NPC_QUESTS" as const, title: "📌 Quest Manager", desc: "Quest CRUD + status transitions ." },
      ];
    return [
      { key: "HOME" as const, title: "🛡️ Guild Master Panel", desc: "Admin tools (coming soon)." },
    ];
  }, [role]);

  // If user changes role or logs in, keep them in HOME unless they click a module
  const showHome = active === "HOME";

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-950 to-black text-slate-100">
      <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
        {/* Header */}
        <header className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-extrabold tracking-wide flex items-center gap-2">
              🍻 Tavern System
            </h1>
            
          </div>

          <div className="flex items-center gap-2">
            <button className="btn bg-slate-700 hover:bg-slate-600" onClick={() => setActive("HOME")}>
              Home
            </button>
            <button className="btn bg-rose-600 hover:bg-rose-700" onClick={logout}>
              Logout
            </button>
          </div>
        </header>

        {/* User info */}
        <section className="card">
          <h2 className="text-lg font-bold">👤 Signed in</h2>
          <div className="mt-2 text-sm text-slate-200 space-y-1">
            <p>
              <b>Role:</b> {user?.role}
            </p>
            <p>
              <b>Display Name:</b> {user?.displayName}
            </p>
            <p>
              <b>Username:</b> {user?.username}
            </p>
            <p>
              <b>Email:</b> {user?.email}
            </p>
          </div>
        </section>

        {/* Feature Hub */}
        {showHome && (
          <section className="card">
            <h2 className="text-xl font-bold">🏛️ Dashboard</h2>
            <p className="text-sm text-slate-300 mt-1">
              Choose a module to open.
            </p>

            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {availableModules.map((m) => (
                <button
                  key={m.key}
                  onClick={() => setActive(m.key)}
                  className="rounded-2xl border border-white/10 bg-white/5 p-5 text-left hover:bg-white/10 transition"
                >
                  <div className="text-lg font-bold">{m.title}</div>
                  <div className="text-sm text-slate-300 mt-1">{m.desc}</div>
                  <div className="mt-3">
                    <span className="badge bg-indigo-500/20 text-indigo-200">
                      Open
                    </span>
                  </div>
                </button>
              ))}

              {role === "GUILD_MASTER" && (
                <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                  <div className="text-lg font-bold">🛡️ Guild Master Tools</div>
                  <div className="text-sm text-slate-300 mt-1">
                    Not implemented yet — UI placeholder only.
                  </div>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Modules */}
        {active === "ADV_PROFILE" && role === "ADVENTURER" && (
          <AdventurerProfileManager />
        )}

        {active === "NPC_ORG" && role === "NPC" && <NpcOrganizationManager />}

        {active === "NPC_QUESTS" && role === "NPC" && <NpcQuestManager />}

        {/* Safety fallback */}
        {!showHome &&
          ((active === "ADV_PROFILE" && role !== "ADVENTURER") ||
            ((active === "NPC_ORG" || active === "NPC_QUESTS") && role !== "NPC")) && (
            <section className="card">
              <h2 className="text-lg font-bold">⛔ Access blocked</h2>
              <p className="text-sm text-slate-300 mt-1">
                This module is not available for your role.
              </p>
              <button className="btn mt-4" onClick={() => setActive("HOME")}>
                Back to Home
              </button>
            </section>
          )}
      </div>
    </div>
  );
}





