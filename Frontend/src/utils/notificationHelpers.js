import { HOSPITAL_MODULES, resolveHospitalModule } from "./hospitalModuleHelpers";

const tenantNotificationModules = {
  bank: "bank",
  police: "police",
  supermarket: "supermarket",
  hospital: "hospital",
};

const hospitalNotificationModules = {
  [HOSPITAL_MODULES.TOKEN_MANAGEMENT]: "hospital-token",
  [HOSPITAL_MODULES.DOCTOR_CHANNELING]: "hospital-channeling",
  [HOSPITAL_MODULES.PHARMACY_QUEUE]: "hospital-pharmacy",
};

export const filterNotificationsByTenantAndModule = ({
  notifications,
  tenantType,
  hospitalModule,
}) => {
  const tenantModule = tenantNotificationModules[tenantType];

  if (tenantModule) {
    return notifications.filter((item) => item.module === tenantModule);
  }

  if (tenantType === "hospital") {
    const hospitalModuleKey = hospitalNotificationModules[hospitalModule];

    if (hospitalModuleKey) {
      return notifications.filter((item) => item.module === hospitalModuleKey);
    }
  }

  return notifications;
};