export type UserRole = 'project_manager' | 'project_coordinator' | 'subcontractor' | 'supplier' | 'viewer';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  company?: string;
  phone?: string;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  startDate: Date;
  endDate: Date;
  plannedDuration: number; // in days
  actualDuration?: number; // in days
  status: 'pending' | 'in_progress' | 'completed' | 'delayed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'critical';
  assignedTo?: User[];
  dependencies: string[]; // Task IDs that this task depends on
  linkedSuppliers?: Supplier[];
  linkedDeliveries?: Delivery[];
  color?: string;
  category: string;
  location?: string;
  notes?: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface TaskDelay {
  id: string;
  taskId: string;
  originalEndDate: Date;
  newEndDate: Date;
  reason: string;
  delayDays: number;
  reportedBy: string;
  reportedAt: Date;
}

export interface TaskChangeProposal {
  id: string;
  taskId: string;
  proposedStartDate?: Date;
  proposedEndDate?: Date;
  reason: string;
  proposedBy: string;
  proposedAt: Date;
  status: 'pending' | 'approved' | 'rejected';
  reviewedBy?: string;
  reviewedAt?: Date;
  reviewComments?: string;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  startDate: Date;
  endDate: Date;
  status: 'planning' | 'active' | 'completed' | 'on_hold' | 'cancelled';
  projectManager: User;
  coordinators: User[];
  tasks: Task[];
  publicShareLink?: string;
  isPublicLinkActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Supplier {
  id: string;
  name: string;
  email: string;
  phone?: string;
  company: string;
  specialties: string[];
  status: 'active' | 'inactive';
}

export interface Delivery {
  id: string;
  supplierId: string;
  taskId: string;
  item: string;
  quantity: number;
  unit: string;
  plannedDate: Date;
  actualDate?: Date;
  status: 'pending' | 'confirmed' | 'rejected' | 'delivered' | 'cancelled';
  confirmationStatus: 'pending' | 'confirmed' | 'rejected';
  notes?: string;
  estimatedValue?: number;
}

export interface DeliveryConfirmation {
  id: string;
  deliveryId: string;
  supplierId: string;
  response: 'confirmed' | 'rejected';
  responseDate: Date;
  newProposedDate?: Date;
  comments?: string;
}

export interface Notification {
  id: string;
  userId: string;
  type: 'task_update' | 'delivery_confirmation' | 'delay_report' | 'change_proposal' | 'qa_alert';
  title: string;
  message: string;
  data?: any;
  read: boolean;
  createdAt: Date;
}

export interface QAInspection {
  id: string;
  taskId: string;
  type: 'ITP' | 'pre_pour_checklist' | 'engineer_inspection';
  scheduledDate: Date;
  inspector?: string;
  status: 'scheduled' | 'completed' | 'failed' | 'cancelled';
  notes?: string;
  photos?: string[];
}

export interface Permission {
  resource: string;
  actions: ('create' | 'read' | 'update' | 'delete' | 'approve')[];
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
}

export interface GanttTask extends Task {
  x: number;
  y: number;
  width: number;
  height: number;
} 