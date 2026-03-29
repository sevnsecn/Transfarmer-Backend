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
  import authMiddleware from "../middleware/auth"; // adjust path
  import {
  createOrderItem,
  getOrderItemById,
  getOrderItemsByUser,
  updateOrderItem,
  deleteOrderItem,
} from "../services/orderItemService";

  const router = Router({ mergeParams: true });
  router.use(authMiddleware); 

  // GET /api/orders/:id/order_items
router.get("/", async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const items = await getOrderItemsByUser(userId);

    const normalized = items.map((item: any) => ({
      ...item,
      quantity: item.quantity_kg,
    }));

    res.json({ success: true, data: normalized });
  } catch (error) {
    console.error("ERROR:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch cart items",
    });
  }
});

// 🔥 ADD TO CART
router.post("/", async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;

    const item = await createOrderItem({
      user_id: userId,
      product_id: req.body.product_id,
      quantity: Number(req.body.quantity),
    });

    res.status(201).json({
      success: true,
      data: {
        ...item.toObject(),
        quantity: item.quantity_kg,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Failed to add to cart",
    });
  }
});

// 🔥 GET SINGLE ITEM
router.get("/:itemsId", async (req: Request, res: Response) => {
  try {
    const item = await getOrderItemById(req.params.itemsId as string);

    if (!item) {
      res.status(404).json({ success: false, message: "Item not found" });
      return;
    }

    res.json({
      success: true,
      data: {
        ...item,
        quantity: (item as any).quantity_kg,
      },
    });
  } catch {
    res.status(500).json({
      success: false,
      message: "Failed to fetch item",
    });
  }
});

// 🔥 UPDATE QUANTITY
router.put("/:itemsId", async (req: Request, res: Response) => {
  try {
    const updated = await updateOrderItem(
      req.params.itemsId as string,
      { quantity: Number(req.body.quantity) }
    );

    if (!updated) {
      res.status(404).json({ success: false, message: "Item not found" });
      return;
    }

    res.json({
      success: true,
      data: {
        ...updated,
        quantity: (updated as any).quantity_kg,
      },
    });
  } catch {
    res.status(500).json({
      success: false,
      message: "Failed to update item",
    });
  }
});

// 🔥 DELETE ITEM
router.delete("/:itemsId", async (req: Request, res: Response) => {
  try {
    const deleted = await deleteOrderItem(req.params.itemsId as string);

    if (!deleted) {
      res.status(404).json({ success: false, message: "Item not found" });
      return;
    }

    res.json({
      success: true,
      message: "Item removed from cart",
    });
  } catch {
    res.status(500).json({
      success: false,
      message: "Failed to delete item",
    });
  }
});

export default router;