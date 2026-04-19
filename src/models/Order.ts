import mongoose from "mongoose";

const OrderSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    order_date: {
      type: Date,
      default: Date.now,
    },

    order_status: {
      type: String,
      enum: ["cart", "pending", "confirmed", "delivered", "completed"],
      default: "cart",
    },

    subtotal: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
  },
  { timestamps: true }
);

export default mongoose.models.Order || mongoose.model("Order", OrderSchema);