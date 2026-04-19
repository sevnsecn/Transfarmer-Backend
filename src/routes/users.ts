/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: Get all users (public endpoint)
 *     tags: [Users]
 *     responses:
 *       200:
 *         description: List of all users (basic info only)
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
 *                       user_name:
 *                         type: string
 *                       user_email:
 *                         type: string
 *       500:
 *         description: Failed to fetch users
 * /api/users/{id}:
 *   get:
 *     summary: Get user profile (authenticated only)
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
 *         description: User profile retrieved successfully
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
 *         description: Unauthorized (missing/invalid token or not own profile)
 *       404:
 *         description: User not found
 *       500:
 *         description: Failed to fetch user
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
 *                 description: Required if changing password
 *               new_password:
 *                 type: string
 *                 description: New password (min 6 chars, at least 1 letter or symbol)
 *     responses:
 *       200:
 *         description: User profile updated successfully
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
 *         description: Invalid email, weak password (min 6 chars, at least 1 letter or symbol), email already exists, or invalid current password
 *       401:
 *         description: Unauthorized (missing/invalid token or not own profile)
 *       404:
 *         description: User not found
 *       500:
 *         description: Failed to update user
 * /api/users/{id}/address:
 *   get:
 *     summary: Get user address
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
 *         description: User address retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     full_name:
 *                       type: string
 *                     phone:
 *                       type: string
 *                     address_line:
 *                       type: string
 *                     city:
 *                       type: string
 *                     postal_code:
 *                       type: string
 *       401:
 *         description: Unauthorized (missing/invalid token)
 *       404:
 *         description: User or address not found
 *       500:
 *         description: Failed to fetch address
 *   put:
 *     summary: Update user address
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
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               full_name:
 *                 type: string
 *               phone:
 *                 type: string
 *               address_line:
 *                 type: string
 *               city:
 *                 type: string
 *               postal_code:
 *                 type: string
 *     responses:
 *       200:
 *         description: Address updated successfully
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
 *       404:
 *         description: User not found
 *       500:
 *         description: Failed to update address
 */

import { Router, Request, Response } from "express";
import { getUserById, updateUser, getUserWithPassword } from "../services/userService";import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET!;

function getUserFromToken(req: Request): any {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) return null;
  const token = authHeader.split(" ")[1];
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
}

// GET /api/users/:id
router.get("/:id", async (req: Request, res: Response) => {
  const session = getUserFromToken(req);
  const { id } = req.params as { id: string };  
  if (!session || session.id !== id) {
    res.status(401).json({ success: false, message: "Unauthorized" });
    return;
  }
  const user = await getUserById(id);
  if (!user) {
    res.status(404).json({ success: false, message: "User not found" });
    return;
  }
  res.json({ success: true, data: user });
});

// GET /api/users - Get all users currently used for stats on homepage
router.get("/", async (req: Request, res: Response) => {
  try {
    const User = require("../models/User").default;
    const users = await User.find();
    res.json(users);
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Failed to fetch users" });
  }
});

// PUT /api/users/:id
router.put("/:id", async (req: Request, res: Response) => {
  const session = getUserFromToken(req);
  const { id } = req.params as { id: string };
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
  const existingUser = await getUserWithPassword(id);
  const isValid = await bcrypt.compare(req.body.current_password, existingUser.password_hash);
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

  password_hash = await bcrypt.hash(req.body.new_password, 10);
}

  try {
    const user = await updateUser(id, {
      user_name: req.body.user_name,
      user_email: req.body.user_email,
      ...(password_hash && { password_hash }), //spread = removes password field if not filled
    });
  res.json({ success: true, data: user });
  } catch (error: any) {
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
router.get("/:id/address", async (req: Request, res: Response) => {
  const session = getUserFromToken(req);
  const { id } = req.params as { id: string }; // 🔥 FIX

  if (!session || session.id !== id) {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }

  try {
    const user = await getUserById(id);

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    return res.json({
      success: true,
      data: user.address || null,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch address",
    });
  }
});

//update
router.put("/:id/address", async (req: Request, res: Response) => {
  const session = getUserFromToken(req);
  const { id } = req.params as { id: string }; // 🔥 FIX WAJIB

  if (!session || session.id !== id) {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }

  try {
    const user = await updateUser(id, {
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
  } catch (error) {
    console.error(error); // 🔥 penting buat debug
    return res.status(500).json({
      success: false,
      message: "Failed to update address",
    });
  }
});

export default router;