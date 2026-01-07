// src/components/EscrowVault.tsx
import { useEscrowStats } from "../hooks/useEscrowStats";

export default function EscrowVault() {
  const { stats, loading, error } = useEscrowStats();

  if (loading) {
    return (
      <div className="rounded-2xl border border-amber-500/40 bg-gradient-to-br from-amber-900/30 to-slate-900/70 p-5">
        <p className="text-sm text-slate-400">Loading vault...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-500/40 bg-red-900/20 p-5">
        <p className="text-sm text-red-400">⚠️ {error}</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-amber-500/40 bg-gradient-to-br from-amber-900/30 to-slate-900/70 p-5">
      <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
        🏦 Bounty Vault (Escrow)
      </h3>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-slate-300">Total Locked:</span>
          <span className="text-2xl font-bold text-amber-400">
            {stats?.totalLocked || 0} 💰
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-slate-300">Active Escrows:</span>
          <span className="text-xl font-semibold text-slate-200">
            {stats?.count || 0}
          </span>
        </div>
        <div className="pt-3 border-t border-amber-500/20">
          <p className="text-xs text-slate-400">
            💡 <strong>How it works:</strong> When you create a quest with a reward, 
            the gold is automatically locked in escrow. It's released to the adventurer 
            when you approve payment, or refunded to you if the quest is cancelled.
          </p>
        </div>
      </div>
    </div>
  );
}
