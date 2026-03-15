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
 *     responses:
 *       200:
 *         description: User updated
 *       400:
 *         description: Invalid email address
 *       401:
 *         description: Unauthorized
 */

import { Router, Request, Response } from "express";
import { getUserById, updateUser } from "../services/userService";
import jwt from "jsonwebtoken";

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

  const user = await updateUser(id, {
    user_name: req.body.user_name,
    user_email: req.body.user_email,
  });
  res.json({ success: true, data: user });
});

export default router;