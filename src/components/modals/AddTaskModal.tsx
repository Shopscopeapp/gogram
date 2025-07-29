import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, X, User, Calendar, Clock, Palette, Package, Truck } from 'lucide-react';
import { format, addDays } from 'date-fns';
import { useAppStore } from '../../store';
import { Task } from '../../types';
import toast from 'react-hot-toast';

interface AddTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddTask: (taskData: Omit<Task, 'id' | 'created_at' | 'updated_at'>) => void;
  initialData?: Partial<Task>;
  isEditMode?: boolean;
}

export default function AddTaskModal({ 
  isOpen, 
  onClose, 
  onAddTask, 
  initialData, 
  isEditMode = false 
}: AddTaskModalProps) {
  const { currentProject, currentUser, suppliers, users } = useAppStore();
  const [formData, setFormData] = useState({
    title: initialData?.title || '',
    description: initialData?.description || '',
    category: initialData?.category || 'General',
    priority: initialData?.priority || 'medium' as const,
    status: initialData?.status || 'pending' as const,
    start_date: initialData?.start_date ? format(new Date(initialData.start_date), 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'),
    planned_duration: initialData?.planned_duration || 1,
    color: initialData?.color || '#3b82f6',
    assigned_to: initialData?.assigned_to || currentUser?.id || '',
    dependencies: initialData?.dependencies || [] as string[],
    // Supplier/Procurement fields
    primary_supplier_id: initialData?.primary_supplier_id || '',
    requires_materials: initialData?.requires_materials || false,
    material_delivery_date: initialData?.material_delivery_date ? format(new Date(initialData.material_delivery_date), 'yyyy-MM-dd') : '',
    procurement_notes: initialData?.procurement_notes || ''
  });

  React.useEffect(() => {
    if (isOpen && !isEditMode) {
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
    } else if (isOpen && isEditMode && initialData) {
      setFormData({
        title: initialData.title || '',
        description: initialData.description || '',
        category: initialData.category || 'General',
        priority: initialData.priority || 'medium',
        status: initialData.status || 'pending', 
        start_date: initialData.start_date ? format(new Date(initialData.start_date), 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'),
        planned_duration: initialData.planned_duration || 1,
        color: initialData.color || '#3b82f6',
        assigned_to: initialData.assigned_to || currentUser?.id || '',
        dependencies: initialData.dependencies || [],
        // Supplier/Procurement fields
        primary_supplier_id: initialData.primary_supplier_id || '',
        requires_materials: initialData.requires_materials || false,
        material_delivery_date: initialData.material_delivery_date ? format(new Date(initialData.material_delivery_date), 'yyyy-MM-dd') : '',
        procurement_notes: initialData.procurement_notes || ''
      });
    }
  }, [isOpen, isEditMode, initialData, currentUser]);

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
      progress_percentage: initialData?.progress_percentage || 0,
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
    toast.success(isEditMode ? 'Task updated successfully!' : 'Task added successfully!');
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
                <h2 className="text-xl font-semibold text-gray-900">
                  {isEditMode ? 'Edit Task' : 'Add New Task'}
                </h2>
                <p className="text-sm text-gray-600">
                  {isEditMode ? 'Update task details' : 'Create a new task for your construction project'}
                </p>
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
              <label className="block text-sm font-medium text-gray-700 mb-1">Task Title *</label>
              <input
                type="text"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Enter task title..."
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                rows={3}
                placeholder="Task description..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                >
                  {categoryOptions.map((category) => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
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
          </div>

          {/* Schedule */}
          <div className="space-y-4">
            <h3 className="font-medium text-gray-900 flex items-center">
              <Calendar className="w-4 h-4 mr-2 text-green-500" />
              Schedule
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                <input
                  type="date"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  value={formData.start_date}
                  onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Duration (days)</label>
                <input
                  type="number"
                  min="1"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  value={formData.planned_duration}
                  onChange={(e) => setFormData({ ...formData, planned_duration: parseInt(e.target.value) || 1 })}
                />
              </div>
            </div>
          </div>

          {/* Assignment */}
          <div className="space-y-4">
            <h3 className="font-medium text-gray-900 flex items-center">
              <User className="w-4 h-4 mr-2 text-purple-500" />
              Assignment
            </h3>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Assigned To</label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                value={formData.assigned_to}
                onChange={(e) => setFormData({ ...formData, assigned_to: e.target.value })}
              >
                <option value="">Select team member...</option>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.full_name} ({user.role.replace('_', ' ')})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Visual */}
          <div className="space-y-4">
            <h3 className="font-medium text-gray-900 flex items-center">
              <Palette className="w-4 h-4 mr-2 text-yellow-500" />
              Visual
            </h3>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Task Color</label>
              <div className="flex flex-wrap gap-2">
                {colorOptions.map((color) => (
                  <button
                    key={color.value}
                    type="button"
                    className={`w-8 h-8 rounded-full border-2 transition-all ${
                      formData.color === color.value
                        ? 'border-gray-900 scale-110'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                    style={{ backgroundColor: color.value }}
                    onClick={() => setFormData({ ...formData, color: color.value })}
                    title={color.name}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Procurement */}
          <div className="space-y-4">
            <h3 className="font-medium text-gray-900 flex items-center">
              <Package className="w-4 h-4 mr-2 text-orange-500" />
              Materials & Procurement
            </h3>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="requires_materials"
                className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                checked={formData.requires_materials}
                onChange={(e) => setFormData({ ...formData, requires_materials: e.target.checked })}
              />
              <label htmlFor="requires_materials" className="text-sm font-medium text-gray-700">
                This task requires materials
              </label>
            </div>

            {formData.requires_materials && (
              <div className="space-y-4 pl-6 border-l-2 border-orange-200">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Primary Supplier</label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    value={formData.primary_supplier_id}
                    onChange={(e) => setFormData({ ...formData, primary_supplier_id: e.target.value })}
                  >
                    <option value="">Select supplier...</option>
                    {suppliers.map((supplier) => (
                      <option key={supplier.id} value={supplier.id}>
                        {supplier.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Material Delivery Date</label>
                  <input
                    type="date"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    value={formData.material_delivery_date}
                    onChange={(e) => setFormData({ ...formData, material_delivery_date: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Procurement Notes</label>
                  <textarea
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    rows={2}
                    placeholder="Material specifications, quantities, special requirements..."
                    value={formData.procurement_notes}
                    onChange={(e) => setFormData({ ...formData, procurement_notes: e.target.value })}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors flex items-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>{isEditMode ? 'Update Task' : 'Add Task'}</span>
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
} 