import mongoose from "mongoose";

const branchRequestSchema = new mongoose.Schema(
  {
    tenantType: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },

    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },

    organizationName: {
      type: String,
      default: null,
      trim: true,
    },

    divisionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      default: null,
    },

    divisionName: {
      type: String,
      default: null,
      trim: true,
    },

    branchName: {
      type: String,
      required: true,
      trim: true,
    },

    shortName: {
      type: String,
      default: "",
      trim: true,
    },

    branchCode: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
      default: null,
    },

    city: {
      type: String,
      default: "",
      trim: true,
    },

    address: {
      type: String,
      default: "",
      trim: true,
    },

    contactNumber: {
      type: String,
      default: "",
      trim: true,
    },

    email: {
      type: String,
      default: "",
      lowercase: true,
      trim: true,
    },

    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
      lowercase: true,
      trim: true,
    },

    requestedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    requestedByRole: {
      type: String,
      enum: ["organization_admin"],
      required: true,
      trim: true,
      lowercase: true,
    },

    branchAdminAccess: {
      type: Boolean,
      default: false,
    },

    adminName: {
      type: String,
      default: "",
      trim: true,
    },

    adminEmail: {
      type: String,
      default: "",
      lowercase: true,
      trim: true,
    },

    adminPhone: {
      type: String,
      default: "",
      trim: true,
    },

    adminUsername: {
      type: String,
      default: "",
      trim: true,
    },

    adminPassword: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

branchRequestSchema.path("organizationId").required(function () {
  return this.tenantType !== "police";
});

branchRequestSchema.path("divisionId").required(function () {
  return false;
});

branchRequestSchema.path("adminName").required(function () {
  return this.branchAdminAccess;
});

branchRequestSchema.path("adminEmail").required(function () {
  return this.branchAdminAccess;
});

branchRequestSchema.path("adminPhone").required(function () {
  return this.branchAdminAccess;
});

branchRequestSchema.path("adminUsername").required(function () {
  return this.branchAdminAccess;
});

branchRequestSchema.path("adminPassword").required(function () {
  return this.branchAdminAccess;
});

branchRequestSchema.index({ tenantType: 1, status: 1 });
branchRequestSchema.index({ requestedBy: 1, createdAt: -1 });
branchRequestSchema.index({ organizationId: 1, divisionId: 1 });

const BranchRequest = mongoose.model("BranchRequest", branchRequestSchema);

export default BranchRequest;