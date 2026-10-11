const mongoose = require('mongoose');

const EmailSchema = new mongoose.Schema({
  subject: String,
  body: String,
  recipients: [String],
  status: { type: String, enum: ['Success', 'Failed'] },
  sentAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Email', EmailSchema);