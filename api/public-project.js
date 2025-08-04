// Serverless function to provide public access to shared projects
// Bypasses RLS using service role key

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://vcjotjqqbldtibajujac.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseServiceKey) {
  console.error('SUPABASE_SERVICE_ROLE_KEY is not set');
}

// Create service role client (bypasses RLS)
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const { shareToken } = req.query;

    if (!shareToken) {
      return res.status(400).json({ 
        success: false, 
        error: 'Share token is required' 
      });
    }

    console.log('🔍 Looking up public share with token:', shareToken);

    // 1. Find the public share record
    const { data: publicShare, error: shareError } = await supabaseAdmin
      .from('public_shares')
      .select('*')
      .eq('share_token', shareToken)
      .eq('is_active', true)
      .single();

    if (shareError || !publicShare) {
      console.error('Public share not found:', shareError);
      return res.status(404).json({ 
        success: false, 
        error: 'Share link not found or has been deactivated' 
      });
    }

    // 2. Check if share link has expired
    if (publicShare.expires_at && new Date(publicShare.expires_at) < new Date()) {
      return res.status(410).json({ 
        success: false, 
        error: 'Share link has expired' 
      });
    }

    console.log('✅ Valid public share found for project:', publicShare.project_id);

    // 3. Get project data
    const { data: project, error: projectError } = await supabaseAdmin
      .from('projects')
      .select('*')
      .eq('id', publicShare.project_id)
      .single();

    if (projectError || !project) {
      console.error('Project not found:', projectError);
      return res.status(404).json({ 
        success: false, 
        error: 'Project not found' 
      });
    }

    // 4. Get tasks data (filtered based on share settings)
    const { data: tasks, error: tasksError } = await supabaseAdmin
      .from('tasks')
      .select('*')
      .eq('project_id', publicShare.project_id)
      .order('start_date', { ascending: true });

    if (tasksError) {
      console.error('Error fetching tasks:', tasksError);
      return res.status(500).json({ 
        success: false, 
        error: 'Failed to fetch project tasks' 
      });
    }

    // 5. Filter and sanitize data based on share settings
    const settings = publicShare.settings || {};
    
    // Always remove sensitive fields from tasks
    const sanitizedTasks = (tasks || []).map(task => ({
      id: task.id,
      title: task.title,
      description: settings.showTaskDetails ? task.description : null,
      category: task.category,
      status: task.status,
      priority: task.priority,
      start_date: task.start_date,
      end_date: task.end_date,
      progress_percentage: settings.showProgress ? task.progress_percentage : 0,
      color: task.color,
      dependencies: task.dependencies || [],
      // Remove sensitive fields: assigned_to, cost, procurement details, internal notes
    }));

    // 6. Get team members if enabled
    let teamMembers = [];
    if (settings.showTeamMembers) {
      const { data: members, error: membersError } = await supabaseAdmin
        .from('project_members')
        .select(`
          role,
          users (
            id,
            full_name,
            email,
            company
          )
        `)
        .eq('project_id', publicShare.project_id);

      if (!membersError && members) {
        teamMembers = members.map(member => ({
          role: member.role,
          name: member.users?.full_name || 'Unknown',
          company: member.users?.company || null,
          // Remove sensitive info: email, contact details, etc.
        }));
      }
    }

    // 7. Calculate project statistics
    const totalTasks = sanitizedTasks.length;
    const completedTasks = sanitizedTasks.filter(t => t.status === 'completed').length;
    const completionPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
    
    // 8. Update access tracking
    const accessEntry = {
      timestamp: new Date().toISOString(),
      ipAddress: req.headers['x-forwarded-for'] || req.connection.remoteAddress || 'unknown',
      userAgent: req.headers['user-agent'] || 'unknown'
    };

    // Update access count and log
    await supabaseAdmin
      .from('public_shares')
      .update({
        access_count: publicShare.access_count + 1,
        last_accessed_at: new Date().toISOString(),
        access_log: [...(publicShare.access_log || []), accessEntry].slice(-100) // Keep last 100 entries
      })
      .eq('id', publicShare.id);

    // 9. Return sanitized project data
    const publicProjectData = {
      project: {
        id: project.id,
        name: project.name,
        description: project.description,
        start_date: project.start_date,
        end_date: project.end_date,
        status: project.status,
        progress_percentage: project.progress_percentage || completionPercentage,
        location: project.location,
        client: project.client,
        // Remove sensitive fields: budget, internal notes, etc.
      },
      tasks: sanitizedTasks,
      teamMembers: settings.showTeamMembers ? teamMembers : [],
      settings: settings,
      stats: {
        totalTasks,
        completedTasks,
        completionPercentage,
        onScheduleTasks: sanitizedTasks.filter(t => 
          t.status !== 'delayed' && new Date(t.end_date) >= new Date()
        ).length,
        upcomingDeadlines: sanitizedTasks.filter(t => {
          const daysUntilDeadline = Math.ceil((new Date(t.end_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
          return daysUntilDeadline <= 7 && daysUntilDeadline > 0;
        }).length
      },
      lastUpdated: project.updated_at
    };

    console.log('✅ Returning public project data:', {
      projectId: project.id,
      projectName: project.name,
      tasksCount: sanitizedTasks.length,
      settings: settings
    });

    return res.status(200).json({
      success: true,
      data: publicProjectData
    });

  } catch (error) {
    console.error('❌ Public project API error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
}