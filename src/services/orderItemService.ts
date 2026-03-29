import { connectDB } from "../lib/db";
import OrderItem from "../models/OrderItem";
import mongoose from "mongoose";
import Order from "../models/Order";
import Product from "../models/Product";

async function ensureCartOrder(userId: string) {
  await connectDB();

  let cartOrder = await Order.findOne({ user_id: userId, order_status: "cart" });
  if (!cartOrder) {
    cartOrder = await Order.create({
      user_id: userId,
      order_status: "cart",
      subtotal: 0,
      order_date: new Date(),
    });
  }

  return cartOrder;
}

async function refreshOrderSubtotal(orderId: string) {
  await connectDB();

  const items = await OrderItem.find({ order_id: orderId }).populate("product_id").lean();

  const subtotal = items.reduce((sum, item: any) => {
    return sum + (item.quantity_kg || 0) * (item.product_id?.price_per_kg || 0);
  }, 0);

  await Order.findByIdAndUpdate(orderId, { subtotal });

  return subtotal;
}

export async function createOrderItem(data: {
  user_id: string;
  product_id: string;
  quantity: number;
}) {
  await connectDB();

  const cartOrder = await ensureCartOrder(data.user_id);

  const existing = await OrderItem.findOne({
    order_id: cartOrder._id,
    product_id: data.product_id,
  });

  if (existing) {
    existing.quantity_kg += data.quantity;
    await existing.save();

    await refreshOrderSubtotal(String(cartOrder._id));
    return existing;
  }

  const productExists = await Product.findById(data.product_id);
  if (!productExists) {
    throw new Error("Product not found");
  }

  const item = await OrderItem.create({
    order_id: cartOrder._id,
    product_id: new mongoose.Types.ObjectId(data.product_id),
    quantity_kg: data.quantity,
  });

  await refreshOrderSubtotal(String(cartOrder._id));

  return item;
}

export async function getOrderItemsByUser(userId: string) {
  await connectDB();

  const cartOrder = await Order.findOne({ user_id: userId, order_status: "cart" });
  if (!cartOrder) {
    return [];
  }

  return OrderItem.find({ order_id: cartOrder._id })
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

  return OrderItem.findById(id).populate("product_id").lean();
}

export async function updateOrderItem(id: string, data: { quantity: number }) {
  await connectDB();

  const updated = await OrderItem.findByIdAndUpdate(
    id,
    {
      quantity_kg: data.quantity,
    },
    { new: true }
  ).lean();

  if (updated?.order_id) {
    await refreshOrderSubtotal(String(updated.order_id));
  }

  return updated;
}

export async function deleteOrderItem(id: string) {
  await connectDB();

  const deleted = await OrderItem.findByIdAndDelete(id).lean();

  if (deleted?.order_id) {
    await refreshOrderSubtotal(String(deleted.order_id));
  }

  return deleted;
}

export async function deleteOrderItemsByUser(userId: string) {
  await connectDB();

  const cartOrder = await Order.findOne({ user_id: userId, order_status: "cart" });
  if (!cartOrder) return;

  await OrderItem.deleteMany({ order_id: cartOrder._id });
  await Order.findByIdAndUpdate(cartOrder._id, { subtotal: 0 });
}