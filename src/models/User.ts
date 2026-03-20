import mongoose, { Schema, model, models } from "mongoose";

const AddressSchema = new Schema({ //schema alamat
  full_name: String,
  phone: String,
  address_line: String,
  city: String,
  postal_code: String,
});

const UserSchema = new Schema(
  {
    user_name: { type: String, required: true },
    user_email: { type: String, required: true, unique: true },
    password_hash: { type: String, required: true },
    is_admin: { type: Boolean, default: false },

    address: AddressSchema, // buat alamat
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: false },
  }
);

export default models.User || model("User", UserSchema);