require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const nodemailer = require('nodemailer');
const { google } = require('googleapis');

// Import the Email model (Make sure you have created models/Email.js)
const Email = require('./models/Email');

const app = express();

app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB successfully connected'))
  .catch(err => console.error('MongoDB connection error:', err));

const OAuth2 = google.auth.OAuth2;
const oauth2Client = new OAuth2(
  process.env.CLIENT_ID,
  process.env.CLIENT_SECRET,
  "https://developers.google.com/oauthplayground"
);
oauth2Client.setCredentials({ refresh_token: process.env.REFRESH_TOKEN });

app.post('/api/send-bulk', async (req, res) => {
  const { subject, body, recipients } = req.body;
  
  const emailList = recipients.split(',').map(email => email.trim());

  try {
    const accessToken = await oauth2Client.getAccessToken();

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

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: emailList,
      subject: subject,
      text: body
    };

    await transporter.sendMail(mailOptions);

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