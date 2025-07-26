import type { Task, TaskDelay, TaskChangeProposal, Project, Delivery, QAAlert } from '../types';
import { format, differenceInDays, startOfWeek, endOfWeek } from 'date-fns';
import jsPDF from 'jspdf';
import * as XLSX from 'xlsx';

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
  delayReason: string;
  impactDescription: string;
  responsibleParty?: string;
  mitigationActions: string;
  costImpact: number;
  status: string;
}

interface ProgressReportData {
  projectInfo: {
    name: string;
    startDate: Date;
    endDate: Date;
    overallProgress: number;
    status: string;
  };
  taskSummary: {
    totalTasks: number;
    completedTasks: number;
    inProgressTasks: number;
    delayedTasks: number;
    pendingTasks: number;
  };
  milestones: Array<{
    title: string;
    dueDate: Date;
    status: 'completed' | 'on_track' | 'at_risk' | 'delayed';
    progress: number;
  }>;
  upcomingDeadlines: Array<{
    taskTitle: string;
    dueDate: Date;
    assignee?: string;
    priority: string;
  }>;
  riskAreas: Array<{
    area: string;
    risk: string;
    impact: 'low' | 'medium' | 'high';
    mitigation: string;
  }>;
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
    taskDelays: TaskDelay[]
  ): DelayRegisterEntry[] {
    const delayEntries: DelayRegisterEntry[] = [];

    for (const task of tasks) {
      const taskDelaysForTask = taskDelays.filter(delay => delay.task_id === task.id);
      
      if (taskDelaysForTask.length > 0 || task.status === 'delayed') {
        const totalDelayDays = taskDelaysForTask.reduce(
          (total, delay) => total + delay.delay_days, 
          0
        );

        const entry: DelayRegisterEntry = {
          taskId: task.id,
          taskTitle: task.title,
          category: task.category,
          originalStartDate: task.start_date,
          originalEndDate: task.end_date,
          actualStartDate: task.actual_start_date,
          actualEndDate: task.actual_end_date,
          plannedDuration: task.planned_duration,
          actualDuration: task.actual_duration,
          delayDays: totalDelayDays,
          delayReason: taskDelaysForTask.map(d => d.reason || '').join('; '),
          impactDescription: taskDelaysForTask.map(d => d.impact || '').join('; '),
          responsibleParty: taskDelaysForTask[0]?.responsible_party,
          mitigationActions: taskDelaysForTask.map(d => d.mitigation_actions).filter(Boolean).join('; '),
          costImpact: taskDelaysForTask.reduce((total, d) => total + (d.cost_impact || 0), 0),
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
      const task = tasks.find(t => t.id === proposal.task_id);
      const taskTitle = task?.title || 'Unknown Task';

      return {
        changeId: proposal.id,
        taskId: proposal.task_id,
        taskTitle,
        changeType: 'date_change' as const,
        proposedBy: proposal.proposed_by || '',
        proposedDate: proposal.created_at,
        approvedBy: proposal.reviewed_by,
        approvedDate: proposal.reviewed_at,
        status: proposal.status,
        originalValue: task ? `${format(task.start_date, 'MMM dd')} - ${format(task.end_date, 'MMM dd')}` : '',
        newValue: proposal.proposed_start_date && proposal.proposed_end_date 
          ? `${format(proposal.proposed_start_date, 'MMM dd')} - ${format(proposal.proposed_end_date, 'MMM dd')}`
          : '',
        reason: proposal.reason,
        impact: proposal.impact || '',
        reviewComments: undefined
      };
    });
  }

  /**
   * Generate comprehensive progress report
   */
  public generateProgressReport(
    project: Project,
    tasks: Task[],
    taskDelays: TaskDelay[],
    qaAlerts: QAAlert[]
  ): ProgressReportData {
    const completedTasks = tasks.filter(t => t.status === 'completed').length;
    const inProgressTasks = tasks.filter(t => t.status === 'in_progress').length;
    const delayedTasks = tasks.filter(t => t.status === 'delayed').length;
    const pendingTasks = tasks.filter(t => t.status === 'pending').length;
    
    const overallProgress = tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 0;

    // Calculate milestones (critical path tasks)
    const criticalTasks = tasks.filter(t => t.priority === 'critical');
    const milestones = criticalTasks.map(task => ({
      title: task.title,
      dueDate: task.end_date,
      status: this.getTaskMilestoneStatus(task, taskDelays),
      progress: task.progress_percentage || 0
    }));

    // Get upcoming deadlines (next 30 days)
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    
    const upcomingDeadlines = tasks
      .filter(t => t.end_date <= thirtyDaysFromNow && t.status !== 'completed')
      .sort((a, b) => a.end_date.getTime() - b.end_date.getTime())
      .slice(0, 10)
      .map(task => ({
        taskTitle: task.title,
        dueDate: task.end_date,
        assignee: task.assigned_to,
        priority: task.priority
      }));

    // Identify risk areas
    const riskAreas = this.identifyRiskAreas(tasks, taskDelays, qaAlerts);

    return {
      projectInfo: {
        name: project.name,
        startDate: project.start_date,
        endDate: project.end_date,
        overallProgress,
        status: project.status
      },
      taskSummary: {
        totalTasks: tasks.length,
        completedTasks,
        inProgressTasks,
        delayedTasks,
        pendingTasks
      },
      milestones,
      upcomingDeadlines,
      riskAreas
    };
  }

  /**
   * Export delay register to various formats
   */
  public async exportDelayRegister(
    delayEntries: DelayRegisterEntry[],
    format: 'pdf' | 'excel' | 'json' = 'json'
  ): Promise<Blob | string> {
    switch (format) {
      case 'json':
        return JSON.stringify(delayEntries, null, 2);
      
      case 'excel':
        return this.generateExcelReport(delayEntries);
      
      case 'pdf':
        return this.generatePDFReport(delayEntries);
      
      default:
        throw new Error(`Unsupported export format: ${format}`);
    }
  }

  /**
   * Generate executive summary
   */
  public generateExecutiveSummary(
    project: Project,
    tasks: Task[], 
    taskDelays: TaskDelay[]
  ): {
    projectHealth: 'excellent' | 'good' | 'at_risk' | 'critical';
    keyMetrics: Record<string, number | string>;
    topRisks: string[];
    recommendations: string[];
  } {
    const completedTasks = tasks.filter(t => t.status === 'completed').length;
    const delayedTasks = tasks.filter(t => t.status === 'delayed').length;
    const overallProgress = Math.round((completedTasks / tasks.length) * 100);
    
    const totalDelayDays = taskDelays.reduce((total, delay) => total + delay.delay_days, 0);
    const avgDelayPerTask = tasks.length > 0 ? totalDelayDays / tasks.length : 0;
    
    const totalCostImpact = taskDelays.reduce((total, delay) => total + (delay.cost_impact || 0), 0);

    // Determine project health
    let projectHealth: 'excellent' | 'good' | 'at_risk' | 'critical';
    if (overallProgress >= 90 && delayedTasks === 0) {
      projectHealth = 'excellent';
    } else if (overallProgress >= 70 && delayedTasks <= 2) {
      projectHealth = 'good';
    } else if (overallProgress >= 50 && delayedTasks <= 5) {
      projectHealth = 'at_risk';
    } else {
      projectHealth = 'critical';
    }

    return {
      projectHealth,
      keyMetrics: {
        'Overall Progress': `${overallProgress}%`,
        'Tasks Completed': `${completedTasks}/${tasks.length}`,
        'Delayed Tasks': delayedTasks,
        'Average Delay': `${avgDelayPerTask.toFixed(1)} days`,
        'Cost Impact': `$${totalCostImpact.toLocaleString()}`,
        'Project Status': project.status
      },
      topRisks: this.identifyTopRisks(tasks, taskDelays),
      recommendations: this.generateRecommendations(projectHealth, tasks, taskDelays)
    };
  }

  /**
   * Generate weekly progress report
   */
  public generateWeeklyProgressReport(
    tasks: Task[],
    startDate: Date = startOfWeek(new Date()),
    endDate: Date = endOfWeek(new Date())
  ): {
    weekRange: string;
    tasksCompleted: Task[];
    tasksStarted: Task[];
    upcomingTasks: Task[];
    delaysReported: number;
    progressPercentage: number;
  } {
    const tasksCompleted = tasks.filter(task => 
      task.status === 'completed' &&
      task.updated_at >= startDate &&
      task.updated_at <= endDate
    );

    const tasksStarted = tasks.filter(task =>
      task.status === 'in_progress' &&
      task.start_date >= startDate &&
      task.start_date <= endDate
    );

    const nextWeekStart = new Date(endDate);
    nextWeekStart.setDate(nextWeekStart.getDate() + 1);
    const nextWeekEnd = new Date(nextWeekStart);
    nextWeekEnd.setDate(nextWeekEnd.getDate() + 7);

    const upcomingTasks = tasks.filter(task =>
      task.start_date >= nextWeekStart &&
      task.start_date <= nextWeekEnd &&
      task.status === 'pending'
    );

    const delaysReported = tasks.filter(task =>
      task.status === 'delayed' &&
      task.updated_at >= startDate &&
      task.updated_at <= endDate
    ).length;

    const totalTasks = tasks.length;
    const completedTasksCount = tasks.filter(t => t.status === 'completed').length;
    const progressPercentage = totalTasks > 0 ? Math.round((completedTasksCount / totalTasks) * 100) : 0;

    return {
      weekRange: `${format(startDate, 'MMM dd')} - ${format(endDate, 'MMM dd, yyyy')}`,
      tasksCompleted,
      tasksStarted,
      upcomingTasks,
      delaysReported,
      progressPercentage
    };
  }

  // Private helper methods
  private getTaskMilestoneStatus(
    task: Task, 
    taskDelays: TaskDelay[]
  ): 'completed' | 'on_track' | 'at_risk' | 'delayed' {
    if (task.status === 'completed') return 'completed';
    if (task.status === 'delayed') return 'delayed';
    
    const hasDelays = taskDelays.some(delay => delay.task_id === task.id);
    if (hasDelays) return 'at_risk';
    
    const daysUntilDue = differenceInDays(task.end_date, new Date());
    if (daysUntilDue < 3) return 'at_risk';
    
    return 'on_track';
  }

  private identifyRiskAreas(
    tasks: Task[], 
    taskDelays: TaskDelay[],
    qaAlerts: QAAlert[]
  ): Array<{
    area: string;
    risk: string;
    impact: 'low' | 'medium' | 'high';
    mitigation: string;
  }> {
    const risks: Array<{
      area: string;
      risk: string;
      impact: 'low' | 'medium' | 'high';
      mitigation: string;
    }> = [];

    // Schedule risks
    const delayedCriticalTasks = tasks.filter(t => 
      t.status === 'delayed' && t.priority === 'critical'
    );
    if (delayedCriticalTasks.length > 0) {
      risks.push({
        area: 'Schedule',
        risk: `${delayedCriticalTasks.length} critical task(s) delayed`,
        impact: 'high',
        mitigation: 'Reallocate resources, review dependencies'
      });
    }

    // Quality risks
    const overdueQA = qaAlerts.filter(alert => 
      alert.status === 'overdue'
    );
    if (overdueQA.length > 0) {
      risks.push({
        area: 'Quality',
        risk: `${overdueQA.length} overdue QA alert(s)`,
        impact: 'medium',
        mitigation: 'Complete inspections, update checklists'
      });
    }

    return risks;
  }

  private identifyTopRisks(tasks: Task[], taskDelays: TaskDelay[]): string[] {
    const risks: string[] = [];
    
    const criticalDelayedTasks = tasks.filter(t => 
      t.status === 'delayed' && t.priority === 'critical'
    ).length;
    
    if (criticalDelayedTasks > 0) {
      risks.push(`${criticalDelayedTasks} critical tasks are delayed`);
    }

    const upcomingCriticalTasks = tasks.filter(t => {
      const daysUntilDue = differenceInDays(t.end_date, new Date());
      return t.priority === 'critical' && daysUntilDue <= 7 && t.status !== 'completed';
    }).length;

    if (upcomingCriticalTasks > 0) {
      risks.push(`${upcomingCriticalTasks} critical tasks due within 7 days`);
    }

    return risks.slice(0, 5); // Top 5 risks
  }

  private generateRecommendations(
    projectHealth: 'excellent' | 'good' | 'at_risk' | 'critical',
    tasks: Task[],
    taskDelays: TaskDelay[]
  ): string[] {
    const recommendations: string[] = [];

    switch (projectHealth) {
      case 'critical':
        recommendations.push('Immediate intervention required - consider additional resources');
        recommendations.push('Review and revise project timeline');
        recommendations.push('Escalate to senior management');
        break;
      case 'at_risk':
        recommendations.push('Focus on delayed critical tasks');
        recommendations.push('Increase monitoring frequency');
        recommendations.push('Consider resource reallocation');
        break;
      case 'good':
        recommendations.push('Continue current pace');
        recommendations.push('Monitor upcoming deadlines closely');
        break;
      case 'excellent':
        recommendations.push('Maintain current performance');
        recommendations.push('Document best practices');
        break;
    }

    return recommendations;
  }

  private async generateExcelReport(delayEntries: DelayRegisterEntry[]): Promise<Blob> {
    // In a real implementation, this would use a library like xlsx
    const csvContent = this.convertToCSV(delayEntries);
    return new Blob([csvContent], { type: 'text/csv' });
  }

  private async generatePDFReport(delayEntries: DelayRegisterEntry[]): Promise<Blob> {
    // In a real implementation, this would use a library like jsPDF
    const htmlContent = this.convertToHTML(delayEntries);
    return new Blob([htmlContent], { type: 'text/html' });
  }

  private convertToCSV(data: DelayRegisterEntry[]): string {
    const headers = Object.keys(data[0] || {});
    const csvRows = [
      headers.join(','),
      ...data.map(row => 
        headers.map(header => {
          const value = (row as any)[header];
          return typeof value === 'string' ? `"${value}"` : value;
        }).join(',')
      )
    ];
    return csvRows.join('\n');
  }

  private convertToHTML(data: DelayRegisterEntry[]): string {
    const headers = Object.keys(data[0] || {});
    const rows = data.map(row => 
      `<tr>${headers.map(header => `<td>${(row as any)[header]}</td>`).join('')}</tr>`
    ).join('');

    return `
      <html>
        <head><title>Delay Register Report</title></head>
        <body>
          <h1>Delay Register Report</h1>
          <table border="1">
            <thead>
              <tr>${headers.map(header => `<th>${header}</th>`).join('')}</tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
        </body>
      </html>
    `;
  }

  /**
   * Export data to PDF format
   */
  public async exportToPDF(
    data: any,
    reportName: string,
    filename: string,
    options: ReportOptions
  ): Promise<void> {
    const doc = new jsPDF();
    
    // Set up document properties
    doc.setProperties({
      title: reportName,
      creator: 'Gogram Construction Management',
      subject: `${reportName} - Generated Report`
    });

    let yPosition = 20;
    const pageHeight = doc.internal.pageSize.height;
    const margin = 20;

    // Helper function to add new page if needed
    const checkNewPage = (requiredHeight: number = 10) => {
      if (yPosition + requiredHeight > pageHeight - margin) {
        doc.addPage();
        yPosition = margin;
      }
    };

    // Header
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text(reportName, margin, yPosition);
    yPosition += 15;

    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(`Generated: ${format(new Date(), 'MMMM dd, yyyy HH:mm')}`, margin, yPosition);
    yPosition += 10;

    // Add content based on data type
    if (Array.isArray(data)) {
      // Handle array data (like delay register, change history)
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      checkNewPage(15);
      doc.text('Report Details', margin, yPosition);
      yPosition += 10;

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');

      data.forEach((item, index) => {
        checkNewPage(25);
        
        // Add item number
        doc.setFont('helvetica', 'bold');
        doc.text(`${index + 1}. ${item.taskTitle || item.name || `Item ${index + 1}`}`, margin, yPosition);
        yPosition += 6;
        
        doc.setFont('helvetica', 'normal');
        
        // Add item details
        Object.entries(item).forEach(([key, value]) => {
          if (key !== 'taskTitle' && key !== 'name' && value !== null && value !== undefined) {
            checkNewPage(6);
            const displayKey = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
            const displayValue = value instanceof Date ? format(value, 'MMM dd, yyyy') : String(value);
            doc.text(`  ${displayKey}: ${displayValue}`, margin + 5, yPosition);
            yPosition += 5;
          }
        });
        
        yPosition += 5; // Space between items
      });
    } else if (typeof data === 'object') {
      // Handle object data (like executive summary)
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      checkNewPage(15);
      doc.text('Summary', margin, yPosition);
      yPosition += 10;

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');

      Object.entries(data).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          checkNewPage(6);
          const displayKey = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
          let displayValue = '';
          
          if (typeof value === 'object' && !Array.isArray(value)) {
            displayValue = JSON.stringify(value, null, 2);
          } else if (Array.isArray(value)) {
            displayValue = `${value.length} items`;
          } else {
            displayValue = value instanceof Date ? format(value, 'MMM dd, yyyy') : String(value);
          }
          
          doc.text(`${displayKey}: ${displayValue}`, margin, yPosition);
          yPosition += 6;
        }
      });
    }

    // Footer
    const pageCount = (doc as any).internal.pages.length - 1; // jsPDF pages includes a null first page
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.text(
        `Page ${i} of ${pageCount} - Generated by Gogram Construction Management`,
        margin,
        pageHeight - 10
      );
    }

    // Save the PDF
    doc.save(`${filename}.pdf`);
  }

  /**
   * Export data to Excel format
   */
  public async exportToExcel(
    data: any,
    reportName: string,
    filename: string
  ): Promise<void> {
    const workbook = XLSX.utils.book_new();
    
    if (Array.isArray(data) && data.length > 0) {
      // Convert array data to worksheet
      const worksheet = XLSX.utils.json_to_sheet(data);
      
      // Set column widths
      const cols = Object.keys(data[0]).map(key => ({
        wch: Math.max(key.length, 15)
      }));
      worksheet['!cols'] = cols;
      
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Report Data');
    } else if (typeof data === 'object') {
      // Convert object data to worksheet
      const flatData = [];
      
      const flatten = (obj: any, prefix = '') => {
        const result: any = {};
        for (const key in obj) {
          if (obj[key] !== null && obj[key] !== undefined) {
            const newKey = prefix ? `${prefix}.${key}` : key;
            if (typeof obj[key] === 'object' && !Array.isArray(obj[key]) && !(obj[key] instanceof Date)) {
              Object.assign(result, flatten(obj[key], newKey));
            } else if (Array.isArray(obj[key])) {
              result[newKey] = `${obj[key].length} items`;
            } else {
              result[newKey] = obj[key] instanceof Date ? format(obj[key], 'yyyy-MM-dd HH:mm') : obj[key];
            }
          }
        }
        return result;
      };
      
      flatData.push(flatten(data));
      const worksheet = XLSX.utils.json_to_sheet(flatData);
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Summary');
    } else {
      // Fallback for other data types
      const worksheet = XLSX.utils.json_to_sheet([{ 'Report': reportName, 'Data': String(data) }]);
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Data');
    }

    // Add metadata sheet
    const metadata = [
      { 'Property': 'Report Name', 'Value': reportName },
      { 'Property': 'Generated Date', 'Value': format(new Date(), 'yyyy-MM-dd HH:mm:ss') },
      { 'Property': 'Generated By', 'Value': 'Gogram Construction Management' },
      { 'Property': 'File Format', 'Value': 'Excel (.xlsx)' }
    ];
    
    const metaWorksheet = XLSX.utils.json_to_sheet(metadata);
    XLSX.utils.book_append_sheet(workbook, metaWorksheet, 'Metadata');

    // Write the file
    XLSX.writeFile(workbook, `${filename}.xlsx`);
  }

  /**
   * Generate report filename with timestamp
   */
  public generateReportFilename(
    reportType: string,
    projectName: string,
    fileFormat: 'pdf' | 'excel' | 'json'
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