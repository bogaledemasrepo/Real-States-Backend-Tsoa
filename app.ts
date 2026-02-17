import express, { json, urlencoded } from "express";
import { RegisterRoutes } from "./generated/routes"; // Clean import!
import swaggerUi from "swagger-ui-express";
import swaggerDocument from "./generated/swagger.json";
import { errorHandler } from "./exceptions/exceptionHandler";
import cors from "cors";

export const app = express();
app.use(
  cors({
    origin: "*",
    allowedHeaders: ["Content-Type", "Authorization"],
    methods: ["GET", "POST", "PUT", "DELETE"],
  }),
);

app.use(
  "/docs",
  swaggerUi.serve,
  swaggerUi.setup(swaggerDocument, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  }),
);

app.use(urlencoded({ extended: true }), json());

RegisterRoutes(app);
app.use(errorHandler);
