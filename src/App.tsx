import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useAppStore } from './store';
import { mockProject, mockTasks, mockDeliveries, mockSuppliers, mockTaskChangeProposals } from './utils/mockData';

// Components
import LandingPage from './components/landing/LandingPage';
import LoginScreen from './components/auth/LoginScreen';
import Header from './components/layout/Header';
import Sidebar from './components/layout/Sidebar';

// Pages
import Dashboard from './components/dashboard/Dashboard';
import SchedulePage from './components/pages/SchedulePage';
import TasksPage from './components/pages/TasksPage';
import QAPage from './components/pages/QAPage';
import ApprovalsPage from './components/pages/ApprovalsPage';
import SuppliersPage from './components/pages/SuppliersPage';
import ReportsPage from './components/pages/ReportsPage';
import SharePage from './components/pages/SharePage';
import SupplierConfirmationPage from './components/pages/SupplierConfirmationPage';
import PublicProjectPage from './components/pages/PublicProjectPage';

// Import the complete Team Management page
import TeamPage from './components/pages/TeamPage';

import DocumentsPage from './components/pages/DocumentsPage';

// Layout wrapper for authenticated routes
function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <Sidebar />
      
      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <Header />
        
        {/* Page content */}
        <main className="flex-1 overflow-auto">
          <div className="p-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

function App() {
  const { 
    currentUser, 
    setCurrentProject, 
    tasks,
    updateDashboardStats,
    generateQAAlerts
  } = useAppStore();

  const [showLogin, setShowLogin] = useState(false);

  // Initialize mock data when user logs in
  useEffect(() => {
    if (currentUser && tasks.length === 0) {
      // Initialize with mock data
      setCurrentProject(mockProject);
      
      // In a real app, you'd fetch data from API here
      // For demo, we populate the store with mock data
      const store = useAppStore.getState();
      store.tasks.push(...mockTasks);
      store.deliveries.push(...mockDeliveries);
      store.suppliers.push(...mockSuppliers);
      store.taskChangeProposals.push(...mockTaskChangeProposals);
      
      // Update dashboard stats and generate QA alerts
      updateDashboardStats();
      setTimeout(() => generateQAAlerts(), 500);
    }
  }, [currentUser, tasks.length, setCurrentProject, updateDashboardStats, generateQAAlerts]);

  return (
    <Router>
      <Routes>
        {/* Public routes (no authentication required) */}
        <Route path="/confirm-delivery/:deliveryId" element={<SupplierConfirmationPage />} />
        <Route path="/public/project/:shareToken" element={<PublicProjectPage />} />
        
        {/* Main application routes */}
        <Route path="/*" element={
          currentUser ? (
            <AuthenticatedLayout>
              <Routes>
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/schedule" element={<SchedulePage />} />
                <Route path="/tasks" element={<TasksPage />} />
                <Route path="/qa" element={<QAPage />} />
                <Route path="/approvals" element={<ApprovalsPage />} />
                <Route path="/team" element={<TeamPage />} />
                <Route path="/suppliers" element={<SuppliersPage />} />
                <Route path="/reports" element={<ReportsPage />} />
                <Route path="/share" element={<SharePage />} />
                <Route path="/documents" element={<DocumentsPage />} />
                {/* Fallback route */}
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
              </Routes>
            </AuthenticatedLayout>
          ) : showLogin ? (
            <LoginScreen onBack={() => setShowLogin(false)} />
          ) : (
            <LandingPage onGetStarted={() => setShowLogin(true)} />
          )
        } />
      </Routes>
      
      {/* Toast notifications */}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#1f2937',
            color: '#f9fafb',
            borderRadius: '0.75rem',
            padding: '12px 16px',
          },
          success: {
            iconTheme: {
              primary: '#22c55e',
              secondary: '#f9fafb',
            },
          },
          error: {
            iconTheme: {
              primary: '#ef4444',
              secondary: '#f9fafb',
            },
          },
        }}
      />
    </Router>
  );
}

export default App; 