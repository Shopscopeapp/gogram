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
  // ITP fields
  itp_requirements?: string[]; // Array of ITP template IDs
  // Construction-specific fields
  phase?: string; // e.g., "Foundation", "Framing", "MEP"
  sub_phase?: string; // e.g., "Excavation", "Formwork", "Pour"
  predecessors?: string[]; // Task IDs that must complete before this task
  successors?: string[]; // Task IDs that depend on this task
  lag_days?: number; // Days to wait after predecessor completes
  lead_days?: number; // Days to start before predecessor completes
  float_days?: number; // Total float (slack) in days
  free_float_days?: number; // Free float in days
  is_critical?: boolean; // Part of critical path
  resource_names?: string[]; // Assigned resources/crews
  crew_size?: number; // Number of workers needed
  equipment_needed?: string[]; // Required equipment
  weather_dependent?: boolean; // Affected by weather
  work_hours_per_day?: number; // Default 8, can be adjusted
  work_days_per_week?: number; // Default 5, can be adjusted
  cost_per_day?: number; // Daily cost for this task
  total_cost?: number; // Total cost for this task
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
  project_id: string;
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

export interface DeliveryResponse {
  id: string;
  delivery_id: string;
  supplier_id: string;
  response: 'confirm' | 'deny';
  comments?: string;
  alternative_date?: Date;
  responded_at: Date;
  created_at: Date;
  updated_at: Date;
  // Joined data for display
  delivery: {
    item: string;
    planned_date: Date;
    task_title: string;
  };
  supplier: {
    company_name: string;
    contact_name: string;
    email: string;
  };
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

export interface TaskGroup {
  id: string;
  name: string;
  phase: string;
  sub_phase?: string;
  color: string;
  is_expanded: boolean;
  tasks: Task[];
  created_at: Date;
  updated_at: Date;
}

// ITP (Inspection and Test Plan) Types
export interface ITPTemplate {
  id: string;
  name: string;
  description?: string;
  category: string;
  type: 'structural' | 'electrical' | 'plumbing' | 'hvac' | 'fire_safety' | 'accessibility' | 'environmental' | 'general';
  priority: 'low' | 'medium' | 'high' | 'critical';
  requirements: ITPRequirement[];
  is_active: boolean;
  created_by?: string;
  created_at: Date;
  updated_at: Date;
}

export interface ITPRequirement {
  id: string;
  text: string;
  required: boolean;
  category: 'safety' | 'quality' | 'compliance' | 'documentation' | 'testing' | 'inspection';
  order: number;
  notes?: string;
}

export interface ITPInstance {
  id: string;
  template_id: string;
  task_id: string;
  project_id: string;
  status: 'pending' | 'in_progress' | 'completed' | 'overdue';
  assigned_to?: string;
  due_date?: Date;
  completed_by?: string;
  completed_at?: Date;
  requirements: ITPRequirementInstance[];
  notes?: string;
  created_at: Date;
  updated_at: Date;
}

export interface ITPRequirementInstance {
  id: string;
  requirement_id: string;
  text: string;
  required: boolean;
  category: 'safety' | 'quality' | 'compliance' | 'documentation' | 'testing' | 'inspection';
  order: number;
  completed: boolean;
  completed_by?: string;
  completed_at?: Date;
  notes?: string;
  evidence?: string; // URL to uploaded evidence
}

// Safety Types
export interface SafetyReport {
  id: string;
  project_id: string;
  report_type: 'monthly' | 'quarterly' | 'annual' | 'incident' | 'custom';
  title: string;
  summary: string;
  details: any; // JSON object with report details
  status: 'draft' | 'completed' | 'archived';
  created_by?: string;
  created_at: Date;
  updated_at: Date;
}

export interface SafetyTraining {
  id: string;
  project_id: string;
  title: string;
  description?: string;
  training_type: 'safety_orientation' | 'equipment_operation' | 'hazard_awareness' | 'emergency_procedures' | 'compliance_training' | 'custom';
  training_date: Date;
  duration_hours: number;
  instructor?: string;
  location?: string;
  attendees: string[]; // Array of user IDs
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  completion_rate?: number; // Percentage of attendees who completed
  notes?: string;
  created_by?: string;
  created_at: Date;
  updated_at: Date;
}

export interface SafetyInspection {
  id: string;
  project_id: string;
  inspection_type: 'routine' | 'scheduled' | 'incident_followup' | 'compliance' | 'custom';
  title: string;
  description?: string;
  inspection_date: Date;
  inspector_id?: string;
  location?: string;
  status: 'scheduled' | 'in_progress' | 'passed' | 'failed';
  severity: 'low' | 'medium' | 'high' | 'critical';
  findings: string[];
  corrective_actions?: string[];
  next_inspection_date?: Date;
  notes?: string;
  created_at: Date;
  updated_at: Date;
}

export interface SafetyCompliance {
  id: string;
  project_id: string;
  compliance_type: 'regulatory' | 'company_policy' | 'industry_standard' | 'contractual' | 'custom';
  title: string;
  description?: string;
  regulation_code?: string;
  check_date: Date;
  checked_by?: string;
  compliant: boolean;
  requirements: string[];
  findings?: string[];
  corrective_actions?: string[];
  next_review_date?: Date;
  notes?: string;
  created_at: Date;
  updated_at: Date;
} 