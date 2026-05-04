export function getOrganizationName(org) {
  if (!org) {
    return "";
  }

  if (typeof org === "string") {
    return org;
  }

  return org.name || org.organizationName || org.branchName || "";
}

export function getOrganizationByName(tenant, selectedOrganizationName = "") {
  if (!tenant || !selectedOrganizationName || !Array.isArray(tenant.organizations)) {
    return null;
  }

  return tenant.organizations.find(
    (organization) => getOrganizationName(organization) === selectedOrganizationName
  ) || null;
}

export function isNestedTenant(tenant) {
  if (!tenant || !Array.isArray(tenant.organizations) || tenant.organizations.length === 0) {
    return false;
  }

  return typeof tenant.organizations[0] === "object";
}

export function getBranchesForOrganization(tenant, selectedOrganizationName = "") {
  if (!tenant) {
    return [];
  }

  if (!isNestedTenant(tenant)) {
    return tenant.branches || [];
  }

  const selectedOrg = getOrganizationByName(tenant, selectedOrganizationName);
  if (selectedOrg) {
    return selectedOrg.branches || [];
  }

  return [];
}

export function getAllBranchesForTenant(tenant) {
  if (!tenant) {
    return [];
  }

  if (!isNestedTenant(tenant)) {
    return tenant.branches || [];
  }

  return (tenant.organizations || []).flatMap((organization) => organization.branches || []);
}

export function getBranchesForTenant(tenant, selectedOrganizationName = "") {
  if (selectedOrganizationName) {
    return getBranchesForOrganization(tenant, selectedOrganizationName);
  }

  if (isNestedTenant(tenant)) {
    return getAllBranchesForTenant(tenant);
  }

  return tenant?.branches || [];
}

export function getServicesForOrganization(
  tenant,
  selectedOrganizationName = "",
  defaultServices = []
) {
  if (!tenant) {
    return defaultServices;
  }

  const selectedOrg = getOrganizationByName(tenant, selectedOrganizationName);

  if (selectedOrg && Array.isArray(selectedOrg.services) && selectedOrg.services.length > 0) {
    return selectedOrg.services;
  }

  return defaultServices;
}
