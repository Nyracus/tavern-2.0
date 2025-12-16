// src/components/QuestChat.tsx
import { useEffect, useState, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import { api } from "../lib/api";

type ChatMessage = {
  _id: string;
  questId: string;
  userId: string;
  username: string;
  message: string;
  createdAt: string;
};

type QuestChatProps = {
  questId: string;
  questTitle: string;
};

export default function QuestChat({ questId, questTitle }: QuestChatProps) {
  const { token, user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Load messages
  useEffect(() => {
    if (!token) return;

    const loadMessages = async () => {
      try {
        setLoading(true);
        const res = await api.get<{ success: boolean; data: ChatMessage[] }>(
          `/chat/quests/${questId}/messages`,
          token
        );
        setMessages(res.data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load messages");
      } finally {
        setLoading(false);
      }
    };

    loadMessages();
  }, [questId, token]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !newMessage.trim()) return;

    try {
      const res = await api.post<{ success: boolean; data: ChatMessage }>(
        "/chat/messages",
        { questId, message: newMessage.trim() },
        token
      );

      setMessages((prev) => [...prev, res.data]);
      setNewMessage("");
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send message");
    }
  };

  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-700/40 bg-slate-900/70 p-4">
        <p className="text-sm text-slate-400">Loading chat...</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-sky-500/40 bg-slate-900/70 shadow-lg overflow-hidden flex flex-col">
      {/* Header */}
      <div className="bg-gradient-to-r from-sky-900/50 to-slate-900/50 px-4 py-3 border-b border-sky-500/30">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          💬 Quest Chat: {questTitle}
        </h3>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 max-h-96 min-h-64">
        {messages.length === 0 ? (
          <p className="text-sm text-slate-400 text-center py-8">
            No messages yet. Start the conversation!
          </p>
        ) : (
          messages.map((msg) => {
            const isOwnMessage = msg.userId === user?.id;
            return (
              <div
                key={msg._id}
                className={`flex ${isOwnMessage ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-xs lg:max-w-md px-3 py-2 rounded-lg ${
                    isOwnMessage
                      ? "bg-sky-600/80 text-white"
                      : "bg-slate-700/80 text-slate-100"
                  }`}
                >
                  <p className="text-xs font-semibold mb-1 opacity-80">
                    {msg.username}
                  </p>
                  <p className="text-sm break-words">{msg.message}</p>
                  <p className="text-xs opacity-60 mt-1">
                    {new Date(msg.createdAt).toLocaleTimeString()}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Error display */}
      {error && (
        <div className="px-4 py-2 bg-red-900/20 border-t border-red-500/30">
          <p className="text-xs text-red-400">{error}</p>
        </div>
      )}

      {/* Input area */}
      <form
        onSubmit={handleSendMessage}
        className="p-4 border-t border-sky-500/30 bg-slate-900/50"
      >
        <div className="flex gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 px-3 py-2 bg-slate-800/80 border border-slate-600/40 rounded-lg text-sm text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/50"
            maxLength={1000}
          />
          <button
            type="submit"
            disabled={!newMessage.trim()}
            className="px-4 py-2 bg-sky-600 hover:bg-sky-700 disabled:bg-slate-700 disabled:text-slate-500 text-white rounded-lg text-sm font-medium transition-colors"
          >
            Send
          </button>
        </div>
      </form>
    </div>
  );
}
