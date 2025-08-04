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
import SupplierConfirmationPage from './components/pages/SupplierConfirmationPage';
import SupplierResponsePage from './components/pages/SupplierResponsePage';
import PublicProjectPage from './components/pages/PublicProjectPage';
import LandingPage from './components/landing/LandingPage';
import InvitePage from './components/pages/InvitePage';
import AccountSettingsPage from './components/pages/AccountSettingsPage';

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
  const { currentUser } = useAppStore();
  
  console.log('AuthenticatedLayout render:', { currentUser: !!currentUser });
  
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
        
        // Check for persisted project state
        const persistedProjectData = localStorage.getItem('buildflow_current_project');
        let persistedProject = null;
        
        if (persistedProjectData) {
          try {
            persistedProject = JSON.parse(persistedProjectData);
            console.log('Found persisted project:', persistedProject.name);
          } catch (e) {
            console.warn('Failed to parse persisted project data:', e);
            localStorage.removeItem('buildflow_current_project');
          }
        }
        
        setAppData(prev => ({ 
          ...prev, 
          user,
          project: persistedProject 
        }));
        setAppState('authenticated');
        
        // If we have a persisted project, initialize with it
        if (persistedProject) {
          await initializeWithProject(user, persistedProject);
        }
      } else {
        console.log('No existing session found');
        // Clear any persisted project data if no user session
        localStorage.removeItem('buildflow_current_project');
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
      
      // Clear any existing demo data first
      useAppStore.setState({
        currentUser: null,
        currentProject: null,
        projects: [],
        tasks: [],
        taskChangeProposals: [],
        taskDelays: [],
        suppliers: [],
        deliveries: [],
        deliveryResponses: [],
        qaAlerts: [],
        users: [],
        notifications: [],
        unreadCount: 0,
        dashboardStats: {
          totalTasks: 0,
          completedTasks: 0,
          delayedTasks: 0,
          upcomingDeadlines: 0,
          pendingApprovals: 0,
          activeDeliveries: 0,
          qaAlerts: {
            total: 0,
            pending: 0,
            overdue: 0,
            completed: 0,
          }
        },
        sidebarOpen: true,
        loading: false,
        error: null,
        realtimeChannel: null
      });
      
      // Set in store
      setCurrentUser(user);
      console.log('CurrentUser set in store, checking store state:', useAppStore.getState().currentUser);
      
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
    
    // Clear persisted project data
    localStorage.removeItem('buildflow_current_project');
    
    // Clean up
    unsubscribeFromRealTimeUpdates();
    setCurrentUser(null);
    
    // Clear all data from store
    useAppStore.setState({
      currentUser: null,
      currentProject: null,
      projects: [],
      tasks: [],
      taskChangeProposals: [],
      taskDelays: [],
      suppliers: [],
      deliveries: [],
      deliveryResponses: [],
      qaAlerts: [],
      users: [],
      notifications: [],
      unreadCount: 0,
      dashboardStats: {
        totalTasks: 0,
        completedTasks: 0,
        delayedTasks: 0,
        upcomingDeadlines: 0,
        pendingApprovals: 0,
        activeDeliveries: 0,
        qaAlerts: {
          total: 0,
          pending: 0,
          overdue: 0,
          completed: 0,
        }
      },
      sidebarOpen: false,
      loading: false,
      error: null,
      realtimeChannel: null
    });
    
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

    // Persist project selection to localStorage
    localStorage.setItem('buildflow_current_project', JSON.stringify(project));

    setAppData(prev => ({ ...prev, project }));
    
    // Initialize data for this project
    await initializeWithProject(appData.user, project);
  };

  const handleBackToProjects = () => {
    if (appData.isDemoMode) {
      handleExitDemo();
    } else {
      // Clear persisted project when going back to project selection
      localStorage.removeItem('buildflow_current_project');
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
      
      // Load demo data synchronously
      const mockData = await import('./utils/mockData');
      const { mockProject, mockTasks, mockDeliveries, mockSuppliers, mockTaskChangeProposals } = mockData;
      
      // Create hardcoded QA alerts for demo
      const demoQAAlerts = [
        {
          id: 'qa_demo_1',
          project_id: mockProject.id,
          task_id: '3',
          type: 'itp_required' as const,
          status: 'pending' as const,
          title: 'ITP Required - Concrete Pour',
          description: 'Inspection and Test Plan must be submitted and approved before concrete pour',
          due_date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
          assigned_to: '3',
          checklist: [
            { id: 'item_1', text: 'ITP form completed and submitted', required: true, completed: false },
            { id: 'item_2', text: 'Engineer approval received', required: true, completed: false },
            { id: 'item_3', text: 'Concrete mix design approved', required: true, completed: false },
            { id: 'item_4', text: 'Formwork inspection passed', required: true, completed: false },
            { id: 'item_5', text: 'Reinforcement inspection passed', required: true, completed: false }
          ],
          priority: 'high' as const,
          created_at: new Date(),
          updated_at: new Date()
        },
        {
          id: 'qa_demo_2',
          project_id: mockProject.id,
          task_id: '3',
          type: 'pre_pour_checklist' as const,
          status: 'overdue' as const,
          title: 'Pre-Pour Checklist - Final Verification',
          description: 'Critical pre-pour checklist must be completed before concrete delivery',
          due_date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago (overdue)
          assigned_to: '3',
          checklist: [
            { id: 'item_6', text: 'Weather forecast acceptable (no rain expected)', required: true, completed: false },
            { id: 'item_7', text: 'Concrete pump/equipment on site and tested', required: true, completed: false },
            { id: 'item_8', text: 'Site access clear for concrete trucks', required: true, completed: false },
            { id: 'item_9', text: 'Formwork final inspection completed', required: true, completed: false },
            { id: 'item_10', text: 'All embedments and services in place', required: true, completed: false }
          ],
          priority: 'critical' as const,
          created_at: new Date(),
          updated_at: new Date()
        },
        {
          id: 'qa_demo_3',
          project_id: mockProject.id,
          task_id: '2',
          type: 'engineer_inspection' as const,
          status: 'completed' as const,
          title: 'Foundation Quality Checkpoint',
          description: 'Foundation work requires quality checkpoint before backfill',
          due_date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
          assigned_to: '3',
          checklist: [
            { id: 'item_11', text: 'Foundation dimensions verified', required: true, completed: true },
            { id: 'item_12', text: 'Surface finish meets specifications', required: true, completed: true },
            { id: 'item_13', text: 'Waterproofing inspection completed', required: true, completed: true },
            { id: 'item_14', text: 'Documentation photos taken', required: true, completed: true }
          ],
          priority: 'high' as const,
          completed_by: '3',
          completed_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
          created_at: new Date(),
          updated_at: new Date()
        }
      ];
      
      // Set demo project
      setAppData(prev => ({ ...prev, project: mockProject }));
      
      // Set everything in store synchronously
      setCurrentUser(demoUser);
      useAppStore.setState({
        currentProject: mockProject,
        tasks: mockTasks,
        deliveries: mockDeliveries, 
        suppliers: mockSuppliers,
        taskChangeProposals: mockTaskChangeProposals || [],
        qaAlerts: demoQAAlerts, // Use hardcoded QA alerts
        users: mockData.mockUsers || [],
        notifications: [],
        unreadCount: 0,
        dashboardStats: {
          totalTasks: mockTasks.length,
          completedTasks: mockTasks.filter(t => t.status === 'completed').length,
          delayedTasks: mockTasks.filter(t => t.status === 'delayed').length,
          upcomingDeadlines: mockTasks.filter(t => t.status === 'pending').length,
          pendingApprovals: mockTaskChangeProposals?.filter(p => p.status === 'pending').length || 0,
          activeDeliveries: mockDeliveries.filter(d => d.confirmation_status === 'pending').length,
          qaAlerts: {
            total: demoQAAlerts.length,
            pending: demoQAAlerts.filter(a => a.status === 'pending').length,
            overdue: demoQAAlerts.filter(a => a.status === 'overdue').length,
            completed: demoQAAlerts.filter(a => a.status === 'completed').length,
          }
        }
      });
      
      setAppState('authenticated');
      console.log('Demo mode activated');
      
      // Navigate to dashboard after demo login
      navigate('/', { replace: true });
      
    } catch (error) {
      console.error('Failed to load demo data:', error);
      setAuthError('Failed to load demo. Please try again.');
    }
  };

  const handleExitDemo = () => {
    console.log('Exiting demo mode');
    
    // Clear all demo data from store
    useAppStore.setState({
      currentUser: null,
      currentProject: null,
      projects: [],
      tasks: [],
      taskChangeProposals: [],
      taskDelays: [],
      suppliers: [],
      deliveries: [],
      deliveryResponses: [],
      qaAlerts: [],
      users: [],
      notifications: [],
      unreadCount: 0,
      dashboardStats: {
        totalTasks: 0,
        completedTasks: 0,
        delayedTasks: 0,
        upcomingDeadlines: 0,
        pendingApprovals: 0,
        activeDeliveries: 0,
        qaAlerts: {
          total: 0,
          pending: 0,
          overdue: 0,
          completed: 0,
        }
      },
      sidebarOpen: false,
      loading: false,
      error: null,
      realtimeChannel: null
    });
    
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
        <Route path="/supplier-response" element={<SupplierResponsePage />} />
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

        {/* Invitation route - always accessible */}
        <Route path="/invite" element={<InvitePage />} />

        {/* Unauthenticated routes */}
        {appState === 'unauthenticated' && (
          <>
            <Route path="/" element={<LandingPage onGetStarted={handleGetStarted} onStartDemo={handleStartDemo} onCreateAccount={handleCreateAccount} />} />
            
            {/* Only redirect specific app routes, not all routes */}
            <Route path="/dashboard" element={<Navigate to="/auth" replace />} />
            <Route path="/tasks" element={<Navigate to="/auth" replace />} />
            <Route path="/schedule" element={<Navigate to="/auth" replace />} />
            <Route path="/team" element={<Navigate to="/auth" replace />} />
            <Route path="/suppliers" element={<Navigate to="/auth" replace />} />
            <Route path="/qa" element={<Navigate to="/auth" replace />} />
            <Route path="/approvals" element={<Navigate to="/auth" replace />} />
            <Route path="/reports" element={<Navigate to="/auth" replace />} />
            <Route path="/documents" element={<Navigate to="/auth" replace />} />
            <Route path="/share" element={<Navigate to="/auth" replace />} />
            <Route path="/account" element={<Navigate to="/auth" replace />} />
            <Route path="/projects" element={<Navigate to="/auth" replace />} />
            
            {/* Fallback for unknown routes - show a 404 instead of aggressive redirect */}
            <Route path="*" element={
              <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
                <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                  <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10 text-center">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">Page Not Found</h2>
                    <p className="text-gray-600 mb-6">The page you're looking for doesn't exist.</p>
                    <div className="space-y-3">
                      <button
                        onClick={() => navigate('/')}
                        className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        Go to Home
                      </button>
                      <button
                        onClick={() => navigate('/auth')}
                        className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        Sign In
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            } />
          </>
        )}

        {/* Authenticated routes */}
        {appState === 'authenticated' && (
          <>
            {/* Demo mode - user and project both selected */}
            {appData.isDemoMode && appData.user && appData.project && (
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
                <Route path="/account" element={
                  <AuthenticatedLayout>
                    <AccountSettingsPage />
                  </AuthenticatedLayout>
                } />
                <Route path="*" element={<Navigate to="/" replace />} />
              </>
            )}

            {/* Real user - project selection - no project selected yet */}
            {!appData.isDemoMode && appData.user && !appData.project && (
              <Route path="*" element={
                <ProjectDashboard
                  currentUser={appData.user}
                  onProjectSelect={handleProjectSelect}
                  onLogout={handleSignOut}
                />
              } />
            )}

            {/* Real user - main app - user and project both selected */}
            {!appData.isDemoMode && appData.user && appData.project && (
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
                <Route path="/account" element={
                  <AuthenticatedLayout>
                    <AccountSettingsPage />
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
        <div className="fixed top-4 left-72 z-50">
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