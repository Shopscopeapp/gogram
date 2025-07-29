import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  BarChart3, 
  Download, 
  Calendar, 
  FileText, 
  TrendingUp,
  Clock,
  AlertTriangle,
  CheckCircle,
  Eye,
  Settings
} from 'lucide-react';
import { useAppStore } from '../../store';
import { format } from 'date-fns';
import reportingService, { type ReportOptions } from '../../services/reportingService';
import toast from 'react-hot-toast';

interface ReportCardProps {
  report: {
    id: string;
    name: string;
    description: string;
    icon: string;
    formats: ('pdf' | 'excel')[];
    permissions: string[];
  };
  onGenerate: (reportId: string, format: 'pdf' | 'excel', options: ReportOptions) => void;
  userRole: string;
}

function ReportCard({ report, onGenerate, userRole }: ReportCardProps) {
  const [generating, setGenerating] = useState<string | null>(null);
  const [showOptions, setShowOptions] = useState(false);
  const [options, setOptions] = useState<ReportOptions>({
    format: 'pdf',
    template: 'detailed',
    includeDelays: true,
    includeQA: true,
    includeSuppliers: true
  });

  const canAccess = report.permissions.includes(userRole);

  const handleGenerate = async (format: 'pdf' | 'excel') => {
    if (!canAccess) return;
    
    setGenerating(format);
    try {
      await onGenerate(report.id, format, { ...options, format });
    } finally {
      setGenerating(null);
    }
  };

  if (!canAccess) {
    return (
      <div className="card p-6 opacity-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="text-2xl">{report.icon}</div>
            <div>
              <h3 className="font-medium text-gray-900">{report.name}</h3>
              <p className="text-sm text-gray-500">Access restricted</p>
            </div>
          </div>
          <div className="text-gray-400">
            🔒
          </div>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="card hover:shadow-lg transition-shadow duration-200"
    >
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-start space-x-3">
            <div className="text-2xl">{report.icon}</div>
            <div>
              <h3 className="font-medium text-gray-900 mb-1">{report.name}</h3>
              <p className="text-sm text-gray-600">{report.description}</p>
              {report.id === 'progress_report' && (
                <div className="mt-1">
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    <Clock className="w-3 h-3 mr-1" />
                    Coming Soon
                  </span>
                </div>
              )}
            </div>
          </div>
          <button
            onClick={() => setShowOptions(!showOptions)}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>

        {showOptions && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="border-t border-gray-200 pt-4 mb-4 space-y-3"
          >
            <div>
              <label className="text-sm font-medium text-gray-700">Template</label>
              <select
                value={options.template}
                onChange={(e) => setOptions(prev => ({ ...prev, template: e.target.value as any }))}
                className="mt-1 block w-full text-sm border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="executive">Executive Summary</option>
                <option value="detailed">Detailed Report</option>
                <option value="stakeholder">Stakeholder View</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={options.includeDelays}
                  onChange={(e) => setOptions(prev => ({ ...prev, includeDelays: e.target.checked }))}
                  className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="ml-2 text-sm text-gray-700">Include Delays</span>
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={options.includeQA}
                  onChange={(e) => setOptions(prev => ({ ...prev, includeQA: e.target.checked }))}
                  className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="ml-2 text-sm text-gray-700">Include QA</span>
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={options.includeSuppliers}
                  onChange={(e) => setOptions(prev => ({ ...prev, includeSuppliers: e.target.checked }))}
                  className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="ml-2 text-sm text-gray-700">Include Suppliers</span>
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={options.includeFinancials}
                  onChange={(e) => setOptions(prev => ({ ...prev, includeFinancials: e.target.checked }))}
                  className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="ml-2 text-sm text-gray-700">Include Financials</span>
              </label>
            </div>
          </motion.div>
        )}

        <div className="flex items-center justify-between">
          <div className="text-xs text-gray-500">
            Available formats: {report.formats.join(', ').toUpperCase()}
          </div>
          <div className="flex items-center space-x-2">
            {report.id === 'progress_report' ? (
              <div className="text-xs text-gray-400 italic">
                Feature coming soon
              </div>
            ) : (
              <>
                {report.formats.includes('pdf') && (
                  <button
                    onClick={() => handleGenerate('pdf')}
                    disabled={generating === 'pdf'}
                    className="btn btn-primary btn-sm flex items-center space-x-1"
                  >
                    {generating === 'pdf' ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Generating...</span>
                      </>
                    ) : (
                      <>
                        <FileText className="w-4 h-4" />
                        <span>PDF</span>
                      </>
                    )}
                  </button>
                )}
                
                {report.formats.includes('excel') && (
                  <button
                    onClick={() => handleGenerate('excel')}
                    disabled={generating === 'excel'}
                    className="btn btn-secondary btn-sm flex items-center space-x-1"
                  >
                    {generating === 'excel' ? (
                      <>
                        <div className="w-4 h-4 border-2 border-gray-600 border-t-transparent rounded-full animate-spin" />
                        <span>Generating...</span>
                      </>
                    ) : (
                      <>
                        <BarChart3 className="w-4 h-4" />
                        <span>Excel</span>
                      </>
                    )}
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default function ReportsPage() {
  const { 
    currentUser, 
    currentProject, 
    tasks, 
    taskDelays, 
    taskChangeProposals,
    qaAlerts,
    isProjectManager 
  } = useAppStore();

  const [selectedDateRange, setSelectedDateRange] = useState({
    start: format(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
    end: format(new Date(), 'yyyy-MM-dd')
  });

  if (!currentUser || !currentProject) {
    return <div>Loading...</div>;
  }

  const availableReports = reportingService.getAvailableReports();

  const handleGenerateReport = async (
    reportId: string, 
    format: 'pdf' | 'excel', 
    options: ReportOptions
  ) => {
    const loadingToast = toast.loading(`Generating ${format.toUpperCase()} report...`);

    try {
      let data: any;
      let reportName: string;

      // Generate report data based on type
      switch (reportId) {
        case 'delay_register':
          data = reportingService.generateDelayRegister(tasks, taskDelays);
          reportName = 'Delay Register';
          break;
        
        case 'progress_report':
          toast.error('Progress Report feature is coming soon!');
          return;
          break;
        
        case 'change_history':
          data = reportingService.generateChangeHistory(taskChangeProposals, tasks);
          reportName = 'Change History';
          break;
        
        case 'executive_summary':
          data = reportingService.generateExecutiveSummary(currentProject, tasks, taskDelays);
          reportName = 'Executive Summary';
          break;
        
        case 'qa_report':
          data = { qaAlerts, summary: { total: qaAlerts.length, completed: qaAlerts.filter(a => a.status === 'completed').length } };
          reportName = 'Quality Assurance Report';
          break;
        
        default:
          throw new Error('Unknown report type');
      }

      // Generate filename
      const filename = reportingService.generateReportFilename(
        reportName,
        currentProject.name,
        format
      );

      // Export the report
      if (format === 'pdf') {
        await reportingService.exportToPDF(data, reportName, filename, options);
      } else {
        await reportingService.exportToExcel(data, reportName, filename);
      }

      toast.success(`${reportName} exported successfully!`, { id: loadingToast });
    } catch (error) {
      console.error('Error generating report:', error);
      toast.error('Failed to generate report. Please try again.', { id: loadingToast });
    }
  };

  // Generate some quick stats
  const stats = {
    totalReports: availableReports.length,
    availableToUser: availableReports.filter(r => 
      r.permissions.includes(currentUser.role)
    ).length,
    delayedTasks: tasks.filter(t => t.status === 'delayed').length,
    completionRate: Math.round((tasks.filter(t => t.status === 'completed').length / tasks.length) * 100)
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Project Reports</h1>
          <p className="text-gray-600 mt-1">
            Generate comprehensive construction project reports and analytics
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <Calendar className="w-4 h-4" />
            <span>Date Range:</span>
          </div>
          <input
            type="date"
            value={selectedDateRange.start}
            onChange={(e) => setSelectedDateRange(prev => ({ ...prev, start: e.target.value }))}
            className="text-sm border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
          />
          <span className="text-gray-400">to</span>
          <input
            type="date"
            value={selectedDateRange.end}
            onChange={(e) => setSelectedDateRange(prev => ({ ...prev, end: e.target.value }))}
            className="text-sm border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
          />
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card p-4 text-center">
          <div className="text-2xl font-bold text-primary-600">{stats.availableToUser}</div>
          <div className="text-sm text-gray-600">Available Reports</div>
        </div>
        <div className="card p-4 text-center">
          <div className="text-2xl font-bold text-success-600">{stats.completionRate}%</div>
          <div className="text-sm text-gray-600">Project Complete</div>
        </div>
        <div className="card p-4 text-center">
          <div className="text-2xl font-bold text-danger-600">{stats.delayedTasks}</div>
          <div className="text-sm text-gray-600">Delayed Tasks</div>
        </div>
        <div className="card p-4 text-center">
          <div className="text-2xl font-bold text-gray-600">{tasks.length}</div>
          <div className="text-sm text-gray-600">Total Tasks</div>
        </div>
      </div>

      {/* Report Categories */}
      <div className="space-y-6">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">📊 Schedule & Progress Reports</h2>
          <div className="grid lg:grid-cols-2 gap-6">
            {availableReports
              .filter(report => ['delay_register', 'progress_report', 'change_history'].includes(report.id))
              .map(report => (
                <ReportCard
                  key={report.id}
                  report={report}
                  onGenerate={handleGenerateReport}
                  userRole={currentUser.role}
                />
              ))}
          </div>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">📈 Executive & Summary Reports</h2>
          <div className="grid lg:grid-cols-2 gap-6">
            {availableReports
              .filter(report => ['executive_summary', 'qa_report'].includes(report.id))
              .map(report => (
                <ReportCard
                  key={report.id}
                  report={report}
                  onGenerate={handleGenerateReport}
                  userRole={currentUser.role}
                />
              ))}
          </div>
        </div>
      </div>

      {/* Coming Soon: Progress Reports */}
      <div className="space-y-6">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">📊 Progress Reports</h2>
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6">
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-blue-600" />
                </div>
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-blue-900 mb-2">Progress Report Integration</h3>
                <p className="text-blue-700 mb-3">
                  Advanced progress tracking with automated reporting, visual dashboards, and customizable templates. 
                  Generate comprehensive progress reports with real-time data and trend analysis.
                </p>
                <div className="flex items-center space-x-4 text-sm text-blue-600">
                  <span className="flex items-center">
                    <Clock className="w-4 h-4 mr-1" />
                    Coming Soon
                  </span>
                  <span className="flex items-center">
                    <BarChart3 className="w-4 h-4 mr-1" />
                    Automated Dashboards
                  </span>
                  <span className="flex items-center">
                    <Download className="w-4 h-4 mr-1" />
                    PDF/Excel Export
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Coming Soon: Financial Integration */}
      <div className="space-y-6">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">💰 Financial Software Integration</h2>
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-6">
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <FileText className="w-6 h-6 text-green-600" />
                </div>
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-green-900 mb-2">Financial Software Integration</h3>
                <p className="text-green-700 mb-3">
                  Seamless integration with popular construction financial software including Procore, Sage 300, 
                  QuickBooks Construction, and more. Sync budgets, invoices, and financial data automatically.
                </p>
                <div className="flex items-center space-x-4 text-sm text-green-600">
                  <span className="flex items-center">
                    <Clock className="w-4 h-4 mr-1" />
                    Coming Soon
                  </span>
                  <span className="flex items-center">
                    <Settings className="w-4 h-4 mr-1" />
                    API Integration
                  </span>
                  <span className="flex items-center">
                    <Eye className="w-4 h-4 mr-1" />
                    Real-time Sync
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Report Templates Info */}
      <div className="bg-primary-50 border border-primary-200 rounded-lg p-6">
        <h3 className="font-medium text-primary-900 mb-2">📋 Report Templates</h3>
        <div className="grid md:grid-cols-3 gap-4 text-sm text-primary-800">
          <div>
            <strong>Executive:</strong> High-level summary for stakeholders with key metrics and status overview.
          </div>
          <div>
            <strong>Detailed:</strong> Comprehensive report with full data, charts, and technical information.
          </div>
          <div>
            <strong>Stakeholder:</strong> Client-focused view with progress updates and milestone tracking.
          </div>
        </div>
        <div className="mt-4 text-sm text-primary-700">
          💡 <strong>Tip:</strong> Use PDF format for presentation and sharing, Excel format for data analysis.
        </div>
      </div>

      {/* Recent Export History */}
      <div className="card">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Recent Exports</h2>
        </div>
        <div className="p-6">
          <div className="text-center py-8 text-gray-500">
            <Download className="w-12 h-12 mx-auto mb-3 text-gray-400" />
            <p>Export history will appear here after generating reports</p>
          </div>
        </div>
      </div>
    </div>
  );
} 