// src/lib/notifications.tsx
import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { api } from './api';
import { useAuth } from '../context/AuthContext';

type Notification = {
  _id: string;
  userId: string;
  title: string;
  message: string;
  type: string;
  data?: any;
  read: boolean;
  createdAt: string;
};

type NotificationContextType = {
  notifications: Notification[];
  unreadCount: number;
  markRead: (id: string) => Promise<void>;
  markAllRead: () => Promise<void>;
  refresh: () => Promise<void>;
  loading: boolean;
};

const NotificationContext = createContext<NotificationContextType | null>(null);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within NotificationProvider');
  }
  return context;
};

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { token } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const fetchNotifications = useCallback(async () => {
    if (!token) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    setLoading(true);
    try {
      const res = await api.get<{ success: boolean; notifications: Notification[]; unreadCount: number }>(
        '/notifications?limit=50',
        token
      );
      const newNotifications = res.notifications || [];
      
      // Check if there's a new payment notification
      const hasNewPayment = newNotifications.some(
        n => n.type === 'QUEST_PAYMENT_RECEIVED' && !n.read
      );
      
      if (hasNewPayment) {
        // Dispatch event to refresh gold immediately
        window.dispatchEvent(new CustomEvent('paymentReceived'));
      }
      
      setNotifications(newNotifications);
      setUnreadCount(res.unreadCount || 0);
    } catch (err) {
      console.error('Failed to fetch notifications', err);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (!token) return;
    
    fetchNotifications();
    // Poll for new notifications every 15 seconds (reduced frequency to avoid rate limits)
    const interval = setInterval(() => {
      fetchNotifications();
    }, 15000);
    return () => clearInterval(interval);
  }, [fetchNotifications, token]);

  const markRead = async (id: string) => {
    if (!token) return;
    try {
      await api.patch(`/notifications/${id}/read`, {}, token);
      setNotifications(prev =>
        prev.map(n => n._id === id ? { ...n, read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Failed to mark notification as read', err);
    }
  };

  const markAllRead = async () => {
    if (!token) return;
    try {
      await api.patch('/notifications/read-all', {}, token);
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Failed to mark all as read', err);
    }
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        markRead,
        markAllRead,
        refresh: fetchNotifications,
        loading,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

