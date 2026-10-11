require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const nodemailer = require('nodemailer');
const { google } = require('googleapis');

// Import the Email model (Make sure you have created models/Email.js)
const Email = require('./models/Email');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB successfully connected'))
  .catch(err => console.error('MongoDB connection error:', err));

// Google OAuth2 Configuration
const OAuth2 = google.auth.OAuth2;
const oauth2Client = new OAuth2(
  process.env.CLIENT_ID,
  process.env.CLIENT_SECRET,
  "https://developers.google.com/oauthplayground"
);
oauth2Client.setCredentials({ refresh_token: process.env.REFRESH_TOKEN });

// Bulk Email POST Route
app.post('/api/send-bulk', async (req, res) => {
  const { subject, body, recipients } = req.body;
  
  // Convert comma-separated string to an array of clean email addresses
  const emailList = recipients.split(',').map(email => email.trim());

  try {
    // Generate a fresh access token using the refresh token
    const accessToken = await oauth2Client.getAccessToken();

    // Configure the Nodemailer transporter with Gmail API credentials
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        type: 'OAuth2',
        user: process.env.EMAIL_USER,
        clientId: process.env.CLIENT_ID,
        clientSecret: process.env.CLIENT_SECRET,
        refreshToken: process.env.REFRESH_TOKEN,
        accessToken: accessToken.token
      }
    });

    // Define the email options
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: emailList,
      subject: subject,
      text: body
    };

    // Send the email
    await transporter.sendMail(mailOptions);

    // Save success record to MongoDB
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
    
    // Save failure record to MongoDB
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

// Start the Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});