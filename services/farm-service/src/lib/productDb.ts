import mongoose from "mongoose";

let productConn: mongoose.Connection | null = null;

export async function connectProductDB() {
  if (productConn) return productConn;

  const PRODUCT_DB_URI = process.env.PRODUCT_DB_URI;

  if (!PRODUCT_DB_URI) {
    throw new Error("Missing PRODUCT_DB_URI");
  }

  const conn = await mongoose.createConnection(PRODUCT_DB_URI).asPromise();

  productConn = conn;

  return conn;
}