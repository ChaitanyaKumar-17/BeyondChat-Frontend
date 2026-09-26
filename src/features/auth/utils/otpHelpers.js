// OTP handling utilities

export const handleOTPChange = (index, value, otp, setOtp, otpRefs) => {
  if (!/^\d*$/.test(value)) return; // Only allow digits

  const newOtp = [...otp];
  newOtp[index] = value.slice(-1); // Only take last character
  setOtp(newOtp);

  // Auto-focus next input
  if (value && index < 5) {
    otpRefs.current[index + 1]?.focus();
  }
};

export const handleOTPKeyDown = (index, e, otp, otpRefs) => {
  // Move to previous input on backspace if current is empty
  if (e.key === "Backspace" && !otp[index] && index > 0) {
    otpRefs.current[index - 1]?.focus();
  }
};

export const handleOTPPaste = (e, setOtp, otpRefs) => {
  e.preventDefault();
  const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
  const newOtp = Array(6).fill("");

  for (let i = 0; i < pastedData.length; i++) {
    newOtp[i] = pastedData[i];
  }
  setOtp(newOtp);

  // Focus last filled input or first empty one
  const focusIndex = Math.min(pastedData.length, 5);
  otpRefs.current[focusIndex]?.focus();
};