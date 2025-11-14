import React from 'react';
import { useNotifications } from '../lib/notifications';


export const NotificationDropdown: React.FC = () => {
const { notifications, unreadCount, markRead, markAllRead } = useNotifications();


return (
<div className="relative">
<button className="px-3 py-1 rounded-md">Notifications {unreadCount > 0 && <span>({unreadCount})</span>}</button>


<div className="absolute right-0 mt-2 w-80 bg-white border shadow-lg z-50">
<div className="p-2 flex justi
