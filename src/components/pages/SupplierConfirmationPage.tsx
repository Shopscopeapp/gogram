import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { 
  CheckCircle, 
  XCircle, 
  Calendar, 
  Package, 
  Clock,
  ArrowRight,
  Building,
  Mail
} from 'lucide-react';
import { useAppStore } from '../../store';
import { format } from 'date-fns';
import procurementService from '../../services/procurementService';
import toast from 'react-hot-toast';

export default function SupplierConfirmationPage() {
  const { deliveryId } = useParams<{ deliveryId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const { deliveries, suppliers, tasks, updateDelivery } = useAppStore();
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [proposedDate, setProposedDate] = useState('');
  const [comments, setComments] = useState('');
  const [response, setResponse] = useState<'confirmed' | 'rejected' | null>(
    searchParams.get('response') as 'confirmed' | 'rejected' | null
  );

  // Find the delivery and related data
  const delivery = deliveries.find(d => d.id === deliveryId);
  const supplier = delivery ? suppliers.find(s => s.id === delivery.supplier_id) : null;
  const task = delivery ? tasks.find(t => t.id === delivery.task_id) : null;

  useEffect(() => {
    // Set initial proposed date to the current delivery date
    if (delivery) {
      setProposedDate(format(delivery.planned_date, 'yyyy-MM-dd'));
    }
  }, [delivery]);

  if (!delivery || !supplier || !task) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center">
          <XCircle className="w-16 h-16 text-danger-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Delivery Not Found</h2>
          <p className="text-gray-600 mb-6">
            The delivery confirmation link appears to be invalid or expired.
          </p>
          <button
            onClick={() => navigate('/')}
            className="btn btn-primary btn-md"
          >
            Return to Gogram
          </button>
        </div>
      </div>
    );
  }

  const handleSubmitResponse = async () => {
    if (!response) return;

    setLoading(true);

    try {
      const confirmationResponse = {
        deliveryId: delivery.id,
        supplierId: supplier.id,
        response,
        newProposedDate: proposedDate ? new Date(proposedDate) : undefined,
        comments: comments.trim() || undefined
      };

      const result = procurementService.processSupplierConfirmation(
        confirmationResponse,
        deliveries
      );

      if (result.success && result.updatedDelivery) {
        // Update the delivery in the store
        updateDelivery(delivery.id, {
          confirmation_status: response,
          planned_date: proposedDate ? new Date(proposedDate) : delivery.planned_date,
          notes: result.updatedDelivery.notes
        });

        setSubmitted(true);
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      console.error('Error submitting confirmation:', error);
      toast.error('Failed to submit confirmation. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const statusBadge = procurementService.getDeliveryStatusBadge(delivery);

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center"
        >
          <div className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center ${
            response === 'confirmed' ? 'bg-success-100' : 'bg-danger-100'
          }`}>
            {response === 'confirmed' ? (
              <CheckCircle className="w-8 h-8 text-success-600" />
            ) : (
              <XCircle className="w-8 h-8 text-danger-600" />
            )}
          </div>
          
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            {response === 'confirmed' ? 'Delivery Confirmed!' : 'Response Recorded'}
          </h2>
          
          <p className="text-gray-600 mb-6">
            {response === 'confirmed' 
              ? 'Thank you for confirming the delivery date. The project team has been notified.'
              : 'Your response has been recorded. The project team will contact you to discuss alternatives.'
            }
          </p>

          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <h3 className="font-medium text-gray-900 mb-2">Confirmation Details</h3>
            <div className="text-sm text-gray-600 space-y-1">
              <p><strong>Item:</strong> {delivery.item}</p>
              <p><strong>Date:</strong> {format(new Date(proposedDate), 'EEEE, MMMM dd, yyyy')}</p>
              {comments && <p><strong>Comments:</strong> {comments}</p>}
            </div>
          </div>

          <button
            onClick={() => navigate('/')}
            className="btn btn-primary btn-md"
          >
            Return to Gogram
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto p-6">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-12 h-12 bg-primary-600 rounded-xl flex items-center justify-center">
              <Package className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Delivery Confirmation</h1>
              <p className="text-gray-600">Gogram Construction Management</p>
            </div>
          </div>
          
          <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
            statusBadge.color === 'success' ? 'bg-success-100 text-success-800' :
            statusBadge.color === 'danger' ? 'bg-danger-100 text-danger-800' :
            'bg-warning-100 text-warning-800'
          }`}>
            <span className="mr-2">{statusBadge.icon}</span>
            Current Status: {statusBadge.text}
          </div>
        </div>

        {/* Delivery Details */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">📦 Delivery Details</h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Item</label>
                <p className="text-gray-900 font-medium">{delivery.item}</p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-500">Quantity</label>
                <p className="text-gray-900 font-medium">{delivery.quantity} {delivery.unit}</p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-500">For Task</label>
                <p className="text-gray-900 font-medium">{task.title}</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Supplier</label>
                <div className="flex items-center space-x-2">
                  <Building className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-900 font-medium">{supplier.company}</span>
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-500">Contact</label>
                <div className="flex items-center space-x-2">
                  <Mail className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-900">{supplier.email}</span>
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-500">Original Date</label>
                <div className="flex items-center space-x-2">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-900">{format(delivery.planned_date, 'EEEE, MMMM dd, yyyy')}</span>
                </div>
              </div>
            </div>
          </div>

          {delivery.notes && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <label className="text-sm font-medium text-gray-500">Delivery Notes</label>
              <p className="text-gray-700 mt-1">{delivery.notes}</p>
            </div>
          )}
        </div>

        {/* Response Form */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">⏰ Your Response</h2>
          
          {/* Response Type Selection */}
          <div className="space-y-3 mb-6">
            <p className="text-gray-600 mb-4">Can you accommodate this delivery schedule?</p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setResponse('confirmed')}
                className={`p-4 rounded-xl border-2 transition-all text-left ${
                  response === 'confirmed'
                    ? 'border-success-500 bg-success-50'
                    : 'border-gray-200 hover:border-success-300'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <CheckCircle className={`w-6 h-6 ${
                    response === 'confirmed' ? 'text-success-600' : 'text-gray-400'
                  }`} />
                  <div>
                    <h3 className="font-medium text-gray-900">✅ Confirm Date</h3>
                    <p className="text-sm text-gray-600">I can deliver on the requested date</p>
                  </div>
                </div>
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setResponse('rejected')}
                className={`p-4 rounded-xl border-2 transition-all text-left ${
                  response === 'rejected'
                    ? 'border-danger-500 bg-danger-50'
                    : 'border-gray-200 hover:border-danger-300'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <XCircle className={`w-6 h-6 ${
                    response === 'rejected' ? 'text-danger-600' : 'text-gray-400'
                  }`} />
                  <div>
                    <h3 className="font-medium text-gray-900">❌ Cannot Accommodate</h3>
                    <p className="text-sm text-gray-600">I need a different date</p>
                  </div>
                </div>
              </motion.button>
            </div>
          </div>

          {/* Proposed Date */}
          {response && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <div>
                <label className="label">
                  {response === 'confirmed' ? 'Confirm Delivery Date' : 'Propose Alternative Date'}
                </label>
                <input
                  type="date"
                  value={proposedDate}
                  onChange={(e) => setProposedDate(e.target.value)}
                  className="input"
                  required
                />
              </div>

              <div>
                <label className="label">Comments (Optional)</label>
                <textarea
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  placeholder={
                    response === 'confirmed' 
                      ? 'Any special delivery instructions or notes...'
                      : 'Please explain why the requested date doesn\'t work and suggest alternatives...'
                  }
                  className="input h-24 resize-none"
                />
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                <p className="text-sm text-gray-600">
                  Your response will be sent to the project team immediately.
                </p>
                
                <button
                  onClick={handleSubmitResponse}
                  disabled={loading || !proposedDate}
                  className={`btn btn-lg flex items-center space-x-2 ${
                    response === 'confirmed' ? 'btn-success' : 'btn-warning'
                  }`}
                >
                  {loading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Submitting...</span>
                    </>
                  ) : (
                    <>
                      <span>
                        {response === 'confirmed' ? 'Confirm Delivery' : 'Submit Response'}
                      </span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500">
            Powered by <strong>Gogram</strong> Construction Management Platform
          </p>
        </div>
      </div>
    </div>
  );
} 