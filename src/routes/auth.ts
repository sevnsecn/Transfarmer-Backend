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
 *                 example: user
 *               user_email:
 *                 type: string
 *                 example: user@example.com
 *               password:
 *                 type: string
 *                 example: password123
 *     responses:
 *       201:
 *         description: User created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     user_name:
 *                       type: string
 *                     user_email:
 *                       type: string
 *       400:
 *         description: Missing fields, weak password (min 6 chars, at least 1 letter or symbol), invalid email, or email already exists
 *       500:
 *         description: Server error
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
 *                 example: user@example.com
 *               password:
 *                 type: string
 *                 example: password123
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 token:
 *                   type: string
 *                   description: JWT authentication token
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

// Email validation regex
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// POST /api/auth/signup
router.post("/signup", async (req: Request, res: Response) => {
  try {
    const { user_name, user_email, password } = req.body;
    
    if (!user_name || !user_email || !password) {
      res.status(400).json({ success: false, message: "All fields required" });
      return;
    }

    // Valid email check
    if (!emailRegex.test(user_email)) {
      res.status(400).json({ success: false, message: "Invalid email address" });
      return;
    }

    if (password.length < 6) {
      res.status(400).json({ success: false, message: "Password must be at least 6 characters" });
      return;
    }

    
    if (!/[a-zA-Z]/.test(password) && !/[^a-zA-Z0-9]/.test(password)) {
      res.status(400).json({ success: false, message: "Password must contain at least 1 letter or 1 symbol" });
      return;
    }



    const password_hash = await bcrypt.hash(password, 10);
    const user = await createUser({ user_name, user_email, password_hash });
    res.status(201).json({ success: true, data: user });
  } catch (error: any) {
    // Duplicate email check received from service layer
    if (error.message === "Email already exists") {
      res.status(400).json({ success: false, message: "Email already exists" });
      return;
    }
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
    res.json({ 
      success: true, 
      token,
      user: {
        id: user._id,
        user_name: user.user_name,
        user_email: user.user_email,
        is_admin: user.is_admin
      }
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ success: false, message: "Login failed" });
  }
});

export default router;