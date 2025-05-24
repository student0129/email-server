// server.js - Deploy this to Render
const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public')); // If you want to serve the HTML from here too

// Email transporter setup (using Gmail as example)
const transporter = nodemailer.createTransporter({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER, // Your email
    pass: process.env.EMAIL_PASS  // Your app password
  }
});

// RSVP endpoint
app.post('/rsvp', async (req, res) => {
  try {
    const { name, email, company, role, edge } = req.body;
    
    // Validate required fields
    if (!name || !email || !role) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Email to admin (ask@promontoryai.com)
    const adminEmailOptions = {
      from: process.env.EMAIL_USER,
      to: 'ask@promontoryai.com',
      subject: `Edge Cases Soirée RSVP - ${name}`,
      html: `
        <h2>New RSVP for Edge Cases Soirée</h2>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Company:</strong> ${company || 'Not provided'}</p>
        <p><strong>Role:</strong> ${role}</p>
        <p><strong>Edge:</strong> ${edge || 'Not provided'}</p>
        
        <h3>Event Details:</h3>
        <p><strong>Event:</strong> Edge Cases Soirée - A soirée for those working seriously and semi-seriously on artificial intelligence</p>
        <p><strong>Date:</strong> [DATE TBD]</p>
        <p><strong>Time:</strong> 6:00 PM - 9:00 PM</p>
        <p><strong>Location:</strong> [VENUE TBD]</p>
        
        <p><strong>Submitted at:</strong> ${new Date().toLocaleString()}</p>
      `
    };

    // Confirmation email to attendee
    const calendarLink = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent('Edge Cases Soirée - AI Gathering')}&dates=20250625T180000Z/20250625T210000Z&details=${encodeURIComponent('A soirée for those working seriously and semi-seriously on artificial intelligence. For those who break AI, pretend to understand it, worry about what it will do, launch with fingers crossed, and clean up after the demo. Conversations about failures, foresight, and unfinished thoughts—over drinks.')}&location=${encodeURIComponent('[VENUE TBD]')}`;

    const confirmationEmailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Welcome to Edge Cases Soirée - Your AI Gathering Awaits',
      html: `
        <h2>Welcome to Edge Cases Soirée!</h2>
        <p>Hi ${name},</p>
        
        <p>We're excited you'll be joining us for our soirée dedicated to those working seriously and semi-seriously on artificial intelligence.</p>
        
        <p><strong>You're confirmed as:</strong> ${role}</p>
        
        <h3>Event Details:</h3>
        <p>📅 <strong>Date:</strong> [DATE TBD]</p>
        <p>⏰ <strong>Time:</strong> 6:00 PM - 9:00 PM</p>
        <p>📍 <strong>Location:</strong> [VENUE TBD]</p>
        
        <p>This gathering is for those who break AI, pretend to understand it, worry about what it will do, launch with fingers crossed, and clean up after the demo. Come ready for off-record conversations about failures, foresight, and unfinished thoughts—over drinks.</p>
        
        <p><a href="${calendarLink}" style="background: #333; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Add to Calendar</a></p>
        
        <p>Looking forward to exploring the edge cases with you!</p>
        
        <p>Best,<br>
        The Promontory AI Team<br>
        ask@promontoryai.com</p>
      `
    };

    // Send both emails
    await transporter.sendMail(adminEmailOptions);
    await transporter.sendMail(confirmationEmailOptions);

    res.json({ 
      success: true, 
      message: 'RSVP submitted successfully! Check your email for confirmation.' 
    });

  } catch (error) {
    console.error('Error sending emails:', error);
    res.status(500).json({ 
      error: 'Failed to submit RSVP. Please try again.' 
    });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
