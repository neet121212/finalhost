const express = require('express');
const router = express.Router();
const multer = require('multer');
const nodemailer = require('nodemailer');

// Set up Multer for memory storage (no files saved to disk)
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

router.post('/email-zip', upload.single('zipFile'), async (req, res) => {
    try {
        const { email, candidateName, summaryData } = req.body;
        const zipFile = req.file;

        console.log(`Processing ZIP for: ${candidateName}, Sending to: ${email}`);

        if (!zipFile) {
            console.error('No file in request');
            return res.status(400).json({ error: 'No ZIP file uploaded' });
        }

        if (!email || email === 'undefined') {
            console.error('Email is missing or undefined');
            return res.status(400).json({ error: 'Receiver email is missing. Are you logged in?' });
        }

        // Check if user has updated .env
        if (!process.env.EMAIL_USER || process.env.EMAIL_USER.includes('your-email')) {
            console.error('EMAIL_USER is not configured in .env');
            return res.status(500).json({ error: 'System Email not configured. Please update the backend .env file with your Gmail and App Password.' });
        }

        // Parse summary data if available to format the email body
        let emailHtml = `<div style="font-family: Arial, sans-serif; color: #333; max-width: 800px; margin: 0 auto; background: #f9fafb; padding: 20px; border-radius: 8px;">`;
        emailHtml += `<h2 style="color: #0284c7; border-bottom: 2px solid #e0f2fe; padding-bottom: 10px;">Application Summary for ${candidateName || 'Candidate'}</h2>`;
        
        if (summaryData) {
            try {
                const data = JSON.parse(summaryData);
                
                // Personal Profile
                emailHtml += `<div style="background: #ffffff; padding: 20px; border-radius: 8px; margin-bottom: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">`;
                emailHtml += `<h3 style="color: #0f172a; margin-top: 0;">Personal Profile</h3>`;
                emailHtml += `<table style="width: 100%; border-collapse: collapse;">`;
                emailHtml += `<tr><td style="padding: 6px 0; color: #64748b; width: 140px;"><strong>Full Name:</strong></td><td style="font-weight: 500;">${data.firstName || ''} ${data.middleName || ''} ${data.lastName || ''}</td></tr>`;
                emailHtml += `<tr><td style="padding: 6px 0; color: #64748b;"><strong>Email:</strong></td><td style="font-weight: 500;">${data.email || 'N/A'}</td></tr>`;
                emailHtml += `<tr><td style="padding: 6px 0; color: #64748b;"><strong>Phone:</strong></td><td style="font-weight: 500;">${data.phone || 'N/A'}</td></tr>`;
                emailHtml += `<tr><td style="padding: 6px 0; color: #64748b;"><strong>DOB:</strong></td><td style="font-weight: 500;">${data.dob ? new Date(data.dob).toLocaleDateString() : 'N/A'}</td></tr>`;
                emailHtml += `<tr><td style="padding: 6px 0; color: #64748b;"><strong>Gender:</strong></td><td style="font-weight: 500;">${data.gender || 'N/A'}</td></tr>`;
                emailHtml += `<tr><td style="padding: 6px 0; color: #64748b;"><strong>Passport No:</strong></td><td style="font-weight: 500;">${data.passportNo || 'N/A'}</td></tr>`;
                emailHtml += `<tr><td style="padding: 6px 0; color: #64748b;"><strong>Address:</strong></td><td style="font-weight: 500;">${data.address || 'N/A'}</td></tr>`;
                emailHtml += `</table></div>`;

                // Academic Information
                emailHtml += `<div style="background: #ffffff; padding: 20px; border-radius: 8px; margin-bottom: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">`;
                emailHtml += `<h3 style="color: #0f172a; margin-top: 0;">Academic Qualification</h3>`;
                emailHtml += `<p style="margin: 0 0 15px 0;"><strong>Highest Level:</strong> ${data.highestLevelOfEducation || 'N/A'}</p>`;
                
                if (data.educationHistory && data.educationHistory.length > 0) {
                    data.educationHistory.forEach(edu => {
                        emailHtml += `<div style="background: #f1f5f9; padding: 12px; border-radius: 6px; margin-bottom: 10px;">`;
                        emailHtml += `<div style="font-weight: bold; color: #334155;">${edu.level || 'Unknown Level'}</div>`;
                        emailHtml += `<div style="color: #475569;">${edu.programName || 'N/A'}</div>`;
                        emailHtml += `<div style="color: #64748b; font-size: 14px;">${edu.universityName || 'N/A'}</div>`;
                        emailHtml += `</div>`;
                    });
                } else {
                    emailHtml += `<p style="color: #64748b; font-style: italic;">No academic history provided.</p>`;
                }
                emailHtml += `</div>`;

                // Work Experience
                emailHtml += `<div style="background: #ffffff; padding: 20px; border-radius: 8px; margin-bottom: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">`;
                emailHtml += `<h3 style="color: #0f172a; margin-top: 0;">Work Experience</h3>`;
                if (data.workExperience && data.workExperience.length > 0) {
                    data.workExperience.forEach(work => {
                        emailHtml += `<div style="background: #f1f5f9; padding: 12px; border-radius: 6px; margin-bottom: 10px;">`;
                        emailHtml += `<div style="font-weight: bold; color: #334155;">${work.position || 'Role'}</div>`;
                        emailHtml += `<div style="color: #475569;">${work.organisationName || 'N/A'}</div>`;
                        emailHtml += `</div>`;
                    });
                } else {
                    emailHtml += `<p style="color: #64748b; font-style: italic;">No work experience provided.</p>`;
                }
                emailHtml += `</div>`;

            } catch (jsonErr) {
                console.error("Failed to parse summaryData", jsonErr);
                emailHtml += `<p>Error parsing advanced candidate data.</p>`;
            }
        } else {
            emailHtml += `<p>Attached are the verified documents for Candidate: <strong>${candidateName || 'Unknown'}</strong>.</p>`;
        }
        
        emailHtml += `<div style="background: #ecfdf5; border-left: 4px solid #10b981; padding: 15px; border-radius: 4px; color: #064e3b; margin-top: 20px;">`;
        emailHtml += `<strong>Document Bundle Attached:</strong> The verified files have been zipped and are securely attached to this email.`;
        emailHtml += `</div>`;

        emailHtml += `<p style="color: #94a3b8; font-size: 12px; margin-top: 30px; border-top: 1px solid #e2e8f0; padding-top: 10px;">This is an automated administrative email from the Partner Portal. Do not reply.</p>`;
        emailHtml += `</div>`;

        // Configure Nodemailer
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: email, 
            subject: `documents of ${candidateName || 'Candidate'}`,
            html: emailHtml,
            attachments: [
                {
                    filename: zipFile.originalname || 'documents.zip',
                    content: zipFile.buffer
                }
            ]
        };

        await transporter.sendMail(mailOptions);
        console.log('Email sent successfully!');
        res.status(200).json({ message: 'Email sent successfully with ZIP attachment!' });

    } catch (err) {
        console.error('Detailed Email sending error:', err);
        res.status(500).json({ error: `Failed to send email: ${err.message}` });
    }
});

module.exports = router;
