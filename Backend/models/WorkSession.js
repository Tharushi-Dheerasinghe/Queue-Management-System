import mongoose from "mongoose";

const workSessionSchema = new mongoose.Schema(
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

    staffId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    staffName: {
      type: String,
      required: true,
      trim: true,
    },

    serviceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Service",
      default: null,
      index: true,
    },

    serviceName: {
      type: String,
      default: "",
      trim: true,
    },

    counterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Counter",
      default: null,
      index: true,
    },

    counterName: {
      type: String,
      default: "",
      trim: true,
    },

    status: {
      type: String,
      enum: ["active", "completed"],
      default: "active",
      required: true,
      trim: true,
      index: true,
    },

    startedAt: {
      type: Date,
      required: true,
      default: Date.now,
      index: true,
    },

    endedAt: {
      type: Date,
      default: null,
    },

    durationMinutes: {
      type: Number,
      default: null,
      min: 0,
    },
  },
  { timestamps: true }
);

workSessionSchema.pre("validate", function () {
  if (this.status === "completed") {
    if (!this.endedAt) {
      throw new Error("endedAt is required when status is completed");
    }

    if (this.startedAt && this.endedAt < this.startedAt) {
      throw new Error("endedAt cannot be earlier than startedAt");
    }

    if (this.durationMinutes == null && this.startedAt && this.endedAt) {
      const diffMs = this.endedAt.getTime() - this.startedAt.getTime();
      this.durationMinutes = Math.max(0, Math.round(diffMs / 60000));
    }
  }
});

workSessionSchema.index({ branchId: 1, staffId: 1, status: 1, startedAt: -1 });
workSessionSchema.index({ tenantType: 1, organizationId: 1, branchId: 1, startedAt: -1 });
workSessionSchema.index({ tenantType: 1, divisionId: 1, branchId: 1, startedAt: -1 });

const WorkSession = mongoose.model("WorkSession", workSessionSchema);

export default WorkSession;
