import "dotenv/config";
import express from "express";
import helmet from "helmet";
import cors from "cors";
import cookieParser from "cookie-parser";
import morgan from "morgan";
import mongoSanitize from "express-mongo-sanitize";

import connectDB from "./config/database";
import { globalLimiter } from "./middleware/rateLimiter";
import { errorHandler, notFound } from "./middleware/errorHandler";
import router from "./routes";
import logger from "./utils/logger";

const app = express();
const PORT = process.env.PORT || 5000;

// Security Headers
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
}));

// CORS
const allowedOrigins = [
  process.env.FRONTEND_URL || "http://localhost:3000",
  "http://localhost:3000",
  "http://127.0.0.1:5500",  // Live Server VS Code
  "http://localhost:5500",
];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (file://, mobile apps, Postman, curl)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    callback(null, true); // Allow all during development
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));

// Global rate limiter
app.use(globalLimiter);

// Body parsing
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(cookieParser(process.env.COOKIE_SECRET));

// Sanitize MongoDB queries
app.use(mongoSanitize());

// Logging
if (process.env.NODE_ENV !== "test") {
  app.use(morgan("combined", { stream: { write: (msg) => logger.info(msg.trim()) } }));
}

// Routes
app.use("/api", router);

// Error handling
app.use(notFound);
app.use(errorHandler);

// Start server
const start = async () => {
  await connectDB();
  app.listen(PORT, () => {
    logger.info(`🚀 Neurovia Nexus Backend running on port ${PORT}`);
    logger.info(`🌍 Environment: ${process.env.NODE_ENV || "development"}`);
  });
};

start().catch((error) => {
  logger.error("Failed to start server:", error);
  process.exit(1);
});

export default app;
