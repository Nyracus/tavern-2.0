// src/components/NotificationDropdown.tsx
import { useState, useRef, useEffect } from 'react';
import { useNotifications } from '../lib/notifications';
import { Link } from 'react-router-dom';

export const NotificationDropdown: React.FC = () => {
  const { notifications, unreadCount, markRead, markAllRead, loading } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'QUEST_APPLICATION_RECEIVED': return '📋';
      case 'QUEST_APPLICATION_ACCEPTED': return '✅';
      case 'QUEST_APPLICATION_REJECTED': return '❌';
      case 'QUEST_COMPLETION_SUBMITTED': return '📄';
      case 'QUEST_PAYMENT_RECEIVED': return '💰';
      case 'QUEST_DEADLINE_APPROACHING': return '⏰';
      case 'QUEST_DEADLINE_PASSED': return '⚠️';
      case 'CHAT_MESSAGE': return '💬';
      case 'ANOMALY_DETECTED': return '🧩';
      default: return '🔔';
    }
  };

  const getNotificationLink = (notification: any) => {
    if (notification.data?.questId) {
      if (notification.type === 'QUEST_COMPLETION_SUBMITTED') {
        return '/npc/completions';
      }
      if (notification.type === 'QUEST_APPLICATION_RECEIVED') {
        return '/npc/applications';
      }
      return `/adventurer/applications`;
    }
    return null;
  };

  const handleNotificationClick = async (notification: any) => {
    if (!notification.read) {
      await markRead(notification._id);
    }
    setIsOpen(false);
  };

  const unreadNotifications = notifications.filter(n => !n.read);
  const displayNotifications = isOpen ? notifications.slice(0, 10) : [];

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative px-3 py-2 rounded-lg border border-slate-600 text-slate-300 hover:bg-slate-700/50 text-sm flex items-center gap-2"
      >
        🔔 Notifications
        {unreadCount > 0 && (
          <span className="bg-red-500 text-white text-xs rounded-full px-2 py-0.5 min-w-[20px] text-center">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 bg-slate-900 border border-slate-700 rounded-lg shadow-xl z-50 max-h-[500px] flex flex-col">
          <div className="p-3 border-b border-slate-700 flex items-center justify-between">
            <h3 className="font-semibold text-slate-100">Notifications</h3>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="text-xs text-blue-400 hover:text-blue-300"
              >
                Mark all read
              </button>
            )}
          </div>

          <div className="overflow-y-auto flex-1">
            {loading ? (
              <div className="p-4 text-center text-slate-400">Loading...</div>
            ) : displayNotifications.length === 0 ? (
              <div className="p-4 text-center text-slate-400">No notifications</div>
            ) : (
              <div className="divide-y divide-slate-700">
                {displayNotifications.map((notification) => {
                  const link = getNotificationLink(notification);
                  const content = (
                    <div
                      className={`p-3 hover:bg-slate-800 cursor-pointer ${
                        !notification.read ? 'bg-slate-800/50' : ''
                      }`}
                      onClick={() => handleNotificationClick(notification)}
                    >
                      <div className="flex items-start gap-2">
                        <span className="text-lg">{getNotificationIcon(notification.type)}</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-semibold text-sm text-slate-100">
                              {notification.title}
                            </p>
                            {!notification.read && (
                              <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                            )}
                          </div>
                          <p className="text-xs text-slate-300 mb-1">{notification.message}</p>
                          <p className="text-xs text-slate-500">
                            {new Date(notification.createdAt).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  );

                  return link ? (
                    <Link key={notification._id} to={link}>
                      {content}
                    </Link>
                  ) : (
                    <div key={notification._id}>{content}</div>
                  );
                })}
              </div>
            )}
          </div>

          {notifications.length > 10 && (
            <div className="p-2 border-t border-slate-700 text-center">
              <button className="text-xs text-blue-400 hover:text-blue-300">
                View all notifications
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

