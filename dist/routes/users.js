"use strict";
/**
 * @swagger
 * /api/users/{id}:
 *   get:
 *     summary: Get user profile
 *     tags: [Users]
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
 *         description: User profile
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not found
 *   put:
 *     summary: Update user profile
 *     tags: [Users]
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
 *               user_name:
 *                 type: string
 *               user_email:
 *                 type: string
  *               current_password:
 *                 type: string
 *                 example: oldpassword1
 *               new_password:
 *                 type: string
 *                 example: newpassword1
 *     responses:
 *       200:
 *         description: User updated
 *       400:
 *         description: Invalid email, weak password(min 6 chars, at least 1 letter or symbol), or email already exists
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not found
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const userService_1 = require("../services/userService");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const router = (0, express_1.Router)();
const JWT_SECRET = process.env.JWT_SECRET;
function getUserFromToken(req) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer "))
        return null;
    const token = authHeader.split(" ")[1];
    try {
        return jsonwebtoken_1.default.verify(token, JWT_SECRET);
    }
    catch {
        return null;
    }
}
// GET /api/users/:id
router.get("/:id", async (req, res) => {
    const session = getUserFromToken(req);
    const { id } = req.params;
    if (!session || session.id !== id) {
        res.status(401).json({ success: false, message: "Unauthorized" });
        return;
    }
    const user = await (0, userService_1.getUserById)(id);
    if (!user) {
        res.status(404).json({ success: false, message: "User not found" });
        return;
    }
    res.json({ success: true, data: user });
});
// PUT /api/users/:id
router.put("/:id", async (req, res) => {
    const session = getUserFromToken(req);
    const { id } = req.params;
    if (!session || session.id !== id) {
        res.status(401).json({ success: false, message: "Unauthorized" });
        return;
    }
    // Valid email check if email is being updated
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (req.body.user_email && !emailRegex.test(req.body.user_email)) {
        res.status(400).json({ success: false, message: "Invalid email address" });
        return;
    }
    // Password update logic
    let password_hash;
    if (req.body.new_password) {
        // Require current password
        if (!req.body.current_password) {
            res.status(400).json({ success: false, message: "Current password is required to set a new password" });
            return;
        }
        // Verify current password, does not check if current password is valid when updating, only cares if it matches 
        const existingUser = await (0, userService_1.getUserWithPassword)(id);
        const isValid = await bcryptjs_1.default.compare(req.body.current_password, existingUser.password_hash);
        if (!isValid) {
            res.status(401).json({ success: false, message: "Current password is incorrect" });
            return;
        }
        // Validate new password
        if (req.body.new_password.length < 6) {
            res.status(400).json({ success: false, message: "Password must be at least 6 characters" });
            return;
        }
        if (!/[a-zA-Z]/.test(req.body.new_password) && !/[^a-zA-Z0-9]/.test(req.body.new_password)) {
            res.status(400).json({ success: false, message: "Password must contain at least 1 letter or 1 symbol" });
            return;
        }
        password_hash = await bcryptjs_1.default.hash(req.body.new_password, 10);
    }
    try {
        const user = await (0, userService_1.updateUser)(id, {
            user_name: req.body.user_name,
            user_email: req.body.user_email,
            ...(password_hash && { password_hash }), //spread = removes password field if not filled
        });
        res.json({ success: true, data: user });
    }
    catch (error) {
        if (error.message === "Email already exists") {
            res.status(400).json({ success: false, message: "Email already exists" });
            return;
        }
        if (error.message === "User not found") {
            res.status(404).json({ success: false, message: "User not found" });
            return;
        }
        res.status(500).json({ success: false, message: "Failed to update user" });
    }
});
//CRUD alamat
//get
router.get("/:id/address", async (req, res) => {
    const session = getUserFromToken(req);
    const { id } = req.params; // 🔥 FIX
    if (!session || session.id !== id) {
        return res.status(401).json({ success: false, message: "Unauthorized" });
    }
    try {
        const user = await (0, userService_1.getUserById)(id);
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }
        return res.json({
            success: true,
            data: user.address || null,
        });
    }
    catch (err) {
        console.error(err);
        return res.status(500).json({
            success: false,
            message: "Failed to fetch address",
        });
    }
});
//update
router.put("/:id/address", async (req, res) => {
    const session = getUserFromToken(req);
    const { id } = req.params; // 🔥 FIX WAJIB
    if (!session || session.id !== id) {
        return res.status(401).json({ success: false, message: "Unauthorized" });
    }
    try {
        const user = await (0, userService_1.updateUser)(id, {
            address: {
                full_name: req.body.full_name,
                phone: req.body.phone,
                address_line: req.body.address_line,
                city: req.body.city,
                postal_code: req.body.postal_code,
            },
        });
        return res.json({
            success: true,
            data: user.address,
        });
    }
    catch (error) {
        console.error(error); // 🔥 penting buat debug
        return res.status(500).json({
            success: false,
            message: "Failed to update address",
        });
    }
});
exports.default = router;
