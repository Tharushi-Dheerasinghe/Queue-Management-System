const normalizeText = (value = "") => String(value || "").trim();

const digitsOnly = (value = "") => normalizeText(value).replace(/\D/g, "");

export const normalizeMobile = (value = "") => digitsOnly(value);

export const validateCustomerDetails = ({
  fullName,
  mobile,
  nic,
  age,
  requireName = true,
} = {}) => {
  const errors = {};
  const name = normalizeText(fullName);
  const phone = normalizeMobile(mobile);
  const nicValue = normalizeText(nic);
  const ageValue = normalizeText(age);

  if (requireName) {
    if (!name) {
      errors.fullName = "Name is required.";
    } else if (name.length < 2) {
      errors.fullName = "Name must be at least 2 characters.";
    } else if (name.length > 100) {
      errors.fullName = "Name must be 100 characters or less.";
    } else if (!/^[\p{L}\s.'-]+$/u.test(name)) {
      errors.fullName = "Name can only contain letters, spaces, and basic punctuation.";
    }
  } else if (name && name.length < 2) {
    errors.fullName = "Name must be at least 2 characters when provided.";
  }

  if (!phone) {
    errors.mobile = "Mobile number is required.";
  } else if (phone.length !== 10) {
    errors.mobile = "Mobile number must be exactly 10 digits.";
  } else if (!/^07\d{8}$/.test(phone)) {
    errors.mobile = "Mobile number must start with 07 (e.g. 0712345678).";
  }

  if (nicValue) {
    const oldNic = /^[0-9]{9}[vVxX]$/;
    const newNic = /^[0-9]{12}$/;
    if (!oldNic.test(nicValue) && !newNic.test(nicValue)) {
      errors.nic = "NIC must be 12 digits (new) or 9 digits followed by V (old).";
    }
  }

  if (ageValue) {
    const parsedAge = Number(ageValue);
    if (!Number.isInteger(parsedAge) || parsedAge < 1 || parsedAge > 120) {
      errors.age = "Age must be a whole number between 1 and 120.";
    }
  }

  const isValid = Object.keys(errors).length === 0;

  return {
    isValid,
    errors,
    values: {
      fullName: name || (requireName ? "" : "Walk-in Customer"),
      mobile: phone,
      nic: nicValue,
      age: ageValue ? Number(ageValue) : null,
    },
  };
};

export const getFirstValidationError = (errors = {}) => {
  const firstKey = Object.keys(errors)[0];
  return firstKey ? errors[firstKey] : "Validation failed.";
};
