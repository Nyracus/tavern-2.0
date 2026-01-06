// src/pages/GuildmasterChats.tsx
import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { api } from "../lib/api";
import { Link } from "react-router-dom";
import QuestChat from "../components/QuestChat";

type QuestChatSummary = {
  quest: {
    _id: string;
    title: string;
    status: string;
    npcName?: string | null;
    adventurerName?: string | null;
  };
  messageCount: number;
  lastMessage: {
    _id: string;
    content: string;
    senderId: string | { username: string; displayName: string };
    createdAt: string;
  } | null;
};

export default function GuildmasterChats() {
  const { token, user } = useAuth();
  const [chats, setChats] = useState<QuestChatSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedQuestId, setSelectedQuestId] = useState<string | null>(null);
  const [selectedQuestTitle, setSelectedQuestTitle] = useState<string>("");

  useEffect(() => {
    if (token && user?.role === "GUILD_MASTER") {
      loadChats();
    }
  }, [token, user]);

  const loadChats = async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const res = await api.get<{ success: boolean; data: QuestChatSummary[] }>(
        "/admin/chats",
        token
      );
      setChats(res.data || []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load chats");
    } finally {
      setLoading(false);
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
    <div className="min-h-screen bg-linear-to-b from-slate-900 via-slate-950 to-black text-slate-100">
      <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-extrabold tracking-wide flex items-center gap-2">
              💬 All Quest Chats
            </h1>
            <p className="text-sm text-slate-300">
              Monitor and moderate all quest-related communications
            </p>
          </div>
          <Link
            to="/"
            className="text-xs md:text-sm px-3 py-2 rounded-lg border border-slate-600 text-slate-300 hover:bg-slate-700/50"
          >
            ← Back to Dashboard
          </Link>
        </header>

        {error && (
          <div className="rounded-lg border border-red-500/60 bg-red-900/40 px-4 py-3 text-red-100">
            ⚠️ {error}
          </div>
        )}

        {loading ? (
          <p className="text-slate-400">Loading chats…</p>
        ) : chats.length === 0 ? (
          <div className="rounded-2xl border border-slate-700 bg-slate-900/70 p-8 text-center">
            <p className="text-slate-400">No quest chats found.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {chats.map((chat) => (
              <div
                key={chat.quest._id}
                className="rounded-2xl border border-blue-500/40 bg-slate-900/70 p-5 space-y-3 cursor-pointer hover:bg-slate-800/50 transition-colors"
                onClick={() => {
                  setSelectedQuestId(chat.quest._id);
                  setSelectedQuestTitle(chat.quest.title);
                }}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold mb-1">
                      {chat.quest.title}
                    </h3>
                    <div className="text-sm text-slate-400 space-y-1">
                      <p>
                        <b>NPC:</b> {chat.quest.npcName || "Unknown"}
                      </p>
                      <p>
                        <b>Adventurer:</b> {chat.quest.adventurerName || "None"}
                      </p>
                      <p>
                        <b>Status:</b> {chat.quest.status}
                      </p>
                      <p>
                        <b>Messages:</b> {chat.messageCount}
                      </p>
                    </div>
                    {chat.lastMessage && (
                      <div className="mt-3 pt-3 border-t border-slate-700">
                        <p className="text-xs text-slate-500 mb-1">
                          Last message from{" "}
                          {typeof chat.lastMessage.senderId === "object"
                            ? chat.lastMessage.senderId.displayName ||
                              chat.lastMessage.senderId.username
                            : "Unknown"}
                        </p>
                        <p className="text-sm text-slate-300 line-clamp-2">
                          {chat.lastMessage.content}
                        </p>
                        <p className="text-xs text-slate-500 mt-1">
                          {new Date(chat.lastMessage.createdAt).toLocaleString()}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
                <button
                  className="btn bg-blue-600 hover:bg-blue-700 w-full text-sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedQuestId(chat.quest._id);
                    setSelectedQuestTitle(chat.quest.title);
                  }}
                >
                  View Chat
                </button>
              </div>
            ))}
          </div>
        )}

        {selectedQuestId && (
          <QuestChat
            questId={selectedQuestId}
            questTitle={selectedQuestTitle}
            onClose={() => {
              setSelectedQuestId(null);
              setSelectedQuestTitle("");
            }}
          />
        )}
      </div>
    </div>
  );
}

