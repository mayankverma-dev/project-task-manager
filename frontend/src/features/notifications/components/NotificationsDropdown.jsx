import React, { useState, useRef, useEffect } from 'react';
import { Bell, Check, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useNotifications, useMarkAsRead, useMarkAllAsRead } from '../hooks/useNotifications';
import { NotificationSkeleton } from './NotificationSkeleton';

export const NotificationsDropdown = () => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();
  
  const { data, isLoading, hasNextPage, fetchNextPage, isFetchingNextPage } = useNotifications();
  const { mutate: markAsRead } = useMarkAsRead();
  const { mutate: markAllAsRead, isPending: isMarkingAll } = useMarkAllAsRead();

  // Handle clicking outside to close
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const notifications = data?.pages.flatMap(page => page.data) || [];
  const unreadCount = notifications.filter(n => !n.readAt).length;

  const handleNotificationClick = (notification) => {
    if (!notification.readAt) {
      markAsRead(notification.id);
    }
    setIsOpen(false);
    
    if (notification.type === 'TASK_ASSIGNED' && notification.payload) {
      const { workspaceId, projectId, taskId } = notification.payload;
      if (workspaceId && projectId) {
        let url = `/workspaces/${workspaceId}/projects/${projectId}`;
        if (taskId) {
          url += `?taskId=${taskId}`;
        }
        navigate(url);
      }
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-500 rounded-full hover:bg-gray-100 hover:text-gray-700 focus:outline-none dark:text-gray-400 dark:hover:bg-neutral-800"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 block w-2 h-2 bg-red-500 rounded-full ring-2 ring-white dark:ring-neutral-900" />
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 w-80 mt-2 origin-top-right bg-white border border-gray-200 divide-y divide-gray-100 rounded-lg shadow-lg outline-none dark:bg-neutral-900 dark:border-neutral-800 dark:divide-neutral-800 z-50">
          <div className="flex items-center justify-between px-4 py-3">
            <p className="text-sm font-medium text-gray-900 dark:text-white">Notifications</p>
            {unreadCount > 0 && (
              <button 
                onClick={() => markAllAsRead()}
                disabled={isMarkingAll}
                className="text-xs font-medium text-blue-600 hover:text-blue-500 disabled:opacity-50"
              >
                Mark all as read
              </button>
            )}
          </div>
          
          <div className="max-h-96 overflow-y-auto">
            {isLoading ? (
              <NotificationSkeleton count={4} />
            ) : notifications.length === 0 ? (
              <div className="p-4 text-sm text-center text-gray-500 dark:text-gray-400">
                No notifications yet.
              </div>
            ) : (
              <div className="divide-y divide-gray-100 dark:divide-neutral-800">
                {notifications.map((notification) => (
                  <div 
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification)}
                    className={`flex gap-3 px-4 py-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-neutral-800/50 transition-colors ${!notification.readAt ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''}`}
                  >
                    <div className="mt-1 shrink-0">
                      {notification.readAt ? (
                        <Check className="w-4 h-4 text-gray-400" />
                      ) : (
                        <div className="w-2 h-2 mt-1 bg-blue-600 rounded-full" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm ${!notification.readAt ? 'font-medium text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-300'}`}>
                        {notification.type === 'TASK_ASSIGNED' ? (
                          <>You were assigned to task: <strong>{notification.payload?.taskTitle || 'Unknown Task'}</strong></>
                        ) : (
                          notification.payload?.message || 'New notification received.'
                        )}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(notification.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                ))}
                
                {hasNextPage && (
                  <button 
                    onClick={() => fetchNextPage()}
                    disabled={isFetchingNextPage}
                    className="w-full px-4 py-3 text-xs font-medium text-center text-blue-600 hover:bg-gray-50 dark:hover:bg-neutral-800 disabled:opacity-50"
                  >
                    {isFetchingNextPage ? 'Loading...' : 'Load more'}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
