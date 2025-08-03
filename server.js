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

// Serve the React app
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📧 Email API available at http://localhost:${PORT}/api/send-email`);
}); 