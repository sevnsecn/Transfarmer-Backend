import { Schema } from "mongoose";
import { connectOrderDB } from "../lib/orderDb";

const ProductSchema = new Schema(
  {
    farm_id: {
      type: Schema.Types.ObjectId,
      ref: "Farm",
      required: true,
    },
    product_name: {
      type: String,
      required: true,
    },
    price_per_kg: {
      type: Number,
      required: true,
    },
    stock_kg: {
      type: Number,
      required: true,
    },
    product_image: {
      type: String,
    },
  },
  { timestamps: true }
);

export async function getOrderProductModel() {
  const conn = await connectOrderDB();

  return (
    conn.models.Product ||
    conn.model("Product", ProductSchema)
  );
}