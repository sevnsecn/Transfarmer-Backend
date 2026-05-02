import dotenv from "dotenv";
dotenv.config();
import express from "express";
import cors from "cors";
import swaggerJsdoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";
import farmRoutes from "./routes/farms";

const app = express();
app.use(cors());
app.use(express.json());

const swaggerSpec = swaggerJsdoc({
  definition: {
    openapi: "3.0.0",
    info: { title: "Farm Service API", version: "1.0.0" },
    components: { securitySchemes: { bearerAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT" } } },
  },
  apis: ["./src/routes/*.ts"],
});
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use("/api/farms", farmRoutes);

app.listen(5002, () => console.log("Farm service running on port 5002"));