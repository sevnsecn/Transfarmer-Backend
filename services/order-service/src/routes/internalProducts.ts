import { Router } from "express";
import Product from "../models/Product";

const router = Router();

// sync create/update product from product-service
router.put("/products/:id", async (req, res) => {
  try {
    await Product.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        upsert: true,
        new: true,
      }
    );

    res.json({ success: true });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
    });
  }
});

// sync delete product from product-service
router.delete("/products/:id", async (req, res) => {
  try {
    await Product.findByIdAndDelete(req.params.id);

    res.json({ success: true });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
    });
  }
});

export default router;