import { createNotification } from "./notificationController.js";
import mongoose from "mongoose";
import Branch from "../models/Branch.js";
import Service from "../models/Service.js";
import Token from "../models/Token.js";
import WorkSession from "../models/WorkSession.js";
import { buildTokenPrefix, formatSequenceNumber } from "../utils/generateToken.js";
import { normalizeTenantType } from "../utils/scopeHelpers.js";
import Counter from "../models/Counter.js";


const normalize = (value = "") => String(value || "").trim();
const normalizeLower = (value = "") => normalize(value).toLowerCase();

const buildCaseInsensitiveStringClause = (fieldName, value) =>
  value ? { [fieldName]: value } : null;

const buildLegacyCompatibleScopeQuery = ({
  tenantType,
  organizationId,
  organizationName,
  branchId,
  branchName,
  serviceId,
  serviceName,
}) => {
  const andClauses = [{ tenantType }];

  const organizationClauses = [];
  if (organizationId) {
    organizationClauses.push({ organizationId });
  }
  if (organizationName) {
    organizationClauses.push(buildCaseInsensitiveStringClause("organization", organizationName));
  }
  if (organizationClauses.length > 0) {
    andClauses.push(organizationClauses.length === 1 ? organizationClauses[0] : { $or: organizationClauses });
  }

  const branchClauses = [];
  if (branchId) {
    branchClauses.push({ branchId });
  }
  if (branchName) {
    branchClauses.push(buildCaseInsensitiveStringClause("branch", branchName));
  }
  if (branchClauses.length > 0) {
    andClauses.push(branchClauses.length === 1 ? branchClauses[0] : { $or: branchClauses });
  }

  const serviceClauses = [];
  if (serviceId) {
    serviceClauses.push({ serviceId });
  }
  if (serviceName) {
    serviceClauses.push(buildCaseInsensitiveStringClause("service", serviceName));
  }
  if (serviceClauses.length > 0) {
    andClauses.push(serviceClauses.length === 1 ? serviceClauses[0] : { $or: serviceClauses });
  }

  return { $and: andClauses };
};

const resolveOrganizationScope = ({ req, branch, bodyOrganizationId, bodyOrganizationName, tenantType }) => {
  const userScope = req.user ? req.user : {};
  const bodyTenantType = normalizeLower(req.body?.tenantType);
  const userTenantType = normalizeLower(userScope.tenantType);
  const resolvedTenantType = normalizeTenantType(bodyTenantType || userTenantType || tenantType || branch?.tenantType || "");

  const branchOrganizationId = branch?.organizationId || null;
  const branchOrganizationName = branch?.organizationName || branch?.divisionName || "";

  const finalOrganizationId = branch.organizationId;
  const organizationName = normalize(bodyOrganizationName || userScope.organizationName || userScope.divisionName || branchOrganizationName || "");

  return {
    tenantType: resolvedTenantType,
    organizationId: finalOrganizationId,
    organizationName,
  };
};

const buildTokenResponse = (token) => ({
  id: token._id,
  tenantType: token.tenantType,
  organizationId: token.organizationId || null,
  branchId: token.branchId || null,
  serviceId: token.serviceId || null,
  organizationName: token.organizationName || "",
  branchName: token.branchName || "",
  serviceName: token.serviceName || "",
  organization: token.organization,
  branch: token.branch,
  service: token.service,
  fullName: token.fullName,
  mobile: token.mobile,
  note: token.note,
  tokenPrefix: token.tokenPrefix,
  tokenNumber: token.tokenNumber,
  sequenceNumber: token.sequenceNumber,
  status: token.status,
  currentToken: token.currentToken,
  peopleAhead: token.peopleAhead,
  estimatedWait: token.estimatedWait,
  createdAt: token.createdAt,
  updatedAt: token.updatedAt,
});

// create token
export const createToken = async (req, res) => {
  try {
    const {
      tenantType,
      organization,
      organizationId,
      branchId,
      serviceId,
      fullName,
      mobile,
      note,
      userId,
    } = req.body || {};

    if (!branchId || !serviceId || !fullName || !mobile) {
      return res.status(400).json({
        success: false,
        message: "branchId, serviceId, fullName, and mobile are required.",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(branchId) || !mongoose.Types.ObjectId.isValid(serviceId)) {
      return res.status(400).json({
        success: false,
        message: "branchId and serviceId must be valid ObjectIds.",
      });
    }

    if (organizationId && !mongoose.Types.ObjectId.isValid(organizationId)) {
      return res.status(400).json({
        success: false,
        message: "organizationId must be a valid ObjectId.",
      });
    }

    const [branch, service] = await Promise.all([
      Branch.findById(branchId)
        .select("_id tenantType branchName city organizationId organizationName divisionId divisionName status")
        .lean(),
      Service.findById(serviceId)
        .select("_id tenantType organizationId divisionId branchId serviceName status")
        .lean(),
    ]);

    if (!branch) {
      return res.status(404).json({
        success: false,
        message: "Branch not found",
      });
    }

    const resolvedTenantType = normalizeTenantType(tenantType || req.user?.tenantType || branch.tenantType || "");
    if (!resolvedTenantType) {
      return res.status(400).json({
        success: false,
        message: "tenantType could not be resolved",
      });
    }

    if (normalizeTenantType(branch.tenantType) !== resolvedTenantType) {
      return res.status(400).json({
        success: false,
        message: "Branch does not belong to the provided tenantType",
      });
    }

    if (!service) {
      return res.status(404).json({
        success: false,
        message: "Service not found",
      });
    }

    /*if (String(service.branchId) !== String(branch._id)) {
      return res.status(400).json({
        success: false,
        message: "Service does not belong to the selected branch",
      });
    }*/

    if (normalizeTenantType(service.tenantType) !== resolvedTenantType) {
      return res.status(400).json({
        success: false,
        message: "Service does not belong to the provided tenantType",
      });
    }

    if (String(service.status || "").toLowerCase() !== "active") {
      return res.status(400).json({
        success: false,
        message: "Selected service is not active",
      });
    }

    if (String(branch.status || "").toLowerCase() !== "active") {
      return res.status(400).json({
        success: false,
        message: "Selected branch is not active",
      });
    }

    const organizationScope = resolveOrganizationScope({
      req,
      branch,
      bodyOrganizationId: organizationId,
      bodyOrganizationName: organization,
      tenantType: resolvedTenantType,
    });

    const finalOrganizationId = organizationScope.organizationId;
    const finalOrganizationName = normalize(
      organizationScope.organizationName || branch.organizationName || branch.divisionName || organization || ""
    );
    const finalBranchName = normalize(branch.branchName);
    const finalServiceName = normalize(service.serviceName);

    if (!finalOrganizationId && resolvedTenantType === "police") {
      return res.status(400).json({
        success: false,
        message: "Police bookings require an organizationId scope",
      });
    }

    if (
      normalize(organization) &&
      finalOrganizationName &&
      normalizeLower(organization) !== normalizeLower(finalOrganizationName)
    ) {
      return res.status(400).json({
        success: false,
        message: "Provided organization does not match selected branch",
      });
    }

    const tokenPrefix = buildTokenPrefix({
      tenantType: resolvedTenantType,
      organization: finalOrganizationName,
      city: branch.city,
      service: finalServiceName,
      serviceId: service._id,
    });

    const tokenQuery = buildLegacyCompatibleScopeQuery({
      tenantType: resolvedTenantType,
      organizationId: finalOrganizationId,
      organizationName: finalOrganizationName,
      branchId: branch._id,
      branchName: finalBranchName,
      serviceId: service._id,
      serviceName: finalServiceName,
    });

    let createdToken = null;

    for (let attempt = 0; attempt < 3; attempt += 1) {
      const existingCount = await Token.countDocuments(tokenQuery);
      const sequenceNumber = existingCount + 1;
      const tokenNumber = `${tokenPrefix}-${formatSequenceNumber(sequenceNumber)}`;

      // Calculate peopleAhead as the count of currently waiting tokens for this branch & service
      const peopleAhead = await Token.countDocuments({
        branchId: branch._id,
        serviceId: service._id,
        status: "Waiting",
      });

      const token = new Token({
        tenantType: resolvedTenantType,
        organizationId: finalOrganizationId,
        branchId: branch._id,
        serviceId: service._id,
        organizationName: finalOrganizationName,
        branchName: finalBranchName,
        serviceName: finalServiceName,
        // Legacy string fields retained for migration compatibility.
        organization: finalOrganizationName,
        branch: finalBranchName,
        service: finalServiceName,
        fullName: normalize(fullName),
        mobile: normalize(mobile),
        note: normalize(note),
        userId: userId || req.user?.id || null,
        tokenPrefix,
        tokenNumber,
        sequenceNumber,
        status: "Waiting",
        currentToken: tokenNumber,
        peopleAhead,
        estimatedWait: `${Math.max(peopleAhead * 3, 3)} min`,
      });

      try {
        createdToken = await token.save();
        // tokenController.js -> createToken function එක ඇතුළත
        await createNotification({
          tenantType: resolvedTenantType,
          tokenNumber: tokenNumber,
          title: "Token Generated",
          message: `Your token ${tokenNumber} for ${finalServiceName} at ${finalBranchName} has been successfully generated.`,
          type: "token",
          module: resolvedTenantType, // bank, police, etc.
          userId: token.userId || req.user?.id
        });
        break;
      } catch (saveError) {
        if (saveError?.code !== 11000 || attempt === 2) {
          throw saveError;
        }
      }
    }

    return res.status(201).json({ success: true, token: createdToken });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Cancel or update token status
export const updateTokenStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    if (!status) {
      return res.status(400).json({ success: false, message: "Status is required" });
    }
    const token = await Token.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );
    if (!token) {
      return res.status(404).json({ success: false, message: "Token not found" });
    }

    // Status එක අනුව වෙනස් message එකක් හදමු
    let notifTitle = "Queue Update";
    let notifMessage = `Your token ${token.tokenNumber} status has been updated to ${status}.`;

    if (status === "Called") {
      notifTitle = "It's Your Turn!";
      notifMessage = `Token ${token.tokenNumber} is being called. Please proceed to the counter.`;
    } else if (status === "Cancelled") {
      notifTitle = "Token Cancelled";
      notifMessage = `Your token ${token.tokenNumber} has been cancelled successfully.`;
    }

    // Notification එක create කරනවා
    await createNotification({
      tenantType: token.tenantType,
      tokenNumber: token.tokenNumber,
      title: notifTitle,
      message: notifMessage,
      type: status.toLowerCase(),
      module: token.tenantType,
      userId: token.userId || req.user?.id
    });

    return res.status(200).json({ success: true, token });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// track token by token number
export const trackTokenByNumber = async (req, res) => {
  try {
    const tokenNumber = normalize(req.params.tokenNumber).toUpperCase();

    if (!tokenNumber) {
      return res.status(400).json({
        success: false,
        message: "tokenNumber is required",
      });
    }

    const token = await Token.findOne({ tokenNumber });

    if (!token) {
      return res.status(404).json({
        success: false,
        message: "Token not found",
      });
    }
    // Calculate live peopleAhead: tokens with smaller sequenceNumber and status Waiting
    const livePeopleAhead = await Token.countDocuments({
      branchId: token.branchId,
      serviceId: token.serviceId,
      status: "Waiting",
      sequenceNumber: { $lt: token.sequenceNumber },
    });

    const latestCalledToken = await Token.findOne({
      branchId: token.branchId,
      serviceId: token.serviceId,
      status: "Called",
    })
      .sort({ updatedAt: -1 })
      .select("tokenNumber")
      .lean();

    const latestCompletedToken = latestCalledToken
      ? null
      : await Token.findOne({
          branchId: token.branchId,
          serviceId: token.serviceId,
          status: "Completed",
        })
          .sort({ updatedAt: -1 })
          .select("tokenNumber")
          .lean();

    const currentToken = latestCalledToken?.tokenNumber || latestCompletedToken?.tokenNumber || "---";

    // If there is an active work session for this branch & service, show estimated wait.
    // Otherwise show placeholder indicating queue isn't being served yet.
    const activeWorkSession = await WorkSession.findOne({
      branchId: token.branchId,
      serviceId: token.serviceId,
      status: "active",
    }).lean();

    const estimatedWait = activeWorkSession
      ? `${Math.max(livePeopleAhead * 15, 15)} min`
      : "Queue not started";

    return res.status(200).json({
      success: true,
      token: {
        id: token._id,
        tokenNumber: token.tokenNumber,
        tenantType: token.tenantType,
        organizationId: token.organizationId || null,
        branchId: token.branchId || null,
        serviceId: token.serviceId || null,
        fullName: token.fullName,
        mobile: token.mobile,
        note: token.note,
        organizationName: token.organizationName || "",
        branchName: token.branchName || "",
        serviceName: token.serviceName || "",
        organization: token.organization,
        branch: token.branch,
        service: token.service,
        status: token.status,
        currentToken,
        peopleAhead: livePeopleAhead,
        estimatedWait,
        createdAt: token.createdAt,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// get token by id
export const getToken = async (req, res) => {
  try {
    const token = await Token.findById(req.params.id);

    if (!token) {
      return res.status(404).json({ success: false, message: "Token not found" });
    }

    return res.json({ success: true, token: buildTokenResponse(token) });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Backend/controllers/tokenController.js

export const getUserBookings = async (req, res) => {
  try {
    const userId = req.user.id; 
    
    // Schema එකේ userId තියෙන නිසා දැන් මේක නියමෙට වැඩ කරනවා
    const bookings = await Token.find({ userId }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: bookings // Frontend එකේ 'bookings' state එකට මේක තමයි යන්නේ
    });
  } catch (error) {
    console.error("Error fetching bookings:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

// Backend: controllers/tokenController.js

export const callNextToken = async (req, res) => {
  try {
    const { counterId } = req.body;

    // counterId එක valid ObjectId එකක්ද කියා පරීක්ෂා කරන්න
    if (!mongoose.Types.ObjectId.isValid(counterId)) {
      return res.status(400).json({ success: false, message: "Invalid Counter ID format" });
    }

    const counter = await Counter.findById(counterId);
    if (!counter) {
      return res.status(404).json({ success: false, message: "Counter not found" });
    }

    // 1. Complete any token currently called on this counter and notify customer
    const activeCalledTokens = await Token.find({
      counterId: new mongoose.Types.ObjectId(counterId),
      status: "Called",
    });

    for (const activeCalledToken of activeCalledTokens) {
      activeCalledToken.status = "Completed";
      activeCalledToken.completedAt = new Date();
      await activeCalledToken.save();

      await createNotification({
        tenantType: activeCalledToken.tenantType,
        tokenNumber: activeCalledToken.tokenNumber,
        title: "Service Completed",
        message: `Your session for token ${activeCalledToken.tokenNumber} has been successfully completed. Thank you!`,
        type: "completed",
        module: activeCalledToken.tenantType,
        userId: activeCalledToken.userId || req.user?.id,
      });
    }

    // 2. පෝලිමේ ඊළඟට සිටින "Waiting" ටෝකනය සෙවීම
    const nextToken = await Token.findOne({
      branchId: counter.branchId,
      serviceId: counter.serviceId,
      status: "Waiting"
    }).sort({ sequenceNumber: 1 });

    if (!nextToken) {
      return res.status(404).json({ 
        success: false, 
        message: "No tokens waiting for this counter's service" 
      });
    }

    // 3. නව ටෝකනය "Called" තත්ත්වයට පත් කිරීම
    nextToken.status = "Called";
    nextToken.counterId = counter.id; // counterId එක assign කිරීම
    nextToken.startedAt = new Date();
    await nextToken.save();

    const counterName = counter.counterName || counter.counterNumber || "Counter";

    await createNotification({
      tenantType: nextToken.tenantType,
      tokenNumber: nextToken.tokenNumber,
      title: "It's Your Turn!",
      message: `Token ${nextToken.tokenNumber} is now being called at Counter ${counterName}. Please proceed to the counter.`,
      type: "called",
      module: nextToken.tenantType,
      userId: nextToken.userId || req.user?.id,
    });

    // කවුන්ටරය active බව තහවුරු කිරීම
    if (counter.status !== 'active') {
      counter.status = 'active';
      await counter.save();
    }

    return res.status(200).json({ success: true, token: nextToken });
  } catch (error) {
    console.error("callNextToken error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const skipAndCallNextToken = async (req, res) => {
  try {
    const { counterId } = req.body;

    if (!mongoose.Types.ObjectId.isValid(counterId)) {
      return res.status(400).json({ success: false, message: "Invalid Counter ID format" });
    }

    const counter = await Counter.findById(counterId);
    if (!counter) {
      return res.status(404).json({ success: false, message: "Counter not found" });
    }

    const counterObjectId = new mongoose.Types.ObjectId(counterId);

    const activeCalledTokens = await Token.find({
      counterId: counterObjectId,
      status: "Called",
    });

    for (const activeCalledToken of activeCalledTokens) {
      activeCalledToken.status = "Skipped";
      activeCalledToken.skippedAt = new Date();
      await activeCalledToken.save();

      await createNotification({
        tenantType: activeCalledToken.tenantType,
        tokenNumber: activeCalledToken.tokenNumber,
        title: "Token Skipped",
        message: `Your turn for token ${activeCalledToken.tokenNumber} was skipped because you were not present at the counter.`,
        type: "skipped",
        module: activeCalledToken.tenantType,
        userId: activeCalledToken.userId || req.user?.id,
      });
    }

    const nextToken = await Token.findOne({
      branchId: counter.branchId,
      serviceId: counter.serviceId,
      status: "Waiting",
    }).sort({ sequenceNumber: 1 });

    if (!nextToken) {
      if (counter.status !== "active") {
        counter.status = "active";
        await counter.save();
      }

      return res.status(200).json({
        success: true,
        token: null,
        message: "No tokens waiting for this counter's service",
      });
    }

    nextToken.status = "Called";
    nextToken.counterId = counter.id;
    nextToken.startedAt = new Date();
    await nextToken.save();

    const counterName = counter.counterName || counter.counterNumber || "Counter";

    await createNotification({
      tenantType: nextToken.tenantType,
      tokenNumber: nextToken.tokenNumber,
      title: "It's Your Turn!",
      message: `Token ${nextToken.tokenNumber} is now being called at Counter ${counterName}. Please proceed to the counter.`,
      type: "called",
      module: nextToken.tenantType,
      userId: nextToken.userId || req.user?.id,
    });

    if (counter.status !== "active") {
      counter.status = "active";
      await counter.save();
    }

    return res.status(200).json({ success: true, token: nextToken });
  } catch (error) {
    console.error("skipAndCallNextToken error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getNextWaitingToken = async (req, res) => {
  try {
    const { serviceId, branchId } = req.query;

    if (!serviceId || !branchId) {
      return res.status(400).json({
        success: false,
        message: "serviceId and branchId are required",
      });
    }

    // අදාළ සේවාවට අයත්, පෝලිමේ මුලින්ම සිටින (FIFO) ටෝකනය සෙවීම
    const nextToken = await Token.findOne({
      branchId: branchId,
      serviceId: serviceId,
      status: "Waiting"
    })
    .sort({ sequenceNumber: 1 }) // පළමු ටෝකනය
    .lean();

    return res.status(200).json({
      success: true,
      nextToken: nextToken || null // පෝලිමේ කිසිවෙකු නැත්නම් null යවයි
    });
  } catch (error) {
    console.error("getNextWaitingToken error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

export const getWaitingTokenCount = async (req, res) => {
  try {
    const { serviceId, branchId } = req.query;

    if (!serviceId || !branchId) {
      return res.status(400).json({
        success: false,
        message: "serviceId and branchId are required",
      });
    }

    // අදාළ සේවාවට අයත්, පෝලිමේ සිටින සමස්ත ටෝකනවල ගණන ගණනය කිරීම
    const count = await Token.countDocuments({
      branchId: branchId,
      serviceId: serviceId,
      status: "Waiting"
    });

    return res.status(200).json({
      success: true,
      count: count || 0
    });
  } catch (error) {
    console.error("getWaitingTokenCount error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

export const getProcessedTokensByCounter = async (req, res) => {
  try {
    const { counterId } = req.query;
    const limit = parseInt(req.query.limit || "20", 10);

    if (!counterId) {
      return res.status(400).json({
        success: false,
        message: "counterId is required",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(counterId)) {
      return res.status(400).json({
        success: false,
        message: "counterId must be a valid ObjectId",
      });
    }

    // Fetch processed tokens (Completed or Skipped) for this counter, sorted by most recent
    const tokens = await Token.find({
      counterId: new mongoose.Types.ObjectId(counterId),
      status: { $in: ["Completed", "Skipped"] },
    })
      .select("tokenNumber status serviceName completedAt skippedAt createdAt")
      .sort({ completedAt: -1, skippedAt: -1, createdAt: -1 })
      .limit(limit)
      .lean();

    return res.status(200).json({
      success: true,
      tokens: tokens || [],
    });
  } catch (error) {
    console.error("getProcessedTokensByCounter error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};