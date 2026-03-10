import { connectDB } from "../lib/db";
import OrderItem from "../models/OrderItem";
import mongoose from "mongoose";

export async function createOrderItem(data: any) {
  await connectDB();

  const item = await OrderItem.create({
    order_id: new mongoose.Types.ObjectId(data.order_id),
    items_id: new mongoose.Types.ObjectId(data.items_id),
    quantity: data.quantity,
    price: data.price
  });

  return OrderItem.findById(item._id).lean();
}

export async function getOrderItemsByOrder(orderId: string) {
  await connectDB();

  return OrderItem.find({
    order_id: orderId
  }).lean();
}

export async function getOrderItemById(id: string) {
  await connectDB();

  return OrderItem.findById(id).lean();
}

export async function updateOrderItem(id: string, data: any) {
  await connectDB();

  return OrderItem.findByIdAndUpdate(
    id,
    {
      ...data,
      items_id: data.items_id
        ? new mongoose.Types.ObjectId(data.items_id)
        : undefined
    },
    { new: true }
  ).lean();
}

export async function deleteOrderItem(id: string) {
  await connectDB();

  return OrderItem.findByIdAndDelete(id);
}