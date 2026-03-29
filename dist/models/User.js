"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const AddressSchema = new mongoose_1.Schema({
    full_name: String,
    phone: String,
    address_line: String,
    city: String,
    postal_code: String,
});
const UserSchema = new mongoose_1.Schema({
    user_name: { type: String, required: true },
    user_email: { type: String, required: true, unique: true },
    password_hash: { type: String, required: true },
    is_admin: { type: Boolean, default: false },
    address: AddressSchema, // buat alamat
}, {
    timestamps: { createdAt: "created_at", updatedAt: false },
});
exports.default = mongoose_1.models.User || (0, mongoose_1.model)("User", UserSchema);
