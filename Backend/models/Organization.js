import mongoose from "mongoose";

// Shared parent model for all tenants.
// Police tenants are stored here as regular organizations with optional
// police-specific metadata (for example divisionName, district, province, category).

const ORGANIZATION_TENANT_TYPES = ["police", "bank", "supermarket", "hospital", "salon", "pharmacy"];
const ORGANIZATION_STATUSES = ["pending", "approved", "active", "inactive", "rejected"];

const queueSettingsSchema = new mongoose.Schema(
  {
    bookingType: {
      type: String,
      enum: ["token", "appointment"],
      default: "token",
      trim: true,
      lowercase: true,
    },
    tokenPrefix: {
      type: String,
      default: "",
      trim: true,
    },
    maxDailyTokens: {
      type: Number,
      default: 0,
      min: 0,
    },
    priorityEnabled: {
      type: Boolean,
      default: false,
    },
  },
  { _id: false }
);

const organizationSchema = new mongoose.Schema(
  {
    tenantType: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      index: true,
    },

    organizationName: {
      type: String,
      required: true,
      trim: true,
    },

    shortName: {
      type: String,
      default: "",
      trim: true,
    },

    divisionName: {
      type: String,
      default: "",
      trim: true,
    },

    organizationCode: {
      type: String,
      trim: true,
      uppercase: true,
      unique: true,
      sparse: true,
    },

    district: {
      type: String,
      default: "",
      trim: true,
    },

    province: {
      type: String,
      default: "",
      trim: true,
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
      trim: true,
      lowercase: true,
    },

    category: {
      type: String,
      default: "",
      trim: true,
    },

    queueSettings: {
      type: queueSettingsSchema,
      default: () => ({}),
    },

    branding: {
      type: {
        logoUrl: { type: String, default: "" },
        primaryColor: { type: String, default: "#2563eb" },
        welcomeText: { type: String, default: "" }
      },
      default: () => ({
        logoUrl: "",
        primaryColor: "#2563eb",
        welcomeText: ""
      })
    },

    status: {
      type: String,
      enum: ORGANIZATION_STATUSES,
      default: "active",
      trim: true,
      lowercase: true,
      index: true,
    },

    approvedAt: {
      type: Date,
      default: null,
    },

    subscriptionExpiresAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

organizationSchema.index({ tenantType: 1, organizationName: 1 });
organizationSchema.index({ tenantType: 1, city: 1, status: 1 });

const Organization = mongoose.model("Organization", organizationSchema);

export default Organization;
