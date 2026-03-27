import { connectDB } from "../lib/db";
import OrderItem from "../models/OrderItem";
import mongoose from "mongoose";

export async function createOrderItem(data: any) {
  await connectDB();

  const existing = await OrderItem.findOne({
    user_id: data.user_id,
    product_id: data.product_id,
  });

  // 🔥 Prevent duplicate items
  if (existing) {
    existing.quantity += data.quantity;
    await existing.save();
    return existing;
  }

  const item = await OrderItem.create({
    user_id: data.user_id,
    product_id: new mongoose.Types.ObjectId(data.product_id),
    quantity: data.quantity,
  });

  return item;
}

//new lane
export async function getOrderItemsByUser(userId: string) {
  await connectDB();

  return OrderItem.find({ user_id: userId })
    .populate("product_id")
    .lean();
}

export async function getOrderItemsByOrder(orderId: string) {
  await connectDB();

  return OrderItem.find({
    order_id: orderId
  }).lean();
}

export async function getOrderItemById(id: string) {
  await connectDB();

  return OrderItem.find().populate("product_id");
}

//update
export async function updateOrderItem(id: string, data: any) {
  await connectDB();

  return OrderItem.findByIdAndUpdate(
    id,
    {
      quantity: data.quantity
    },
    { new: true }
  ).lean();
}

//delete
export async function deleteOrderItem(id: string) {
  await connectDB();

  return OrderItem.findByIdAndDelete(id);
}
//delete item user kalo udh checkout
export async function deleteOrderItemsByUser(userId: string) {
  await connectDB();

  await OrderItem.deleteMany({ user_id: userId });
}