export type UserRole = 'project_manager' | 'project_coordinator' | 'subcontractor' | 'supplier' | 'viewer';

export interface User {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  avatar_url?: string;
  phone?: string;
  company?: string;
  specialties?: string[];
  created_at: Date;
  updated_at: Date;
}

export interface Task {
  id: string;
  project_id: string;
  title: string;
  description?: string;
  category: string;
  location?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'delayed';
  priority: 'low' | 'medium' | 'high' | 'critical';
  assigned_to?: string;
  start_date: Date;
  end_date: Date;
  actual_start_date?: Date;
  actual_end_date?: Date;
  planned_duration: number;
  actual_duration?: number;
  progress_percentage: number;
  color: string;
  dependencies: string[];
  notes?: string;
  attachments?: any[];
  // Supplier/Procurement fields
  primary_supplier_id?: string;
  requires_materials?: boolean;
  material_delivery_date?: Date;
  procurement_notes?: string;
  created_by?: string;
  created_at: Date;
  updated_at: Date;
}

export interface TaskDelay {
  id: string;
  task_id: string;
  original_end_date: Date;
  new_end_date: Date;
  delay_days: number;
  reason?: string;
  impact?: string;
  impact_assessment?: string;
  responsible_party?: string;
  mitigation_actions?: string;
  cost_impact?: number;
  reported_by?: string;
  created_at: Date;
}

export interface TaskChangeProposal {
  id: string;
  task_id: string;
  proposed_by?: string;
  status: 'pending' | 'approved' | 'rejected';
  proposed_start_date?: Date;
  proposed_end_date?: Date;
  reason: string;
  impact?: string;
  impact_description?: string;
  reviewed_by?: string;
  reviewed_at?: Date;
  created_at: Date;
  updated_at: Date;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  location?: string;
  client?: string;
  project_manager_id?: string;
  status: 'planning' | 'active' | 'on_hold' | 'completed' | 'cancelled';
  start_date: Date;
  end_date: Date;
  budget?: number;
  progress_percentage: number;
  created_at: Date;
  updated_at: Date;
}

export interface Supplier {
  id: string;
  name: string;
  company?: string;
  email: string;
  phone?: string;
  address?: string;
  specialties: string[];
  rating?: number;
  notes?: string;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface Delivery {
  id: string;
  project_id: string;
  task_id: string;
  supplier_id: string;
  item: string;
  quantity: number;
  unit: string;
  planned_date: Date;
  actual_date?: Date;
  confirmation_status: 'pending' | 'confirmed' | 'rejected';
  delivery_address?: string;
  notes?: string;
  confirmed_by?: string;
  confirmed_at?: Date;
  created_at: Date;
  updated_at: Date;
}

export interface DeliveryConfirmation {
  id: string;
  delivery_id: string;
  supplier_id: string;
  status: 'confirmed' | 'rejected';
  proposed_date?: Date;
  comments?: string;
  created_at: Date;
}

export interface Notification {
  id: string;
  user_id: string;
  type: 'task_update' | 'task_assignment' | 'delivery_update' | 'qa_alert' | 'approval_request' | 'system_message';
  title: string;
  message: string;
  data?: any;
  read: boolean;
  read_at?: Date;
  created_at: Date;
}

export interface QAInspection {
  id: string;
  project_id: string;
  task_id: string;
  type: 'itp_required' | 'pre_pour_checklist' | 'engineer_inspection' | 'quality_checkpoint' | 'compliance_check';
  status: 'pending' | 'in_progress' | 'completed' | 'overdue';
  title: string;
  description?: string;
  due_date?: Date;
  assigned_to?: string;
  checklist: QAChecklistItem[];
  priority: 'low' | 'medium' | 'high' | 'critical';
  completed_by?: string;
  completed_at?: Date;
  created_at: Date;
  updated_at: Date;
}

export interface QAAlert {
  id: string;
  project_id: string;
  task_id: string;
  type: 'itp_required' | 'pre_pour_checklist' | 'engineer_inspection' | 'quality_checkpoint' | 'compliance_check';
  status: 'pending' | 'in_progress' | 'completed' | 'overdue';
  title: string;
  description?: string;
  due_date?: Date;
  assigned_to?: string;
  checklist: QAChecklistItem[];
  priority: 'low' | 'medium' | 'high' | 'critical';
  completed_by?: string;
  completed_at?: Date;
  created_at: Date;
  updated_at: Date;
}

export interface QAChecklistItem {
  id: string;
  text: string;
  required: boolean;
  completed: boolean;
  completed_by?: string;
  completed_at?: Date;
  notes?: string;
}

export interface Permission {
  action: string;
  resource: string;
  condition?: any;
}

export interface RolePermissions {
  [key: string]: Permission[];
}

export interface DashboardStats {
  totalTasks: number;
  completedTasks: number;
  delayedTasks: number;
  upcomingDeadlines: number;
  pendingApprovals: number;
  activeDeliveries: number;
  qaAlerts: {
    total: number;
    pending: number;
    overdue: number;
    completed: number;
  };
}

export interface GanttTask extends Task {
  x: number;
  y: number;
  width: number;
  height: number;
} 