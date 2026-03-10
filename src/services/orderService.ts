import { connectDB } from "../lib/db";
import Order from "../models/Order";

export type CreateOrderInput = {
  user_id: string;
  status: string;
  total_price: number;
};

export interface UpdateOrderInput {
  status?: "cart" | "pending" | "confirmed" | "delivered";
  total_price?: number;
}

// GET
export async function getAllOrders() {
  await connectDB();
  return Order.find().lean();
}

// GET by id
export async function getOrderById(id: string) {
  await connectDB();
  return await Order.findById(id).lean();
}

//POST
export async function createOrder(data: CreateOrderInput) {
  await connectDB();

  const order = await Order.create(data);

  return Order.findById(order._id).lean();
}

// PUT
export async function updateOrder(id: string, data: UpdateOrderInput) {
  await connectDB();

  const order = await Order.findByIdAndUpdate(
    id,
    data,
    {
      returnDocument: "after", // replaces deprecated new:true
      runValidators: true
    }
  ).lean();

  if (!order) {
    throw new Error("Order not found");
  }

  return order;
}

//DELETE
export async function deleteOrder(id: string) {
  await connectDB();

  const order = await Order.findByIdAndDelete(id);

  if (!order) throw new Error("Order not found");

  return order;
}

//checkout order
export async function checkoutOrder(orderId: string) {
  const order = await Order.findById(orderId);

  if (!order) {
    throw new Error("Order not found");
  }

  // change cart to pending
  order.order_status = "pending";

  await order.save();

  return order;
}