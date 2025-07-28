import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  CheckSquare, 
  Clock, 
  AlertTriangle, 
  FileText, 
  User, 
  Calendar,
  Filter,
  Search,
  CheckCircle,
  XCircle,
  RefreshCw,
  Plus
} from 'lucide-react';
import { useAppStore } from '../../store';
import { format, differenceInDays } from 'date-fns';
import toast from 'react-hot-toast';
import type { QAAlert, QAChecklistItem } from '../../types';

interface QAAlertCardProps {
  alert: QAAlert;
  task?: any;
  onStatusUpdate: (alertId: string, status: QAAlert['status']) => void;
  onChecklistComplete: (alertId: string, itemId: string, notes?: string) => void;
}

function QAAlertCard({ alert, task, onStatusUpdate, onChecklistComplete }: QAAlertCardProps) {
  const [expandedChecklist, setExpandedChecklist] = useState(false);
  const [checklistNotes, setChecklistNotes] = useState<Record<string, string>>({});
  const [processingItems, setProcessingItems] = useState<Set<string>>(new Set());

  // Format alert for display directly
  const getAlertTypeIcon = (type: string) => {
    switch (type) {
      case 'itp_required': return '📋';
      case 'pre_pour_checklist': return '✅';
      case 'engineer_inspection': return '👷';
      case 'quality_checkpoint': return '⚠️';
      case 'compliance_check': return '🔍';
      default: return '🔍';
    }
  };

  const displayInfo = {
    icon: getAlertTypeIcon(alert.type),
    title: alert.title,
    subtitle: task ? `${task.title} • ${alert.due_date ? format(alert.due_date, 'MMM dd') : 'No due date'}` : (alert.due_date ? format(alert.due_date, 'MMM dd') : 'No due date'),
    priority: alert.priority.toUpperCase(),
    colorClass: `text-${alert.priority === 'critical' ? 'danger' : alert.priority === 'high' ? 'warning' : alert.priority === 'medium' ? 'primary' : 'gray'}-600 bg-${alert.priority === 'critical' ? 'danger' : alert.priority === 'high' ? 'warning' : alert.priority === 'medium' ? 'primary' : 'gray'}-100`,
    daysUntilDue: alert.due_date ? differenceInDays(alert.due_date, new Date()) : 0
  };

  const priorityColors = {
    critical: 'text-red-600 bg-red-100',
    high: 'text-orange-600 bg-orange-100',
    medium: 'text-blue-600 bg-blue-100',
    low: 'text-gray-600 bg-gray-100'
  };

  const statusColors = {
    pending: 'text-yellow-600 bg-yellow-100',
    in_progress: 'text-blue-600 bg-blue-100',
    completed: 'text-green-600 bg-green-100',
    overdue: 'text-red-600 bg-red-100'
  };

  const handleChecklistItemComplete = async (itemId: string) => {
    if (processingItems.has(itemId)) return;

    setProcessingItems(prev => new Set(prev).add(itemId));
    
    try {
      const notes = checklistNotes[itemId] || '';
      await onChecklistComplete(alert.id, itemId, notes);
      
      // Clear notes after successful completion
      setChecklistNotes(prev => {
        const updated = { ...prev };
        delete updated[itemId];
        return updated;
      });
    } catch (error) {
      console.error('Error completing checklist item:', error);
      toast.error('Failed to complete checklist item');
    } finally {
      setProcessingItems(prev => {
        const updated = new Set(prev);
        updated.delete(itemId);
        return updated;
      });
    }
  };

  const completedRequiredItems = alert.checklist?.filter(item => item.required && item.completed).length || 0;
  const totalRequiredItems = alert.checklist?.filter(item => item.required).length || 0;
  const progressPercentage = totalRequiredItems > 0 ? (completedRequiredItems / totalRequiredItems) * 100 : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-start space-x-3">
          <div className="text-2xl">{displayInfo.icon}</div>
          <div className="flex-1">
            <h3 className="font-medium text-gray-900 mb-1">{displayInfo.title}</h3>
            <p className="text-sm text-gray-600 mb-2">{alert.description}</p>
            <p className="text-xs text-gray-500">{displayInfo.subtitle}</p>
            
            {/* Progress bar for required items */}
            {totalRequiredItems > 0 && (
              <div className="mt-3">
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>Required items: {completedRequiredItems}/{totalRequiredItems}</span>
                  <span>{Math.round(progressPercentage)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${progressPercentage}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <span className={`text-xs px-2 py-1 rounded-full font-medium ${priorityColors[alert.priority]}`}>
            {displayInfo.priority}
          </span>
          <span className={`text-xs px-2 py-1 rounded-full font-medium ${statusColors[alert.status]}`}>
            {alert.status.replace('_', ' ').toUpperCase()}
          </span>
        </div>
      </div>

      {/* Due date warning */}
      {alert.due_date && displayInfo.daysUntilDue <= 1 && alert.status === 'pending' && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
          <div className="flex items-center">
            <AlertTriangle className="w-4 h-4 text-red-500 mr-2" />
            <span className="text-sm text-red-700 font-medium">
              {displayInfo.daysUntilDue === 0 ? 'Due today!' : 'Overdue!'}
            </span>
          </div>
        </div>
      )}

      {/* Checklist */}
      {alert.checklist && alert.checklist.length > 0 && (
        <div className="border-t border-gray-100 pt-4">
          <button
            onClick={() => setExpandedChecklist(!expandedChecklist)}
            className="flex items-center justify-between w-full text-left text-sm font-medium text-gray-700 hover:text-gray-900"
          >
            <span>Quality Checklist ({alert.checklist.length} items)</span>
            <CheckSquare className={`w-4 h-4 transition-transform ${expandedChecklist ? 'rotate-180' : ''}`} />
          </button>

          {expandedChecklist && (
            <div className="mt-3 space-y-3">
              {alert.checklist.map((item: QAChecklistItem) => (
                <div key={item.id} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <input
                        type="checkbox"
                        checked={item.completed}
                        onChange={() => !item.completed && handleChecklistItemComplete(item.id)}
                        disabled={item.completed || processingItems.has(item.id)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className={`text-sm ${item.completed ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                        {item.text}
                      </span>
                      {item.required && (
                        <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded-full">
                          Required
                        </span>
                      )}
                      {processingItems.has(item.id) && (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                      )}
                    </div>

                    {/* Completion info */}
                    {item.completed && item.completed_at && (
                      <div className="text-xs text-gray-500 mb-2">
                        Completed on {format(new Date(item.completed_at), 'MMM dd, yyyy')}
                        {item.notes && ` - ${item.notes}`}
                      </div>
                    )}

                    {/* Notes input for incomplete items */}
                    {!item.completed && (
                      <textarea
                        value={checklistNotes[item.id] || ''}
                        onChange={(e) => setChecklistNotes(prev => ({
                          ...prev,
                          [item.id]: e.target.value
                        }))}
                        placeholder="Add completion notes (optional)..."
                        rows={2}
                        className="mt-2 w-full text-xs border border-gray-300 rounded px-2 py-1 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                      />
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
        <div className="text-xs text-gray-500">
          Created {format(alert.created_at, 'MMM dd, yyyy')}
        </div>
        
        <div className="flex items-center space-x-2">
          {alert.status === 'pending' && progressPercentage === 100 && (
            <button
              onClick={() => onStatusUpdate(alert.id, 'completed')}
              className="text-sm bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700"
            >
              Mark Complete
            </button>
          )}
          
          {alert.status === 'pending' && progressPercentage < 100 && (
            <button
              onClick={() => onStatusUpdate(alert.id, 'in_progress')}
              className="text-sm bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
            >
              Start Work
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}

export default function QAPage() {
  const { 
    qaAlerts, 
    tasks, 
    currentProject,
    initializeQAAlerts,
    generateQAAlerts,
    completeQAChecklistItem,
    updateQAAlertStatus
  } = useAppStore();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Initialize QA alerts on component mount
  useEffect(() => {
    if (currentProject) {
      initializeQAAlerts();
    }
  }, [currentProject]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await initializeQAAlerts();
      toast.success('QA alerts refreshed!');
    } catch (error) {
      toast.error('Failed to refresh QA alerts');
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleGenerateAlerts = async () => {
    try {
      await generateQAAlerts();
    } catch (error) {
      toast.error('Failed to generate QA alerts');
    }
  };

  const filteredAlerts = qaAlerts.filter(alert => {
    const matchesSearch = 
      alert.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      alert.description?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || alert.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || alert.priority === priorityFilter;
    
    return matchesSearch && matchesStatus && matchesPriority;
  });

  const alertStats = {
    total: qaAlerts.length,
    pending: qaAlerts.filter(a => a.status === 'pending').length,
    inProgress: qaAlerts.filter(a => a.status === 'in_progress').length,
    completed: qaAlerts.filter(a => a.status === 'completed').length,
    overdue: qaAlerts.filter(a => {
      if (!a.due_date || a.status === 'completed') return false;
      return differenceInDays(a.due_date, new Date()) < 0;
    }).length
  };

  if (!currentProject) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quality Assurance</h1>
          <p className="text-gray-600">
            Manage quality checkpoints, inspections, and compliance requirements
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="btn btn-outline flex items-center"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? 'Refreshing...' : 'Refresh'}
          </button>
          <button
            onClick={handleGenerateAlerts}
            className="btn btn-primary flex items-center"
          >
            <Plus className="w-4 h-4 mr-2" />
            Generate Alerts
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="text-2xl font-bold text-gray-900">{alertStats.total}</div>
          <div className="text-sm text-gray-600">Total Alerts</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="text-2xl font-bold text-yellow-600">{alertStats.pending}</div>
          <div className="text-sm text-gray-600">Pending</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="text-2xl font-bold text-blue-600">{alertStats.inProgress}</div>
          <div className="text-sm text-gray-600">In Progress</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="text-2xl font-bold text-green-600">{alertStats.completed}</div>
          <div className="text-sm text-gray-600">Completed</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="text-2xl font-bold text-red-600">{alertStats.overdue}</div>
          <div className="text-sm text-gray-600">Overdue</div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search alerts and tasks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
            
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
            </select>

            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="all">All Priority</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
        </div>
      </div>

      {/* QA Alerts */}
      {filteredAlerts.length === 0 ? (
        <div className="text-center py-12">
          <CheckSquare className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {searchQuery || statusFilter !== 'all' || priorityFilter !== 'all' 
              ? 'No alerts match your filters'
              : 'No QA alerts yet'
            }
          </h3>
          <p className="text-gray-600 mb-4">
            {searchQuery || statusFilter !== 'all' || priorityFilter !== 'all'
              ? 'Try adjusting your search or filters'
              : 'QA alerts will be automatically generated based on task progress and schedules'
            }
          </p>
          {!searchQuery && statusFilter === 'all' && priorityFilter === 'all' && (
            <button
              onClick={handleGenerateAlerts}
              className="btn btn-primary"
            >
              <Plus className="w-4 h-4 mr-2" />
              Generate QA Alerts
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredAlerts.map((alert) => {
            const task = tasks.find(t => t.id === alert.task_id);
            return (
              <QAAlertCard
                key={alert.id}
                alert={alert}
                task={task}
                onStatusUpdate={updateQAAlertStatus}
                onChecklistComplete={completeQAChecklistItem}
              />
            );
          })}
        </div>
      )}
    </div>
  );
} 