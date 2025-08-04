import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import toast from 'react-hot-toast';
import { addDays, format } from 'date-fns';
import procurementService from '../services/procurementService';
import qaService from '../services/qaService';
import taskService from '../services/taskService';
import supplierService, { CreateSupplierData } from '../services/supplierService';
import { supabase, SupabaseService } from '../lib/supabase';
import type { 
  User, 
  Project, 
  Task, 
  TaskChangeProposal, 
  TaskDelay, 
  Supplier, 
  Delivery, 
  DeliveryResponse,
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
  deliveryResponses: DeliveryResponse[];
  
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
  loadUsers: () => Promise<void>;
  addUser: (user: User) => Promise<void>;
  updateUser: (id: string, updates: Partial<User>) => void;
  removeUser: (id: string) => void;
  
  // Project Actions
  setCurrentProject: (project: Project | null) => void;
  addProject: (project: Project) => void;
  updateProject: (id: string, updates: Partial<Project>) => void;
  removeProject: (id: string) => void;
  
  // Task Actions
  addTask: (task: Omit<Task, 'id' | 'created_at' | 'updated_at'>) => void;
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
  addSupplier: (supplier: CreateSupplierData) => Promise<void>;
  updateSupplier: (id: string, updates: Partial<Supplier>) => void;
  removeSupplier: (id: string) => void;
  
  // Delivery Actions
  addDelivery: (delivery: Delivery) => void;
  updateDelivery: (id: string, updates: Partial<Delivery>) => void;
  confirmDelivery: (id: string, confirmed: boolean, newDate?: Date) => void;
  
  // QA Actions
  initializeQAAlerts: () => Promise<void>;
  generateQAAlerts: () => void;
  updateQAAlertStatus: (alertId: string, status: QAAlert['status']) => void;
  completeQAChecklistItem: (alertId: string, itemId: string, notes?: string) => void;
  autoTriggerQAChecks: (task: Task, previousStatus?: Task['status']) => Promise<QAAlert[]>;
  
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
  loadDeliveryResponses: (projectId: string) => Promise<void>;
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
      deliveryResponses: [],
      qaAlerts: [],
      notifications: [],
      unreadCount: 0,
      sidebarOpen: true, // Force sidebar to be open by default
      loading: false,
      error: null,
      realtimeChannel: null,
      dashboardStats: initialStats,

      // User Actions
      setCurrentUser: (user) => set({ currentUser: user }),
      
      loadUsers: async () => {
        try {
          const { currentProject } = get();
          if (!currentProject) {
            console.log('No current project, skipping loadUsers');
            return;
          }

          console.log('Loading users for project:', currentProject.id);

          // Load users directly from users table who are in this project
          const { data: members, error: membersError } = await supabase
            .from('project_members')
            .select('user_id, role')
            .eq('project_id', currentProject.id);

          if (membersError) {
            console.error('Error loading project members:', membersError);
            return;
          }

          console.log('Project members found:', members);

          if (!members || members.length === 0) {
            console.log('No project members found');
            set({ users: [] });
            return;
          }

          // Get the user IDs
          const userIds = members.map(m => m.user_id);
          console.log('Loading users with IDs:', userIds);

          // Load the actual user data
          const { data: users, error: usersError } = await supabase
            .from('users')
            .select('*')
            .in('id', userIds);

          if (usersError) {
            console.error('Error loading users:', usersError);
            return;
          }

          console.log('Users loaded from database:', users);

          // Map users with roles from project_members
          const usersWithRoles = users?.map(user => {
            const member = members.find(m => m.user_id === user.id);
            return {
              ...user,
              role: member?.role || user.role
            };
          }) || [];

          set({ users: usersWithRoles });
          console.log('Set users in store:', usersWithRoles.length);
        } catch (error) {
          console.error('Error loading users:', error);
        }
      },

      addUser: async (user) => {
        try {
          // Generate a proper UUID for the user
          const generateUUID = () => {
            return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
              const r = Math.random() * 16 | 0;
              const v = c === 'x' ? r : (r & 0x3 | 0x8);
              return v.toString(16);
            });
          };

          // Create a temporary user object for local state
          const tempUser = {
            ...user,
            id: generateUUID(),
            created_at: new Date(),
            updated_at: new Date()
          };

                    // Insert into database (RLS policies should now allow this)
          const { currentProject: project } = get();
          if (project) {
            try {
              console.log('🔥 ATTEMPTING TO ADD USER TO DATABASE:', tempUser);
              
              // First check if user already exists by email
              const { data: existingUser, error: checkError } = await supabase
                .from('users')
                .select('*')
                .eq('email', tempUser.email)
                .single();

              let userToUse;

              if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = no rows found
                console.error('🔥 ERROR CHECKING FOR EXISTING USER:', checkError);
                throw checkError;
              }

              if (existingUser) {
                console.log('🔥 USER ALREADY EXISTS, USING EXISTING USER:', existingUser);
                userToUse = existingUser;
              } else {
                console.log('🔥 USER DOES NOT EXIST, CREATING NEW USER');
                
                const userInsertData = {
                  id: tempUser.id,
                  full_name: tempUser.full_name,
                  email: tempUser.email,
                  role: tempUser.role,
                  company: tempUser.company || '',
                  phone: tempUser.phone || '',
                  specialties: tempUser.specialties || [],
                  avatar_url: tempUser.avatar_url || '',
                  auth_user_id: null // External users don't have auth_user_id
                };
                
                console.log('🔥 INSERTING USER DATA:', userInsertData);

                // Insert into users table
                const { data: insertedUser, error: userError } = await supabase
                  .from('users')
                  .insert([userInsertData])
                  .select()
                  .single();

                if (userError) {
                  console.error('🔥 ERROR INSERTING INTO USERS TABLE:', userError);
                  throw userError;
                }

                console.log('🔥 SUCCESSFULLY INSERTED INTO USERS TABLE:', insertedUser);
                userToUse = insertedUser;
              }

              // Then insert into project_members table
              const memberInsertData = {
                project_id: project.id,
                user_id: userToUse.id, // Use the actual user ID (existing or new)
                role: user.role
              };
              

              
              const { data: insertedMember, error: memberError } = await supabase
                .from('project_members')
                .insert([memberInsertData])
                .select();

              if (memberError) {
                console.error('🔥 ERROR INSERTING INTO PROJECT_MEMBERS TABLE:', memberError);
                throw memberError;
              }

              console.log('🔥 SUCCESSFULLY INSERTED INTO PROJECT_MEMBERS TABLE:', insertedMember);

              // Update local state with the actual user data from database
              set((state) => ({
                users: [...state.users, userToUse as User]
              }));

              console.log('🔥 TEAM MEMBER ADDED TO DATABASE AND LOCAL STATE SUCCESSFULLY! 🎉');

            } catch (error) {
              console.error('Database insert failed:', error);
              // Fallback to local state only
              console.log('Falling back to local state only');
              set((state) => ({
                users: [...state.users, tempUser]
              }));
            }
          } else {
            console.error('No current project found');
            // Fallback to local state only
            set((state) => ({
              users: [...state.users, tempUser]
            }));
          }

          // Send role-specific welcome email to new team member
          const { currentUser, currentProject } = get();
          if (currentUser && currentProject) {
            const getRoleDescription = (role: string) => {
              switch (role) {
                case 'project_manager':
                  return {
                    description: 'You have full access to manage this project, including adding team members, creating tasks, managing deliveries, and overseeing quality assurance.',
                    permissions: [
                      '✅ Create and assign tasks',
                      '✅ Add/remove team members',
                      '✅ Manage suppliers and deliveries',
                      '✅ Review and approve changes',
                      '✅ Access all project reports'
                    ]
                  };
                case 'project_coordinator':
                  return {
                    description: 'You can coordinate project activities, manage tasks, and work with suppliers.',
                    permissions: [
                      '✅ Create and assign tasks',
                      '✅ Manage suppliers and deliveries',
                      '✅ Update task progress',
                      '✅ View project reports',
                      '❌ Cannot add/remove team members'
                    ]
                  };
                case 'subcontractor':
                  return {
                    description: 'You can view and update tasks assigned to you, and manage your deliveries.',
                    permissions: [
                      '✅ View tasks assigned to you',
                      '✅ Update your task progress',
                      '✅ Manage your deliveries',
                      '✅ Communicate with project team',
                      '❌ Cannot create new tasks or manage other users'
                    ]
                  };
                case 'supplier':
                  return {
                    description: 'You can manage deliveries, confirm orders, and track your supplies for this project.',
                    permissions: [
                      '✅ View delivery requests',
                      '✅ Confirm delivery schedules',
                      '✅ Update delivery status',
                      '✅ Communicate with project team',
                      '❌ Cannot access tasks or manage other users'
                    ]
                  };
                case 'viewer':
                  return {
                    description: 'You have read-only access to view project progress and reports.',
                    permissions: [
                      '✅ View project dashboard',
                      '✅ View task progress',
                      '✅ View delivery status',
                      '✅ View project reports',
                      '❌ Cannot create or modify anything'
                    ]
                  };
                default:
                  return {
                    description: 'You have been added to this construction project.',
                    permissions: ['✅ Access project dashboard']
                  };
              }
            };

            const roleInfo = getRoleDescription(user.role);
            const roleName = user.role.replace('_', ' ').toUpperCase();

            emailService.sendCustomNotification(
              user.email,
              `🏗️ You've been added to ${currentProject.name} as ${roleName}`,
              `Hi ${user.full_name},

${currentUser.full_name} has added you to the construction project "${currentProject.name}" with the role of ${roleName}.

📋 YOUR ROLE & PERMISSIONS:
${roleInfo.description}

${roleInfo.permissions.map(perm => perm).join('\n')}

🚀 NEXT STEPS:
Click this link to join the project: ${import.meta.env.NEXT_PUBLIC_APP_URL || 'https://gogram.co'}/invite?token=${btoa(JSON.stringify({
  email: user.email,
  role: user.role,
  projectId: currentProject.id,
  projectName: currentProject.name,
  invitedBy: currentUser.full_name,
  expires: Date.now() + (7 * 24 * 60 * 60 * 1000) // 7 days
}))}

📝 WHAT HAPPENS NEXT:
• If you already have a Gogram account: You'll be automatically added to the project
• If you're new to Gogram: You'll be guided through a quick signup process
• Your role and permissions are already configured for this project
• Save this email for reference - it contains your role permissions

📧 NEED HELP?
Reply to this email or contact the project manager directly.

PROJECT DETAILS:
• Project: ${currentProject.name}
• Your Role: ${roleName}
• Added by: ${currentUser.full_name}
• Your Email: ${user.email}

Welcome to the team!
The Gogram Team`,
              currentUser
            ).then(emailResult => {
              if (emailResult.success) {
                console.log('Role-specific welcome email sent to new team member');
              } else {
                console.error('Failed to send welcome email:', emailResult.error);
              }
            }).catch(error => {
              console.error('Welcome email error:', error);
            });
          }

          toast.success(`${user.full_name} has been added to the team!`);
        } catch (error) {
          console.error('Error adding user:', error);
          toast.error('Failed to add team member');
        }
      },
      
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
        const { taskChangeProposals, currentUser, tasks, users, currentProject } = get();
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

        // Send approval notification to proposer
        if (proposal.proposed_by && currentProject) {
          const proposer = users.find(u => u.id === proposal.proposed_by);
          const task = tasks.find(t => t.id === proposal.task_id);
          
          if (proposer && task) {
            emailService.sendCustomNotification(
              proposer.email,
              `✅ Task Change Approved - ${task.title}`,
              `Your proposed change for task "${task.title}" has been approved by ${currentUser.full_name}.

Change Details:
- Task: ${task.title}
- Project: ${currentProject.name}
- Reason: ${proposal.reason}
- Approved by: ${currentUser.full_name}
- Review Comments: ${reviewComments || 'No additional comments'}

The changes have been applied to the task schedule.`,
              currentUser
            ).then(emailResult => {
              if (emailResult.success) {
                console.log('Approval notification sent to proposer');
              } else {
                console.error('Failed to send approval notification:', emailResult.error);
              }
            }).catch(error => {
              console.error('Approval notification email error:', error);
            });
          }
        }

        toast.success('Change proposal approved and applied!');
      },
      
      rejectTaskChangeProposal: (id, reviewComments) => {
        const { taskChangeProposals, currentUser, tasks, users, currentProject } = get();
        const proposal = taskChangeProposals.find(p => p.id === id);
        if (!proposal || !currentUser) return;

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

        // Send rejection notification to proposer
        if (proposal.proposed_by && currentProject) {
          const proposer = users.find(u => u.id === proposal.proposed_by);
          const task = tasks.find(t => t.id === proposal.task_id);
          
          if (proposer && task) {
            emailService.sendCustomNotification(
              proposer.email,
              `❌ Task Change Rejected - ${task.title}`,
              `Your proposed change for task "${task.title}" has been rejected by ${currentUser.full_name}.

Change Details:
- Task: ${task.title}
- Project: ${currentProject.name}
- Reason: ${proposal.reason}
- Rejected by: ${currentUser.full_name}
- Review Comments: ${reviewComments || 'No additional comments'}

Please review the feedback and consider submitting a revised proposal if needed.`,
              currentUser
            ).then(emailResult => {
              if (emailResult.success) {
                console.log('Rejection notification sent to proposer');
              } else {
                console.error('Failed to send rejection notification:', emailResult.error);
              }
            }).catch(error => {
              console.error('Rejection notification email error:', error);
            });
          }
        }

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

      addDelivery: (delivery) => {
        const { currentUser, currentProject, suppliers, tasks } = get();
        
        set((state) => ({ 
          deliveries: [...state.deliveries, delivery] 
        }));

        // Send delivery confirmation email to supplier
        if (currentUser && currentProject) {
          const supplier = suppliers.find(s => s.id === delivery.supplier_id);
          const task = tasks.find(t => t.id === delivery.task_id);
          
          if (supplier && task) {
            // Convert supplier to User format for email service
            const supplierUser = {
              id: supplier.id,
              email: supplier.email,
              full_name: supplier.name,
              role: 'supplier',
              company: supplier.company,
              phone: supplier.phone
            } as User;
            
            emailService.sendDeliveryConfirmation(
              delivery,
              supplierUser,
              task,
              currentProject,
              currentUser,
              new Date(delivery.planned_date)
            ).then(emailResult => {
              if (emailResult.success) {
                console.log('Delivery confirmation email sent to supplier');
              } else {
                console.error('Failed to send delivery confirmation email:', emailResult.error);
              }
            }).catch(error => {
              console.error('Delivery confirmation email error:', error);
            });
          }
        }
      },
      
      confirmDelivery: (id, confirmed, newDate) => {
        const { deliveries, currentUser, currentProject, suppliers, tasks } = get();
        const delivery = deliveries.find(d => d.id === id);
        
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

        // Send confirmation notification to project manager
        if (delivery && currentUser && currentProject) {
          const supplier = suppliers.find(s => s.id === delivery.supplier_id);
          const task = tasks.find(t => t.id === delivery.task_id);
          
          if (supplier && task) {
            emailService.sendCustomNotification(
              currentUser.email,
              `🚚 Delivery ${confirmed ? 'Confirmed' : 'Rejected'} - ${task.title}`,
              `A delivery has been ${confirmed ? 'confirmed' : 'rejected'} by the supplier.

Delivery Details:
- Task: ${task.title}
- Project: ${currentProject.name}
- Supplier: ${supplier.name}
- Item: ${delivery.item || 'Not specified'}
- Original Date: ${new Date(delivery.planned_date).toLocaleDateString()}
- ${newDate ? `New Date: ${newDate.toLocaleDateString()}` : 'Date unchanged'}
- Status: ${confirmed ? 'Confirmed' : 'Rejected'}

This update has been recorded in the system.`,
              currentUser
            ).then(emailResult => {
              if (emailResult.success) {
                console.log('Delivery confirmation notification sent');
              } else {
                console.error('Failed to send delivery confirmation email:', emailResult.error);
              }
            }).catch(error => {
              console.error('Delivery confirmation email error:', error);
            });
          }
        }

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

      // Auto-trigger QA checks for a task
      autoTriggerQAChecks: async (task: Task, previousStatus?: Task['status']) => {
        const { currentProject } = get();
        if (!currentProject) return [];

        try {
          const alerts = await qaService.autoTriggerQAChecks(task, previousStatus, currentProject.id);
          if (alerts.length > 0) {
            set(state => ({
              qaAlerts: [...state.qaAlerts, ...alerts]
            }));
          }
          return alerts;
        } catch (error) {
          console.error('Error auto-triggering QA checks:', error);
          return [];
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
            deliveryResponsesResult,
            taskChangeProposalsData,
            qaAlertsData,
            suppliersResult
          ] = await Promise.all([
            SupabaseService.getProjectWithMembers(projectId),
            taskService.getProjectTasks(projectId),
            supplierService.getProjectDeliveries(projectId),
            supplierService.getProjectDeliveryResponses(projectId),
            SupabaseService.getTaskChangeProposals(projectId),
            SupabaseService.getProjectQAAlerts(projectId),
            supplierService.getProjectSuppliers(projectId)
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
          
          if (deliveryResponsesResult.success && deliveryResponsesResult.responses) {
            set({ deliveryResponses: deliveryResponsesResult.responses });
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

      loadDeliveryResponses: async (projectId) => {
        try {
          const result = await supplierService.getProjectDeliveryResponses(projectId);
          if (result.success && result.responses) {
            set({ deliveryResponses: result.responses });
          }
        } catch (error) {
          console.error('Error loading delivery responses:', error);
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
          setTimeout(async () => {
            try {
              const qaModule = await import('../services/qaService');
              console.log('QA service imported:', qaModule);
              
              // Call the async method properly
              const qaAlerts = await qaModule.default.generateQAAlerts(mockProject.id);
              console.log('Generated QA alerts:', qaAlerts);
              set({ qaAlerts });
              
              // Update dashboard stats after everything is loaded
              console.log('Updating dashboard stats...');
              get().updateDashboardStats();
              
              console.log('Demo data initialization complete!');
            } catch (error) {
              console.error('Failed to load QA service or generate alerts:', error);
              // Continue without QA alerts
              get().updateDashboardStats();
            }
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

            // If task requires materials and has a supplier, create delivery record
            if (result.task.requires_materials && result.task.primary_supplier_id && result.task.material_delivery_date) {
              try {
                const deliveryData = {
                  project_id: currentProject.id,
                  task_id: result.task.id,
                  supplier_id: result.task.primary_supplier_id,
                  item: 'Materials',
                  quantity: 1,
                  unit: 'lot',
                  planned_date: result.task.material_delivery_date,
                  delivery_address: currentProject.location || '',
                  notes: result.task.procurement_notes || 'Materials required for task completion'
                };

                const deliveryResult = await supplierService.createDelivery(deliveryData);
                
                if (deliveryResult.success && deliveryResult.delivery) {
                  // Add delivery to local state
                  set(state => ({
                    deliveries: [...state.deliveries, deliveryResult.delivery!]
                  }));

                } else {
                  console.error('❌ Failed to create delivery:', deliveryResult.error);
                }
              } catch (error) {
                console.error('Error creating delivery for task:', error);
              }
            }

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

            // Send QA alert emails if any were generated
            const qaAlerts = await get().autoTriggerQAChecks(result.task);
            if (qaAlerts.length > 0) {
              for (const alert of qaAlerts) {
                const assignee = get().users.find(u => u.id === alert.assigned_to);
                if (assignee) {
                  emailService.sendQAAlert(
                    {
                      type: alert.type,
                      title: alert.title,
                      description: alert.description || 'No description provided',
                      priority: alert.priority,
                      due_date: alert.due_date || new Date(),
                      checklist: alert.checklist.map(item => item.text)
                    },
                    result.task,
                    assignee,
                    currentProject,
                    currentUser
                  ).then(emailResult => {
                    if (emailResult.success) {
                      console.log(`QA alert email sent for ${alert.title}`);
                    } else {
                      console.error('Failed to send QA alert email:', emailResult.error);
                    }
                  }).catch(error => {
                    console.error('QA alert email service error:', error);
                  });
                }
              }
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

            // Handle delivery updates when material requirements change
            if (currentProject && (
              updates.requires_materials !== undefined ||
              updates.primary_supplier_id !== undefined ||
              updates.material_delivery_date !== undefined
            )) {
              const existingDelivery = get().deliveries.find(d => d.task_id === taskId);
              
              if (result.task.requires_materials && result.task.primary_supplier_id && result.task.material_delivery_date) {
                // Task now requires materials - create or update delivery
                if (existingDelivery) {
                  // Update existing delivery
                  try {
                    const deliveryUpdates = {
                      supplier_id: result.task.primary_supplier_id,
                      planned_date: result.task.material_delivery_date,
                      notes: result.task.procurement_notes || 'Materials required for task completion'
                    };
                    
                    const deliveryResult = await supplierService.updateDelivery(existingDelivery.id, deliveryUpdates);
                    if (deliveryResult.success && deliveryResult.delivery) {
                      set(state => ({
                        deliveries: state.deliveries.map(d => 
                          d.id === existingDelivery.id ? deliveryResult.delivery! : d
                        )
                      }));
                      console.log('Delivery updated for task:', result.task.title);
                    }
                  } catch (error) {
                    console.error('Error updating delivery:', error);
                  }
                } else {
                  // Create new delivery
                  try {
                    const deliveryData = {
                      project_id: currentProject.id,
                      task_id: result.task.id,
                      supplier_id: result.task.primary_supplier_id,
                      item: 'Materials',
                      quantity: 1,
                      unit: 'lot',
                      planned_date: result.task.material_delivery_date,
                      delivery_address: currentProject.location || '',
                      notes: result.task.procurement_notes || 'Materials required for task completion'
                    };

                    const deliveryResult = await supplierService.createDelivery(deliveryData);
                    if (deliveryResult.success && deliveryResult.delivery) {
                      set(state => ({
                        deliveries: [...state.deliveries, deliveryResult.delivery!]
                      }));
                      console.log('Delivery created for updated task:', result.task.title);
                    }
                  } catch (error) {
                    console.error('Error creating delivery for updated task:', error);
                  }
                }
              } else if (existingDelivery && !result.task.requires_materials) {
                // Task no longer requires materials - remove delivery
                try {
                  // Note: We don't have a deleteDelivery method in supplierService yet
                  // For now, just remove from local state
                  set(state => ({
                    deliveries: state.deliveries.filter(d => d.id !== existingDelivery.id)
                  }));
                  console.log('Delivery removed for task (no longer requires materials):', result.task.title);
                } catch (error) {
                  console.error('Error removing delivery:', error);
                }
              }
            }

            // Auto-trigger QA checks if status changed
            if (updates.status && updates.status !== previousStatus) {
              await get().autoTriggerQAChecks(result.task, previousStatus);
            }

            // Send email notification if assignee changed
            if (updates.assigned_to && updates.assigned_to !== task.assigned_to && currentProject) {
              const newAssignee = users.find(u => u.id === updates.assigned_to);
              if (newAssignee && result.task) {
                emailService.sendTaskAssignment(
                  result.task,
                  newAssignee,
                  currentProject,
                  currentUser
                ).then(emailResult => {
                  if (emailResult.success) {
                    toast.success(`Task reassigned and notification sent to ${newAssignee.full_name}`);
                  } else {
                    console.error('Failed to send task reassignment email:', emailResult.error);
                    toast.success('Task reassigned (email notification failed)');
                  }
                }).catch(error => {
                  console.error('Email service error:', error);
                });
              }
            }

            // Send status change notification to assignee
            if (updates.status && updates.status !== previousStatus && result.task && result.task.assigned_to && currentProject) {
              const task = result.task; // Create local reference for TypeScript
              const assignee = users.find(u => u.id === task.assigned_to);
              if (assignee && assignee.id !== currentUser.id) {
                emailService.sendCustomNotification(
                  assignee.email,
                  `📋 Task Status Updated - ${task.title}`,
                  `The status of your assigned task "${task.title}" has been updated from "${previousStatus}" to "${updates.status}".

Task Details:
- Project: ${currentProject.name}
- Category: ${task.category}
- Priority: ${task.priority}
- Updated by: ${currentUser.full_name}

You can view the task details in your dashboard.`,
                  currentUser
                ).then(emailResult => {
                  if (emailResult.success) {
                    console.log('Status change notification sent');
                  } else {
                    console.error('Failed to send status change email:', emailResult.error);
                  }
                }).catch(error => {
                  console.error('Status change email service error:', error);
                });
              }
            }

            // Send QA alert emails if any were generated
            if (updates.status && updates.status !== previousStatus && result.task && currentProject) {
              const qaAlerts = await get().autoTriggerQAChecks(result.task, previousStatus);
              if (qaAlerts.length > 0) {
                for (const alert of qaAlerts) {
                  const assignee = get().users.find(u => u.id === alert.assigned_to);
                  if (assignee) {
                    emailService.sendQAAlert(
                      {
                        type: alert.type,
                        title: alert.title,
                        description: alert.description || 'No description provided',
                        priority: alert.priority,
                        due_date: alert.due_date || new Date(),
                        checklist: alert.checklist.map(item => item.text)
                      },
                      result.task,
                      assignee,
                      currentProject,
                      currentUser
                    ).then(emailResult => {
                      if (emailResult.success) {
                        console.log(`QA alert email sent for ${alert.title}`);
                      } else {
                        console.error('Failed to send QA alert email:', emailResult.error);
                      }
                    }).catch(error => {
                      console.error('QA alert email service error:', error);
                    });
                  }
                }
              }
            }

            toast.success('Task updated successfully!');
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

      deleteTask: async (taskId: string) => {
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
            { ...supplier, email: supplier.email || `${supplier.name.toLowerCase().replace(/\s+/g, '.')}@${supplier.company}.com` } as any,
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

      removeTask: async (taskId: string) => {
        const { currentUser } = get();
        if (!currentUser) {
          toast.error('User not found');
          return;
        }

        try {
          const result = await taskService.deleteTask(taskId, currentUser.id);
          if (result.success) {
            set(state => ({
              tasks: state.tasks.filter(task => task.id !== taskId),
              deliveries: state.deliveries.filter(delivery => delivery.task_id !== taskId),
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


    }),
    {
      name: 'gogram-store',
    }
  )
); 