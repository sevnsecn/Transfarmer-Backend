"use strict";
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
 *         description: User created
 *       400:
 *         description: Missing fields, weak password(min 6 chars, at least 1 letter or symbol), invalid email, or email already exists
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
 *         description: Login successful, returns token
 *       401:
 *         description: Invalid credentials
 *       500:
 *         description: Login failed
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const userService_1 = require("../services/userService");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const router = (0, express_1.Router)();
const JWT_SECRET = process.env.JWT_SECRET;
// Email validation regex
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// POST /api/auth/signup
router.post("/signup", async (req, res) => {
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
        const password_hash = await bcryptjs_1.default.hash(password, 10);
        const user = await (0, userService_1.createUser)({ user_name, user_email, password_hash });
        res.status(201).json({ success: true, data: user });
    }
    catch (error) {
        // Duplicate email check received from service layer
        if (error.message === "Email already exists") {
            res.status(400).json({ success: false, message: "Email already exists" });
            return;
        }
        res.status(400).json({ success: false, message: error.message });
    }
});
// POST /api/auth/login
router.post("/login", async (req, res) => {
    try {
        const { user_email, password } = req.body;
        const user = await (0, userService_1.findUserByEmail)(user_email);
        if (!user) {
            res.status(401).json({ success: false, message: "Invalid credentials" });
            return;
        }
        const isValid = await bcryptjs_1.default.compare(password, user.password_hash);
        if (!isValid) {
            res.status(401).json({ success: false, message: "Invalid credentials" });
            return;
        }
        const token = jsonwebtoken_1.default.sign({ id: user._id, is_admin: user.is_admin }, JWT_SECRET, { expiresIn: "7d" });
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
    }
    catch (error) {
        console.error("Login error:", error);
        res.status(500).json({ success: false, message: "Login failed" });
    }
});
exports.default = router;
