import mongoose from "mongoose";

let orderConn: mongoose.Connection | null = null;

export async function connectOrderDB() {
  if (orderConn) return orderConn;

  const ORDER_DB_URI = process.env.ORDER_DB_URI;

  if (!ORDER_DB_URI) {
    throw new Error("Missing ORDER_DB_URI");
  }

  orderConn = await mongoose
    .createConnection(ORDER_DB_URI)
    .asPromise();

  return orderConn;
}