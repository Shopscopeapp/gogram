import { supabase } from '../lib/supabase';
import type { Task, Delivery, User, Project, TaskChangeProposal } from '../types';

// Email templates
const EMAIL_TEMPLATES = {
  TASK_ASSIGNMENT: {
    subject: '📋 New Task Assignment - {{projectName}}',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #f8fafc; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
          <h1 style="color: #1e293b; margin: 0;">🏗️ Gogram</h1>
          <p style="color: #64748b; margin: 5px 0 0 0;">Construction Project Management</p>
        </div>
        
        <div style="background: white; padding: 30px; border: 1px solid #e2e8f0;">
          <h2 style="color: #1e293b; margin-top: 0;">New Task Assignment</h2>
          
          <p>Hi {{assigneeName}},</p>
          
          <p>You've been assigned a new task in the <strong>{{projectName}}</strong> project:</p>
          
          <div style="background: #f1f5f9; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #1e293b; margin-top: 0;">{{taskTitle}}</h3>
            <p style="color: #475569; margin-bottom: 0;">{{taskDescription}}</p>
            
            <div style="margin-top: 15px; font-size: 14px;">
              <p><strong>Category:</strong> {{taskCategory}}</p>
              <p><strong>Priority:</strong> <span style="color: {{priorityColor}};">{{taskPriority}}</span></p>
              <p><strong>Start Date:</strong> {{startDate}}</p>
              <p><strong>Due Date:</strong> {{endDate}}</p>
              {{#if location}}<p><strong>Location:</strong> {{location}}</p>{{/if}}
            </div>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="{{appUrl}}/schedule" 
               style="background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              View Task Details
            </a>
          </div>
          
          <p style="color: #64748b; font-size: 14px; border-top: 1px solid #e2e8f0; padding-top: 20px; margin-top: 30px;">
            Best regards,<br>
            {{senderName}}<br>
            Project Manager - {{projectName}}
          </p>
        </div>
      </div>
    `
  },

  DELIVERY_CONFIRMATION: {
    subject: '🚚 Delivery Confirmation Required - {{deliveryId}}',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #f8fafc; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
          <h1 style="color: #1e293b; margin: 0;">🏗️ Gogram</h1>
          <p style="color: #64748b; margin: 5px 0 0 0;">Construction Project Management</p>
        </div>
        
        <div style="background: white; padding: 30px; border: 1px solid #e2e8f0;">
          <h2 style="color: #1e293b; margin-top: 0;">Delivery Confirmation Required</h2>
          
          <p>Hi {{supplierName}},</p>
          
          <p>Please confirm the delivery details for the <strong>{{projectName}}</strong> project:</p>
          
          <div style="background: #fef3c7; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b;">
            <h3 style="color: #92400e; margin-top: 0;">Delivery ID: {{deliveryId}}</h3>
            
            <div style="font-size: 14px;">
              <p><strong>Task:</strong> {{taskTitle}}</p>
              <p><strong>Materials:</strong> {{materials}}</p>
              <p><strong>Requested Date:</strong> {{requestedDate}}</p>
              <p><strong>New Proposed Date:</strong> <span style="color: #dc2626; font-weight: bold;">{{newDate}}</span></p>
              {{#if notes}}<p><strong>Notes:</strong> {{notes}}</p>{{/if}}
            </div>
          </div>
          
          <p style="color: #dc2626; font-weight: bold;">⚠️ Action Required: Please confirm or adjust this delivery date within 24 hours.</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="{{confirmUrl}}" 
               style="background: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin-right: 10px;">
              Confirm Delivery
            </a>
            <a href="{{rescheduleUrl}}" 
               style="background: #f59e0b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Reschedule
            </a>
          </div>
          
          <p style="color: #64748b; font-size: 14px; border-top: 1px solid #e2e8f0; padding-top: 20px; margin-top: 30px;">
            Best regards,<br>
            {{senderName}}<br>
            Project Manager - {{projectName}}
          </p>
        </div>
      </div>
    `
  },

  DELIVERY_DATE_CHANGE: {
    subject: '📅 Delivery Date Change Required - {{taskTitle}}',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #f8fafc; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
          <h1 style="color: #1e293b; margin: 0;">🏗️ Gogram</h1>
          <p style="color: #64748b; margin: 5px 0 0 0;">Construction Project Management</p>
        </div>
        
        <div style="background: white; padding: 30px; border: 1px solid #e2e8f0;">
          <h2 style="color: #1e293b; margin-top: 0;">⚠️ Delivery Date Change Required</h2>
          
          <p>Hi {{supplierName}},</p>
          
          <p>Due to schedule changes in the <strong>{{projectName}}</strong> project, we need to adjust the delivery date for the following items:</p>
          
          <div style="background: #fef3c7; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b;">
            <h3 style="color: #92400e; margin-top: 0;">Task: {{taskTitle}}</h3>
            
            <div style="background: white; padding: 15px; border-radius: 6px; margin: 15px 0;">
              <h4 style="color: #1e293b; margin-top: 0;">Delivery Details:</h4>
              <p><strong>Item:</strong> {{deliveryItem}}</p>
              <p><strong>Quantity:</strong> {{deliveryQuantity}} {{deliveryUnit}}</p>
              <p><strong>Current Delivery Date:</strong> <span style="color: #6b7280;">{{currentDate}}</span></p>
              <p><strong>New Required Date:</strong> <span style="color: #dc2626; font-weight: bold;">{{newDate}}</span></p>
              {{#if deliveryAddress}}<p><strong>Delivery Address:</strong> {{deliveryAddress}}</p>{{/if}}
            </div>
            
            <div style="font-size: 14px; color: #92400e;">
              <p><strong>Reason for Change:</strong> Task schedule has been moved from {{originalTaskDate}} to {{newTaskDate}}</p>
            </div>
          </div>
          
          <div style="background: #f0f9ff; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #3b82f6;">
            <h4 style="color: #1e40af; margin-top: 0;">🤝 Your Response Required</h4>
            <p style="color: #1e40af; margin-bottom: 0;">Please confirm if you can accommodate this new delivery date or if you need to propose an alternative.</p>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="{{confirmUrl}}" 
               style="background: #10b981; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; display: inline-block; margin: 0 10px 10px 0; font-weight: bold; box-shadow: 0 2px 4px rgba(16, 185, 129, 0.2);">
              ✅ CONFIRM NEW DATE
            </a>
            <a href="{{denyUrl}}" 
               style="background: #ef4444; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; display: inline-block; margin: 0 0 10px 10px; font-weight: bold; box-shadow: 0 2px 4px rgba(239, 68, 68, 0.2);">
              ❌ CANNOT DELIVER
            </a>
          </div>
          
          <div style="background: #fef2f2; padding: 15px; border-radius: 6px; margin: 20px 0;">
            <p style="color: #dc2626; font-size: 14px; margin: 0; text-align: center;">
              <strong>⏰ Please respond within 24 hours to avoid project delays</strong>
            </p>
          </div>
          
          <p style="color: #64748b; font-size: 14px; border-top: 1px solid #e2e8f0; padding-top: 20px; margin-top: 30px;">
            If you have any questions about this change, please contact us immediately.<br><br>
            Best regards,<br>
            {{senderName}}<br>
            Project Manager - {{projectName}}<br>
            📧 {{senderEmail}} | 📱 {{senderPhone}}
          </p>
        </div>
      </div>
    `
  },

  APPROVAL_REQUEST: {
    subject: '✋ Task Change Approval Required - {{taskTitle}}',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #f8fafc; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
          <h1 style="color: #1e293b; margin: 0;">🏗️ Gogram</h1>
          <p style="color: #64748b; margin: 5px 0 0 0;">Construction Project Management</p>
        </div>
        
        <div style="background: white; padding: 30px; border: 1px solid #e2e8f0;">
          <h2 style="color: #1e293b; margin-top: 0;">Task Change Approval Required</h2>
          
          <p>Hi {{managerName}},</p>
          
          <p>A task change has been proposed and requires your approval:</p>
          
          <div style="background: #fef2f2; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ef4444;">
            <h3 style="color: #dc2626; margin-top: 0;">{{taskTitle}}</h3>
            
            <div style="font-size: 14px;">
              <p><strong>Proposed by:</strong> {{proposedBy}}</p>
              <p><strong>Change Type:</strong> {{changeType}}</p>
              <p><strong>Reason:</strong> {{reason}}</p>
              
              {{#if dateChanges}}
              <div style="margin-top: 15px;">
                <p><strong>Date Changes:</strong></p>
                <ul style="margin: 5px 0; padding-left: 20px;">
                  {{#if originalStartDate}}<li>Start Date: {{originalStartDate}} → <span style="color: #dc2626;">{{newStartDate}}</span></li>{{/if}}
                  {{#if originalEndDate}}<li>End Date: {{originalEndDate}} → <span style="color: #dc2626;">{{newEndDate}}</span></li>{{/if}}
                </ul>
              </div>
              {{/if}}
              
              {{#if notes}}<p><strong>Additional Notes:</strong> {{notes}}</p>{{/if}}
            </div>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="{{approveUrl}}" 
               style="background: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin-right: 10px;">
              Approve Change
            </a>
            <a href="{{rejectUrl}}" 
               style="background: #ef4444; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Reject Change
            </a>
          </div>
          
          <p style="color: #64748b; font-size: 14px; border-top: 1px solid #e2e8f0; padding-top: 20px; margin-top: 30px;">
            Please review and respond within 48 hours to avoid project delays.<br><br>
            Best regards,<br>
            Gogram Project Management System
          </p>
        </div>
      </div>
    `
  },

  QA_ALERT: {
    subject: '🔍 Quality Alert - {{alertType}} Required',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #f8fafc; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
          <h1 style="color: #1e293b; margin: 0;">🏗️ Gogram</h1>
          <p style="color: #64748b; margin: 5px 0 0 0;">Construction Project Management</p>
        </div>
        
        <div style="background: white; padding: 30px; border: 1px solid #e2e8f0;">
          <h2 style="color: #dc2626; margin-top: 0;">🔍 Quality Assurance Alert</h2>
          
          <p>Hi {{assigneeName}},</p>
          
          <p>A quality assurance checkpoint has been triggered for the <strong>{{projectName}}</strong> project:</p>
          
          <div style="background: #fef3c7; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b;">
            <h3 style="color: #92400e; margin-top: 0;">{{alertTitle}}</h3>
            <p style="color: #78350f;">{{alertDescription}}</p>
            
            <div style="font-size: 14px; margin-top: 15px;">
              <p><strong>Task:</strong> {{taskTitle}}</p>
              <p><strong>Priority:</strong> <span style="color: {{priorityColor}};">{{priority}}</span></p>
              <p><strong>Due Date:</strong> {{dueDate}}</p>
            </div>
          </div>
          
          {{#if checklist}}
          <div style="margin: 20px 0;">
            <h4 style="color: #1e293b;">Required Actions:</h4>
            <ul style="color: #475569;">
              {{#each checklist}}
              <li style="margin: 5px 0;">{{this}}</li>
              {{/each}}
            </ul>
          </div>
          {{/if}}
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="{{qaUrl}}" 
               style="background: #f59e0b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Complete QA Checklist
            </a>
          </div>
          
          <p style="color: #64748b; font-size: 14px; border-top: 1px solid #e2e8f0; padding-top: 20px; margin-top: 30px;">
            Please complete this QA checklist promptly to maintain project quality standards.<br><br>
            Best regards,<br>
            {{senderName}}<br>
            Project Manager - {{projectName}}
          </p>
        </div>
      </div>
    `
  }
};

interface EmailData {
  to: string;
  subject: string;
  html: string;
  from?: string;
  replyTo?: string;
}

interface EmailTemplate {
  subject: string;
  html: string;
}

class EmailService {
  // Email configuration
  private readonly FROM_EMAIL = import.meta.env.NEXT_PUBLIC_FROM_EMAIL || 'notifications@gogram.co';
  private readonly API_KEY = import.meta.env.NEXT_PUBLIC_EMAIL_API_KEY || 're_HzkrygJY_FZzv3EEYMFq1gVZff2YQQnhS';
  private readonly EMAIL_PROVIDER = import.meta.env.NEXT_PUBLIC_EMAIL_PROVIDER || 'resend';
  private readonly APP_URL = import.meta.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  /**
   * Send email using configured provider
   */
  private async sendEmail(emailData: EmailData): Promise<{ success: boolean; error?: string }> {
    try {
      // Debug: Log current configuration
      console.log('🔧 Email Configuration:', {
        provider: this.EMAIL_PROVIDER,
        fromEmail: this.FROM_EMAIL,
        hasApiKey: !!this.API_KEY,
        apiKeyLength: this.API_KEY ? this.API_KEY.length : 0
      });

      // In development/demo mode, simulate email sending
      if (this.EMAIL_PROVIDER === 'simulation') {
        console.log('📧 Email Simulation:', {
          to: emailData.to,
          subject: emailData.subject,
          provider: 'simulation'
        });
        
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
        
        // Simulate 95% success rate
        if (Math.random() > 0.05) {
          console.log('✅ Email sent successfully (simulated)');
          return { success: true };
        } else {
          console.log('❌ Email failed (simulated)');
          return { success: false, error: 'Simulated email delivery failure' };
        }
      }

      // Check if we have the required configuration for real email sending
      if (!this.API_KEY) {
        console.error('❌ Email API Key not found. Please check your .env.local file.');
        return { success: false, error: 'Email API key not configured' };
      }

      // Validate email address
      if (!emailData.to || !emailData.to.includes('@')) {
        console.error('❌ Invalid email address:', emailData.to);
        return { success: false, error: 'Invalid email address' };
      }

      // Real email providers
      switch (this.EMAIL_PROVIDER) {
        case 'sendgrid':
          return await this.sendViaSendGrid(emailData);
        case 'mailgun':
          return await this.sendViaMailgun(emailData);
        case 'resend':
          return await this.sendViaResend(emailData);
        default:
          throw new Error(`Unsupported email provider: ${this.EMAIL_PROVIDER}`);
      }
    } catch (error) {
      console.error('Email sending error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Send email via SendGrid
   */
  private async sendViaSendGrid(emailData: EmailData): Promise<{ success: boolean; error?: string }> {
    const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        personalizations: [{
          to: [{ email: emailData.to }],
          subject: emailData.subject
        }],
        from: { email: emailData.from || this.FROM_EMAIL },
        content: [{
          type: 'text/html',
          value: emailData.html
        }]
      })
    });

    if (response.ok) {
      return { success: true };
    } else {
      const error = await response.text();
      return { success: false, error: `SendGrid error: ${error}` };
    }
  }

  /**
   * Send email via Resend
   */
  private async sendViaResend(emailData: EmailData): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('📧 Sending email via Resend API:', {
        to: emailData.to,
        subject: emailData.subject,
        from: emailData.from || this.FROM_EMAIL,
        provider: 'resend'
      });

             // Call our backend API endpoint
       const apiUrl = import.meta.env.DEV ? 'http://localhost:3000/api/send-email' : '/api/send-email';
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          to: emailData.to,
          subject: emailData.subject,
          html: emailData.html,
          from: emailData.from || this.FROM_EMAIL
        })
      });

      const result = await response.json();

      if (response.ok && result.success) {
        console.log('✅ Email sent successfully via Resend:', result);
        return { success: true };
      } else {
        console.error('❌ Email failed via Resend:', result.error);
        return { success: false, error: result.error || 'Email sending failed' };
      }
    } catch (error) {
      console.error('Resend email error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Send email via Mailgun
   */
  private async sendViaMailgun(emailData: EmailData): Promise<{ success: boolean; error?: string }> {
    const domain = import.meta.env.NEXT_PUBLIC_MAILGUN_DOMAIN;
    const formData = new FormData();
    formData.append('from', emailData.from || this.FROM_EMAIL);
    formData.append('to', emailData.to);
    formData.append('subject', emailData.subject);
    formData.append('html', emailData.html);

    const response = await fetch(`https://api.mailgun.net/v3/${domain}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${btoa(`api:${this.API_KEY}`)}`
      },
      body: formData
    });

    if (response.ok) {
      return { success: true };
    } else {
      const error = await response.text();
      return { success: false, error: `Mailgun error: ${error}` };
    }
  }

  /**
   * Compile email template with data
   */
  private compileTemplate(template: EmailTemplate, data: Record<string, any>): EmailTemplate {
    let subject = template.subject;
    let html = template.html;

    // Simple template replacement
    Object.entries(data).forEach(([key, value]) => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      subject = subject.replace(regex, String(value || ''));
      html = html.replace(regex, String(value || ''));
    });

    // Handle conditional blocks (simple implementation)
    html = html.replace(/{{#if\s+(\w+)}}(.*?){{\/if}}/gs, (match, condition, content) => {
      return data[condition] ? content : '';
    });

    // Handle each loops (simple implementation)
    html = html.replace(/{{#each\s+(\w+)}}(.*?){{\/each}}/gs, (match, arrayName, content) => {
      const array = data[arrayName];
      if (!Array.isArray(array)) return '';
      return array.map(item => content.replace(/{{this}}/g, String(item))).join('');
    });

    return { subject, html };
  }

  /**
   * Send task assignment notification
   */
  async sendTaskAssignment(
    task: Task,
    assignee: User,
    project: Project,
    sender: User
  ): Promise<{ success: boolean; error?: string }> {
    const priorityColors = {
      low: '#10b981',
      medium: '#f59e0b', 
      high: '#ef4444',
      critical: '#dc2626'
    };

    const templateData = {
      assigneeName: assignee.full_name,
      projectName: project.name,
      taskTitle: task.title,
      taskDescription: task.description || 'No description provided',
      taskCategory: task.category,
      taskPriority: task.priority.toUpperCase(),
      priorityColor: priorityColors[task.priority],
      startDate: new Date(task.start_date).toLocaleDateString(),
      endDate: new Date(task.end_date).toLocaleDateString(),
      location: task.location,
      senderName: sender.full_name,
      appUrl: this.APP_URL
    };

    const compiled = this.compileTemplate(EMAIL_TEMPLATES.TASK_ASSIGNMENT, templateData);

    return await this.sendEmail({
      to: assignee.email,
      subject: compiled.subject,
      html: compiled.html,
      replyTo: sender.email
    });
  }

  /**
   * Send delivery confirmation request
   */
  async sendDeliveryConfirmation(
    delivery: Delivery,
    supplier: User,
    task: Task,
    project: Project,
    sender: User,
    newDate: Date
  ): Promise<{ success: boolean; error?: string }> {
    const confirmUrl = `${this.APP_URL}/supplier-confirmation/${delivery.id}?action=confirm`;
    const rescheduleUrl = `${this.APP_URL}/supplier-confirmation/${delivery.id}?action=reschedule`;

    const templateData = {
      supplierName: supplier.full_name,
      projectName: project.name,
      deliveryId: delivery.id,
      taskTitle: task.title,
      materials: delivery.item || 'Materials list not specified',
      requestedDate: new Date(delivery.planned_date).toLocaleDateString(),
      newDate: newDate.toLocaleDateString(),
      notes: delivery.notes,
      confirmUrl,
      rescheduleUrl,
      senderName: sender.full_name
    };

    const compiled = this.compileTemplate(EMAIL_TEMPLATES.DELIVERY_CONFIRMATION, templateData);

    return await this.sendEmail({
      to: supplier.email,
      subject: compiled.subject,
      html: compiled.html,
      replyTo: sender.email
    });
  }

  /**
   * Send delivery date change notification with confirm/deny options
   */
  async sendDeliveryDateChange(
    delivery: Delivery,
    supplier: User,
    task: Task,
    project: Project,
    sender: User,
    newDate: Date,
    originalTaskDate: Date,
    newTaskDate: Date
  ): Promise<{ success: boolean; error?: string }> {
    // Generate unique response URLs with tokens
    const responseToken = btoa(JSON.stringify({
      deliveryId: delivery.id,
      supplierId: supplier.id,
      projectId: project.id,
      expires: Date.now() + (7 * 24 * 60 * 60 * 1000) // 7 days
    }));

    const confirmUrl = `${this.APP_URL}/supplier-response?token=${responseToken}&action=confirm`;
    const denyUrl = `${this.APP_URL}/supplier-response?token=${responseToken}&action=deny`;

    const templateData = {
      supplierName: supplier.full_name,
      projectName: project.name,
      taskTitle: task.title,
      deliveryItem: delivery.item,
      deliveryQuantity: delivery.quantity,
      deliveryUnit: delivery.unit,
      currentDate: new Date(delivery.planned_date).toLocaleDateString(),
      newDate: newDate.toLocaleDateString(),
      deliveryAddress: delivery.delivery_address,
      originalTaskDate: originalTaskDate.toLocaleDateString(),
      newTaskDate: newTaskDate.toLocaleDateString(),
      confirmUrl,
      denyUrl,
      senderName: sender.full_name,
      senderEmail: sender.email,
      senderPhone: sender.phone || 'Not provided'
    };

    const compiled = this.compileTemplate(EMAIL_TEMPLATES.DELIVERY_DATE_CHANGE, templateData);

    return await this.sendEmail({
      to: supplier.email,
      subject: compiled.subject,
      html: compiled.html,
      replyTo: sender.email
    });
  }

  /**
   * Send approval request notification
   */
  async sendApprovalRequest(
    proposal: TaskChangeProposal,
    task: Task,
    manager: User,
    proposer: User,
    project: Project
  ): Promise<{ success: boolean; error?: string }> {
    const approveUrl = `${this.APP_URL}/approvals?action=approve&id=${proposal.id}`;
    const rejectUrl = `${this.APP_URL}/approvals?action=reject&id=${proposal.id}`;

    const templateData = {
      managerName: manager.full_name,
      taskTitle: task.title,
      proposedBy: proposer.full_name,
      changeType: 'Schedule Change',
      reason: proposal.reason,
      dateChanges: proposal.proposed_start_date || proposal.proposed_end_date,
      originalStartDate: proposal.proposed_start_date ? new Date(task.start_date).toLocaleDateString() : null,
      newStartDate: proposal.proposed_start_date ? new Date(proposal.proposed_start_date).toLocaleDateString() : null,
      originalEndDate: proposal.proposed_end_date ? new Date(task.end_date).toLocaleDateString() : null,
      newEndDate: proposal.proposed_end_date ? new Date(proposal.proposed_end_date).toLocaleDateString() : null,
      notes: proposal.impact_description || '',
      approveUrl,
      rejectUrl
    };

    const compiled = this.compileTemplate(EMAIL_TEMPLATES.APPROVAL_REQUEST, templateData);

    return await this.sendEmail({
      to: manager.email,
      subject: compiled.subject,
      html: compiled.html
    });
  }

  /**
   * Send QA alert notification
   */
  async sendQAAlert(
    alert: {
      type: string;
      title: string;
      description: string;
      priority: string;
      due_date: Date;
      checklist?: string[];
    },
    task: Task,
    assignee: User,
    project: Project,
    sender: User
  ): Promise<{ success: boolean; error?: string }> {
    const priorityColors = {
      low: '#10b981',
      medium: '#f59e0b',
      high: '#ef4444',
      critical: '#dc2626'
    };

    const templateData = {
      assigneeName: assignee.full_name,
      projectName: project.name,
      alertType: alert.type.replace('_', ' ').toUpperCase(),
      alertTitle: alert.title,
      alertDescription: alert.description,
      taskTitle: task.title,
      priority: alert.priority.toUpperCase(),
      priorityColor: priorityColors[alert.priority as keyof typeof priorityColors],
      dueDate: alert.due_date.toLocaleDateString(),
      checklist: alert.checklist,
      qaUrl: `${this.APP_URL}/qa`,
      senderName: sender.full_name
    };

    const compiled = this.compileTemplate(EMAIL_TEMPLATES.QA_ALERT, templateData);

    return await this.sendEmail({
      to: assignee.email,
      subject: compiled.subject,
      html: compiled.html,
      replyTo: sender.email
    });
  }

  /**
   * Send custom notification email
   */
  async sendCustomNotification(
    to: string,
    subject: string,
    message: string,
    sender?: User
  ): Promise<{ success: boolean; error?: string }> {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #f8fafc; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
          <h1 style="color: #1e293b; margin: 0;">🏗️ Gogram</h1>
          <p style="color: #64748b; margin: 5px 0 0 0;">Construction Project Management</p>
        </div>
        
        <div style="background: white; padding: 30px; border: 1px solid #e2e8f0;">
          <div style="white-space: pre-wrap; line-height: 1.6; color: #374151;">${message}</div>
          
          ${sender ? `
          <p style="color: #64748b; font-size: 14px; border-top: 1px solid #e2e8f0; padding-top: 20px; margin-top: 30px;">
            Best regards,<br>
            ${sender.full_name}<br>
            ${sender.email}
          </p>
          ` : ''}
        </div>
      </div>
    `;

    return await this.sendEmail({
      to,
      subject,
      html,
      replyTo: sender?.email
    });
  }

  /**
   * Test email configuration
   */
  async testEmailConfiguration(testEmail: string): Promise<{ success: boolean; error?: string }> {
    return await this.sendCustomNotification(
      testEmail,
      '✅ Gogram Email Test - Configuration Working!',
      `This is a test email to verify your email configuration is working properly.

Provider: ${this.EMAIL_PROVIDER}
From: ${this.FROM_EMAIL}
Test sent at: ${new Date().toISOString()}

If you received this email, your email notifications are properly configured! 🎉`
    );
  }
}

const emailService = new EmailService();
export default emailService; 