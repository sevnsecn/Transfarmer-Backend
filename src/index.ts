import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import swaggerJsdoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";

import authRoutes from "./routes/auth";
import userRoutes from "./routes/users";
import farmRoutes from "./routes/farms";
import productRoutes from "./routes/products";
import orderRoutes from "./routes/orders";
import orderItemRoutes from "./routes/orderItems";
import uploadRoutes from "./routes/upload/image";
import { autoCompleteOrders } from "./services/orderService";



const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Swagger
const swaggerOptions = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Transfarmers API",
      version: "1.0.0",
      description: "REST API for Transfarmers farm marketplace",
    },
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
    },
  },
  apis: ["./src/routes/*.ts"],
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/farms", farmRoutes);
app.use("/api/products", productRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/orders/:id/order_items", orderItemRoutes);
app.use("/api/orderItems", orderItemRoutes);
app.use("/api/upload/image", uploadRoutes);

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Swagger docs at http://localhost:${PORT}/api-docs`);
});

// Run auto-complete check every 6 hours
setInterval(async () => {
  try {
    const count = await autoCompleteOrders();
    if (count > 0) console.log(`[auto-complete] ${count} orders completed`);
  } catch (err) {
    console.error("[auto-complete] error:", err);
  }
}, 6 * 60 * 60 * 1000);