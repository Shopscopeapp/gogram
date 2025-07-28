import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, X, Send, CheckCircle, AlertCircle } from 'lucide-react';
import { useAppStore } from '../../store';
import toast from 'react-hot-toast';

interface EmailTestModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function EmailTestModal({ isOpen, onClose }: EmailTestModalProps) {
  const { testEmailConfiguration } = useAppStore();
  const [testEmail, setTestEmail] = useState('');
  const [isSending, setIsSending] = useState(false);

  const handleSendTest = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!testEmail) {
      toast.error('Please enter an email address');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(testEmail)) {
      toast.error('Please enter a valid email address');
      return;
    }

    setIsSending(true);
    try {
      await testEmailConfiguration(testEmail);
    } finally {
      setIsSending(false);
    }
  };

  if (!isOpen) return null;

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
        className="bg-white rounded-lg shadow-xl max-w-md w-full"
      >
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <Mail className="w-5 h-5 mr-2 text-blue-500" />
              Test Email Configuration
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSendTest} className="p-6">
          <div className="mb-4">
            <p className="text-sm text-gray-600 mb-4">
              Send a test email to verify your notification system is working properly.
            </p>
            
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Test Email Address
            </label>
            <input
              type="email"
              value={testEmail}
              onChange={(e) => setTestEmail(e.target.value)}
              placeholder="Enter your email address"
              className="input w-full"
              disabled={isSending}
            />
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-start">
              <CheckCircle className="w-5 h-5 text-blue-500 mr-2 mt-0.5 flex-shrink-0" />
              <div className="text-sm">
                <p className="font-medium text-blue-900 mb-1">Email Provider Configuration</p>
                <p className="text-blue-700">
                  Current provider: <span className="font-mono">simulation</span>
                </p>
                <p className="text-blue-600 text-xs mt-1">
                  In demo mode, emails are simulated and logged to console.
                </p>
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-outline"
              disabled={isSending}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSending || !testEmail}
              className="btn btn-primary flex items-center"
            >
              {isSending ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Sending...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Send Test Email
                </>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
} 