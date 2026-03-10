/**
 * @swagger
 * /api/orders/{id}/order_items:
 *   get:
 *     summary: Get all items in an order
 *     tags: [Order Items]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of order items
 *       500:
 *         description: Failed to fetch order items
 *   post:
 *     summary: Add an item to an order
 *     tags: [Order Items]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [items_id, quantity, price]
 *             properties:
 *               items_id:
 *                 type: string
 *               quantity:
 *                 type: number
 *               price:
 *                 type: number
 *     responses:
 *       201:
 *         description: Order item created
 *       500:
 *         description: Failed to create order item
 * /api/orders/{id}/order_items/{itemsId}:
 *   get:
 *     summary: Get a single order item
 *     tags: [Order Items]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: itemsId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Order item data
 *       500:
 *         description: Failed to fetch order item
 *   put:
 *     summary: Update an order item
 *     tags: [Order Items]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: itemsId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               quantity:
 *                 type: number
 *               price:
 *                 type: number
 *     responses:
 *       200:
 *         description: Order item updated
 *       500:
 *         description: Failed to update order item
 *   delete:
 *     summary: Remove an item from an order
 *     tags: [Order Items]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: itemsId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Order item deleted
 *       500:
 *         description: Failed to delete order item
 */

import { Router, Request, Response } from "express";
import { getOrderItemsByOrder, createOrderItem, getOrderItemById, updateOrderItem, deleteOrderItem } from "../services/orderItemService";

const router = Router({ mergeParams: true });

// GET /api/orders/:id/order_items
router.get("/", async (req: Request, res: Response) => {
  try {
    const items = await getOrderItemsByOrder(req.params.id as string);    res.json({ success: true, data: items });
  } catch {
    res.status(500).json({ success: false, message: "Failed to fetch order items" });
  }
});

// POST /api/orders/:id/order_items
router.post("/", async (req: Request, res: Response) => {
  try {
    const item = await createOrderItem({
      order_id: req.params.id,
      items_id: req.body.items_id,
      quantity: req.body.quantity,
      price: req.body.price,
    });
    res.status(201).json({ success: true, data: item });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Failed to create order item" });
  }
});

// GET /api/orders/:id/order_items/:itemsId
router.get("/:itemsId", async (req: Request, res: Response) => {
  try {
    const item = await getOrderItemById(req.params.itemsId as string);    res.json({ success: true, data: item });
  } catch {
    res.status(500).json({ success: false, message: "Failed to fetch order item" });
  }
});

// PUT /api/orders/:id/order_items/:itemsId
router.put("/:itemsId", async (req: Request, res: Response) => {
  try {
    const updated = await updateOrderItem(req.params.itemsId as string, req.body);    res.json({ success: true, data: updated });
  } catch {
    res.status(500).json({ success: false, message: "Failed to update order item" });
  }
});

// DELETE /api/orders/:id/order_items/:itemsId
router.delete("/:itemsId", async (req: Request, res: Response) => {
  try {
    await deleteOrderItem(req.params.itemsId as string);    res.json({ success: true, message: "Order item deleted" });
  } catch {
    res.status(500).json({ success: false, message: "Failed to delete order item" });
  }
});

export default router;