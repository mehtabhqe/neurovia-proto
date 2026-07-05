import { Response, NextFunction } from "express";
import { AuthRequest } from "./auth";
import { ActivityLog } from "../models/ActivityLog";
import logger from "../utils/logger";

export const logActivity =
  (action: string, entity: string) =>
  async (req: AuthRequest, _res: Response, next: NextFunction) => {
    if (req.user) {
      try {
        await ActivityLog.create({
          adminId: req.user.id,
          action,
          entity,
          entityId: req.params?.id,
          ipAddress: req.ip,
          userAgent: req.get("user-agent"),
        });
      } catch (error) {
        logger.error("Activity log error:", error);
      }
    }
    next();
  };
