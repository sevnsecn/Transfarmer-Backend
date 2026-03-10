/**
 * @swagger
 * /api/auth/signup:
 *   post:
 *     summary: Register a new user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [user_name, user_email, password]
 *             properties:
 *               user_name:
 *                 type: string
 *               user_email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       201:
 *         description: User created
 *       400:
 *         description: Missing fields or user already exists
 * /api/auth/login:
 *   post:
 *     summary: Login and receive a JWT token
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [user_email, password]
 *             properties:
 *               user_email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful, returns token
 *       401:
 *         description: Invalid credentials
 *       500:
 *         description: Login failed
 */

import { Router, Request, Response } from "express";
import { createUser, findUserByEmail } from "../services/userService";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET!;

// POST /api/auth/signup
router.post("/signup", async (req: Request, res: Response) => {
  try {
    const { user_name, user_email, password } = req.body;
    if (!user_name || !user_email || !password) {
      res.status(400).json({ success: false, message: "All fields required" });
      return;
    }
    const password_hash = await bcrypt.hash(password, 10);
    const user = await createUser({ user_name, user_email, password_hash });
    res.status(201).json({ success: true, data: user });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// POST /api/auth/login
router.post("/login", async (req: Request, res: Response) => {
  try {
    const { user_email, password } = req.body;
    const user = await findUserByEmail(user_email);
    if (!user) {
      res.status(401).json({ success: false, message: "Invalid credentials" });
      return;
    }
    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) {
      res.status(401).json({ success: false, message: "Invalid credentials" });
      return;
    }
    const token = jwt.sign(
      { id: user._id, is_admin: user.is_admin },
      JWT_SECRET,
      { expiresIn: "7d" }
    );
    res.json({ success: true, token });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ success: false, message: "Login failed" });
  }
});

export default router;