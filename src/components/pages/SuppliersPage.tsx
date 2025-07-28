import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Truck, 
  Phone, 
  Mail, 
  Building,
  Package,
  CheckCircle,
  XCircle,
  Clock,
  Plus,
  X
} from 'lucide-react';
import { useAppStore } from '../../store';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import type { Supplier } from '../../types';

interface AddSupplierModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddSupplier: (supplierData: Omit<Supplier, 'id' | 'created_at' | 'updated_at'>) => void;
}

function AddSupplierModal({ isOpen, onClose, onAddSupplier }: AddSupplierModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    company: '',
    email: '',
    phone: '',
    address: '',
    specialties: [] as string[],
    rating: 5,
    notes: '',
    is_active: true
  });

  const [currentSpecialty, setCurrentSpecialty] = useState('');

  React.useEffect(() => {
    if (isOpen) {
      setFormData({
        name: '',
        company: '',
        email: '',
        phone: '',
        address: '',
        specialties: [],
        rating: 5,
        notes: '',
        is_active: true
      });
      setCurrentSpecialty('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim() || !formData.email.trim()) {
      toast.error('Name and email are required');
      return;
    }

    const supplierData: Omit<Supplier, 'id' | 'created_at' | 'updated_at'> = {
      name: formData.name.trim(),
      company: formData.company.trim() || undefined,
      email: formData.email.trim(),
      phone: formData.phone.trim() || undefined,
      address: formData.address.trim() || undefined,
      specialties: formData.specialties,
      rating: formData.rating,
      notes: formData.notes.trim() || undefined,
      is_active: formData.is_active
    };

    onAddSupplier(supplierData);
    onClose();
    toast.success(`✅ Supplier "${formData.name}" added successfully!`);
  };

  const addSpecialty = () => {
    if (currentSpecialty.trim() && !formData.specialties.includes(currentSpecialty.trim())) {
      setFormData({
        ...formData,
        specialties: [...formData.specialties, currentSpecialty.trim()]
      });
      setCurrentSpecialty('');
    }
  };

  const removeSpecialty = (specialty: string) => {
    setFormData({
      ...formData,
      specialties: formData.specialties.filter(s => s !== specialty)
    });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && currentSpecialty.trim()) {
      e.preventDefault();
      addSpecialty();
    }
  };

  const commonSpecialties = [
    'Concrete', 'Steel', 'Electrical', 'Plumbing', 'HVAC', 'Roofing', 
    'Masonry', 'Excavation', 'Flooring', 'Insulation', 'Drywall', 'Paint'
  ];

  return (
    <motion.div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
      >
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-primary-600 rounded-lg flex items-center justify-center">
                <Truck className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Add New Supplier</h2>
                <p className="text-sm text-gray-600">Add a new supplier to your construction project</p>
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

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Contact Name *</label>
                <input
                  type="text"
                  required
                  className="input"
                  placeholder="John Smith"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              <div>
                <label className="label">Company Name</label>
                <input
                  type="text"
                  className="input"
                  placeholder="ABC Construction Supply"
                  value={formData.company}
                  onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Email *</label>
                <input
                  type="email"
                  required
                  className="input"
                  placeholder="john@abcsupply.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>

              <div>
                <label className="label">Phone</label>
                <input
                  type="tel"
                  className="input"
                  placeholder="+1 (555) 123-4567"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label className="label">Address</label>
              <input
                type="text"
                className="input"
                placeholder="123 Industrial Blvd, City, State 12345"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              />
            </div>
          </div>

          {/* Specialties */}
          <div className="space-y-4">
            <h3 className="font-medium text-gray-900 flex items-center">
              <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
              Specialties & Services
            </h3>

            <div>
              <label className="label">Add Specialty</label>
              <div className="flex space-x-2">
                <input
                  type="text"
                  className="input flex-1"
                  placeholder="Enter specialty (e.g., Concrete, Steel, Electrical)"
                  value={currentSpecialty}
                  onChange={(e) => setCurrentSpecialty(e.target.value)}
                  onKeyPress={handleKeyPress}
                />
                <button
                  type="button"
                  onClick={addSpecialty}
                  className="btn btn-outline"
                  disabled={!currentSpecialty.trim()}
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Quick Add Specialties */}
            <div>
              <p className="text-sm text-gray-600 mb-2">Quick add common specialties:</p>
              <div className="flex flex-wrap gap-2">
                {commonSpecialties.map(specialty => (
                  <button
                    key={specialty}
                    type="button"
                    onClick={() => {
                      if (!formData.specialties.includes(specialty)) {
                        setFormData({
                          ...formData,
                          specialties: [...formData.specialties, specialty]
                        });
                      }
                    }}
                    disabled={formData.specialties.includes(specialty)}
                    className={`px-3 py-1 text-xs rounded-full border transition-colors ${
                      formData.specialties.includes(specialty)
                        ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {specialty}
                  </button>
                ))}
              </div>
            </div>

            {/* Current Specialties */}
            {formData.specialties.length > 0 && (
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Current specialties:</p>
                <div className="flex flex-wrap gap-2">
                  {formData.specialties.map(specialty => (
                    <span
                      key={specialty}
                      className="inline-flex items-center px-3 py-1 bg-primary-100 text-primary-800 text-xs rounded-full"
                    >
                      {specialty}
                      <button
                        type="button"
                        onClick={() => removeSpecialty(specialty)}
                        className="ml-2 text-primary-600 hover:text-primary-800"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Additional Information */}
          <div className="space-y-4">
            <h3 className="font-medium text-gray-900 flex items-center">
              <span className="w-2 h-2 bg-yellow-500 rounded-full mr-2"></span>
              Additional Information
            </h3>

            <div>
              <label className="label">Rating (1-5)</label>
              <div className="flex items-center space-x-2">
                <input
                  type="range"
                  min="1"
                  max="5"
                  className="flex-1"
                  value={formData.rating}
                  onChange={(e) => setFormData({ ...formData, rating: parseInt(e.target.value) })}
                />
                <span className="text-sm font-medium text-gray-700 w-8">{formData.rating}/5</span>
              </div>
              <div className="flex mt-1">
                {[1, 2, 3, 4, 5].map(star => (
                  <span
                    key={star}
                    className={`text-lg ${star <= formData.rating ? 'text-yellow-400' : 'text-gray-300'}`}
                  >
                    ★
                  </span>
                ))}
              </div>
            </div>

            <div>
              <label className="label">Notes</label>
              <textarea
                className="input"
                rows={3}
                placeholder="Additional notes about this supplier (quality, reliability, special requirements, etc.)"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              />
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="is_active"
                className="mr-3 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
              />
              <label htmlFor="is_active" className="text-sm font-medium text-gray-700">
                Mark as active supplier
              </label>
            </div>
          </div>

          {/* Submit Buttons */}
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
              <Truck className="w-4 h-4 mr-2" />
              Add Supplier
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}

export default function SuppliersPage() {
  const { suppliers, deliveries, tasks, addSupplier, currentProject } = useAppStore();
  const [showAddModal, setShowAddModal] = useState(false);

  // Filter suppliers to only show project-specific ones
  // In a real app, suppliers would have a project_id field
  // For now, we'll start with an empty array and only show suppliers added by the project manager
  const projectSuppliers = suppliers.filter(supplier => {
    // If no current project, show no suppliers
    if (!currentProject) return false;
    
    // For demo purposes, we'll only show suppliers that were specifically added to this project
    // In reality, this would check supplier.project_id === currentProject.id
    // For now, let's show an empty state to indicate no suppliers have been added for this project
    return false; // This will show the empty state
  });

  const getTaskTitle = (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    return task?.title || 'Unknown Task';
  };

  const getDeliveryStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed': return <CheckCircle className="w-5 h-5 text-success-600" />;
      case 'rejected': return <XCircle className="w-5 h-5 text-danger-600" />;
      default: return <Clock className="w-5 h-5 text-warning-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-success-100 text-success-800';
      case 'rejected': return 'bg-danger-100 text-danger-800';
      default: return 'bg-warning-100 text-warning-800';
    }
  };

  // Filter deliveries to only show those from project suppliers
  const projectDeliveries = deliveries.filter(delivery => 
    projectSuppliers.some(supplier => supplier.id === delivery.supplier_id)
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Suppliers</h1>
          <p className="text-gray-600 mt-1">Manage suppliers and track deliveries</p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="btn btn-primary btn-md"
        >
          <Truck className="w-4 h-4 mr-2" />
          Add Supplier
        </button>
      </div>

      {/* Suppliers Grid */}
      <div className="grid lg:grid-cols-2 gap-6">
        {projectSuppliers.length === 0 ? (
          <div className="col-span-2 p-12 text-center">
            <Truck className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <div>
              <p className="text-gray-500 mb-2">No suppliers have been added to this project yet.</p>
              <p className="text-sm text-gray-400">Add your first supplier to start managing project deliveries!</p>
            </div>
            <button 
              onClick={() => setShowAddModal(true)}
              className="mt-4 btn btn-primary btn-md"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add First Supplier
            </button>
          </div>
        ) : (
          projectSuppliers.map((supplier) => {
            const supplierDeliveries = projectDeliveries.filter(d => d.supplier_id === supplier.id);
            
            return (
              <motion.div
                key={supplier.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="card hover:shadow-lg transition-shadow duration-200"
              >
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-primary-600 rounded-xl flex items-center justify-center">
                        <Truck className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{supplier.name}</h3>
                        <p className="text-gray-600">{supplier.company}</p>
                      </div>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      supplier.is_active ? 'bg-success-100 text-success-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {supplier.is_active ? 'active' : 'inactive'}
                    </span>
                  </div>

                  {/* Contact Info */}
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center text-sm text-gray-600">
                      <Mail className="w-4 h-4 mr-3" />
                      {supplier.email}
                    </div>
                    {supplier.phone && (
                      <div className="flex items-center text-sm text-gray-600">
                        <Phone className="w-4 h-4 mr-3" />
                        {supplier.phone}
                      </div>
                    )}
                  </div>

                  {/* Specialties */}
                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-gray-900 mb-2">Specialties</h4>
                    <div className="flex flex-wrap gap-2">
                      {supplier.specialties.map((specialty, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-primary-100 text-primary-800 rounded-full text-xs font-medium"
                        >
                          {specialty}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Recent Deliveries */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-3">
                      Recent Deliveries ({supplierDeliveries.length})
                    </h4>
                    {supplierDeliveries.length > 0 ? (
                      <div className="space-y-2">
                        {supplierDeliveries.slice(0, 3).map((delivery) => (
                          <div key={delivery.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center space-x-3">
                              {getDeliveryStatusIcon(delivery.confirmation_status)}
                              <div>
                                <p className="text-sm font-medium text-gray-900">{delivery.item}</p>
                                <p className="text-xs text-gray-500">
                                  {getTaskTitle(delivery.task_id)} • {format(delivery.planned_date, 'MMM dd')}
                                </p>
                              </div>
                            </div>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(delivery.confirmation_status)}`}>
                              {delivery.confirmation_status}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500">No deliveries scheduled</p>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })
        )}
      </div>

      {/* Delivery Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="card p-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-gray-900">
              {projectSuppliers.length}
            </div>
            <div className="text-sm text-gray-600 mt-1">Total Suppliers</div>
          </div>
        </div>
        
        <div className="card p-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-success-600">
              {projectDeliveries.filter(d => d.confirmation_status === 'confirmed').length}
            </div>
            <div className="text-sm text-gray-600 mt-1">Confirmed</div>
          </div>
        </div>
        
        <div className="card p-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-warning-600">
              {projectDeliveries.filter(d => d.confirmation_status === 'pending').length}
            </div>
            <div className="text-sm text-gray-600 mt-1">Pending</div>
          </div>
        </div>
        
        <div className="card p-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-danger-600">
              {projectDeliveries.filter(d => d.confirmation_status === 'rejected').length}
            </div>
            <div className="text-sm text-gray-600 mt-1">Rejected</div>
          </div>
        </div>
      </div>

      {/* Recent Deliveries */}
      <div className="card">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Recent Deliveries</h3>
          <p className="text-sm text-gray-600 mt-1">Latest delivery updates from project suppliers</p>
        </div>
        <table className="min-w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Supplier
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Task
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Expected Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {projectDeliveries.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                  <Package className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                  <p>No deliveries scheduled for this project yet.</p>
                  <p className="text-sm mt-1">Add suppliers to start tracking deliveries.</p>
                </td>
              </tr>
            ) : (
              projectDeliveries.map((delivery) => {
                const supplier = projectSuppliers.find(s => s.id === delivery.supplier_id);
                return (
                  <tr key={delivery.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {supplier?.name || 'Unknown Supplier'}
                      </div>
                      <div className="text-sm text-gray-500">{supplier?.company}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{getTaskTitle(delivery.task_id)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {format(new Date(delivery.expected_date), 'MMM dd, yyyy')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {getDeliveryStatusIcon(delivery.confirmation_status)}
                        <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(delivery.confirmation_status)}`}>
                          {delivery.confirmation_status}
                        </span>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
                    </tbody>
        </table>
      </div>

      {/* Add Supplier Modal */}
      <AddSupplierModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAddSupplier={(supplierData) => {
          const newSupplier = {
            id: `supplier_${Date.now()}`,
            project_id: currentProject?.id || '', // Associate with current project
            ...supplierData,
            created_at: new Date(),
            updated_at: new Date()
          };
          addSupplier(newSupplier);
          toast.success(`${supplierData.name} has been added to the project!`);
        }}
      />
    </div>
  );
} 