"use strict";
/**
 * @swagger
 * /api/orders:
 *   get:
 *     summary: Get all orders
 *     tags: [Orders]
 *     responses:
 *       200:
 *         description: List of orders
 *       500:
 *         description: Failed to fetch orders
 *   post:
 *     summary: Create a new order
 *     tags: [Orders]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [user_id, total_price]
 *             properties:
 *               user_id:
 *                 type: string
 *               total_price:
 *                 type: number
 *               status:
 *                 type: string
 *                 enum: [cart, pending, confirmed, delivered]
 *     responses:
 *       201:
 *         description: Order created
 *       400:
 *         description: Missing required fields
 *       500:
 *         description: Failed to create order
 *
 * /api/orders/{id}:
 *   get:
 *     summary: Get a single order
 *     tags: [Orders]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Order data
 *       404:
 *         description: Order not found
 *   put:
 *     summary: Update order status
 *     tags: [Orders]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [cart, pending, confirmed, delivered]
 *     responses:
 *       200:
 *         description: Order updated
 *       500:
 *         description: Failed to update order
 *   delete:
 *     summary: Delete an order
 *     tags: [Orders]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Order deleted
 *       500:
 *         description: Failed to delete order
 *
 * /api/orders/checkout:
 *   post:
 *     summary: Checkout an order
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Order checked out
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Checkout failed
 *
 * /api/orders/my-orders:
 *   get:
 *     summary: Get orders for authenticated user
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User orders retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       user_id:
 *                         type: string
 *                       total_price:
 *                         type: number
 *                       status:
 *                         type: string
 *                         enum: [cart, pending, confirmed, delivered]
 *                       created_at:
 *                         type: string
 *                         format: date-time
 *                       updated_at:
 *                         type: string
 *                         format: date-time
 *       401:
 *         description: Unauthorized (missing/invalid token)
 *       500:
 *         description: Failed to fetch user orders
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const orderService_1 = require("../services/orderService");
const auth_1 = __importDefault(require("../middleware/auth"));
const router = (0, express_1.Router)();
// GET /api/orders
router.get("/", async (req, res) => {
    try {
        const orders = await (0, orderService_1.getAllOrders)();
        res.json({ success: true, data: orders, count: orders.length });
    }
    catch {
        res.status(500).json({ success: false, message: "Failed to fetch orders" });
    }
});
// POST /api/orders
router.post("/", async (req, res) => {
    try {
        const { user_id, total_price, subtotal, status } = req.body;
        if (!user_id || total_price === undefined) {
            if (subtotal === undefined) {
                res.status(400).json({ success: false, message: "user_id and total_price are required" });
                return;
            }
        }
        const order = await (0, orderService_1.createOrder)({
            user_id,
            total_price: Number(total_price ?? subtotal),
            status: status || "pending",
        });
        res.status(201).json({ success: true, data: order });
    }
    catch {
        res.status(500).json({ success: false, message: "Failed to create order" });
    }
});
// GET /api/orders/my-orders
router.get("/my-orders", auth_1.default, async (req, res) => {
    try {
        const user = req.user;
        const orders = await (0, orderService_1.getOrdersByUser)(user.id);
        res.json({
            success: true,
            data: orders,
        });
    }
    catch (err) {
        console.error("MY ORDERS ERROR:", err);
        res.status(500).json({
            success: false,
            message: err.message,
        });
    }
});
// GET /api/orders/:id
router.get("/:id", async (req, res) => {
    try {
        const order = await (0, orderService_1.getOrderById)(req.params.id);
        if (!order) {
            res.status(404).json({ success: false, message: "Order not found" });
            return;
        }
        res.json({ success: true, data: order });
    }
    catch {
        res.status(404).json({ success: false, message: "Order not found" });
    }
});
// PUT /api/orders/:id
router.put("/:id", async (req, res) => {
    try {
        const order = await (0, orderService_1.updateOrder)(req.params.id, {
            status: req.body.status,
            total_price: req.body.total_price,
        });
        res.json({ success: true, data: order });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Failed to update order" });
    }
});
// DELETE /api/orders/:id
router.delete("/:id", async (req, res) => {
    try {
        const order = await (0, orderService_1.deleteOrder)(req.params.id);
        res.json({ success: true, message: "Order deleted", data: order });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Failed to delete order" });
    }
});
// POST /api/orders/checkout
router.post("/checkout", auth_1.default, async (req, res) => {
    try {
        const user = req.user;
        if (!user) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized",
            });
        }
        const order = await (0, orderService_1.checkoutOrder)(user.id);
        res.json({ success: true, data: order });
    }
    catch (err) {
        console.error("CHECKOUT ERROR:", err.message);
        res.status(500).json({
            success: false,
            message: err.message,
        });
    }
});
exports.default = router;
