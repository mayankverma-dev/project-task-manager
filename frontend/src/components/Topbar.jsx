import React from 'react';
import { NotificationsDropdown } from '../features/notifications/components/NotificationsDropdown';
import { useSelector } from 'react-redux';

export const Topbar = () => {
  const user = useSelector((state) => state.auth.user);

  return (
    <div className="sticky top-0 z-40 flex items-center justify-end w-full h-16 px-4 bg-white/80 border-b border-gray-200 backdrop-blur-md dark:bg-neutral-950/80 dark:border-neutral-800 shadow-sm">
      <div className="flex items-center gap-4">
        <NotificationsDropdown />
        
        <div className="flex items-center gap-2 pl-4 border-l border-gray-200 dark:border-neutral-800">
          <div className="flex items-center justify-center w-8 h-8 font-semibold text-white bg-blue-600 rounded-full text-xs uppercase">
            {user?.name?.charAt(0) || 'U'}
          </div>
          <div className="hidden md:block">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-200">{user?.name || 'User'}</p>
          </div>
        </div>
      </div>
    </div>
  );
};
