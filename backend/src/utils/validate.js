const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const SPECIAL_CHAR_RE = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/;

const validateEmail = (email) => {
  if (!EMAIL_RE.test(email)) return 'Please enter a valid email address';
  return null;
};

const validatePassword = (password) => {
  if (password.length < 8) return 'Password must be at least 8 characters';
  if (!SPECIAL_CHAR_RE.test(password)) return 'Password must contain at least one special character';
  return null;
};

const validatePhone = (phone) => {
  if (!/^\d{10}$/.test(phone.trim())) return 'Phone number must be 10 digits';
  return null;
};

const validatePincode = (pincode) => {
  if (!/^\d{6}$/.test(pincode.toString().trim())) return 'Pincode must be 6 digits';
  return null;
};

// Returns parsed integer or null for non-numeric strings (prevents NaN reaching Prisma)
const parseIntParam = (val) => {
  const n = parseInt(val, 10);
  return Number.isFinite(n) ? n : null;
};

// Returns parsed float or null for non-numeric strings
const parseFloatParam = (val) => {
  const n = parseFloat(val);
  return Number.isFinite(n) ? n : null;
};

module.exports = { validateEmail, validatePassword, validatePhone, validatePincode, parseIntParam, parseFloatParam };
