import mongoose from "mongoose";

const serviceSchema = new mongoose.Schema(
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

    divisionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      default: null,
    },

    branchIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Branch',
        default: []
      }
    ],
    
    isDivisionService: {
      type: Boolean,
      default: false,
    },

    serviceName: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      default: "",
      trim: true,
    },

    workingDays: {
      type: [String],
      default: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
    },

    availableDates: {
      type: [String],
      default: [],
    },

    isClosed: {
      type: Boolean,
      default: false,
    },

    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
      trim: true,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  { timestamps: true }
);

serviceSchema.index({ tenantType: 1, divisionId: 1, createdAt: -1 });
serviceSchema.index({ tenantType: 1, organizationId: 1, createdAt: -1 });

const Service = mongoose.model("Service", serviceSchema);

export default Service;