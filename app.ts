import express, { json, urlencoded, type Request, type Response } from "express";
import { RegisterRoutes } from "./generated/routes";
import swaggerUi from "swagger-ui-express";
import swaggerDocument from "./generated/swagger.json";
import { errorHandler } from "./exceptions/exceptionHandler";
import cors from "cors";
import pinoHTTP from "pino-http";
import { logger } from "./logger"; // Import the logger we created
import { db } from "./db"; // Import your db to check connection
import { sql } from "drizzle-orm";

export const app = express();

// 1. Industry Standard Logging
app.use(pinoHTTP({ logger }));

app.use(
  cors({
    origin: "*",
    allowedHeaders: ["Content-Type", "Authorization"],
    methods: ["GET", "POST", "PUT", "DELETE"],
  }),
);

app.use(express.static("uploads"));

// 2. Health Check Endpoint
// Essential for Docker/CI-CD orchestration
app.get("/health", async (_req: Request, res: Response) => {
  try {
    // Check if Database is reachable
    await db.execute(sql`SELECT 1`);
    res.status(200).json({ 
      status: "UP", 
      timestamp: new Date().toISOString(),
      database: "connected" 
    });
  } catch (error) {
    logger.error("Health check failed: " + error);
    res.status(503).json({ status: "DOWN", database: "disconnected" });
  }
});

app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument, {
    swaggerOptions: {
      persistAuthorization: true,
    },
}));

app.use(urlencoded({ extended: true }), json());

// 3. Register Routes
RegisterRoutes(app);

// 4. Global Error Handler
app.use(errorHandler);