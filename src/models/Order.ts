import mongoose from "mongoose";

const OrderSchema = new mongoose.Schema(
  {
    user_id: {
      type: String,
      required: true
    },
    status: {
      type: String,
      default: "pending"
    },
    total_price: {
      type: Number,
      required: true
    }
  },
  { timestamps: true }
);

export default mongoose.models.Order || mongoose.model("Order", OrderSchema);