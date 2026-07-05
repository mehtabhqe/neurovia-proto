import { Request, Response } from "express";
import { Booking } from "../models/Booking";
import { generateBookingNumber } from "../utils/bookingNumber";
import { uploadImage } from "../utils/cloudinary";
import { createError } from "../middleware/errorHandler";
import { sendBookingConfirmation, sendAdminBookingAlert } from "../services/email.service";
import { AuthRequest } from "../middleware/auth";
import { ActivityLog } from "../models/ActivityLog";
import logger from "../utils/logger";

export const createBooking = async (req: Request, res: Response) => {
  try {
    const bookingNumber = await generateBookingNumber();
    const uploadedImages: string[] = [];

    if (req.files && Array.isArray(req.files)) {
      // Hard cap at 5 images regardless of what multer already enforces
      for (const file of req.files.slice(0, 5)) {
        const { url } = await uploadImage(file, "bookings");
        uploadedImages.push(url);
      }
    }

    const booking = await Booking.create({
      ...req.body,
      bookingNumber,
      uploadedImages,
      status: "pending",
    });

    // Fire-and-forget email notifications — do not block the response on email delivery
    const emailPayload = {
      bookingNumber: booking.bookingNumber,
      customerName: booking.customerName,
      email: booking.email,
      deviceType: booking.deviceType,
      supportType: booking.supportType,
      issueDescription: booking.issueDescription,
    };
    sendBookingConfirmation(emailPayload).catch((e) => logger.error("Booking confirmation email failed:", e));
    sendAdminBookingAlert(emailPayload).catch((e) => logger.error("Admin booking alert email failed:", e));

    res.status(201).json({
      success: true,
      data: { booking },
      message: "Booking submitted successfully",
    });
  } catch (error: any) {
    logger.error("Create booking error:", error);
    res.status(500).json({ success: false, message: "Failed to create booking" });
  }
};

export const getAllBookings = async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 20, status, search } = req.query;
    const query: Record<string, any> = {};

    if (status) query.status = status;
    if (search) {
      query.$or = [
        { bookingNumber: { $regex: search, $options: "i" } },
        { customerName: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { phone: { $regex: search, $options: "i" } },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);
    const [bookings, total] = await Promise.all([
      Booking.find(query).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
      Booking.countDocuments(query),
    ]);

    res.json({ success: true, data: { bookings, total, page: Number(page), totalPages: Math.ceil(total / Number(limit)) } });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to fetch bookings" });
  }
};

export const getBookingById = async (req: Request, res: Response) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) throw createError("Booking not found", 404);
    res.json({ success: true, data: { booking } });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
};

export const updateBookingStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;

    const booking = await Booking.findByIdAndUpdate(
      id,
      { status, ...(notes && { internalNotes: notes }) },
      { new: true }
    );

    if (!booking) throw createError("Booking not found", 404);

    if (req.user) {
      await ActivityLog.create({
        adminId: req.user.id,
        action: `Updated booking status to "${status}"`,
        entity: "Booking",
        entityId: booking._id.toString(),
        ipAddress: req.ip,
        userAgent: req.get("user-agent"),
      });
    }

    res.json({ success: true, data: { booking }, message: "Status updated" });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
};

export const assignTechnician = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { assignedTechnician } = req.body;

    if (!assignedTechnician) throw createError("assignedTechnician is required", 400);

    const booking = await Booking.findByIdAndUpdate(
      id,
      { assignedTechnician, status: "assigned" },
      { new: true }
    );

    if (!booking) throw createError("Booking not found", 404);

    if (req.user) {
      await ActivityLog.create({
        adminId: req.user.id,
        action: `Assigned technician "${assignedTechnician}"`,
        entity: "Booking",
        entityId: booking._id.toString(),
        ipAddress: req.ip,
        userAgent: req.get("user-agent"),
      });
    }

    res.json({ success: true, data: { booking }, message: "Technician assigned" });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
};

export const deleteBooking = async (req: AuthRequest, res: Response) => {
  try {
    const booking = await Booking.findByIdAndDelete(req.params.id);
    if (!booking) throw createError("Booking not found", 404);

    if (req.user) {
      await ActivityLog.create({
        adminId: req.user.id,
        action: "Deleted booking",
        entity: "Booking",
        entityId: req.params.id,
        ipAddress: req.ip,
        userAgent: req.get("user-agent"),
      });
    }

    res.json({ success: true, message: "Booking deleted" });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
};

export const exportBookingsCSV = async (req: Request, res: Response) => {
  try {
    const { status } = req.query;
    const query: Record<string, any> = {};
    if (status) query.status = status;

    const bookings = await Booking.find(query).sort({ createdAt: -1 });

    const headers = [
      "Booking Number", "Customer Name", "Email", "Phone", "Device Type",
      "Device Brand", "OS", "Support Type", "Status", "Preferred Date",
      "Preferred Time", "Assigned Technician", "Created At",
    ];

    const escapeCSV = (val: unknown) => {
      const str = String(val ?? "");
      return /[",\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
    };

    const rows = bookings.map((b) =>
      [
        b.bookingNumber, b.customerName, b.email, b.phone, b.deviceType,
        b.deviceBrand || "", b.operatingSystem || "", b.supportType, b.status,
        b.preferredDate ? new Date(b.preferredDate).toLocaleDateString() : "",
        b.preferredTime || "", b.assignedTechnician || "",
        new Date(b.createdAt).toLocaleString(),
      ]
        .map(escapeCSV)
        .join(",")
    );

    const csv = [headers.join(","), ...rows].join("\n");

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename="bookings-${Date.now()}.csv"`);
    res.send(csv);
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to export bookings" });
  }
};
