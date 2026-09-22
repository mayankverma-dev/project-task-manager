import React, { useState, useRef, useEffect } from 'react';
import { NotificationsDropdown } from '../features/notifications/components/NotificationsDropdown';
import { useSelector, useDispatch } from 'react-redux';
import { LogOut } from 'lucide-react';
import { logoutAction } from '../features/auth/authSlice.js';
import { axiosInstance } from '../api/axiosInstance.js';
import { queryClient } from '../app/queryClient.js';

export const Topbar = () => {
  const user = useSelector((state) => state.auth.user);
  const dispatch = useDispatch();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    try {
      await axiosInstance.post('/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      queryClient.clear();
      dispatch(logoutAction());
    }
  };

  return (
    <div className="sticky top-0 z-40 flex items-center justify-end w-full h-16 px-4 bg-white/80 border-b border-gray-200 backdrop-blur-md dark:bg-neutral-950/80 dark:border-neutral-800 shadow-sm">
      <div className="flex items-center gap-4">
        <NotificationsDropdown />
        
        <div className="relative" ref={dropdownRef}>
          <button 
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center gap-2 pl-4 border-l border-gray-200 dark:border-neutral-800 hover:opacity-80 transition-opacity focus:outline-none"
          >
            <div className="flex items-center justify-center w-8 h-8 font-semibold text-white bg-blue-600 rounded-full text-xs uppercase">
              {user?.name?.charAt(0) || 'U'}
            </div>
            <div className="hidden md:block">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-200">{user?.name || 'User'}</p>
            </div>
          </button>

          {isDropdownOpen && (
            <div className="absolute right-0 w-48 mt-2 bg-white rounded-md shadow-lg py-1 ring-1 ring-black ring-opacity-5 z-50 dark:bg-neutral-900 dark:ring-neutral-800">
              <button
                onClick={handleLogout}
                className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-neutral-800 transition-colors"
              >
                <LogOut className="w-4 h-4 mr-3" />
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
