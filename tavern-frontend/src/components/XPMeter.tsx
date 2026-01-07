// src/components/XPMeter.tsx
import React from 'react';

type XPMeterProps = {
  xp: number;
  rank: string;
};

// Rank thresholds (matching backend calculation)
const RANK_THRESHOLDS = [
  { rank: 'F', min: 0, max: 199, color: 'bg-slate-600' },
  { rank: 'E', min: 200, max: 399, color: 'bg-slate-500' },
  { rank: 'D', min: 400, max: 699, color: 'bg-blue-600' },
  { rank: 'C', min: 700, max: 999, color: 'bg-cyan-600' },
  { rank: 'B', min: 1000, max: 1499, color: 'bg-green-600' },
  { rank: 'A', min: 1500, max: 1999, color: 'bg-emerald-600' },
  { rank: 'S', min: 2000, max: 2999, color: 'bg-yellow-600' },
  { rank: 'SS', min: 3000, max: 4999, color: 'bg-orange-600' },
  { rank: 'SSS', min: 5000, max: Infinity, color: 'bg-red-600' },
];

function getRankInfo(xp: number, currentRank: string) {
  const currentIndex = RANK_THRESHOLDS.findIndex(r => r.rank === currentRank);
  const current = RANK_THRESHOLDS[currentIndex] || RANK_THRESHOLDS[0];
  const next = RANK_THRESHOLDS[currentIndex + 1];
  
  if (!next) {
    // Max rank (SSS)
    return {
      current,
      next: null,
      progress: 100,
      xpInCurrent: xp - current.min,
      xpNeeded: 0,
      xpToNext: 0,
    };
  }
  
  const xpInCurrent = xp - current.min;
  const xpNeeded = next.min - current.min;
  const progress = Math.min(100, (xpInCurrent / xpNeeded) * 100);
  const xpToNext = next.min - xp;
  
  return {
    current,
    next,
    progress,
    xpInCurrent,
    xpNeeded,
    xpToNext: Math.max(0, xpToNext),
  };
}

function getRankColor(rank: string): string {
  switch (rank) {
    case 'SSS': return 'bg-gradient-to-r from-red-600 via-red-500 to-red-600 text-yellow-300 border-red-400';
    case 'SS': return 'bg-gradient-to-r from-orange-600 via-orange-500 to-orange-600 text-white border-orange-400';
    case 'S': return 'bg-gradient-to-r from-yellow-600 via-yellow-500 to-yellow-600 text-white border-yellow-400';
    case 'A': return 'bg-gradient-to-r from-emerald-600 via-emerald-500 to-emerald-600 text-white border-emerald-400';
    case 'B': return 'bg-gradient-to-r from-green-600 via-green-500 to-green-600 text-white border-green-400';
    case 'C': return 'bg-gradient-to-r from-cyan-600 via-cyan-500 to-cyan-600 text-white border-cyan-400';
    case 'D': return 'bg-gradient-to-r from-blue-600 via-blue-500 to-blue-600 text-white border-blue-400';
    case 'E': return 'bg-gradient-to-r from-slate-500 via-slate-400 to-slate-500 text-white border-slate-400';
    case 'F':
    default: return 'bg-gradient-to-r from-slate-700 via-slate-600 to-slate-700 text-slate-200 border-slate-500';
  }
}

export default function XPMeter({ xp, rank }: XPMeterProps) {
  const rankInfo = getRankInfo(xp, rank);
  const rankColor = getRankColor(rank);

  return (
    <div className="rounded-2xl border border-amber-500/40 bg-slate-900/70 p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          ⭐ Experience & Rank
        </h3>
        <div className={`px-4 py-2 rounded-full border-2 font-bold text-lg ${rankColor}`}>
          Rank {rank}
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-300">Total XP: <span className="font-semibold text-amber-400">{xp}</span></span>
          {rankInfo.next && (
            <span className="text-slate-400">
              {rankInfo.xpToNext} XP to {rankInfo.next.rank}
            </span>
          )}
        </div>

        {/* XP Progress Bar */}
        <div className="relative">
          <div className="h-6 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
            <div
              className={`h-full ${rankInfo.current.color} transition-all duration-500 ease-out flex items-center justify-end pr-2`}
              style={{ width: `${rankInfo.progress}%` }}
            >
              {rankInfo.progress > 15 && (
                <span className="text-xs font-semibold text-white">
                  {Math.round(rankInfo.progress)}%
                </span>
              )}
            </div>
          </div>
          {rankInfo.next && (
            <div className="mt-1 text-xs text-slate-400 flex justify-between">
              <span>{rankInfo.current.rank} ({rankInfo.current.min})</span>
              <span>{rankInfo.next.rank} ({rankInfo.next.min})</span>
            </div>
          )}
        </div>

        {/* Rank Progression Path */}
        <div className="mt-4 pt-4 border-t border-slate-700">
          <p className="text-xs text-slate-400 mb-2">Rank Progression:</p>
          <div className="flex items-center gap-1 flex-wrap">
            {RANK_THRESHOLDS.map((r, idx) => {
              const isCurrent = r.rank === rank;
              const isUnlocked = xp >= r.min;
              const isPast = RANK_THRESHOLDS.findIndex(rt => rt.rank === rank) > idx;
              
              return (
                <div
                  key={r.rank}
                  className={`px-2 py-1 rounded text-xs font-semibold border ${
                    isCurrent
                      ? getRankColor(r.rank) + ' scale-110'
                      : isUnlocked || isPast
                      ? 'bg-slate-700 text-slate-300 border-slate-600'
                      : 'bg-slate-800 text-slate-500 border-slate-700 opacity-50'
                  }`}
                >
                  {r.rank}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}




