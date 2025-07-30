import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
  X,
  Grid3X3,
  List,
  BarChart3,
  TrendingUp,
  Users,
  MapPin,
  Package,
  Truck,
  Edit3,
  Trash2,
  Eye,
  Play,
  Pause,
  CheckCircle,
  Circle,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Star,
  Flag,
  Zap
} from 'lucide-react';
import { useAppStore } from '../../store';
import { format, addDays, differenceInDays, isToday, isPast, isFuture } from 'date-fns';
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
    toast.success('Task created successfully!');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Create New Task</h2>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Task Title *</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Enter task title"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="General">General</option>
                  <option value="Foundation">Foundation</option>
                  <option value="Structural">Structural</option>
                  <option value="Electrical">Electrical</option>
                  <option value="Plumbing">Plumbing</option>
                  <option value="HVAC">HVAC</option>
                  <option value="Interior">Interior</option>
                  <option value="Exterior">Exterior</option>
                  <option value="Landscaping">Landscaping</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Describe the task..."
              />
            </div>

            {/* Priority and Status */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value as any }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as any }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="pending">Pending</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="delayed">Delayed</option>
                </select>
              </div>
            </div>

            {/* Schedule */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
                <input
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => setFormData(prev => ({ ...prev, start_date: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Duration (days)</label>
                <input
                  type="number"
                  min="1"
                  value={formData.planned_duration}
                  onChange={(e) => setFormData(prev => ({ ...prev, planned_duration: parseInt(e.target.value) }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Assignment */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Assign To</label>
              <select
                value={formData.assigned_to}
                onChange={(e) => setFormData(prev => ({ ...prev, assigned_to: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="">Unassigned</option>
                {users.map(user => (
                  <option key={user.id} value={user.id}>
                    {user.full_name} ({user.role})
                  </option>
                ))}
              </select>
            </div>

            {/* Color */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Task Color</label>
              <div className="flex space-x-2">
                {['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#84cc16', '#f97316'].map(color => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, color }))}
                    className={`w-8 h-8 rounded-full border-2 ${
                      formData.color === color ? 'border-gray-900' : 'border-gray-300'
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>

            {/* Buttons */}
            <div className="flex space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 px-4 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium"
              >
                Create Task
              </button>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  );
}

export default function TasksPage() {
  const { tasks, currentUser, updateTask, suppliers, addTask } = useAppStore();
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'kanban' | 'grid'>('list');
  const [sortBy, setSortBy] = useState<'date' | 'priority' | 'status' | 'category'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [expandedTask, setExpandedTask] = useState<string | null>(null);

  const filteredAndSortedTasks = useMemo(() => {
    let filtered = tasks.filter(task => {
      const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           task.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           task.description?.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesFilter = filter === 'all' || task.status === filter;
      
      return matchesSearch && matchesFilter;
    });

    // Sort tasks
    filtered.sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'date':
          comparison = new Date(a.start_date).getTime() - new Date(b.start_date).getTime();
          break;
        case 'priority':
          const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
          comparison = (priorityOrder[a.priority as keyof typeof priorityOrder] || 0) - 
                      (priorityOrder[b.priority as keyof typeof priorityOrder] || 0);
          break;
        case 'status':
          const statusOrder = { pending: 1, in_progress: 2, completed: 3, delayed: 4 };
          comparison = (statusOrder[a.status as keyof typeof statusOrder] || 0) - 
                      (statusOrder[b.status as keyof typeof statusOrder] || 0);
          break;
        case 'category':
          comparison = a.category.localeCompare(b.category);
          break;
      }
      
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }, [tasks, filter, searchQuery, sortBy, sortOrder]);

  const handleStatusUpdate = (taskId: string, newStatus: string) => {
    updateTask(taskId, { status: newStatus as any });
    toast.success('Task status updated!');
  };

  const handleQuickAction = (taskId: string, action: string) => {
    switch (action) {
      case 'start':
        updateTask(taskId, { status: 'in_progress' });
        toast.success('Task started!');
        break;
      case 'complete':
        updateTask(taskId, { status: 'completed', progress_percentage: 100 });
        toast.success('Task completed!');
        break;
      case 'pause':
        updateTask(taskId, { status: 'pending' });
        toast.success('Task paused!');
        break;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800 border-green-200';
      case 'in_progress': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'delayed': return 'bg-red-100 text-red-800 border-red-200';
      case 'pending': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-blue-100 text-blue-800';
      case 'low': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'critical': return <Flag className="w-4 h-4" />;
      case 'high': return <Zap className="w-4 h-4" />;
      case 'medium': return <Star className="w-4 h-4" />;
      case 'low': return <Circle className="w-4 h-4" />;
      default: return <Circle className="w-4 h-4" />;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-4 h-4" />;
      case 'in_progress': return <Play className="w-4 h-4" />;
      case 'pending': return <Pause className="w-4 h-4" />;
      case 'delayed': return <AlertTriangle className="w-4 h-4" />;
      default: return <Circle className="w-4 h-4" />;
    }
  };

  const isTaskOverdue = (task: Task) => {
    return isPast(task.end_date) && task.status !== 'completed';
  };

  const isTaskDueToday = (task: Task) => {
    return isToday(task.end_date);
  };

  const filterOptions = [
    { value: 'all', label: 'All Tasks', count: tasks.length, icon: <List className="w-4 h-4" /> },
    { value: 'pending', label: 'Pending', count: tasks.filter(t => t.status === 'pending').length, icon: <Pause className="w-4 h-4" /> },
    { value: 'in_progress', label: 'In Progress', count: tasks.filter(t => t.status === 'in_progress').length, icon: <Play className="w-4 h-4" /> },
    { value: 'completed', label: 'Completed', count: tasks.filter(t => t.status === 'completed').length, icon: <CheckCircle className="w-4 h-4" /> },
    { value: 'delayed', label: 'Delayed', count: tasks.filter(t => t.status === 'delayed').length, icon: <AlertTriangle className="w-4 h-4" /> }
  ];

  const sortOptions = [
    { value: 'date', label: 'Date', icon: <Calendar className="w-4 h-4" /> },
    { value: 'priority', label: 'Priority', icon: <Flag className="w-4 h-4" /> },
    { value: 'status', label: 'Status', icon: <CheckSquare className="w-4 h-4" /> },
    { value: 'category', label: 'Category', icon: <Grid3X3 className="w-4 h-4" /> }
  ];

  const viewModes = [
    { value: 'list', label: 'List', icon: <List className="w-4 h-4" /> },
    { value: 'kanban', label: 'Kanban', icon: <BarChart3 className="w-4 h-4" /> },
    { value: 'grid', label: 'Grid', icon: <Grid3X3 className="w-4 h-4" /> }
  ];

  const taskStats = {
    total: tasks.length,
    completed: tasks.filter(t => t.status === 'completed').length,
    inProgress: tasks.filter(t => t.status === 'in_progress').length,
    pending: tasks.filter(t => t.status === 'pending').length,
    delayed: tasks.filter(t => t.status === 'delayed').length,
    overdue: tasks.filter(t => isTaskOverdue(t)).length,
    dueToday: tasks.filter(t => isTaskDueToday(t)).length
  };

  const renderTaskCard = (task: Task, index: number) => (
    <motion.div
      key={task.id}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className={`relative group bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-lg transition-all duration-200 ${
        isTaskOverdue(task) ? 'border-red-300 bg-red-50' : ''
      } ${isTaskDueToday(task) ? 'border-orange-300 bg-orange-50' : ''}`}
    >
      {/* Priority Indicator */}
      <div className="absolute top-4 left-4">
        <div className={`p-1 rounded-full ${getPriorityColor(task.priority)}`}>
          {getPriorityIcon(task.priority)}
        </div>
      </div>

      {/* Overdue/Due Today Badge */}
      {isTaskOverdue(task) && (
        <div className="absolute top-4 right-4">
          <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">
            Overdue
          </span>
        </div>
      )}
      {isTaskDueToday(task) && !isTaskOverdue(task) && (
        <div className="absolute top-4 right-4">
          <span className="px-2 py-1 text-xs font-medium bg-orange-100 text-orange-800 rounded-full">
            Due Today
          </span>
        </div>
      )}

      <div className="p-6 pt-12">
        {/* Task Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-primary-600 transition-colors">
              {task.title}
            </h3>
            {task.description && (
              <p className="text-gray-600 text-sm line-clamp-2 mb-3">
                {task.description}
              </p>
            )}
          </div>
        </div>

        {/* Task Meta Information */}
        <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
          <div className="flex items-center text-gray-500">
            <Calendar className="w-4 h-4 mr-2" />
            <span>{format(task.start_date, 'MMM dd')} - {format(task.end_date, 'MMM dd')}</span>
          </div>
          <div className="flex items-center text-gray-500">
            <Clock className="w-4 h-4 mr-2" />
            <span>{task.planned_duration} days</span>
          </div>
          <div className="flex items-center text-gray-500">
            <Grid3X3 className="w-4 h-4 mr-2" />
            <span>{task.category}</span>
          </div>
          <div className="flex items-center text-gray-500">
            <User className="w-4 h-4 mr-2" />
            <span>{task.assigned_to ? 'Assigned' : 'Unassigned'}</span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-4">
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>Progress</span>
            <span>{task.progress_percentage || 0}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-primary-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${task.progress_percentage || 0}%` }}
            />
          </div>
        </div>

        {/* Task Actions */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <select
              value={task.status}
              onChange={(e) => handleStatusUpdate(task.id, e.target.value)}
              className={`px-3 py-1 rounded-full text-xs font-medium border focus:outline-none focus:ring-2 focus:ring-primary-500 ${getStatusColor(task.status)}`}
              disabled={!currentUser || currentUser.role === 'viewer'}
            >
              <option value="pending">Pending</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="delayed">Delayed</option>
            </select>
          </div>
          
          <div className="flex items-center space-x-1">
            {task.status === 'pending' && (
              <button
                onClick={() => handleQuickAction(task.id, 'start')}
                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                title="Start Task"
              >
                <Play className="w-4 h-4" />
              </button>
            )}
            {task.status === 'in_progress' && (
              <>
                <button
                  onClick={() => handleQuickAction(task.id, 'complete')}
                  className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                  title="Complete Task"
                >
                  <CheckCircle className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleQuickAction(task.id, 'pause')}
                  className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                  title="Pause Task"
                >
                  <Pause className="w-4 h-4" />
                </button>
              </>
            )}
            <button
              onClick={() => setExpandedTask(expandedTask === task.id ? null : task.id)}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
              title="View Details"
            >
              {expandedTask === task.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Expanded Details */}
        <AnimatePresence>
          {expandedTask === task.id && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-4 pt-4 border-t border-gray-200"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                {/* Dependencies */}
                {task.dependencies.length > 0 && (
                  <div className="flex items-center text-gray-600">
                    <AlertTriangle className="w-4 h-4 mr-2" />
                    <span>Depends on {task.dependencies.length} task(s)</span>
                  </div>
                )}

                {/* Supplier Information */}
                {task.primary_supplier_id && (() => {
                  const supplier = suppliers.find(s => s.id === task.primary_supplier_id);
                  return supplier ? (
                    <div className="flex items-center text-gray-600">
                      <Truck className="w-4 h-4 mr-2" />
                      <span>{supplier.name}</span>
                    </div>
                  ) : null;
                })()}

                {/* Materials */}
                {task.requires_materials && (
                  <div className="flex items-center text-gray-600">
                    <Package className="w-4 h-4 mr-2" />
                    <span>Requires Materials</span>
                  </div>
                )}

                {/* Location */}
                {task.location && (
                  <div className="flex items-center text-gray-600">
                    <MapPin className="w-4 h-4 mr-2" />
                    <span>{task.location}</span>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );

  const renderKanbanView = () => {
    const columns = [
      { id: 'pending', title: 'Pending', tasks: filteredAndSortedTasks.filter(t => t.status === 'pending') },
      { id: 'in_progress', title: 'In Progress', tasks: filteredAndSortedTasks.filter(t => t.status === 'in_progress') },
      { id: 'completed', title: 'Completed', tasks: filteredAndSortedTasks.filter(t => t.status === 'completed') },
      { id: 'delayed', title: 'Delayed', tasks: filteredAndSortedTasks.filter(t => t.status === 'delayed') }
    ];

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {columns.map(column => (
          <div key={column.id} className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">{column.title}</h3>
              <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-600 rounded-full">
                {column.tasks.length}
              </span>
            </div>
            <div className="space-y-3">
              {column.tasks.map(task => (
                <div key={task.id} className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow">
                  <h4 className="font-medium text-gray-900 mb-2">{task.title}</h4>
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <span>{task.category}</span>
                    <div className={`px-2 py-1 rounded-full text-xs ${getPriorityColor(task.priority)}`}>
                      {task.priority}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Enhanced Header with Stats */}
      <div className="bg-gradient-to-r from-primary-50 to-blue-50 rounded-xl p-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Tasks</h1>
            <p className="text-gray-600 mt-1">Manage and track all project tasks</p>
          </div>
          <div className="flex items-center space-x-3">
            <button 
              onClick={() => setShowAddModal(true)}
              className="btn btn-primary btn-lg"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Task
            </button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 mt-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">{taskStats.total}</div>
            <div className="text-sm text-gray-600">Total</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{taskStats.completed}</div>
            <div className="text-sm text-gray-600">Completed</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{taskStats.inProgress}</div>
            <div className="text-sm text-gray-600">In Progress</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">{taskStats.pending}</div>
            <div className="text-sm text-gray-600">Pending</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">{taskStats.delayed}</div>
            <div className="text-sm text-gray-600">Delayed</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">{taskStats.overdue}</div>
            <div className="text-sm text-gray-600">Overdue</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">{taskStats.dueToday}</div>
            <div className="text-sm text-gray-600">Due Today</div>
          </div>
        </div>
      </div>

      {/* Enhanced Search and Controls */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search tasks by title, category, or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center space-x-2">
            {viewModes.map(mode => (
              <button
                key={mode.value}
                onClick={() => setViewMode(mode.value as any)}
                className={`p-2 rounded-lg transition-colors ${
                  viewMode === mode.value
                    ? 'bg-primary-100 text-primary-600'
                    : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
                }`}
                title={mode.label}
              >
                {mode.icon}
              </button>
            ))}
          </div>
        </div>

        {/* Filters and Sort */}
        <div className="flex flex-col sm:flex-row gap-4 mt-4">
          {/* Status Filters */}
          <div className="flex space-x-2 overflow-x-auto pb-2">
            {filterOptions.map(option => (
              <button
                key={option.value}
                onClick={() => setFilter(option.value)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                  filter === option.value
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {option.icon}
                <span>{option.label}</span>
                <span className="px-2 py-1 text-xs bg-white bg-opacity-20 rounded-full">
                  {option.count}
                </span>
              </button>
            ))}
          </div>

          {/* Sort Controls */}
          <div className="flex items-center space-x-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              {sortOptions.map(option => (
                <option key={option.value} value={option.value}>
                  Sort by {option.label}
                </option>
              ))}
            </select>
            <button
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              title={`Sort ${sortOrder === 'asc' ? 'Descending' : 'Ascending'}`}
            >
              {sortOrder === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      {viewMode === 'kanban' ? (
        renderKanbanView()
      ) : (
        <div className={`grid gap-6 ${
          viewMode === 'grid' 
            ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' 
            : 'grid-cols-1'
        }`}>
          {filteredAndSortedTasks.length > 0 ? (
            filteredAndSortedTasks.map((task, index) => renderTaskCard(task, index))
          ) : (
            <div className="col-span-full text-center py-12">
              <CheckSquare className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No tasks found</h3>
              <p className="text-gray-600 mb-6">
                {searchQuery 
                  ? `No tasks match "${searchQuery}"`
                  : `No ${filter === 'all' ? '' : filter} tasks available`
                }
              </p>
              <button 
                onClick={() => setShowAddModal(true)}
                className="btn btn-primary btn-md"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create New Task
              </button>
            </div>
          )}
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