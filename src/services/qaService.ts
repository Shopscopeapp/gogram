import type { Task, QAInspection, Notification, User } from '../types';
import { format, addDays, differenceInDays } from 'date-fns';

interface QAAlert {
  id: string;
  taskId: string;
  type: 'ITP' | 'pre_pour_checklist' | 'engineer_inspection' | 'quality_hold';
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  scheduledDate: Date;
  assignedTo: string[];
  requirements: string[];
  checklist?: QAChecklistItem[];
  status: 'pending' | 'in_progress' | 'completed' | 'overdue';
  createdAt: Date;
}

interface QAChecklistItem {
  id: string;
  description: string;
  required: boolean;
  completed: boolean;
  completedAt?: Date;
  completedBy?: string;
  notes?: string;
}

interface QATriggerRule {
  taskCategories: string[];
  triggerDays: number; // Days before task start to trigger alert
  alertType: QAAlert['type'];
  priority: QAAlert['priority'];
  title: string;
  description: string;
  requirements: string[];
  checklist?: Omit<QAChecklistItem, 'id' | 'completed' | 'completedAt' | 'completedBy' | 'notes'>[];
}

class QAService {
  // Define QA trigger rules for different construction activities
  private readonly qaTriggerRules: QATriggerRule[] = [
    {
      taskCategories: ['Concrete'],
      triggerDays: 3,
      alertType: 'ITP',
      priority: 'high',
      title: 'ITP Required - Concrete Pour',
      description: 'Inspection and Test Plan must be submitted and approved before concrete pour',
      requirements: [
        'Submit ITP form to engineer',
        'Obtain engineer approval',
        'Schedule concrete quality tests',
        'Verify formwork inspections completed'
      ],
      checklist: [
        { description: 'ITP form completed and submitted', required: true },
        { description: 'Engineer approval received', required: true },
        { description: 'Concrete mix design approved', required: true },
        { description: 'Formwork inspection passed', required: true },
        { description: 'Reinforcement inspection passed', required: true }
      ]
    },
    {
      taskCategories: ['Concrete'],
      triggerDays: 1,
      alertType: 'pre_pour_checklist',
      priority: 'critical',
      title: 'Pre-Pour Checklist - Final Verification',
      description: 'Critical pre-pour checklist must be completed before concrete delivery',
      requirements: [
        'Final formwork check',
        'Weather conditions verification',
        'Equipment readiness check',
        'Site access confirmation'
      ],
      checklist: [
        { description: 'Weather forecast acceptable (no rain expected)', required: true },
        { description: 'Concrete pump/equipment on site and tested', required: true },
        { description: 'Site access clear for concrete trucks', required: true },
        { description: 'Formwork final inspection completed', required: true },
        { description: 'All embedments and services in place', required: true },
        { description: 'Test equipment calibrated and ready', required: false }
      ]
    },
    {
      taskCategories: ['Steel', 'Site Work'],
      triggerDays: 2,
      alertType: 'engineer_inspection',
      priority: 'high',
      title: 'Engineer Inspection Required',
      description: 'Structural engineer inspection required before proceeding',
      requirements: [
        'Schedule engineer site visit',
        'Prepare inspection documentation',
        'Ensure work area is accessible',
        'Have drawings and specifications available'
      ],
      checklist: [
        { description: 'Engineer inspection scheduled', required: true },
        { description: 'Work area cleaned and accessible', required: true },
        { description: 'Drawings and specifications on site', required: true },
        { description: 'Previous inspection points addressed', required: true }
      ]
    },
    {
      taskCategories: ['Masonry'],
      triggerDays: 1,
      alertType: 'quality_hold',
      priority: 'medium',
      title: 'Quality Hold Point - Masonry Check',
      description: 'Quality check required before masonry work proceeds',
      requirements: [
        'Check material certifications',
        'Verify mortar mix proportions',
        'Inspect substrate preparation',
        'Weather conditions check'
      ],
      checklist: [
        { description: 'Material certificates verified', required: true },
        { description: 'Mortar mix approved', required: true },
        { description: 'Substrate properly prepared', required: true },
        { description: 'Weather suitable for masonry work', required: true }
      ]
    }
  ];

  /**
   * Generate QA alerts for upcoming tasks
   */
  public generateQAAlerts(
    tasks: Task[],
    existingAlerts: QAAlert[] = []
  ): QAAlert[] {
    const newAlerts: QAAlert[] = [];
    const today = new Date();

    for (const task of tasks) {
      // Skip completed tasks
      if (task.status === 'completed') {
        continue;
      }

      // Check each QA rule
      for (const rule of this.qaTriggerRules) {
        if (rule.taskCategories.includes(task.category)) {
          const daysUntilTask = differenceInDays(task.start_date, today);
          
          // Check if we should trigger this alert
          if (daysUntilTask <= rule.triggerDays && daysUntilTask >= 0) {
            const alertId = `qa-${rule.alertType}-${task.id}-${rule.triggerDays}`;
            
            // Check if alert already exists
            if (!existingAlerts.find(alert => alert.id === alertId)) {
              const alert: QAAlert = {
                id: alertId,
                taskId: task.id,
                type: rule.alertType,
                title: rule.title,
                description: rule.description,
                priority: rule.priority,
                scheduledDate: new Date(task.start_date.getTime() - (rule.triggerDays * 24 * 60 * 60 * 1000)),
                assignedTo: [], // Will be populated based on user roles
                requirements: rule.requirements,
                checklist: rule.checklist?.map((item, index) => ({
                  id: `${alertId}-item-${index}`,
                  description: item.description,
                  required: item.required,
                  completed: false
                })),
                status: daysUntilTask === 0 ? 'in_progress' : 'pending',
                createdAt: new Date()
              };

              newAlerts.push(alert);
            }
          }
        }
      }
    }

    return newAlerts;
  }

  /**
   * Get QA alerts for a specific task
   */
  public getTaskQAAlerts(taskId: string, alerts: QAAlert[]): QAAlert[] {
    return alerts.filter(alert => alert.taskId === taskId);
  }

  /**
   * Create notifications for project coordinators about QA alerts
   */
  public createQANotifications(
    alerts: QAAlert[],
    tasks: Task[],
    projectCoordinators: User[]
  ): Notification[] {
    const notifications: Notification[] = [];

    for (const alert of alerts) {
      const task = tasks.find(t => t.id === alert.taskId);
      if (!task) continue;

      for (const coordinator of projectCoordinators) {
        const notification: Notification = {
          id: `qa-notification-${alert.id}-${coordinator.id}`,
          user_id: coordinator.id,
          type: 'qa_alert',
          title: `🔍 QA Alert: ${alert.title}`,
          message: `${alert.description} for task "${task.title}" scheduled for ${format(task.start_date, 'MMM dd')}`,
          data: {
            alertId: alert.id,
            taskId: alert.taskId,
            alertType: alert.type,
            priority: alert.priority,
            scheduledDate: alert.scheduledDate
          },
          read: false,
          created_at: new Date()
        };

        notifications.push(notification);
      }
    }

    return notifications;
  }

  /**
   * Update QA alert status
   */
  public updateQAAlertStatus(
    alertId: string,
    status: QAAlert['status'],
    alerts: QAAlert[]
  ): QAAlert[] {
    return alerts.map(alert => 
      alert.id === alertId 
        ? { ...alert, status }
        : alert
    );
  }

  /**
   * Complete checklist item
   */
  public   completeChecklistItem(
    alertId: string,
    itemId: string,
    completedBy: string,
    alerts: QAAlert[],
    notes?: string
  ): QAAlert[] {
    return alerts.map(alert => {
      if (alert.id === alertId && alert.checklist) {
        const updatedChecklist = alert.checklist.map(item =>
          item.id === itemId
            ? {
                ...item,
                completed: true,
                completedAt: new Date(),
                completedBy,
                notes
              }
            : item
        );

        // Check if all required items are completed
        const allRequiredCompleted = updatedChecklist
          .filter(item => item.required)
          .every(item => item.completed);

        return {
          ...alert,
          checklist: updatedChecklist,
          status: allRequiredCompleted ? 'completed' : alert.status
        };
      }
      return alert;
    });
  }

  /**
   * Get overdue QA alerts
   */
  public getOverdueAlerts(alerts: QAAlert[]): QAAlert[] {
    const today = new Date();
    return alerts.filter(alert => 
      alert.status !== 'completed' && 
      alert.scheduledDate < today
    );
  }

  /**
   * Get critical QA alerts (high/critical priority, due soon)
   */
  public getCriticalAlerts(alerts: QAAlert[]): QAAlert[] {
    const tomorrow = addDays(new Date(), 1);
    return alerts.filter(alert => 
      (alert.priority === 'high' || alert.priority === 'critical') &&
      alert.status !== 'completed' &&
      alert.scheduledDate <= tomorrow
    );
  }

  /**
   * Generate QA alert summary for dashboard
   */
  public getQAAlertSummary(alerts: QAAlert[]): {
    total: number;
    pending: number;
    overdue: number;
    critical: number;
    completed: number;
  } {
    return {
      total: alerts.length,
      pending: alerts.filter(a => a.status === 'pending').length,
      overdue: this.getOverdueAlerts(alerts).length,
      critical: this.getCriticalAlerts(alerts).length,
      completed: alerts.filter(a => a.status === 'completed').length
    };
  }

  /**
   * Get QA alert priority color for UI
   */
  public getAlertPriorityColor(priority: QAAlert['priority']): string {
    switch (priority) {
      case 'critical': return 'danger';
      case 'high': return 'warning';
      case 'medium': return 'primary';
      default: return 'gray';
    }
  }

  /**
   * Get QA alert type icon for UI
   */
  public getAlertTypeIcon(type: QAAlert['type']): string {
    switch (type) {
      case 'ITP': return '📋';
      case 'pre_pour_checklist': return '✅';
      case 'engineer_inspection': return '👷';
      case 'quality_hold': return '⚠️';
      default: return '🔍';
    }
  }

  /**
   * Format QA alert for display
   */
  public formatAlertForDisplay(alert: QAAlert, task?: Task): {
    icon: string;
    title: string;
    subtitle: string;
    priority: string;
    colorClass: string;
    daysUntilDue: number;
  } {
    const daysUntilDue = differenceInDays(alert.scheduledDate, new Date());
    const priorityColor = this.getAlertPriorityColor(alert.priority);
    
    return {
      icon: this.getAlertTypeIcon(alert.type),
      title: alert.title,
      subtitle: task ? `${task.title} • ${format(alert.scheduledDate, 'MMM dd')}` : format(alert.scheduledDate, 'MMM dd'),
      priority: alert.priority.toUpperCase(),
      colorClass: `text-${priorityColor}-600 bg-${priorityColor}-100`,
      daysUntilDue
    };
  }
}

// Export singleton instance
export const qaService = new QAService();
export default qaService;
export type { QAAlert, QAChecklistItem }; 