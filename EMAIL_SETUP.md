# 📧 Email Setup Guide for Gogram

## 🎯 Recommended Provider: Resend

For this construction project management platform, **Resend** is the recommended email provider because:
- ✅ **Modern developer experience** with excellent TypeScript support
- ✅ **Perfect for transactional emails** (task assignments, approvals, notifications)
- ✅ **Great delivery rates** (99%+) for construction industry communications
- ✅ **Affordable pricing** ($20/month for 50k emails)
- ✅ **Already integrated** in your email service

## 🔧 Step 1: Environment Variables

Create or update your `.env.local` file in the project root:

```bash
# Email Configuration (Recommended: Resend)
NEXT_PUBLIC_EMAIL_PROVIDER=resend
NEXT_PUBLIC_FROM_EMAIL=notifications@gogram.co
NEXT_PUBLIC_EMAIL_API_KEY=your_resend_api_key_here
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Supabase Configuration (if not already set)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## 🎯 Step 2: Choose Your Email Provider

### Option A: Resend (Recommended)
```bash
NEXT_PUBLIC_EMAIL_PROVIDER=resend
NEXT_PUBLIC_EMAIL_API_KEY=your_resend_api_key
```
**Setup Steps:**
1. Sign up at [Resend](https://resend.com) (free tier available)
2. Create API key in dashboard
3. Verify your sender domain (gogram.app)
4. Test with the built-in test function

**Why Resend?**
- 🚀 **Modern API** with excellent TypeScript support
- 📊 **Built-in analytics** and webhook support
- 💰 **Affordable pricing** ($20/month for 50k emails)
- ✅ **99%+ delivery rates** perfect for construction communications
- 🔧 **Easy integration** with your existing React/TypeScript stack

### Option B: SendGrid (Enterprise)
```bash
NEXT_PUBLIC_EMAIL_PROVIDER=sendgrid
NEXT_PUBLIC_EMAIL_API_KEY=your_sendgrid_api_key
```
**Best for:** Large construction companies needing enterprise-grade reliability
- ✅ **Highest delivery rates** (99.5%+)
- ✅ **Comprehensive analytics** and reporting
- ❌ **More expensive** ($14.95/month for 50k emails)
- ❌ **Complex setup** for advanced features

### Option C: Mailgun (Budget)
```bash
NEXT_PUBLIC_EMAIL_PROVIDER=mailgun
NEXT_PUBLIC_EMAIL_API_KEY=your_mailgun_api_key
NEXT_PUBLIC_MAILGUN_DOMAIN=your_domain
```
**Best for:** Cost-conscious users with high email volume
- ✅ **Lowest pricing** for high volume
- ❌ **Complex setup** and outdated documentation
- ❌ **Less intuitive** developer experience

### Option D: Simulation Mode (Development)
```bash
NEXT_PUBLIC_EMAIL_PROVIDER=simulation
```
- ✅ **No API keys needed**
- ✅ **Emails logged to browser console**
- ✅ **Perfect for development/testing**
- ✅ **Instant setup**

## 🧪 Step 3: Test Email Configuration

### Test via Account Settings
1. Go to **Account Settings** → **Notifications**
2. Click **Test Email Configuration**
3. Enter your email address
4. Check for test email

### Test via Console (Simulation Mode)
1. Open browser console (F12)
2. Look for email logs when actions trigger emails
3. Verify template rendering

## 📋 Step 4: Email Triggers

The system automatically sends emails for:

### ✅ Task Management
- **Task Assignment**: When tasks are assigned to users
- **Task Updates**: When task status changes
- **Due Date Reminders**: For overdue tasks

### ✅ Delivery Management
- **Delivery Confirmations**: When suppliers need to confirm deliveries
- **Reschedule Requests**: When delivery dates change
- **Confirmation Links**: Direct links to confirm/reschedule

### ✅ Approval Workflows
- **Change Proposals**: When task changes need approval
- **Approval Requests**: Sent to project managers
- **Status Updates**: When proposals are approved/rejected

### ✅ Quality Assurance
- **QA Alerts**: For quality issues and inspections
- **Safety Reports**: Monthly safety notifications
- **Compliance Updates**: Regulatory notifications

## 🔍 Step 5: Email Templates

The system includes professional email templates for:

### 📧 Task Assignment Email
- Professional header with Gogram branding
- Task details with priority and dates
- Direct link to view task in app
- Sender information

### 📧 Delivery Confirmation Email
- Delivery details and materials
- Action buttons for confirm/reschedule
- 24-hour response requirement
- Professional formatting

### 📧 Approval Request Email
- Change proposal details
- Impact assessment
- Approval/rejection buttons
- Project context

### 📧 QA Alert Email
- Quality issue description
- Checklist items
- Priority indicators
- Due date information

## 🛠️ Step 6: Customization

### Modify Email Templates
Edit `src/services/emailService.ts`:

```typescript
const EMAIL_TEMPLATES = {
  TASK_ASSIGNMENT: {
    subject: 'Your Custom Subject',
    html: `
      <div style="...">
        Your custom HTML template
      </div>
    `
  }
}
```

### Add New Email Types
```typescript
// Add new template
CUSTOM_NOTIFICATION: {
  subject: 'Custom Notification',
  html: `...`
}

// Add new method
async sendCustomNotification(data: any) {
  // Implementation
}
```

## 🚀 Step 7: Production Deployment

### For Vercel:
1. Add environment variables in Vercel dashboard
2. Set `NEXT_PUBLIC_APP_URL` to your production URL
3. Configure email provider API keys
4. Test email functionality

### For Other Platforms:
1. Set environment variables in your hosting platform
2. Update `NEXT_PUBLIC_APP_URL` to production URL
3. Configure email provider
4. Test all email triggers

## 🔧 Troubleshooting

### Common Issues:

1. **Emails not sending**
   - Check API key configuration
   - Verify email provider settings
   - Check browser console for errors

2. **Template rendering issues**
   - Verify HTML syntax in templates
   - Check variable substitution
   - Test with simulation mode

3. **Delivery failures**
   - Verify sender email domain
   - Check spam folder
   - Test with different email providers

### Debug Mode:
Set `NEXT_PUBLIC_EMAIL_PROVIDER=simulation` to see all emails in console.

## 📊 Monitoring

### Email Analytics:
- Check email provider dashboard for delivery rates
- Monitor bounce rates and spam complaints
- Track open rates and click-through rates

### Logs:
- Browser console shows simulation emails
- Email provider logs show delivery status
- Application logs show email triggers

## 🎯 Quick Start

1. **For immediate testing:**
   ```bash
   NEXT_PUBLIC_EMAIL_PROVIDER=simulation
   ```

2. **For production:**
   ```bash
   NEXT_PUBLIC_EMAIL_PROVIDER=sendgrid
   NEXT_PUBLIC_EMAIL_API_KEY=your_key
   NEXT_PUBLIC_APP_URL=https://yourdomain.com
   ```

3. **Test the setup:**
   - Go to Account Settings → Notifications
   - Click "Test Email Configuration"
   - Check for test email

That's it! Your email system is now configured and ready to use! 🎉 