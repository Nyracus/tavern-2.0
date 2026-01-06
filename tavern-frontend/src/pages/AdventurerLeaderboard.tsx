// src/pages/AdventurerLeaderboard.tsx
import { useAdventurerLeaderboard } from "../hooks/useAdventurerLeaderboard";

function rankColor(rank: string) {
  switch (rank) {
    case "SSS":
    case "SS":
    case "S":
      return "bg-yellow-500/20 text-yellow-300 border-yellow-400/60";
    case "A":
    case "B":
      return "bg-emerald-500/15 text-emerald-300 border-emerald-400/60";
    case "C":
    case "D":
      return "bg-sky-500/10 text-sky-300 border-sky-400/60";
    case "E":
    case "F":
    default:
      return "bg-slate-700/40 text-slate-200 border-slate-500/60";
  }
}

function positionIcon(pos: number) {
  if (pos === 1) return "👑";
  if (pos === 2) return "🥈";
  if (pos === 3) return "🥉";
  return "⚔️";
}

export default function AdventurerLeaderboard() {
  const { data, loading, error } = useAdventurerLeaderboard(20);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-950 to-black text-slate-100 flex items-center justify-center">
        <p className="text-slate-300 text-sm">Consulting the guild records…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-950 to-black text-slate-100 flex items-center justify-center">
        <p className="text-red-400 text-sm">{error}</p>
      </div>
    );
  }

  if (!data || data.items.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-950 to-black text-slate-100 flex items-center justify-center">
        <p className="text-slate-300 text-sm">
          The tavern is quiet… no adventurers on the board yet.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-950 to-black text-slate-100">
      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Header / banner */}
        <div className="mb-6 flex flex-col gap-2">
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-wide flex items-center gap-3">
            🏰 Adventurer Leaderboard
          </h1>
          <p className="text-sm text-slate-300">
            The great board of deeds, pinned upon the tavern wall. Top
            adventurers are etched in gold.
          </p>
        </div>

        {/* Wooden frame + parchment */}
        <div className="rounded-3xl border border-amber-700/60 bg-gradient-to-b from-slate-900/90 via-slate-900/95 to-slate-950 shadow-[0_0_40px_rgba(0,0,0,0.8)] overflow-hidden">
          {/* Table header styled like a wooden beam */}
          <div className="bg-gradient-to-r from-amber-900 via-amber-950 to-amber-900 border-b border-amber-700/80">
            <div className="grid grid-cols-6 gap-2 px-4 py-3 text-xs md:text-sm font-semibold text-amber-100">
              <span>#</span>
              <span>Title</span>
              <span>Class</span>
              <span>Level</span>
              <span>XP</span>
              <span>Rank</span>
            </div>
          </div>

          {/* Parchment-like body */}
          <div className="bg-gradient-to-b from-stone-900/70 via-stone-900/80 to-stone-950/90">
            {data.items.map((row) => {
              const highlight =
                row.position === 1
                  ? "bg-amber-500/10"
                  : row.position <= 3
                  ? "bg-amber-400/5"
                  : "hover:bg-slate-900/40";

              return (
                <div
                  key={row.userId}
                  className={`grid grid-cols-6 gap-2 px-4 py-3 text-xs md:text-sm border-b border-slate-800/70 ${highlight}`}
                >
                  {/* Position + icon */}
                  <div className="flex items-center gap-2 font-semibold text-slate-100">
                    <span>{row.position}</span>
                    <span className="text-base">
                      {positionIcon(row.position)}
                    </span>
                  </div>

                  {/* Title */}
                  <div className="flex flex-col">
                    <span className="font-medium text-slate-100">
                      {row.title || "Unknown"}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      Adventurer ID: {row.userId}
                    </span>
                  </div>

                  {/* Class */}
                  <div className="flex items-center">
                    <span className="text-slate-200">{row.class}</span>
                  </div>

                  {/* Level */}
                  <div className="flex items-center">
                    <span className="font-semibold text-slate-100">
                      {row.level}
                    </span>
                  </div>

                  {/* XP */}
                  <div className="flex flex-col justify-center">
                    <span className="text-slate-200 text-sm">{row.xp}</span>
                    <div className="mt-1 h-1.5 rounded-full bg-slate-800 overflow-hidden">
                      <div
                        className="h-full bg-amber-500"
                        style={{
                          width: `${Math.min(row.xp / 50, 100)}%`,
                        }}
                      />
                    </div>
                  </div>

                  {/* Rank badge */}
                  <div className="flex items-center">
                    <span
                      className={`inline-flex items-center justify-center px-2 py-1 rounded-full border text-xs font-semibold ${rankColor(
                        row.rank
                      )}`}
                    >
                      {row.rank}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <p className="mt-3 text-[11px] text-slate-500">
          * Rankings are based on total XP, then level, then earliest entry in
          the guild records.
        </p>
      </div>
    </div>
  );
}
