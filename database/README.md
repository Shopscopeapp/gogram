# Gogram Database Setup Guide

This directory contains the complete database schema and setup files for the Gogram construction management platform using Supabase (PostgreSQL).

## 📁 File Structure

```
database/
├── supabase-schema.sql     # Complete database schema with tables, indexes, RLS
├── seed-data.sql          # Sample data for testing and demo
├── migrations/
│   └── 001_initial_schema.sql  # Migration file
└── README.md             # This setup guide
```

## 🚀 Quick Setup

### 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Note your project URL and API keys
3. Access the SQL Editor in your Supabase dashboard

### 2. Run Database Schema

Execute the schema in this order:

```sql
-- 1. Run the main schema
\i 'supabase-schema.sql'

-- 2. Add sample data (optional, for testing)
\i 'seed-data.sql'
```

**Or via Supabase Dashboard:**
1. Open SQL Editor
2. Copy and paste the contents of `supabase-schema.sql`
3. Click "Run"
4. Repeat for `seed-data.sql` if you want sample data

### 3. Configure Environment Variables

Add these to your `.env.local` file:

```env
NEXT_PUBLIC_SUPABASE_URL=your_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

## 🗄️ Database Schema Overview

### Core Tables

| Table | Purpose | Key Features |
|-------|---------|--------------|
| `users` | User profiles and roles | Extends Supabase auth, role-based access |
| `projects` | Construction projects | Progress tracking, public sharing |
| `tasks` | Project tasks | Dependencies, Gantt chart support |
| `suppliers` | Supplier management | Contact info, specialties, ratings |
| `deliveries` | Material deliveries | Task linking, confirmation system |
| `qa_alerts` | Quality assurance | Checklists, ITP tracking |
| `notifications` | User notifications | Real-time updates system |

### Security Features

- **Row Level Security (RLS)** enabled on all tables
- **Role-based permissions** (PM, Coordinator, Subcontractor, Supplier, Viewer)
- **Audit logging** for all critical actions
- **Public sharing** with secure token system

### Automation Features

- **Auto-updated timestamps** via triggers
- **Project progress calculation** based on task completion
- **Activity logging** for audit trail
- **QA alert generation** based on construction workflows

## 🔐 User Roles & Permissions

### Project Manager
- Full access to all project data
- Can create/modify tasks and schedules
- Approve change requests
- Manage team members
- Generate reports

### Project Coordinator  
- Assist with project management
- Manage QA processes
- Coordinate with subcontractors
- Limited editing permissions

### Subcontractor
- View assigned tasks
- Update task progress
- Propose schedule changes
- Submit completion confirmations

### Supplier
- View delivery schedules
- Confirm/reject delivery dates
- Update delivery status
- Access procurement information

### Viewer (Client/Stakeholder)
- Read-only access to project progress
- View public project information
- No editing capabilities

## 📊 Key Features Supported

### ✅ **Scheduling & Gantt Charts**
- Task dependencies with automatic cascade updates
- Critical path calculation
- Drag-and-drop schedule modifications
- Progress tracking with visual indicators

### ✅ **Procurement Automation**
- Supplier notification system
- Delivery confirmation workflows
- Task-delivery linking
- Automated email notifications

### ✅ **Quality Assurance**
- Construction-specific QA triggers
- ITP (Inspection & Test Plan) management
- Pre-pour checklists
- Engineer inspection scheduling
- Compliance tracking

### ✅ **Reporting & Analytics**
- Delay register generation
- Progress reports
- Change history tracking
- Project snapshots
- Executive dashboards

### ✅ **Public Sharing**
- Secure client portals
- Hide sensitive procurement data
- Real-time progress updates
- Customizable sharing settings

## 🔧 Database Functions

### Helper Functions
- `get_user_project_role(user_id, project_id)` - Get user's role in project
- `can_user_perform_action(user_id, project_id, required_roles[])` - Permission checking
- `generate_public_share_token()` - Create secure sharing links

### Automatic Triggers
- `update_updated_at_column()` - Auto-update timestamps
- `log_activity()` - Audit trail logging
- `update_project_progress()` - Recalculate project completion

## 📈 Performance Optimizations

### Indexes Created
- User lookups (email, role, auth_user_id)
- Project queries (manager, status, dates)
- Task filtering (project, assignee, status, dates)
- Delivery tracking (project, task, supplier, status)
- QA alerts (project, task, status, assigned user)
- Notifications (user, read status, creation date)
- Activity logs (project, user, entity, timestamps)

### Database Views
- `project_dashboard_stats` - Pre-calculated project metrics
- `task_details` - Task information with dependencies and QA count

## 🚨 Important Notes

### Authentication Integration
- Users table extends Supabase's built-in `auth.users`
- Use `auth_user_id` to link with authentication
- RLS policies check against `auth.uid()`

### Data Types
- All IDs use UUID for security and distributed systems
- JSONB for flexible configuration data
- Custom ENUMs for status fields
- Proper constraints and validations

### Triggers & Automation
- Project progress updates automatically on task changes
- Activity logging happens automatically via triggers
- Notification generation via application logic

## 🧪 Testing with Sample Data

The `seed-data.sql` file includes:
- **5 sample users** (one for each role type)
- **2 sample projects** (Metro Tower and Residential Complex)
- **6 sample tasks** with realistic construction workflow
- **4 sample suppliers** with specialties
- **4 sample deliveries** linked to tasks
- **QA alerts** with checklists
- **Change proposals** and approvals
- **Notifications** and activity logs

## 📱 Frontend Integration

### Recommended Supabase Client Setup

```typescript
// lib/supabase.ts
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

export const supabase = createClientComponentClient()

// Get current user with role
export async function getCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabase
    .from('users')
    .select('*')
    .eq('auth_user_id', user.id)
    .single()

  return profile
}
```

### Real-time Subscriptions

```typescript
// Subscribe to project updates
const subscription = supabase
  .channel('project-updates')
  .on('postgres_changes', {
    event: '*',
    schema: 'public', 
    table: 'tasks',
    filter: `project_id=eq.${projectId}`
  }, (payload) => {
    // Handle real-time updates
  })
  .subscribe()
```

## 🔄 Migration Strategy

For production deployments:

1. **Version Control**: Keep all schema changes in migration files
2. **Incremental Updates**: Create numbered migration files for changes
3. **Rollback Plans**: Test rollback procedures
4. **Data Validation**: Verify data integrity after migrations

## 🆘 Troubleshooting

### Common Issues

**RLS Policy Errors**
- Ensure user is properly authenticated
- Check if user has correct role in project_members table
- Verify RLS policies match your access patterns

**Performance Issues**  
- Check if proper indexes are in place
- Monitor slow queries in Supabase dashboard
- Consider denormalizing frequently accessed data

**Trigger Errors**
- Verify all referenced tables exist
- Check trigger function permissions
- Test trigger logic with sample data

## 📚 Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [PostgreSQL Row Level Security](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)
- [Construction Project Management Best Practices](https://www.pmi.org/learning/library/construction-project-management-9379)

---

**Ready to build!** 🏗️ Your Gogram database is now configured for production-ready construction project management. 