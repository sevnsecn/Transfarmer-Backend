/**
 * @swagger
 * /api/products:
 *   get:
 *     summary: Get all products with optional filters
 *     tags: [Products]
 *     parameters:
 *       - in: query
 *         name: farm_id
 *         schema:
 *           type: string
 *         description: Filter by farm ID
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by product name
 *       - in: query
 *         name: minPrice
 *         schema:
 *           type: number
 *         description: Minimum price per kg
 *       - in: query
 *         name: maxPrice
 *         schema:
 *           type: number
 *         description: Maximum price per kg
 *     responses:
 *       200:
 *         description: List of products retrieved successfully
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
 *         description: Failed to fetch products
 *   post:
 *     summary: Create a product (admin only)
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [farm_id, product_name, price_per_kg, stock_kg]
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
 *       201:
 *         description: Product created successfully
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
 *         description: Missing or invalid fields
 *       401:
 *         description: Unauthorized (missing/invalid token)
 *       403:
 *         description: Admin access required
 *       404:
 *         description: Farm not found
 *       500:
 *         description: Failed to create product
 * /api/products/{id}:
 *   get:
 *     summary: Get a single product
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Product data retrieved successfully
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
 *         description: Product not found
 *       500:
 *         description: Failed to fetch product
 *   put:
 *     summary: Update a product (admin only)
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
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
 *         description: Product updated successfully
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
 *       403:
 *         description: Admin access required
 *       404:
 *         description: Product or farm not found
 *       500:
 *         description: Failed to update product
 *   delete:
 *     summary: Delete a product (admin only)
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
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
 *                 message:
 *                   type: string
 *       401:
 *         description: Unauthorized (missing/invalid token)
 *       403:
 *         description: Admin access required
 *       404:
 *         description: Product not found
 *       500:
 *         description: Failed to delete product
 */

import { Router, Request, Response } from "express";
import { getAllProducts, getProductById, createProduct, updateProduct, deleteProduct, ProductFilters } from "../services/productService";
import { requireAdmin } from "../middleware/auth";
import Product from "../models/Product";


const router = Router();

// GET /api/products
router.get("/", async (req: Request, res: Response) => {
  try {
    const filters: ProductFilters = {};

    if (req.query.farm_id) filters.farm_id = req.query.farm_id as string;
    if (req.query.search) filters.search = req.query.search as string;
    if (req.query.minPrice) filters.minPrice = Number(req.query.minPrice as string);
    if (req.query.maxPrice) filters.maxPrice = Number(req.query.maxPrice as string);

    const products = await getAllProducts(filters);

    res.json({
      success: true,
      data: products,
      count: products.length
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

// POST /api/products
router.post("/", requireAdmin, async (req: Request, res: Response) => {
  try {
    const { farm_id, product_name, price_per_kg, stock_kg, product_image } = req.body;
    if (!farm_id || !product_name || price_per_kg === undefined || stock_kg === undefined) {
      res.status(400).json({ success: false, message: "farm_id, product_name, price_per_kg, and stock_kg are required" });
      return;
    }
    if (price_per_kg <= 0 || stock_kg < 0) {
      res.status(400).json({ success: false, message: "price_per_kg must be positive and stock_kg cannot be negative" });
      return;
    }
    const product = await createProduct({ farm_id, product_name, price_per_kg: Number(price_per_kg), stock_kg: Number(stock_kg), product_image });
    res.status(201).json({ success: true, data: product });
  } catch (error: any) {
    if (error.message === "Farm not found") {
      res.status(404).json({ success: false, message: "Farm not found" });
      return;
    }
    res.status(500).json({ success: false, message: "Failed to create product" });
  }
});

// GET /api/products/:id
router.get("/:id", async (req: Request, res: Response) => {
  try {
    const product = await getProductById(req.params.id as string);
    if (!product) {
      res.status(404).json({ success: false, message: "Product not found" });
      return;
    }
    res.json({ success: true, data: product });
  } catch {
    res.status(500).json({ success: false, message: "Failed to fetch product" });
  }
});

// PUT /api/products/:id
router.put("/:id", requireAdmin, async (req: Request, res: Response) => {
  try {
    const { farm_id, product_name, price_per_kg, stock_kg, product_image } = req.body;
    if (price_per_kg !== undefined && price_per_kg <= 0) {
      res.status(400).json({ success: false, message: "price_per_kg must be positive" });
      return;
    }
    if (stock_kg !== undefined && stock_kg < 0) {
      res.status(400).json({ success: false, message: "stock_kg cannot be negative" });
      return;
    }
    const product = await updateProduct(req.params.id as string, {
      ...(farm_id && { farm_id }),
      ...(product_name && { product_name }),
      ...(price_per_kg !== undefined && { price_per_kg: Number(price_per_kg) }),
      ...(stock_kg !== undefined && { stock_kg: Number(stock_kg) }),
      ...(product_image !== undefined && { product_image }),
    });
    res.json({ success: true, data: product });
  } catch (error: any) {
    if (error.message === "Product not found") {
      res.status(404).json({ success: false, message: "Product not found" });
      return;
    }
    if (error.message === "Farm not found") {
      res.status(404).json({ success: false, message: "Farm not found" });
      return;
    }
    res.status(500).json({ success: false, message: "Failed to update product" });
  }
});

// DELETE /api/products/:id
router.delete("/:id", requireAdmin, async (req: Request, res: Response) => {
  try {
    await deleteProduct(req.params.id as string);
    res.json({ success: true, message: "Product deleted successfully" });
  } catch (error: any) {
    if (error.message === "Product not found") {
      res.status(404).json({ success: false, message: "Product not found" });
      return;
    }
    res.status(500).json({ success: false, message: "Failed to delete product" });
  }
});

// Internal route — deduct stock after checkout
router.post("/:id/deduct", async (req: Request, res: Response) => {
  try {
    const { quantity } = req.body;
    await Product.findByIdAndUpdate(req.params.id, {
      $inc: { stock_kg: -Number(quantity) },
    });
    res.json({ success: true });
  } catch {
    res.status(500).json({ success: false, message: "Failed to deduct stock" });
  }
});

export default router;