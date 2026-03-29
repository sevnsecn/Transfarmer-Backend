"use strict";
/**
 * @swagger
 * /api/farms:
 *   get:
 *     summary: Get all farms
 *     tags: [Farms]
 *     responses:
 *       200:
 *         description: List of farms
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
 *         description: Farm created
 *       400:
 *         description: Missing required fields
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Admin access required
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
 *         description: Farm data
 *       404:
 *         description: Farm not found
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
 *         description: Farm updated
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Admin access required
 *       404:
 *         description: Farm not found
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
 *         description: Farm deleted
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Admin access required
 *       404:
 *         description: Farm not found
 */
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const farmService_1 = require("../services/farmService");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// GET /api/farms
router.get("/", async (req, res) => {
    try {
        const farms = await (0, farmService_1.getAllFarms)();
        res.json({ success: true, data: farms, count: farms.length });
    }
    catch {
        res.status(500).json({ success: false, message: "Failed to fetch farms" });
    }
});
// POST /api/farms
router.post("/", auth_1.requireAdmin, async (req, res) => {
    try {
        const { farm_name, farm_location, farm_image } = req.body;
        if (!farm_name || !farm_location) {
            res.status(400).json({ success: false, message: "farm_name and farm_location are required" });
            return;
        }
        const farm = await (0, farmService_1.createFarm)({ farm_name, farm_location, farm_image });
        res.status(201).json({ success: true, data: farm });
    }
    catch {
        res.status(500).json({ success: false, message: "Failed to create farm" });
    }
});
// GET /api/farms/:id
router.get("/:id", async (req, res) => {
    try {
        const farm = await (0, farmService_1.getFarmById)(req.params.id);
        if (!farm) {
            res.status(404).json({ success: false, message: "Farm not found" });
            return;
        }
        res.json({ success: true, data: farm });
    }
    catch {
        res.status(500).json({ success: false, message: "Failed to fetch farm" });
    }
});
// PUT /api/farms/:id
router.put("/:id", auth_1.requireAdmin, async (req, res) => {
    try {
        const farm = await (0, farmService_1.updateFarm)(req.params.id, req.body);
        res.json({ success: true, data: farm });
    }
    catch (error) {
        if (error.message === "Farm not found") {
            res.status(404).json({ success: false, message: "Farm not found" });
            return;
        }
        res.status(500).json({ success: false, message: "Failed to update farm" });
    }
});
// DELETE /api/farms/:id
router.delete("/:id", auth_1.requireAdmin, async (req, res) => {
    try {
        await (0, farmService_1.deleteFarm)(req.params.id);
        res.json({ success: true, message: "Farm deleted" });
    }
    catch (error) {
        if (error.message === "Farm not found") {
            res.status(404).json({ success: false, message: "Farm not found" });
            return;
        }
        res.status(500).json({ success: false, message: "Failed to delete farm" });
    }
});
exports.default = router;
