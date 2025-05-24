// server.js - Deploy this to Render
const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors');
const ical = require('ical-generator');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Enhanced email transporter setup for Proton Mail
const transporter = nodemailer.createTransport({
  host: 'mail.protonmail.ch', // Updated host
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  },
  tls: {
    rejectUnauthorized: false // More permissive for debugging
  },
  debug: true, // Enable debugging
  logger: true // Enable logging
});

// Test transporter connection on startup
transporter.verify((error, success) => {
  if (error) {
    console.error('❌ Email transporter verification failed:', error);
  } else {
    console.log('✅ Email transporter is ready to send emails');
  }
});

// RSVP endpoint with enhanced error handling
app.post('/rsvp', async (req, res) => {
  console.log('📧 RSVP request received:', req.body);
  
  try {
    const { name, email, company, role, edge } = req.body;
    
    // Validate required fields
    if (!name || !email || !role) {
      console.error('❌ Missing required fields:', { name: !!name, email: !!email, role: !!role });
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      console.error('❌ Invalid email format:', email);
      return res.status(400).json({ error: 'Invalid email format' });
    }

    console.log('📅 Creating calendar event...');
    
    // CREATE CALENDAR EVENT (.ICS FILE)
    const calendar = ical({
      name: 'Edge Cases Soirée',
      description: 'A soirée for those working seriously and semi-seriously on artificial intelligence'
    });

    calendar.createEvent({
      start: new Date('2025-06-25T18:00:00-07:00'), // Added timezone
      end: new Date('2025-06-25T21:00:00-07:00'),
      summary: 'Edge Cases Soirée',
      description: 'A soirée for those working seriously and semi-seriously on artificial intelligence. Come ready for off-record conversations about failures, foresight, and unfinished thoughts—over drinks.',
      location: '[VENUE TBD]',
      organizer: {
        name: 'Promontory AI',
        email: 'edgecases@promontoryai.com'
      },
      attendees: [{
        name: name,
        email: email,
        status: 'TENTATIVE',
        rsvp: true
      }]
    });

    const icsContent = calendar.toString();
    console.log('✅ Calendar event created');

    // Email options with better formatting
    const adminEmailOptions = {
      from: `"Edge Cases RSVP" <${process.env.EMAIL_USER}>`,
      to: 'edgecases@promontoryai.com',
      subject: `🎉 Edge Cases Soirée RSVP - ${name}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .header { background-color: #f8f9fa; padding: 20px; border-radius: 5px; }
            .details { background-color: #e9ecef; padding: 15px; border-radius: 5px; margin: 10px 0; }
            .field { margin: 8px 0; }
            .label { font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="header">
            <h2>🎉 New RSVP for Edge Cases Soirée</h2>
          </div>
          
          <div class="details">
            <div class="field"><span class="label">Name:</span> ${name}</div>
            <div class="field"><span class="label">Email:</span> ${email}</div>
            <div class="field"><span class="label">Company:</span> ${company || 'Not provided'}</div>
            <div class="field"><span class="label">Role:</span> ${role}</div>
            <div class="field"><span class="label">Edge Case:</span> ${edge || 'Not provided'}</div>
          </div>
          
          <h3>📅 Event Details:</h3>
          <div class="details">
            <div class="field"><span class="label">Event:</span> Edge Cases Soirée</div>
            <div class="field"><span class="label">Description:</span> A soirée for those working seriously and semi-seriously on artificial intelligence</div>
            <div class="field"><span class="label">Date:</span> Wednesday, June 25th, 2025</div>
            <div class="field"><span class="label">Time:</span> 6:00 PM - 9:00 PM PST</div>
            <div class="field"><span class="label">Location:</span> [VENUE TBD]</div>
          </div>
          
          <p><span class="label">Submitted at:</span> ${new Date().toLocaleString()}</p>
        </body>
        </html>
      `
    };

    const confirmationEmailOptions = {
      from: `"Edge Cases Soirée" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: '🎉 Welcome to Edge Cases Soirée - Your AI Gathering Awaits',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; }
            .header { background-color: #f8f9fa; padding: 20px; border-radius: 5px; text-align: center; }
            .content { padding: 20px 0; }
            .event-details { background-color: #e9ecef; padding: 15px; border-radius: 5px; margin: 15px 0; }
            .footer { background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin-top: 20px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h2>🎉 Welcome to Edge Cases Soirée!</h2>
          </div>
          
          <div class="content">
            <p>Hi ${name},</p>
            
            <p>We're excited you'll be joining us for our soirée dedicated to those working seriously and semi-seriously on artificial intelligence.</p>
            
            <p><strong>You're confirmed as:</strong> ${role}</p>
            
            <div class="event-details">
              <h3>📅 Event Details:</h3>
              <p>📅 <strong>Date:</strong> Wednesday, June 25th, 2025</p>
              <p>⏰ <strong>Time:</strong> 6:00 PM - 9:00 PM PST</p>
              <p>📍 <strong>Location:</strong> [VENUE TBD]</p>
            </div>
            
            <p>This gathering is for those who break AI, pretend to understand it, worry about what it will do, launch with fingers crossed, and clean up after the demo. Come ready for off-record conversations about failures, foresight, and unfinished thoughts—over drinks.</p>
            
            <p><strong>📎 Calendar:</strong> A calendar invite (.ics file) is attached that works with any calendar system.</p>
            
            <p>Looking forward to exploring the edge cases with you!</p>
          </div>
          
          <div class="footer">
            <p>Best,<br>
            The Edge Cases Team @ Promontory AI<br>
            <a href="mailto:edgecases@promontoryai.com">edgecases@promontoryai.com</a></p>
          </div>
        </body>
        </html>
      `,
      attachments: [
        {
          filename: 'Edge-Cases-Soiree.ics',
          content: Buffer.from(icsContent, 'utf-8'),
          contentType: 'text/calendar; charset=utf-8; method=REQUEST',
          contentDisposition: 'attachment'
        }
      ]
    };

    console.log('📧 Sending admin email...');
    try {
      const adminResult = await transporter.sendMail(adminEmailOptions);
      console.log('✅ Admin email sent successfully:', adminResult.messageId);
    } catch (adminError) {
      console.error('❌ Failed to send admin email:', adminError);
      throw new Error('Failed to send admin notification email');
    }

    console.log('📧 Sending confirmation email...');
    try {
      const confirmResult = await transporter.sendMail(confirmationEmailOptions);
      console.log('✅ Confirmation email sent successfully:', confirmResult.messageId);
    } catch (confirmError) {
      console.error('❌ Failed to send confirmation email:', confirmError);
      throw new Error('Failed to send confirmation email');
    }

    console.log('✅ Both emails sent successfully');
    res.json({ 
      success: true, 
      message: 'RSVP submitted successfully! Check your email for confirmation.' 
    });

  } catch (error) {
    console.error('❌ Error in RSVP endpoint:', error);
    
    // More specific error messages
    let errorMessage = 'Failed to submit RSVP. Please try again.';
    if (error.message.includes('authentication')) {
      errorMessage = 'Email authentication failed. Please check server configuration.';
    } else if (error.message.includes('network') || error.message.includes('timeout')) {
      errorMessage = 'Network error occurred. Please try again.';
    } else if (error.message.includes('recipient')) {
      errorMessage = 'Invalid recipient email address.';
    }
    
    res.status(500).json({ 
      error: errorMessage,
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Test email endpoint for debugging
app.post('/test-email', async (req, res) => {
  try {
    console.log('🧪 Testing email configuration...');
    
    const testEmail = {
      from: process.env.EMAIL_USER,
      to: process.env.EMAIL_USER, // Send to yourself for testing
      subject: 'Test Email from Edge Cases Server',
      html: `
        <h2>Test Email</h2>
        <p>If you receive this email, your email configuration is working correctly.</p>
        <p>Sent at: ${new Date().toISOString()}</p>
      `
    };

    const result = await transporter.sendMail(testEmail);
    console.log('✅ Test email sent:', result.messageId);
    
    res.json({ 
      success: true, 
      message: 'Test email sent successfully!',
      messageId: result.messageId
    });
  } catch (error) {
    console.error('❌ Test email failed:', error);
    res.status(500).json({ 
      error: 'Test email failed',
      details: error.message
    });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    env: {
      NODE_ENV: process.env.NODE_ENV,
      EMAIL_USER: process.env.EMAIL_USER ? 'configured' : 'missing',
      EMAIL_PASS: process.env.EMAIL_PASS ? 'configured' : 'missing'
    }
  });
});

// Environment check endpoint
app.get('/env-check', (req, res) => {
  const requiredVars = ['EMAIL_USER', 'EMAIL_PASS'];
  const missing = requiredVars.filter(varName => !process.env[varName]);
  
  res.json({
    status: missing.length === 0 ? 'OK' : 'Missing Variables',
    missing: missing,
    configured: requiredVars.filter(varName => process.env[varName])
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📧 Email user: ${process.env.EMAIL_USER ? 'configured' : '❌ MISSING'}`);
  console.log(`🔑 Email pass: ${process.env.EMAIL_PASS ? 'configured' : '❌ MISSING'}`);
});
