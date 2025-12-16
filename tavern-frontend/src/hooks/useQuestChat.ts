// src/hooks/useQuestChat.ts
import { useEffect, useState } from "react";
import { api } from "../lib/api";
import { useAuth } from "../context/AuthContext";

type ChatMessage = {
  _id: string;
  questId: string;
  userId: string;
  username: string;
  message: string;
  createdAt: string;
};

export function useQuestChat(questId: string) {
  const { token } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadMessages = async () => {
    if (!token) return;

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

  const sendMessage = async (message: string): Promise<boolean> => {
    if (!token) return false;

    try {
      const res = await api.post<{ success: boolean; data: ChatMessage }>(
        "/chat/messages",
        { questId, message },
        token
      );

      setMessages((prev) => [...prev, res.data]);
      setError(null);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send message");
      return false;
    }
  };

  useEffect(() => {
    loadMessages();
  }, [questId, token]);

  return { messages, loading, error, sendMessage, refresh: loadMessages };
}
