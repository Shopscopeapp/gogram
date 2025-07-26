import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import toast from 'react-hot-toast';
import procurementService from '../services/procurementService';
import qaService from '../services/qaService';
import { SupabaseService } from '../lib/supabase';
import type { 
  User, 
  Project, 
  Task, 
  TaskChangeProposal, 
  TaskDelay, 
  Supplier, 
  Delivery, 
  Notification,
  UserRole,
  DashboardStats,
  QAAlert
} from '../types';

interface AppState {
  // User Management
  currentUser: User | null;
  users: User[];
  
  // Project Management
  currentProject: Project | null;
  projects: Project[];
  
  // Task Management
  tasks: Task[];
  taskChangeProposals: TaskChangeProposal[];
  taskDelays: TaskDelay[];
  
  // Supplier & Delivery Management
  suppliers: Supplier[];
  deliveries: Delivery[];
  
  // QA Management
  qaAlerts: QAAlert[];
  
  // Notifications
  notifications: Notification[];
  unreadCount: number;
  
  // UI State
  sidebarOpen: boolean;
  loading: boolean;
  error: string | null;
  
  // Real-time subscription
  realtimeChannel: any; // Supabase channel type
  
  // Dashboard
  dashboardStats: DashboardStats;
}

interface AppActions {
  // User Actions
  setCurrentUser: (user: User | null) => void;
  addUser: (user: User) => void;
  updateUser: (id: string, updates: Partial<User>) => void;
  removeUser: (id: string) => void;
  
  // Project Actions
  setCurrentProject: (project: Project | null) => void;
  addProject: (project: Project) => void;
  updateProject: (id: string, updates: Partial<Project>) => void;
  removeProject: (id: string) => void;
  
  // Task Actions
  addTask: (task: Task) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  removeTask: (id: string) => void;
  moveTask: (id: string, newStartDate: Date, newEndDate: Date) => void;
  updateTaskDependencies: (taskId: string, dependentTaskIds: string[]) => void;
  
  // Task Change Proposals
  addTaskChangeProposal: (proposal: TaskChangeProposal) => void;
  approveTaskChangeProposal: (id: string, reviewComments?: string) => void;
  rejectTaskChangeProposal: (id: string, reviewComments?: string) => void;
  
  // Task Delays
  addTaskDelay: (delay: TaskDelay) => void;
  getTaskDelays: (taskId: string) => TaskDelay[];
  
  // Supplier Actions
  addSupplier: (supplier: Supplier) => void;
  updateSupplier: (id: string, updates: Partial<Supplier>) => void;
  removeSupplier: (id: string) => void;
  
  // Delivery Actions
  addDelivery: (delivery: Delivery) => void;
  updateDelivery: (id: string, updates: Partial<Delivery>) => void;
  confirmDelivery: (id: string, confirmed: boolean, newDate?: Date) => void;
  
  // QA Actions
  generateQAAlerts: () => void;
  updateQAAlertStatus: (alertId: string, status: QAAlert['status']) => void;
  completeQAChecklistItem: (alertId: string, itemId: string, notes?: string) => void;
  
  // Notification Actions
  addNotification: (notification: Notification) => void;
  markNotificationAsRead: (id: string) => void;
  markAllNotificationsAsRead: () => void;
  removeNotification: (id: string) => void;
  
  // UI Actions
  setSidebarOpen: (open: boolean) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  
  // Permission Helpers
  canUserPerformAction: (action: string, resource: string) => boolean;
  isProjectManager: () => boolean;
  isProjectCoordinator: () => boolean;
  isSubcontractor: () => boolean;
  
  // Dashboard Actions
  updateDashboardStats: () => void;
  
  // Database Integration Actions
  initializeUserSession: () => Promise<void>;
  initializeProjectData: (projectId: string) => Promise<void>;
  subscribeToRealTimeUpdates: (projectId: string) => void;
  unsubscribeFromRealTimeUpdates: () => void;
  
  // Authentication Actions
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, userData: { full_name: string; company?: string; phone?: string; role: string; }) => Promise<void>;
  signOut: () => Promise<void>;
  
  // Utility Actions
  generatePublicShareLink: (projectId: string) => string;
  exportDelayRegister: (format: 'pdf' | 'excel') => void;
}

type AppStore = AppState & AppActions;

const initialStats: DashboardStats = {
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
    completed: 0
  }
};

export const useAppStore = create<AppStore>()(
  devtools(
    (set, get) => ({
      // Initial State
      currentUser: null,
      users: [],
      currentProject: null,
      projects: [],
      tasks: [],
      taskChangeProposals: [],
      taskDelays: [],
      suppliers: [],
      deliveries: [],
      qaAlerts: [],
      notifications: [],
      unreadCount: 0,
      sidebarOpen: true,
      loading: false,
      error: null,
      realtimeChannel: null,
      dashboardStats: initialStats,

      // User Actions
      setCurrentUser: (user) => set({ currentUser: user }),
      
      addUser: (user) => set((state) => ({ 
        users: [...state.users, user] 
      })),
      
      updateUser: (id, updates) => set((state) => ({
        users: state.users.map(user => 
          user.id === id ? { ...user, ...updates } : user
        ),
        currentUser: state.currentUser?.id === id 
          ? { ...state.currentUser, ...updates } 
          : state.currentUser
      })),
      
      removeUser: (id) => set((state) => ({
        users: state.users.filter(user => user.id !== id)
      })),

      // Project Actions
      setCurrentProject: (project) => set({ currentProject: project }),
      
      addProject: (project) => set((state) => ({ 
        projects: [...state.projects, project] 
      })),
      
      updateProject: (id, updates) => set((state) => ({
        projects: state.projects.map(project => 
          project.id === id ? { ...project, ...updates } : project
        ),
        currentProject: state.currentProject?.id === id 
          ? { ...state.currentProject, ...updates } 
          : state.currentProject
      })),
      
      removeProject: (id) => set((state) => ({
        projects: state.projects.filter(project => project.id !== id)
      })),

      // Task Actions
      addTask: (task) => {
        set((state) => ({ 
          tasks: [...state.tasks, task] 
        }));
        
        // Generate QA alerts for new task
        setTimeout(() => get().generateQAAlerts(), 100);
      },
      
      updateTask: (id, updates) => {
        set((state) => ({
          tasks: state.tasks.map(task => 
            task.id === id ? { ...task, ...updates, updatedAt: new Date() } : task
          )
        }));

        // Regenerate QA alerts if task dates or status changed
        if (updates.start_date || updates.end_date || updates.status) {
          setTimeout(() => get().generateQAAlerts(), 100);
        }
      },
      
      removeTask: (id) => set((state) => ({
        tasks: state.tasks.filter(task => task.id !== id),
        qaAlerts: state.qaAlerts.filter(alert => alert.task_id !== id)
      })),
      
      moveTask: async (id, newStartDate, newEndDate) => {
        const { tasks, deliveries, suppliers, currentProject } = get();
        const task = tasks.find(t => t.id === id);
        if (!task || !currentProject) return;

        // Show loading toast
        const loadingToast = toast.loading('Updating task schedule...');

        try {
          // Check if task has linked deliveries
          const hasLinkedDeliveries = procurementService.hasLinkedDeliveries(id, deliveries);
          
          // Update the task first
          set((state) => ({
            tasks: state.tasks.map(t => {
              if (t.id === id) {
                return { ...t, startDate: newStartDate, endDate: newEndDate, updatedAt: new Date() };
              }
              
              // Update dependent tasks
              if (t.dependencies.includes(id)) {
                const timeDiff = newEndDate.getTime() - task.end_date.getTime();
                const newTaskStart = new Date(t.start_date.getTime() + timeDiff);
                const newTaskEnd = new Date(t.end_date.getTime() + timeDiff);
                return { ...t, startDate: newTaskStart, endDate: newTaskEnd, updatedAt: new Date() };
              }
              
              return t;
            })
          }));

          // Regenerate QA alerts for task date changes
          get().generateQAAlerts();

          // Process procurement notifications if needed
          if (hasLinkedDeliveries) {
            const result = await procurementService.processTaskDateChange(
              task,
              newStartDate,
              newEndDate,
              deliveries,
              suppliers,
              currentProject.name
            );

            if (result.notificationsSent > 0) {
              toast.success(
                `Task updated! ${result.notificationsSent} supplier notification${result.notificationsSent > 1 ? 's' : ''} sent.`,
                { id: loadingToast }
              );

              // Add notification to the system
              get().addNotification({
                id: `task-move-${id}-${Date.now()}`,
                user_id: get().currentUser?.id || '',
                type: 'task_update',
                title: 'Task Rescheduled',
                message: `${task.title} moved to ${newStartDate.toLocaleDateString()}. Suppliers notified.`,
                data: { taskId: id, notificationsSent: result.notificationsSent },
                read: false,
                                  created_at: new Date()
              });
            } else {
              toast.success('Task schedule updated successfully!', { id: loadingToast });
            }

            if (result.errors.length > 0) {
              console.warn('Supplier notification errors:', result.errors);
              toast.error('Some supplier notifications failed. Check console for details.');
            }
          } else {
            toast.success('Task schedule updated successfully!', { id: loadingToast });
          }

        } catch (error) {
          console.error('Error updating task:', error);
          toast.error('Failed to update task schedule', { id: loadingToast });
        }
      },
      
      updateTaskDependencies: (taskId, dependentTaskIds) => set((state) => ({
        tasks: state.tasks.map(task => 
          dependentTaskIds.includes(task.id) 
            ? { ...task, dependencies: [...task.dependencies, taskId] }
            : task
        )
      })),

      // Task Change Proposals
      addTaskChangeProposal: (proposal) => set((state) => ({ 
        taskChangeProposals: [...state.taskChangeProposals, proposal] 
      })),
      
      approveTaskChangeProposal: (id, reviewComments) => {
        const { taskChangeProposals, currentUser } = get();
        const proposal = taskChangeProposals.find(p => p.id === id);
        if (!proposal || !currentUser) return;

        set((state) => ({
          taskChangeProposals: state.taskChangeProposals.map(p =>
            p.id === id
              ? {
                  ...p,
                  status: 'approved' as const,
                  reviewedBy: currentUser.id,
                  reviewedAt: new Date(),
                  reviewComments,
                }
              : p
          )
        }));

        // Apply the changes to the actual task
                if (proposal.proposed_start_date || proposal.proposed_end_date) {
          const task = get().tasks.find(t => t.id === proposal.task_id);
          if (task) {
            get().moveTask(
              proposal.task_id,
              proposal.proposed_start_date || task.start_date,
              proposal.proposed_end_date || task.end_date
            );
          }
        }

        toast.success('Change proposal approved and applied!');
      },
      
      rejectTaskChangeProposal: (id, reviewComments) => {
        const { currentUser } = get();
        if (!currentUser) return;

        set((state) => ({
          taskChangeProposals: state.taskChangeProposals.map(p =>
            p.id === id
              ? {
                  ...p,
                  status: 'rejected' as const,
                  reviewedBy: currentUser.id,
                  reviewedAt: new Date(),
                  reviewComments,
                }
              : p
          )
        }));

        toast.error('Change proposal rejected');
      },

      // Task Delays
      addTaskDelay: (delay) => set((state) => ({ 
        taskDelays: [...state.taskDelays, delay] 
      })),
      
      getTaskDelays: (taskId) => {
        const { taskDelays } = get();
        return taskDelays.filter(delay => delay.task_id === taskId);
      },

      // Supplier Actions
      addSupplier: (supplier) => set((state) => ({ 
        suppliers: [...state.suppliers, supplier] 
      })),
      
      updateSupplier: (id, updates) => set((state) => ({
        suppliers: state.suppliers.map(supplier => 
          supplier.id === id ? { ...supplier, ...updates } : supplier
        )
      })),
      
      removeSupplier: (id) => set((state) => ({
        suppliers: state.suppliers.filter(supplier => supplier.id !== id)
      })),

      // Delivery Actions
      addDelivery: (delivery) => set((state) => ({ 
        deliveries: [...state.deliveries, delivery] 
      })),
      
      updateDelivery: (id, updates) => set((state) => ({
        deliveries: state.deliveries.map(delivery => 
          delivery.id === id ? { ...delivery, ...updates } : delivery
        )
      })),
      
      confirmDelivery: (id, confirmed, newDate) => {
        set((state) => ({
          deliveries: state.deliveries.map(delivery => 
            delivery.id === id 
              ? { 
                  ...delivery, 
                  confirmationStatus: confirmed ? 'confirmed' : 'rejected',
                  planned_date: newDate || delivery.planned_date 
                }
              : delivery
          )
        }));

        const statusText = confirmed ? 'confirmed' : 'rejected';
        toast.success(`Delivery ${statusText} successfully!`);
      },

      // QA Actions
      generateQAAlerts: () => {
        const { tasks, qaAlerts, users } = get();
        
        // Generate new QA alerts
        const newAlerts = qaService.generateQAAlerts(tasks, qaAlerts);
        
        if (newAlerts.length > 0) {
          set((state) => ({
            qaAlerts: [...state.qaAlerts, ...newAlerts]
          }));

          // Create notifications for project coordinators
          const projectCoordinators = users.filter(user => user.role === 'project_coordinator');
          const qaNotifications = qaService.createQANotifications(newAlerts, tasks, projectCoordinators);
          
          // Add notifications to the system
          qaNotifications.forEach(notification => {
            get().addNotification(notification);
          });

          if (qaNotifications.length > 0) {
            toast(`🔍 ${newAlerts.length} new QA alert${newAlerts.length > 1 ? 's' : ''} generated`, {
              duration: 5000,
              style: {
                background: '#3b82f6',
                color: '#fff',
              },
            });
          }
        }
      },

      updateQAAlertStatus: (alertId, status) => {
        const { qaAlerts } = get();
        const updatedAlerts = qaService.updateQAAlertStatus(alertId, status, qaAlerts);
        
        set({ qaAlerts: updatedAlerts });
        
        if (status === 'completed') {
          toast.success('QA checklist completed successfully!');
        }
      },

      completeQAChecklistItem: (alertId, itemId, notes) => {
        const { qaAlerts, currentUser } = get();
        if (!currentUser) return;

        const updatedAlerts = qaService.completeChecklistItem(
          alertId, 
          itemId, 
          currentUser.id, 
          notes, 
          qaAlerts
        );
        
        set({ qaAlerts: updatedAlerts });
        toast.success('Checklist item completed');
      },

      // Notification Actions
      addNotification: (notification) => set((state) => ({ 
        notifications: [...state.notifications, notification],
        unreadCount: state.unreadCount + 1
      })),
      
      markNotificationAsRead: (id) => set((state) => ({
        notifications: state.notifications.map(notification => 
          notification.id === id ? { ...notification, read: true } : notification
        ),
        unreadCount: Math.max(0, state.unreadCount - 1)
      })),
      
      markAllNotificationsAsRead: () => set((state) => ({
        notifications: state.notifications.map(notification => ({ ...notification, read: true })),
        unreadCount: 0
      })),
      
      removeNotification: (id) => set((state) => ({
        notifications: state.notifications.filter(notification => notification.id !== id)
      })),

      // UI Actions
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      setLoading: (loading) => set({ loading }),
      setError: (error) => set({ error }),

      // Permission Helpers
      canUserPerformAction: (action, resource) => {
        const { currentUser } = get();
        if (!currentUser) return false;
        
        // Simple role-based permissions for now
        const rolePermissions: Record<UserRole, string[]> = {
          project_manager: ['*'], // Can do everything
          project_coordinator: ['read', 'propose_changes', 'manage_qa'],
          subcontractor: ['read', 'propose_changes', 'confirm_deliveries'],
          supplier: ['read', 'confirm_deliveries'],
          viewer: ['read']
        };
        
        const userPermissions = rolePermissions[currentUser.role] || [];
        return userPermissions.includes('*') || userPermissions.includes(action);
      },
      
      isProjectManager: () => {
        const { currentUser } = get();
        return currentUser?.role === 'project_manager';
      },
      
      isProjectCoordinator: () => {
        const { currentUser } = get();
        return currentUser?.role === 'project_coordinator';
      },
      
      isSubcontractor: () => {
        const { currentUser } = get();
        return currentUser?.role === 'subcontractor';
      },

      // Dashboard Actions
      updateDashboardStats: () => {
        const { tasks, taskChangeProposals, deliveries, qaAlerts } = get();
        const now = new Date();
        
        const qaAlertSummary = qaService.getQAAlertSummary(qaAlerts);
        
        const stats: DashboardStats = {
          totalTasks: tasks.length,
          completedTasks: tasks.filter(t => t.status === 'completed').length,
          delayedTasks: tasks.filter(t => t.status === 'delayed').length,
          upcomingDeadlines: tasks.filter(t => {
            const daysUntilDeadline = Math.ceil((t.end_date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
            return daysUntilDeadline <= 7 && daysUntilDeadline > 0;
          }).length,
          pendingApprovals: taskChangeProposals.filter(p => p.status === 'pending').length,
          activeDeliveries: deliveries.filter(d => d.confirmation_status === 'pending' || d.confirmation_status === 'confirmed').length,
          qaAlerts: {
            total: qaAlerts.length,
            pending: qaAlerts.filter(qa => qa.status === 'pending').length,
            overdue: qaAlerts.filter(qa => qa.status === 'overdue').length,
            completed: qaAlerts.filter(qa => qa.status === 'completed').length
          }
        };
        
        set({ dashboardStats: stats });
      },

      // Utility Actions
      generatePublicShareLink: (projectId) => {
        const baseUrl = window.location.origin;
        const shareToken = btoa(projectId + Date.now().toString());
        return `${baseUrl}/public/${shareToken}`;
      },
      
              exportDelayRegister: (format) => {
          const { taskDelays, tasks } = get();
        // Implementation would depend on chosen export library
        console.log(`Exporting delay register in ${format} format`, { taskDelays, tasks });
      },

      // Database Integration Methods
      initializeUserSession: async () => {
        try {
          set({ loading: true, error: null });
          const currentUser = await SupabaseService.getCurrentUser();
          set({ currentUser, loading: false });
        } catch (error) {
          console.error('Error initializing user session:', error);
          set({ error: 'Failed to initialize user session', loading: false });
        }
      },

      initializeProjectData: async (projectId) => {
        try {
          set({ loading: true, error: null });
          
          // Fetch all project data in parallel
          const [
            projectData,
            tasksData,
            deliveriesData,
            taskChangeProposalsData,
            qaAlertsData,
            suppliersData
          ] = await Promise.all([
            SupabaseService.getProjectWithMembers(projectId),
            SupabaseService.getProjectTasks(projectId),
            SupabaseService.getProjectDeliveries(projectId),
            SupabaseService.getTaskChangeProposals(projectId),
            SupabaseService.getProjectQAAlerts(projectId),
            SupabaseService.getSuppliers()
          ]);

          // Update store with fetched data
          if (projectData) {
            set({ currentProject: projectData });
          }
          
          if (tasksData) {
            set({ tasks: tasksData });
          }
          
          if (deliveriesData) {
            set({ deliveries: deliveriesData });
          }
          
          if (taskChangeProposalsData) {
            set({ taskChangeProposals: taskChangeProposalsData });
          }
          
          if (qaAlertsData) {
            set({ qaAlerts: qaAlertsData });
          }
          
          if (suppliersData) {
            set({ suppliers: suppliersData });
          }

          // Update dashboard stats after loading data
          get().updateDashboardStats();
          
          set({ loading: false });
        } catch (error) {
          console.error('Error initializing project data:', error);
          set({ error: 'Failed to load project data', loading: false });
        }
      },

      subscribeToRealTimeUpdates: (projectId) => {
        const channel = SupabaseService.subscribeToProjectUpdates(projectId, (payload) => {
          console.log('Real-time update received:', payload);
          
          // Handle different types of updates
          const { eventType, new: newRecord, old: oldRecord } = payload;
          
          switch (payload.table) {
            case 'tasks':
              if (eventType === 'INSERT') {
                get().addTask(newRecord);
              } else if (eventType === 'UPDATE') {
                get().updateTask(newRecord.id, newRecord);
              } else if (eventType === 'DELETE') {
                get().removeTask(oldRecord.id);
              }
              break;
              
            case 'deliveries':
              if (eventType === 'INSERT') {
                get().addDelivery(newRecord);
              } else if (eventType === 'UPDATE') {
                get().updateDelivery(newRecord.id, newRecord);
              }
              break;
              
            case 'task_change_proposals':
              if (eventType === 'INSERT') {
                get().addTaskChangeProposal(newRecord);
              }
              break;
          }
          
          // Update dashboard stats after any change
          get().updateDashboardStats();
        });
        
        // Store the channel reference for cleanup
        set({ realtimeChannel: channel });
      },

      unsubscribeFromRealTimeUpdates: () => {
        const { realtimeChannel } = get();
        if (realtimeChannel) {
          realtimeChannel.unsubscribe();
          set({ realtimeChannel: null });
        }
      },

      // Authentication Methods
      signIn: async (email, password) => {
        try {
          set({ loading: true, error: null });
          const result = await SupabaseService.signInWithEmail(email, password);
          
          if (result.user) {
            await get().initializeUserSession();
            toast.success('Successfully signed in!');
          }
        } catch (error: any) {
          console.error('Sign in error:', error);
          set({ error: error.message || 'Failed to sign in', loading: false });
          toast.error(error.message || 'Failed to sign in');
        }
      },

      signUp: async (email, password, userData) => {
        try {
          set({ loading: true, error: null });
          const result = await SupabaseService.signUp(email, password, userData);
          
          if (result.user) {
            toast.success('Account created successfully! Please check your email to verify your account.');
          }
          
          set({ loading: false });
        } catch (error: any) {
          console.error('Sign up error:', error);
          set({ error: error.message || 'Failed to create account', loading: false });
          toast.error(error.message || 'Failed to create account');
        }
      },

      signOut: async () => {
        try {
          set({ loading: true, error: null });
          await SupabaseService.signOut();
          
          // Clear all user data
          set({
            currentUser: null,
            currentProject: null,
            tasks: [],
            deliveries: [],
            taskChangeProposals: [],
            qaAlerts: [],
            suppliers: [],
            notifications: [],
            unreadCount: 0,
            loading: false
          });
          
          // Unsubscribe from real-time updates
          get().unsubscribeFromRealTimeUpdates();
          
          toast.success('Successfully signed out!');
        } catch (error: any) {
          console.error('Sign out error:', error);
          set({ error: error.message || 'Failed to sign out', loading: false });
          toast.error(error.message || 'Failed to sign out');
        }
      },
    }),
    {
      name: 'gogram-store',
    }
  )
); 