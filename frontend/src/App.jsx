import { useState } from 'react';
import axios from 'axios';
import './App.css';

function App() {
  const [formData, setFormData] = useState({ subject: '', body: '', recipients: '' });
  const [status, setStatus] = useState({ type: '', message: '' });
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setStatus({ type: 'loading', message: 'Sending emails...' });

    try {
      const res = await axios.post('https://my-bulk-email-app.onrender.com/api/send-bulk', formData);
      setStatus({ type: 'success', message: res.data.message });
      setFormData({ subject: '', body: '', recipients: '' });
    } catch (error) {
      setStatus({ type: 'error', message: 'Failed to send emails. Check console.' });
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="app-container">
      <div className="mailer-card">
        <div className="card-header">
          <h2>Bulk Mail Dashboard</h2>
          <p>Send emails to multiple recipients instantly</p>
        </div>

        <form onSubmit={handleSubmit} className="mailer-form">
          <div className="form-group">
            <label htmlFor="subject">Subject</label>
            <input
              id="subject"
              type="text"
              placeholder="e.g., Weekly Newsletter"
              value={formData.subject}
              onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="recipients">Recipients (Comma Separated)</label>
            <textarea
              id="recipients"
              rows="3"
              placeholder="user1@example.com, user2@example.com"
              value={formData.recipients}
              onChange={(e) => setFormData({ ...formData, recipients: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="body">Message Body</label>
            <textarea
              id="body"
              rows="6"
              placeholder="Write your email content here..."
              value={formData.body}
              onChange={(e) => setFormData({ ...formData, body: e.target.value })}
              required
            />
          </div>

          <button type="submit" className="submit-btn" disabled={isLoading}>
            {isLoading ? <span className="spinner"></span> : 'Send Emails'}
          </button>
        </form>

        {status.message && (
          <div className={`status-message ${status.type}`}>
            {status.message}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;