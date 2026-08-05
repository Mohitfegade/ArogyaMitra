import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState(1); // 1 = Phone, 2 = OTP
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const { signInWithOtp, verifyOtp } = useAuth();

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    // Simple validation for India numbers (starting with +91)
    let formattedPhone = phone.trim();
    if (!formattedPhone.startsWith('+')) {
      formattedPhone = '+91' + formattedPhone;
    }

    try {
      await signInWithOtp(formattedPhone);
      setStep(2);
    } catch (err) {
      setError(err.message || 'Failed to send OTP. Please check the number.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    let formattedPhone = phone.trim();
    if (!formattedPhone.startsWith('+')) {
      formattedPhone = '+91' + formattedPhone;
    }

    try {
      await verifyOtp(formattedPhone, otp);
      // AuthContext will handle the session state change and App.jsx will reroute automatically
    } catch (err) {
      setError(err.message || 'Invalid OTP. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="card">
      <h2>Welcome to ArogyaMitra</h2>
      <p>Log in with your phone number to get started.</p>
      
      {error && <div className="error-message">{error}</div>}

      {step === 1 ? (
        <form onSubmit={handleSendOtp}>
          <div className="form-group">
            <label htmlFor="phone">Phone Number</label>
            <input
              id="phone"
              type="tel"
              placeholder="e.g. 9876543210"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
              disabled={loading}
              className="large-input"
            />
          </div>
          <button type="submit" className="primary-btn" disabled={loading || !phone}>
            {loading ? 'Sending...' : 'Send OTP'}
          </button>
        </form>
      ) : (
        <form onSubmit={handleVerifyOtp}>
           <div className="form-group">
            <label htmlFor="otp">Enter OTP sent to {phone}</label>
            <input
              id="otp"
              type="text"
              placeholder="6-digit code"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              required
              disabled={loading}
              className="large-input"
            />
          </div>
          <button type="submit" className="primary-btn" disabled={loading || !otp}>
            {loading ? 'Verifying...' : 'Verify & Login'}
          </button>
          <button 
            type="button" 
            className="secondary-btn" 
            onClick={() => setStep(1)} 
            disabled={loading}
          >
            Change Phone Number
          </button>
        </form>
      )}
    </div>
  );
}
