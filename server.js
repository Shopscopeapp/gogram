import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: '.env.local' });

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'dist')));

// Import Supabase for server-side operations
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://vcjotjqqbldtibajujac.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabaseAdmin = supabaseServiceKey ? createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
}) : null;

// Email API endpoint
app.post('/api/send-email', async (req, res) => {
  console.log('📧 Email API request received:', req.body);
  
  try {
    const { to, subject, html, from, cc } = req.body;

    // Validate required fields
    if (!to || !subject || !html) {
      console.log('❌ Missing required fields');
      return res.status(400).json({ error: 'Missing required fields: to, subject, html' });
    }

    // Debug: Log the API key being used
    const apiKey = process.env.NEXT_PUBLIC_EMAIL_API_KEY || 're_HzkrygJY_FZzv3EEYMFq1gVZff2YQQnhS';
    console.log('🔧 Server API Key:', apiKey ? `${apiKey.substring(0, 10)}...` : 'undefined');
    console.log('📧 Sending email to:', to);
    
    if (!apiKey) {
      console.error('❌ Email API Key not found in environment variables');
      return res.status(500).json({ 
        success: false, 
        error: 'Email API key not configured' 
      });
    }
    
    // Send email via Resend
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
             body: JSON.stringify({
         from: from || 'notifications@gogram.co',
         to: [to],
         subject: subject,
         html: html,
         ...(cc && { cc: [cc] }) // Include CC if provided
       })
    });

    console.log('📧 Resend response status:', response.status);
    
    if (response.ok) {
      const result = await response.json();
      console.log('✅ Email sent successfully:', result);
      return res.status(200).json({ 
        success: true, 
        message: 'Email sent successfully',
        id: result.id 
      });
    } else {
      const error = await response.json();
      console.log('❌ Resend error:', error);
      return res.status(response.status).json({ 
        success: false, 
        error: `Resend error: ${error.message || 'Unknown error'}` 
      });
    }
  } catch (error) {
    console.error('Email sending error:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
});

// Supplier response API endpoint (bypasses RLS)
app.get('/api/supplier-response', async (req, res) => {
  try {
    const { token } = req.query;
    
    if (!token) {
      return res.status(400).json({ 
        success: false, 
        error: 'Token is required' 
      });
    }

    // Decode and validate token
    let decoded;
    try {
      decoded = JSON.parse(Buffer.from(token, 'base64').toString());
    } catch (error) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid token format' 
      });
    }

    // Check if token is expired
    if (Date.now() > decoded.expires) {
      return res.status(400).json({ 
        success: false, 
        error: 'Token has expired' 
      });
    }

    // Create Supabase client with service role key to bypass RLS
    const { createClient } = await import('@supabase/supabase-js');
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseServiceKey) {
      return res.status(500).json({ 
        success: false, 
        error: 'Server configuration error' 
      });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch delivery data (bypasses RLS with service role key)
    const { data: delivery, error: deliveryError } = await supabase
      .from('deliveries')
      .select('*')
      .eq('id', decoded.deliveryId)
      .single();

    if (deliveryError || !delivery) {
      console.error('Delivery lookup error:', deliveryError);
      return res.status(404).json({ 
        success: false, 
        error: 'Delivery not found' 
      });
    }

    // Fetch supplier data
    const { data: supplier, error: supplierError } = await supabase
      .from('suppliers')
      .select('*')
      .eq('id', decoded.supplierId)
      .single();

    if (supplierError || !supplier) {
      console.error('Supplier lookup error:', supplierError);
      return res.status(404).json({ 
        success: false, 
        error: 'Supplier not found' 
      });
    }

    // Fetch project data
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('*')
      .eq('id', decoded.projectId)
      .single();

    if (projectError || !project) {
      console.error('Project lookup error:', projectError);
      return res.status(404).json({ 
        success: false, 
        error: 'Project not found' 
      });
    }

    // Fetch task data
    const { data: task, error: taskError } = await supabase
      .from('tasks')
      .select('*')
      .eq('id', delivery.task_id)
      .single();

    return res.status(200).json({
      success: true,
      data: {
        delivery,
        supplier,
        project,
        task,
        tokenData: decoded
      }
    });

  } catch (error) {
    console.error('Supplier response error:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
});

app.post('/api/supplier-response', async (req, res) => {
  try {
    const { token, action, comments, alternativeDate } = req.body;
    
    if (!token || !action) {
      return res.status(400).json({ 
        success: false, 
        error: 'Token and action are required' 
      });
    }

    // Decode and validate token
    let decoded;
    try {
      decoded = JSON.parse(Buffer.from(token, 'base64').toString());
    } catch (error) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid token format' 
      });
    }

    // Check if token is expired
    if (Date.now() > decoded.expires) {
      return res.status(400).json({ 
        success: false, 
        error: 'Token has expired' 
      });
    }

    // Create Supabase client with service role key to bypass RLS
    const { createClient } = await import('@supabase/supabase-js');
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseServiceKey) {
      return res.status(500).json({ 
        success: false, 
        error: 'Server configuration error' 
      });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Record the response in delivery_responses table
    const { data: response, error: responseError } = await supabase
      .from('delivery_responses')
      .insert({
        delivery_id: decoded.deliveryId,
        supplier_id: decoded.supplierId,
        response: action,
        comments: comments,
        alternative_date: alternativeDate,
        responded_at: new Date().toISOString()
      })
      .select()
      .single();

    if (responseError) {
      console.error('Response recording error:', responseError);
      return res.status(500).json({ 
        success: false, 
        error: 'Failed to record response' 
      });
    }

    // If confirmed, update the delivery status
    if (action === 'confirm') {
      const { error: updateError } = await supabase
        .from('deliveries')
        .update({
          confirmation_status: 'confirmed',
          confirmed_at: new Date().toISOString(),
          confirmed_by: decoded.supplierId
        })
        .eq('id', decoded.deliveryId);

      if (updateError) {
        console.error('Delivery update error:', updateError);
        // Don't fail the request, response was still recorded
      }
    }

    return res.status(200).json({
      success: true,
      message: 'Response recorded successfully',
      responseId: response.id
    });

  } catch (error) {
    console.error('Supplier response POST error:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
});

// Public project API endpoint
app.get('/api/public-project', async (req, res) => {
  if (!supabaseAdmin) {
    return res.status(500).json({ 
      success: false, 
      error: 'Service role key not configured' 
    });
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

    // 4. Get tasks data
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
    }));

    // 6. Calculate project statistics
    const totalTasks = sanitizedTasks.length;
    const completedTasks = sanitizedTasks.filter(t => t.status === 'completed').length;
    const completionPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
    
    // 7. Update access tracking
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
        access_log: [...(publicShare.access_log || []), accessEntry].slice(-100)
      })
      .eq('id', publicShare.id);

    // 8. Return sanitized project data
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
      },
      tasks: sanitizedTasks,
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
      tasksCount: sanitizedTasks.length
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
});

// Serve the React app
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📧 Email API available at http://localhost:${PORT}/api/send-email`);
  console.log(`🔗 Supplier response API available at http://localhost:${PORT}/api/supplier-response`);
  console.log(`🌐 Public project API available at http://localhost:${PORT}/api/public-project`);
}); 