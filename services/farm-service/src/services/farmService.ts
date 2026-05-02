import { connectDB } from "../lib/db";
import Farm from "../models/Farm";

export type CreateFarmInput = {
  farm_name: string;
  farm_location: string;
  farm_image?: string;
};

export type UpdateFarmInput = Partial<CreateFarmInput>;

export async function getAllFarms() {
  await connectDB();
  return Farm.find().lean();
}

export async function getFarmById(id: string) {
  await connectDB();
  return Farm.findById(id).lean();
}

export async function createFarm(data: CreateFarmInput) {
  await connectDB();
  return Farm.create(data);
}

export async function updateFarm(id: string, data: UpdateFarmInput) {
  await connectDB();
  const farm = await Farm.findByIdAndUpdate(id, data, { new: true }).lean();
  if (!farm) throw new Error("Farm not found");
  return farm;
}

export async function deleteFarm(id: string) {
  await connectDB();
  const farm = await Farm.findByIdAndDelete(id);
  if (!farm) throw new Error("Farm not found");
  return farm;
}