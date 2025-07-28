import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import toast from 'react-hot-toast';
import { addDays, format } from 'date-fns';
import procurementService from '../services/procurementService';
import qaService from '../services/qaService';
import taskService from '../services/taskService';
import supplierService from '../services/supplierService';
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
import emailService from '../services/emailService';

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
  initializeDemoData: () => void;
  
  // Authentication Actions
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, userData: { full_name: string; company?: string; phone?: string; role: string; }) => Promise<void>;
  signOut: () => Promise<void>;
  
  // Utility Actions
  generatePublicShareLink: (projectId: string) => string;
  exportDelayRegister: (format: 'pdf' | 'excel') => void;

  // Email Actions
  sendDeliveryConfirmation: (deliveryId: string, newDate: Date) => Promise<void>;
  testEmailConfiguration: (testEmail: string) => Promise<void>;
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

      // Sync methods for local state updates (still needed for some UI interactions)
      removeSupplier: (id) => set((state) => ({
        suppliers: state.suppliers.filter(supplier => supplier.id !== id)
      })),

      addDelivery: (delivery) => set((state) => ({ 
        deliveries: [...state.deliveries, delivery] 
      })),
      
      confirmDelivery: (id, confirmed, newDate) => {
        set((state) => ({
          deliveries: state.deliveries.map(delivery => 
            delivery.id === id 
              ? { 
                  ...delivery, 
                  confirmation_status: confirmed ? 'confirmed' : 'rejected' as any,
                  planned_date: newDate || delivery.planned_date 
                }
              : delivery
          )
        }));

        const statusText = confirmed ? 'confirmed' : 'rejected';
        toast.success(`Delivery ${statusText} successfully!`);
      },

      // Note: Async supplier and delivery actions are defined later in the file

      // Initialize QA alerts from database
      initializeQAAlerts: async () => {
        const { currentProject } = get();
        if (!currentProject) return;

        try {
          const result = await qaService.getProjectQAAlerts(currentProject.id);
          if (result.success) {
            set({ qaAlerts: result.alerts || [] });
          } else {
            console.error('Failed to load QA alerts:', result.error);
          }
        } catch (error) {
          console.error('Error initializing QA alerts:', error);
        }
      },

      // Generate new QA alerts for tasks
      generateQAAlerts: async () => {
        const { currentProject, tasks } = get();
        if (!currentProject) return;

        try {
          const result = await qaService.generateAndSaveQAAlerts(tasks, currentProject.id);
          if (result.success && result.alerts && result.alerts.length > 0) {
            set(state => ({
              qaAlerts: [...state.qaAlerts, ...result.alerts!]
            }));
            toast.success(`${result.alerts.length} new QA alert${result.alerts.length > 1 ? 's' : ''} created`);
          }
        } catch (error) {
          console.error('Error generating QA alerts:', error);
          toast.error('Failed to generate QA alerts');
        }
      },

      // Complete a QA checklist item
      completeQAChecklistItem: async (alertId: string, itemId: string, notes?: string) => {
        const { currentUser } = get();
        if (!currentUser) {
          toast.error('User not found');
          return;
        }

        try {
          const result = await qaService.completeChecklistItem(alertId, itemId, currentUser.id, notes);
          if (result.success) {
            // Refresh QA alerts to get updated completion status
            await get().initializeQAAlerts();
            toast.success('Checklist item completed!');
          } else {
            toast.error(result.error || 'Failed to complete checklist item');
          }
        } catch (error) {
          console.error('Error completing checklist item:', error);
          toast.error('Failed to complete checklist item');
        }
      },

      // Update QA alert status
      updateQAAlertStatus: async (alertId: string, status: QAAlert['status']) => {
        const { currentUser } = get();
        if (!currentUser) {
          toast.error('User not found');
          return;
        }

        try {
          const result = await qaService.updateQAAlertStatus(alertId, status, currentUser.id);
          if (result.success) {
            // Update local state
            set(state => ({
              qaAlerts: state.qaAlerts.map(alert =>
                alert.id === alertId
                  ? { ...alert, status, updated_at: new Date() }
                  : alert
              )
            }));
            
            const statusText = status === 'completed' ? 'completed' : 
                             status === 'in_progress' ? 'marked in progress' : 'updated';
            toast.success(`QA alert ${statusText}!`);
          } else {
            toast.error(result.error || 'Failed to update QA alert status');
          }
        } catch (error) {
          console.error('Error updating QA alert status:', error);
          toast.error('Failed to update QA alert status');
        }
      },

      // Delete a QA alert
      deleteQAAlert: async (alertId: string) => {
        try {
          const result = await qaService.deleteQAAlert(alertId);
          if (result.success) {
            set(state => ({
              qaAlerts: state.qaAlerts.filter(alert => alert.id !== alertId)
            }));
            toast.success('QA alert deleted!');
          } else {
            toast.error(result.error || 'Failed to delete QA alert');
          }
        } catch (error) {
          console.error('Error deleting QA alert:', error);
          toast.error('Failed to delete QA alert');
        }
      },

      // Auto-trigger QA checks when tasks are updated
      autoTriggerQAChecks: async (task: Task, previousStatus?: Task['status']) => {
        const { currentProject } = get();
        if (!currentProject) return;

        try {
          const newAlerts = await qaService.autoTriggerQAChecks(task, previousStatus, currentProject.id);
          if (newAlerts.length > 0) {
            set(state => ({
              qaAlerts: [...state.qaAlerts, ...newAlerts]
            }));
            
            // Show notification for critical alerts
            const criticalAlerts = newAlerts.filter(alert => alert.priority === 'critical');
            if (criticalAlerts.length > 0) {
              toast.error(`🔍 CRITICAL QA Alert: ${criticalAlerts[0].title}`, {
                duration: 8000
              });
            } else {
              toast.success(`🔍 New QA alert created: ${newAlerts[0].title}`);
            }
          }
        } catch (error) {
          console.error('Error auto-triggering QA checks:', error);
        }
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
            overdue: qaAlerts.filter(qa => {
              if (qa.status === 'completed' || !qa.due_date) return false;
              return qa.due_date < now;
            }).length,
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
            tasksResult,
            deliveriesResult,
            taskChangeProposalsData,
            qaAlertsData,
            suppliersResult
          ] = await Promise.all([
            SupabaseService.getProjectWithMembers(projectId),
            taskService.getProjectTasks(projectId),
            supplierService.getProjectDeliveries(projectId),
            SupabaseService.getTaskChangeProposals(projectId),
            SupabaseService.getProjectQAAlerts(projectId),
            supplierService.getSuppliers()
          ]);

          // Update store with fetched data
          if (projectData) {
            set({ currentProject: projectData });
          }
          
          if (tasksResult.success && tasksResult.tasks) {
            set({ tasks: tasksResult.tasks });
          }
          
          if (deliveriesResult.success && deliveriesResult.deliveries) {
            set({ deliveries: deliveriesResult.deliveries });
          }
          
          if (taskChangeProposalsData) {
            set({ taskChangeProposals: taskChangeProposalsData });
          }
          
          if (qaAlertsData) {
            set({ qaAlerts: qaAlertsData });
          }
          
          if (suppliersResult.success && suppliersResult.suppliers) {
            set({ suppliers: suppliersResult.suppliers });
          }

          // Update dashboard stats
          get().updateDashboardStats();

          set({ loading: false });
        } catch (error) {
          console.error('Error initializing project data:', error);
          set({ error: 'Failed to initialize project data', loading: false });
        }
      },

      initializeDemoData: () => {
        console.log('Starting demo data initialization...');
        
        // Load mock data for demo mode using ES6 imports
        import('../utils/mockData').then((mockData) => {
          console.log('Mock data imported:', mockData);
          
          const { mockProject, mockTasks, mockDeliveries, mockSuppliers, mockTaskChangeProposals, mockUsers } = mockData;
          
          if (!mockProject || !mockTasks || !mockDeliveries || !mockSuppliers || !mockUsers) {
            console.error('Missing required mock data exports');
            return;
          }
          
          console.log('Setting demo project and data...');
          
          // Set all demo data in a single atomic update
          set({
            currentProject: mockProject,
            tasks: mockTasks,
            deliveries: mockDeliveries, 
            suppliers: mockSuppliers,
            users: mockUsers,
            taskChangeProposals: mockTaskChangeProposals || [],
            qaAlerts: [], // Start with empty QA alerts, they'll be generated
          });

          console.log('Demo data set successfully, current project:', get().currentProject?.name);
          console.log('Current user:', get().currentUser?.full_name);

          console.log('Demo data set successfully, generating QA alerts...');

          // Generate QA alerts for demo
          setTimeout(() => {
            import('../services/qaService').then((qaModule) => {
              console.log('QA service imported:', qaModule);
              const qaAlerts = qaModule.default.generateQAAlerts(mockProject.id);
              console.log('Generated QA alerts:', qaAlerts);
              set({ qaAlerts });
              
              // Update dashboard stats after everything is loaded
              console.log('Updating dashboard stats...');
              get().updateDashboardStats();
              
              console.log('Demo data initialization complete!');
            }).catch((error) => {
              console.error('Failed to load QA service:', error);
              // Continue without QA alerts
              get().updateDashboardStats();
            });
          }, 100);
          
        }).catch((error) => {
          console.error('Failed to load demo data:', error);
          // Set fallback empty state so app doesn't get stuck
          set({
            currentProject: null,
            tasks: [],
            deliveries: [], 
            suppliers: [],
            taskChangeProposals: [],
            qaAlerts: [],
          });
        });
      },

      // Real task management methods
      // Enhanced addTask with QA integration
      addTask: async (taskData: Omit<Task, 'id' | 'created_at' | 'updated_at'>) => {
        const { currentUser, currentProject } = get();
        if (!currentUser || !currentProject) {
          toast.error('User or project not found');
          return;
        }

        try {
          const result = await taskService.createTask({
            ...taskData,
            project_id: currentProject.id
          }, currentUser.id);

          if (result.success && result.task) {
            set(state => ({
              tasks: [...state.tasks, result.task!]
            }));

            // Auto-trigger QA checks for new task
            await get().autoTriggerQAChecks(result.task);

            // Send email notification if task is assigned to someone
            if (result.task.assigned_to && result.task.assigned_to !== currentUser.id) {
              const assignee = get().users.find(u => u.id === result.task!.assigned_to);
              if (assignee) {
                emailService.sendTaskAssignment(
                  result.task,
                  assignee,
                  currentProject,
                  currentUser
                ).then(emailResult => {
                  if (emailResult.success) {
                    toast.success(`Task assigned and notification sent to ${assignee.full_name}`);
                  } else {
                    console.error('Failed to send task assignment email:', emailResult.error);
                    toast.success('Task assigned (email notification failed)');
                  }
                }).catch(error => {
                  console.error('Email service error:', error);
                });
              }
            } else {
              toast.success('Task added successfully!');
            }
          } else {
            toast.error(result.error || 'Failed to create task');
          }
        } catch (error) {
          console.error('Error creating task:', error);
          toast.error('Failed to create task');
        }
      },

      // Enhanced updateTask with QA integration
      updateTask: async (taskId: string, updates: Partial<Task>) => {
        const { currentUser, tasks, currentProject, users } = get();
        if (!currentUser) {
          toast.error('User not found');
          return;
        }

        const task = tasks.find(t => t.id === taskId);
        if (!task) {
          toast.error('Task not found');
          return;
        }

        const previousStatus = task.status;

        try {
          const result = await taskService.updateTask(taskId, updates, currentUser.id);

          if (result.success && result.task) {
            set(state => ({
              tasks: state.tasks.map(t => 
                t.id === taskId ? result.task! : t
              )
            }));

            // Auto-trigger QA checks if status changed
            if (updates.status && updates.status !== previousStatus) {
              await get().autoTriggerQAChecks(result.task, previousStatus);
            }

            // Send email notification if assignee changed
            if (updates.assigned_to && updates.assigned_to !== task.assigned_to && updates.assigned_to !== currentUser.id) {
              const newAssignee = users.find(u => u.id === updates.assigned_to);
              if (newAssignee && currentProject) {
                emailService.sendTaskAssignment(
                  result.task,
                  newAssignee,
                  currentProject,
                  currentUser
                ).then(emailResult => {
                  if (emailResult.success) {
                    toast.success(`Task updated and notification sent to ${newAssignee.full_name}`);
                  } else {
                    console.error('Failed to send task assignment email:', emailResult.error);
                    toast.success('Task updated (email notification failed)');
                  }
                }).catch(error => {
                  console.error('Email service error:', error);
                });
              }
            } else {
              toast.success('Task updated successfully!');
            }
          } else {
            toast.error(result.error || 'Failed to update task');
          }
        } catch (error) {
          console.error('Error updating task:', error);
          toast.error('Failed to update task');
        }
      },

      moveTask: async (taskId, newStartDate, newEndDate) => {
        const { currentUser } = get();
        if (!currentUser) {
          toast.error('User not found');
          return;
        }

        try {
          const result = await taskService.moveTask(taskId, newStartDate, newEndDate, currentUser.id);

          if (result.success) {
            // Fetch updated task data
            const taskResult = await taskService.getTaskById(taskId);
            if (taskResult.success && taskResult.task) {
              set(state => ({
                tasks: state.tasks.map(task => 
                  task.id === taskId ? taskResult.task! : task
                )
              }));
              
              toast.success('Task moved successfully');
              get().updateDashboardStats();
            }
          } else {
            toast.error(result.error || 'Failed to move task');
          }
        } catch (error) {
          console.error('Error moving task:', error);
          toast.error('Failed to move task');
        }
      },

      deleteTask: async (taskId) => {
        const { currentUser } = get();
        if (!currentUser) {
          toast.error('User not found');
          return;
        }

        try {
          const result = await taskService.deleteTask(taskId, currentUser.id);

          if (result.success) {
            // Remove from local state
            set(state => ({
              tasks: state.tasks.filter(task => task.id !== taskId),
              // Also remove related deliveries
              deliveries: state.deliveries.filter(delivery => delivery.task_id !== taskId),
              // Remove related QA alerts
              qaAlerts: state.qaAlerts.filter(alert => alert.task_id !== taskId),
            }));

            get().updateDashboardStats();
            toast.success('Task deleted successfully');
          } else {
            toast.error(result.error || 'Failed to delete task');
          }
        } catch (error) {
          console.error('Error deleting task:', error);
          toast.error('Failed to delete task');
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
                get().deleteTask(oldRecord.id);
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

      // Real supplier management methods
      addSupplier: async (supplier) => {
        try {
          const result = await supplierService.createSupplier(supplier);

          if (result.success && result.supplier) {
            set(state => ({
              suppliers: [...state.suppliers, result.supplier!]
            }));
            toast.success('Supplier added successfully');
          } else {
            toast.error(result.error || 'Failed to add supplier');
          }
        } catch (error) {
          console.error('Error adding supplier:', error);
          toast.error('Failed to add supplier');
        }
      },

      updateSupplier: async (supplierId, updates) => {
        try {
          const result = await supplierService.updateSupplier(supplierId, updates);

          if (result.success && result.supplier) {
            set(state => ({
              suppliers: state.suppliers.map(supplier => 
                supplier.id === supplierId ? result.supplier! : supplier
              )
            }));
            toast.success('Supplier updated successfully');
          } else {
            toast.error(result.error || 'Failed to update supplier');
          }
        } catch (error) {
          console.error('Error updating supplier:', error);
          toast.error('Failed to update supplier');
        }
      },

      updateDelivery: async (deliveryId, updates) => {
        try {
          const result = await supplierService.updateDelivery(deliveryId, updates);

          if (result.success && result.delivery) {
            set(state => ({
              deliveries: state.deliveries.map(delivery => 
                delivery.id === deliveryId ? result.delivery! : delivery
              )
            }));
            
            get().updateDashboardStats();
            toast.success('Delivery updated successfully');
          } else {
            toast.error(result.error || 'Failed to update delivery');
          }
        } catch (error) {
          console.error('Error updating delivery:', error);
          toast.error('Failed to update delivery');
        }
      },

      // Add method to send delivery confirmation emails
      sendDeliveryConfirmation: async (deliveryId: string, newDate: Date) => {
        const { currentUser, currentProject, deliveries, tasks, suppliers } = get();
        if (!currentUser || !currentProject) {
          toast.error('User or project not found');
          return;
        }

        const delivery = deliveries.find(d => d.id === deliveryId);
        if (!delivery) {
          toast.error('Delivery not found');
          return;
        }

        const task = tasks.find(t => t.id === delivery.task_id);
        const supplier = suppliers.find(s => s.id === delivery.supplier_id);

        if (!task || !supplier) {
          toast.error('Associated task or supplier not found');
          return;
        }

        try {
          const result = await emailService.sendDeliveryConfirmation(
            delivery,
            { ...supplier, email: supplier.email || `${supplier.contact_person}@${supplier.company}.com` } as any,
            task,
            currentProject,
            currentUser,
            newDate
          );

          if (result.success) {
            toast.success(`Delivery confirmation sent to ${supplier.company}`);
          } else {
            toast.error(result.error || 'Failed to send delivery confirmation');
          }
        } catch (error) {
          console.error('Error sending delivery confirmation:', error);
          toast.error('Failed to send delivery confirmation');
        }
      },

      // Test email configuration
      testEmailConfiguration: async (testEmail: string) => {
        try {
          const result = await emailService.testEmailConfiguration(testEmail);
          if (result.success) {
            toast.success('Test email sent successfully! Check your inbox.');
          } else {
            toast.error(result.error || 'Failed to send test email');
          }
        } catch (error) {
          console.error('Error testing email configuration:', error);
          toast.error('Failed to test email configuration');
        }
      },
    }),
    {
      name: 'gogram-store',
    }
  )
); 