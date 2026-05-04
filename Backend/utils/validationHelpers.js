import mongoose from "mongoose";

export const requireFields = (object = {}, fields = []) => {
  const missingFields = fields.filter((field) => {
    const value = object?.[field];
    return value === undefined || value === null || String(value).trim() === "";
  });

  return missingFields;
};

export const isValidObjectId = (value) => {
  if (value === undefined || value === null || value === "") {
    return false;
  }

  return mongoose.Types.ObjectId.isValid(value);
};
