/**
 * @swagger
 * /internal/products/{id}:
 *   put:
 *     summary: Sync/update product from product-service (internal)
 *     tags: [Internal]
 *     description: Internal endpoint for product service to sync product data. Not for public use.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Product ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               farm_id:
 *                 type: string
 *               product_name:
 *                 type: string
 *               price_per_kg:
 *                 type: number
 *               stock_kg:
 *                 type: number
 *               product_image:
 *                 type: string
 *     responses:
 *       200:
 *         description: Product synced successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *       500:
 *         description: Failed to sync product
 *   delete:
 *     summary: Delete product from order service (internal)
 *     tags: [Internal]
 *     description: Internal endpoint for product service to delete product data. Not for public use.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Product ID
 *     responses:
 *       200:
 *         description: Product deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *       500:
 *         description: Failed to delete product
 */

import { Router } from "express";
import Product from "../models/Product";

const router = Router();

// sync create/update product from product-service
router.put("/products/:id", async (req, res) => {
  try {
    await Product.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        upsert: true,
        new: true,
      }
    );

    res.json({ success: true });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
    });
  }
});

// sync delete product from product-service
router.delete("/products/:id", async (req, res) => {
  try {
    await Product.findByIdAndDelete(req.params.id);

    res.json({ success: true });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
    });
  }
});

export default router;