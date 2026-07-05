import { Request, Response } from "express";
import { Settings } from "../models/Settings";
import { uploadImage, deleteImage } from "../utils/cloudinary";
import { ActivityLog } from "../models/ActivityLog";
import { AuthRequest } from "../middleware/auth";
import logger from "../utils/logger";

// PRD: Settings — Company info, logo, social links, countdown date, hero text, footer text
export const getSettings = async (_req: Request, res: Response) => {
  try {
    let settings = await Settings.findOne();

    if (!settings) {
      // Auto-seed default settings on first request
      settings = await Settings.create({
        companyName: "Neurovia Nexus",
        tagline: "IT Support. Software Solutions. AI Innovation.",
        supportEmail: "support@neurovianexus.com",
        phone: "+91 98765 43210",
        address: "Mumbai, Maharashtra, India",
        heroHeadline: "IT Support. Software Solutions. AI Innovation.",
        heroSubtitle:
          "Professional remote and onsite IT services powered by certified experts and the future of autonomous diagnostics.",
        countdownTargetDate: new Date(Date.now() + 645 * 24 * 60 * 60 * 1000),
        socialLinks: {
          linkedin: "",
          twitter: "",
          instagram: "",
          facebook: "",
        },
      });
    }

    res.json({ success: true, data: { settings } });
  } catch (error) {
    logger.error("Get settings error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch settings" });
  }
};

export const updateSettings = async (req: AuthRequest, res: Response) => {
  try {
    const existing = await Settings.findOne();
    let logo: string | undefined;

    if (req.file) {
      const { url } = await uploadImage(req.file, "settings");
      logo = url;
    }

    // Parse socialLinks if sent as a JSON string (from multipart form)
    let socialLinks = req.body.socialLinks;
    if (typeof socialLinks === "string") {
      try {
        socialLinks = JSON.parse(socialLinks);
      } catch {
        socialLinks = undefined;
      }
    }

    const updatePayload = {
      ...req.body,
      ...(socialLinks && { socialLinks }),
      ...(logo && { logo }),
    };

    const settings = await Settings.findOneAndUpdate({}, updatePayload, {
      new: true,
      upsert: true,
    });

    if (req.user) {
      await ActivityLog.create({
        adminId: req.user.id,
        action: "Updated website settings",
        entity: "Settings",
        entityId: settings._id.toString(),
        ipAddress: req.ip,
        userAgent: req.get("user-agent"),
      });
    }

    res.json({ success: true, data: { settings }, message: "Settings updated successfully" });
  } catch (error) {
    logger.error("Update settings error:", error);
    res.status(500).json({ success: false, message: "Failed to update settings" });
  }
};

// PRD: Countdown — Update launch date
export const updateCountdown = async (req: AuthRequest, res: Response) => {
  try {
    const { countdownTargetDate } = req.body;

    if (!countdownTargetDate) {
      return res.status(400).json({ success: false, message: "countdownTargetDate is required" });
    }

    const settings = await Settings.findOneAndUpdate(
      {},
      { countdownTargetDate: new Date(countdownTargetDate) },
      { new: true, upsert: true }
    );

    if (req.user) {
      await ActivityLog.create({
        adminId: req.user.id,
        action: `Updated countdown target date to ${countdownTargetDate}`,
        entity: "Settings",
        entityId: settings._id.toString(),
        ipAddress: req.ip,
        userAgent: req.get("user-agent"),
      });
    }

    res.json({ success: true, data: { settings }, message: "Countdown updated" });
  } catch {
    res.status(500).json({ success: false, message: "Failed to update countdown" });
  }
};
