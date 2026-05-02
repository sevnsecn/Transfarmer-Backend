import dotenv from "dotenv";
dotenv.config();
import express from "express";
import cors from "cors";
import swaggerJsdoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";
import orderRoutes from "./routes/orders";
import orderItemRoutes from "./routes/orderItems";

const app = express();
app.use(cors());
app.use(express.json());

const swaggerSpec = swaggerJsdoc({
  definition: {
    openapi: "3.0.0",
    info: { title: "Order Service API", version: "1.0.0" },
    components: { securitySchemes: { bearerAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT" } } },
  },
  apis: ["./src/routes/*.ts"],
});
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use("/api/orders", orderRoutes);
app.use("/api/orders/:id/order_items", orderItemRoutes);
app.use("/api/orderItems", orderItemRoutes);

app.listen(5004, () => console.log("Order service running on port 5004"));