import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    password: {
      type: String,
      required: true,
    },

    phone: {
      type: String,
      trim: true,
      default: "",
    },

    username: {
      type: String,
      trim: true,
      default: "",
    },

    role: {
      type: String,
      enum: [
        "user",
        "customer",
        "organization_admin",
        "branch_admin",
        "staff",
        "hospital_super_admin",
        "police_super_admin",
        "company_super_admin",
        "police_division_admin",
        "police_branch_admin",
        "police_staff",
      ],
      required: true,
    },

    tenantType: {
      type: String,
      enum: ["hospital", "police", "bank", "supermarket","company", null],
      default: null,
      required: function () {
        return this.role === "staff";
      },
    },

    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
      required: function () {
        if (this.role !== "staff") {
          return false;
        }

        return (
          ["bank", "supermarket", "hospital", "company"].includes(
            String(this.tenantType || "").trim().toLowerCase()
          )
        );
      },
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
      required: function () {
        return false;
      },
    },

    divisionName: {
      type: String,
      default: null,
      trim: true,
    },

    branchId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
      required: function () {
        return this.role === "staff";
      },
    },

    branchName: {
      type: String,
      default: null,
      trim: true,
      required: function () {
        return this.role === "staff";
      },
    },

    status: {
      type: String,
      enum: ["active", "inactive", "pending"],
      default: "active",
    },
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);

export default User;