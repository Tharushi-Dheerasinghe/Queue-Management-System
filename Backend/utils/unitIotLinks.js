import Counter from "../models/Counter.js";
import Service from "../models/Service.js";

export const resolvePublicApiBase = (req) => {
  const fromEnv = process.env.API_PUBLIC_URL || process.env.RENDER_EXTERNAL_URL || "";
  if (fromEnv) return String(fromEnv).replace(/\/$/, "");
  if (req?.protocol && req?.get) {
    return `${req.protocol}://${req.get("host")}`.replace(/\/$/, "");
  }
  return "";
};

/** One setup URL carries API base + counter id — no separate links needed. */
export const buildUnitIotLinks = ({ apiBaseUrl = "", counterId = "", unitName = "" } = {}) => {
  const apiBase = `${String(apiBaseUrl || "").replace(/\/$/, "")}/api`;
  const cid = String(counterId || "");
  const unit = encodeURIComponent(unitName || "Unit");

  return {
    counterId: cid,
    apiBase,
    setupUrl: `http://192.168.4.1/?counterId=${encodeURIComponent(cid)}&api=${encodeURIComponent(apiBase)}&unit=${unit}`,
    statusUrl: `${apiBase}/tokens/iot/status?counterId=${encodeURIComponent(cid)}`,
    nextUrl: `${apiBase}/tokens/iot/complete-and-next`,
    nextMethod: "POST",
    nextBody: { counterId: cid },
  };
};

export const ensureDefaultCounterForService = async (service, branchId, options = {}) => {
  const { session = null } = options;
  if (!service?._id || !branchId) return null;

  const sessionOpt = session ? { session } : {};

  if (service.defaultCounterId) {
    const linkedQuery = Counter.findById(service.defaultCounterId);
    const linked = session ? await linkedQuery.session(session) : await linkedQuery;
    if (linked) return linked;
  }

  let counter = await Counter.findOne({ serviceId: service._id, branchId })
    .sort({ createdAt: 1 })
    .session(session || null);

  if (!counter) {
    const payload = {
      tenantType: service.tenantType,
      organizationId: service.organizationId || null,
      branchId,
      serviceId: service._id,
      counterName: `${service.serviceName} Counter`,
      status: "active",
    };

    if (session) {
      const [created] = await Counter.create([payload], { session });
      counter = created;
    } else {
      counter = await Counter.create(payload);
    }
  }

  if (!service.defaultCounterId || String(service.defaultCounterId) !== String(counter._id)) {
    await Service.findByIdAndUpdate(
      service._id,
      { defaultCounterId: counter._id },
      sessionOpt
    );
    service.defaultCounterId = counter._id;
  }

  return counter;
};

export const mapServiceWithIotLinks = async ({ service, branchId, apiBaseUrl }) => {
  const counter = await ensureDefaultCounterForService(service, branchId);
  const iot = buildUnitIotLinks({
    apiBaseUrl,
    counterId: counter?._id,
    unitName: service.serviceName,
  });

  return {
    id: service._id,
    serviceName: service.serviceName,
    counterId: String(counter?._id || ""),
    counterName: counter?.counterName || "",
    ...iot,
  };
};
