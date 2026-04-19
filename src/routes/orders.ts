/**
 * @swagger
 * /api/orders:
 *   get:
 *     summary: Get all orders
 *     tags: [Orders]
 *     responses:
 *       200:
 *         description: List of orders retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                 count:
 *                   type: number
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
 *             required: [user_id]
 *             properties:
 *               user_id:
 *                 type: string
 *               total_price:
 *                 type: number
 *                 description: Required if subtotal not provided
 *               subtotal:
 *                 type: number
 *                 description: Alternative to total_price
 *               status:
 *                 type: string
 *                 enum: [cart, pending, confirmed, delivered]
 *                 default: pending
 *     responses:
 *       201:
 *         description: Order created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *       400:
 *         description: Missing required fields (user_id and either total_price or subtotal)
 *       500:
 *         description: Failed to create order
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
 *
 * /api/orders/checkout:
 *   post:
 *     summary: Checkout an order (convert cart to pending)
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Order checked out successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *       401:
 *         description: Unauthorized (missing/invalid token)
 *       500:
 *         description: Checkout failed
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
 *         description: Order data retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *       404:
 *         description: Order not found
 *       500:
 *         description: Failed to fetch order
 *   put:
 *     summary: Update order status or total_price
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
 *               total_price:
 *                 type: number
 *     responses:
 *       200:
 *         description: Order updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
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
 *         description: Order deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *       500:
 *         description: Failed to delete order
 */

import { Router, Request, Response } from "express";
import {
  getAllOrders,
  getOrderById,
  createOrder,
  updateOrder,
  deleteOrder,
  checkoutOrder,
  getOrdersByUser,
    completeOrder,
  autoCompleteOrders,
} from "../services/orderService";
import authMiddleware from "../middleware/auth";

const router = Router();

// GET /api/orders
router.get("/", async (req: Request, res: Response) => {
  try {
    const orders = await getAllOrders();
    res.json({ success: true, data: orders, count: orders.length });
  } catch {
    res.status(500).json({ success: false, message: "Failed to fetch orders" });
  }
});

// POST /api/orders
router.post("/", async (req: Request, res: Response) => {
  try {
    const { user_id, total_price, subtotal, status } = req.body;
    if (!user_id || total_price === undefined) {
      if (subtotal === undefined) {
        res.status(400).json({ success: false, message: "user_id and total_price are required" });
        return;
      }
    }

    const order = await createOrder({
      user_id,
      total_price: Number(total_price ?? subtotal),
      status: status || "pending",
    });
    res.status(201).json({ success: true, data: order });
  } catch {
    res.status(500).json({ success: false, message: "Failed to create order" });
  }
});

// GET /api/orders/my-orders
router.get("/my-orders", authMiddleware, async (req, res) => {
  try {
    const user = (req as any).user;
    const orders = await getOrdersByUser(user.id);

    res.json({
      success: true,
      data: orders,
    });
  } catch (err: any) {
    console.error("MY ORDERS ERROR:", err);

    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});

// POST /api/orders/checkout
router.post("/checkout", authMiddleware, async (req, res)  => {
  try {
    const user = (req as any).user;

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const order = await checkoutOrder(user.id);

    res.json({ success: true, data: order });
  } catch (err: any) {
    console.error("CHECKOUT ERROR:", err.message);

    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});

// POST /api/orders/auto-complete (internal/cron use)
router.post("/auto-complete", async (req, res) => {
  try {
    const count = await autoCompleteOrders();
    res.json({ success: true, message: `${count} orders auto-completed` });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});


// POST /api/orders/:id/complete
router.post("/:id/complete", authMiddleware, async (req, res) => {
  try {
    const user = (req as any).user;
    const order = await completeOrder(req.params.id as string, user.id);
    res.json({ success: true, data: order });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// GET /api/orders/:id
router.get("/:id", async (req: Request, res: Response) => {
  try {
    const order = await getOrderById(req.params.id as string);
    if (!order) {
      res.status(404).json({ success: false, message: "Order not found" });
      return;
    }
    res.json({ success: true, data: order });
  } catch {
    res.status(404).json({ success: false, message: "Order not found" });
  }
});

// PUT /api/orders/:id
const STATUS_ORDER = ["cart", "pending", "confirmed", "delivered", "completed"];

router.put("/:id", async (req: Request, res: Response) => {
  try {
    const order = await getOrderById(req.params.id as string);
    if (!order) {
      res.status(404).json({ success: false, message: "Order not found" });
      return;
    }

    if (req.body.status) {
      const currentIndex = STATUS_ORDER.indexOf(order.status);
      const newIndex = STATUS_ORDER.indexOf(req.body.status);
      if (newIndex <= currentIndex) {
        res.status(400).json({
          success: false,
          message: `Cannot revert order status from "${order.status}" to "${req.body.status}"`,
        });
        return;
      }
    }

    const updated = await updateOrder(req.params.id as string, {
      status: req.body.status,
      total_price: req.body.total_price,
    });
    res.json({ success: true, data: updated });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Failed to update order" });
  }
});
// DELETE /api/orders/:id
router.delete("/:id", async (req: Request, res: Response) => {
  try {
    const order = await deleteOrder(req.params.id as string);    res.json({ success: true, message: "Order deleted", data: order });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Failed to delete order" });
  }
});

export default router;