import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { User } from "../models/User";
import logger from "../utils/logger";

// Extend Express Request properly — all standard fields (body, params, query, ip, etc.) are inherited
export interface AuthRequest extends Request {
  user?: { id: string; role: string; email: string };
}

export const protect = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const token =
      req.cookies?.accessToken ||
      (req.headers.authorization?.startsWith("Bearer ")
        ? req.headers.authorization.split(" ")[1]
        : undefined);

    if (!token) {
      return res.status(401).json({ success: false, message: "Not authenticated" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
      id: string;
      role: string;
      email: string;
    };

    const user = await User.findById(decoded.id).select("-passwordHash");
    if (!user || user.status !== "active") {
      return res.status(401).json({ success: false, message: "User not found or inactive" });
    }

    req.user = { id: decoded.id, role: decoded.role, email: decoded.email };
    next();
  } catch (error) {
    logger.error("Auth middleware error:", error);
    return res.status(401).json({ success: false, message: "Invalid or expired token" });
  }
};

export const adminOnly = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.user || !["admin", "super_admin"].includes(req.user.role)) {
    return res.status(403).json({ success: false, message: "Admin access required" });
  }
  next();
};

export const superAdminOnly = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.user || req.user.role !== "super_admin") {
    return res.status(403).json({ success: false, message: "Super admin access required" });
  }
  next();
};
