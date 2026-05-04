import mongoose from "mongoose";

const tokenSchema = new mongoose.Schema({
  tenantType: {
    type: String,
    required: true,
    trim: true,
  },
  organizationId: {
    type: mongoose.Schema.Types.ObjectId,
    default: null,
    index: true,
  },
  branchId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Branch",
    default: null,
    index: true,
  },
  serviceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Service",
    default: null,
    index: true,
  },
  organizationName: {
    type: String,
    default: "",
    trim: true,
  },
  branchName: {
    type: String,
    default: "",
    trim: true,
  },
  serviceName: {
    type: String,
    default: "",
    trim: true,
  },
  organization: {
    type: String,
    required: true,
    trim: true,
  },
  branch: {
    type: String,
    required: true,
    trim: true,
  },
  service: {
    type: String,
    required: true,
    trim: true,
  },

  fullName: {
    type: String,
    required: true,
    trim: true,
  },
  mobile: {
    type: String,
    required: true,
    trim: true,
  },

  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true,
  },
  note: {
    type: String,
    default: "",
    trim: true,
  },

  tokenPrefix: {
    type: String,
    required: true,
    uppercase: true,
    trim: true,
  },

  tokenNumber: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true,
  },

  sequenceNumber: {
    type: Number,
    required: true,
    min: 1,
  },

  status: {
    type: String,
    default: "Waiting",
  },
  skippedAt: {
    type: Date,
    default: null,
  },
  counterId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Counter",
    default: null,
    index: true,
  },
  startedAt: {
    type: Date,
    default: null,
  },
  completedAt: {
    type: Date,
    default: null,
  },

  currentToken: {
    type: String,
    default: "",
  },

  peopleAhead: {
    type: Number,
    default: 0,
    min: 0,
  },

  estimatedWait: {
    type: String,
    default: "",
  },

  createdAt: {
    type: Date,
    default: Date.now,
  },
});

tokenSchema.index(
  {
    tenantType: 1,
    organizationId: 1,
    branchId: 1,
    serviceId: 1,
    sequenceNumber: 1,
  },
  {
    unique: true,
    partialFilterExpression: {
      organizationId: { $type: "objectId" },
      branchId: { $type: "objectId" },
      serviceId: { $type: "objectId" },
    },
  }
);

tokenSchema.index({ tenantType: 1, organizationId: 1, branchId: 1, serviceId: 1, createdAt: -1 });
tokenSchema.index({ tenantType: 1, organization: 1, branch: 1, service: 1, createdAt: -1 });

const Token = mongoose.model("Token", tokenSchema);

export default Token;