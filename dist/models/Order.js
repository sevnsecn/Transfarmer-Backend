"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const OrderSchema = new mongoose_1.default.Schema({
    user_id: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    order_date: {
        type: Date,
        default: Date.now,
    },
    order_status: {
        type: String,
        enum: ["cart", "pending", "confirmed", "delivered"],
        default: "cart",
    },
    subtotal: {
        type: Number,
        required: true,
        default: 0,
        min: 0,
    },
}, { timestamps: true });
exports.default = mongoose_1.default.models.Order || mongoose_1.default.model("Order", OrderSchema);
