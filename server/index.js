const express = require('express');
const cors = require('cors');
const multer = require('multer');
const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// SendGrid API endpoint
const SENDGRID_API_URL = 'https://api.sendgrid.com/v3/mail/send';

// Data file path for storing campaigns
const DATA_FILE = path.join(__dirname, 'data', 'campaigns.json');

// Ensure data directory exists
if (!fs.existsSync(path.join(__dirname, 'data'))) {
  fs.mkdirSync(path.join(__dirname, 'data'));
}

// Initialize data file if it doesn't exist
if (!fs.existsSync(DATA_FILE)) {
  fs.writeFileSync(DATA_FILE, JSON.stringify([]));
}

// Multer configuration for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir);
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // xlsx
      'application/vnd.ms-excel', // xls
      'text/csv', // csv
    ];
    if (allowedTypes.includes(file.mimetype) || file.originalname.match(/\.(xlsx|xls|csv)$/)) {
      cb(null, true);
    } else {
      cb(new Error('Only Excel and CSV files are allowed'));
    }
  },
});

// Middleware
app.use(cors());
app.use(express.json());

// Helper function to read campaigns from file
function readCampaigns() {
  try {
    const data = fs.readFileSync(DATA_FILE, 'utf8');
    return JSON.parse(data);
  } catch {
    return [];
  }
}

// Helper function to write campaigns to file
function writeCampaigns(campaigns) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(campaigns, null, 2));
}

// Helper function to send email via SendGrid API
async function sendEmailViaSendGrid(emailData) {
  const response = await fetch(SENDGRID_API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.SENDGRID_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(emailData),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    console.error('SendGrid API Error:', response.status, errorBody);
    throw new Error(`SendGrid API Error: ${response.status} - ${errorBody}`);
  }

  return response;
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

// ============ CAMPAIGN CRUD APIs ============

// GET all campaigns
app.get('/api/campaigns', (req, res) => {
  try {
    const campaigns = readCampaigns();
    res.json({
      success: true,
      data: campaigns,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch campaigns',
    });
  }
});

// GET single campaign by ID
app.get('/api/campaigns/:id', (req, res) => {
  try {
    const campaigns = readCampaigns();
    const campaign = campaigns.find((c) => c.id === req.params.id);
    
    if (!campaign) {
      return res.status(404).json({
        success: false,
        error: 'Campaign not found',
      });
    }
    
    res.json({
      success: true,
      data: campaign,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch campaign',
    });
  }
});

// POST create new campaign
app.post('/api/campaigns', (req, res) => {
  try {
    const { name, subject, content, emails, status } = req.body;
    
    if (!name) {
      return res.status(400).json({
        success: false,
        error: 'Campaign name is required',
      });
    }
    
    const campaigns = readCampaigns();
    
    const newCampaign = {
      id: Date.now().toString(),
      name,
      subject: subject || '',
      content: content || '',
      emails: emails || [],
      status: status || 'draft',
      recipients: emails?.length || 0,
      openRate: 0,
      clickRate: 0,
      createdAt: new Date().toISOString().split('T')[0],
      sentAt: null,
    };
    
    campaigns.push(newCampaign);
    writeCampaigns(campaigns);
    
    res.status(201).json({
      success: true,
      message: 'Campaign created successfully',
      data: newCampaign,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to create campaign',
    });
  }
});

// PUT update campaign
app.put('/api/campaigns/:id', (req, res) => {
  try {
    const campaigns = readCampaigns();
    const index = campaigns.findIndex((c) => c.id === req.params.id);
    
    if (index === -1) {
      return res.status(404).json({
        success: false,
        error: 'Campaign not found',
      });
    }
    
    const { name, subject, content, emails, status } = req.body;
    
    campaigns[index] = {
      ...campaigns[index],
      name: name ?? campaigns[index].name,
      subject: subject ?? campaigns[index].subject,
      content: content ?? campaigns[index].content,
      emails: emails ?? campaigns[index].emails,
      status: status ?? campaigns[index].status,
      recipients: emails?.length ?? campaigns[index].recipients,
      updatedAt: new Date().toISOString().split('T')[0],
    };
    
    writeCampaigns(campaigns);
    
    res.json({
      success: true,
      message: 'Campaign updated successfully',
      data: campaigns[index],
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to update campaign',
    });
  }
});

// DELETE campaign
app.delete('/api/campaigns/:id', (req, res) => {
  try {
    const campaigns = readCampaigns();
    const index = campaigns.findIndex((c) => c.id === req.params.id);
    
    if (index === -1) {
      return res.status(404).json({
        success: false,
        error: 'Campaign not found',
      });
    }
    
    const deleted = campaigns.splice(index, 1)[0];
    writeCampaigns(campaigns);
    
    res.json({
      success: true,
      message: 'Campaign deleted successfully',
      data: deleted,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to delete campaign',
    });
  }
});

// ============ FILE UPLOAD API ============

// POST upload email sheet (CSV/Excel)
app.post('/api/upload-emails', upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No file uploaded',
      });
    }
    
    const filePath = req.file.path;
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });
    
    // Extract emails from the sheet
    const emails = [];
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    data.forEach((row) => {
      row.forEach((cell) => {
        if (typeof cell === 'string' && emailRegex.test(cell.trim())) {
          emails.push(cell.trim().toLowerCase());
        }
      });
    });
    
    // Remove duplicates
    const uniqueEmails = [...new Set(emails)];
    
    // Delete the uploaded file
    fs.unlinkSync(filePath);
    
    if (uniqueEmails.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No valid emails found in the file',
      });
    }
    
    res.json({
      success: true,
      message: `${uniqueEmails.length} emails extracted successfully`,
      data: {
        emails: uniqueEmails,
        total: uniqueEmails.length,
      },
    });
  } catch (error) {
    console.error('File upload error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process file',
    });
  }
});

// ============ EMAIL SENDING APIs ============

// Send single email
app.post('/api/send-email', async (req, res) => {
  try {
    const { to, subject, content, html } = req.body;

    if (!to || !subject || (!content && !html)) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: to, subject, and content/html are required',
      });
    }

    const emailData = {
      personalizations: [
        {
          to: [{ email: to }],
        },
      ],
      from: { email: process.env.SENDER_EMAIL },
      subject: subject,
      content: [
        {
          type: 'text/plain',
          value: content,
        },
        {
          type: 'text/html',
          value: html || content,
        },
      ],
    };

    await sendEmailViaSendGrid(emailData);

    res.json({
      success: true,
      message: 'Email sent successfully',
    });
  } catch (error) {
    console.error('SendGrid Error:', error);

    res.status(500).json({
      success: false,
      error: error.message || 'Failed to send email',
    });
  }
});

// Send campaign (multiple emails)
app.post('/api/send-campaign', async (req, res) => {
  try {
    const { emails, subject, content, html, campaignName, campaignId } = req.body;

    if (!emails || !Array.isArray(emails) || emails.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Missing or invalid emails array',
      });
    }

    if (!subject || (!content && !html)) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: subject and content/html are required',
      });
    }

    const htmlContent = html || `<div style="font-family: Arial, sans-serif; padding: 20px;">
      <h2>${subject}</h2>
      <p>${content}</p>
      <hr>
      <p style="color: #666; font-size: 12px;">This email was sent as part of the "${campaignName}" campaign.</p>
    </div>`;

    const results = await Promise.allSettled(
      emails.map(async (email) => {
        const emailData = {
          personalizations: [
            {
              to: [{ email: email }],
            },
          ],
          from: { email: process.env.SENDER_EMAIL },
          subject: subject,
          content: [
            {
              type: 'text/plain',
              value: content,
            },
            {
              type: 'text/html',
              value: htmlContent,
            },
          ],
        };

        return sendEmailViaSendGrid(emailData);
      })
    );

    const successful = results.filter((r) => r.status === 'fulfilled').length;
    const failed = results.filter((r) => r.status === 'rejected').length;

    const errors = [];
    results.forEach((result, index) => {
      if (result.status === 'rejected') {
        console.error(`Failed to send to ${emails[index]}:`, result.reason);
        errors.push({
          email: emails[index],
          error: result.reason?.message || 'Unknown error',
        });
      }
    });

    // Update campaign status if campaignId provided
    if (campaignId) {
      const campaigns = readCampaigns();
      const index = campaigns.findIndex((c) => c.id === campaignId);
      if (index !== -1) {
        campaigns[index].status = 'sent';
        campaigns[index].sentAt = new Date().toISOString().split('T')[0];
        campaigns[index].recipients = emails.length;
        writeCampaigns(campaigns);
      }
    }

    res.json({
      success: successful > 0,
      message: `Campaign sent! ${successful} emails delivered, ${failed} failed.`,
      stats: {
        total: emails.length,
        successful,
        failed,
      },
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error('SendGrid Campaign Error:', error);

    res.status(500).json({
      success: false,
      error: error.message || 'Failed to send campaign',
    });
  }
});

// Get campaign stats
app.get('/api/campaign-stats/:campaignId', async (req, res) => {
  const campaigns = readCampaigns();
  const campaign = campaigns.find((c) => c.id === req.params.campaignId);
  
  res.json({
    success: true,
    stats: {
      delivered: campaign?.recipients || 0,
      opened: 0,
      clicked: 0,
      bounced: 0,
      unsubscribed: 0,
    },
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`SendGrid API URL: ${SENDGRID_API_URL}`);
  console.log(`SendGrid API configured: ${process.env.SENDGRID_API_KEY ? 'Yes' : 'No'}`);
});
