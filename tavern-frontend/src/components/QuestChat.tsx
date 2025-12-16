// src/components/QuestChat.tsx
import { useState, useEffect, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import { api } from "../lib/api";

type Message = {
  _id: string;
  questId: string;
  senderId: string;
  senderName: string;
  senderRole: "NPC" | "ADVENTURER" | "GUILD_MASTER";
  content: string;
  createdAt: string;
};

type QuestChatProps = {
  questId: string;
  questTitle: string;
  onClose: () => void;
};

export default function QuestChat({ questId, questTitle, onClose }: QuestChatProps) {
  const { token, user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (token) {
      loadMessages();
      // Poll for new messages every 3 seconds
      const interval = setInterval(() => {
        loadMessages();
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [token, questId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const loadMessages = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await api.get<{ success: boolean; data: Message[] }>(
        `/quests/${questId}/messages`,
        token
      );
      setMessages(res.data);
    } catch (err) {
      console.error("Failed to load messages", err);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !newMessage.trim()) return;

    try {
      await api.post(`/quests/${questId}/messages`, { content: newMessage }, token);
      setNewMessage("");
      await loadMessages();
    } catch (err) {
      console.error("Failed to send message", err);
    }
  };

  if (!user) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-slate-900 rounded-2xl border border-purple-500/40 w-full max-w-2xl h-[600px] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-slate-700">
          <div>
            <h3 className="text-lg font-semibold">💬 Quest Chat</h3>
            <p className="text-sm text-slate-400">{questTitle}</p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-100"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {loading ? (
            <p className="text-slate-400 text-center">Loading messages…</p>
          ) : messages.length === 0 ? (
            <div className="text-center text-slate-400 py-8">
              <p>No messages yet. Start the conversation!</p>
              <p className="text-xs mt-2">Guildmaster will be present in all chats for moderation.</p>
            </div>
          ) : (
            messages.map((msg) => (
              <div
                key={msg._id}
                className={`flex ${
                  msg.senderId === user.id ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[70%] rounded-lg p-3 ${
                    msg.senderId === user.id
                      ? "bg-purple-600 text-white"
                      : msg.senderRole === "GUILD_MASTER"
                      ? "bg-emerald-600 text-white"
                      : "bg-slate-700 text-slate-100"
                  }`}
                >
                  <div className="text-xs font-semibold mb-1">
                    {msg.senderName} ({msg.senderRole})
                  </div>
                  <div className="text-sm">{msg.content}</div>
                  <div className="text-xs opacity-70 mt-1">
                    {new Date(msg.createdAt).toLocaleTimeString()}
                  </div>
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        <form onSubmit={sendMessage} className="p-4 border-t border-slate-700">
          <div className="flex items-center gap-2">
            <input
              className="input bg-slate-800 flex-1"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type a message..."
            />
            <button
              type="submit"
              className="btn bg-purple-600 hover:bg-purple-700 px-4 py-2"
            >
              Send
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

