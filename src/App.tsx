import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { useLocation } from 'react-router-dom';
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

// Simplified app states - only 3 states instead of 7
type AppState = 
  | 'initializing'    // App is starting up and checking auth
  | 'unauthenticated' // User needs to login/signup or use demo
  | 'authenticated';  // User is logged in and using the app

interface AppData {
  user: User | null;
  project: Project | null;
  isDemoMode: boolean;
}

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

function LoadingScreen({ message = "Loading Gogram..." }: { message?: string }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-white flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 bg-primary-600 rounded-xl flex items-center justify-center mx-auto mb-4 animate-pulse">
          <div className="w-8 h-8 bg-white rounded" />
        </div>
        <p className="text-gray-600">{message}</p>
      </div>
    </div>
  );
}

function AppContent() {
  const navigate = useNavigate();
  const location = useLocation();
  const [appState, setAppState] = useState<AppState>('initializing');
  const [authMode, setAuthMode] = useState<AuthMode>('login');
  const [appData, setAppData] = useState<AppData>({
    user: null,
    project: null,
    isDemoMode: false
  });
  const [authError, setAuthError] = useState<string | null>(null);
  
  const { 
    initializeUserSession,
    initializeProjectData,
    subscribeToRealTimeUpdates,
    unsubscribeFromRealTimeUpdates,
    setCurrentUser
  } = useAppStore();

  // Initialize app on mount
  useEffect(() => {
    initializeApp();
  }, []);

  // Handle auth state changes for real users only
  useEffect(() => {
    if (appData.isDemoMode) return;
    
    let mounted = true;
    let authTimeout: NodeJS.Timeout;
    
    const { data: { subscription } } = authService.onAuthStateChange(async (user) => {
      if (!mounted) return;
      
      // Clear any pending auth updates
      if (authTimeout) clearTimeout(authTimeout);
      
      // Debounce auth state changes to prevent flipping
      authTimeout = setTimeout(async () => {
        if (user) {
          console.log('Auth state changed: user logged in', user.email);
          setAppData(prev => ({ ...prev, user }));
          
          // If we don't have a project selected, stay authenticated but show project selection
          if (!appData.project) {
            setAppState('authenticated');
          } else {
            // If we have both user and project, initialize data
            await initializeWithProject(user, appData.project);
          }
        } else {
          console.log('Auth state changed: user logged out');
          handleSignOut();
        }
      }, 100); // 100ms debounce
    });

    return () => {
      mounted = false;
      if (authTimeout) clearTimeout(authTimeout);
      subscription.unsubscribe();
    };
  }, [appData.isDemoMode, appData.project]);

  const initializeApp = async () => {
    try {
      console.log('Initializing app...');
      setAuthError(null);
      
      // Check for existing session
      const user = await authService.getCurrentUser();
      
      if (user) {
        console.log('Found existing session for:', user.email);
        setAppData(prev => ({ ...prev, user }));
        setAppState('authenticated');
      } else {
        console.log('No existing session found');
        setAppState('unauthenticated');
      }
    } catch (error) {
      console.error('App initialization error:', error);
      setAuthError('Failed to initialize app. Please refresh the page.');
      setAppState('unauthenticated');
    }
  };

  const initializeWithProject = async (user: User, project: Project) => {
    try {
      console.log('Initializing with project:', project.name);
      
      // Set in store
      setCurrentUser(user);
      
      // Initialize project data
      await initializeUserSession();
      await initializeProjectData(project.id);
      
      // Subscribe to real-time updates
      subscribeToRealTimeUpdates(project.id);
      
      console.log('Project initialization complete');
    } catch (error) {
      console.error('Project initialization error:', error);
      setAuthError('Failed to load project data. Please try again.');
    }
  };

  const handleSignOut = () => {
    console.log('Signing out...');
    
    // Clean up
    unsubscribeFromRealTimeUpdates();
    setCurrentUser(null);
    
    // Reset state
    setAppData({
      user: null,
      project: null,
      isDemoMode: false
    });
    setAuthError(null);
    setAppState('unauthenticated');
  };

  const handleAuthSuccess = () => {
    console.log('Authentication successful');
    setAuthError(null);
    // Don't change state here - let the auth state change listener handle it
  };

  const handleProjectSelect = async (project: Project) => {
    console.log('Project selected:', project.name);
    
    if (!appData.user) {
      setAuthError('No user found. Please sign in again.');
      return;
    }

    setAppData(prev => ({ ...prev, project }));
    
    // Initialize data for this project
    await initializeWithProject(appData.user, project);
  };

  const handleBackToProjects = () => {
    if (appData.isDemoMode) {
      handleExitDemo();
    } else {
      // Just clear the project, keep user
      setAppData(prev => ({ ...prev, project: null }));
      unsubscribeFromRealTimeUpdates();
    }
  };

  const handleStartDemo = () => {
    console.log('Starting demo mode');
    navigate('/demo');
  };

  const handleDemoLogin = async (demoUser: User) => {
    try {
      console.log('Demo login initiated for user:', demoUser.email);
      
      // Set demo state
      setAppData({
        user: demoUser,
        project: null, // Will be set when demo data loads
        isDemoMode: true
      });
      
      // Load demo data
      const mockData = await import('./utils/mockData');
      const { mockProject, mockTasks, mockDeliveries, mockSuppliers, mockTaskChangeProposals } = mockData;
      
      // Set demo project
      setAppData(prev => ({ ...prev, project: mockProject }));
      
      // Set in store
      setCurrentUser(demoUser);
      useAppStore.setState({
        currentProject: mockProject,
        tasks: mockTasks,
        deliveries: mockDeliveries, 
        suppliers: mockSuppliers,
        taskChangeProposals: mockTaskChangeProposals || [],
        qaAlerts: [],
      });
      
      // Generate QA alerts
      setTimeout(async () => {
        try {
          const qaModule = await import('./services/qaService');
          const qaAlerts = qaModule.default.generateQAAlerts(mockTasks);
          useAppStore.setState({ qaAlerts });
          console.log('QA alerts generated:', qaAlerts.length);
        } catch (error) {
          console.error('Failed to generate QA alerts:', error);
        }
      }, 100);
      
      setAppState('authenticated');
      console.log('Demo mode activated');
      
    } catch (error) {
      console.error('Failed to load demo data:', error);
      setAuthError('Failed to load demo. Please try again.');
    }
  };

  const handleExitDemo = () => {
    console.log('Exiting demo mode');
    handleSignOut();
  };

  const handleGetStarted = () => {
    // Don't navigate to auth if already authenticated
    if (appState !== 'unauthenticated') {
      console.log('Already authenticated, ignoring handleGetStarted');
      return;
    }
    setAuthMode('signup');
    navigate('/auth');
  };

  const handleCreateAccount = () => {
    // Don't navigate to auth if already authenticated
    if (appState !== 'unauthenticated') {
      console.log('Already authenticated, ignoring handleCreateAccount');
      return;
    }
    setAuthMode('signup');
    navigate('/auth');
  };

  // Render based on app state
  if (appState === 'initializing') {
    return <LoadingScreen message="Initializing Gogram..." />;
  }

  // Show error if auth failed
  if (authError && appState === 'unauthenticated') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-white flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="w-16 h-16 bg-red-600 rounded-xl flex items-center justify-center mx-auto mb-4">
            <div className="w-8 h-8 bg-white rounded" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Something went wrong</h2>
          <p className="text-gray-600 mb-4">{authError}</p>
          <button
            onClick={() => {
              setAuthError(null);
              initializeApp();
            }}
            className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <Routes>
        {/* Public routes - always accessible */}
        <Route path="/confirm-delivery/:deliveryId" element={<SupplierConfirmationPage />} />
        <Route path="/public/project/:shareToken" element={<PublicProjectPage />} />
        
        {/* Demo route - always accessible */}
        <Route path="/demo" element={
          <LoginScreen 
            onLogin={handleDemoLogin} 
            onBack={() => navigate('/')}
            isDemo={true}
          />
        } />

        {/* Auth route - accessible from any state but with guards */}
        <Route path="/auth" element={
          appState === 'authenticated' ? (
            (() => {
              console.log('Redirecting from /auth - user already authenticated');
              return <Navigate to="/" replace />;
            })()
          ) : (
            <>
              {authMode === 'login' && (
                <LoginForm
                  onSuccess={handleAuthSuccess}
                  onSwitchToSignup={() => setAuthMode('signup')}
                  onForgotPassword={() => setAuthMode('forgot-password')}
                />
              )}
              {authMode === 'signup' && (
                <SignupForm
                  onSuccess={handleAuthSuccess}
                  onSwitchToLogin={() => setAuthMode('login')}
                />
              )}
            </>
          )
        } />

        {/* Unauthenticated routes */}
        {appState === 'unauthenticated' && (
          <>
            <Route path="/" element={<LandingPage onGetStarted={handleGetStarted} onStartDemo={handleStartDemo} onCreateAccount={handleCreateAccount} />} />
            
            <Route path="*" element={<Navigate to="/" replace />} />
          </>
        )}

        {/* Authenticated routes */}
        {appState === 'authenticated' && (
          <>
            {/* Project selection - no project selected yet */}
            {appData.user && !appData.project && !appData.isDemoMode && (
              <Route path="*" element={
                <ProjectDashboard
                  currentUser={appData.user}
                  onProjectSelect={handleProjectSelect}
                  onLogout={handleSignOut}
                />
              } />
            )}

            {/* Main app - user and project both selected */}
            {appData.user && appData.project && (
              <>
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
                
                {/* Back to projects route */}
                <Route path="/projects" element={
                  <ProjectDashboard
                    currentUser={appData.user}
                    onProjectSelect={handleProjectSelect}
                    onLogout={handleSignOut}
                  />
                } />
              </>
            )}
          </>
        )}
      </Routes>

      {/* Demo mode indicator */}
      {appData.isDemoMode && appState === 'authenticated' && (
        <div className="fixed top-4 left-4 z-50 flex items-center space-x-2">
          <div className="bg-orange-500 text-white px-3 py-1 rounded-full text-xs font-medium">
            DEMO MODE
          </div>
          <button
            onClick={handleExitDemo}
            className="bg-white shadow-lg rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 border"
          >
            ← Exit Demo
          </button>
        </div>
      )}

      {/* Project switcher for real users */}
      {!appData.isDemoMode && appState === 'authenticated' && appData.project && (
        <div className="fixed top-4 left-4 z-50">
          <button
            onClick={handleBackToProjects}
            className="bg-white shadow-lg rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 border"
          >
            ← Back to Projects
          </button>
        </div>
      )}
    </>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppContent />
      <Toaster position="top-right" />
    </BrowserRouter>
  );
}

export default App; 