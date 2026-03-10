import mongoose from "mongoose";

const OrderItemSchema = new mongoose.Schema({
  order_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Order",
    required: true
  },
  items_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  price: {
    type: Number,
    required: true
  }
}, { timestamps: true });

export default mongoose.models.Order_Items ||
  mongoose.model("Order_Items", OrderItemSchema);