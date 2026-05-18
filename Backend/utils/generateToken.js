const normalizeWords = (value = "") =>
  String(value)
    .trim()
    .split(/\s+/)
    .filter(Boolean);

const buildCode = (value = "", length = 2, fallback = "X") => {
  const words = normalizeWords(value);
  if (words.length === 0) {
    return fallback.repeat(length);
  }

  const initials = words.map((word) => String(word[0] || "").toUpperCase()).join("");
  if (initials.length >= length) {
    return initials.slice(0, length);
  }

  const firstWord = String(words[0] || "").toUpperCase();
  const extra = firstWord.slice(1, length - initials.length + 1);
  return (initials + extra).padEnd(length, fallback).slice(0, length);
};

export const getOrganizationCode = (organization = "") => buildCode(organization, 2, "O");

export const getBranchCode = (branchName = "") => buildCode(branchName, 2, "B");

export const getServiceCode = (service = "") => buildCode(service, 2, "S");

export const buildTokenPrefix = ({ tenantType, organization, branchName, city, service, serviceId }) => {
  const orgCode = getOrganizationCode(organization);
  const branchCode = getBranchCode(branchName || city);
  const serviceCode = getServiceCode(service);

  return `${orgCode}-${branchCode}-${serviceCode}`;
};

export const formatSequenceNumber = (sequenceNumber) => String(sequenceNumber).padStart(3, "0");

