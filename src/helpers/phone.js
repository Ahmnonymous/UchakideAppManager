export const sanitizeTenDigit = (value) => {
  const onlyDigits = (value || "").replace(/\D/g, "");
  return onlyDigits.slice(0, 10);
};

// Returns React Hook Form rules for an optional 10-digit phone number
export const tenDigitRule = (isRequired = false, label = "Phone number") => {
  return {
    ...(isRequired ? { required: `${label} is required` } : {}),
    validate: (v) =>
      (!v ? true : /^\d{10}$/.test(v)) || `${label} must be exactly 10 digits.`,
  };
};


