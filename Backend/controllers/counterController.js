import Counter from "../models/Counter.js";
import Service from "../models/Service.js";
import { getBranchScope, isBranchAdmin, normalizeTenantType } from "../utils/scopeHelpers.js";

const normalizeText = (value = "") => String(value || "").trim();

export const createCounter = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "User authentication required",
      });
    }

    if (!isBranchAdmin(req.user)) {
      return res.status(403).json({
        success: false,
        message: "Only branch_admin can create counters",
      });
    }

    const { counterName, serviceId } = req.body || {};

    // counterName පමණක් අනිවාර්ය කරමු
    if (!counterName) {
      return res.status(400).json({
        success: false,
        message: "counterName is required",
      });
    }

    const branchScope = getBranchScope(req.user || {});
    if (!branchScope.branchId) {
      return res.status(400).json({
        success: false,
        message: "Branch admin branch scope is missing",
      });
    }

    const requesterTenantType = normalizeTenantType(req.user.tenantType);
    const organizationId = branchScope.organizationId || req.user.organizationId || null;

    // --- පවතින Service එකක් තිබේ නම් පමණක් පරීක්ෂා කිරීම ---
    if (serviceId) {
      const service = await Service.findById(serviceId)
        .select("_id tenantType organizationId divisionId branchIds serviceName status")
        .lean();

      if (!service) {
        return res.status(404).json({
          success: false,
          message: "Service not found",
        });
      }

      const serviceTenantType = normalizeTenantType(service.tenantType);
      if (serviceTenantType !== requesterTenantType) {
        return res.status(403).json({
          success: false,
          message: "Selected service does not belong to your tenantType",
        });
      }

      const isServiceInBranch = Array.isArray(service.branchIds)
        && service.branchIds.some((id) => String(id) === String(branchScope.branchId));

      if (!isServiceInBranch) {
        return res.status(403).json({
          success: false,
          message: "Selected service does not belong to your branch",
        });
      }

      const serviceOrganizationId = service.organizationId || null;
      if (organizationId && serviceOrganizationId && String(serviceOrganizationId) !== String(organizationId)) {
        return res.status(403).json({
          success: false,
          message: "Selected service does not belong to your organization scope",
        });
      }
    }
    // --------------------------------------------------

    const trimmedCounterName = normalizeText(counterName);
    if (!trimmedCounterName) {
      return res.status(400).json({
        success: false,
        message: "counterName is required",
      });
    }

    const existingCounter = await Counter.findOne({
      branchId: branchScope.branchId,
      counterName: trimmedCounterName,
    })
      .select("_id")
      .lean();

    if (existingCounter) {
      return res.status(409).json({
        success: false,
        message: "Counter name already exists in this branch",
      });
    }

    // Counter එක නිර්මාණය කිරීම
    const counter = await Counter.create({
      tenantType: requesterTenantType,
      organizationId,
      branchId: branchScope.branchId,
      serviceId: serviceId || null, // serviceId නොමැති නම් null ලෙස save වේ
      counterName: trimmedCounterName,
      status: "inactive", // Status එක inactive ලෙස සකසා ඇත
      createdBy: req.user.id,
    });

    return res.status(201).json({
      success: true,
      message: "Counter created successfully",
      counter: {
        id: counter._id,
        tenantType: counter.tenantType,
        organizationId: counter.organizationId,
        branchId: counter.branchId,
        serviceId: counter.serviceId,
        counterName: counter.counterName,
        status: counter.status,
        createdBy: counter.createdBy,
      },
    });
  } catch (error) {
    if (error?.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Counter name already exists in this branch",
      });
    }

    console.error("createCounter error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while creating counter",
    });
  }
};

export const updateCounterScope = async (req, res) => {
  try {
    const { counterId } = req.params;
    const { status, serviceId } = req.body;

    // 1. Authentication & Permission Check
    if (!isBranchAdmin(req.user)) {
      return res.status(403).json({
        success: false,
        message: "Only branch_admin can update counters",
      });
    }

    const branchScope = getBranchScope(req.user || {});
    
    // 2. පවතින Counter එක සොයා ගැනීම සහ එය මෙම Branch එකට අයිතිදැයි බැලීම
    const counter = await Counter.findOne({
      _id: counterId,
      branchId: branchScope.branchId,
    });

    if (!counter) {
      return res.status(404).json({
        success: false,
        message: "Counter not found in your branch",
      });
    }

    const updateData = {};

    // 3. Status update කිරීමට අවශ්‍ය නම් (active/inactive පමණක් ඉඩ දීම)
    if (status) {
      const allowedStatus = ["active", "inactive"];
      if (!allowedStatus.includes(status)) {
        return res.status(400).json({
          success: false,
          message: "Invalid status value",
        });
      }
      updateData.status = status;
    }

    // 4. ServiceId update කිරීමට අවශ්‍ය නම්
    if (serviceId !== undefined) {
      // serviceId null කිරීමට අවශ්‍ය නම් (Unassign)
      if (serviceId === null) {
        updateData.serviceId = null;
      } else {
        // අලුත් Service එකක් Assign කරන්නේ නම් එය Validate කිරීම
        const service = await Service.findById(serviceId).lean();
        
        if (!service) {
          return res.status(404).json({
            success: false,
            message: "Target service not found",
          });
        }

        // Branch ownership check
        const isServiceInBranch = Array.isArray(service.branchIds)
          && service.branchIds.some((id) => String(id) === String(branchScope.branchId));

        if (!isServiceInBranch) {
          return res.status(403).json({
            success: false,
            message: "Selected service does not belong to your branch",
          });
        }
        updateData.serviceId = serviceId;
      }
    }

    // 5. Database එක Update කිරීම
    const updatedCounter = await Counter.findByIdAndUpdate(
      counterId,
      { $set: updateData },
      { new: true } // අලුත් දත්ත සමඟ object එක ලබා ගැනීමට
    );

    return res.status(200).json({
      success: true,
      message: "Counter updated successfully",
      counter: updatedCounter,
    });

  } catch (error) {
    console.error("updateCounterScope error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while updating counter",
    });
  }
};
