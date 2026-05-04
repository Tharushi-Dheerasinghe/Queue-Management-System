import { legacyStorageKeys, readJSON, readValue, removeItem, storageKeys, writeJSON, writeValue } from "../utils/storage";

const getAppointmentKey = () => storageKeys.appointmentData("hospital");

const getHospitalBookingKey = () => storageKeys.hospitalBooking("hospital");

export const saveDoctorSelection = ({ doctor, selectedBranch, selectedDate, selectedTime }) => {
  const tenantType = "hospital";

  writeValue(sessionStorage, storageKeys.selectedDoctor(tenantType), doctor?.name || "");
  writeValue(sessionStorage, storageKeys.selectedDoctorSpecialization(tenantType), doctor?.specialization || "");
  writeValue(sessionStorage, storageKeys.selectedDoctorBranch(tenantType), selectedBranch || "");
  writeValue(sessionStorage, storageKeys.selectedBookingDate(tenantType), selectedDate || "");
  writeValue(sessionStorage, storageKeys.selectedBookingTime(tenantType), selectedTime || "");
};

export const getDoctorSelection = () => {
  const tenantType = "hospital";

  return {
    doctorName:
      readValue(sessionStorage, storageKeys.selectedDoctor(tenantType), [legacyStorageKeys.selectedDoctor]) ||
      "",
    specialization:
      readValue(
        sessionStorage,
        storageKeys.selectedDoctorSpecialization(tenantType),
        [legacyStorageKeys.selectedDoctorSpecialization]
      ) || "",
    selectedBranch:
      readValue(sessionStorage, storageKeys.selectedDoctorBranch(tenantType), [legacyStorageKeys.selectedDoctorBranch]) ||
      "",
    selectedDate:
      readValue(sessionStorage, storageKeys.selectedBookingDate(tenantType), [legacyStorageKeys.selectedBookingDate]) ||
      "",
    selectedTime:
      readValue(sessionStorage, storageKeys.selectedBookingTime(tenantType), [legacyStorageKeys.selectedBookingTime]) ||
      "",
  };
};

export const clearDoctorSelection = () => {
  const tenantType = "hospital";

  removeItem(sessionStorage, storageKeys.selectedDoctor(tenantType));
  removeItem(sessionStorage, storageKeys.selectedDoctorSpecialization(tenantType));
  removeItem(sessionStorage, storageKeys.selectedDoctorBranch(tenantType));
  removeItem(sessionStorage, storageKeys.selectedBookingDate(tenantType));
  removeItem(sessionStorage, storageKeys.selectedBookingTime(tenantType));
  removeItem(sessionStorage, legacyStorageKeys.selectedDoctor);
  removeItem(sessionStorage, legacyStorageKeys.selectedDoctorSpecialization);
  removeItem(sessionStorage, legacyStorageKeys.selectedDoctorBranch);
  removeItem(sessionStorage, legacyStorageKeys.selectedBookingDate);
  removeItem(sessionStorage, legacyStorageKeys.selectedBookingTime);
};

export const createAppointment = ({ doctorName, specialization, branch, date, time, patient }) => {
  const booking = {
    id: `HB-${Date.now()}`,
    doctorName,
    specialization,
    branch,
    date,
    time,
    patient,
    createdAt: new Date().toISOString(),
    status: "Confirmed",
  };

  writeJSON(localStorage, getAppointmentKey(), booking);
  writeJSON(localStorage, getHospitalBookingKey(), booking);
  return booking;
};

export const getAppointment = () =>
  readJSON(localStorage, getAppointmentKey(), [legacyStorageKeys.appointmentData]) ||
  readJSON(localStorage, getHospitalBookingKey(), [legacyStorageKeys.hospitalBooking]);

export const clearAppointment = () => {
  removeItem(localStorage, getAppointmentKey());
  removeItem(localStorage, getHospitalBookingKey());
  removeItem(localStorage, legacyStorageKeys.appointmentData);
  removeItem(localStorage, legacyStorageKeys.hospitalBooking);
};