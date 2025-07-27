import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  CheckSquare, 
  Plus, 
  Filter, 
  Search, 
  Calendar,
  Clock,
  User,
  AlertTriangle,
  MoreHorizontal,
  X
} from 'lucide-react';
import { useAppStore } from '../../store';
import { format, addDays } from 'date-fns';
import toast from 'react-hot-toast';
import type { Task } from '../../types';

interface AddTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddTask: (taskData: Omit<Task, 'id' | 'created_at' | 'updated_at'>) => void;
}

function AddTaskModal({ isOpen, onClose, onAddTask }: AddTaskModalProps) {
  const { currentProject, currentUser, suppliers, users } = useAppStore();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'General',
    priority: 'medium' as const,
    status: 'pending' as const,
    start_date: format(new Date(), 'yyyy-MM-dd'),
    planned_duration: 1,
    color: '#3b82f6',
    assigned_to: currentUser?.id || '',
    dependencies: [] as string[],
    // Supplier/Procurement fields
    primary_supplier_id: '',
    requires_materials: false,
    material_delivery_date: '',
    procurement_notes: ''
  });

  React.useEffect(() => {
    if (isOpen) {
      setFormData({
        title: '',
        description: '',
        category: 'General',
        priority: 'medium',
        status: 'pending',
        start_date: format(new Date(), 'yyyy-MM-dd'),
        planned_duration: 1,
        color: '#3b82f6',
        assigned_to: currentUser?.id || '',
        dependencies: [],
        // Supplier/Procurement fields
        primary_supplier_id: '',
        requires_materials: false,
        material_delivery_date: '',
        procurement_notes: ''
      });
    }
  }, [isOpen, currentUser]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const startDate = new Date(formData.start_date);
    const endDate = addDays(startDate, formData.planned_duration - 1);
    
    const taskData: Omit<Task, 'id' | 'created_at' | 'updated_at'> = {
      project_id: currentProject?.id || '',
      title: formData.title,
      description: formData.description,
      category: formData.category,
      location: '',
      status: formData.status,
      priority: formData.priority,
      assigned_to: formData.assigned_to,
      start_date: startDate,
      end_date: endDate,
      planned_duration: formData.planned_duration,
      progress_percentage: 0,
      color: formData.color,
      dependencies: formData.dependencies,
      // Supplier/Procurement fields
      primary_supplier_id: formData.primary_supplier_id || undefined,
      requires_materials: formData.requires_materials,
      material_delivery_date: formData.material_delivery_date ? new Date(formData.material_delivery_date) : undefined,
      procurement_notes: formData.procurement_notes || undefined,
      created_by: currentUser?.id || ''
    };

    onAddTask(taskData);
    onClose();
    toast.success('Task added successfully!');
  };

  const categoryOptions = [
    'General',
    'Site Work',
    'Foundation',
    'Structural',
    'Concrete',
    'Masonry',
    'Steel',
    'Roofing',
    'Electrical',
    'Plumbing',
    'HVAC',
    'Insulation',
    'Drywall',
    'Flooring',
    'Paint',
    'Landscaping'
  ];

  const colorOptions = [
    { name: 'Blue', value: '#3b82f6' },
    { name: 'Green', value: '#10b981' },
    { name: 'Yellow', value: '#f59e0b' },
    { name: 'Red', value: '#ef4444' },
    { name: 'Purple', value: '#8b5cf6' },
    { name: 'Pink', value: '#ec4899' },
    { name: 'Indigo', value: '#6366f1' },
    { name: 'Gray', value: '#6b7280' }
  ];

  return (
    <motion.div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
      >
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-primary-600 rounded-lg flex items-center justify-center">
                <Plus className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Add New Task</h2>
                <p className="text-sm text-gray-600">Create a new task for your construction project</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="font-medium text-gray-900 flex items-center">
              <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
              Basic Information
            </h3>

            <div>
              <label className="label">Task Title *</label>
              <input
                type="text"
                required
                className="input"
                placeholder="Enter task title..."
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </div>

            <div>
              <label className="label">Description</label>
              <textarea
                className="input"
                rows={3}
                placeholder="Task description..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Category</label>
                <select
                  className="input"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                >
                  {categoryOptions.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label">Assigned To</label>
                <select
                  className="input"
                  value={formData.assigned_to}
                  onChange={(e) => setFormData({ ...formData, assigned_to: e.target.value })}
                >
                  <option value="">Unassigned</option>
                  {users.map(user => (
                    <option key={user.id} value={user.id}>
                      {user.full_name} ({user.role})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Status</label>
                <select
                  className="input"
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                >
                  <option value="pending">Pending</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="delayed">Delayed</option>
                </select>
              </div>

              <div>
                <label className="label">Priority</label>
                <select
                  className="input"
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Start Date *</label>
                <input
                  type="date"
                  required
                  className="input"
                  value={formData.start_date}
                  onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                />
              </div>

              <div>
                <label className="label">Duration (days) *</label>
                <input
                  type="number"
                  required
                  min="1"
                  max="365"
                  className="input"
                  value={formData.planned_duration}
                  onChange={(e) => setFormData({ ...formData, planned_duration: parseInt(e.target.value) || 1 })}
                />
              </div>
            </div>

            <div>
              <label className="label">Task Color</label>
              <div className="grid grid-cols-4 gap-2 mt-2">
                {colorOptions.map(color => (
                  <button
                    key={color.value}
                    type="button"
                    className={`p-3 rounded-lg border-2 transition-all ${
                      formData.color === color.value
                        ? 'border-gray-900 scale-105'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    style={{ backgroundColor: color.value }}
                    onClick={() => setFormData({ ...formData, color: color.value })}
                    title={color.name}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Supplier/Procurement Section */}
          <div className="border-t border-gray-200 pt-4">
            <h4 className="font-medium text-gray-900 mb-3 flex items-center">
              <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
              Material & Supplier Management
            </h4>
            
            <div className="space-y-4">
              {/* Requires Materials Toggle */}
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="requires_materials"
                  className="mr-3 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  checked={formData.requires_materials}
                  onChange={(e) => setFormData({ ...formData, requires_materials: e.target.checked })}
                />
                <label htmlFor="requires_materials" className="text-sm font-medium text-gray-700">
                  This task requires material deliveries
                </label>
              </div>

              {/* Supplier Selection - Only show if materials required */}
              {formData.requires_materials && (
                <>
                  <div>
                    <label className="label">Primary Supplier</label>
                    <select
                      className="input"
                      value={formData.primary_supplier_id}
                      onChange={(e) => setFormData({ ...formData, primary_supplier_id: e.target.value })}
                    >
                      <option value="">Select a supplier...</option>
                      {suppliers.map(supplier => (
                        <option key={supplier.id} value={supplier.id}>
                          {supplier.name} {supplier.company ? `(${supplier.company})` : ''} 
                          {supplier.specialties.length > 0 ? ` - ${supplier.specialties.slice(0, 2).join(', ')}` : ''}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="label">Material Delivery Date</label>
                    <input
                      type="date"
                      className="input"
                      value={formData.material_delivery_date}
                      onChange={(e) => setFormData({ ...formData, material_delivery_date: e.target.value })}
                      min={formData.start_date}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Leave empty to auto-calculate based on task start date
                    </p>
                  </div>

                  <div>
                    <label className="label">Procurement Notes</label>
                    <textarea
                      className="input"
                      rows={3}
                      placeholder="Material specifications, delivery requirements, special instructions..."
                      value={formData.procurement_notes}
                      onChange={(e) => setFormData({ ...formData, procurement_notes: e.target.value })}
                    />
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-outline"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Task
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}

export default function TasksPage() {
  const { tasks, currentUser, updateTask, suppliers, addTask } = useAppStore();
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         task.category.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesFilter = filter === 'all' || task.status === filter;
    
    return matchesSearch && matchesFilter;
  });

  const handleStatusUpdate = (taskId: string, newStatus: string) => {
    updateTask(taskId, { status: newStatus as any });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-success-100 text-success-800 border-success-200';
      case 'in_progress': return 'bg-primary-100 text-primary-800 border-primary-200';
      case 'delayed': return 'bg-danger-100 text-danger-800 border-danger-200';
      case 'pending': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-danger-100 text-danger-800';
      case 'high': return 'bg-warning-100 text-warning-800';
      case 'medium': return 'bg-primary-100 text-primary-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filterOptions = [
    { value: 'all', label: 'All Tasks', count: tasks.length },
    { value: 'pending', label: 'Pending', count: tasks.filter(t => t.status === 'pending').length },
    { value: 'in_progress', label: 'In Progress', count: tasks.filter(t => t.status === 'in_progress').length },
    { value: 'completed', label: 'Completed', count: tasks.filter(t => t.status === 'completed').length },
    { value: 'delayed', label: 'Delayed', count: tasks.filter(t => t.status === 'delayed').length }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tasks</h1>
          <p className="text-gray-600 mt-1">Manage and track all project tasks</p>
        </div>
        <div className="flex items-center space-x-3">
          <button className="btn btn-secondary btn-md">
            <Filter className="w-4 h-4 mr-2" />
            Filter
          </button>
          <button 
            onClick={() => setShowAddModal(true)}
            className="btn btn-primary btn-md"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Task
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search tasks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input pl-10"
          />
        </div>
        <div className="flex space-x-2 overflow-x-auto pb-2">
          {filterOptions.map(option => (
            <button
              key={option.value}
              onClick={() => setFilter(option.value)}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                filter === option.value
                  ? 'bg-primary-600 text-white'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              {option.label} ({option.count})
            </button>
          ))}
        </div>
      </div>

      {/* Tasks Grid */}
      <div className="grid gap-4">
        {filteredTasks.length > 0 ? (
          filteredTasks.map((task) => (
            <motion.div
              key={task.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="card hover:shadow-lg transition-shadow duration-200"
            >
              <div className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4 flex-1">
                    {/* Task Color Indicator */}
                    <div 
                      className="w-4 h-4 rounded-full mt-1 flex-shrink-0"
                      style={{ backgroundColor: task.color }}
                    />
                    
                    {/* Task Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {task.title}
                        </h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(task.priority)}`}>
                          {task.priority}
                        </span>
                      </div>
                      
                      {task.description && (
                        <p className="text-gray-600 mb-3">{task.description}</p>
                      )}
                      
                      <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                        <div className="flex items-center">
                          <Calendar className="w-4 h-4 mr-1" />
                          {format(task.start_date, 'MMM dd')} - {format(task.end_date, 'MMM dd')}
                        </div>
                        <div className="flex items-center">
                          <Clock className="w-4 h-4 mr-1" />
                          {task.planned_duration} days
                        </div>
                        <div className="flex items-center">
                          <CheckSquare className="w-4 h-4 mr-1" />
                          {task.category}
                        </div>
                        {task.location && (
                          <div className="flex items-center">
                            <User className="w-4 h-4 mr-1" />
                            {task.location}
                          </div>
                        )}
                        {task.primary_supplier_id && (() => {
                          const supplier = suppliers.find(s => s.id === task.primary_supplier_id);
                          return supplier ? (
                            <div className="flex items-center">
                              <span className="w-4 h-4 mr-1">🚚</span>
                              {supplier.name}
                            </div>
                          ) : null;
                        })()}
                        {task.requires_materials && (
                          <div className="flex items-center">
                            <span className="w-4 h-4 mr-1">📦</span>
                            Requires Materials
                          </div>
                        )}
                      </div>

                      {/* Dependencies */}
                      {task.dependencies.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-gray-200">
                          <div className="flex items-center text-sm text-gray-500">
                            <AlertTriangle className="w-4 h-4 mr-1" />
                            Depends on {task.dependencies.length} task(s)
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Status and Actions */}
                  <div className="flex items-center space-x-3">
                    <select
                      value={task.status}
                      onChange={(e) => handleStatusUpdate(task.id, e.target.value)}
                      className={`px-3 py-1 rounded-full text-sm font-medium border focus:outline-none focus:ring-2 focus:ring-primary-500 ${getStatusColor(task.status)}`}
                      disabled={!currentUser || currentUser.role === 'viewer'}
                    >
                      <option value="pending">Pending</option>
                      <option value="in_progress">In Progress</option>
                      <option value="completed">Completed</option>
                      <option value="delayed">Delayed</option>
                    </select>
                    
                    <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg">
                      <MoreHorizontal className="w-5 h-5" />
                    </button>
                  </div>
                </div>
                
                {/* Progress Bar for In Progress Tasks */}
                {task.status === 'in_progress' && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="flex justify-between text-sm text-gray-600 mb-2">
                      <span>Progress</span>
                      <span>60%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-primary-600 h-2 rounded-full w-3/5"></div>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          ))
        ) : (
          <div className="text-center py-12">
            <CheckSquare className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No tasks found</h3>
            <p className="text-gray-600 mb-6">
              {searchQuery 
                ? `No tasks match "${searchQuery}"`
                : `No ${filter === 'all' ? '' : filter} tasks available`
              }
            </p>
            <button className="btn btn-primary btn-md">
              <Plus className="w-4 h-4 mr-2" />
              Create New Task
            </button>
          </div>
        )}
      </div>

      {/* Task Summary Stats */}
      {filteredTasks.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="card p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">
                {tasks.filter(t => t.status === 'completed').length}
              </div>
              <div className="text-sm text-success-600">Completed</div>
            </div>
          </div>
          <div className="card p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">
                {tasks.filter(t => t.status === 'in_progress').length}
              </div>
              <div className="text-sm text-primary-600">In Progress</div>
            </div>
          </div>
          <div className="card p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">
                {tasks.filter(t => t.status === 'pending').length}
              </div>
              <div className="text-sm text-warning-600">Pending</div>
            </div>
          </div>
          <div className="card p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">
                {tasks.filter(t => t.status === 'delayed').length}
              </div>
              <div className="text-sm text-danger-600">Delayed</div>
            </div>
          </div>
        </div>
      )}

      {/* Add Task Modal */}
      <AddTaskModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAddTask={(taskData) => {
          const newTask = {
            id: `task_${Date.now()}`,
            ...taskData,
            created_at: new Date(),
            updated_at: new Date()
          };
          addTask(newTask);
        }}
      />
    </div>
  );
} 