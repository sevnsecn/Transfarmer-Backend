import { connectDB } from "../lib/db";
import Order from "../models/Order";
import { getOrderItemsByUser, deleteOrderItemsByUser } from "../services/orderItemService";
import { getUserById } from "../services/userService";

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
export async function checkoutOrder(userId: string) {
  await connectDB();

  const cartItems = await getOrderItemsByUser(userId);

  if (!cartItems.length) {
    throw new Error("Cart is empty");
  }

  const user = await getUserById(userId);

  if (!user?.address) {
    throw new Error("Address not set");
  }

  const total = cartItems.reduce(
    (sum, item) =>
      sum + item.quantity * item.product_id.price_per_kg,
    0
  );

  const order = await Order.create({
    user_id: userId,
    items: cartItems.map(item => ({
      product_id: item.product_id._id,
      quantity: item.quantity,
      price: item.product_id.price_per_kg,
    })),
    total_price: total,
    address: user.address,
    status: "pending",
  });

  await deleteOrderItemsByUser(userId);

  return order;
}
//supaya user bisa liet orderannya
export async function getOrdersByUser(userId: string) {
  await connectDB();

  return Order.find({ user_id: userId }).lean();
}