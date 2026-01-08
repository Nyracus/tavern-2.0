// src/components/WorkloadErrorModal.tsx
import { useEffect, useState } from "react";
import { api } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { Link } from "react-router-dom";

type WorkloadResponse = {
  success: boolean;
  activeCount: number;
  maxActive: number;
  status: "OK" | "WARNING" | "BLOCKED";
  message: string;
};

type WorkloadErrorModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

export default function WorkloadErrorModal({ isOpen, onClose }: WorkloadErrorModalProps) {
  const { token } = useAuth();
  const [workload, setWorkload] = useState<WorkloadResponse | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && token) {
      loadWorkload();
    }
  }, [isOpen, token]);

  const loadWorkload = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await api.get<WorkloadResponse>(
        "/adventurers/me/workload",
        token
      );
      setWorkload(res);
    } catch (err) {
      console.error("Failed to load workload", err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-2xl border-2 border-amber-500/50 shadow-2xl w-full max-w-md p-6 space-y-6 relative overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Decorative background elements */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-orange-500/10 rounded-full blur-2xl"></div>

        {/* Header */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-amber-500/20 flex items-center justify-center border-2 border-amber-500/50">
            <span className="text-2xl">⚠️</span>
          </div>
          <div>
            <h3 className="text-xl font-bold text-amber-300">Workload Limit Reached</h3>
            <p className="text-sm text-slate-400">Burnout Prevention System</p>
          </div>
        </div>

        {/* Content */}
        <div className="relative z-10 space-y-4">
          <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-4">
            <p className="text-slate-200 leading-relaxed">
              You've reached your maximum active quest limit. The Guild's burnout prevention system 
              requires you to complete existing quests before taking on new ones.
            </p>
          </div>

          {/* Workload Stats */}
          {loading ? (
            <div className="text-center py-4">
              <p className="text-slate-400">Loading workload status...</p>
            </div>
          ) : workload ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50 border border-slate-700">
                <span className="text-slate-300">Active Quests</span>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold text-amber-400">
                    {workload.activeCount}
                  </span>
                  <span className="text-slate-500">/</span>
                  <span className="text-xl font-semibold text-slate-400">
                    {workload.maxActive}
                  </span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>Quest Capacity</span>
                  <span>{Math.round((workload.activeCount / workload.maxActive) * 100)}%</span>
                </div>
                <div className="h-3 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
                  <div
                    className="h-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all duration-500"
                    style={{ width: `${Math.min((workload.activeCount / workload.maxActive) * 100, 100)}%` }}
                  ></div>
                </div>
              </div>

              {workload.status === "BLOCKED" && (
                <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3">
                  <p className="text-sm text-red-300 flex items-center gap-2">
                    <span>🚫</span>
                    <span>Maximum capacity reached. Complete quests to free up slots.</span>
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-slate-400">Unable to load workload data</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col gap-2 pt-2">
            <Link
              to="/applications"
              onClick={onClose}
              className="btn bg-blue-600 hover:bg-blue-700 text-center py-3 font-semibold"
            >
              📋 View My Active Quests
            </Link>
            <button
              onClick={onClose}
              className="btn bg-slate-700 hover:bg-slate-600 py-3"
            >
              Close
            </button>
          </div>
        </div>

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-200 transition-colors"
          aria-label="Close"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}
