import express, { Application } from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import cookieParser from "cookie-parser";
import morgan from "morgan";
import path from "path";
import swaggerUi from "swagger-ui-express";

import { env, isDev } from "./config/env";
import { morganStream } from "./config/logger";
import { swaggerSpec } from "./config/swagger";
import { globalRateLimiter } from "./middleware/rateLimit.middleware";
import { errorHandler, notFoundHandler } from "./middleware/error.middleware";
import apiRoutes from "./routes";

export function createApp(): Application {
  const app = express();

  app.set("trust proxy", 1);

  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: "cross-origin" },
    })
  );

  app.use(
    cors({
      origin: env.CORS_ORIGIN.split(",").map((o) => o.trim()),
      credentials: true,
    })
  );

  app.use(compression());
  app.use(express.json({ limit: "2mb" }));
  app.use(express.urlencoded({ extended: true, limit: "2mb" }));
  app.use(cookieParser());
  app.use(morgan(isDev ? "dev" : "combined", { stream: morganStream }));

  app.use(globalRateLimiter);

  app.use("/uploads", express.static(path.resolve(process.cwd(), env.UPLOAD_DIR)));

  app.get("/health", (_req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString(), env: env.NODE_ENV });
  });

  app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
  app.get("/api/docs.json", (_req, res) => res.json(swaggerSpec));

  app.use("/api/v1", apiRoutes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
