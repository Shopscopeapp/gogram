import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, X, Calendar, Clock, Palette, Package, Truck, FileText, Edit3, Link, Trash2 } from 'lucide-react';
import { format, addDays } from 'date-fns';
import { useAppStore } from '../../store';
import { Task, ITPTemplate } from '../../types';
import toast from 'react-hot-toast';
import { itpService } from '../../services/itpService';

interface AddTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddTask: (taskData: Omit<Task, 'id' | 'created_at' | 'updated_at'>) => void;
  onDeleteTask?: (taskId: string) => void;
  initialData?: Partial<Task>;
  isEditMode?: boolean;
}

export default function AddTaskModal({ 
  isOpen, 
  onClose, 
  onAddTask, 
  onDeleteTask,
  initialData, 
  isEditMode = false 
}: AddTaskModalProps) {
  const { currentProject, currentUser, suppliers, users, tasks } = useAppStore();
  const [formData, setFormData] = useState({
    title: initialData?.title || '',
    description: initialData?.description || '',
    category: initialData?.category || 'General',
    priority: initialData?.priority || 'medium' as const,
    status: initialData?.status || 'pending' as const,
    start_date: initialData?.start_date ? format(new Date(initialData.start_date), 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'),
    end_date: initialData?.end_date ? format(new Date(initialData.end_date), 'yyyy-MM-dd') : format(addDays(new Date(), 1), 'yyyy-MM-dd'),
    color: initialData?.color || '#3b82f6',
    dependencies: initialData?.dependencies || [] as string[],
    // Supplier/Procurement fields
    primary_supplier_id: initialData?.primary_supplier_id || '',
    requires_materials: initialData?.requires_materials || false,
    material_delivery_date: initialData?.material_delivery_date ? format(new Date(initialData.material_delivery_date), 'yyyy-MM-dd') : '',
    procurement_notes: initialData?.procurement_notes || '',
    // ITP fields
    itp_requirements: initialData?.itp_requirements || [] as string[]
  });

  // State for category management and ITP templates
  const [showCategoryInput, setShowCategoryInput] = useState(false);
  const [newCategory, setNewCategory] = useState('');
  const [itpTemplates, setItpTemplates] = useState<ITPTemplate[]>([]);
  const [loadingItpTemplates, setLoadingItpTemplates] = useState(false);
  const [categoryOptions, setCategoryOptions] = useState([
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
  ]);

      React.useEffect(() => {
      if (isOpen && !isEditMode) {
        setFormData({
          title: '',
          description: '',
          category: 'General',
          priority: 'medium',
          status: 'pending',
          start_date: format(new Date(), 'yyyy-MM-dd'),
          end_date: format(addDays(new Date(), 1), 'yyyy-MM-dd'),
          color: '#3b82f6',
          dependencies: [],
          // Supplier/Procurement fields
          primary_supplier_id: '',
          requires_materials: false,
          material_delivery_date: '',
          procurement_notes: '',
          // ITP fields
          itp_requirements: []
        });
      } else if (isOpen && isEditMode && initialData) {
        setFormData({
          title: initialData.title || '',
          description: initialData.description || '',
          category: initialData.category || 'General',
          priority: initialData.priority || 'medium',
          status: initialData.status || 'pending', 
          start_date: initialData.start_date ? format(new Date(initialData.start_date), 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'),
          end_date: initialData.end_date ? format(new Date(initialData.end_date), 'yyyy-MM-dd') : format(addDays(new Date(), 1), 'yyyy-MM-dd'),
          color: initialData.color || '#3b82f6',
          dependencies: initialData.dependencies || [],
          // Supplier/Procurement fields
          primary_supplier_id: initialData.primary_supplier_id || '',
          requires_materials: initialData.requires_materials || false,
          material_delivery_date: initialData.material_delivery_date ? format(new Date(initialData.material_delivery_date), 'yyyy-MM-dd') : '',
          procurement_notes: initialData.procurement_notes || '',
          // ITP fields
          itp_requirements: initialData.itp_requirements || []
        });
      }
    }, [isOpen, isEditMode, initialData, currentUser]);

    const loadItpTemplates = async () => {
      setLoadingItpTemplates(true);
      try {
        const result = await itpService.getITPTemplates();
        if (result.success && result.templates) {
          setItpTemplates(result.templates);
        } else {
          console.error('Failed to load ITP templates:', result.error);
        }
      } catch (error) {
        console.error('Error loading ITP templates:', error);
      } finally {
        setLoadingItpTemplates(false);
      }
    };

    // Load ITP templates when modal opens
    useEffect(() => {
      if (isOpen) {
        loadItpTemplates();
      }
    }, [isOpen]);

        const handleAddCategory = () => {
      if (newCategory.trim()) {
        const trimmedCategory = newCategory.trim();
        if (!categoryOptions.includes(trimmedCategory)) {
          setCategoryOptions([...categoryOptions, trimmedCategory]);
        }
        setFormData({ ...formData, category: trimmedCategory });
        setNewCategory('');
        setShowCategoryInput(false);
        toast.success('Category added successfully!');
      }
    };

    // Calculate duration in days
    const calculateDuration = () => {
      const startDate = new Date(formData.start_date);
      const endDate = new Date(formData.end_date);
      const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
      return diffDays;
    };

    // Early return must come after all hooks
    if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const startDate = new Date(formData.start_date);
    const endDate = new Date(formData.end_date);
    const plannedDuration = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    
    const taskData: Omit<Task, 'id' | 'created_at' | 'updated_at'> = {
      project_id: currentProject?.id || '',
      title: formData.title,
      description: formData.description,
      category: formData.category,
      location: '',
      status: formData.status,
      priority: formData.priority,
      start_date: startDate,
      end_date: endDate,
      planned_duration: plannedDuration,
      progress_percentage: initialData?.progress_percentage || 0,
      color: formData.color,
          dependencies: formData.dependencies,
    // Supplier/Procurement fields
    primary_supplier_id: formData.primary_supplier_id || undefined,
    requires_materials: formData.requires_materials,
    material_delivery_date: formData.material_delivery_date ? new Date(formData.material_delivery_date) : undefined,
    procurement_notes: formData.procurement_notes || undefined,
    // ITP fields
    itp_requirements: formData.itp_requirements
    };

    try {
      // Add the task first
      onAddTask(taskData);
      
      // Delivery creation is now handled automatically in the store's addTask method
      
      // If this is a new task and has ITP requirements, create ITP instances
      if (!isEditMode && formData.itp_requirements.length > 0 && currentProject?.id) {
        // We need to wait for the task to be created to get its ID
        // For now, we'll create a placeholder and update it later
        // This is a simplified approach - in a real app, you might want to handle this differently
        
        const itpPromises = formData.itp_requirements.map(async (templateId) => {
          try {
            await itpService.createITPInstance({
              template_id: templateId,
              task_id: '', // This will be updated after task creation
              project_id: currentProject.id,
              due_date: endDate
            });
          } catch (error) {
            console.error('Error creating ITP instance:', error);
          }
        });
        
        // Don't wait for ITP creation to complete - let it happen in background
        Promise.all(itpPromises).catch(error => {
          console.error('Error creating ITP instances:', error);
        });
      }
      
      onClose();
      toast.success(isEditMode ? 'Task updated successfully!' : 'Task added successfully!');
    } catch (error) {
      console.error('Error creating task:', error);
      toast.error('Failed to create task. Please try again.');
    }
  };

  const handleDelete = async () => {
    if (!initialData?.id || !onDeleteTask) return;
    
    const confirmDelete = window.confirm('Are you sure you want to delete this task? This action cannot be undone.');
    if (!confirmDelete) return;

    try {
      await onDeleteTask(initialData.id);
      onClose();
      toast.success('Task deleted successfully!');
    } catch (error) {
      console.error('Error deleting task:', error);
      toast.error('Failed to delete task. Please try again.');
    }
  };

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
                <div className="flex space-x-2">
                  <select
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  >
                    {categoryOptions.map((category) => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => setShowCategoryInput(!showCategoryInput)}
                    className="px-3 py-2 text-primary-600 border border-primary-300 rounded-md hover:bg-primary-50 transition-colors"
                    title="Add new category"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                </div>
                {showCategoryInput && (
                  <div className="mt-2 flex space-x-2">
                    <input
                      type="text"
                      placeholder="Enter new category..."
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleAddCategory()}
                    />
                    <button
                      type="button"
                      onClick={handleAddCategory}
                      className="px-3 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
                    >
                      Add
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowCategoryInput(false);
                        setNewCategory('');
                      }}
                      className="px-3 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                )}
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
                    onChange={(e) => {
                      const newStartDate = e.target.value;
                      const updates: Partial<typeof formData> = { start_date: newStartDate };
                      
                      // Auto-set material delivery date to start date if materials are required
                      if (formData.requires_materials && (!formData.material_delivery_date || formData.material_delivery_date < newStartDate)) {
                        updates.material_delivery_date = newStartDate;
                      }
                      
                      // Ensure end date is not before start date
                      if (formData.end_date && formData.end_date < newStartDate) {
                        updates.end_date = newStartDate;
                      }
                      
                      setFormData({ ...formData, ...updates });
                    }}
                  />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                <input
                  type="date"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  value={formData.end_date}
                  min={formData.start_date} // Can't be before start date
                  onChange={(e) => {
                    const newEndDate = e.target.value;
                    const updates: Partial<typeof formData> = { end_date: newEndDate };
                    
                    // Ensure material delivery date is not after end date
                    if (formData.requires_materials && formData.material_delivery_date && formData.material_delivery_date > newEndDate) {
                      updates.material_delivery_date = newEndDate;
                    }
                    
                    setFormData({ ...formData, ...updates });
                  }}
                />
              </div>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Duration:</span>
                <span className="text-sm text-gray-600">{calculateDuration()} days</span>
              </div>
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

          {/* Dependencies */}
          <div className="space-y-4">
            <h3 className="font-medium text-gray-900 flex items-center">
              <Link className="w-4 h-4 mr-2 text-indigo-500" />
              Dependencies
            </h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Predecessor Tasks</label>
              <div className="space-y-2 max-h-40 overflow-y-auto border border-gray-200 rounded-lg p-3">
                {tasks.length === 0 ? (
                  <div className="text-sm text-gray-500 text-center py-4">
                    No tasks available. Create some tasks first to set up dependencies.
                  </div>
                ) : (
                  <>
                    <div className="text-sm text-gray-500 mb-2">
                      Select tasks that must complete before this task starts:
                    </div>
                    {tasks.map((task) => (
                      <div key={task.id} className="flex items-start space-x-2">
                        <input
                          type="checkbox"
                          id={`dep_${task.id}`}
                          checked={formData.dependencies.includes(task.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFormData({
                                ...formData,
                                dependencies: [...formData.dependencies, task.id]
                              });
                            } else {
                              setFormData({
                                ...formData,
                                dependencies: formData.dependencies.filter(id => id !== task.id)
                              });
                            }
                          }}
                          className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500 mt-0.5"
                        />
                        <div className="flex-1">
                          <label htmlFor={`dep_${task.id}`} className="text-sm font-medium text-gray-700 cursor-pointer">
                            {task.title}
                          </label>
                          <div className="flex items-center space-x-2 mt-1">
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                              {task.category}
                            </span>
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                              {task.status}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                When you move this task, dependent tasks will automatically adjust their schedules.
              </p>
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
                onChange={(e) => {
                  const requiresMaterials = e.target.checked;
                  const updates: Partial<typeof formData> = { requires_materials: requiresMaterials };
                  
                  // Auto-set delivery date when enabling materials
                  if (requiresMaterials && !formData.material_delivery_date) {
                    updates.material_delivery_date = formData.start_date;
                  }
                  
                  setFormData({ ...formData, ...updates });
                }}
              />
              <label htmlFor="requires_materials" className="text-sm font-medium text-gray-700">
                This task requires materials
                {isEditMode && initialData?.requires_materials && (
                  <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                    📦 Has Delivery
                  </span>
                )}
              </label>
            </div>

            {formData.requires_materials && (
              <div className="space-y-4 pl-6 border-l-2 border-orange-200">
                {isEditMode && initialData?.requires_materials && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                    <div className="flex items-center">
                      <svg className="w-4 h-4 text-blue-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                      <span className="text-sm font-medium text-blue-900">
                        This task has an existing delivery scheduled
                      </span>
                    </div>
                    <p className="text-xs text-blue-700 mt-1">
                      Modifying supplier or delivery date will update the existing delivery
                    </p>
                  </div>
                )}
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Material Delivery Date
                    {formData.material_delivery_date === formData.start_date && (
                      <span className="ml-2 text-xs text-green-600 font-medium">
                        ✓ Same as start date
                      </span>
                    )}
                  </label>
                  <input
                    type="date"
                    className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                      formData.material_delivery_date === formData.start_date 
                        ? 'border-green-300 bg-green-50' 
                        : 'border-gray-300'
                    }`}
                    value={formData.material_delivery_date}
                    min={formData.start_date} // Can't be before task start date
                    max={formData.end_date}   // Can't be after task end date
                    onChange={(e) => setFormData({ ...formData, material_delivery_date: e.target.value })}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    📅 Delivery must be between task start ({formData.start_date || 'not set'}) and end dates ({formData.end_date || 'not set'})
                  </p>
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

          {/* ITP Requirements */}
          <div className="space-y-4">
            <h3 className="font-medium text-gray-900 flex items-center">
              <FileText className="w-4 h-4 mr-2 text-purple-500" />
              ITP Requirements
            </h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">ITP Templates</label>
              <div className="space-y-2 max-h-40 overflow-y-auto border border-gray-200 rounded-lg p-3">
                {loadingItpTemplates ? (
                  <div className="text-sm text-gray-500 text-center py-4">
                    Loading ITP templates...
                  </div>
                ) : itpTemplates.length === 0 ? (
                  <div className="text-sm text-gray-500 text-center py-4">
                    No ITP templates available. Create templates in the QA page first.
                  </div>
                ) : (
                  <>
                    <div className="text-sm text-gray-500 mb-2">
                      Select ITP templates that apply to this task:
                    </div>
                    {itpTemplates.map((template) => (
                      <div key={template.id} className="flex items-start space-x-2">
                        <input
                          type="checkbox"
                          id={`itp_${template.id}`}
                          checked={formData.itp_requirements.includes(template.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFormData({
                                ...formData,
                                itp_requirements: [...formData.itp_requirements, template.id]
                              });
                            } else {
                              setFormData({
                                ...formData,
                                itp_requirements: formData.itp_requirements.filter(id => id !== template.id)
                              });
                            }
                          }}
                          className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500 mt-0.5"
                        />
                        <div className="flex-1">
                          <label htmlFor={`itp_${template.id}`} className="text-sm font-medium text-gray-700 cursor-pointer">
                            {template.name}
                          </label>
                          {template.description && (
                            <p className="text-xs text-gray-500 mt-1">{template.description}</p>
                          )}
                          <div className="flex items-center space-x-2 mt-1">
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                              {template.type}
                            </span>
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                              {template.priority}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                ITP instances will be created automatically when the task is created.
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-between pt-6 border-t border-gray-200">
            {/* Delete button - only show in edit mode */}
            <div>
              {isEditMode && onDeleteTask && initialData?.id && (
                <button
                  type="button"
                  onClick={handleDelete}
                  className="px-4 py-2 text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors flex items-center space-x-2"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Delete Task</span>
                </button>
              )}
            </div>
            
            {/* Cancel and Submit buttons */}
            <div className="flex space-x-3">
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
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
} 