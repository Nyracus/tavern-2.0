import { useEffect, useMemo, useState } from "react";
import { api } from "../lib/api";
import { useAuth } from "../context/AuthContext";

type QuestStatus = "DRAFT" | "POSTED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
type CreateStatus = "DRAFT" | "POSTED";

type Quest = {
  _id: string;
  title: string;
  description: string;
  createdBy: string;
  status: QuestStatus;
  requiredLevel?: number;
  requiredClasses?: string[];
  tags?: string[];
  rewardGold: number;
  deadline?: string;
  createdAt: string;
  updatedAt: string;
};

function normalizeError(e: any) {
  const msg = String(e?.message || e || "Something went wrong");
  return msg.replace(/^Error:\s*/, "");
}

export default function NpcQuestManager() {
  const { token } = useAuth();

  const [quests, setQuests] = useState<Quest[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [createForm, setCreateForm] = useState({
    title: "",
    description: "",
    status: "DRAFT" as CreateStatus,
    rewardGold: 100,
    tags: "test",
  });

  const [selectedId, setSelectedId] = useState<string | null>(null);

  const selected = useMemo(
    () => quests.find((q) => q._id === selectedId) || null,
    [quests, selectedId]
  );

  const canEdit = (q: Quest | null) =>
    !!q && (q.status === "DRAFT" || q.status === "POSTED");

  const canPublish = (q: Quest | null) => !!q && q.status === "DRAFT";
  const canCancel = (q: Quest | null) => !!q && q.status === "POSTED";
  const canDelete = (q: Quest | null) => !!q && q.status === "DRAFT";

  const [editForm, setEditForm] = useState({
    title: "",
    description: "",
    rewardGold: 0,
    tags: "",
  });

  // hydrate edit form when changing selected quest
  useEffect(() => {
    if (!selected) return;
    setEditForm({
      title: selected.title ?? "",
      description: selected.description ?? "",
      rewardGold: selected.rewardGold ?? 0,
      tags: (selected.tags ?? []).join(", "),
    });
  }, [selected?._id]);

  async function load() {
    if (!token) return;
    setError(null);
    setLoading(true);
    try {
      const res = await api.get<{ success: boolean; data: Quest[] }>("/quests/me", token);
      const list = res.data ?? [];
      setQuests(list);

      // ensure something is selected
      if (list.length === 0) {
        setSelectedId(null);
      } else if (!selectedId || !list.some((q) => q._id === selectedId)) {
        setSelectedId(list[0]._id);
      }
    } catch (e: any) {
      setError(normalizeError(e));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  async function createQuest() {
    if (!token) return;
    setError(null);

    const title = createForm.title.trim();
    const description = createForm.description.trim();
    if (!title || !description) {
      setError("Title and description are required.");
      return;
    }

    setBusy(true);
    try {
      const res = await api.post<{ success: boolean; data: Quest }>(
        "/quests/me",
        {
          title,
          description,
          status: createForm.status, // DRAFT or POSTED only
          rewardGold: Number(createForm.rewardGold) || 0,
          tags: createForm.tags
            ? createForm.tags.split(",").map((t) => t.trim()).filter(Boolean)
            : [],
        },
        token
      );

      setQuests((p) => [res.data, ...p]);
      setSelectedId(res.data._id);
      setCreateForm((p) => ({ ...p, title: "", description: "" }));
    } catch (e: any) {
      setError(normalizeError(e));
    } finally {
      setBusy(false);
    }
  }

  async function patchQuest(fields: Partial<Quest>) {
    if (!token || !selected) return;
    setError(null);
    setBusy(true);
    try {
      const res = await api.patch<{ success: boolean; data: Quest }>(
        `/quests/me/${selected._id}`,
        fields,
        token
      );
      setQuests((p) => p.map((q) => (q._id === res.data._id ? res.data : q)));
    } catch (e: any) {
      setError(normalizeError(e));
    } finally {
      setBusy(false);
    }
  }

  async function saveEdits() {
    if (!selected || !canEdit(selected)) return;

    const title = editForm.title.trim();
    const description = editForm.description.trim();
    if (!title || !description) {
      setError("Title and description are required.");
      return;
    }

    const tags = editForm.tags
      ? editForm.tags.split(",").map((t) => t.trim()).filter(Boolean)
      : [];

    await patchQuest({
      title,
      description,
      rewardGold: Number(editForm.rewardGold) || 0,
      tags,
    });
  }

  async function updateStatus(next: QuestStatus) {
    if (!token || !selected) return;
    setError(null);
    setBusy(true);
    try {
      const res = await api.patch<{ success: boolean; data: Quest }>(
        `/quests/me/${selected._id}/status`,
        { status: next },
        token
      );
      setQuests((p) => p.map((q) => (q._id === res.data._id ? res.data : q)));
    } catch (e: any) {
      setError(normalizeError(e));
    } finally {
      setBusy(false);
    }
  }

  async function deleteQuest() {
    if (!token || !selected) return;
    setError(null);
    setBusy(true);
    try {
      await api.del<null>(`/quests/me/${selected._id}`, token);

      setQuests((prev) => {
        const nextList = prev.filter((q) => q._id !== selected._id);

        // pick a next selection automatically
        const nextSelected = nextList[0]?._id ?? null;
        setSelectedId(nextSelected);

        return nextList;
      });
    } catch (e: any) {
      setError(normalizeError(e));
    } finally {
      setBusy(false);
    }
  }

  const statusBadge = (s: QuestStatus) => {
    if (s === "COMPLETED") return "badge bg-emerald-500/20 text-emerald-200";
    if (s === "POSTED") return "badge bg-indigo-500/20 text-indigo-200";
    if (s === "DRAFT") return "badge bg-slate-500/20 text-slate-200";
    if (s === "IN_PROGRESS") return "badge bg-amber-500/20 text-amber-200";
    return "badge bg-rose-500/20 text-rose-200";
  };

  const canCreate =
    createForm.title.trim().length > 0 &&
    createForm.description.trim().length > 0 &&
    !loading &&
    !busy;

  return (
    <div className="space-y-6">
      {/* Create */}
      <div className="card">
        <div className="flex items-start justify-between gap-4">
          <h2 className="text-xl font-bold">Quest Management</h2>

          <button className="btn" onClick={load} disabled={loading || busy}>
            Refresh
          </button>
        </div>

        <div className="mt-4 grid gap-3">
          <input
            className="input"
            placeholder="Quest title"
            value={createForm.title}
            onChange={(e) => setCreateForm((p) => ({ ...p, title: e.target.value }))}
          />
          <textarea
            className="input min-h-[96px]"
            placeholder="Quest description"
            value={createForm.description}
            onChange={(e) => setCreateForm((p) => ({ ...p, description: e.target.value }))}
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <select
              className="input"
              value={createForm.status}
              onChange={(e) =>
                setCreateForm((p) => ({ ...p, status: e.target.value as CreateStatus }))
              }
            >
              <option value="DRAFT">DRAFT</option>
              <option value="POSTED">POSTED</option>
            </select>

            <input
              className="input"
              type="number"
              placeholder="Reward Gold"
              value={createForm.rewardGold}
              onChange={(e) =>
                setCreateForm((p) => ({ ...p, rewardGold: Number(e.target.value) }))
              }
            />

            <input
              className="input"
              placeholder="Tags (comma separated)"
              value={createForm.tags}
              onChange={(e) => setCreateForm((p) => ({ ...p, tags: e.target.value }))}
            />
          </div>

          {error && <p className="text-rose-300 text-sm">{error}</p>}

          <button className="btn w-fit" onClick={createQuest} disabled={!canCreate}>
            Create Quest
          </button>
        </div>
      </div>

      {/* List + Details */}
      <div className="grid gap-6 md:grid-cols-2">
        <div className="card">
          <h3 className="text-lg font-bold">My Quests</h3>

          {loading ? (
            <p className="mt-3 text-slate-300">Loading…</p>
          ) : quests.length === 0 ? (
            <p className="mt-3 text-slate-300">No quests yet.</p>
          ) : (
            <div className="mt-3 space-y-2 max-h-[420px] overflow-auto pr-1">
              {quests.map((q) => (
                <button
                  key={q._id}
                  onClick={() => setSelectedId(q._id)}
                  className={[
                    "w-full text-left rounded-xl border border-white/10 p-3 hover:bg-white/5 transition",
                    selectedId === q._id ? "bg-white/10" : "bg-transparent",
                  ].join(" ")}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="font-semibold">{q.title}</div>
                    <span className={statusBadge(q.status)}>{q.status}</span>
                  </div>
                  <div className="text-xs text-slate-300 mt-1">
                    Reward: {q.rewardGold} • Tags: {(q.tags ?? []).join(", ") || "—"}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="card">
          <h3 className="text-lg font-bold">Selected Quest</h3>

          {!selected ? (
            <p className="mt-3 text-slate-300">Select a quest to manage it.</p>
          ) : (
            <div className="mt-3 space-y-4">
              <div className="flex items-center justify-between gap-2">
                <div className="font-semibold text-xl">{selected.title}</div>
                <span className={statusBadge(selected.status)}>{selected.status}</span>
              </div>

              <p className="text-sm text-slate-200 whitespace-pre-wrap">{selected.description}</p>

              {/* Edit section */}
              {canEdit(selected) && (
                <div className="rounded-xl bg-white/5 p-3 space-y-3">
                  <div className="grid gap-2">
                    <input
                      className="input"
                      placeholder="Title"
                      value={editForm.title}
                      onChange={(e) => setEditForm((p) => ({ ...p, title: e.target.value }))}
                      disabled={busy}
                    />
                    <textarea
                      className="input min-h-[96px]"
                      placeholder="Description"
                      value={editForm.description}
                      onChange={(e) =>
                        setEditForm((p) => ({ ...p, description: e.target.value }))
                      }
                      disabled={busy}
                    />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      <input
                        className="input"
                        type="number"
                        placeholder="Reward Gold"
                        value={editForm.rewardGold}
                        onChange={(e) =>
                          setEditForm((p) => ({ ...p, rewardGold: Number(e.target.value) }))
                        }
                        disabled={busy}
                      />
                      <input
                        className="input"
                        placeholder="Tags (comma separated)"
                        value={editForm.tags}
                        onChange={(e) => setEditForm((p) => ({ ...p, tags: e.target.value }))}
                        disabled={busy}
                      />
                    </div>

                    <button className="btn w-fit" onClick={saveEdits} disabled={busy}>
                      Save Changes
                    </button>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex flex-wrap gap-2">
                {canPublish(selected) && (
                  <button className="btn" onClick={() => updateStatus("POSTED")} disabled={busy}>
                    Publish
                  </button>
                )}

                {canCancel(selected) && (
                  <button className="btn" onClick={() => updateStatus("CANCELLED")} disabled={busy}>
                    Cancel Quest
                  </button>
                )}

                {canDelete(selected) && (
                  <button
                    className="btn bg-rose-600 hover:bg-rose-700"
                    onClick={deleteQuest}
                    disabled={busy}
                    title="Delete is only allowed for drafts"
                  >
                    Delete
                  </button>
                )}
              </div>

              {error && <p className="text-rose-300 text-sm">{error}</p>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
