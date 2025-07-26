import React from 'react';
import { motion } from 'framer-motion';
import { 
  Truck, 
  Phone, 
  Mail, 
  Building,
  Package,
  CheckCircle,
  XCircle,
  Clock
} from 'lucide-react';
import { useAppStore } from '../../store';
import { format } from 'date-fns';

export default function SuppliersPage() {
  const { suppliers, deliveries, tasks } = useAppStore();

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Suppliers</h1>
          <p className="text-gray-600 mt-1">Manage suppliers and track deliveries</p>
        </div>
        <button className="btn btn-primary btn-md">
          <Truck className="w-4 h-4 mr-2" />
          Add Supplier
        </button>
      </div>

      {/* Suppliers Grid */}
      <div className="grid lg:grid-cols-2 gap-6">
        {suppliers.map((supplier) => {
          const supplierDeliveries = deliveries.filter(d => d.supplierId === supplier.id);
          
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
                    supplier.status === 'active' ? 'bg-success-100 text-success-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {supplier.status}
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
                            {getDeliveryStatusIcon(delivery.confirmationStatus)}
                            <div>
                              <p className="text-sm font-medium text-gray-900">{delivery.item}</p>
                              <p className="text-xs text-gray-500">
                                {getTaskTitle(delivery.taskId)} • {format(delivery.plannedDate, 'MMM dd')}
                              </p>
                            </div>
                          </div>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(delivery.confirmationStatus)}`}>
                            {delivery.confirmationStatus}
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
        })}
      </div>

      {/* Delivery Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="card p-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-gray-900">
              {suppliers.length}
            </div>
            <div className="text-sm text-gray-600 mt-1">Total Suppliers</div>
          </div>
        </div>
        
        <div className="card p-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-success-600">
              {deliveries.filter(d => d.confirmationStatus === 'confirmed').length}
            </div>
            <div className="text-sm text-gray-600 mt-1">Confirmed</div>
          </div>
        </div>
        
        <div className="card p-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-warning-600">
              {deliveries.filter(d => d.confirmationStatus === 'pending').length}
            </div>
            <div className="text-sm text-gray-600 mt-1">Pending</div>
          </div>
        </div>
        
        <div className="card p-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-danger-600">
              {deliveries.filter(d => d.confirmationStatus === 'rejected').length}
            </div>
            <div className="text-sm text-gray-600 mt-1">Rejected</div>
          </div>
        </div>
      </div>

      {/* All Deliveries Table */}
      <div className="card">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">All Deliveries</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Item
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Supplier
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Task
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Quantity
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {deliveries.map((delivery) => {
                const supplier = suppliers.find(s => s.id === delivery.supplierId);
                
                return (
                  <tr key={delivery.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Package className="w-5 h-5 text-gray-400 mr-3" />
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {delivery.item}
                          </div>
                          {delivery.notes && (
                            <div className="text-sm text-gray-500">{delivery.notes}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{supplier?.name}</div>
                      <div className="text-sm text-gray-500">{supplier?.company}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{getTaskTitle(delivery.taskId)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {delivery.quantity} {delivery.unit}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {format(delivery.plannedDate, 'MMM dd, yyyy')}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {getDeliveryStatusIcon(delivery.confirmationStatus)}
                        <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(delivery.confirmationStatus)}`}>
                          {delivery.confirmationStatus}
                        </span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
} 