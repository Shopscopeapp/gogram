import { supabase } from '../lib/supabase';
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

interface QAChecklistCompletion {
  id: string;
  qa_alert_id: string;
  checklist_item_id: string;
  completed_by: string;
  completed_at: Date;
  notes?: string;
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
      taskCategories: ['Steel'],
      triggerDays: 2,
      alertType: 'engineer_inspection',
      priority: 'high',
      title: 'Engineer Inspection Required',
      description: 'Steel work requires engineer inspection before proceeding',
      requirements: [
        'Schedule engineer visit',
        'Prepare inspection documentation',
        'Ensure work area is accessible'
      ],
      checklist: [
        { text: 'Engineer inspection scheduled', required: true },
        { text: 'Steel placement according to drawings', required: true },
        { text: 'Welding quality checks completed', required: true },
        { text: 'Connection details verified', required: true }
      ]
    },
    {
      taskCategories: ['Foundation'],
      triggerDays: 1,
      alertType: 'quality_checkpoint',
      priority: 'high',
      title: 'Foundation Quality Checkpoint',
      description: 'Foundation work requires quality checkpoint before backfill',
      requirements: [
        'Dimensional verification',
        'Surface finish inspection',
        'Documentation photography'
      ],
      checklist: [
        { text: 'Foundation dimensions verified', required: true },
        { text: 'Surface finish meets specifications', required: true },
        { text: 'Waterproofing inspection completed', required: true },
        { text: 'Documentation photos taken', required: true }
      ]
    }
  ];

  // Auto-trigger rules for status-based alerts
  private readonly autoTriggerRules: Array<{
    category: string;
    statusTrigger: Task['status'][];
    progressTrigger?: number;
    alertType: QAAlert['type'];
    priority: QAAlert['priority'];
    title: string;
    description: string;
    checklist: Array<{ text: string; required: boolean }>;
  }> = [
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
   * Get all QA alerts for a project from database
   */
  async getProjectQAAlerts(projectId: string): Promise<{ success: boolean; alerts?: QAAlert[]; error?: string }> {
    try {
      const { data: alerts, error } = await supabase
        .from('qa_alerts')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Get QA alerts error:', error);
        return { success: false, error: 'Failed to fetch QA alerts' };
      }

      // Get checklist completions for each alert
      const alertsWithCompletions = await Promise.all(
        (alerts || []).map(async (alert) => {
          const { data: completions } = await supabase
            .from('qa_checklist_completions')  
            .select('*')
            .eq('qa_alert_id', alert.id);

          // Update checklist items with completion status
          const updatedChecklist = (alert.checklist || []).map((item: QAChecklistItem) => {
            const completion = completions?.find(c => c.checklist_item_id === item.id);
            return {
              ...item,
              completed: !!completion,
              completed_at: completion?.completed_at,
              completed_by: completion?.completed_by,
              notes: completion?.notes
            };
          });

          return {
            ...alert,
            checklist: updatedChecklist,
            due_date: alert.due_date ? new Date(alert.due_date) : null,
            created_at: new Date(alert.created_at),
            updated_at: new Date(alert.updated_at)
          };
        })
      );

      return { success: true, alerts: alertsWithCompletions };
    } catch (error) {
      console.error('Get QA alerts error:', error);
      return { success: false, error: 'Failed to fetch QA alerts' };
    }
  }

  /**
   * Create a new QA alert in the database  
   */
  async createQAAlert(alert: Omit<QAAlert, 'created_at' | 'updated_at'>): Promise<{ success: boolean; alert?: QAAlert; error?: string }> {
    try {
      const { data: createdAlert, error } = await supabase
        .from('qa_alerts')
        .insert({
          id: alert.id,
          project_id: alert.project_id,
          task_id: alert.task_id,
          type: alert.type,
          status: alert.status,
          title: alert.title,
          description: alert.description,
          due_date: alert.due_date?.toISOString(),
          assigned_to: alert.assigned_to,
          priority: alert.priority,
          checklist: alert.checklist || []
        })
        .select()
        .single();

      if (error) {
        console.error('Create QA alert error:', error);
        return { success: false, error: 'Failed to create QA alert' };
      }

      return { 
        success: true, 
        alert: {
          ...createdAlert,
          due_date: createdAlert.due_date ? new Date(createdAlert.due_date) : null,
          created_at: new Date(createdAlert.created_at),
          updated_at: new Date(createdAlert.updated_at)
        }
      };
    } catch (error) {
      console.error('Create QA alert error:', error);
      return { success: false, error: 'Failed to create QA alert' };
    }
  }

  /**
   * Update QA alert status in database
   */
  async updateQAAlertStatus(
    alertId: string, 
    status: QAAlert['status'], 
    completedBy?: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const updates: any = { status };
      if (completedBy) {
        updates.completed_by = completedBy;
        updates.completed_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('qa_alerts')
        .update(updates)
        .eq('id', alertId);

      if (error) {
        console.error('Update QA alert status error:', error);
        return { success: false, error: 'Failed to update QA alert status' };
      }

      return { success: true };
    } catch (error) {
      console.error('Update QA alert status error:', error);
      return { success: false, error: 'Failed to update QA alert status' };
    }
  }

  /**
   * Complete a checklist item and save to database
   */
  async completeChecklistItem(
    alertId: string,
    itemId: string, 
    completedBy: string,
    notes?: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Insert or update checklist completion
      const { error } = await supabase
        .from('qa_checklist_completions')
        .upsert({
          qa_alert_id: alertId,
          checklist_item_id: itemId,
          completed_by: completedBy,
          completed_at: new Date().toISOString(),
          notes: notes || null
        });

      if (error) {
        console.error('Complete checklist item error:', error);
        return { success: false, error: 'Failed to complete checklist item' };
      }

      // Check if all required items are completed
      const { data: alert } = await supabase
        .from('qa_alerts')
        .select('checklist')
        .eq('id', alertId)
        .single();

      if (alert?.checklist) {
        const { data: completions } = await supabase
          .from('qa_checklist_completions')
          .select('checklist_item_id')
          .eq('qa_alert_id', alertId);

        const completedItemIds = new Set(completions?.map(c => c.checklist_item_id) || []);
        const requiredItems = alert.checklist.filter((item: QAChecklistItem) => item.required);
        const allRequiredCompleted = requiredItems.every((item: QAChecklistItem) => 
          completedItemIds.has(item.id)
        );

        // Auto-update alert status if all required items are completed
        if (allRequiredCompleted) {
          await this.updateQAAlertStatus(alertId, 'completed', completedBy);
        }
      }

      return { success: true };
    } catch (error) {
      console.error('Complete checklist item error:', error);
      return { success: false, error: 'Failed to complete checklist item' };
    }
  }

  /**
   * AUTO-TRIGGER: Generate QA alerts when tasks change status or reach milestones
   */
  async autoTriggerQAChecks(
    task: Task,
    previousStatus?: Task['status'],
    projectId: string = ''
  ): Promise<QAAlert[]> {
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

        // Save to database
        const result = await this.createQAAlert(alert);
        if (result.success && result.alert) {
          alerts.push(result.alert);
        }
      }
    }

    return alerts;
  }

  /**
   * SCHEDULED: Generate QA alerts for upcoming tasks and save to database
   */
  async generateAndSaveQAAlerts(
    tasks: Task[],
    projectId: string = ''
  ): Promise<{ success: boolean; alerts?: QAAlert[]; error?: string }> {
    try {
      // Get existing alerts to avoid duplicates
      const existingResult = await this.getProjectQAAlerts(projectId);
      if (!existingResult.success) {
        return { success: false, error: existingResult.error };
      }

      const existingAlerts = existingResult.alerts || [];
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

                // Save to database
                const result = await this.createQAAlert(alert);
                if (result.success && result.alert) {
                  newAlerts.push(result.alert);
                }
              }
            }
          }
        }
      }

      return { success: true, alerts: newAlerts };
    } catch (error) {
      console.error('Generate QA alerts error:', error);
      return { success: false, error: 'Failed to generate QA alerts' };
    }
  }

  /**
   * Delete a QA alert
   */
  async deleteQAAlert(alertId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('qa_alerts')
        .delete()
        .eq('id', alertId);

      if (error) {
        console.error('Delete QA alert error:', error);
        return { success: false, error: 'Failed to delete QA alert' };
      }

      return { success: true };
    } catch (error) {
      console.error('Delete QA alert error:', error);
      return { success: false, error: 'Failed to delete QA alert' };
    }
  }

  // Legacy methods for backward compatibility (now use database)
  public generateQAAlerts(projectId: string): Promise<QAAlert[]> {
    // This method is kept for backward compatibility
    // but now redirects to the database-backed version
    return this.getProjectQAAlerts(projectId).then(result => 
      result.success ? result.alerts || [] : []
    );
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

const qaService = new QAService();
export default qaService;
export type { QAAlert, QAChecklistItem }; 