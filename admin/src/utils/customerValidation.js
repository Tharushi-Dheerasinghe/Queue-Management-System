export const normalizeMobile = (value = "") => String(value || "").trim().replace(/\D/g, "");

export const validateCustomerDetails = ({
  fullName,
  mobile,
  nic,
  age,
  requireName = true,
} = {}) => {
  const errors = {};
  const name = String(fullName || "").trim();
  const phone = normalizeMobile(mobile);
  const nicValue = String(nic || "").trim();
  const ageValue = String(age ?? "").trim();

  if (requireName) {
    if (!name) errors.fullName = "Name is required.";
    else if (name.length < 2) errors.fullName = "Name must be at least 2 characters.";
    else if (!/^[\p{L}\s.'-]+$/u.test(name)) errors.fullName = "Name can only contain letters.";
  } else if (name && name.length < 2) {
    errors.fullName = "Name must be at least 2 characters when provided.";
  }

  if (!phone) errors.mobile = "Mobile number is required.";
  else if (phone.length !== 10) errors.mobile = "Mobile number must be exactly 10 digits.";
  else if (!/^07\d{8}$/.test(phone)) errors.mobile = "Mobile must start with 07 (e.g. 0712345678).";

  if (nicValue && !/^[0-9]{9}[vVxX]$/.test(nicValue) && !/^[0-9]{12}$/.test(nicValue)) {
    errors.nic = "NIC must be 12 digits (new) or 9 digits + V (old).";
  }

  if (ageValue) {
    const parsed = Number(ageValue);
    if (!Number.isInteger(parsed) || parsed < 1 || parsed > 120) {
      errors.age = "Age must be between 1 and 120.";
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
    values: {
      fullName: name || (requireName ? "" : "Walk-in Customer"),
      mobile: phone,
      nic: nicValue,
      age: ageValue ? Number(ageValue) : "",
    },
  };
};
