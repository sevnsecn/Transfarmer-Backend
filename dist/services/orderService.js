"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllOrders = getAllOrders;
exports.getOrderById = getOrderById;
exports.createOrder = createOrder;
exports.updateOrder = updateOrder;
exports.deleteOrder = deleteOrder;
exports.checkoutOrder = checkoutOrder;
exports.getOrdersByUser = getOrdersByUser;
const db_1 = require("../lib/db");
const Order_1 = __importDefault(require("../models/Order"));
const orderItemService_1 = require("../services/orderItemService");
const userService_1 = require("../services/userService");
async function formatOrder(order) {
    const itemsRaw = await (0, orderItemService_1.getOrderItemsByOrder)(String(order._id));
    const items = itemsRaw.map((item) => ({
        _id: item._id,
        product_id: String(item.product_id?._id || item.product_id),
        quantity: item.quantity_kg,
        price: item.product_id?.price_per_kg || 0,
    }));
    return {
        ...order,
        status: order.order_status,
        total_price: order.subtotal,
        items,
    };
}
async function getCartOrderByUser(userId) {
    let cart = await Order_1.default.findOne({ user_id: userId, order_status: "cart" });
    if (!cart) {
        cart = await Order_1.default.create({
            user_id: userId,
            order_status: "cart",
            subtotal: 0,
            order_date: new Date(),
        });
    }
    return cart;
}
// GET
async function getAllOrders() {
    await (0, db_1.connectDB)();
    const orders = await Order_1.default.find({ order_status: { $ne: "cart" } }).lean();
    return Promise.all(orders.map(formatOrder));
}
// GET by id
async function getOrderById(id) {
    await (0, db_1.connectDB)();
    const order = await Order_1.default.findById(id).lean();
    if (!order)
        return null;
    return formatOrder(order);
}
//POST
async function createOrder(data) {
    await (0, db_1.connectDB)();
    const order = await Order_1.default.create({
        user_id: data.user_id,
        order_status: data.status || "pending",
        subtotal: data.total_price || 0,
        order_date: new Date(),
    });
    const created = await Order_1.default.findById(order._id).lean();
    return created ? formatOrder(created) : null;
}
// PUT
async function updateOrder(id, data) {
    await (0, db_1.connectDB)();
    const order = await Order_1.default.findByIdAndUpdate(id, {
        ...(data.status && { order_status: data.status }),
        ...(data.total_price !== undefined && { subtotal: data.total_price }),
    }, {
        returnDocument: "after", // replaces deprecated new:true
        runValidators: true
    }).lean();
    if (!order) {
        throw new Error("Order not found");
    }
    return formatOrder(order);
}
//DELETE
async function deleteOrder(id) {
    await (0, db_1.connectDB)();
    const order = await Order_1.default.findByIdAndDelete(id);
    if (!order)
        throw new Error("Order not found");
    return order;
}
//checkout order
async function checkoutOrder(userId) {
    await (0, db_1.connectDB)();
    const cartOrder = await getCartOrderByUser(userId);
    const cartItems = await (0, orderItemService_1.getOrderItemsByUser)(userId);
    if (!cartItems.length) {
        throw new Error("Cart is empty");
    }
    const user = await (0, userService_1.getUserById)(userId);
    if (!user?.address) {
        throw new Error("Address not set");
    }
    const total = cartItems.reduce((sum, item) => sum + item.quantity_kg * item.product_id.price_per_kg, 0);
    const updated = await Order_1.default.findByIdAndUpdate(cartOrder._id, {
        order_status: "pending",
        subtotal: total,
        order_date: new Date(),
    }, { returnDocument: "after" }).lean();
    if (!updated) {
        throw new Error("Order not found");
    }
    return formatOrder(updated);
}
async function getOrdersByUser(userId) {
    await (0, db_1.connectDB)();
    const orders = await Order_1.default.find({ user_id: userId, order_status: { $ne: "cart" } }).lean();
    return Promise.all(orders.map(formatOrder));
}
