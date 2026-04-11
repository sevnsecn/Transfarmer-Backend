import { connectDB } from "../lib/db";
import Order from "../models/Order";
import { getOrderItemsByOrder, getOrderItemsByUser } from "../services/orderItemService";
import { getUserById } from "../services/userService";

export type CreateOrderInput = {
  user_id: string;
  status?: "cart" | "pending" | "confirmed" | "delivered";
  total_price?: number;
};

export interface UpdateOrderInput {
  status?: "cart" | "pending" | "confirmed" | "delivered";
  total_price?: number;
}

async function formatOrder(order: any) {
  const itemsRaw = await getOrderItemsByOrder(String(order._id));

  const user = await getUserById(order.user_id);

  const items = itemsRaw.map((item: any) => ({
    _id: item._id,
    product_id: String(item.product_id?._id || item.product_id),
    product_name:
      item.product_id?.product_name ||
      item.product_id?.name ||
      "Unknown Product",
    quantity: item.quantity_kg,
    price: item.product_id?.price_per_kg || 0,
  }));

  return {
    _id: order._id,
    user_id: order.user_id,
    user_name: user?.user_name || "Unknown User",
    address: user?.address || null,
    status: order.order_status,
    total_price: order.subtotal,
    items,
  };
}

async function getCartOrderByUser(userId: string) {
  let cart = await Order.findOne({ user_id: userId, order_status: "cart" });
  if (!cart) {
    cart = await Order.create({
      user_id: userId,
      order_status: "cart",
      subtotal: 0,
      order_date: new Date(),
    });
  }
  return cart;
}

// GET
export async function getAllOrders() {
  await connectDB();
  const orders = await Order.find({ order_status: { $ne: "cart" } }).lean();
  return Promise.all(orders.map(formatOrder));
}

// GET by id
export async function getOrderById(id: string) {
  await connectDB();
  const order = await Order.findById(id).lean();
  if (!order) return null;
  return formatOrder(order);
}

//POST
export async function createOrder(data: CreateOrderInput) {
  await connectDB();

  const order = await Order.create({
    user_id: data.user_id,
    order_status: data.status || "pending",
    subtotal: data.total_price || 0,
    order_date: new Date(),
  });

  const created = await Order.findById(order._id).lean();
  return created ? formatOrder(created) : null;
}

// PUT
export async function updateOrder(id: string, data: UpdateOrderInput) {
  await connectDB();

  const order = await Order.findByIdAndUpdate(
    id,
    {
      ...(data.status && { order_status: data.status }),
      ...(data.total_price !== undefined && { subtotal: data.total_price }),
    },
    {
      returnDocument: "after", // replaces deprecated new:true
      runValidators: true
    }
  ).lean();

  if (!order) {
    throw new Error("Order not found");
  }

  return formatOrder(order);
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

  const cartOrder = await getCartOrderByUser(userId);
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
      sum + item.quantity_kg * item.product_id.price_per_kg,
    0
  );

  const updated = await Order.findByIdAndUpdate(
    cartOrder._id,
    {
      order_status: "pending",
      subtotal: total,
      order_date: new Date(),
    },
    { returnDocument: "after" }
  ).lean();

  if (!updated) {
    throw new Error("Order not found");
  }

  return formatOrder(updated);
}

export async function getOrdersByUser(userId: string) {
  await connectDB();

  const orders = await Order.find({ user_id: userId, order_status: { $ne: "cart" } }).lean();
  return Promise.all(orders.map(formatOrder));
}