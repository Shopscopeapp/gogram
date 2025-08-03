export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { createClient } = await import('@supabase/supabase-js');
  
  // Create Supabase client with service role key to bypass RLS
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseServiceKey) {
    return res.status(500).json({ 
      success: false, 
      error: 'Server configuration error' 
    });
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  if (req.method === 'GET') {
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
          delivery: {
            id: delivery.id,
            project_id: delivery.project_id,
            task_id: delivery.task_id,
            supplier_id: delivery.supplier_id,
            item: delivery.item,
            quantity: delivery.quantity,
            unit: delivery.unit,
            planned_date: delivery.planned_date,
            actual_date: delivery.actual_date,
            confirmation_status: delivery.confirmation_status,
            delivery_address: delivery.delivery_address,
            notes: delivery.notes,
            confirmed_by: delivery.confirmed_by,
            confirmed_at: delivery.confirmed_at,
            created_at: delivery.created_at,
            updated_at: delivery.updated_at,
          },
          supplier: {
            id: supplier.id,
            name: supplier.name,
            email: supplier.email,
            phone: supplier.phone,
            address: supplier.address,
            contact_person: supplier.contact_person,
            project_id: supplier.project_id,
          },
          project: {
            id: project.id,
            name: project.name,
          },
          task: task ? {
            id: task.id,
            title: task.title,
          } : null,
          tokenData: decoded
        }
      });

    } catch (error) {
      console.error('Supplier response GET error:', error);
      return res.status(500).json({ 
        success: false, 
        error: 'Internal server error' 
      });
    }
  }

  if (req.method === 'POST') {
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
  }

  return res.status(405).json({ error: 'Method not allowed' });
}