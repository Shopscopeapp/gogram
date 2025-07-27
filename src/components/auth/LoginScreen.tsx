import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { HardHat, Users, Truck, Eye, UserCheck, ArrowLeft } from 'lucide-react';
import { useAppStore } from '../../store';
import { mockUsers, getCurrentUser } from '../../utils/mockData';
import type { UserRole } from '../../types';

interface LoginScreenProps {
  onLogin: (user: any) => void;
  onBack?: () => void;
  isDemo?: boolean;
}

export default function LoginScreen({ onLogin, onBack, isDemo = false }: LoginScreenProps) {
  const [selectedRole, setSelectedRole] = useState<UserRole>('project_manager');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setLoading(true);
    
    // Simulate login delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Find user with selected role
    const user = getCurrentUser(selectedRole);
    onLogin(user);
    
    setLoading(false);
  };

  const roles = [
    {
      id: 'project_manager' as UserRole,
      name: 'Project Manager',
      icon: UserCheck,
      description: 'Full access to project management, scheduling, approvals, and reports',
      color: 'bg-primary-600 hover:bg-primary-700'
    },
    {
      id: 'project_coordinator' as UserRole,
      name: 'Project Coordinator',
      icon: Users,
      description: 'Coordinate teams, manage QA processes, and assist with project oversight',
      color: 'bg-success-600 hover:bg-success-700'
    },
    {
      id: 'subcontractor' as UserRole,
      name: 'Subcontractor',
      icon: HardHat,
      description: 'View assigned tasks, update progress, and propose schedule changes',
      color: 'bg-warning-600 hover:bg-warning-700'
    },
    {
      id: 'supplier' as UserRole,
      name: 'Supplier',
      icon: Truck,
      description: 'Manage deliveries, confirm delivery dates, and coordinate with project team',
      color: 'bg-purple-600 hover:bg-purple-700'
    },
    {
      id: 'viewer' as UserRole,
      name: 'External Viewer',
      icon: Eye,
      description: 'Read-only access to project progress and public information',
      color: 'bg-gray-600 hover:bg-gray-700'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-600 via-primary-700 to-primary-800 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md"
      >
        {/* Back Button */}
        {onBack && (
          <button
            onClick={onBack}
            className="flex items-center text-gray-600 hover:text-gray-800 mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </button>
        )}

        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-primary-600 rounded-xl flex items-center justify-center mx-auto mb-4">
            <HardHat className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">
            {isDemo ? 'Try Gogram Demo' : 'Welcome to Gogram'}
          </h1>
          <p className="text-gray-600 mt-2">
            {isDemo 
              ? 'Select your role to explore our construction management platform'
              : 'Select your role to get started'
            }
          </p>
        </div>

        {/* Role Selection */}
        <div className="space-y-3 mb-6">
          {roles.map((role) => {
            const Icon = role.icon;
            return (
              <motion.button
                key={role.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setSelectedRole(role.id)}
                className={`w-full p-4 rounded-xl border-2 transition-all ${
                  selectedRole === role.id
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    selectedRole === role.id ? role.color : 'bg-gray-100'
                  }`}>
                    <Icon className={`w-5 h-5 ${
                      selectedRole === role.id ? 'text-white' : 'text-gray-600'
                    }`} />
                  </div>
                  <div className="flex-1">
                    <h3 className={`font-medium ${
                      selectedRole === role.id ? 'text-primary-900' : 'text-gray-900'
                    }`}>
                      {role.name}
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">{role.description}</p>
                  </div>
                </div>
              </motion.button>
            );
          })}
        </div>

        {/* Login Button */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleLogin}
          disabled={loading}
          className="btn btn-primary btn-lg w-full"
        >
          {loading ? (
            <div className="flex items-center justify-center space-x-2">
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>{isDemo ? 'Setting up your demo...' : 'Logging in...'}</span>
            </div>
          ) : (
            <div className="flex items-center justify-center space-x-2">
              <span>
                {isDemo 
                  ? `Enter Demo as ${roles.find(r => r.id === selectedRole)?.name}`
                  : `Continue as ${roles.find(r => r.id === selectedRole)?.name}`
                }
              </span>
            </div>
          )}
        </motion.button>

        {/* Demo Notice */}
        {isDemo && (
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Demo Mode:</strong> This is a fully functional demo with sample construction project data. 
              Explore all features without any limitations.
            </p>
          </div>
        )}

        {/* Footer */}
        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500">
            Built by construction professionals, for construction professionals
          </p>
        </div>
      </motion.div>
    </div>
  );
}