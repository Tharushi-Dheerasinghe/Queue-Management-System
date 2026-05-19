import Counter from "../models/Counter.js";
import Token from "../models/Token.js";
import { getIo } from "./socket.js";

export const getLivePeopleAhead = async (token) => {
  if (!token?.branchId || !token?.serviceId) return 0;
  if (token.sequenceNumber == null) return 0;

  const query = {
    branchId: token.branchId,
    serviceId: token.serviceId,
    status: "Waiting",
    sequenceNumber: { $lt: token.sequenceNumber },
  };

  if (token.bookingDate) {
    query.bookingDate = token.bookingDate;
  }

  return Token.countDocuments(query);
};

export const getWaitingPositionsForService = async (branchId, serviceId) => {
  if (!branchId || !serviceId) return [];

  const waiting = await Token.find({
    branchId,
    serviceId,
    status: "Waiting",
  })
    .sort({ sequenceNumber: 1 })
    .select("_id tokenNumber sequenceNumber bookingDate branchId serviceId")
    .lean();

  const positions = [];
  for (const entry of waiting) {
    const peopleAhead = await getLivePeopleAhead(entry);
    positions.push({
      tokenId: String(entry._id),
      tokenNumber: entry.tokenNumber,
      peopleAhead,
    });
  }
  return positions;
};

export const getCounterDetails = async (counterId) => {
  if (!counterId) return null;

  const counter = await Counter.findById(counterId)
    .select("_id counterName serviceId branchId")
    .lean();

  if (!counter) return null;

  return {
    id: String(counter._id),
    counterName: counter.counterName,
    serviceId: counter.serviceId ? String(counter.serviceId) : null,
    branchId: counter.branchId ? String(counter.branchId) : null,
  };
};

export const serializeTokenForClient = (token, extras = {}) => {
  const plain = token?.toObject ? token.toObject() : { ...token };

  return {
    id: String(plain._id || plain.id),
    _id: String(plain._id || plain.id),
    tenantType: plain.tenantType,
    organizationId: plain.organizationId || null,
    branchId: plain.branchId ? String(plain.branchId) : null,
    serviceId: plain.serviceId ? String(plain.serviceId) : null,
    organizationName: plain.organizationName || "",
    branchName: plain.branchName || "",
    serviceName: plain.serviceName || plain.service || "",
    unitName: plain.serviceName || plain.service || "",
    fullName: plain.fullName,
    mobile: plain.mobile,
    tokenNumber: plain.tokenNumber,
    sequenceNumber: plain.sequenceNumber,
    status: plain.status,
    counterId: plain.counterId ? String(plain.counterId) : null,
    peopleAhead: plain.peopleAhead ?? 0,
    estimatedWait: plain.estimatedWait || "",
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
    startedAt: plain.startedAt,
    ...extras,
  };
};

export const enrichTokenForClient = async (tokenDoc) => {
  const plain = tokenDoc?.toObject ? tokenDoc.toObject() : { ...tokenDoc };
  const peopleAhead = await getLivePeopleAhead(plain);
  const counter = await getCounterDetails(plain.counterId);

  return serializeTokenForClient(plain, {
    peopleAhead,
    counterName: counter?.counterName || "",
    unitName: plain.serviceName || plain.service || "",
  });
};

export const emitQueueUpdated = async (branchId, payload = {}) => {
  const io = getIo();
  if (!io || !branchId) return;

  const branchKey = String(branchId);
  const event = {
    ...payload,
    branchId: branchKey,
  };

  const tokenRef = payload.calledToken || payload.token || payload.updatedToken;
  if (payload.counterId) {
    event.counter = await getCounterDetails(payload.counterId);
  } else if (tokenRef?.counterId) {
    event.counter = await getCounterDetails(tokenRef.counterId);
  }

  if (tokenRef) {
    const serialized = serializeTokenForClient(tokenRef, {
      counterName: event.counter?.counterName || "",
      unitName: tokenRef.serviceName || tokenRef.service || "",
    });
    if (payload.calledToken) event.calledToken = serialized;
    if (payload.token) event.token = serialized;
    if (payload.updatedToken) event.updatedToken = serialized;
    event.unitName = serialized.unitName;
  }

  const serviceId = payload.serviceId || tokenRef?.serviceId;
  if (serviceId) {
    event.waitingPositions = await getWaitingPositionsForService(branchId, serviceId);
    event.serviceId = String(serviceId);
  }

  io.to(branchKey).emit("queueUpdated", event);
};
