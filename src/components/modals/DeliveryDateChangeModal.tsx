import React from 'react';
import { format } from 'date-fns';
import { Calendar, Truck, AlertTriangle, Mail } from 'lucide-react';
import type { Task, Supplier, Delivery } from '../../types';

interface DeliveryDateChangeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  task: Task;
  newStartDate: Date;
  newEndDate: Date;
  affectedDeliveries: Array<{
    delivery: Delivery;
    supplier: Supplier;
    newPlannedDate: Date;
  }>;
}

export default function DeliveryDateChangeModal({
  isOpen,
  onClose,
  onConfirm,
  task,
  newStartDate,
  newEndDate,
  affectedDeliveries
}: DeliveryDateChangeModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-orange-600" />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Delivery Date Changes Required
                </h3>
                <p className="text-sm text-gray-500">
                  Moving this task will affect supplier delivery schedules
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500 transition-colors"
            >
              <span className="sr-only">Close</span>
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Task Change Summary */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-center mb-3">
              <Calendar className="w-5 h-5 text-blue-600 mr-2" />
              <h4 className="font-medium text-blue-900">Task Schedule Change</h4>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-blue-700">Task:</span>
                <span className="font-medium text-blue-900">{task.title}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-blue-700">New Start Date:</span>
                <span className="font-medium text-blue-900">
                  {format(newStartDate, 'MMM dd, yyyy')}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-blue-700">New End Date:</span>
                <span className="font-medium text-blue-900">
                  {format(newEndDate, 'MMM dd, yyyy')}
                </span>
              </div>
            </div>
          </div>

          {/* Affected Deliveries */}
          <div className="mb-6">
            <div className="flex items-center mb-4">
              <Truck className="w-5 h-5 text-gray-600 mr-2" />
              <h4 className="font-medium text-gray-900">
                Affected Deliveries ({affectedDeliveries.length})
              </h4>
            </div>
            
            <div className="space-y-3">
              {affectedDeliveries.map(({ delivery, supplier, newPlannedDate }, index) => (
                <div
                  key={delivery.id}
                  className="bg-gray-50 border border-gray-200 rounded-lg p-4"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center mb-2">
                        <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-xs font-medium text-gray-600">
                          {index + 1}
                        </div>
                        <div className="ml-3">
                          <p className="font-medium text-gray-900">{delivery.item}</p>
                          <p className="text-sm text-gray-600">
                            {delivery.quantity} {delivery.unit} from {supplier.name}
                          </p>
                        </div>
                      </div>
                      
                      <div className="ml-11 space-y-1">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-500">Current Date:</span>
                          <span className="text-gray-900">
                            {format(delivery.planned_date, 'MMM dd, yyyy')}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-500">New Date:</span>
                          <span className="font-medium text-orange-600">
                            {format(newPlannedDate, 'MMM dd, yyyy')}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Email Notification Info */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <div className="flex items-center mb-2">
              <Mail className="w-5 h-5 text-green-600 mr-2" />
              <h4 className="font-medium text-green-900">Email Notifications</h4>
            </div>
            <p className="text-sm text-green-700">
              If you confirm these changes, email notifications will be sent to all affected suppliers 
              informing them of the new delivery dates.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              className="px-4 py-2 text-sm font-medium text-white bg-orange-600 border border-transparent rounded-md hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 transition-colors"
            >
              Confirm & Send Notifications
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}