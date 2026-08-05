// Helpers for Indian mobile numbers used by the phone-OTP login flow.

// Keep only digits, dropping spaces, dashes and brackets users often paste in.
export function digitsOnly(value) {
  return (value || '').replace(/\D/g, '');
}

// Turn anything the user typed into an E.164 number Supabase accepts.
// Accepts: 9876543210, 09876543210, 919876543210, +91 98765 43210
export function toE164India(value) {
  let digits = digitsOnly(value);

  if (digits.length === 11 && digits.startsWith('0')) {
    digits = digits.slice(1);
  }
  if (digits.length === 12 && digits.startsWith('91')) {
    digits = digits.slice(2);
  }

  return `+91${digits}`;
}

// Indian mobile numbers are 10 digits and start with 6-9.
export function isValidIndianMobile(value) {
  const local = toE164India(value).slice(3);
  return /^[6-9]\d{9}$/.test(local);
}

// Pretty-print for display: +91 98765 43210
export function formatForDisplay(value) {
  const local = toE164India(value).slice(3);
  if (local.length !== 10) return value;
  return `+91 ${local.slice(0, 5)} ${local.slice(5)}`;
}

// Supabase auth errors are terse and sometimes leak configuration details.
// Map them to something a first-time user can act on.
export function describeOtpError(error) {
  const code = error?.code || error?.error_code;
  const message = error?.message || '';

  if (code === 'phone_provider_disabled' || /unsupported phone provider/i.test(message)) {
    return 'SMS login is not enabled for this app yet. An SMS provider must be connected before OTP codes can be delivered.';
  }
  if (code === 'over_sms_send_rate_limit' || /rate limit/i.test(message)) {
    return 'Too many OTP requests. Please wait a minute before trying again.';
  }
  if (code === 'otp_expired' || /expired/i.test(message)) {
    return 'That code has expired. Request a new OTP.';
  }
  if (code === 'invalid_otp' || /invalid/i.test(message)) {
    return 'That code is not correct. Please check the 6 digits and try again.';
  }
  if (/invalid phone/i.test(message)) {
    return 'That phone number does not look valid. Enter a 10-digit mobile number.';
  }

  return message || 'Something went wrong. Please try again.';
}
