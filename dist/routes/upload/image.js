"use strict";
/**
 * @swagger
 * /api/upload/image:
 *   post:
 *     summary: Upload an image to Cloudinary (admin only)
 *     tags: [Upload]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [image]
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: Image file to upload (max 5MB)
 *     responses:
 *       200:
 *         description: Image uploaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 url:
 *                   type: string
 *                   description: Cloudinary URL of the uploaded image
 *       400:
 *         description: No file provided or invalid file type
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Admin access required
 *       500:
 *         description: Upload failed
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
//Shared route for both farmer and product image uploads
const express_1 = require("express");
const cloudinary_1 = require("cloudinary");
const multer_1 = __importDefault(require("multer"));
const auth_1 = require("../../middleware/auth");
const router = (0, express_1.Router)();
// Use memory storage so we can stream the buffer directly to Cloudinary
const storage = multer_1.default.memoryStorage();
const upload = (0, multer_1.default)({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith("image/")) {
            cb(null, true);
        }
        else {
            cb(new Error("Only image files are allowed"));
        }
    }
});
// POST /api/upload/image
router.post("/", auth_1.requireAdmin, upload.single("image"), async (req, res) => {
    try {
        if (!req.file) {
            res.status(400).json({ success: false, message: "No file provided" });
            return;
        }
        // Upload buffer to Cloudinary using upload_stream
        const result = await new Promise((resolve, reject) => {
            const stream = cloudinary_1.v2.uploader.upload_stream({ folder: "transfarmers" }, (error, result) => {
                if (error)
                    reject(error);
                else
                    resolve(result);
            });
            stream.end(req.file.buffer);
        });
        res.json({ success: true, url: result.secure_url });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message || "Upload failed" });
    }
});
exports.default = router;
