import { getMaxLengthForCountry } from './countryPhoneData';

// Validation utilities for registration

// Regex for valid name characters
// Allows: Unicode letters, spaces, hyphens, apostrophes, periods, combining marks
const NAME_REGEX = /^[\p{L}\p{M}\s'\-\.]+$/u;

export const sanitizeName = (value) => {
  // Remove any characters that don't match our allowed pattern
  // This removes: numbers, emojis, symbols, control characters
  return value.replace(/[^\p{L}\p{M}\s'\-\.]/gu, '');
};

export const validateEmail = (email, setErrors) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email) {
    setErrors({ email: "Email is required" });
    return false;
  }
  if (!emailRegex.test(email)) {
    setErrors({ email: "Invalid email format" });
    return false;
  }
  setErrors({});
  return true;
};

export const validateOTP = (otp, setErrors) => {
  const otpString = otp.join("");
  if (otpString.length !== 6) {
    setErrors({ otp: "Please enter all 6 digits" });
    return false;
  }
  setErrors({});
  return true;
};

export const validateDetails = (firstName, lastName, phone, dob, countryCode, setErrors) => {
  const newErrors = {};

  // Validate first name
  if (!firstName.trim()) {
    newErrors.firstName = "First name is required";
  } else if (!NAME_REGEX.test(firstName)) {
    newErrors.firstName = "First name contains invalid characters";
  }

  // Validate last name if provided
  if (lastName.trim() && !NAME_REGEX.test(lastName)) {
    newErrors.lastName = "Last name contains invalid characters";
  }

  // Validate phone
  if (!phone.trim()) {
    newErrors.phone = "Phone number is required";
  } else {
    const maxLength = getMaxLengthForCountry(countryCode);
    const phoneDigits = phone.replace(/\D/g, '');

    if (phoneDigits.length !== maxLength) {
      newErrors.phone = `Phone number must be exactly ${maxLength} digits for this country`;
    }
  }

  // Validate date of birth
  if (!dob) {
    newErrors.dob = "Date of birth is required";
  } else {
    const dobDate = new Date(dob);
    const today = new Date();
    const age = today.getFullYear() - dobDate.getFullYear();
    const monthDiff = today.getMonth() - dobDate.getMonth();
    const dayDiff = today.getDate() - dobDate.getDate();

    if (dobDate >= today) {
      newErrors.dob = "Please enter a valid date of birth";
    } else if (age < 18 || (age === 18 && (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)))) {
      newErrors.dob = "You must be at least 18 years old";
    }
  }

  setErrors(newErrors);
  return Object.keys(newErrors).length === 0;
};

export const validateCredentials = (username, password, setErrors) => {
  const newErrors = {};

  if (!username.trim()) {
    newErrors.username = "Username is required";
  } else if (username.length < 8) {
    newErrors.username = "Username must be at least 8 characters";
  }

  if (!password) {
    newErrors.password = "Password is required";
  } else if (password.length < 12) {
    newErrors.password = "Password must be at least 12 characters";
  } else {
    const hasLowercase = /[a-z]/.test(password);
    const hasUppercase = /[A-Z]/.test(password);
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    if (!hasLowercase || !hasUppercase || !hasSpecial) {
      newErrors.password = "Password must contain uppercase, lowercase, and special characters";
    }
  }

  setErrors(newErrors);
  return Object.keys(newErrors).length === 0;
};