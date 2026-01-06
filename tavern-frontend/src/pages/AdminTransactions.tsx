// src/pages/AdminTransactions.tsx
import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { api } from "../lib/api";
import { Link } from "react-router-dom";

type TransactionType =
  | "ESCROW_DEPOSIT"
  | "ESCROW_RELEASE"
  | "ESCROW_REFUND"
  | "CONFLICT_ESCROW"
  | "CONFLICT_PAYOUT"
  | "DIRECT_PAYMENT";

type TransactionStatus = "PENDING" | "COMPLETED" | "FAILED" | "CANCELLED";

type Transaction = {
  _id: string;
  questId: {
    _id: string;
    title: string;
  };
  type: TransactionType;
  status: TransactionStatus;
  fromUserId?: {
    _id: string;
    username: string;
    displayName: string;
    role: "ADVENTURER" | "NPC" | "GUILD_MASTER";
  };
  toUserId?: {
    _id: string;
    username: string;
    displayName: string;
    role: "ADVENTURER" | "NPC" | "GUILD_MASTER";
  };
  amount: number;
  description?: string;
  metadata?: Record<string, any>;
  createdAt: string;
};

export default function AdminTransactions() {
  const { token, user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [total, setTotal] = useState(0);
  const limit = 50;

  useEffect(() => {
    if (token && user?.role === "GUILD_MASTER") {
      loadTransactions();
    }
  }, [token, user, page]);

  const loadTransactions = async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const res = await api.get<{
        success: boolean;
        data: Transaction[];
        pagination: { total: number; limit: number; skip: number; hasMore: boolean };
      }>(`/admin/transactions?limit=${limit}&skip=${page * limit}`, token);
      setTransactions(res.data || []);
      if (res.pagination) {
        setTotal(res.pagination.total);
        setHasMore(res.pagination.hasMore);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load transactions");
    } finally {
      setLoading(false);
    }
  };

  const getTypeLabel = (type: TransactionType) => {
    switch (type) {
      case "ESCROW_DEPOSIT":
        return "Escrow Deposit";
      case "ESCROW_RELEASE":
        return "Escrow Release";
      case "ESCROW_REFUND":
        return "Escrow Refund";
      case "CONFLICT_ESCROW":
        return "Conflict Escrow";
      case "CONFLICT_PAYOUT":
        return "Conflict Payout";
      case "DIRECT_PAYMENT":
        return "Direct Payment";
      default:
        return type;
    }
  };

  const getTypeColor = (type: TransactionType) => {
    switch (type) {
      case "ESCROW_DEPOSIT":
      case "CONFLICT_ESCROW":
        return "bg-blue-500/20 text-blue-300 border-blue-400/60";
      case "ESCROW_RELEASE":
      case "CONFLICT_PAYOUT":
        return "bg-green-500/20 text-green-300 border-green-400/60";
      case "ESCROW_REFUND":
        return "bg-yellow-500/20 text-yellow-300 border-yellow-400/60";
      case "DIRECT_PAYMENT":
        return "bg-purple-500/20 text-purple-300 border-purple-400/60";
      default:
        return "bg-slate-500/20 text-slate-300 border-slate-400/60";
    }
  };

  const getStatusColor = (status: TransactionStatus) => {
    switch (status) {
      case "COMPLETED":
        return "text-green-400";
      case "PENDING":
        return "text-yellow-400";
      case "FAILED":
        return "text-red-400";
      case "CANCELLED":
        return "text-slate-400";
      default:
        return "text-slate-300";
    }
  };

  if (!user || user.role !== "GUILD_MASTER") {
    return (
      <div className="min-h-screen bg-slate-900 text-slate-100 p-8">
        Access denied. Guildmaster only.
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-950 to-black text-slate-100">
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-extrabold tracking-wide flex items-center gap-2">
              📜 Guild Ledger (Transactions)
            </h1>
            <p className="text-sm text-slate-300">Complete transaction history</p>
            <p className="text-xs text-slate-400 mt-1">Total: {total} transactions</p>
          </div>
          <Link
            to="/admin/anomalies"
            className="text-xs md:text-sm px-3 py-2 rounded-lg border border-emerald-500/60 text-emerald-300 hover:bg-emerald-500/10"
          >
            ← Back to Anomalies
          </Link>
        </header>

        {error && (
          <div className="rounded-lg border border-red-500/60 bg-red-900/40 px-4 py-3 text-red-100">
            ⚠️ {error}
          </div>
        )}

        {loading ? (
          <p className="text-slate-400">Loading transactions…</p>
        ) : transactions.length === 0 ? (
          <div className="rounded-2xl border border-slate-700 bg-slate-900/70 p-8 text-center">
            <p className="text-slate-400">No transactions found.</p>
          </div>
        ) : (
          <>
            <div className="rounded-2xl border border-slate-700 bg-slate-900/70 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-800/50 border-b border-slate-700">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-300">Date</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-300">Type</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-300">Quest</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-300">From</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-300">To</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-slate-300">Amount</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-300">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-300">Description</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700/50">
                    {transactions.map((tx) => (
                      <tr key={tx._id} className="hover:bg-slate-800/30">
                        <td className="px-4 py-3 text-sm text-slate-300">
                          {new Date(tx.createdAt).toLocaleString()}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex items-center px-2 py-1 rounded border text-xs font-semibold ${getTypeColor(
                              tx.type
                            )}`}
                          >
                            {getTypeLabel(tx.type)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-200">
                          {typeof tx.questId === "object" ? tx.questId.title : "Unknown"}
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-300">
                          {tx.fromUserId
                            ? typeof tx.fromUserId === "object"
                              ? tx.fromUserId.displayName || tx.fromUserId.username
                              : "Unknown"
                            : "System"}
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-300">
                          {tx.toUserId
                            ? typeof tx.toUserId === "object"
                              ? tx.toUserId.displayName || tx.toUserId.username
                              : "Unknown"
                            : "System"}
                        </td>
                        <td className="px-4 py-3 text-right text-sm font-semibold text-amber-400">
                          {tx.amount} 🪙
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-sm font-semibold ${getStatusColor(tx.status)}`}>
                            {tx.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-400 max-w-xs truncate">
                          {tx.description || "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between">
              <button
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
                className="btn bg-slate-700 hover:bg-slate-600 text-sm px-4 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                ← Previous
              </button>
              <span className="text-sm text-slate-400">
                Page {page + 1} ({(page * limit) + 1}-{Math.min((page + 1) * limit, total)} of {total})
              </span>
              <button
                onClick={() => setPage((p) => p + 1)}
                disabled={!hasMore}
                className="btn bg-slate-700 hover:bg-slate-600 text-sm px-4 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next →
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}



