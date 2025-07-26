import type { Task, TaskDelay, TaskChangeProposal, Project, Delivery, QAAlert } from '../types';
import { format, differenceInDays, startOfWeek, endOfWeek } from 'date-fns';

interface DelayRegisterEntry {
  taskId: string;
  taskTitle: string;
  category: string;
  originalStartDate: Date;
  originalEndDate: Date;
  actualStartDate?: Date;
  actualEndDate?: Date;
  plannedDuration: number;
  actualDuration?: number;
  delayDays: number;
  delayReason?: string;
  impactDescription?: string;
  responsibleParty?: string;
  mitigationActions?: string;
  costImpact?: number;
  status: string;
}

interface ProgressReportData {
  reportDate: Date;
  projectName: string;
  totalTasks: number;
  completedTasks: number;
  completionPercentage: number;
  tasksOnSchedule: number;
  delayedTasks: number;
  criticalPath: Task[];
  upcomingMilestones: Task[];
  keyIssues: string[];
  nextWeekFocus: string[];
  weatherImpact?: string;
  safetyNotes?: string;
}

interface ChangeHistoryEntry {
  changeId: string;
  taskId: string;
  taskTitle: string;
  changeType: 'date_change' | 'scope_change' | 'resource_change';
  proposedBy: string;
  proposedDate: Date;
  approvedBy?: string;
  approvedDate?: Date;
  status: 'pending' | 'approved' | 'rejected';
  originalValue: string;
  newValue: string;
  reason: string;
  impact: string;
  reviewComments?: string;
}

interface ReportOptions {
  includeDelays?: boolean;
  includeQA?: boolean;
  includeSuppliers?: boolean;
  includeFinancials?: boolean;
  includePhotos?: boolean;
  dateRange?: {
    start: Date;
    end: Date;
  };
  format: 'pdf' | 'excel' | 'json';
  template?: 'executive' | 'detailed' | 'stakeholder';
}

class ReportingService {
  /**
   * Generate delay register report
   */
  public generateDelayRegister(
    tasks: Task[],
    taskDelays: TaskDelay[],
    options: ReportOptions = { format: 'pdf' }
  ): DelayRegisterEntry[] {
    const delayEntries: DelayRegisterEntry[] = [];

    for (const task of tasks) {
      const taskDelaysForTask = taskDelays.filter(delay => delay.taskId === task.id);
      
      if (taskDelaysForTask.length > 0 || task.status === 'delayed') {
        const totalDelayDays = taskDelaysForTask.reduce(
          (total, delay) => total + delay.delayDays, 
          0
        );

        const entry: DelayRegisterEntry = {
          taskId: task.id,
          taskTitle: task.title,
          category: task.category,
          originalStartDate: task.startDate,
          originalEndDate: task.endDate,
          actualStartDate: task.actualStartDate,
          actualEndDate: task.actualEndDate,
          plannedDuration: task.plannedDuration,
          actualDuration: task.actualDuration,
          delayDays: totalDelayDays,
          delayReason: taskDelaysForTask.map(d => d.reason).join('; '),
          impactDescription: taskDelaysForTask.map(d => d.impact).join('; '),
          responsibleParty: taskDelaysForTask[0]?.responsibleParty,
          mitigationActions: taskDelaysForTask.map(d => d.mitigationActions).filter(Boolean).join('; '),
          costImpact: taskDelaysForTask.reduce((total, d) => total + (d.costImpact || 0), 0),
          status: task.status
        };

        delayEntries.push(entry);
      }
    }

    return delayEntries.sort((a, b) => b.delayDays - a.delayDays);
  }

  /**
   * Generate change history report
   */
  public generateChangeHistory(
    taskChangeProposals: TaskChangeProposal[],
    tasks: Task[]
  ): ChangeHistoryEntry[] {
    return taskChangeProposals.map(proposal => {
      const task = tasks.find(t => t.id === proposal.taskId);
      
      return {
        changeId: proposal.id,
        taskId: proposal.taskId,
        taskTitle: task?.title || 'Unknown Task',
        changeType: 'date_change', // Simplified for now
        proposedBy: proposal.proposedBy,
        proposedDate: proposal.createdAt,
        approvedBy: proposal.reviewedBy,
        approvedDate: proposal.reviewedAt,
        status: proposal.status,
        originalValue: task ? `${format(task.startDate, 'MMM dd')} - ${format(task.endDate, 'MMM dd')}` : '',
        newValue: proposal.proposedStartDate && proposal.proposedEndDate 
          ? `${format(proposal.proposedStartDate, 'MMM dd')} - ${format(proposal.proposedEndDate, 'MMM dd')}`
          : '',
        reason: proposal.reason,
        impact: proposal.impact || 'Schedule adjustment',
        reviewComments: proposal.reviewComments
      };
    }).sort((a, b) => b.proposedDate.getTime() - a.proposedDate.getTime());
  }

  /**
   * Generate progress report data
   */
  public generateProgressReport(
    project: Project,
    tasks: Task[],
    options: ReportOptions = { format: 'pdf' }
  ): ProgressReportData {
    const completedTasks = tasks.filter(t => t.status === 'completed');
    const delayedTasks = tasks.filter(t => t.status === 'delayed');
    const onScheduleTasks = tasks.filter(t => 
      t.status !== 'delayed' && t.status !== 'completed'
    );

    // Get upcoming milestones (next 2 weeks)
    const twoWeeksFromNow = new Date();
    twoWeeksFromNow.setDate(twoWeeksFromNow.getDate() + 14);
    
    const upcomingMilestones = tasks.filter(task => 
      task.endDate <= twoWeeksFromNow && 
      task.status !== 'completed' &&
      (task.priority === 'high' || task.priority === 'critical')
    );

    // Generate key issues
    const keyIssues: string[] = [];
    if (delayedTasks.length > 0) {
      keyIssues.push(`${delayedTasks.length} tasks currently delayed`);
    }
    if (upcomingMilestones.length > 3) {
      keyIssues.push(`${upcomingMilestones.length} critical milestones due within 2 weeks`);
    }

    // Generate next week focus
    const nextWeekStart = startOfWeek(new Date());
    nextWeekStart.setDate(nextWeekStart.getDate() + 7);
    const nextWeekEnd = endOfWeek(nextWeekStart);

    const nextWeekTasks = tasks.filter(task =>
      task.startDate >= nextWeekStart && task.startDate <= nextWeekEnd
    );

    const nextWeekFocus = nextWeekTasks
      .slice(0, 5)
      .map(task => `${task.title} (${task.category})`);

    return {
      reportDate: new Date(),
      projectName: project.name,
      totalTasks: tasks.length,
      completedTasks: completedTasks.length,
      completionPercentage: Math.round((completedTasks.length / tasks.length) * 100),
      tasksOnSchedule: onScheduleTasks.length,
      delayedTasks: delayedTasks.length,
      criticalPath: this.calculateCriticalPath(tasks),
      upcomingMilestones,
      keyIssues,
      nextWeekFocus,
      weatherImpact: 'Weather conditions favorable for outdoor work',
      safetyNotes: 'No safety incidents reported this period'
    };
  }

  /**
   * Calculate critical path (simplified)
   */
  private calculateCriticalPath(tasks: Task[]): Task[] {
    // Simplified critical path calculation
    // In a real implementation, this would use more sophisticated algorithms
    return tasks
      .filter(task => task.priority === 'critical' || task.dependencies.length > 0)
      .sort((a, b) => a.startDate.getTime() - b.startDate.getTime())
      .slice(0, 10);
  }

  /**
   * Generate executive summary
   */
  public generateExecutiveSummary(
    project: Project,
    tasks: Task[],
    taskDelays: TaskDelay[]
  ): {
    overallStatus: 'on_track' | 'at_risk' | 'delayed';
    completionPercentage: number;
    projectedCompletion: Date;
    budgetStatus: 'on_budget' | 'over_budget' | 'under_budget';
    keyMetrics: Record<string, number>;
    riskAreas: string[];
    recommendations: string[];
  } {
    const completedTasks = tasks.filter(t => t.status === 'completed').length;
    const completionPercentage = Math.round((completedTasks / tasks.length) * 100);
    const delayedTasks = tasks.filter(t => t.status === 'delayed').length;
    
    // Determine overall status
    let overallStatus: 'on_track' | 'at_risk' | 'delayed' = 'on_track';
    if (delayedTasks > tasks.length * 0.2) {
      overallStatus = 'delayed';
    } else if (delayedTasks > tasks.length * 0.1) {
      overallStatus = 'at_risk';
    }

    // Calculate projected completion (simplified)
    const remainingTasks = tasks.filter(t => t.status !== 'completed');
    const avgTaskDuration = tasks.reduce((sum, t) => sum + t.plannedDuration, 0) / tasks.length;
    const projectedDays = remainingTasks.length * avgTaskDuration * 0.8; // Account for parallelization
    const projectedCompletion = new Date();
    projectedCompletion.setDate(projectedCompletion.getDate() + projectedDays);

    return {
      overallStatus,
      completionPercentage,
      projectedCompletion,
      budgetStatus: 'on_budget', // Simplified
      keyMetrics: {
        totalTasks: tasks.length,
        completedTasks,
        delayedTasks,
        onScheduleTasks: tasks.length - completedTasks - delayedTasks,
        totalDelayDays: taskDelays.reduce((sum, d) => sum + d.delayDays, 0)
      },
      riskAreas: [
        ...(delayedTasks > 5 ? ['Schedule delays affecting multiple tasks'] : []),
        ...(taskDelays.some(d => d.costImpact && d.costImpact > 10000) ? ['Significant cost impacts from delays'] : []),
        ...(tasks.filter(t => t.category === 'Concrete' && t.status === 'delayed').length > 0 ? ['Weather-sensitive concrete work at risk'] : [])
      ],
      recommendations: [
        ...(delayedTasks > 0 ? ['Implement mitigation strategies for delayed tasks'] : []),
        'Continue monitoring critical path activities',
        'Maintain regular stakeholder communication'
      ]
    };
  }

  /**
   * Export to Excel format (simulated)
   */
  public async exportToExcel(
    data: any,
    reportType: string,
    filename: string
  ): Promise<void> {
    // In a real implementation, you would use a library like xlsx or exceljs
    console.log('📊 Exporting to Excel:', {
      reportType,
      filename,
      recordCount: Array.isArray(data) ? data.length : 'N/A'
    });

    // Simulate export process
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // In production, this would trigger a download
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}.json`; // Would be .xlsx in production
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  /**
   * Export to PDF format (simulated)
   */
  public async exportToPDF(
    data: any,
    reportType: string,
    filename: string,
    options: ReportOptions
  ): Promise<void> {
    // In a real implementation, you would use a library like jsPDF or Puppeteer
    console.log('📄 Exporting to PDF:', {
      reportType,
      filename,
      template: options.template,
      includeQA: options.includeQA
    });

    // Simulate PDF generation
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Generate PDF content (simplified HTML representation)
    const htmlContent = this.generateHTMLReport(data, reportType, options);
    
    // In production, this would generate an actual PDF
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}.html`; // Would be .pdf in production
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  /**
   * Generate HTML report template
   */
  private generateHTMLReport(
    data: any,
    reportType: string,
    options: ReportOptions
  ): string {
    const styles = `
      <style>
        body { font-family: Arial, sans-serif; margin: 40px; color: #333; }
        .header { border-bottom: 3px solid #3b82f6; padding-bottom: 20px; margin-bottom: 30px; }
        .logo { font-size: 24px; font-weight: bold; color: #3b82f6; }
        .report-title { font-size: 28px; font-weight: bold; margin: 10px 0; }
        .report-date { color: #666; }
        .section { margin: 30px 0; }
        .section-title { font-size: 20px; font-weight: bold; color: #1f2937; border-bottom: 1px solid #e5e7eb; padding-bottom: 10px; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th, td { border: 1px solid #e5e7eb; padding: 12px; text-align: left; }
        th { background-color: #f9fafb; font-weight: bold; }
        .status-completed { color: #22c55e; font-weight: bold; }
        .status-delayed { color: #ef4444; font-weight: bold; }
        .status-pending { color: #f59e0b; font-weight: bold; }
        .metric-box { display: inline-block; background: #f9fafb; border: 1px solid #e5e7eb; padding: 15px; margin: 10px; border-radius: 8px; text-align: center; min-width: 120px; }
        .metric-value { font-size: 24px; font-weight: bold; color: #3b82f6; }
        .metric-label { font-size: 12px; color: #666; text-transform: uppercase; }
        .footer { margin-top: 50px; border-top: 1px solid #e5e7eb; padding-top: 20px; text-align: center; color: #666; font-size: 12px; }
      </style>
    `;

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>${reportType} Report</title>
          ${styles}
        </head>
        <body>
          <div class="header">
            <div class="logo">🏗️ Gogram</div>
            <div class="report-title">${reportType} Report</div>
            <div class="report-date">Generated on ${format(new Date(), 'MMMM dd, yyyy')}</div>
          </div>

          <div class="section">
            <div class="section-title">Report Data</div>
            <pre style="background: #f9fafb; padding: 20px; border-radius: 8px; overflow-x: auto;">
              ${JSON.stringify(data, null, 2)}
            </pre>
          </div>

          <div class="footer">
            <p>This report was generated by Gogram Construction Management Platform</p>
            <p>© 2024 Gogram - Professional Construction Project Management</p>
          </div>
        </body>
      </html>
    `;
  }

  /**
   * Generate report filename with timestamp
   */
  public generateReportFilename(
    reportType: string,
    projectName: string,
    format: 'pdf' | 'excel' | 'json'
  ): string {
    const timestamp = format(new Date(), 'yyyy-MM-dd_HHmm');
    const cleanProjectName = projectName.replace(/[^a-zA-Z0-9]/g, '_');
    return `${cleanProjectName}_${reportType}_${timestamp}`;
  }

  /**
   * Get available report types
   */
  public getAvailableReports(): Array<{
    id: string;
    name: string;
    description: string;
    icon: string;
    formats: ('pdf' | 'excel')[];
    permissions: string[];
  }> {
    return [
      {
        id: 'delay_register',
        name: 'Delay Register',
        description: 'Comprehensive report of all project delays with impact analysis',
        icon: '⏰',
        formats: ['pdf', 'excel'],
        permissions: ['project_manager', 'project_coordinator']
      },
      {
        id: 'progress_report',
        name: 'Progress Report',
        description: 'Weekly/monthly progress summary with key metrics and forecasts',
        icon: '📊',
        formats: ['pdf', 'excel'],
        permissions: ['project_manager', 'project_coordinator']
      },
      {
        id: 'change_history',
        name: 'Change History',
        description: 'Detailed log of all schedule changes and approvals',
        icon: '📋',
        formats: ['pdf', 'excel'],
        permissions: ['project_manager']
      },
      {
        id: 'executive_summary',
        name: 'Executive Summary',
        description: 'High-level project status for stakeholders and executives',
        icon: '📈',
        formats: ['pdf'],
        permissions: ['project_manager']
      },
      {
        id: 'qa_report',
        name: 'Quality Assurance Report',
        description: 'Summary of QA activities, inspections, and compliance status',
        icon: '🔍',
        formats: ['pdf', 'excel'],
        permissions: ['project_manager', 'project_coordinator']
      }
    ];
  }
}

// Export singleton instance
export const reportingService = new ReportingService();
export default reportingService;
export type { DelayRegisterEntry, ProgressReportData, ChangeHistoryEntry, ReportOptions }; 