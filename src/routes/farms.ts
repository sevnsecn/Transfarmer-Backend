/**
 * @swagger
 * /api/farms:
 *   get:
 *     summary: Get all farms
 *     tags: [Farms]
 *     responses:
 *       200:
 *         description: List of farms retrieved successfully
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
 *                     properties:
 *                       id:
 *                         type: string
 *                       farm_name:
 *                         type: string
 *                       farm_location:
 *                         type: string
 *                       farm_image:
 *                         type: string
 *                 count:
 *                   type: number
 *       500:
 *         description: Failed to fetch farms
 *   post:
 *     summary: Create a farm (admin only)
 *     tags: [Farms]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [farm_name, farm_location]
 *             properties:
 *               farm_name:
 *                 type: string
 *               farm_location:
 *                 type: string
 *               farm_image:
 *                 type: string
 *     responses:
 *       201:
 *         description: Farm created successfully
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
 *         description: Missing required fields
 *       401:
 *         description: Unauthorized (missing/invalid token)
 *       403:
 *         description: Admin access required
 *       500:
 *         description: Failed to create farm
 * /api/farms/{id}:
 *   get:
 *     summary: Get a single farm
 *     tags: [Farms]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Farm data retrieved successfully
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
 *         description: Farm not found
 *       500:
 *         description: Failed to fetch farm
 *   put:
 *     summary: Update a farm (admin only)
 *     tags: [Farms]
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
 *               farm_name:
 *                 type: string
 *               farm_location:
 *                 type: string
 *               farm_image:
 *                 type: string
 *     responses:
 *       200:
 *         description: Farm updated successfully
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
 *         description: Farm not found
 *       500:
 *         description: Failed to update farm
 *   delete:
 *     summary: Delete a farm (admin only)
 *     tags: [Farms]
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
 *         description: Farm deleted successfully
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
 *         description: Farm not found
 *       500:
 *         description: Failed to delete farm
 */

import { Router, Request, Response } from "express";
import { getAllFarms, getFarmById, createFarm, updateFarm, deleteFarm } from "../services/farmService";
import { requireAdmin } from "../middleware/auth";

const router = Router();

// GET /api/farms
router.get("/", async (req: Request, res: Response) => {
  try {
    const farms = await getAllFarms();
    res.json({ success: true, data: farms, count: farms.length });
  } catch {
    res.status(500).json({ success: false, message: "Failed to fetch farms" });
  }
});

// POST /api/farms
router.post("/", requireAdmin, async (req: Request, res: Response) => {
  try {
    const { farm_name, farm_location, farm_image } = req.body;
    if (!farm_name || !farm_location) {
      res.status(400).json({ success: false, message: "farm_name and farm_location are required" });
      return;
    }
    const farm = await createFarm({ farm_name, farm_location, farm_image });
    res.status(201).json({ success: true, data: farm });
  } catch {
    res.status(500).json({ success: false, message: "Failed to create farm" });
  }
});

// GET /api/farms/:id
router.get("/:id", async (req: Request, res: Response) => {
  try {
      const farm = await getFarmById(req.params.id as string);    if (!farm) {
      res.status(404).json({ success: false, message: "Farm not found" });
      return;
    }
    res.json({ success: true, data: farm });
  } catch {
    res.status(500).json({ success: false, message: "Failed to fetch farm" });
  }
});

// PUT /api/farms/:id
router.put("/:id", requireAdmin, async (req: Request, res: Response) => {
  try {
    const farm = await updateFarm(req.params.id as string, req.body);
    res.json({ success: true, data: farm });
  } catch (error: any) {
    if (error.message === "Farm not found") {
      res.status(404).json({ success: false, message: "Farm not found" });
      return;
    }
    res.status(500).json({ success: false, message: "Failed to update farm" });
  }
});

// DELETE /api/farms/:id
router.delete("/:id", requireAdmin, async (req: Request, res: Response) => {
  try {
    await deleteFarm(req.params.id as string);    res.json({ success: true, message: "Farm deleted" });
  } catch (error: any) {
    if (error.message === "Farm not found") {
      res.status(404).json({ success: false, message: "Farm not found" });
      return;
    }
    res.status(500).json({ success: false, message: "Failed to delete farm" });
  }
});

export default router;