import { connectDB } from "../lib/db";
import Product from "../models/Product";
import "../models/Farm";

export type CreateProductInput = {
  farm_id: string;
  product_name: string;
  price_per_kg: number;
  stock_kg: number;
  product_image?: string;
};

export type UpdateProductInput = Partial<CreateProductInput>;

export type ProductFilters = {
  farm_id?: string;
  search?: string;
  minPrice?: number;
  maxPrice?: number;
};

// Get all products with optional filters, farm info included
export async function getAllProducts(filters: ProductFilters = {}) {
  await connectDB();

  const query: any = {};

  if (filters.farm_id) {
    query.farm_id = filters.farm_id;
  }

  if (filters.search) {
    query.product_name = { $regex: filters.search, $options: "i" };
  }

  if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
    query.price_per_kg = {};
    if (filters.minPrice !== undefined) query.price_per_kg.$gte = filters.minPrice;
    if (filters.maxPrice !== undefined) query.price_per_kg.$lte = filters.maxPrice;
  }

  return Product.find(query).populate("farm_id").lean(); 
}

// Get a single product by its MongoDB _id
export async function getProductById(id: string) {
  await connectDB();
  return Product.findById(id).populate("farm_id").lean();
}

// Create a new product (admin only)
// Create a new product (admin only)
export async function createProduct(data: CreateProductInput) {
  await connectDB();

  const product = await Product.create(data);

  const populatedProduct = await Product.findById(product._id)
    .populate("farm_id")
    .lean();

  // sync to order-db
  try {
    await fetch(`${process.env.ORDER_SERVICE_URL}/internal/products/${product._id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(populatedProduct),
    });
  } catch (err) {
    console.error("Failed to sync created product to order-service:", err);
  }

  return populatedProduct;
}

// Update a product by id (admin only)
export async function updateProduct(id: string, data: UpdateProductInput) {
  await connectDB();

  const product = await Product.findByIdAndUpdate(id, data, { new: true })
    .populate("farm_id")
    .lean();

  if (!product) throw new Error("Product not found");

  // sync to order-db
  try {
    await fetch(`${process.env.ORDER_SERVICE_URL}/internal/products/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(product),
    });
  } catch (err) {
    console.error("Failed to sync updated product to order-service:", err);
  }

  return product;
}

// Delete a product by id (admin only)
export async function deleteProduct(id: string) {
  await connectDB();

  const product = await Product.findByIdAndDelete(id);

  if (!product) throw new Error("Product not found");

  // sync delete to order-db
  try {
    await fetch(`${process.env.ORDER_SERVICE_URL}/internal/products/${id}`, {
      method: "DELETE",
    });
  } catch (err) {
    console.error("Failed to sync deleted product to order-service:", err);
  }

  return product;
}