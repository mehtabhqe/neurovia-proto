import mongoose, { Document, Schema } from "mongoose";

export interface IBooking extends Document {
  bookingNumber: string;
  customerName: string;
  email: string;
  phone: string;
  deviceType: string;
  deviceBrand?: string;
  operatingSystem?: string;
  issueDescription: string;
  uploadedImages: string[];
  supportType: "remote" | "onsite";
  preferredDate?: Date;
  preferredTime?: string;
  status: "pending" | "confirmed" | "assigned" | "in_progress" | "completed" | "cancelled";
  assignedTechnician?: string;
  internalNotes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const bookingSchema = new Schema<IBooking>(
  {
    bookingNumber: { type: String, required: true, unique: true },
    customerName: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    phone: { type: String, required: true },
    deviceType: { type: String, required: true },
    deviceBrand: { type: String },
    operatingSystem: { type: String },
    issueDescription: { type: String, required: true, minlength: 20 },
    uploadedImages: [{ type: String }],
    supportType: { type: String, enum: ["remote", "onsite"], required: true },
    preferredDate: { type: Date },
    preferredTime: { type: String },
    status: {
      type: String,
      enum: ["pending", "confirmed", "assigned", "in_progress", "completed", "cancelled"],
      default: "pending",
    },
    assignedTechnician: { type: String },
    internalNotes: { type: String },
  },
  { timestamps: true }
);

// unique: true already creates the index for bookingNumber
bookingSchema.index({ status: 1 });
bookingSchema.index({ email: 1 });
bookingSchema.index({ phone: 1 });
bookingSchema.index({ preferredDate: 1 });
bookingSchema.index({ createdAt: -1 });

export const Booking = mongoose.model<IBooking>("Booking", bookingSchema);
