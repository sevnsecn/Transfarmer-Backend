import mongoose, { Schema, Document } from "mongoose";

export interface IFarm extends Document {
  farm_name: string;
  farm_location: string;
  farm_image?: string;
}

const FarmSchema = new Schema<IFarm>(
  {
    farm_name: { type: String, required: true },
    farm_location: { type: String, required: true },
    farm_image: { type: String },
  },
  { timestamps: true }
);

export default mongoose.models.Farm || mongoose.model<IFarm>("Farm", FarmSchema);