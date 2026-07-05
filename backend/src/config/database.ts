import mongoose from "mongoose";
import logger from "../utils/logger";

const connectDB = async (): Promise<void> => {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("MONGODB_URI is not defined in environment variables");

  try {
    const conn = await mongoose.connect(uri, {
      autoIndex: true,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    logger.info(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    logger.error("❌ MongoDB connection failed:", error);
    process.exit(1);
  }
};

mongoose.connection.on("disconnected", () => {
  logger.warn("MongoDB disconnected. Attempting reconnect...");
});

mongoose.connection.on("reconnected", () => {
  logger.info("MongoDB reconnected");
});

export default connectDB;
