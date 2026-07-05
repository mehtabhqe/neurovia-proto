import { z } from "zod";

export const createBookingSchema = z.object({
  customerName: z.string().min(2, "Name must be at least 2 characters").max(100),
  email: z.string().email("Invalid email address"),
  phone: z
    .string()
    .regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit Indian mobile number"),
  deviceType: z.string().min(1, "Device type is required"),
  deviceBrand: z.string().optional(),
  operatingSystem: z.string().optional(),
  issueDescription: z.string().min(20, "Please describe the issue in at least 20 characters"),
  supportType: z.enum(["remote", "onsite"]),
  preferredDate: z.string().optional(),
  preferredTime: z.string().optional(),
});

export const updateBookingStatusSchema = z.object({
  status: z.enum(["pending", "confirmed", "assigned", "in_progress", "completed", "cancelled"]),
  notes: z.string().optional(),
});

export const assignTechnicianSchema = z.object({
  assignedTechnician: z.string().min(2, "Technician name is required"),
});
