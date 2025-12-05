import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';


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
};


const NotificationContext = createContext<NotificationContextType | null>(null);


export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
const [notifications, setNotifications] = useState<Notification[]>([]);
const [unreadCount, setUnreadCount] = useState(0);
const [socket, setSocket] = useState<Socket | null>(null);


const API = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';


const fetchNotifications = useCallback(async () => {
// assume userId is in localStorage (or use auth context)
const userId = localStorage.getItem('userId');
if (!userId) return;
const res = await fetch(`${API}/notifications?userId=${encodeURIComponent(userId)}&limit=30`);
if (!res.ok) return;
const body = await res.json();
setNotifications(body.notifications);
setUnreadCount(body.unreadCount || 0);
}, [API]);


useEffect(() => {
fetchNotifications();
}, [fetchNotifications]);


useEffect(() => {
const userId = localStorage.getItem('userId');
const token = localStorage.getItem('token');
if (!userId) return;
const s = io((import.meta.env.VITE_SOCKET_URL as string) || (import.meta.env.VITE_API_URL || 'http://localhost:3000') , {
auth: { token, userId },
path: '/socket.io',
});


s.on('connect', () => {
// console.log('connected socket', s.id);
});
};
