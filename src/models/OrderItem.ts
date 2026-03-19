import mongoose from "mongoose";

const OrderItemSchema = new mongoose.Schema(
  {
    user_id: {
      type: String, // from JWT
      required: true,
    },
    product_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
  },
  { timestamps: true }
);

export default mongoose.models.Order_Items ||
  mongoose.model("Order_Items", OrderItemSchema);