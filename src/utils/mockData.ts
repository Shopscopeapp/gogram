import type { User, Project, Task, Supplier, Delivery, TaskChangeProposal } from '../types';

// Mock Users
export const mockUsers: User[] = [
  {
    id: '1',
    name: 'Mike Thompson',
    email: 'mike.thompson@constructco.com',
    role: 'project_manager',
    company: 'ConstructCo Ltd',
    phone: '+1 (555) 123-4567',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face'
  },
  {
    id: '2',
    name: 'Sarah Wilson',
    email: 'sarah.wilson@constructco.com',
    role: 'project_coordinator',
    company: 'ConstructCo Ltd',
    phone: '+1 (555) 234-5678',
    avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b282?w=150&h=150&fit=crop&crop=face'
  },
  {
    id: '3',
    name: 'Jake Rodriguez',
    email: 'jake@steelworks.com',
    role: 'subcontractor',
    company: 'Steel Works Inc',
    phone: '+1 (555) 345-6789',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face'
  },
  {
    id: '4',
    name: 'Lisa Chen',
    email: 'lisa@concretesupply.com',
    role: 'supplier',
    company: 'Premium Concrete Supply',
    phone: '+1 (555) 456-7890',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face'
  },
  {
    id: '5',
    name: 'David Park',
    email: 'david@clientcorp.com',
    role: 'viewer',
    company: 'Client Corp',
    phone: '+1 (555) 567-8901',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face'
  }
];

// Mock Suppliers
export const mockSuppliers: Supplier[] = [
  {
    id: '1',
    name: 'Lisa Chen',
    email: 'lisa@concretesupply.com',
    phone: '+1 (555) 456-7890',
    company: 'Premium Concrete Supply',
    specialties: ['Concrete', 'Cement', 'Aggregates'],
    status: 'active'
  },
  {
    id: '2',
    name: 'Robert Taylor',
    email: 'robert@steelsuppliers.com',
    phone: '+1 (555) 678-9012',
    company: 'Industrial Steel Suppliers',
    specialties: ['Reinforcement Steel', 'Structural Steel', 'Mesh'],
    status: 'active'
  },
  {
    id: '3',
    name: 'Maria Gonzalez',
    email: 'maria@blocksupply.com',
    phone: '+1 (555) 789-0123',
    company: 'Metro Block Supply',
    specialties: ['Concrete Blocks', 'Bricks', 'Pavers'],
    status: 'active'
  }
];

// Mock Tasks
export const mockTasks: Task[] = [
  {
    id: '1',
    title: 'Site Preparation & Excavation',
    description: 'Clear site and excavate for foundation',
    startDate: new Date('2024-01-15'),
    endDate: new Date('2024-01-22'),
    plannedDuration: 7,
    actualDuration: 8,
    status: 'completed',
    priority: 'high',
    dependencies: [],
    category: 'Site Work',
    location: 'Site A',
    color: '#22c55e',
    createdBy: '1',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-22')
  },
  {
    id: '2',
    title: 'Foundation Formwork',
    description: 'Install formwork for concrete foundation',
    startDate: new Date('2024-01-23'),
    endDate: new Date('2024-01-26'),
    plannedDuration: 4,
    status: 'completed',
    priority: 'high',
    dependencies: ['1'],
    category: 'Concrete',
    location: 'Site A',
    color: '#3b82f6',
    createdBy: '1',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-26')
  },
  {
    id: '3',
    title: 'Foundation Concrete Pour',
    description: 'Pour concrete for foundation slab',
    startDate: new Date('2024-01-27'),
    endDate: new Date('2024-01-29'),
    plannedDuration: 3,
    status: 'in_progress',
    priority: 'critical',
    dependencies: ['2'],
    category: 'Concrete',
    location: 'Site A',
    color: '#ef4444',
    createdBy: '1',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-27')
  },
  {
    id: '4',
    title: 'Ground Floor Slab Formwork',
    description: 'Install formwork for ground floor slab',
    startDate: new Date('2024-02-01'),
    endDate: new Date('2024-02-05'),
    plannedDuration: 5,
    status: 'pending',
    priority: 'medium',
    dependencies: ['3'],
    category: 'Concrete',
    location: 'Site A',
    color: '#f59e0b',
    createdBy: '1',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  },
  {
    id: '5',
    title: 'Reinforcement Installation - Ground Floor',
    description: 'Install steel reinforcement for ground floor slab',
    startDate: new Date('2024-02-06'),
    endDate: new Date('2024-02-08'),
    plannedDuration: 3,
    status: 'pending',
    priority: 'high',
    dependencies: ['4'],
    category: 'Steel',
    location: 'Site A',
    color: '#8b5cf6',
    createdBy: '1',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  },
  {
    id: '6',
    title: 'Ground Floor Concrete Pour',
    description: 'Pour concrete for ground floor slab',
    startDate: new Date('2024-02-09'),
    endDate: new Date('2024-02-11'),
    plannedDuration: 3,
    status: 'pending',
    priority: 'critical',
    dependencies: ['5'],
    category: 'Concrete',
    location: 'Site A',
    color: '#ef4444',
    createdBy: '1',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  },
  {
    id: '7',
    title: 'First Floor Columns',
    description: 'Install formwork and pour concrete columns',
    startDate: new Date('2024-02-12'),
    endDate: new Date('2024-02-19'),
    plannedDuration: 8,
    status: 'pending',
    priority: 'high',
    dependencies: ['6'],
    category: 'Concrete',
    location: 'Site A',
    color: '#3b82f6',
    createdBy: '1',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  },
  {
    id: '8',
    title: 'Block Work - Ground Floor',
    description: 'Install concrete block walls on ground floor',
    startDate: new Date('2024-02-15'),
    endDate: new Date('2024-02-25'),
    plannedDuration: 11,
    status: 'pending',
    priority: 'medium',
    dependencies: ['6'],
    category: 'Masonry',
    location: 'Site A',
    color: '#06b6d4',
    createdBy: '1',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  }
];

// Mock Deliveries
export const mockDeliveries: Delivery[] = [
  {
    id: '1',
    supplierId: '1',
    taskId: '3',
    item: 'Ready Mix Concrete - 32MPa',
    quantity: 45,
    unit: 'm³',
    plannedDate: new Date('2024-01-27'),
    status: 'confirmed',
    confirmationStatus: 'confirmed',
    notes: 'Early morning delivery required',
    estimatedValue: 6750
  },
  {
    id: '2',
    supplierId: '2',
    taskId: '5',
    item: 'Steel Reinforcement Bars - 12mm',
    quantity: 2500,
    unit: 'kg',
    plannedDate: new Date('2024-02-05'),
    status: 'pending',
    confirmationStatus: 'pending',
    notes: 'Delivery to site compound',
    estimatedValue: 3750
  },
  {
    id: '3',
    supplierId: '1',
    taskId: '6',
    item: 'Ready Mix Concrete - 25MPa',
    quantity: 38,
    unit: 'm³',
    plannedDate: new Date('2024-02-09'),
    status: 'pending',
    confirmationStatus: 'pending',
    estimatedValue: 5320
  },
  {
    id: '4',
    supplierId: '3',
    taskId: '8',
    item: 'Concrete Blocks - 200mm',
    quantity: 1200,
    unit: 'units',
    plannedDate: new Date('2024-02-14'),
    status: 'pending',
    confirmationStatus: 'pending',
    notes: 'Crane required for unloading',
    estimatedValue: 4800
  }
];

// Mock Task Change Proposals
export const mockTaskChangeProposals: TaskChangeProposal[] = [
  {
    id: 'tcp-1',
    taskId: '5',
    proposedStartDate: new Date('2024-02-08'),
    proposedEndDate: new Date('2024-02-10'),
    reason: 'Steel delivery has been delayed by 2 days due to supplier scheduling conflicts. Need to adjust reinforcement installation accordingly.',
    proposedBy: '3',
    proposedAt: new Date('2024-01-25T14:30:00'),
    status: 'pending'
  },
  {
    id: 'tcp-2',
    taskId: '6',
    proposedStartDate: new Date('2024-02-12'),
    proposedEndDate: new Date('2024-02-14'),
    reason: 'Weather forecast shows heavy rain for Feb 9-11. Recommend moving concrete pour to avoid quality issues.',
    proposedBy: '2',
    proposedAt: new Date('2024-01-26T09:15:00'),
    status: 'pending'
  },
  {
    id: 'tcp-3',
    taskId: '8',
    proposedStartDate: new Date('2024-02-18'),
    proposedEndDate: new Date('2024-02-28'),
    reason: 'Block supplier has confirmed they can deliver earlier than expected. This allows us to start masonry work sooner.',
    proposedBy: '3',
    proposedAt: new Date('2024-01-26T16:45:00'),
    status: 'approved',
    reviewedBy: '1',
    reviewedAt: new Date('2024-01-27T08:30:00'),
    reviewComments: 'Approved - this helps us stay on schedule.'
  }
];

// Mock Project
export const mockProject: Project = {
  id: '1',
  name: 'Riverside Commercial Complex',
  description: 'Mixed-use commercial and office development with 3 levels and basement parking',
  startDate: new Date('2024-01-15'),
  endDate: new Date('2024-08-30'),
  status: 'active',
  projectManager: mockUsers[0],
  coordinators: [mockUsers[1]],
  tasks: mockTasks,
  publicShareLink: 'https://gogram.app/public/abc123xyz',
  isPublicLinkActive: true,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-27')
};

// Helper function to get current user based on role
export const getCurrentUser = (role: string = 'project_manager'): User => {
  return mockUsers.find(user => user.role === role) || mockUsers[0];
}; 