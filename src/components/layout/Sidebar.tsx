import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Calendar,
  Users,
  Truck,
  BarChart3,
  Settings,
  ChevronLeft,
  CheckSquare,
  Clock,
  Share2,
  Shield
} from 'lucide-react';
import { useAppStore } from '../../store';

interface NavItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  path: string;
  count?: number;
  roles?: string[];
}

const navigationItems: NavItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: LayoutDashboard,
    path: '/',
    roles: ['project_manager', 'project_coordinator', 'subcontractor', 'supplier', 'viewer']
  },
  {
    id: 'schedule',
    label: 'Schedule',
    icon: Calendar,
    path: '/schedule',
    roles: ['project_manager', 'project_coordinator', 'subcontractor', 'supplier', 'viewer']
  },
  {
    id: 'tasks',
    label: 'Tasks',
    icon: CheckSquare,
    path: '/tasks',
    roles: ['project_manager', 'project_coordinator', 'subcontractor']
  },
  {
    id: 'qa',
    label: 'Quality Assurance',
    icon: Shield,
    path: '/qa',
    roles: ['project_manager', 'project_coordinator']
  },
  {
    id: 'approvals',
    label: 'Approvals',
    icon: Clock,
    path: '/approvals',
    roles: ['project_manager']
  },
  {
    id: 'team',
    label: 'Team',
    icon: Users,
    path: '/team',
    roles: ['project_manager', 'project_coordinator']
  },
  {
    id: 'suppliers',
    label: 'Suppliers',
    icon: Truck,
    path: '/suppliers',
    roles: ['project_manager', 'project_coordinator', 'supplier']
  },
  {
    id: 'reports',
    label: 'Reports',
    icon: BarChart3,
    path: '/reports',
    roles: ['project_manager', 'project_coordinator']
  },
  {
    id: 'share',
    label: 'Share Project',
    icon: Share2,
    path: '/share',
    roles: ['project_manager']
  }
];

export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    sidebarOpen,
    setSidebarOpen,
    currentUser,
    taskChangeProposals,
    dashboardStats,
    qaAlerts
  } = useAppStore();

  if (!currentUser) return null;

  const getNavItemCount = (item: NavItem): number | undefined => {
    if (!currentUser) return undefined;

    switch (item.id) {
      case 'approvals':
        return taskChangeProposals.filter(p => p.status === 'pending').length;
      case 'qa':
        // Show count of pending and overdue QA alerts
        const pendingQA = qaAlerts.filter(alert =>
          alert.status === 'pending' || alert.status === 'overdue'
        ).length;
        return pendingQA > 0 ? pendingQA : undefined;
      default:
        return undefined;
    }
  };

  const filteredNavItems = navigationItems.filter(item =>
    !item.roles || item.roles.includes(currentUser.role)
  );

  const handleNavigation = (path: string) => {
    navigate(path);
    // Close sidebar on mobile after navigation
    if (window.innerWidth < 1024) {
      setSidebarOpen(false);
    }
  };

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={{
          x: sidebarOpen ? 0 : -280,
          transition: { duration: 0.3 }
        }}
        className="fixed left-0 top-0 h-full w-72 bg-white border-r border-gray-200 z-50 lg:relative lg:translate-x-0 lg:z-auto"
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                <Calendar className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="font-semibold text-gray-900">Project</h2>
                <p className="text-sm text-gray-500">Riverside Complex</p>
              </div>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="p-1 rounded-lg hover:bg-gray-100 transition-colors lg:hidden"
            >
              <ChevronLeft className="w-5 h-5 text-gray-600" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2">
            {filteredNavItems.map((item) => {
              const Icon = item.icon;
              const count = getNavItemCount(item);
              const active = isActive(item.path);

              return (
                <motion.button
                  key={item.id}
                  whileHover={{ x: 4 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleNavigation(item.path)}
                  className={`w-full flex items-center justify-between p-3 rounded-xl transition-colors group ${
                    active
                      ? 'bg-primary-50 text-primary-900 shadow-sm'
                      : 'hover:bg-gray-50 text-gray-700'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-lg transition-colors ${
                      active
                        ? 'bg-primary-600 text-white'
                        : 'bg-gray-100 group-hover:bg-primary-100'
                    }`}>
                      <Icon className={`w-5 h-5 ${
                        active
                          ? 'text-white'
                          : 'text-gray-600 group-hover:text-primary-600'
                      }`} />
                    </div>
                    <span className={`font-medium ${
                      active
                        ? 'text-primary-900'
                        : 'text-gray-700 group-hover:text-gray-900'
                    }`}>
                      {item.label}
                    </span>
                  </div>
                  {count !== undefined && count > 0 && (
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                      active
                        ? 'bg-primary-600 text-white'
                        : 'bg-primary-600 text-white'
                    }`}>
                      {count > 99 ? '99+' : count}
                    </span>
                  )}
                </motion.button>
              );
            })}
          </nav>

          {/* Project Status */}
          <div className="p-4 border-t border-gray-200">
            <div className="bg-success-50 rounded-xl p-4">
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-success-500 rounded-full animate-pulse"></div>
                <div>
                  <p className="font-medium text-success-900">Project Active</p>
                  <p className="text-sm text-success-700">On track for Aug 2024</p>
                </div>
              </div>
            </div>
          </div>

          {/* User Role Badge */}
          <div className="p-4 border-t border-gray-200">
            <div className="flex items-center space-x-3">
              {currentUser.avatar_url ? (
                <img
                  src={currentUser.avatar_url}
                  alt={currentUser.full_name}
                  className="w-10 h-10 rounded-full object-cover"
                />
              ) : (
                <div className="w-10 h-10 bg-primary-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-medium">
                    {currentUser.full_name.charAt(0)}
                  </span>
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 truncate">{currentUser.full_name}</p>
                <p className="text-sm text-primary-600 capitalize">
                  {currentUser.role.replace('_', ' ')}
                </p>
              </div>
            </div>
          </div>
        </div>
      </motion.aside>
    </>
  );
} 