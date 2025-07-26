// =====================================================
// Gogram Database Types
// Auto-generated types matching the Supabase schema
// =====================================================

// Enum types
export type UserRole = 'project_manager' | 'project_coordinator' | 'subcontractor' | 'supplier' | 'viewer';
export type ProjectStatus = 'planning' | 'active' | 'on_hold' | 'completed' | 'cancelled';
export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'delayed' | 'cancelled';
export type TaskPriority = 'low' | 'medium' | 'high' | 'critical';
export type ProposalStatus = 'pending' | 'approved' | 'rejected';
export type DeliveryStatus = 'pending' | 'confirmed' | 'rejected';
export type QAAlertStatus = 'pending' | 'in_progress' | 'completed' | 'overdue';
export type QAAlertType = 'itp_required' | 'pre_pour_checklist' | 'engineer_inspection' | 'quality_checkpoint' | 'compliance_check';
export type NotificationType = 'task_update' | 'task_assignment' | 'delivery_update' | 'qa_alert' | 'approval_request' | 'system_message';

// Core database table types
export interface User {
  id: string;
  auth_user_id?: string;
  email: string;
  full_name: string;
  role: UserRole;
  avatar_url?: string;
  phone?: string;
  company?: string;
  specialties?: string[];
  is_active: boolean;
  last_login_at?: string;
  created_at: string;
  updated_at: string;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  location?: string;
  client?: string;
  project_manager_id?: string;
  status: ProjectStatus;
  start_date: string;
  end_date: string;
  budget?: number;
  progress_percentage: number;
  is_public: boolean;
  public_share_token?: string;
  public_settings: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface ProjectMember {
  id: string;
  project_id: string;
  user_id: string;
  role: UserRole;
  permissions: Record<string, any>;
  joined_at: string;
}

export interface Task {
  id: string;
  project_id: string;
  title: string;
  description?: string;
  category?: string;
  location?: string;
  status: TaskStatus;
  priority: TaskPriority;
  assigned_to?: string;
  start_date: string;
  end_date: string;
  planned_duration?: number;
  actual_duration?: number;
  progress_percentage: number;
  color: string;
  notes?: string;
  attachments: any[];
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface TaskDependency {
  id: string;
  task_id: string;
  depends_on_task_id: string;
  created_at: string;
}

export interface TaskDelay {
  id: string;
  task_id: string;
  original_end_date: string;
  new_end_date: string;
  delay_days: number;
  reason?: string;
  impact_assessment?: string;
  reported_by?: string;
  created_at: string;
}

export interface TaskChangeProposal {
  id: string;
  task_id: string;
  proposed_by?: string;
  status: ProposalStatus;
  proposed_start_date?: string;
  proposed_end_date?: string;
  reason: string;
  impact_description?: string;
  reviewed_by?: string;
  reviewed_at?: string;
  created_at: string;
  updated_at: string;
}

export interface Supplier {
  id: string;
  name: string;
  company?: string;
  email: string;
  phone?: string;
  address?: string;
  specialties: string[];
  is_active: boolean;
  rating?: number;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface Delivery {
  id: string;
  project_id: string;
  task_id: string;
  supplier_id: string;
  item: string;
  quantity: number;
  unit: string;
  planned_date: string;
  actual_date?: string;
  confirmation_status: DeliveryStatus;
  delivery_address?: string;
  notes?: string;
  confirmation_token?: string;
  confirmed_by?: string;
  confirmed_at?: string;
  created_at: string;
  updated_at: string;
}

export interface DeliveryConfirmation {
  id: string;
  delivery_id: string;
  supplier_id: string;
  status: DeliveryStatus;
  proposed_date?: string;
  comments?: string;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
}

export interface QAAlert {
  id: string;
  project_id: string;
  task_id: string;
  type: QAAlertType;
  status: QAAlertStatus;
  title: string;
  description?: string;
  due_date?: string;
  assigned_to?: string;
  checklist: QAChecklistItem[];
  priority: TaskPriority;
  completed_by?: string;
  completed_at?: string;
  created_at: string;
  updated_at: string;
}

export interface QAChecklistItem {
  id: string;
  text: string;
  required: boolean;
  completed: boolean;
  notes?: string;
}

export interface QAChecklistCompletion {
  id: string;
  qa_alert_id: string;
  checklist_item_id: string;
  completed_by?: string;
  notes?: string;
  completed_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  message: string;
  data: Record<string, any>;
  read: boolean;
  read_at?: string;
  expires_at?: string;
  created_at: string;
}

export interface ProjectSnapshot {
  id: string;
  project_id: string;
  snapshot_date: string;
  total_tasks: number;
  completed_tasks: number;
  delayed_tasks: number;
  progress_percentage: number;
  budget_spent?: number;
  data?: Record<string, any>;
  created_at: string;
}

export interface ActivityLog {
  id: string;
  project_id?: string;
  user_id?: string;
  entity_type: string;
  entity_id: string;
  action: string;
  old_values?: Record<string, any>;
  new_values?: Record<string, any>;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
}

export interface SystemConfig {
  key: string;
  value: Record<string, any>;
  description?: string;
  created_at: string;
  updated_at: string;
}

// Database Views
export interface ProjectDashboardStats {
  project_id: string;
  project_name: string;
  progress_percentage: number;
  total_tasks: number;
  completed_tasks: number;
  active_tasks: number;
  delayed_tasks: number;
  overdue_tasks: number;
  pending_deliveries: number;
  pending_qa_alerts: number;
}

export interface TaskDetails extends Task {
  assigned_to_name?: string;
  created_by_name?: string;
  dependency_titles?: string[];
  qa_alerts_count: number;
}

// API Response Types
export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  count: number;
  page: number;
  limit: number;
  total_pages: number;
}

// Form/Input Types
export interface CreateProjectInput {
  name: string;
  description?: string;
  location?: string;
  client?: string;
  start_date: string;
  end_date: string;
  budget?: number;
}

export interface UpdateProjectInput extends Partial<CreateProjectInput> {
  status?: ProjectStatus;
  progress_percentage?: number;
  is_public?: boolean;
}

export interface CreateTaskInput {
  project_id: string;
  title: string;
  description?: string;
  category?: string;
  location?: string;
  priority?: TaskPriority;
  assigned_to?: string;
  start_date: string;
  end_date: string;
  color?: string;
  dependencies?: string[];
}

export interface UpdateTaskInput extends Partial<CreateTaskInput> {
  status?: TaskStatus;
  progress_percentage?: number;
  actual_duration?: number;
  notes?: string;
}

export interface CreateDeliveryInput {
  project_id: string;
  task_id: string;
  supplier_id: string;
  item: string;
  quantity: number;
  unit: string;
  planned_date: string;
  delivery_address?: string;
  notes?: string;
}

export interface CreateQAAlertInput {
  project_id: string;
  task_id: string;
  type: QAAlertType;
  title: string;
  description?: string;
  due_date?: string;
  assigned_to?: string;
  priority?: TaskPriority;
  checklist?: Omit<QAChecklistItem, 'completed'>[];
}

// Utility Types
export type EntityType = 'project' | 'task' | 'delivery' | 'qa_alert' | 'user' | 'supplier';
export type ActionType = 'created' | 'updated' | 'deleted' | 'moved' | 'approved' | 'rejected';

// Permission Types
export interface Permission {
  action: string;
  resource: string;
  condition?: Record<string, any>;
}

export interface RolePermissions {
  role: UserRole;
  permissions: Permission[];
}

// Dashboard Types
export interface DashboardStats {
  totalTasks: number;
  completedTasks: number;
  upcomingDeadlines: number;
  delayedTasks: number;
  pendingDeliveries: number;
  projectProgress: number;
  pendingApprovals: number;
  activeUsers: number;
  qaAlerts: {
    total: number;
    pending: number;
    overdue: number;
    completed: number;
  };
}

// Real-time Types
export interface RealtimePayload<T = any> {
  eventType: 'INSERT' | 'UPDATE' | 'DELETE';
  new?: T;
  old?: T;
  table: string;
  schema: string;
}

// Filter/Search Types
export interface TaskFilters {
  status?: TaskStatus[];
  priority?: TaskPriority[];
  assigned_to?: string[];
  date_range?: {
    start: string;
    end: string;
  };
  search?: string;
}

export interface DeliveryFilters {
  status?: DeliveryStatus[];
  supplier_id?: string[];
  date_range?: {
    start: string;
    end: string;
  };
  search?: string;
}

// Export/Import Types
export interface ExportOptions {
  format: 'pdf' | 'excel' | 'csv';
  date_range?: {
    start: string;
    end: string;
  };
  include_attachments?: boolean;
}

export interface ImportResult {
  success: boolean;
  imported_count: number;
  errors: string[];
  warnings: string[];
}

// Authentication Types
export interface AuthUser {
  id: string;
  email: string;
  user_metadata: Record<string, any>;
  app_metadata: Record<string, any>;
}

export interface AuthSession {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  user: AuthUser;
}

// Supabase specific types
export type Database = {
  public: {
    Tables: {
      users: {
        Row: User;
        Insert: Omit<User, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<User, 'id' | 'created_at' | 'updated_at'>>;
      };
      projects: {
        Row: Project;
        Insert: Omit<Project, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Project, 'id' | 'created_at' | 'updated_at'>>;
      };
      tasks: {
        Row: Task;
        Insert: Omit<Task, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Task, 'id' | 'created_at' | 'updated_at'>>;
      };
      deliveries: {
        Row: Delivery;
        Insert: Omit<Delivery, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Delivery, 'id' | 'created_at' | 'updated_at'>>;
      };
      qa_alerts: {
        Row: QAAlert;
        Insert: Omit<QAAlert, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<QAAlert, 'id' | 'created_at' | 'updated_at'>>;
      };
      notifications: {
        Row: Notification;
        Insert: Omit<Notification, 'id' | 'created_at'>;
        Update: Partial<Omit<Notification, 'id' | 'created_at'>>;
      };
      suppliers: {
        Row: Supplier;
        Insert: Omit<Supplier, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Supplier, 'id' | 'created_at' | 'updated_at'>>;
      };
    };
    Views: {
      project_dashboard_stats: {
        Row: ProjectDashboardStats;
      };
      task_details: {
        Row: TaskDetails;
      };
    };
    Functions: {
      get_user_project_role: {
        Args: { user_uuid: string; project_uuid: string };
        Returns: UserRole;
      };
      can_user_perform_action: {
        Args: { user_uuid: string; project_uuid: string; required_roles: UserRole[] };
        Returns: boolean;
      };
      generate_public_share_token: {
        Args: {};
        Returns: string;
      };
    };
  };
}; 