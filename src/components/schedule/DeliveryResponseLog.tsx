import React from 'react';
import { motion } from 'framer-motion';
import { Clock, CheckCircle, XCircle, MessageSquare, Calendar, Package, Building, Mail } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import type { DeliveryResponse } from '../../types';

interface DeliveryResponseLogProps {
  responses: DeliveryResponse[];
}

export default function DeliveryResponseLog({ responses }: DeliveryResponseLogProps) {
  if (responses.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
            <Package className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Delivery Response Log</h3>
            <p className="text-sm text-gray-600">Track supplier responses to delivery date changes</p>
          </div>
        </div>
        
        <div className="text-center py-8">
          <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No delivery responses yet</p>
          <p className="text-sm text-gray-400 mt-1">
            Responses will appear here when suppliers confirm or deny delivery date changes
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
            <Package className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Delivery Response Log</h3>
            <p className="text-sm text-gray-600">
              {responses.length} response{responses.length !== 1 ? 's' : ''} from suppliers
            </p>
          </div>
        </div>
      </div>

      <div className="max-h-96 overflow-y-auto">
        <div className="divide-y divide-gray-100">
          {responses.map((response, index) => (
            <motion.div
              key={response.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="p-6"
            >
              <div className="flex items-start space-x-4">
                {/* Response Status Icon */}
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  response.response === 'confirm' 
                    ? 'bg-green-100 text-green-600' 
                    : 'bg-red-100 text-red-600'
                }`}>
                  {response.response === 'confirm' ? (
                    <CheckCircle className="w-5 h-5" />
                  ) : (
                    <XCircle className="w-5 h-5" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  {/* Header */}
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        response.response === 'confirm'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {response.response === 'confirm' ? 'Confirmed' : 'Denied'}
                      </span>
                      <span className="text-sm text-gray-500">
                        {formatDistanceToNow(response.responded_at, { addSuffix: true })}
                      </span>
                    </div>
                    <Clock className="w-4 h-4 text-gray-400" />
                  </div>

                  {/* Supplier Info */}
                  <div className="flex items-center space-x-2 mb-2">
                    <Building className="w-4 h-4 text-gray-400" />
                    <span className="font-medium text-gray-900">
                      {response.supplier.company_name}
                    </span>
                    <span className="text-gray-500">•</span>
                    <span className="text-gray-600">
                      {response.supplier.contact_name}
                    </span>
                    <Mail className="w-4 h-4 text-gray-400 ml-2" />
                    <span className="text-sm text-gray-500">
                      {response.supplier.email}
                    </span>
                  </div>

                  {/* Delivery Info */}
                  <div className="bg-gray-50 rounded-lg p-3 mb-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900">
                          {response.delivery.task_title}
                        </p>
                        <p className="text-sm text-gray-600">
                          {response.delivery.item}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center space-x-1 text-sm text-gray-500">
                          <Calendar className="w-4 h-4" />
                          <span>
                            {format(response.delivery.planned_date, 'MMM d, yyyy')}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Comments */}
                  {response.comments && (
                    <div className="mb-3">
                      <div className="flex items-start space-x-2">
                        <MessageSquare className="w-4 h-4 text-gray-400 mt-0.5" />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-700 mb-1">Comments:</p>
                          <p className="text-sm text-gray-600 bg-gray-50 rounded-lg p-2">
                            "{response.comments}"
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Alternative Date */}
                  {response.alternative_date && (
                    <div className="flex items-center space-x-2 text-sm">
                      <Calendar className="w-4 h-4 text-orange-500" />
                      <span className="text-gray-600">Alternative date proposed:</span>
                      <span className="font-medium text-orange-600">
                        {format(response.alternative_date, 'MMM d, yyyy')}
                      </span>
                    </div>
                  )}

                  {/* Timestamp */}
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <p className="text-xs text-gray-400">
                      Responded on {format(response.responded_at, 'MMMM d, yyyy \'at\' h:mm a')}
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}