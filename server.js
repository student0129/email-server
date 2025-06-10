const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Rate limiting - prevent spam
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // limit each IP to 5 requests per windowMs
    message: 'Too many requests from this IP, please try again later.'
});

app.use('/contact', limiter);

// Enhanced email transporter setup for Proton Mail
const transporter = nodemailer.createTransport({
  host: 'smtp.protonmail.ch', // Updated host
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

// Verify email configuration on startup
transporter.verify((error, success) => {
    if (error) {
        console.log('❌ Email configuration error:', error);
    } else {
        console.log('✅ Email server is ready to send messages');
    }
});

// Health check endpoint
app.get('/', (req, res) => {
    res.json({ 
        status: 'Start Smart Contact Server is running',
        timestamp: new Date().toISOString()
    });
});

// Contact form endpoint
app.post('/email', async (req, res) => {
    console.log('📧 Contact request received:', req.body);
    
    try {
        const { 
            firstName, 
            lastName, 
            email, 
            phone, 
            company, 
            role, 
            message, 
            ad_source, 
            referrer_url, 
            timestamp 
        } = req.body;

        // Validation
        const requiredFields = { firstName, lastName, email, company, message };
        const missingFields = Object.entries(requiredFields)
            .filter(([key, value]) => !value || value.trim() === '')
            .map(([key]) => key);

        if (missingFields.length > 0) {
            console.log('❌ Missing required fields:', missingFields);
            return res.status(400).json({
                success: false,
                error: `Missing required fields: ${missingFields.join(', ')}`
            });
        }

        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            console.log('❌ Invalid email format:', email);
            return res.status(400).json({
                success: false,
                error: 'Invalid email format'
            });
        }

        // Prepare email content
        const fullName = `${firstName} ${lastName}`.trim();
        const adSourceText = ad_source && ad_source !== 'direct' 
            ? `LinkedIn Ad: ${ad_source}` 
            : 'Direct visit';

        const emailSubject = `New Start Smart Inquiry - ${fullName}`;
        
        const emailHtml = `
            <div style="font-family: 'IBM Plex Sans', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 30px;">
                    <h1 style="color: #333; margin: 0; font-weight: 200;">New Start Smart Inquiry</h1>
                    <p style="color: #666; margin: 5px 0 0 0; font-size: 14px;">${new Date().toLocaleString()}</p>
                </div>
                
                <div style="background: #f8f9fa; padding: 25px; border-radius: 8px; margin-bottom: 25px;">
                    <h2 style="color: #333; margin: 0 0 20px 0; font-size: 18px; font-weight: 400;">Contact Information</h2>
                    
                    <div style="margin-bottom: 15px;">
                        <strong style="color: #555; display: inline-block; width: 120px;">Name:</strong>
                        <span style="color: #333;">${fullName}</span>
                    </div>
                    
                    <div style="margin-bottom: 15px;">
                        <strong style="color: #555; display: inline-block; width: 120px;">Email:</strong>
                        <a href="mailto:${email}" style="color: #0066cc; text-decoration: none;">${email}</a>
                    </div>
                    
                    ${phone ? `
                    <div style="margin-bottom: 15px;">
                        <strong style="color: #555; display: inline-block; width: 120px;">Phone:</strong>
                        <a href="tel:${phone}" style="color: #0066cc; text-decoration: none;">${phone}</a>
                    </div>` : ''}
                    
                    <div style="margin-bottom: 15px;">
                        <strong style="color: #555; display: inline-block; width: 120px;">Company:</strong>
                        <span style="color: #333;">${company}</span>
                    </div>
                    
                    ${role ? `
                    <div style="margin-bottom: 15px;">
                        <strong style="color: #555; display: inline-block; width: 120px;">Role:</strong>
                        <span style="color: #333;">${role}</span>
                    </div>` : ''}
                </div>
                
                <div style="background: #fff; border: 1px solid #e1e5e9; padding: 25px; border-radius: 8px; margin-bottom: 25px;">
                    <h2 style="color: #333; margin: 0 0 15px 0; font-size: 18px; font-weight: 400;">Message</h2>
                    <p style="color: #333; line-height: 1.6; margin: 0; white-space: pre-wrap;">${message}</p>
                </div>
                
                <div style="background: #f1f3f4; padding: 20px; border-radius: 8px; font-size: 14px;">
                    <h3 style="color: #555; margin: 0 0 15px 0; font-size: 16px; font-weight: 400;">Tracking Information</h3>
                    
                    <div style="margin-bottom: 10px;">
                        <strong style="color: #666;">Source:</strong> 
                        <span style="color: #333;">${adSourceText}</span>
                    </div>
                    
                    ${referrer_url ? `
                    <div style="margin-bottom: 10px;">
                        <strong style="color: #666;">Referrer URL:</strong> 
                        <a href="${referrer_url}" style="color: #0066cc; text-decoration: none; font-size: 12px;">${referrer_url}</a>
                    </div>` : ''}
                    
                    <div style="margin-bottom: 10px;">
                        <strong style="color: #666;">Submitted:</strong> 
                        <span style="color: #333;">${timestamp ? new Date(timestamp).toLocaleString() : 'Unknown'}</span>
                    </div>
                </div>
                
                <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e1e5e9; text-align: center;">
                    <p style="color: #888; font-size: 12px; margin: 0;">
                        This inquiry was submitted through the Start Smart landing page at promontoryai.com
                    </p>
                </div>
            </div>
        `;

        // Send email
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: 'ask@promontoryai.com',
            subject: emailSubject,
            html: emailHtml,
            replyTo: email
        };

        await transporter.sendMail(mailOptions);
        
        console.log('✅ Contact email sent successfully to ask@promontoryai.com');
        console.log(`   Name: ${fullName}`);
        console.log(`   Email: ${email}`);
        console.log(`   Company: ${company}`);
        console.log(`   Source: ${adSourceText}`);

        res.json({
            success: true,
            message: 'Contact form submitted successfully'
        });

    } catch (error) {
        console.error('❌ Error processing contact form:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        error: 'Endpoint not found'
    });
});

// Error handling middleware
app.use((error, req, res, next) => {
    console.error('❌ Server error:', error);
    res.status(500).json({
        success: false,
        error: 'Internal server error'
    });
});

app.listen(PORT, () => {
    console.log(`🚀 Start Smart Contact Server running on port ${PORT}`);
    console.log(`📧 Contact endpoint: POST /email`);
    console.log(`🔍 Health check: GET /`);
});
