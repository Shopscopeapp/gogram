import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Clock, Users, Plus, Filter, Settings, X } from 'lucide-react';
import { useAppStore } from '../../store';
import { format, addDays } from 'date-fns';
import GanttChart from '../gantt/GanttChart';
import type { Task } from '../../types';
import toast from 'react-hot-toast';

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
    'Finishing',
    'Quality Control'
  ];

  const colorOptions = [
    { name: 'Blue', value: '#3b82f6' },
    { name: 'Green', value: '#22c55e' },
    { name: 'Orange', value: '#f97316' },
    { name: 'Purple', value: '#8b5cf6' },
    { name: 'Red', value: '#ef4444' },
    { name: 'Yellow', value: '#eab308' },
    { name: 'Pink', value: '#ec4899' },
    { name: 'Gray', value: '#6b7280' }
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-white rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Add New Task</h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="label">Task Title *</label>
            <input
              type="text"
              required
              className="input"
              placeholder="Enter task title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            />
          </div>

          <div>
            <label className="label">Description</label>
            <textarea
              className="input"
              rows={3}
              placeholder="Enter task description"
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
              Add Task
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}

export default function SchedulePage() {
  const { tasks, currentProject, currentUser, addTask } = useAppStore();
  const [view, setView] = useState<'gantt' | 'list'>('gantt');
  const [showAddTaskModal, setShowAddTaskModal] = useState(false);

  if (!currentProject) {
    return <div>Loading...</div>;
  }

  // Sort tasks by start date for list view
  const sortedTasks = [...tasks].sort((a, b) => a.start_date.getTime() - b.start_date.getTime());

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-success-500';
      case 'in_progress': return 'bg-primary-500';
      case 'delayed': return 'bg-danger-500';
      case 'pending': return 'bg-gray-400';
      default: return 'bg-gray-300';
    }
  };

  const canEditSchedule = currentUser?.role === 'project_manager';

  const handleAddTask = (taskData: Omit<Task, 'id' | 'created_at' | 'updated_at'>) => {
    const newTask: Task = {
      ...taskData,
      id: Date.now().toString(), // In real app, this would be generated by database
      created_at: new Date(),
      updated_at: new Date()
    };
    
    addTask(newTask);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Project Schedule</h1>
          <p className="text-gray-600 mt-1">{currentProject.name}</p>
        </div>
        <div className="flex items-center space-x-3">
          {/* View Toggle */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setView('gantt')}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                view === 'gantt'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Gantt View
            </button>
            <button
              onClick={() => setView('list')}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                view === 'list'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              List View
            </button>
          </div>

          <div className="flex items-center space-x-2">
            <button className="btn btn-secondary btn-md">
              <Filter className="w-4 h-4 mr-2" />
              Filter
            </button>
            {canEditSchedule && (
              <button 
                onClick={() => setShowAddTaskModal(true)}
                className="btn btn-primary btn-md"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Task
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Schedule Content */}
      {view === 'gantt' ? (
        <div>
          {/* Interactive Gantt Chart */}
          <GanttChart />
          
          {/* Schedule Tips for Construction Workers */}
          <div className="mt-6 bg-primary-50 border border-primary-200 rounded-lg p-4">
            <h3 className="font-medium text-primary-900 mb-2">🏗️ Schedule Management Tips</h3>
            <div className="grid md:grid-cols-2 gap-4 text-sm text-primary-800">
              <div>
                <strong>Drag & Drop:</strong> Click and drag any task bar to reschedule it. Dependent tasks will automatically move.
              </div>
              <div>
                <strong>Dependencies:</strong> Tasks with chain icons depend on other tasks completing first.
              </div>
              <div>
                <strong>Colors:</strong> Green = completed, Blue = in progress, Red = delayed, Gray = pending.
              </div>
              <div>
                <strong>Zoom:</strong> Use +/- buttons to zoom in/out for better visibility of your timeline.
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* List View */
        <div className="space-y-4">
          <div className="card">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">All Tasks</h2>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {sortedTasks.map((task) => (
                  <motion.div
                    key={task.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center justify-between p-4 rounded-lg border border-gray-200 hover:border-primary-300 transition-colors"
                  >
                    <div className="flex items-center space-x-4">
                      <div 
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: task.color }}
                      />
                      <div>
                        <h3 className="font-medium text-gray-900">{task.title}</h3>
                        <p className="text-sm text-gray-500">
                          {format(task.start_date, 'MMM dd')} - {format(task.end_date, 'MMM dd')} • {task.category}
                        </p>
                        {task.description && (
                          <p className="text-sm text-gray-600 mt-1">{task.description}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        task.status === 'completed' ? 'bg-success-100 text-success-800' :
                        task.status === 'in_progress' ? 'bg-primary-100 text-primary-800' :
                        task.status === 'delayed' ? 'bg-danger-100 text-danger-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {task.status.replace('_', ' ')}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        task.priority === 'critical' ? 'bg-danger-100 text-danger-800' :
                        task.priority === 'high' ? 'bg-warning-100 text-warning-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {task.priority}
                      </span>
                      <div className="text-sm text-gray-500">
                        {task.planned_duration} days
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Schedule Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        <div className="card p-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-gray-900">{tasks.length}</div>
            <div className="text-sm text-gray-600 mt-1">Total Tasks</div>
          </div>
        </div>
        
        <div className="card p-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-success-600">
              {tasks.filter(t => t.status === 'completed').length}
            </div>
            <div className="text-sm text-gray-600 mt-1">Completed</div>
          </div>
        </div>
        
        <div className="card p-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-primary-600">
              {tasks.filter(t => t.status === 'in_progress').length}
            </div>
            <div className="text-sm text-gray-600 mt-1">In Progress</div>
          </div>
        </div>
        
        <div className="card p-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-danger-600">
              {tasks.filter(t => t.status === 'delayed').length}
            </div>
            <div className="text-sm text-gray-600 mt-1">Delayed</div>
          </div>
        </div>
      </div>

      {/* Project Timeline Overview */}
      <div className="card">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Project Timeline</h2>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Project Duration</span>
              <span className="font-medium">
                {format(currentProject.start_date, 'MMM dd, yyyy')} - {format(currentProject.end_date, 'MMM dd, yyyy')}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Progress</span>
              <span className="font-medium">
                {Math.round((tasks.filter(t => t.status === 'completed').length / tasks.length) * 100)}% Complete
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div 
                className="bg-gradient-to-r from-primary-500 to-primary-600 h-3 rounded-full transition-all duration-500"
                style={{ 
                  width: `${(tasks.filter(t => t.status === 'completed').length / tasks.length) * 100}%` 
                }}
              />
            </div>
            <div className="flex justify-between text-xs text-gray-500">
              <span>Started {format(currentProject.start_date, 'MMM dd')}</span>
              <span>Due {format(currentProject.end_date, 'MMM dd')}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Add Task Button */}
      <div className="fixed bottom-8 right-8 z-40">
        <button
          onClick={() => setShowAddTaskModal(true)}
          className="bg-primary-600 hover:bg-primary-700 text-white p-4 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 group"
          title="Quick Add Task"
        >
          <Plus className="w-6 h-6 group-hover:scale-110 transition-transform" />
        </button>
      </div>

      {/* Add Task Modal */}
      <AddTaskModal
        isOpen={showAddTaskModal}
        onClose={() => setShowAddTaskModal(false)}
        onAddTask={handleAddTask}
      />
    </div>
  );
} 