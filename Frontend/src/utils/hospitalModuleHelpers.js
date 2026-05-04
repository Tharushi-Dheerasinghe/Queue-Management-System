import { legacyStorageKeys, readValue, storageKeys } from "./storage";

export const HOSPITAL_MODULES = {
  TOKEN_MANAGEMENT: "token-management",
  DOCTOR_CHANNELING: "doctor-channeling",
  PHARMACY_QUEUE: "pharmacy-queue",
};

export const resolveHospitalModule = (storage = sessionStorage) =>
  readValue(storage, storageKeys.hospitalModule("hospital"), [legacyStorageKeys.hospitalModule]);

export const getHospitalHomeRedirectPath = (hospitalModule) => {
  if (hospitalModule === HOSPITAL_MODULES.DOCTOR_CHANNELING) {
    return "/hospital/find-doctor";
  }

  if (hospitalModule === HOSPITAL_MODULES.PHARMACY_QUEUE) {
    return "/hospital/pharmacy";
  }

  return "/hospital/select-service";
};