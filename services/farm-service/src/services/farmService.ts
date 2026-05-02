import { connectDB } from "../lib/db";
import Farm from "../models/Farm";
import { getProductFarmModel } from "../models/ProductFarm";

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

  const farm = await Farm.create(data);

  const ProductFarm = await getProductFarmModel();

  await ProductFarm.create({
    _id: farm._id,
    farm_name: farm.farm_name,
    farm_location: farm.farm_location,
    farm_image: farm.farm_image,
  });

  return farm;
}

export async function updateFarm(id: string, data: UpdateFarmInput) {
  await connectDB();

  const farm = await Farm.findByIdAndUpdate(id, data, {
    new: true,
  }).lean();

  if (!farm) throw new Error("Farm not found");

  const ProductFarm = await getProductFarmModel();

  await ProductFarm.findByIdAndUpdate(id, data);

  return farm;
}

export async function deleteFarm(id: string) {
  await connectDB();

  const farm = await Farm.findByIdAndDelete(id);

  if (!farm) throw new Error("Farm not found");

  const ProductFarm = await getProductFarmModel();

  await ProductFarm.findByIdAndDelete(id);

  return farm;
}