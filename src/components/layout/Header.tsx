import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  HardHat, 
  Bell, 
  Settings, 
  Search, 
  Menu,
  ChevronDown,
  LogOut
} from 'lucide-react';
import { useAppStore } from '../../store';

export default function Header() {
  const navigate = useNavigate();
  const { 
    currentUser, 
    sidebarOpen, 
    setSidebarOpen,
    signOut,
    notifications,
    unreadCount 
  } = useAppStore();

  if (!currentUser) return null;

  const handleLogout = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <header className="bg-white border-b border-gray-200 h-16 flex items-center justify-between px-4 lg:px-6">
      {/* Left side - Menu toggle and Logo */}
      <div className="flex items-center space-x-4">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <Menu className="w-6 h-6 text-gray-600" />
        </button>
        
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
            <HardHat className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Gogram</h1>
          </div>
        </div>
      </div>

      {/* Center - Search (hidden on mobile) */}
      <div className="hidden md:flex flex-1 max-w-md mx-8">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search tasks, suppliers, or deliveries..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          />
        </div>
      </div>

      {/* Right side - Actions and User */}
      <div className="flex items-center space-x-2">
        {/* Search button (mobile only) */}
        <button className="p-2 rounded-lg hover:bg-gray-100 transition-colors md:hidden">
          <Search className="w-5 h-5 text-gray-600" />
        </button>

        {/* Notifications */}
        <div className="relative">
          <button 
            onClick={() => navigate('/account')}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors relative"
          >
            <Bell className="w-5 h-5 text-gray-600" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-danger-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>
        </div>

        {/* Settings */}
        <button 
          onClick={() => navigate('/account')}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <Settings className="w-5 h-5 text-gray-600" />
        </button>

        {/* User Menu */}
        <div className="relative group">
          <button className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-100 transition-colors">
            <div className="flex items-center space-x-2">
              {currentUser.avatar_url ? (
                <img
                  src={currentUser.avatar_url}
                  alt={currentUser.full_name}
                  className="w-8 h-8 rounded-full object-cover"
                />
              ) : (
                <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-medium">
                    {currentUser.full_name.charAt(0)}
                  </span>
                </div>
              )}
              <div className="hidden sm:block text-left">
                <p className="text-sm font-medium text-gray-900">{currentUser.full_name}</p>
                <p className="text-xs text-gray-500 capitalize">
                  {currentUser.role.replace('_', ' ')}
                </p>
              </div>
            </div>
            <ChevronDown className="w-4 h-4 text-gray-400" />
          </button>

          {/* Dropdown Menu */}
          <div className="absolute right-0 top-full mt-1 w-64 bg-white rounded-lg shadow-lg border border-gray-200 py-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
            <div className="px-4 py-3 border-b border-gray-100">
              <p className="font-medium text-gray-900">{currentUser.full_name}</p>
              <p className="text-sm text-gray-500">{currentUser.email}</p>
              <p className="text-xs text-primary-600 capitalize mt-1">
                {currentUser.role.replace('_', ' ')}
              </p>
            </div>
            
            <div className="py-2">
              <button 
                onClick={() => navigate('/account')}
                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-2"
              >
                <Settings className="w-4 h-4" />
                <span>Account Settings</span>
              </button>
              <button 
                onClick={() => navigate('/account')}
                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-2"
              >
                <Bell className="w-4 h-4" />
                <span>Notifications</span>
              </button>
              <div className="border-t border-gray-100 my-2"></div>
              <button
                onClick={handleLogout}
                className="w-full px-4 py-2 text-left text-sm text-danger-600 hover:bg-danger-50 flex items-center space-x-2"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
} 