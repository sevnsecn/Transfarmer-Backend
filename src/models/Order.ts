import mongoose from "mongoose";

const OrderSchema = new mongoose.Schema(
  {
    user_id: {
      type: String,
      required: true
    },

     items: [
      {
        product_id: String,
        quantity: Number,
        price: Number
      }
    ],


    address: {
      full_name: String,
      phone: String,
      address_line: String,
      city: String,
      postal_code: String,
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