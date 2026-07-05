import { Request, Response } from "express";
import { ContactMessage } from "../models/ContactMessage";
import { NewsletterSubscriber } from "../models/NewsletterSubscriber";
import { createError } from "../middleware/errorHandler";
import { sendContactConfirmation } from "../services/email.service";
import { AuthRequest } from "../middleware/auth";
import { ActivityLog } from "../models/ActivityLog";
import logger from "../utils/logger";

// ── PUBLIC ──

export const submitContact = async (req: Request, res: Response) => {
  try {
    const message = await ContactMessage.create(req.body);

    // Fire-and-forget confirmation email
    sendContactConfirmation({
      name: message.name,
      email: message.email,
      subject: message.subject,
      message: message.message,
    }).catch((e) => logger.error("Contact confirmation email failed:", e));

    res.status(201).json({
      success: true,
      data: { message },
      message: "Message sent successfully! We'll get back to you within 24 hours.",
    });
  } catch {
    res.status(500).json({ success: false, message: "Failed to send message" });
  }
};

export const subscribeNewsletter = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    const existing = await NewsletterSubscriber.findOne({ email });

    if (existing) {
      if (existing.isActive) {
        return res.json({ success: true, message: "You're already subscribed!" });
      }
      existing.isActive = true;
      await existing.save();
      return res.json({ success: true, message: "Welcome back! You've been resubscribed." });
    }

    await NewsletterSubscriber.create({ email });
    res.status(201).json({ success: true, message: "Successfully subscribed to newsletter!" });
  } catch {
    res.status(500).json({ success: false, message: "Failed to subscribe" });
  }
};

// ── ADMIN ──

export const getAllMessages = async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 20, status, search } = req.query;
    const query: Record<string, any> = {};

    if (status) query.status = status;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { subject: { $regex: search, $options: "i" } },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);
    const [messages, total] = await Promise.all([
      ContactMessage.find(query).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
      ContactMessage.countDocuments(query),
    ]);

    res.json({ success: true, data: { messages, total } });
  } catch {
    res.status(500).json({ success: false, message: "Failed to fetch messages" });
  }
};

export const updateMessageStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { status } = req.body;
    const validStatuses = ["new", "read", "replied", "closed"];
    if (!validStatuses.includes(status)) {
      throw createError("Invalid status value", 400);
    }

    const message = await ContactMessage.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );
    if (!message) throw createError("Message not found", 404);

    if (req.user) {
      await ActivityLog.create({
        adminId: req.user.id,
        action: `Updated contact message status to "${status}"`,
        entity: "ContactMessage",
        entityId: message._id.toString(),
        ipAddress: req.ip,
        userAgent: req.get("user-agent"),
      });
    }

    res.json({ success: true, data: { message }, message: "Status updated" });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
};

export const getAllSubscribers = async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const [subscribers, total] = await Promise.all([
      NewsletterSubscriber.find({ isActive: true })
        .sort({ subscribedAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      NewsletterSubscriber.countDocuments({ isActive: true }),
    ]);

    res.json({ success: true, data: { subscribers, total } });
  } catch {
    res.status(500).json({ success: false, message: "Failed to fetch subscribers" });
  }
};
