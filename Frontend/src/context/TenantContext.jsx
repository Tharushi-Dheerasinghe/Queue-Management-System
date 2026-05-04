import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { tenantConfig } from "../configs/tenantConfig.js";
import { legacyStorageKeys, readJSON, readValue, removeItem, storageKeys, writeJSON, writeValue } from "../utils/storage";

export const TenantContext = createContext();

export const TenantProvider = ({ tenantType, children }) => {
  const tenant = useMemo(() => tenantConfig[tenantType], [tenantType]);
  const theme = tenant?.theme;

  const selectedOrganizationIdKey = `queueflow_${tenantType}_selectedOrganization_id`;

  const readSelectedOrganization = () =>
    readValue(localStorage, storageKeys.selectedOrganization(tenantType), [legacyStorageKeys.selectedOrganization]) || "";

  const readSelectedOrganizationId = () => localStorage.getItem(selectedOrganizationIdKey) || "";

  const readSelectedBranch = () => {
    const savedTenant = readValue(localStorage, storageKeys.selectedTenant(tenantType), [legacyStorageKeys.selectedTenant]);
    const savedBranchObject = readJSON(localStorage, storageKeys.selectedBranch(tenantType), [], null);

    if (savedBranchObject && typeof savedBranchObject === "object" && (!savedTenant || savedTenant === tenantType)) {
      return savedBranchObject;
    }

    const savedBranch = readValue(localStorage, storageKeys.selectedBranch(tenantType), [legacyStorageKeys.selectedBranch]);

    if (savedBranch && (!savedTenant || savedTenant === tenantType)) {
      return {
        id: "",
        branchName: savedBranch,
      };
    }

    return null;
  };

  const readSelectedService = () => {
    const savedTenant = readValue(localStorage, storageKeys.selectedTenant(tenantType), [legacyStorageKeys.selectedTenant]);
    const savedServiceObject = readJSON(localStorage, storageKeys.selectedService(tenantType), [], null);

    if (savedServiceObject && typeof savedServiceObject === "object" && (!savedTenant || savedTenant === tenantType)) {
      return savedServiceObject;
    }

    const savedService = readValue(localStorage, storageKeys.selectedService(tenantType), [legacyStorageKeys.selectedService]);

    if (savedService && (!savedTenant || savedTenant === tenantType)) {
      return {
        id: "",
        serviceName: savedService,
      };
    }

    return null;
  };

  const [selectedBranch, setSelectedBranchState] = useState(() => {
    return readSelectedBranch();
  });

  const [selectedService, setSelectedServiceState] = useState(() => readSelectedService());
  const [selectedOrganization, setSelectedOrganizationState] = useState(() => readSelectedOrganization());
  const [selectedOrganizationId, setSelectedOrganizationIdState] = useState(() => readSelectedOrganizationId());

  useEffect(() => {
    setSelectedBranchState(readSelectedBranch());
    setSelectedServiceState(readSelectedService());
    setSelectedOrganizationState(readSelectedOrganization());
    setSelectedOrganizationIdState(localStorage.getItem(selectedOrganizationIdKey) || "");
  }, [tenantType]);



  const setSelectedOrganization = (organizationName, organizationId = "") => {
    const normalizedName = String(organizationName || "").trim();
    const normalizedId = String(organizationId || "").trim();

    const pathParts = window.location.pathname.split('/');
    const tenantFromUrl = pathParts[1];
    

    const activeTenant = tenantType || tenantFromUrl;

    if (!activeTenant || activeTenant === "undefined") {
      console.error("TenantType is missing! Cannot save organization.");
      return;
    }

    setSelectedOrganizationState(normalizedName);
    setSelectedOrganizationIdState(normalizedId);


    const orgNameKey = `queueflow_${activeTenant}_selectedOrganization`;
    const orgIdKey = `${orgNameKey}_id`;

    localStorage.setItem(orgNameKey, normalizedName);
    localStorage.setItem(orgIdKey, normalizedId);
    localStorage.setItem(`queueflow_selectedTenant`, activeTenant);
    
    console.log(`Saved for ${activeTenant}:`, normalizedId);
  };

  const setSelectedBranch = (branch) => {
    setSelectedBranchState(branch);

    if (branch) {
      writeJSON(localStorage, storageKeys.selectedBranch(tenantType), branch);
    } else {
      removeItem(localStorage, storageKeys.selectedBranch(tenantType));
    }

    writeValue(localStorage, storageKeys.selectedTenant(tenantType), tenantType);
  };

  const setSelectedService = (service) => {
    setSelectedServiceState(service);

    if (service) {
      writeJSON(localStorage, storageKeys.selectedService(tenantType), service);
    } else {
      removeItem(localStorage, storageKeys.selectedService(tenantType));
    }

    writeValue(localStorage, storageKeys.selectedTenant(tenantType), tenantType);
  };

  const clearSelection = () => {
    setSelectedBranchState(null);
    setSelectedServiceState(null);
    setSelectedOrganizationState("");
    setSelectedOrganizationIdState("");
    removeItem(localStorage, storageKeys.selectedTenant(tenantType));
    removeItem(localStorage, storageKeys.selectedOrganization(tenantType));
    removeItem(localStorage, selectedOrganizationIdKey);
    removeItem(localStorage, storageKeys.selectedBranch(tenantType));
    removeItem(localStorage, storageKeys.selectedService(tenantType));
    removeItem(localStorage, legacyStorageKeys.selectedOrganization);
    removeItem(localStorage, legacyStorageKeys.selectedBranch);
    removeItem(localStorage, legacyStorageKeys.selectedService);
  };

  const value = useMemo(
    () => ({
      tenantType,
      tenant,
      theme,
      selectedOrganization,
      selectedOrganizationId,
      selectedBranch,
      selectedService,
      setSelectedOrganization,
      setSelectedBranch,
      setSelectedService,
      clearSelection,
    }),
    [
      tenantType,
      tenant,
      theme,
      selectedOrganization,
      selectedOrganizationId,
      selectedBranch,
      selectedService,
    ]
  );

  return <TenantContext.Provider value={value}>{children}</TenantContext.Provider>;
};

export const useTenant = () => useContext(TenantContext);