import mongoose, { Schema } from "mongoose";
import { connectProductDB } from "../lib/productDb";

const FarmSchema = new Schema(
  {
    farm_name: { type: String, required: true },
    farm_location: { type: String, required: true },
    farm_image: { type: String },
  },
  { timestamps: true }
);

export async function getProductFarmModel() {
  const conn = await connectProductDB();

  return (
    conn.models.Farm ||
    conn.model("Farm", FarmSchema)
  );
}