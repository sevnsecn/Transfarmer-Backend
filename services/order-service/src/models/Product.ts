import mongoose, { Schema, Document, Model, Types } from "mongoose";

export interface IProduct extends Document {
  farm_id: Types.ObjectId;
  product_name: string;
  price_per_kg: number;
  stock_kg: number;
  product_image?: string;
}

const ProductSchema = new Schema<IProduct>(
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
      min: 0,
    },
    stock_kg: {
      type: Number,
      required: true,
      min: 0,
    },
    product_image: {
      type: String,
    },
  },
  { timestamps: true }
);

const Product: Model<IProduct> =
  mongoose.models.Product || mongoose.model<IProduct>("Product", ProductSchema);

export default Product;