/** Strip to digits and enforce Sri Lankan mobile: 07 + 8 digits (10 total). */
export const formatMobileInput = (value = "") => {
  const digits = String(value || "").replace(/\D/g, "");
  if (!digits) return "";

  let normalized = digits;
  if (normalized.startsWith("7") && !normalized.startsWith("07")) {
    normalized = `0${normalized}`;
  }
  if (!normalized.startsWith("07")) {
    normalized = `07${normalized.replace(/^0+/, "")}`;
  }

  return normalized.slice(0, 10);
};

export const mobileInputProps = {
  type: "tel",
  inputMode: "numeric",
  autoComplete: "tel",
  maxLength: 10,
  pattern: "[0-9]*",
};
