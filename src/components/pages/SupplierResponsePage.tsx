import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { CheckCircle, XCircle, Calendar, Truck, AlertTriangle, MessageSquare } from 'lucide-react';
import emailService from '../../services/emailService';
import toast from 'react-hot-toast';
import type { Delivery, Supplier, Task, Project, User } from '../../types';

interface ResponseToken {
  deliveryId: string;
  supplierId: string;
  projectId: string;
  expires: number;
}

export default function SupplierResponsePage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');
  const action = searchParams.get('action') as 'confirm' | 'deny';

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tokenData, setTokenData] = useState<ResponseToken | null>(null);
  const [delivery, setDelivery] = useState<Delivery | null>(null);
  const [supplier, setSupplier] = useState<Supplier | null>(null);
  const [task, setTask] = useState<Task | null>(null);
  const [project, setProject] = useState<Project | null>(null);
  const [projectManager, setProjectManager] = useState<User | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [comments, setComments] = useState('');
  const [alternativeDate, setAlternativeDate] = useState('');

  useEffect(() => {
    if (!token) {
      setError('Invalid response link. Please check the URL and try again.');
      setIsLoading(false);
      return;
    }

    loadResponseData();
  }, [token]);

  const loadResponseData = async () => {
    try {
      // Call the public API endpoint that bypasses RLS
      const apiUrl = import.meta.env.DEV 
        ? `http://localhost:3000/api/supplier-response?token=${encodeURIComponent(token!)}`
        : `/api/supplier-response?token=${encodeURIComponent(token!)}`;
        
      const response = await fetch(apiUrl);
      const result = await response.json();

      if (!response.ok || !result.success) {
        console.error('API error:', result.error);
        setError(result.error || 'Failed to load response data.');
        setIsLoading(false);
        return;
      }

      const { delivery, supplier, project, task, tokenData } = result.data;
      
      // Set all the data
      setTokenData(tokenData);
      setDelivery({
        id: delivery.id,
        project_id: delivery.project_id,
        task_id: delivery.task_id,
        supplier_id: delivery.supplier_id,
        item: delivery.item,
        quantity: delivery.quantity,
        unit: delivery.unit,
        planned_date: new Date(delivery.planned_date),
        actual_date: delivery.actual_date ? new Date(delivery.actual_date) : undefined,
        confirmation_status: delivery.confirmation_status,
        delivery_address: delivery.delivery_address,
        notes: delivery.notes,
        confirmed_by: delivery.confirmed_by,
        confirmed_at: delivery.confirmed_at ? new Date(delivery.confirmed_at) : undefined,
        created_at: new Date(delivery.created_at),
        updated_at: new Date(delivery.updated_at),
      });
      setSupplier(supplier);
      setProject({
        ...project,
        start_date: new Date(project.start_date),
        end_date: new Date(project.end_date),
        created_at: new Date(project.created_at),
        updated_at: new Date(project.updated_at)
      });
      
      if (task) {
        setTask({
          ...task,
          start_date: new Date(task.start_date),
          end_date: new Date(task.end_date),
          created_at: new Date(task.created_at),
          updated_at: new Date(task.updated_at)
        });
      }

      setIsLoading(false);
    } catch (error) {
      console.error('Error loading response data:', error);
      setError('An error occurred while loading the response data.');
      setIsLoading(false);
    }
  };

  const handleResponse = async () => {
    if (!tokenData || !delivery || !supplier || !task || !project) {
      toast.error('Missing required data');
      return;
    }

    setIsSubmitting(true);

    try {
      // Call the API endpoint to record the response
      const apiUrl = import.meta.env.DEV 
        ? 'http://localhost:3000/api/supplier-response'
        : '/api/supplier-response';
        
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          token: token,
          action: action,
          comments: comments.trim() || null,
          alternativeDate: action === 'deny' && alternativeDate ? alternativeDate : null
        })
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        console.error('Error saving response:', result.error);
        toast.error('Failed to save response. Please try again.');
        setIsSubmitting(false);
        return;
      }

      // Send notification to project manager
      if (projectManager) {
        const notificationSubject = action === 'confirm' 
          ? `✅ Delivery Confirmed - ${task.title}`
          : `❌ Delivery Cannot Be Fulfilled - ${task.title}`;

        const notificationMessage = action === 'confirm'
          ? `Good news! ${supplier.name} has confirmed they can deliver on the new date.

Delivery Details:
• Item: ${delivery.item}
• Quantity: ${delivery.quantity} ${delivery.unit}
• Confirmed Date: ${format(delivery.planned_date, 'MMM dd, yyyy')}
• Task: ${task.title}

${comments ? `Supplier Comments: ${comments}` : ''}

The delivery is now confirmed and scheduled.`
          : `${supplier.name} cannot fulfill the delivery on the requested date.

Delivery Details:
• Item: ${delivery.item}
• Quantity: ${delivery.quantity} ${delivery.unit}
• Requested Date: ${format(delivery.planned_date, 'MMM dd, yyyy')}
• Task: ${task.title}

${alternativeDate ? `Alternative Date Proposed: ${format(new Date(alternativeDate), 'MMM dd, yyyy')}` : ''}
${comments ? `Supplier Comments: ${comments}` : ''}

Please contact the supplier to discuss alternative arrangements.`;

        await emailService.sendCustomNotification(
          projectManager.email,
          notificationSubject,
          notificationMessage,
          projectManager
        );
      }

      // Show success message
      const successMessage = action === 'confirm'
        ? 'Thank you! Your confirmation has been recorded and the project manager has been notified.'
        : 'Thank you for your response. The project manager has been notified and will contact you to discuss alternatives.';

      toast.success(successMessage);

      // Redirect to success page or close
      setTimeout(() => {
        navigate('/', { replace: true });
      }, 3000);

    } catch (error) {
      console.error('Error handling response:', error);
      toast.error('Failed to process your response. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading delivery information...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <AlertTriangle className="mx-auto h-12 w-12 text-red-500" />
            <h2 className="mt-6 text-3xl font-bold text-gray-900">Error</h2>
            <p className="mt-2 text-sm text-gray-600">{error}</p>
            <button
              onClick={() => navigate('/')}
              className="mt-4 btn btn-primary"
            >
              Go to Homepage
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!delivery || !supplier || !task || !project) {
    return null;
  }

  const isConfirm = action === 'confirm';
  const actionIcon = isConfirm ? CheckCircle : XCircle;
  const actionColor = isConfirm ? 'green' : 'red';
  const actionText = isConfirm ? 'Confirm Delivery' : 'Cannot Deliver';

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white shadow-xl rounded-lg overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-8">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Truck className="h-8 w-8 text-white" />
              </div>
              <div className="ml-4">
                <h1 className="text-2xl font-bold text-white">Delivery Response</h1>
                <p className="text-blue-100">{project.name}</p>
              </div>
            </div>
          </div>

          <div className="px-6 py-8">
            {/* Action Header */}
            <div className="flex items-center mb-6">
              <div className={`flex-shrink-0 w-12 h-12 bg-${actionColor}-100 rounded-full flex items-center justify-center`}>
                {React.createElement(actionIcon, { className: `w-6 h-6 text-${actionColor}-600` })}
              </div>
              <div className="ml-4">
                <h2 className="text-xl font-semibold text-gray-900">{actionText}</h2>
                <p className="text-gray-600">Please review the delivery details below</p>
              </div>
            </div>

            {/* Delivery Details */}
            <div className="bg-gray-50 rounded-lg p-6 mb-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                <Calendar className="w-5 h-5 mr-2" />
                Delivery Details
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Task</label>
                  <p className="text-gray-900">{task.title}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Item</label>
                  <p className="text-gray-900">{delivery.item}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Quantity</label>
                  <p className="text-gray-900">{delivery.quantity} {delivery.unit}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Required Date</label>
                  <p className="text-gray-900 font-medium">
                    {format(delivery.planned_date, 'EEEE, MMM dd, yyyy')}
                  </p>
                </div>
                {delivery.delivery_address && (
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700">Delivery Address</label>
                    <p className="text-gray-900">{delivery.delivery_address}</p>
                  </div>
                )}
                {delivery.notes && (
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700">Notes</label>
                    <p className="text-gray-900">{delivery.notes}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Response Form */}
            <div className="space-y-6">
              {!isConfirm && (
                <div>
                  <label htmlFor="alternative-date" className="block text-sm font-medium text-gray-700 mb-2">
                    Alternative Delivery Date (Optional)
                  </label>
                  <input
                    type="date"
                    id="alternative-date"
                    value={alternativeDate}
                    onChange={(e) => setAlternativeDate(e.target.value)}
                    className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  />
                  <p className="mt-1 text-sm text-gray-500">
                    If you cannot deliver on the required date, please suggest an alternative.
                  </p>
                </div>
              )}

              <div>
                <label htmlFor="comments" className="block text-sm font-medium text-gray-700 mb-2">
                  Comments {!isConfirm && '(Required)'}
                </label>
                <textarea
                  id="comments"
                  rows={4}
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  placeholder={isConfirm 
                    ? "Any additional information or special requirements..." 
                    : "Please explain why you cannot deliver on this date and any alternative arrangements..."
                  }
                  className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  required={!isConfirm}
                />
              </div>

              {/* Submit Button */}
              <div className="flex items-center justify-end space-x-4">
                <button
                  onClick={() => navigate('/')}
                  className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Cancel
                </button>
                <button
                  onClick={handleResponse}
                  disabled={isSubmitting || (!isConfirm && !comments.trim())}
                  className={`px-6 py-2 rounded-md text-white font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${
                    isConfirm 
                      ? 'bg-green-600 hover:bg-green-700 focus:ring-green-500' 
                      : 'bg-red-600 hover:bg-red-700 focus:ring-red-500'
                  }`}
                >
                  {isSubmitting ? 'Processing...' : `${actionText}`}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}