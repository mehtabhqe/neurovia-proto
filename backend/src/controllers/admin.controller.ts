import { Request, Response } from "express";
import { Booking } from "../models/Booking";
import { BlogPost } from "../models/BlogPost";
import { ContactMessage } from "../models/ContactMessage";
import { NewsletterSubscriber } from "../models/NewsletterSubscriber";
import { ActivityLog } from "../models/ActivityLog";
import { Service } from "../models/Service";
import { User } from "../models/User";
import { AuthRequest } from "../middleware/auth";

// PRD: Dashboard Widgets — Recent bookings, messages, visitors, blog views, quick statistics
export const getDashboardStats = async (_req: Request, res: Response) => {
  try {
    const now = new Date();
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    const [
      totalBookings,
      bookingsThisMonth,
      bookingsLastMonth,
      pendingBookings,
      inProgressBookings,
      completedBookings,
      cancelledBookings,
      totalMessages,
      newMessages,
      totalPosts,
      publishedPosts,
      totalBlogViews,
      totalSubscribers,
      totalServices,
      activeServices,
      recentBookings,
      recentMessages,
      recentActivity,
    ] = await Promise.all([
      Booking.countDocuments(),
      Booking.countDocuments({ createdAt: { $gte: thisMonthStart } }),
      Booking.countDocuments({ createdAt: { $gte: lastMonthStart, $lt: thisMonthStart } }),
      Booking.countDocuments({ status: "pending" }),
      Booking.countDocuments({ status: "in_progress" }),
      Booking.countDocuments({ status: "completed" }),
      Booking.countDocuments({ status: "cancelled" }),
      ContactMessage.countDocuments(),
      ContactMessage.countDocuments({ status: "new" }),
      BlogPost.countDocuments(),
      BlogPost.countDocuments({ isPublished: true }),
      BlogPost.aggregate([{ $group: { _id: null, total: { $sum: "$views" } } }]),
      NewsletterSubscriber.countDocuments({ isActive: true }),
      Service.countDocuments(),
      Service.countDocuments({ isActive: true }),
      Booking.find().sort({ createdAt: -1 }).limit(5).select("bookingNumber customerName status supportType createdAt"),
      ContactMessage.find().sort({ createdAt: -1 }).limit(5).select("name email subject status createdAt"),
      ActivityLog.find().sort({ createdAt: -1 }).limit(10).populate("adminId", "fullName email"),
    ]);

    // Month-over-month booking growth %
    const bookingGrowth = bookingsLastMonth > 0
      ? Math.round(((bookingsThisMonth - bookingsLastMonth) / bookingsLastMonth) * 100)
      : 100;

    res.json({
      success: true,
      data: {
        bookings: {
          total: totalBookings,
          thisMonth: bookingsThisMonth,
          lastMonth: bookingsLastMonth,
          growth: bookingGrowth,
          pending: pendingBookings,
          inProgress: inProgressBookings,
          completed: completedBookings,
          cancelled: cancelledBookings,
        },
        messages: {
          total: totalMessages,
          new: newMessages,
        },
        blog: {
          total: totalPosts,
          published: publishedPosts,
          drafts: totalPosts - publishedPosts,
          totalViews: totalBlogViews[0]?.total || 0,
        },
        newsletter: {
          subscribers: totalSubscribers,
        },
        services: {
          total: totalServices,
          active: activeServices,
        },
        recentBookings,
        recentMessages,
        recentActivity,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to fetch dashboard stats" });
  }
};

// PRD: Activity Logs — Admin audit trail
export const getActivityLogs = async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 30, adminId, entity } = req.query;
    const query: Record<string, any> = {};

    if (adminId) query.adminId = adminId;
    if (entity) query.entity = entity;

    const skip = (Number(page) - 1) * Number(limit);
    const [logs, total] = await Promise.all([
      ActivityLog.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .populate("adminId", "fullName email role"),
      ActivityLog.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: { logs, total, page: Number(page), totalPages: Math.ceil(total / Number(limit)) },
    });
  } catch {
    res.status(500).json({ success: false, message: "Failed to fetch activity logs" });
  }
};

// PRD: Super Admin — Delete Activity Logs if retention policies permit
export const deleteActivityLogs = async (req: AuthRequest, res: Response) => {
  try {
    const { before } = req.query; // delete logs older than this date
    const query: Record<string, any> = {};
    if (before) query.createdAt = { $lt: new Date(String(before)) };

    const result = await ActivityLog.deleteMany(query);
    res.json({ success: true, message: `${result.deletedCount} logs deleted` });
  } catch {
    res.status(500).json({ success: false, message: "Failed to delete logs" });
  }
};

// PRD: Admin — Manage Admin Users (Super Admin only)
export const getAllAdmins = async (_req: Request, res: Response) => {
  try {
    const admins = await User.find().select("-passwordHash").sort({ createdAt: -1 });
    res.json({ success: true, data: { admins } });
  } catch {
    res.status(500).json({ success: false, message: "Failed to fetch admins" });
  }
};

export const createAdmin = async (req: AuthRequest, res: Response) => {
  try {
    const bcrypt = await import("bcryptjs");
    const { fullName, email, password, role = "admin" } = req.body;

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ success: false, message: "Admin with this email already exists" });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const admin = await User.create({ fullName, email, passwordHash, role });

    if (req.user) {
      await ActivityLog.create({
        adminId: req.user.id,
        action: `Created admin account for ${email}`,
        entity: "User",
        entityId: admin._id.toString(),
        ipAddress: req.ip,
        userAgent: req.get("user-agent"),
      });
    }

    res.status(201).json({ success: true, data: { admin }, message: "Admin created" });
  } catch (error: any) {
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: "Email already in use" });
    }
    res.status(500).json({ success: false, message: "Failed to create admin" });
  }
};

export const updateAdminStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { status } = req.body;
    if (!["active", "inactive"].includes(status)) {
      return res.status(400).json({ success: false, message: "Invalid status" });
    }

    // Prevent super admin from deactivating themselves
    if (req.user?.id === req.params.id) {
      return res.status(400).json({ success: false, message: "Cannot change your own status" });
    }

    const admin = await User.findByIdAndUpdate(req.params.id, { status }, { new: true }).select("-passwordHash");
    if (!admin) return res.status(404).json({ success: false, message: "Admin not found" });

    res.json({ success: true, data: { admin }, message: "Status updated" });
  } catch {
    res.status(500).json({ success: false, message: "Failed to update status" });
  }
};
