import type { Task, Delivery, Supplier, DeliveryConfirmation } from '../types';
import { format } from 'date-fns';

interface EmailNotification {
  to: string;
  subject: string;
  html: string;
  deliveryId: string;
  newDate: Date;
}

interface SupplierConfirmationResponse {
  deliveryId: string;
  supplierId: string;
  response: 'confirmed' | 'rejected';
  newProposedDate?: Date;
  comments?: string;
}

class ProcurementService {
  private baseUrl = 'https://gogram.app'; // In production, this would be your domain
  
  /**
   * Check if a task has linked deliveries that need notification
   */
  public hasLinkedDeliveries(taskId: string, deliveries: Delivery[]): boolean {
    return deliveries.some(delivery => delivery.task_id === taskId);
  }

  /**
   * Get deliveries linked to a specific task
   */
  public getLinkedDeliveries(taskId: string, deliveries: Delivery[]): Delivery[] {
    return deliveries.filter(delivery => delivery.task_id === taskId);
  }

  /**
   * Generate email notification for supplier when delivery date changes
   */
  public generateDeliveryChangeNotification(
    delivery: Delivery,
    supplier: Supplier,
    newDate: Date,
    taskTitle: string,
    projectName: string
  ): EmailNotification {
    const confirmUrl = `${this.baseUrl}/confirm-delivery/${delivery.id}`;
    
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Delivery Date Change - ${projectName}</title>
          <style>
            body { font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #3b82f6; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
            .content { background: #fff; padding: 20px; border: 1px solid #e5e7eb; }
            .footer { background: #f9fafb; padding: 20px; border-radius: 0 0 8px 8px; text-align: center; }
            .btn { display: inline-block; padding: 12px 24px; margin: 10px; text-decoration: none; border-radius: 6px; font-weight: 600; }
            .btn-confirm { background: #22c55e; color: white; }
            .btn-reject { background: #ef4444; color: white; }
            .delivery-details { background: #f3f4f6; padding: 16px; border-radius: 6px; margin: 16px 0; }
            .highlight { background: #fef3c7; padding: 2px 6px; border-radius: 4px; }
            .construction-icon { font-size: 24px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <span class="construction-icon">🏗️</span>
              <h1 style="margin: 0; display: inline-block; margin-left: 10px;">Gogram - Delivery Schedule Update</h1>
            </div>
            
            <div class="content">
              <h2>Hello ${supplier.name},</h2>
              
              <p>The delivery schedule for <strong>${projectName}</strong> has been updated. We need your confirmation for the following delivery:</p>
              
              <div class="delivery-details">
                <h3 style="margin-top: 0; color: #1f2937;">📦 Delivery Details</h3>
                <p><strong>Item:</strong> ${delivery.item}</p>
                <p><strong>Quantity:</strong> ${delivery.quantity} ${delivery.unit}</p>
                <p><strong>For Task:</strong> ${taskTitle}</p>
                <p><strong>Original Date:</strong> ${format(delivery.planned_date, 'EEEE, MMMM dd, yyyy')}</p>
                <p><strong>New Requested Date:</strong> <span class="highlight">${format(newDate, 'EEEE, MMMM dd, yyyy')}</span></p>
                ${delivery.notes ? `<p><strong>Notes:</strong> ${delivery.notes}</p>` : ''}
              </div>
              
              <h3>⏰ Action Required</h3>
              <p>Please confirm if you can accommodate this new delivery date. Your response helps keep the entire project on schedule.</p>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${confirmUrl}?response=confirmed" class="btn btn-confirm">
                  ✅ Confirm New Date
                </a>
                <a href="${confirmUrl}?response=rejected" class="btn btn-reject">
                  ❌ Cannot Accommodate
                </a>
              </div>
              
              <p style="font-size: 14px; color: #6b7280;">
                <strong>Need to propose a different date?</strong> Click either button above and you'll be able to suggest an alternative date in the next step.
              </p>
              
              <div style="border-top: 1px solid #e5e7eb; padding-top: 16px; margin-top: 20px;">
                <h4 style="color: #1f2937;">📞 Contact Information</h4>
                <p style="margin: 8px 0;">If you have questions, please contact the project team directly:</p>
                <p style="margin: 4px 0; font-size: 14px;">📧 Project email: ${projectName.toLowerCase().replace(/\s+/g, '-')}@gogram.app</p>
                <p style="margin: 4px 0; font-size: 14px;">📱 Support: +1 (555) GOGRAM</p>
              </div>
            </div>
            
            <div class="footer">
              <p style="margin: 0; color: #6b7280; font-size: 14px;">
                This notification was sent automatically by Gogram Construction Management Platform.<br>
                © 2024 Gogram - Making construction project management simple and effective.
              </p>
            </div>
          </div>
        </body>
      </html>
    `;

    return {
      to: supplier.email,
      subject: `🏗️ Delivery Date Change Required - ${delivery.item} for ${projectName}`,
      html,
      deliveryId: delivery.id,
      newDate
    };
  }

  /**
   * Send email notification to supplier (simulated)
   * In production, this would integrate with SendGrid, Mailgun, or similar service
   */
  public async sendEmailNotification(notification: EmailNotification): Promise<boolean> {
    try {
      // Simulate email sending with delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      console.log('📧 Email sent to:', notification.to);
      console.log('📧 Subject:', notification.subject);
      console.log('📧 Delivery ID:', notification.deliveryId);
      console.log('📧 New Date:', format(notification.newDate, 'MMM dd, yyyy'));
      
      // In production, you would use a service like:
      /*
      const response = await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: notification.to,
          subject: notification.subject,
          html: notification.html,
          metadata: {
            deliveryId: notification.deliveryId,
            newDate: notification.newDate.toISOString()
          }
        })
      });
      return response.ok;
      */
      
      return true; // Simulate successful send
    } catch (error) {
      console.error('Failed to send email notification:', error);
      return false;
    }
  }

  /**
   * Process task date change and notify affected suppliers
   */
  public async processTaskDateChange(
    task: Task,
    newStartDate: Date,
    newEndDate: Date,
    deliveries: Delivery[],
    suppliers: Supplier[],
    projectName: string
  ): Promise<{
    notificationsSent: number;
    errors: string[];
  }> {
    const linkedDeliveries = this.getLinkedDeliveries(task.id, deliveries);
    const notificationsSent: number[] = [];
    const errors: string[] = [];

    if (linkedDeliveries.length === 0) {
      return { notificationsSent: 0, errors: [] };
    }

    console.log(`🔄 Processing task date change for: ${task.title}`);
    console.log(`📅 New dates: ${format(newStartDate, 'MMM dd')} - ${format(newEndDate, 'MMM dd')}`);
    console.log(`📦 ${linkedDeliveries.length} linked deliveries found`);

    for (const delivery of linkedDeliveries) {
      try {
        const supplier = suppliers.find(s => s.id === delivery.supplier_id);
        if (!supplier) {
          errors.push(`Supplier not found for delivery ${delivery.id}`);
          continue;
        }

        // Calculate new delivery date based on task change
        // For simplicity, we're moving delivery to the new task start date
        // In production, you might have more complex logic based on delivery type
        const newDeliveryDate = new Date(newStartDate);
        newDeliveryDate.setDate(newDeliveryDate.getDate() - 1); // Deliver 1 day before task starts

        // Generate and send notification
        const notification = this.generateDeliveryChangeNotification(
          delivery,
          supplier,
          newDeliveryDate,
          task.title,
          projectName
        );

        const success = await this.sendEmailNotification(notification);
        
        if (success) {
          notificationsSent.push(1);
          console.log(`✅ Notification sent to ${supplier.name} (${supplier.email})`);
        } else {
          errors.push(`Failed to send notification to ${supplier.name}`);
        }
      } catch (error) {
        errors.push(`Error processing delivery ${delivery.id}: ${error}`);
      }
    }

    return {
      notificationsSent: notificationsSent.length,
      errors
    };
  }

  /**
   * Process supplier confirmation response
   */
  public processSupplierConfirmation(
    response: SupplierConfirmationResponse,
    deliveries: Delivery[]
  ): {
    success: boolean;
    updatedDelivery?: Delivery;
    message: string;
  } {
    const delivery = deliveries.find(d => d.id === response.deliveryId);
    
    if (!delivery) {
      return {
        success: false,
        message: 'Delivery not found'
      };
    }

    const updatedDelivery: Delivery = {
      ...delivery,
      confirmation_status: response.response,
      planned_date: response.newProposedDate || delivery.planned_date,
      notes: response.comments ? 
        `${delivery.notes || ''}\n\nSupplier response: ${response.comments}`.trim() : 
        delivery.notes
    };

    const message = response.response === 'confirmed' 
      ? '✅ Delivery date confirmed by supplier'
      : '❌ Delivery date rejected by supplier';

    return {
      success: true,
      updatedDelivery,
      message
    };
  }

  /**
   * Generate confirmation URL for suppliers
   */
  public generateConfirmationUrl(deliveryId: string): string {
    return `${this.baseUrl}/confirm-delivery/${deliveryId}`;
  }

  /**
   * Get delivery status badge info for UI
   */
  public getDeliveryStatusBadge(delivery: Delivery): {
    color: string;
    text: string;
    icon: string;
  } {
    switch (delivery.confirmation_status) {
      case 'confirmed':
        return { color: 'success', text: 'Confirmed', icon: '✅' };
      case 'rejected':
        return { color: 'danger', text: 'Rejected', icon: '❌' };
      default:
        return { color: 'warning', text: 'Pending', icon: '⏳' };
    }
  }

  private getDeliveryStatusIcon(delivery: Delivery): string {
    switch (delivery.confirmation_status) {
      case 'confirmed':
        return '✅';
      case 'rejected':
        return '❌';
      case 'pending':
      default:
        return '⏳';
    }
  }
}

// Export singleton instance
export const procurementService = new ProcurementService();
export default procurementService; 