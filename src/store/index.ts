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

          // Create notifications for assigned users
          const qaNotifications = qaService.generateQANotifications(newAlerts, users);
          
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
        const { qaAlerts, currentUser } = get();
        const alertUpdates = qaService.updateAlertStatus(alertId, status, currentUser?.id);
        
        set((state) => ({
          qaAlerts: state.qaAlerts.map(alert =>
            alert.id === alertId ? { ...alert, ...alertUpdates } : alert
          )
        }));
        
        if (status === 'completed') {
          toast.success('QA checklist completed successfully!');
        }
      },

      completeQAChecklistItem: (alertId, itemId, notes) => {
        const { qaAlerts, currentUser } = get();
        if (!currentUser) return;

        // Update the checklist item locally
        set((state) => ({
          qaAlerts: state.qaAlerts.map(alert => {
            if (alert.id === alertId) {
              const updatedChecklist = alert.checklist.map(item =>
                item.id === itemId
                  ? {
                      ...item, 
                      completed: true,
                      completed_at: new Date(),
                      completed_by: currentUser.id,
                      notes
                    }
                  : item
              );

              // Check if all required items are completed
              const allRequiredCompleted = updatedChecklist
                .filter(item => item.required)
                .every(item => item.completed);

              return {
                ...alert,
                checklist: updatedChecklist,
                status: allRequiredCompleted ? 'completed' as const : alert.status,
                updated_at: new Date()
              };
            }
            return alert;
          })
        }));
        
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
          
          const { mockProject, mockTasks, mockDeliveries, mockSuppliers, mockTaskChangeProposals } = mockData;
          
          if (!mockProject || !mockTasks || !mockDeliveries || !mockSuppliers) {
            console.error('Missing required mock data exports');
            return;
          }
          
          console.log('Setting demo project and data...');
          
          // Set the demo project first
          set({ currentProject: mockProject });
          
          // Load all mock data
          set({
            tasks: mockTasks,
            deliveries: mockDeliveries, 
            suppliers: mockSuppliers,
            taskChangeProposals: mockTaskChangeProposals || [],
            qaAlerts: [], // Start with empty QA alerts, they'll be generated
          });

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
      addTask: async (task) => {
        const { currentUser, currentProject } = get();
        if (!currentUser || !currentProject) {
          toast.error('User or project not found');
          return;
        }

        try {
          const result = await taskService.createTask({
            project_id: currentProject.id,
            title: task.title,
            description: task.description,
            category: task.category,
            location: task.location,
            status: task.status,
            priority: task.priority,
            assigned_to: task.assigned_to,
            start_date: task.start_date,
            end_date: task.end_date,
            planned_duration: task.planned_duration,
            color: task.color,
            dependencies: task.dependencies,
            notes: task.notes,
            primary_supplier_id: task.primary_supplier_id,
            requires_materials: task.requires_materials,
            material_delivery_date: task.material_delivery_date,
            procurement_notes: task.procurement_notes,
          }, currentUser.id);

          if (result.success && result.task) {
            // Add to local state
            set(state => ({
              tasks: [...state.tasks, result.task!]
            }));

            // Auto-create delivery if materials required
            if (task.requires_materials && task.primary_supplier_id) {
              const { suppliers, deliveries } = get();
              const supplier = suppliers.find(s => s.id === task.primary_supplier_id);
              
              const plannedDate = task.material_delivery_date || addDays(task.start_date, -2);
              
              const newDelivery = {
                id: Date.now().toString(),
                task_id: result.task.id,
                supplier_id: task.primary_supplier_id,
                planned_date: plannedDate,
                confirmation_status: 'pending' as const,
                notes: task.procurement_notes,
                created_at: new Date(),
                updated_at: new Date(),
              };

              set(state => ({
                deliveries: [...state.deliveries, newDelivery]
              }));

              toast.success(`Task created and delivery scheduled for ${format(plannedDate, 'MMM dd, yyyy')}`);
              if (supplier) {
                toast.success(`Supplier ${supplier.name} linked to task`);
              }
            } else {
              toast.success('Task created successfully');
            }

            // Check for QA requirements
            if (qaService.requiresQA(task.category)) {
              const requirements = qaService.getQARequirements(task.category);
              toast(`⚠️ QA Required: ${requirements.join(', ')}`, {
                duration: 6000,
                style: { background: '#f59e0b', color: 'white' }
              });
            }

            // Trigger QA checks for status changes
            const newAlerts = await qaService.autoTriggerQAChecks(result.task, currentProject.id);
            if (newAlerts.length > 0) {
              set(state => ({
                qaAlerts: [...state.qaAlerts, ...newAlerts]
              }));

              // Show toast for critical/high priority alerts
              newAlerts.forEach(alert => {
                if (alert.priority === 'critical' || alert.priority === 'high') {
                  toast.error(`QA Alert: ${alert.type.replace('_', ' ').toUpperCase()}`);
                }
              });
            }

            get().updateDashboardStats();
          } else {
            toast.error(result.error || 'Failed to create task');
          }
        } catch (error) {
          console.error('Error creating task:', error);
          toast.error('Failed to create task');
        }
      },

      updateTask: async (taskId, updates) => {
        const { currentUser, tasks } = get();
        if (!currentUser) {
          toast.error('User not found');
          return;
        }

        const originalTask = tasks.find(t => t.id === taskId);
        if (!originalTask) {
          toast.error('Task not found');
          return;
        }

        try {
          const result = await taskService.updateTask(taskId, updates, currentUser.id);

          if (result.success && result.task) {
            // Update local state
            set(state => ({
              tasks: state.tasks.map(task => 
                task.id === taskId ? result.task! : task
              )
            }));

            // Trigger QA checks for status or progress changes
            if (updates.status || updates.progress_percentage !== undefined) {
              const { currentProject, qaAlerts } = get();
              if (currentProject) {
                const newAlerts = await qaService.autoTriggerQAChecks(result.task, currentProject.id);
                if (newAlerts.length > 0) {
                  set(state => ({
                    qaAlerts: [...state.qaAlerts, ...newAlerts]
                  }));

                  // Show toast for critical/high priority alerts
                  newAlerts.forEach(alert => {
                    if (alert.priority === 'critical' || alert.priority === 'high') {
                      toast.error(`QA Alert: ${alert.type.replace('_', ' ').toUpperCase()}`);
                    }
                  });
                }
              }
            }

            get().updateDashboardStats();
            toast.success('Task updated successfully');
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
    }),
    {
      name: 'gogram-store',
    }
  )
); 