import type { Task, Notification, User, QAAlert, QAChecklistItem } from '../types';
import { format, addDays, differenceInDays, isBefore, isAfter } from 'date-fns';

interface QATriggerRule {
  taskCategories: string[];
  triggerDays: number; // Days before task start to trigger alert
  alertType: QAAlert['type'];
  priority: QAAlert['priority'];
  title: string;
  description: string;
  requirements: string[];
  checklist?: Omit<QAChecklistItem, 'id' | 'completed' | 'completed_at' | 'completed_by' | 'notes'>[];
}

interface QAAutoTrigger {
  category: string;
  statusTrigger: Task['status'][];
  progressTrigger?: number; // Percentage
  alertType: QAAlert['type'];
  priority: QAAlert['priority'];
  title: string;
  description: string;
  checklist: Omit<QAChecklistItem, 'id' | 'completed' | 'completed_at' | 'completed_by' | 'notes'>[];
}

class QAService {
  // Define QA trigger rules for different construction activities
  private readonly qaTriggerRules: QATriggerRule[] = [
    {
      taskCategories: ['Concrete'],
      triggerDays: 3,
      alertType: 'itp_required',
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
        { text: 'ITP form completed and submitted', required: true },
        { text: 'Engineer approval received', required: true },
        { text: 'Concrete mix design approved', required: true },
        { text: 'Formwork inspection passed', required: true },
        { text: 'Reinforcement inspection passed', required: true }
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
        { text: 'Weather forecast acceptable (no rain expected)', required: true },
        { text: 'Concrete pump/equipment on site and tested', required: true },
        { text: 'Site access clear for concrete trucks', required: true },
        { text: 'Formwork final inspection completed', required: true },
        { text: 'All embedments and services in place', required: true },
        { text: 'Test equipment calibrated and ready', required: false }
      ]
    },
    {
      taskCategories: ['Steel', 'Structural', 'Site Work'],
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
        { text: 'Engineer inspection scheduled', required: true },
        { text: 'Work area cleaned and accessible', required: true },
        { text: 'Drawings and specifications on site', required: true },
        { text: 'Previous inspection points addressed', required: true }
      ]
    },
    {
      taskCategories: ['Masonry', 'Foundation'],
      triggerDays: 1,
      alertType: 'quality_checkpoint',
      priority: 'medium',
      title: 'Quality Checkpoint Required',
      description: 'Quality check required before work proceeds',
      requirements: [
        'Check material certifications',
        'Verify work specifications',
        'Inspect preparation work',
        'Weather conditions check'
      ],
      checklist: [
        { text: 'Material certificates verified', required: true },
        { text: 'Work specifications reviewed', required: true },
        { text: 'Preparation work properly completed', required: true },
        { text: 'Weather suitable for work', required: true }
      ]
    },
    {
      taskCategories: ['Electrical', 'Plumbing', 'HVAC'],
      triggerDays: 1,
      alertType: 'compliance_check',
      priority: 'high',
      title: 'Compliance Check Required',
      description: 'Building code compliance verification required',
      requirements: [
        'Review building code requirements',
        'Check permit conditions',
        'Verify installation standards',
        'Schedule inspection if required'
      ],
      checklist: [
        { text: 'Building code requirements reviewed', required: true },
        { text: 'Permit conditions verified', required: true },
        { text: 'Installation meets standards', required: true },
        { text: 'Required inspections scheduled', required: true }
      ]
    }
  ];

  // Auto-trigger rules for status changes and progress milestones
  private readonly autoTriggerRules: QAAutoTrigger[] = [
    {
      category: 'Concrete',
      statusTrigger: ['in_progress'],
      alertType: 'itp_required',
      priority: 'critical',
      title: 'URGENT: ITP Required for Concrete Work',
      description: 'Concrete work has started - ITP must be completed immediately',
      checklist: [
        { text: 'STOP WORK: Submit ITP form immediately', required: true },
        { text: 'Obtain engineer approval before continuing', required: true },
        { text: 'Schedule required inspections', required: true }
      ]
    },
    {
      category: 'Steel',
      statusTrigger: ['in_progress'],
      progressTrigger: 50,
      alertType: 'engineer_inspection',
      priority: 'high',
      title: 'Mid-Progress Engineer Inspection',
      description: 'Steel work is 50% complete - engineer inspection required',
      checklist: [
        { text: 'Schedule engineer inspection', required: true },
        { text: 'Prepare progress documentation', required: true },
        { text: 'Ensure work area accessibility', required: true }
      ]
    },
    {
      category: 'Foundation',
      statusTrigger: ['completed'],
      alertType: 'quality_checkpoint',
      priority: 'high',
      title: 'Foundation Completion QA Check',
      description: 'Foundation work complete - final quality check required',
      checklist: [
        { text: 'Visual inspection completed', required: true },
        { text: 'Measurements verified', required: true },
        { text: 'Documentation photographed', required: true },
        { text: 'Sign-off obtained', required: true }
      ]
    }
  ];

  /**
   * AUTO-TRIGGER: Generate QA alerts when tasks change status or reach milestones
   */
  public autoTriggerQAChecks(
    task: Task,
    previousStatus?: Task['status'],
    projectId: string = ''
  ): QAAlert[] {
    const alerts: QAAlert[] = [];
    const now = new Date();

    // Check auto-trigger rules
    for (const rule of this.autoTriggerRules) {
      const shouldTrigger = 
        rule.category === task.category &&
        rule.statusTrigger.includes(task.status) &&
        (previousStatus ? previousStatus !== task.status : true) &&
        (!rule.progressTrigger || (task.progress_percentage || 0) >= rule.progressTrigger);

      if (shouldTrigger) {
        const alertId = `qa_${task.id}_${rule.alertType}_${Date.now()}`;
        
        const checklist: QAChecklistItem[] = rule.checklist.map((item, index) => ({
          id: `${alertId}_item_${index}`,
          text: item.text,
          required: item.required,
          completed: false
        }));

        const alert: QAAlert = {
          id: alertId,
          project_id: projectId,
          task_id: task.id,
          type: rule.alertType,
          status: 'pending',
          title: rule.title,
          description: rule.description,
          due_date: addDays(now, rule.alertType === 'itp_required' ? 0 : 1), // ITP is immediate
          assigned_to: task.assigned_to,
          checklist,
          priority: rule.priority,
          created_at: now,
          updated_at: now
        };

        alerts.push(alert);
      }
    }

    return alerts;
  }

  /**
   * SCHEDULED: Generate QA alerts for upcoming tasks (existing functionality enhanced)
   */
  public generateQAAlerts(
    tasks: Task[],
    existingAlerts: QAAlert[] = [],
    projectId: string = ''
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
            // Check if alert already exists
            const existingAlert = existingAlerts.find(
              alert => alert.task_id === task.id && alert.type === rule.alertType
            );

            if (!existingAlert) {
              const alertId = `qa_${task.id}_${rule.alertType}_${Date.now()}`;
              
              const checklist: QAChecklistItem[] = rule.checklist?.map((item, index) => ({
                id: `${alertId}_item_${index}`,
                text: item.text,
                required: item.required,
                completed: false
              })) || [];

              const alert: QAAlert = {
                id: alertId,
                project_id: projectId,
                task_id: task.id,
                type: rule.alertType,
                status: 'pending',
                title: rule.title,
                description: rule.description,
                due_date: addDays(task.start_date, -1), // Due 1 day before task starts
                assigned_to: task.assigned_to,
                checklist,
                priority: rule.priority,
                created_at: today,
                updated_at: today
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
   * Complete a QA alert checklist item
   */
  public completeChecklistItem(
    alertId: string,
    itemId: string,
    completedBy: string,
    notes?: string
  ): Partial<QAAlert> {
    return {
      checklist: [], // This would be updated with the specific item marked complete
      updated_at: new Date()
    };
  }

  /**
   * Update QA alert status
   */
  public updateAlertStatus(
    alertId: string,
    status: QAAlert['status'],
    completedBy?: string
  ): Partial<QAAlert> {
    const updates: Partial<QAAlert> = {
      status,
      updated_at: new Date()
    };

    if (status === 'completed' && completedBy) {
      updates.completed_by = completedBy;
      updates.completed_at = new Date();
    }

    return updates;
  }

  /**
   * Generate notifications for QA alerts
   */
  public generateQANotifications(
    alerts: QAAlert[],
    users: User[]
  ): Notification[] {
    const notifications: Notification[] = [];
    const now = new Date();

    for (const alert of alerts) {
      if (alert.status === 'pending' && alert.assigned_to) {
        const assignedUser = users.find(u => u.id === alert.assigned_to);
        
        if (assignedUser) {
          const urgencyText = alert.priority === 'critical' ? '🚨 URGENT: ' : 
                            alert.priority === 'high' ? '⚠️ HIGH PRIORITY: ' : '';

          const notification: Notification = {
            id: `qa_notification_${alert.id}`,
            user_id: assignedUser.id,
            type: 'qa_alert',
            title: `${urgencyText}${alert.title}`,
            message: alert.description || `QA check required for task`,
            read: false,
            created_at: now,
            data: {
              alertId: alert.id,
              taskId: alert.task_id,
              alertType: alert.type,
              priority: alert.priority
            }
          };

          notifications.push(notification);
        }
      }
    }

    return notifications;
  }

  /**
   * Check if a task category requires QA
   */
  public requiresQA(taskCategory: string): boolean {
    return this.qaTriggerRules.some(rule => 
      rule.taskCategories.includes(taskCategory)
    ) || this.autoTriggerRules.some(rule => 
      rule.category === taskCategory
    );
  }

  /**
   * Get QA requirements for a task category
   */
  public getQARequirements(taskCategory: string): string[] {
    const requirements: string[] = [];
    
    this.qaTriggerRules.forEach(rule => {
      if (rule.taskCategories.includes(taskCategory)) {
        requirements.push(...rule.requirements);
      }
    });

    return [...new Set(requirements)]; // Remove duplicates
  }
}

// Export singleton instance
const qaService = new QAService();
export default qaService;
export type { QAAlert, QAChecklistItem }; 