import React from 'react';
import { motion } from 'framer-motion';
import { 
  Clock, 
  CheckCircle, 
  XCircle, 
  Calendar,
  User,
  MessageSquare,
  AlertTriangle
} from 'lucide-react';
import { useAppStore } from '../../store';
import { format } from 'date-fns';

export default function ApprovalsPage() {
  const { 
    taskChangeProposals, 
    tasks,
    currentUser,
    approveTaskChangeProposal,
    rejectTaskChangeProposal,
    isProjectManager 
  } = useAppStore();

  if (!isProjectManager()) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="w-16 h-16 text-warning-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Access Restricted</h3>
        <p className="text-gray-600">Only Project Managers can access the approvals page.</p>
      </div>
    );
  }

  const pendingProposals = taskChangeProposals.filter(p => p.status === 'pending');
  const reviewedProposals = taskChangeProposals.filter(p => p.status !== 'pending');

  const getTaskTitle = (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    return task?.title || 'Unknown Task';
  };

  const handleApprove = (proposalId: string) => {
    approveTaskChangeProposal(proposalId, 'Approved by Project Manager');
  };

  const handleReject = (proposalId: string) => {
    rejectTaskChangeProposal(proposalId, 'Changes not feasible at this time');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Approvals</h1>
          <p className="text-gray-600 mt-1">Review and approve proposed schedule changes</p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="bg-warning-100 text-warning-800 px-3 py-2 rounded-lg text-sm font-medium">
            {pendingProposals.length} Pending
          </div>
        </div>
      </div>

      {/* Pending Proposals */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-900">Pending Approvals</h2>
        
        {pendingProposals.length > 0 ? (
          pendingProposals.map((proposal) => (
            <motion.div
              key={proposal.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="card border-l-4 border-l-warning-500"
            >
              <div className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-3">
                      <Clock className="w-5 h-5 text-warning-600" />
                      <h3 className="text-lg font-semibold text-gray-900">
                        Change Request: {getTaskTitle(proposal.taskId)}
                      </h3>
                      <span className="bg-warning-100 text-warning-800 px-2 py-1 rounded-full text-xs font-medium">
                        Pending Review
                      </span>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6 mb-4">
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Proposed Changes</h4>
                        <div className="space-y-2 text-sm">
                          {proposal.proposedStartDate && (
                            <div className="flex items-center">
                              <Calendar className="w-4 h-4 text-gray-400 mr-2" />
                              <span className="text-gray-600">Start:</span>
                              <span className="ml-2 font-medium">
                                {format(proposal.proposedStartDate, 'MMM dd, yyyy')}
                              </span>
                            </div>
                          )}
                          {proposal.proposedEndDate && (
                            <div className="flex items-center">
                              <Calendar className="w-4 h-4 text-gray-400 mr-2" />
                              <span className="text-gray-600">End:</span>
                              <span className="ml-2 font-medium">
                                {format(proposal.proposedEndDate, 'MMM dd, yyyy')}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Request Details</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex items-center">
                            <User className="w-4 h-4 text-gray-400 mr-2" />
                            <span className="text-gray-600">Requested by:</span>
                            <span className="ml-2 font-medium">{proposal.proposedBy}</span>
                          </div>
                          <div className="flex items-center">
                            <Clock className="w-4 h-4 text-gray-400 mr-2" />
                            <span className="text-gray-600">Submitted:</span>
                            <span className="ml-2 font-medium">
                              {format(proposal.proposedAt, 'MMM dd, HH:mm')}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {proposal.reason && (
                      <div className="mb-4">
                        <h4 className="font-medium text-gray-900 mb-2 flex items-center">
                          <MessageSquare className="w-4 h-4 mr-2" />
                          Reason for Change
                        </h4>
                        <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-700">
                          {proposal.reason}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
                  <button
                    onClick={() => handleReject(proposal.id)}
                    className="btn btn-secondary btn-md flex items-center"
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    Reject
                  </button>
                  <button
                    onClick={() => handleApprove(proposal.id)}
                    className="btn btn-success btn-md flex items-center"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Approve
                  </button>
                </div>
              </div>
            </motion.div>
          ))
        ) : (
          <div className="card p-8 text-center">
            <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Pending Approvals</h3>
            <p className="text-gray-600">All change requests have been reviewed.</p>
          </div>
        )}
      </div>

      {/* Recent Decisions */}
      {reviewedProposals.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">Recent Decisions</h2>
          
          <div className="space-y-3">
            {reviewedProposals.slice(0, 5).map((proposal) => (
              <div key={proposal.id} className="card">
                <div className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      {proposal.status === 'approved' ? (
                        <CheckCircle className="w-5 h-5 text-success-600" />
                      ) : (
                        <XCircle className="w-5 h-5 text-danger-600" />
                      )}
                      <div>
                        <h4 className="font-medium text-gray-900">
                          {getTaskTitle(proposal.taskId)}
                        </h4>
                        <p className="text-sm text-gray-500">
                          {proposal.reason}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        proposal.status === 'approved' 
                          ? 'bg-success-100 text-success-800'
                          : 'bg-danger-100 text-danger-800'
                      }`}>
                        {proposal.status}
                      </span>
                      {proposal.reviewedAt && (
                        <p className="text-xs text-gray-500 mt-1">
                          {format(proposal.reviewedAt, 'MMM dd, HH:mm')}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  {proposal.reviewComments && (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <p className="text-sm text-gray-600">
                        <strong>Review Notes:</strong> {proposal.reviewComments}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card p-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-warning-600">
              {pendingProposals.length}
            </div>
            <div className="text-sm text-gray-600 mt-1">Pending Approval</div>
          </div>
        </div>
        
        <div className="card p-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-success-600">
              {taskChangeProposals.filter(p => p.status === 'approved').length}
            </div>
            <div className="text-sm text-gray-600 mt-1">Approved</div>
          </div>
        </div>
        
        <div className="card p-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-danger-600">
              {taskChangeProposals.filter(p => p.status === 'rejected').length}
            </div>
            <div className="text-sm text-gray-600 mt-1">Rejected</div>
          </div>
        </div>
      </div>
    </div>
  );
} 