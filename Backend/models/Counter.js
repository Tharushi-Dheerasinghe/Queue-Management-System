import mongoose from "mongoose";

const counterSchema = new mongoose.Schema(
  {
    tenantType: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      index: true,
    },

    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
      index: true,
    },

    divisionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      default: null,
      index: true,
    },

    branchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Branch",
      required: true,
      index: true,
    },

    serviceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Service",
      default: null,
      index: true,
    },

    counterName: {
      type: String,
      required: true,
      trim: true,
    },

    assignedStaffId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },

    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
      trim: true,
      index: true,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },
  },
  { timestamps: true }
);

// Ensure counter names are unique per branch.
counterSchema.index({ branchId: 1, counterName: 1 }, { unique: true });

// Common scoped lookup paths.
counterSchema.index({ tenantType: 1, organizationId: 1, branchId: 1 });
counterSchema.index({ tenantType: 1, divisionId: 1, branchId: 1 });

const Counter = mongoose.model("Counter", counterSchema);

export default Counter;
