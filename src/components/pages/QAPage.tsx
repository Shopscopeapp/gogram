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
import type { QAAlert, QAChecklistItem, ITPTemplate, ITPInstance, SafetyReport, SafetyTraining, SafetyInspection, SafetyCompliance } from '../../types';
import CreateITPTemplateModal from '../modals/CreateITPTemplateModal';
import ITPInstanceModal from '../modals/ITPInstanceModal';
import ITPTemplateModal from '../modals/ITPTemplateModal';
import safetyService from '../../services/safetyService';
import SafetyTrainingModal from '../modals/SafetyTrainingModal';
import SafetyInspectionModal from '../modals/SafetyInspectionModal';
import SafetyComplianceModal from '../modals/SafetyComplianceModal';

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
    generateQAAlerts,
    completeQAChecklistItem,
    updateQAAlertStatus
  } = useAppStore();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'qa' | 'itp' | 'safety'>('qa');
  const [showCreateITPModal, setShowCreateITPModal] = useState(false);
  const [selectedITPInstance, setSelectedITPInstance] = useState<ITPInstance | null>(null);
  const [selectedITPTemplate, setSelectedITPTemplate] = useState<ITPTemplate | null>(null);
  const [itpTemplates, setItpTemplates] = useState<ITPTemplate[]>([]);
  const [itpInstances, setItpInstances] = useState<ITPInstance[]>([]);
  
  // Safety state
  const [safetyReports, setSafetyReports] = useState<SafetyReport[]>([]);
  const [safetyTraining, setSafetyTraining] = useState<SafetyTraining[]>([]);
  const [safetyInspections, setSafetyInspections] = useState<SafetyInspection[]>([]);
  const [safetyCompliance, setSafetyCompliance] = useState<SafetyCompliance[]>([]);
  const [safetyStats, setSafetyStats] = useState({
    totalInspections: 0,
    passedInspections: 0,
    pendingInspections: 0,
    criticalIssues: 0,
    totalTraining: 0,
    completedTraining: 0,
    complianceScore: 0
  });
  
  // Safety modals
  const [showSafetyTrainingModal, setShowSafetyTrainingModal] = useState(false);
  const [showSafetyInspectionModal, setShowSafetyInspectionModal] = useState(false);
  const [showSafetyComplianceModal, setShowSafetyComplianceModal] = useState(false);
  const [selectedSafetyTraining, setSelectedSafetyTraining] = useState<SafetyTraining | null>(null);
  const [selectedSafetyInspection, setSelectedSafetyInspection] = useState<SafetyInspection | null>(null);
  const [selectedSafetyCompliance, setSelectedSafetyCompliance] = useState<SafetyCompliance | null>(null);

  // Initialize QA alerts on component mount
  useEffect(() => {
    if (currentProject) {
      // Load QA alerts and ITP data
      loadITPData();
      loadSafetyData();
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

  const loadSafetyData = async () => {
    if (!currentProject) return;
    
    try {
      // Load safety data
      const [reports, training, inspections, compliance, stats] = await Promise.all([
        safetyService.getSafetyReports(currentProject.id),
        safetyService.getSafetyTraining(currentProject.id),
        safetyService.getSafetyInspections(currentProject.id),
        safetyService.getSafetyCompliance(currentProject.id),
        safetyService.getSafetyStats(currentProject.id)
      ]);

      setSafetyReports(reports);
      setSafetyTraining(training);
      setSafetyInspections(inspections);
      setSafetyCompliance(compliance);
      setSafetyStats(stats);
    } catch (error) {
      console.error('Error loading safety data:', error);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await loadITPData();
      toast.success('Data refreshed!');
    } catch (error) {
      toast.error('Failed to refresh data');
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

  // Safety handlers
  const handleGenerateMonthlyReport = async () => {
    if (!currentProject) return;
    
    try {
      const now = new Date();
      const report = await safetyService.generateMonthlyReport(
        currentProject.id,
        now.getMonth() + 1,
        now.getFullYear()
      );
      
      if (report) {
        toast.success('Monthly safety report generated successfully!');
        await loadSafetyData(); // Refresh data
      } else {
        toast.error('Failed to generate monthly report');
      }
    } catch (error) {
      console.error('Error generating monthly report:', error);
      toast.error('Failed to generate monthly report');
    }
  };

  const handleSafetyTrainingSave = (training: SafetyTraining) => {
    setSafetyTraining(prev => {
      const existing = prev.find(t => t.id === training.id);
      if (existing) {
        return prev.map(t => t.id === training.id ? training : t);
      } else {
        return [...prev, training];
      }
    });
  };

  const handleSafetyInspectionSave = (inspection: SafetyInspection) => {
    setSafetyInspections(prev => {
      const existing = prev.find(i => i.id === inspection.id);
      if (existing) {
        return prev.map(i => i.id === inspection.id ? inspection : i);
      } else {
        return [...prev, inspection];
      }
    });
  };

  const handleSafetyComplianceSave = (compliance: SafetyCompliance) => {
    setSafetyCompliance(prev => {
      const existing = prev.find(c => c.id === compliance.id);
      if (existing) {
        return prev.map(c => c.id === compliance.id ? compliance : c);
      } else {
        return [...prev, compliance];
      }
    });
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
                    <div 
                      key={template.id} 
                      className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer hover:border-blue-300"
                      onClick={() => setSelectedITPTemplate(template)}
                    >
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
                      <div className="mt-3 pt-3 border-t border-gray-100">
                        <button 
                          className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedITPTemplate(template);
                          }}
                        >
                          View Details →
                        </button>
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

      {activeTab === 'safety' && (
        <>
          {/* Safety Requirements Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="text-2xl font-bold text-gray-900">{safetyStats.totalInspections}</div>
              <div className="text-sm text-gray-600">Safety Inspections</div>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="text-2xl font-bold text-green-600">{safetyStats.passedInspections}</div>
              <div className="text-sm text-gray-600">Completed</div>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="text-2xl font-bold text-yellow-600">{safetyStats.pendingInspections}</div>
              <div className="text-sm text-gray-600">Pending</div>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="text-2xl font-bold text-red-600">{safetyStats.criticalIssues}</div>
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
              {safetyReports.length === 0 ? (
                <div className="text-center py-12">
                  <Shield className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h4 className="text-lg font-medium text-gray-900 mb-2">No Safety Reports Yet</h4>
                  <p className="text-gray-600 mb-4">Generate monthly safety reports to track inspections, incidents, and compliance</p>
                  <button
                    onClick={handleGenerateMonthlyReport}
                    className="btn btn-primary"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Generate Monthly Report
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {safetyReports.slice(0, 3).map((report) => (
                    <div key={report.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-gray-900">{report.title}</h4>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          report.status === 'completed' ? 'bg-green-100 text-green-800' :
                          report.status === 'draft' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {report.status}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{report.summary}</p>
                      <p className="text-xs text-gray-500">Generated {format(new Date(report.created_at), 'MMM dd, yyyy')}</p>
                    </div>
                  ))}
                  <button
                    onClick={handleGenerateMonthlyReport}
                    className="btn btn-outline w-full"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Generate New Report
                  </button>
                </div>
              )}
            </div>

            {/* Safety Training Records */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Safety Training Records</h3>
                <button
                  onClick={() => setShowSafetyTrainingModal(true)}
                  className="btn btn-outline btn-sm"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Training Record
                </button>
              </div>
              {safetyTraining.length === 0 ? (
                <div className="text-center py-8">
                  <User className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h4 className="text-lg font-medium text-gray-900 mb-2">No Training Records</h4>
                  <p className="text-gray-600 mb-4">Track safety training sessions, certifications, and compliance requirements</p>
                  <button
                    onClick={() => setShowSafetyTrainingModal(true)}
                    className="btn btn-primary"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add First Training Record
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {safetyTraining.slice(0, 5).map((training) => (
                    <div key={training.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-gray-900">{training.title}</h4>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          training.status === 'completed' ? 'bg-green-100 text-green-800' :
                          training.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                          training.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {training.status.replace('_', ' ')}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{training.description}</p>
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>{format(new Date(training.training_date), 'MMM dd, yyyy')}</span>
                        <span>{training.duration_hours}h • {training.instructor || 'No instructor'}</span>
                      </div>
                    </div>
                  ))}
                  {safetyTraining.length > 5 && (
                    <button
                      onClick={() => setShowSafetyTrainingModal(true)}
                      className="btn btn-outline w-full"
                    >
                      View All Training Records
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Safety Compliance Checklist */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Safety Compliance Checklist</h3>
                <button
                  onClick={() => setShowSafetyComplianceModal(true)}
                  className="btn btn-outline btn-sm"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create Checklist
                </button>
              </div>
              {safetyCompliance.length === 0 ? (
                <div className="text-center py-8">
                  <CheckSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h4 className="text-lg font-medium text-gray-900 mb-2">No Safety Checklists</h4>
                  <p className="text-gray-600 mb-4">Create and manage safety compliance checklists for site inspections</p>
                  <button
                    onClick={() => setShowSafetyComplianceModal(true)}
                    className="btn btn-primary"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Create First Checklist
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {safetyCompliance.slice(0, 5).map((compliance) => (
                    <div key={compliance.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-gray-900">{compliance.title}</h4>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          compliance.compliant ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {compliance.compliant ? 'Compliant' : 'Non-Compliant'}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{compliance.description}</p>
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>{format(new Date(compliance.check_date), 'MMM dd, yyyy')}</span>
                        <span>{compliance.compliance_type.replace('_', ' ')}</span>
                      </div>
                    </div>
                  ))}
                  {safetyCompliance.length > 5 && (
                    <button
                      onClick={() => setShowSafetyComplianceModal(true)}
                      className="btn btn-outline w-full"
                    >
                      View All Compliance Records
                    </button>
                  )}
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
          toast.success('ITP template updated successfully!');
        }}
        template={selectedITPTemplate}
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

      <ITPTemplateModal
        isOpen={!!selectedITPTemplate}
        onClose={() => setSelectedITPTemplate(null)}
        template={selectedITPTemplate}
        onEdit={(template) => {
          setSelectedITPTemplate(null);
          setShowCreateITPModal(true);
          // The modal will automatically populate with the template data
        }}
      />

      {/* Safety Modals */}
      <SafetyTrainingModal
        isOpen={showSafetyTrainingModal}
        onClose={() => setShowSafetyTrainingModal(false)}
        onSave={handleSafetyTrainingSave}
        projectId={currentProject?.id || ''}
        training={selectedSafetyTraining}
      />

      <SafetyInspectionModal
        isOpen={showSafetyInspectionModal}
        onClose={() => setShowSafetyInspectionModal(false)}
        onSave={handleSafetyInspectionSave}
        projectId={currentProject?.id || ''}
        inspection={selectedSafetyInspection}
      />

      <SafetyComplianceModal
        isOpen={showSafetyComplianceModal}
        onClose={() => setShowSafetyComplianceModal(false)}
        onSave={handleSafetyComplianceSave}
        projectId={currentProject?.id || ''}
        compliance={selectedSafetyCompliance}
      />
    </div>
  );
} 