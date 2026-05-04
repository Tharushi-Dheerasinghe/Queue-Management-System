const STORAGE_PREFIX = "queueflow";

const buildKey = (...parts) => [STORAGE_PREFIX, ...parts.filter(Boolean)].join("_");

const resolveStorage = (storage) => {
  if (storage) {
    return storage;
  }

  if (typeof window !== "undefined") {
    return window.localStorage;
  }

  return null;
};

const readFromStorage = (storage, key) => {
  const resolvedStorage = resolveStorage(storage);

  if (!resolvedStorage) {
    return null;
  }

  return resolvedStorage.getItem(key);
};

export const readValue = (storage, key, fallbackKeys = []) => {
  const keys = [key, ...fallbackKeys].filter(Boolean);

  for (const candidateKey of keys) {
    const value = readFromStorage(storage, candidateKey);

    if (value !== null) {
      return value;
    }
  }

  return null;
};

export const writeValue = (storage, key, value) => {
  const resolvedStorage = resolveStorage(storage);

  if (!resolvedStorage) {
    return;
  }

  resolvedStorage.setItem(key, String(value));
};

export const removeItem = (storage, key) => {
  const resolvedStorage = resolveStorage(storage);

  if (!resolvedStorage) {
    return;
  }

  resolvedStorage.removeItem(key);
};

export const readJSON = (storage, key, fallbackKeys = [], defaultValue = null) => {
  const rawValue = readValue(storage, key, fallbackKeys);

  if (!rawValue) {
    return defaultValue;
  }

  try {
    return JSON.parse(rawValue);
  } catch {
    return defaultValue;
  }
};

export const writeJSON = (storage, key, value) => {
  writeValue(storage, key, JSON.stringify(value));
};

export const storageKeys = {
  selectedTenant: (tenantType) => buildKey(tenantType, "selectedTenant"),
  selectedOrganization: (tenantType) => buildKey(tenantType, "selectedOrganization"),
  selectedBranch: (tenantType) => buildKey(tenantType, "selectedBranch"),
  selectedService: (tenantType) => buildKey(tenantType, "selectedService"),
  queueFlowStarted: (tenantType) => buildKey(tenantType, "queueFlowStarted"),
  hospitalModule: (tenantType = "hospital") => buildKey(tenantType, "hospitalModule"),
  tokenData: (tenantType) => buildKey(tenantType, "tokenData"),
  hospitalBooking: (tenantType) => buildKey(tenantType, "hospitalBooking"),
  appointmentData: (tenantType) => buildKey(tenantType, "appointmentData"),
  hospitalPharmacyBooking: (tenantType) => buildKey(tenantType, "hospitalPharmacyBooking"),
  selectedDoctor: (tenantType = "hospital") => buildKey(tenantType, "selectedDoctor"),
  selectedDoctorSpecialization: (tenantType = "hospital") => buildKey(tenantType, "selectedDoctorSpecialization"),
  selectedDoctorBranch: (tenantType = "hospital") => buildKey(tenantType, "selectedDoctorBranch"),
  selectedBookingDate: (tenantType = "hospital") => buildKey(tenantType, "selectedBookingDate"),
  selectedBookingTime: (tenantType = "hospital") => buildKey(tenantType, "selectedBookingTime"),
};

export const legacyStorageKeys = {
  selectedTenant: "selectedTenant",
  selectedOrganization: "selectedOrganization",
  selectedOrganizationTenant: "selectedOrganizationTenant",
  selectedBranch: "selectedBranch",
  selectedService: "selectedService",
  queueFlowStarted: "queueFlowStarted",
  hospitalModule: "hospitalModule",
  tokenData: "tokenData",
  hospitalBooking: "hospitalBooking",
  appointmentData: "appointmentData",
  hospitalPharmacyBooking: "hospitalPharmacyBooking",
  selectedDoctor: "selectedDoctor",
  selectedDoctorSpecialization: "selectedDoctorSpecialization",
  selectedDoctorBranch: "selectedDoctorBranch",
  selectedBookingDate: "selectedBookingDate",
  selectedBookingTime: "selectedBookingTime",
};