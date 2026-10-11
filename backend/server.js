require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const { google } = require('googleapis');

// Import the Email model
const Email = require('./models/Email');

const app = express();

app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB successfully connected'))
  .catch(err => console.error('MongoDB connection error:', err));

// Set up Google OAuth2 Client
const OAuth2 = google.auth.OAuth2;
const oauth2Client = new OAuth2(
  process.env.CLIENT_ID,
  process.env.CLIENT_SECRET,
  "https://developers.google.com/oauthplayground"
);
oauth2Client.setCredentials({ refresh_token: process.env.REFRESH_TOKEN });

// Initialize Gmail API
const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

app.post('/api/send-bulk', async (req, res) => {
  const { subject, body, recipients } = req.body;
  
  const emailList = recipients.split(',').map(email => email.trim());

  try {
    // Construct the raw MIME email message
    const recipientString = emailList.join(', ');
    const utf8Subject = `=?utf-8?B?${Buffer.from(subject).toString('base64')}?=`;
    
    const messageParts = [
      `From: ${process.env.EMAIL_USER}`,
      `To: ${recipientString}`,
      `Content-Type: text/html; charset=utf-8`,
      `MIME-Version: 1.0`,
      `Subject: ${utf8Subject}`,
      '',
      body
    ];
    
    const message = messageParts.join('\n');
    
    // Encode the message to base64url format required by the Gmail API
    const encodedMessage = Buffer.from(message)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    // Send the email over HTTP (Bypasses Render's SMTP block)
    await gmail.users.messages.send({
      userId: 'me',
      requestBody: {
        raw: encodedMessage,
      },
    });

    const newEmail = new Email({ 
      subject, 
      body, 
      recipients: emailList, 
      status: 'Success' 
    });
    await newEmail.save();

    res.status(200).json({ message: 'Bulk emails sent successfully!' });
    
  } catch (error) {
    console.error('Error sending email:', error);
 
    const failedEmail = new Email({ 
      subject, 
      body, 
      recipients: emailList, 
      status: 'Failed' 
    });
    await failedEmail.save();
    
    res.status(500).json({ error: 'Failed to send emails. Check server logs.' });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});