import React, { useEffect, useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  digitsOnly,
  toE164India,
  isValidIndianMobile,
  formatForDisplay,
  describeOtpError,
  DEMO_OTP,
} from '../utils/phone';

const RESEND_SECONDS = 30;

export default function Login() {
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState(1); // 1 = phone, 2 = OTP
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState(null);
  const [cooldown, setCooldown] = useState(0);

  const otpInputRef = useRef(null);
  const { signInWithOtp, verifyOtp } = useAuth();

  const phoneIsValid = isValidIndianMobile(phone);
  const otpIsValid = otp.length === 6;

  // Countdown that gates the "Resend OTP" button.
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  // Move focus to the code field as soon as we ask for it.
  useEffect(() => {
    if (step === 2) otpInputRef.current?.focus();
  }, [step]);

  const sendOtp = async ({ isResend } = {}) => {
    setLoading(true);
    setError(null);
    setNotice(null);

    try {
      await signInWithOtp(toE164India(phone));
      setStep(2);
      setCooldown(RESEND_SECONDS);
      setNotice(`Demo mode: enter code ${DEMO_OTP} for ${formatForDisplay(phone)}.`);
      if (isResend) setOtp('');
    } catch (err) {
      setError(describeOtpError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleSendOtp = (e) => {
    e.preventDefault();
    if (!phoneIsValid) {
      setError('Enter a valid 10-digit Indian mobile number.');
      return;
    }
    sendOtp();
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setNotice(null);

    try {
      await verifyOtp(toE164India(phone), otp);
      // AuthContext picks up the session and App.jsx reroutes automatically.
    } catch (err) {
      setError(describeOtpError(err));
      setLoading(false);
    }
  };

  const handleChangeNumber = () => {
    setStep(1);
    setOtp('');
    setError(null);
    setNotice(null);
    setCooldown(0);
  };

  return (
    <div className="auth-card">
        <div className="auth-logo">
          <span className="auth-logo__icon" aria-hidden="true">
            &#127793;
          </span>
          <span className="auth-logo__name">ArogyaMitra</span>
          <p className="auth-logo__tagline">
            Your guide to government health schemes
          </p>
        </div>

        {error && (
          <div className="error-message" role="alert">
            {error}
          </div>
        )}
        {notice && !error && (
          <div className="notice-message" role="status">
            {notice}
          </div>
        )}

        {step === 1 ? (
          <form onSubmit={handleSendOtp}>
            <div className="form-group">
              <label htmlFor="phone">Mobile number</label>
              <div className="phone-field">
                <span className="phone-field__prefix" aria-hidden="true">
                  +91
                </span>
                <input
                  id="phone"
                  type="tel"
                  inputMode="numeric"
                  autoComplete="tel"
                  maxLength={10}
                  placeholder="9876543210"
                  value={phone}
                  onChange={(e) => {
                    setPhone(digitsOnly(e.target.value).slice(0, 10));
                    setError(null);
                  }}
                  required
                  disabled={loading}
                  className="form-input large-input"
                  aria-describedby="phone-help"
                />
              </div>
              <p id="phone-help" className="helper-text">
                Demo mode &mdash; no real SMS is sent. Any valid mobile number works and
                the code is always <strong>{DEMO_OTP}</strong>.
              </p>
            </div>
            <button
              type="submit"
              className="btn btn--primary"
              disabled={loading || !phoneIsValid}
            >
              {loading ? 'Sending...' : 'Send OTP'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp}>
            <div className="form-group">
              <label htmlFor="otp">Enter the code for {formatForDisplay(phone)}</label>
              <input
                id="otp"
                ref={otpInputRef}
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                placeholder="6-digit code"
                value={otp}
                onChange={(e) => {
                  setOtp(digitsOnly(e.target.value).slice(0, 6));
                  setError(null);
                }}
                required
                disabled={loading}
                className="form-input large-input otp-input"
              />
            </div>
            <button
              type="submit"
              className="btn btn--primary"
              disabled={loading || !otpIsValid}
            >
              {loading ? 'Verifying...' : 'Verify & Login'}
            </button>
            <div className="auth-actions">
              <button
                type="button"
                className="btn btn--ghost"
                onClick={() => sendOtp({ isResend: true })}
                disabled={loading || cooldown > 0}
              >
                {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend OTP'}
              </button>
              <button
                type="button"
                className="btn btn--ghost"
                onClick={handleChangeNumber}
                disabled={loading}
              >
                Change number
              </button>
            </div>
        </form>
      )}
    </div>
  );
}
