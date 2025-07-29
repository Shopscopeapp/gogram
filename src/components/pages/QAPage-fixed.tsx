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
  Plus,
  Settings,
  ClipboardList,
  Shield,
  Download
} from 'lucide-react';
import { useAppStore } from '../../store';
import { format, differenceInDays } from 'date-fns';
import toast from 'react-hot-toast';
import type { QAAlert, QAChecklistItem, ITPTemplate, ITPInstance } from '../../types';
import CreateITPTemplateModal from '../modals/CreateITPTemplateModal';
import ITPInstanceModal from '../modals/ITPInstanceModal';

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
  const progressPercentage = totalRequiredItems > 0 ? Math.round((completedRequiredItems / totalRequiredItems) * 100) : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow"
    >
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-start space-x-3">
            <div className="text-2xl">{displayInfo.icon}</div>
            <div className="flex-1">
              <h3 className="font-medium text-gray-900 mb-1">{displayInfo.title}</h3>
              <p className="text-sm text-gray-600 mb-2">{displayInfo.subtitle}</p>
              <div className="flex items-center space-x-2">
                <span className={`text-xs px-2 py-1 rounded-full ${priorityColors[alert.priority]}`}>
                  {displayInfo.priority}
                </span>
                <span className={`text-xs px-2 py-1 rounded-full ${statusColors[alert.status]}`}>
                  {alert.status.replace('_', ' ')}
                </span>
                {displayInfo.daysUntilDue < 0 && (
                  <span className="text-xs px-2 py-1 bg-red-100 text-red-800 rounded-full">
                    {Math.abs(displayInfo.daysUntilDue)} days overdue
                  </span>
                )}
                {displayInfo.daysUntilDue >= 0 && displayInfo.daysUntilDue <= 7 && (
                  <span className="text-xs px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full">
                    Due in {displayInfo.daysUntilDue} days
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <select
              value={alert.status}
              onChange={(e) => onStatusUpdate(alert.id, e.target.value as QAAlert['status'])}
              className="text-xs border border-gray-300 rounded px-2 py-1 focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="pending">Pending</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
            </select>
          </div>
        </div>

        {alert.description && (
          <p className="text-sm text-gray-600 mb-4">{alert.description}</p>
        )}

        {alert.checklist && alert.checklist.length > 0 && (
          <div className="border-t border-gray-200 pt-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-medium text-gray-900">Checklist Progress</h4>
              <button
                onClick={() => setExpandedChecklist(!expandedChecklist)}
                className="text-xs text-blue-600 hover:text-blue-700"
              >
                {expandedChecklist ? 'Hide' : 'Show'} Details
              </button>
            </div>
            
            <div className="mb-3">
              <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                <span>Progress</span>
                <span>{completedRequiredItems}/{totalRequiredItems} completed</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-green-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
            </div>

            {expandedChecklist && (
              <div className="space-y-2">
                {alert.checklist.map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <div className="flex items-center space-x-2">
                      {item.completed ? (
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      ) : (
                        <div className="w-4 h-4 border-2 border-gray-300 rounded" />
                      )}
                      <span className={`text-sm ${item.completed ? 'text-gray-500 line-through' : 'text-gray-700'}`}>
                        {item.text}
                      </span>
                      {item.required && (
                        <span className="text-xs px-1 py-0.5 bg-red-100 text-red-800 rounded">Required</span>
                      )}
                    </div>
                    {!item.completed && (
                      <button
                        onClick={() => handleChecklistItemComplete(item.id)}
                        disabled={processingItems.has(item.id)}
                        className="text-xs text-blue-600 hover:text-blue-700 disabled:opacity-50"
                      >
                        {processingItems.has(item.id) ? 'Completing...' : 'Complete'}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}

export default function QAPage() {
  const { 
    currentUser, 
    currentProject, 
    tasks, 
    qaAlerts, 
    updateQAAlertStatus, 
    completeQAChecklistItem 
  } = useAppStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'qa' | 'itp' | 'safety'>('qa');
  const [showCreateITPModal, setShowCreateITPModal] = useState(false);
  const [selectedITPInstance, setSelectedITPInstance] = useState<ITPInstance | null>(null);
  const [itpTemplates, setItpTemplates] = useState<ITPTemplate[]>([]);
  const [itpInstances, setItpInstances] = useState<ITPInstance[]>([]);
  const [safetyReports, setSafetyReports] = useState<any[]>([]);

  // Initialize QA alerts on component mount
  useEffect(() => {
    if (currentProject) {
      loadITPData();
    }
  }, [currentProject]);

  const loadITPData = async () => {
    try {
      // Load ITP templates and instances
      const { itpService } = await import('../../services/itpService');
      
      // Load templates
      const templatesResult = await itpService.getITPTemplates();
      if (templatesResult.success && templatesResult.templates) {
        setItpTemplates(templatesResult.templates);
      }
      
      // Load instances for current project
      if (currentProject) {
        const instancesResult = await itpService.getITPInstances(currentProject.id);
        if (instancesResult.success && instancesResult.instances) {
          setItpInstances(instancesResult.instances);
        }
      }
    } catch (error) {
      console.error('Error loading ITP data:', error);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await loadITPData();
      toast.success('QA data refreshed successfully!');
    } catch (error) {
      console.error('Error refreshing QA data:', error);
      toast.error('Failed to refresh QA data');
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleGenerateAlerts = async () => {
    try {
      toast.success('QA alerts generated successfully!');
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
          {activeTab === 'qa' && (
            <button
              onClick={handleGenerateAlerts}
              className="btn btn-primary flex items-center"
            >
              <Plus className="w-4 h-4 mr-2" />
              Generate Alerts
            </button>
          )}
          {activeTab === 'itp' && (
            <button
              onClick={() => setShowCreateITPModal(true)}
              className="btn btn-primary flex items-center"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create ITP Template
            </button>
          )}
          {activeTab === 'safety' && (
            <button
              onClick={() => {/* TODO: Generate safety report */}}
              className="btn btn-primary flex items-center"
            >
              <Download className="w-4 h-4 mr-2" />
              Generate Monthly Report
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('qa')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'qa'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <CheckSquare className="w-4 h-4 inline mr-2" />
            QA Alerts
          </button>
          <button
            onClick={() => setActiveTab('itp')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'itp'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <ClipboardList className="w-4 h-4 inline mr-2" />
            ITP Management
          </button>
          <button
            onClick={() => setActiveTab('safety')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'safety'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Shield className="w-4 h-4 inline mr-2" />
            Safety Requirements
          </button>
        </nav>
      </div>

      {/* Content based on active tab */}
      {activeTab === 'qa' && (
        <>
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
        </>
      )}

      {activeTab === 'safety' && (
        <>
          {/* Safety Requirements Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="text-2xl font-bold text-gray-900">12</div>
              <div className="text-sm text-gray-600">Safety Inspections</div>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="text-2xl font-bold text-green-600">8</div>
              <div className="text-sm text-gray-600">Completed</div>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="text-2xl font-bold text-yellow-600">3</div>
              <div className="text-sm text-gray-600">Pending</div>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="text-2xl font-bold text-red-600">1</div>
              <div className="text-sm text-gray-600">Critical Issues</div>
            </div>
          </div>

          {/* Safety Requirements Content */}
          <div className="space-y-6">
            {/* Monthly Safety Report */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Monthly Safety Report</h3>
                <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded-full">Internal Use Only</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Safety Inspections</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <div className="font-medium text-gray-900">Site Safety Audit</div>
                        <div className="text-sm text-gray-600">Comprehensive site safety review</div>
                      </div>
                      <span className="text-xs px-2 py-1 bg-green-100 text-green-800 rounded-full">Completed</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <div className="font-medium text-gray-900">Equipment Safety Check</div>
                        <div className="text-sm text-gray-600">Heavy machinery and tool inspection</div>
                      </div>
                      <span className="text-xs px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full">Pending</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <div className="font-medium text-gray-900">PPE Compliance</div>
                        <div className="text-sm text-gray-600">Personal protective equipment audit</div>
                      </div>
                      <span className="text-xs px-2 py-1 bg-green-100 text-green-800 rounded-full">Completed</span>
                    </div>
                  </div>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Safety Incidents</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                      <div>
                        <div className="font-medium text-red-900">Minor Injury Report</div>
                        <div className="text-sm text-red-700">Slip and fall incident - resolved</div>
                      </div>
                      <span className="text-xs px-2 py-1 bg-red-100 text-red-800 rounded-full">Critical</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <div className="font-medium text-gray-900">Near Miss Report</div>
                        <div className="text-sm text-gray-600">Equipment malfunction - no injury</div>
                      </div>
                      <span className="text-xs px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full">Reported</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Safety Training Records */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Safety Training Records</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Training Type</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Participants</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Site Safety Orientation</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">15 workers</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Dec 15, 2024</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-xs px-2 py-1 bg-green-100 text-green-800 rounded-full">Completed</span>
                      </td>
                    </tr>
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Equipment Operation Training</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">8 operators</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Dec 20, 2024</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-xs px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full">Scheduled</span>
                      </td>
                    </tr>
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Emergency Response Training</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">12 workers</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Dec 18, 2024</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-xs px-2 py-1 bg-green-100 text-green-800 rounded-full">Completed</span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Safety Compliance Checklist */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Safety Compliance Checklist</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Site Safety</h4>
                  <div className="space-y-2">
                    <div className="flex items-center">
                      <CheckCircle className="w-4 h-4 text-green-600 mr-2" />
                      <span className="text-sm text-gray-700">Safety barriers properly installed</span>
                    </div>
                    <div className="flex items-center">
                      <CheckCircle className="w-4 h-4 text-green-600 mr-2" />
                      <span className="text-sm text-gray-700">Warning signs clearly visible</span>
                    </div>
                    <div className="flex items-center">
                      <CheckCircle className="w-4 h-4 text-green-600 mr-2" />
                      <span className="text-sm text-gray-700">Emergency exits unobstructed</span>
                    </div>
                    <div className="flex items-center">
                      <XCircle className="w-4 h-4 text-red-600 mr-2" />
                      <span className="text-sm text-gray-700">Fire extinguishers need inspection</span>
                    </div>
                  </div>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Equipment Safety</h4>
                  <div className="space-y-2">
                    <div className="flex items-center">
                      <CheckCircle className="w-4 h-4 text-green-600 mr-2" />
                      <span className="text-sm text-gray-700">All equipment properly maintained</span>
                    </div>
                    <div className="flex items-center">
                      <CheckCircle className="w-4 h-4 text-green-600 mr-2" />
                      <span className="text-sm text-gray-700">Safety guards in place</span>
                    </div>
                    <div className="flex items-center">
                      <CheckCircle className="w-4 h-4 text-green-600 mr-2" />
                      <span className="text-sm text-gray-700">Regular inspections conducted</span>
                    </div>
                    <div className="flex items-center">
                      <CheckCircle className="w-4 h-4 text-green-600 mr-2" />
                      <span className="text-sm text-gray-700">Operator certifications current</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {activeTab === 'itp' && (
        <>
          {/* ITP Templates */}
          <div className="space-y-6">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">ITP Templates</h3>
              {itpTemplates.length === 0 ? (
                <div className="text-center py-8">
                  <ClipboardList className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h4 className="text-lg font-medium text-gray-900 mb-2">No ITP Templates</h4>
                  <p className="text-gray-600 mb-4">Create ITP templates to define inspection and test requirements</p>
                  <button
                    onClick={() => setShowCreateITPModal(true)}
                    className="btn btn-primary"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Create First Template
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {itpTemplates.map((template) => (
                    <div key={template.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between mb-3">
                        <h4 className="font-medium text-gray-900">{template.name}</h4>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          template.priority === 'critical' ? 'bg-red-100 text-red-800' :
                          template.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                          template.priority === 'medium' ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {template.priority}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-3">{template.description}</p>
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>{template.type}</span>
                        <span>{template.requirements.length} requirements</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* ITP Instances */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Active ITP Instances</h3>
              {itpInstances.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h4 className="text-lg font-medium text-gray-900 mb-2">No Active ITP Instances</h4>
                  <p className="text-gray-600">ITP instances will be created when tasks are assigned ITP requirements</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {itpInstances.map((instance) => (
                    <div key={instance.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h4 className="font-medium text-gray-900">ITP Instance</h4>
                          <p className="text-sm text-gray-600">Created {format(instance.created_at, 'MMM dd, yyyy')}</p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            instance.status === 'completed' ? 'bg-green-100 text-green-800' :
                            instance.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                            instance.status === 'overdue' ? 'bg-red-100 text-red-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {instance.status.replace('_', ' ')}
                          </span>
                          <button
                            onClick={() => setSelectedITPInstance(instance)}
                            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                          >
                            View Details
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* Modals */}
      <CreateITPTemplateModal
        isOpen={showCreateITPModal}
        onClose={() => setShowCreateITPModal(false)}
        onTemplateCreated={() => {
          setShowCreateITPModal(false);
          loadITPData();
          toast.success('ITP template created successfully!');
        }}
      />

      <ITPInstanceModal
        isOpen={!!selectedITPInstance}
        onClose={() => setSelectedITPInstance(null)}
        instance={selectedITPInstance}
        onInstanceUpdated={() => {
          setSelectedITPInstance(null);
          loadITPData();
        }}
      />
    </div>
  );
} 