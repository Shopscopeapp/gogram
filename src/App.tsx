import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useAppStore } from './store';
import { authService } from './services/authService';
import type { User, Project } from './types';

// Auth Components
import LoginForm from './components/auth/LoginForm';
import SignupForm from './components/auth/SignupForm';
import LoginScreen from './components/auth/LoginScreen';
import ProjectDashboard from './components/projects/ProjectDashboard';

// Main App Components  
import Sidebar from './components/layout/Sidebar';
import Header from './components/layout/Header';
import Dashboard from './components/dashboard/Dashboard';
import SchedulePage from './components/pages/SchedulePage';
import TasksPage from './components/pages/TasksPage';
import ApprovalsPage from './components/pages/ApprovalsPage';
import SuppliersPage from './components/pages/SuppliersPage';
import ReportsPage from './components/pages/ReportsPage';
import SharePage from './components/pages/SharePage';
import QAPage from './components/pages/QAPage';
import TeamPage from './components/pages/TeamPage';
import DocumentsPage from './components/pages/DocumentsPage';
import SupplierConfirmationPage from './components/pages/SupplierConfirmationPage';
import PublicProjectPage from './components/pages/PublicProjectPage';
import LandingPage from './components/landing/LandingPage';

type AuthMode = 'login' | 'signup' | 'forgot-password';
type AppState = 'loading' | 'landing' | 'demo-selection' | 'demo-active' | 'unauthenticated' | 'project-selection' | 'authenticated';

function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}

function App() {
  const [appState, setAppState] = useState<AppState>('loading');
  const [authMode, setAuthMode] = useState<AuthMode>('login');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [isDemoMode, setIsDemoMode] = useState(false);
  
  const { 
    initializeUserSession,
    initializeProjectData,
    initializeDemoData,
    subscribeToRealTimeUpdates,
    unsubscribeFromRealTimeUpdates
  } = useAppStore();

  useEffect(() => {
    initializeAuth();
  }, []);

  useEffect(() => {
    // Set up auth state listener only for real auth mode
    if (!isDemoMode) {
      const subscription = authService.onAuthStateChange((user) => {
        if (user) {
          setCurrentUser(user);
          setAppState('project-selection');
        } else {
          setCurrentUser(null);
          setSelectedProject(null);
          setAppState('unauthenticated');
          unsubscribeFromRealTimeUpdates();
        }
      });

      return () => {
        subscription?.data?.subscription?.unsubscribe();
      };
    }
  }, [isDemoMode, unsubscribeFromRealTimeUpdates]);

  useEffect(() => {
    // Initialize project data when user and project are selected
    if (currentUser && selectedProject && !isDemoMode) {
      initializeUserSession();
      initializeProjectData(selectedProject.id);
      subscribeToRealTimeUpdates(selectedProject.id);
      setAppState('authenticated');
    }
  }, [currentUser, selectedProject, isDemoMode, initializeUserSession, initializeProjectData, subscribeToRealTimeUpdates]);

  const initializeAuth = async () => {
    try {
      const user = await authService.getCurrentUser();
      if (user) {
        setCurrentUser(user);
        setAppState('project-selection');
      } else {
        setAppState('landing');
      }
    } catch (error) {
      console.error('Auth initialization error:', error);
      setAppState('landing');
    }
  };

  const handleAuthSuccess = () => {
    // User will be set via the auth state listener
  };

  const handleProjectSelect = (project: Project) => {
    setSelectedProject(project);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setSelectedProject(null);
    setIsDemoMode(false);
    setAppState('landing');
  };

  const handleBackToProjects = () => {
    if (isDemoMode) {
      setAppState('landing');
      setIsDemoMode(false);
    } else {
      setSelectedProject(null);
      setAppState('project-selection');
      unsubscribeFromRealTimeUpdates();
    }
  };

  const handleGetStarted = () => {
    setAppState('demo-selection');
  };

  const handleStartDemo = () => {
    setIsDemoMode(true);
    setAppState('demo-selection');
  };

  const handleCreateAccount = () => {
    setAuthMode('signup');
    setAppState('unauthenticated');
  };

  const handleDemoLogin = (demoUser: User) => {
    setCurrentUser(demoUser);
    setIsDemoMode(true);
    initializeDemoData();
    setAppState('demo-active');
  };

  const handleForgotPassword = () => {
    // TODO: Implement forgot password flow
    console.log('Forgot password clicked');
  };

  // Loading state
  if (appState === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-primary-600 rounded-xl flex items-center justify-center mx-auto mb-4 animate-pulse">
            <div className="w-8 h-8 bg-white rounded" />
          </div>
          <p className="text-gray-600">Loading Gogram...</p>
        </div>
      </div>
    );
  }

  // Landing page
  if (appState === 'landing') {
    return (
      <BrowserRouter>
        <Routes>
          <Route path="/confirm-delivery/:deliveryId" element={<SupplierConfirmationPage />} />
          <Route path="/public/project/:shareToken" element={<PublicProjectPage />} />
          <Route path="*" element={<LandingPage onGetStarted={handleGetStarted} onStartDemo={handleStartDemo} onCreateAccount={handleCreateAccount} />} />
        </Routes>
        <Toaster position="top-right" />
      </BrowserRouter>
    );
  }

  // Demo selection screen
  if (appState === 'demo-selection') {
    return (
      <BrowserRouter>
        <Routes>
          <Route path="/confirm-delivery/:deliveryId" element={<SupplierConfirmationPage />} />
          <Route path="/public/project/:shareToken" element={<PublicProjectPage />} />
          <Route path="*" element={
            <LoginScreen 
              onLogin={handleDemoLogin} 
              onBack={() => setAppState('landing')}
              isDemo={true}
            />
          } />
        </Routes>
        <Toaster position="top-right" />
      </BrowserRouter>
    );
  }

  // Demo mode active
  if (appState === 'demo-active' && isDemoMode && currentUser) {
    return (
      <BrowserRouter>
        <Routes>
          {/* Public routes */}
          <Route path="/confirm-delivery/:deliveryId" element={<SupplierConfirmationPage />} />
          <Route path="/public/project/:shareToken" element={<PublicProjectPage />} />
          
          {/* Demo routes */}
          <Route path="/" element={
            <AuthenticatedLayout>
              <Dashboard />
            </AuthenticatedLayout>
          } />
          <Route path="/schedule" element={
            <AuthenticatedLayout>
              <SchedulePage />
            </AuthenticatedLayout>
          } />
          <Route path="/tasks" element={
            <AuthenticatedLayout>
              <TasksPage />
            </AuthenticatedLayout>
          } />
          <Route path="/approvals" element={
            <AuthenticatedLayout>
              <ApprovalsPage />
            </AuthenticatedLayout>
          } />
          <Route path="/suppliers" element={
            <AuthenticatedLayout>
              <SuppliersPage />
            </AuthenticatedLayout>
          } />
          <Route path="/reports" element={
            <AuthenticatedLayout>
              <ReportsPage />
            </AuthenticatedLayout>
          } />
          <Route path="/share" element={
            <AuthenticatedLayout>
              <SharePage />
            </AuthenticatedLayout>
          } />
          <Route path="/qa" element={
            <AuthenticatedLayout>
              <QAPage />
            </AuthenticatedLayout>
          } />
          <Route path="/team" element={
            <AuthenticatedLayout>
              <TeamPage />
            </AuthenticatedLayout>
          } />
          <Route path="/documents" element={
            <AuthenticatedLayout>
              <DocumentsPage />
            </AuthenticatedLayout>
          } />
        </Routes>
        
        {/* Demo mode indicator */}
        <div className="fixed top-4 left-4 z-50 flex items-center space-x-2">
          <div className="bg-orange-500 text-white px-3 py-1 rounded-full text-xs font-medium">
            DEMO MODE
          </div>
          <button
            onClick={handleBackToProjects}
            className="bg-white shadow-lg rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 border"
          >
            ← Exit Demo
          </button>
        </div>
        
        <Toaster position="top-right" />
      </BrowserRouter>
    );
  }

  // Authentication flow
  if (appState === 'unauthenticated') {
    return (
      <BrowserRouter>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<LandingPage onGetStarted={handleGetStarted} onStartDemo={handleStartDemo} onCreateAccount={handleCreateAccount} />} />
          <Route path="/confirm-delivery/:deliveryId" element={<SupplierConfirmationPage />} />
          <Route path="/public/project/:shareToken" element={<PublicProjectPage />} />
          
          {/* Auth routes */}
          <Route path="/auth" element={
            <>
              {authMode === 'login' && (
                <LoginForm
                  onSuccess={handleAuthSuccess}
                  onSwitchToSignup={() => setAuthMode('signup')}
                  onForgotPassword={handleForgotPassword}
                />
              )}
              {authMode === 'signup' && (
                <SignupForm
                  onSuccess={handleAuthSuccess}
                  onSwitchToLogin={() => setAuthMode('login')}
                />
              )}
            </>
          } />
          
          {/* Redirect all other routes to auth */}
          <Route path="*" element={<Navigate to="/auth" replace />} />
        </Routes>
        <Toaster position="top-right" />
      </BrowserRouter>
    );
  }

  // Project selection
  if (appState === 'project-selection' && currentUser) {
    return (
      <BrowserRouter>
        <Routes>
          {/* Public routes */}
          <Route path="/confirm-delivery/:deliveryId" element={<SupplierConfirmationPage />} />
          <Route path="/public/project/:shareToken" element={<PublicProjectPage />} />
          
          {/* Project dashboard */}
          <Route path="*" element={
            <ProjectDashboard
              currentUser={currentUser}
              onProjectSelect={handleProjectSelect}
              onLogout={handleLogout}
            />
          } />
        </Routes>
        <Toaster position="top-right" />
      </BrowserRouter>
    );
  }

  // Authenticated app with selected project
  if (appState === 'authenticated' && currentUser && selectedProject) {
    return (
      <BrowserRouter>
        <Routes>
          {/* Public routes */}
          <Route path="/confirm-delivery/:deliveryId" element={<SupplierConfirmationPage />} />
          <Route path="/public/project/:shareToken" element={<PublicProjectPage />} />
          
          {/* Authenticated routes */}
          <Route path="/" element={
            <AuthenticatedLayout>
              <Dashboard />
            </AuthenticatedLayout>
          } />
          <Route path="/schedule" element={
            <AuthenticatedLayout>
              <SchedulePage />
            </AuthenticatedLayout>
          } />
          <Route path="/tasks" element={
            <AuthenticatedLayout>
              <TasksPage />
            </AuthenticatedLayout>
          } />
          <Route path="/approvals" element={
            <AuthenticatedLayout>
              <ApprovalsPage />
            </AuthenticatedLayout>
          } />
          <Route path="/suppliers" element={
            <AuthenticatedLayout>
              <SuppliersPage />
            </AuthenticatedLayout>
          } />
          <Route path="/reports" element={
            <AuthenticatedLayout>
              <ReportsPage />
            </AuthenticatedLayout>
          } />
          <Route path="/share" element={
            <AuthenticatedLayout>
              <SharePage />
            </AuthenticatedLayout>
          } />
          <Route path="/qa" element={
            <AuthenticatedLayout>
              <QAPage />
            </AuthenticatedLayout>
          } />
          <Route path="/team" element={
            <AuthenticatedLayout>
              <TeamPage />
            </AuthenticatedLayout>
          } />
          <Route path="/documents" element={
            <AuthenticatedLayout>
              <DocumentsPage />
            </AuthenticatedLayout>
          } />
          
          {/* Project selection route */}
          <Route path="/projects" element={
            <ProjectDashboard
              currentUser={currentUser}
              onProjectSelect={handleProjectSelect}
              onLogout={handleLogout}
            />
          } />
        </Routes>
        
        {/* Add project switcher in header */}
        <div className="fixed top-4 left-4 z-50">
          <button
            onClick={handleBackToProjects}
            className="bg-white shadow-lg rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 border"
          >
            ← Back to Projects
          </button>
        </div>
        
        <Toaster position="top-right" />
      </BrowserRouter>
    );
  }

  // Fallback
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-white flex items-center justify-center">
      <div className="text-center">
        <p className="text-gray-600">Something went wrong. Please refresh the page.</p>
      </div>
    </div>
  );
}

export default App; 