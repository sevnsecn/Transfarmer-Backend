"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllProducts = getAllProducts;
exports.getProductById = getProductById;
exports.createProduct = createProduct;
exports.updateProduct = updateProduct;
exports.deleteProduct = deleteProduct;
const db_1 = require("../lib/db");
const Product_1 = __importDefault(require("../models/Product"));
const Farm_1 = __importDefault(require("../models/Farm"));
// Get all products with optional filters, farm info included
async function getAllProducts(filters = {}) {
    await (0, db_1.connectDB)();
    const query = {};
    if (filters.farm_id) {
        query.farm_id = filters.farm_id;
    }
    if (filters.search) {
        query.product_name = { $regex: filters.search, $options: "i" };
    }
    if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
        query.price_per_kg = {};
        if (filters.minPrice !== undefined)
            query.price_per_kg.$gte = filters.minPrice;
        if (filters.maxPrice !== undefined)
            query.price_per_kg.$lte = filters.maxPrice;
    }
    return Product_1.default.find(query).populate("farm_id").lean();
}
// Get a single product by its MongoDB _id
async function getProductById(id) {
    await (0, db_1.connectDB)();
    return Product_1.default.findById(id).populate("farm_id").lean();
}
// Create a new product (admin only)
async function createProduct(data) {
    await (0, db_1.connectDB)();
    const farm = await Farm_1.default.findById(data.farm_id);
    if (!farm)
        throw new Error("Farm not found");
    const product = await Product_1.default.create(data);
    return Product_1.default.findById(product._id).populate("farm_id").lean();
}
// Update a product by id (admin only)
async function updateProduct(id, data) {
    await (0, db_1.connectDB)();
    if (data.farm_id) {
        const farm = await Farm_1.default.findById(data.farm_id);
        if (!farm)
            throw new Error("Farm not found");
    }
    const product = await Product_1.default.findByIdAndUpdate(id, data, { new: true })
        .populate("farm_id")
        .lean();
    if (!product)
        throw new Error("Product not found");
    return product;
}
// Delete a product by id (admin only)
async function deleteProduct(id) {
    await (0, db_1.connectDB)();
    const product = await Product_1.default.findByIdAndDelete(id);
    if (!product)
        throw new Error("Product not found");
    return product;
}
