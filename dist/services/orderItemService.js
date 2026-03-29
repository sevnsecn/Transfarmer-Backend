"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createOrderItem = createOrderItem;
exports.getOrderItemsByUser = getOrderItemsByUser;
exports.getOrderItemsByOrder = getOrderItemsByOrder;
exports.getOrderItemById = getOrderItemById;
exports.updateOrderItem = updateOrderItem;
exports.deleteOrderItem = deleteOrderItem;
exports.deleteOrderItemsByUser = deleteOrderItemsByUser;
const db_1 = require("../lib/db");
const OrderItem_1 = __importDefault(require("../models/OrderItem"));
const mongoose_1 = __importDefault(require("mongoose"));
const Order_1 = __importDefault(require("../models/Order"));
const Product_1 = __importDefault(require("../models/Product"));
async function ensureCartOrder(userId) {
    await (0, db_1.connectDB)();
    let cartOrder = await Order_1.default.findOne({ user_id: userId, order_status: "cart" });
    if (!cartOrder) {
        cartOrder = await Order_1.default.create({
            user_id: userId,
            order_status: "cart",
            subtotal: 0,
            order_date: new Date(),
        });
    }
    return cartOrder;
}
async function refreshOrderSubtotal(orderId) {
    await (0, db_1.connectDB)();
    const items = await OrderItem_1.default.find({ order_id: orderId }).populate("product_id").lean();
    const subtotal = items.reduce((sum, item) => {
        return sum + (item.quantity_kg || 0) * (item.product_id?.price_per_kg || 0);
    }, 0);
    await Order_1.default.findByIdAndUpdate(orderId, { subtotal });
    return subtotal;
}
async function createOrderItem(data) {
    await (0, db_1.connectDB)();
    const cartOrder = await ensureCartOrder(data.user_id);
    const existing = await OrderItem_1.default.findOne({
        order_id: cartOrder._id,
        product_id: data.product_id,
    });
    if (existing) {
        existing.quantity_kg += data.quantity;
        await existing.save();
        await refreshOrderSubtotal(String(cartOrder._id));
        return existing;
    }
    const productExists = await Product_1.default.findById(data.product_id);
    if (!productExists) {
        throw new Error("Product not found");
    }
    const item = await OrderItem_1.default.create({
        order_id: cartOrder._id,
        product_id: new mongoose_1.default.Types.ObjectId(data.product_id),
        quantity_kg: data.quantity,
    });
    await refreshOrderSubtotal(String(cartOrder._id));
    return item;
}
async function getOrderItemsByUser(userId) {
    await (0, db_1.connectDB)();
    const cartOrder = await Order_1.default.findOne({ user_id: userId, order_status: "cart" });
    if (!cartOrder) {
        return [];
    }
    return OrderItem_1.default.find({ order_id: cartOrder._id })
        .populate("product_id")
        .lean();
}
async function getOrderItemsByOrder(orderId) {
    await (0, db_1.connectDB)();
    return OrderItem_1.default.find({
        order_id: orderId
    }).lean();
}
async function getOrderItemById(id) {
    await (0, db_1.connectDB)();
    return OrderItem_1.default.findById(id).populate("product_id").lean();
}
async function updateOrderItem(id, data) {
    await (0, db_1.connectDB)();
    const updated = await OrderItem_1.default.findByIdAndUpdate(id, {
        quantity_kg: data.quantity,
    }, { new: true }).lean();
    if (updated?.order_id) {
        await refreshOrderSubtotal(String(updated.order_id));
    }
    return updated;
}
async function deleteOrderItem(id) {
    await (0, db_1.connectDB)();
    const deleted = await OrderItem_1.default.findByIdAndDelete(id).lean();
    if (deleted?.order_id) {
        await refreshOrderSubtotal(String(deleted.order_id));
    }
    return deleted;
}
async function deleteOrderItemsByUser(userId) {
    await (0, db_1.connectDB)();
    const cartOrder = await Order_1.default.findOne({ user_id: userId, order_status: "cart" });
    if (!cartOrder)
        return;
    await OrderItem_1.default.deleteMany({ order_id: cartOrder._id });
    await Order_1.default.findByIdAndUpdate(cartOrder._id, { subtotal: 0 });
}
