import dotenv from "dotenv";
dotenv.config();
import express from "express";
import cors from "cors";
import swaggerJsdoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";
import uploadRoutes from "./routes/upload/image";

const app = express();
app.use(cors());
app.use(express.json());

const swaggerSpec = swaggerJsdoc({
  definition: {
    openapi: "3.0.0",
    info: { title: "Upload Service API", version: "1.0.0" },
    components: { securitySchemes: { bearerAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT" } } },
  },
  apis: ["./src/routes/**/*.ts"],
});
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use("/api/upload/image", uploadRoutes);

app.listen(5005, () => console.log("Upload service running on port 5005"));