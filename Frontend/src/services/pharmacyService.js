import { legacyStorageKeys, readJSON, removeItem, storageKeys, writeJSON } from "../utils/storage";

const createPharmacyToken = () => `PH-${Math.floor(1000 + Math.random() * 9000)}`;

const getPharmacyBookingKey = (tenantType = "hospital") => storageKeys.hospitalPharmacyBooking(tenantType);

export const createPharmacyBooking = ({
  fullName,
  mobileNumber,
  nic,
  prescriptionClinicNumber,
  serviceSource,
  priorityType,
  age,
  note,
  prescriptionFileName,
  prescriptionPreview,
}, tenantType = "hospital") => {
  const pharmacyBooking = {
    tokenNumber: createPharmacyToken(),
    queueType: "Pharmacy Queue",
    status: "Waiting",
    branch: "Hospital Pharmacy",
    createdAt: new Date().toISOString(),
    patient: {
      fullName,
      mobileNumber,
      nic,
      prescriptionClinicNumber,
      serviceSource,
      priorityType,
      age,
      note,
    },
    prescription: {
      fileName: prescriptionFileName || "No file uploaded",
      preview: prescriptionPreview,
    },
  };

  writeJSON(localStorage, getPharmacyBookingKey(tenantType), pharmacyBooking);
  return pharmacyBooking;
};

export const getPharmacyBooking = (tenantType = "hospital") =>
  readJSON(localStorage, getPharmacyBookingKey(tenantType), [legacyStorageKeys.hospitalPharmacyBooking]);

export const clearPharmacyBooking = (tenantType = "hospital") => {
  removeItem(localStorage, getPharmacyBookingKey(tenantType));
  removeItem(localStorage, legacyStorageKeys.hospitalPharmacyBooking);
};