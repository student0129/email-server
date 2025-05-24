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
app.use(express.static('public')); // If you want to serve the HTML from here too

// Email transporter setup for Proton Mail
const transporter = nodemailer.createTransporter({
  host: 'smtp.protonmail.ch',
  port: 587,
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER, // Your Proton email address
    pass: process.env.EMAIL_PASS  // Your Proton app password or Bridge password
  },
  tls: {
    ciphers: 'SSLv3'
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

    // CREATE CALENDAR EVENT (.ICS FILE) - ADD THIS HERE
    const calendar = ical({
      name: 'Edge Cases Soirée',
      description: 'A soirée for those working seriously and semi-seriously on artificial intelligence'
    });

    calendar.createEvent({
      start: new Date('2025-06-25T18:00:00Z'), // Update with actual date
      end: new Date('2025-06-25T21:00:00Z'),   // Update with actual date
      summary: 'Edge Cases Soirée',
      description: 'A soirée for those working seriously and semi-seriously on artificial intelligence...',
      location: '[VENUE TBD]',
      organizer: {
        name: 'Promontory AI',
        email: 'edgecases@promontoryai.com'
      },
      attendees: [{
        name: name,
        email: email,
        status: 'TENTATIVE'
      }]
    });

    const icsContent = calendar.toString();
    // END OF CALENDAR CREATION

    // Email to admin (edgecases@promontoryai.com)
    const adminEmailOptions = {
      from: process.env.EMAIL_USER,
      to: 'edgecases@promontoryai.com',
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
        <p><strong>Date:</strong> Wednesday, June 25th, 2025</p>
        <p><strong>Time:</strong> 6:00 PM - 9:00 PM</p>
        <p><strong>Location:</strong> [VENUE TBD]</p>
        
        <p><strong>Submitted at:</strong> ${new Date().toLocaleString()}</p>
      `
    };

    // Confirmation email to attendee
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
        <p>📅 <strong>Date:</strong> Wednesday, June 25th, 2025</p>
        <p>⏰ <strong>Time:</strong> 6:00 PM - 9:00 PM</p>
        <p>📍 <strong>Location:</strong> [VENUE TBD]</p>
        
        <p>This gathering is for those who break AI, pretend to understand it, worry about what it will do, launch with fingers crossed, and clean up after the demo. Come ready for off-record conversations about failures, foresight, and unfinished thoughts—over drinks.</p>
        
        <p><strong>Calendar:</strong> Please find the calendar invite attached (.ics file) that works with any calendar system.</p>
        
        <p>Looking forward to exploring the edge cases with you!</p>
        
        <p>Best,<br>
        The Edge Cases Team @ Promontory AI<br>
        edgecases@promontoryai.com</p>
      `,
      attachments: [
        {
          filename: 'Edge-Cases-Soiree.ics',
          content: icsContent,
          contentType: 'text/calendar; charset=utf-8; method=REQUEST'
        }
      ]
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
