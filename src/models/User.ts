import mongoose, { Schema, model, models } from "mongoose";

const UserSchema = new Schema(
  {
    user_name: { type: String, required: true },
    user_email: { type: String, required: true, unique: true },
    password_hash: { type: String, required: true },
    is_admin: { type: Boolean, default: false },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: false },
  }
);

export default models.User || model("User", UserSchema);