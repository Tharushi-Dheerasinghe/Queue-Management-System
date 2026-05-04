import {
  getBranchesRequest,
  getServicesRequest,
} from "../api/userQueueApi";
import client from "../api/client";

const normalize = (value = "") => String(value || "").trim();

const mapOrganization = (organization) => {
  if (!organization) {
    return null;
  }

  if (typeof organization === "string") {
    return {
      id: "",
      name: organization,
    };
  }

  const name = normalize(
    organization.name || organization.divisionName || organization.organizationName || organization.branchName || ""
  );

  if (!name) {
    return null;
  }

  return {
    id: organization._id || organization.id || "",
    name,
  };
};

export const getOrganizationsForTenant = async ({ tenantType }) => {
  const normalizedTenantType = normalize(tenantType).toLowerCase();

  if (!normalizedTenantType) {
    return [];
  }

  const { data } = await client.get("/organizations/list", {
    params: {
      tenantType: normalizedTenantType,
    },
  });

  return Array.isArray(data?.organizations)
    ? data.organizations
        .map((organization) => mapOrganization(organization))
        .filter(Boolean)
    : [];
};

export const getBranchesForOrganization = async (tenantType, organizationId) => {
  const normalizedTenantType = normalize(tenantType).toLowerCase();
  const normalizedOrganizationId = normalize(organizationId);

  if (!normalizedTenantType || !normalizedOrganizationId) {
    return [];
  }

  const { data } = await client.get("/branches/list/public", {
    params: {
      tenantType: normalizedTenantType,
      organizationId: normalizedOrganizationId,
    },
  });

  return Array.isArray(data?.branches)
    ? data.branches.map((branch) => ({
        id: branch.id || branch._id,
        branchName: normalize(branch.branchName),
      }))
    : [];
};

export const getServicesForOrganization = async (tenantType, organizationId) => {
  const branches = await getBranchesForOrganization(tenantType, organizationId);

  if (!branches.length) {
    return [];
  }

  const responses = await Promise.all(
    branches.map((branch) =>
      getServicesRequest({
        tenantType,
        branchId: branch.id,
      })
    )
  );

  const serviceMap = new Map();

  for (const response of responses) {
    const services = Array.isArray(response?.data?.services) ? response.data.services : [];
    for (const service of services) {
      const serviceId = normalize(service?.id || service?._id);
      const serviceName = normalize(service?.serviceName);

      if (!serviceName) {
        continue;
      }

      const key = serviceName.toLowerCase();
      if (!serviceMap.has(key)) {
        serviceMap.set(key, {
          id: serviceId,
          serviceName,
        });
      }
    }
  }

  return Array.from(serviceMap.values());
};

export const getBranchesForTenantSelection = async ({ tenantType, organizationId }) => {
  const normalizedTenantType = normalize(tenantType).toLowerCase();
  const normalizedOrganizationId = normalize(organizationId);

  if (!normalizedTenantType || !normalizedOrganizationId) {
    return [];
  }

  const { data } = await client.get("/branches/list/public", {
    params: {
      tenantType: normalizedTenantType,
      organizationId: normalizedOrganizationId,
    },
  });

  return Array.isArray(data?.branches)
    ? data.branches.map((branch) => ({
        id: branch.id || branch._id,
        branchName: normalize(branch.branchName),
      }))
    : [];
};

export const getServicesForTenantSelection = async ({ tenantType, branchId }) => {
  const { data } = await getServicesRequest({
    tenantType,
    branchId,
  });

  return Array.isArray(data?.services)
    ? data.services.map((service) => ({
        id: service.id,
        serviceName: normalize(service.serviceName),
      }))
    : [];
};
