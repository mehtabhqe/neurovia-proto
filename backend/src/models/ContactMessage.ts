import mongoose, { Document, Schema } from "mongoose";

export interface IContactMessage extends Document {
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
  status: "new" | "read" | "replied" | "closed";
  createdAt: Date;
}

const contactMessageSchema = new Schema<IContactMessage>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    phone: { type: String },
    subject: { type: String, required: true, trim: true },
    message: { type: String, required: true },
    status: { type: String, enum: ["new", "read", "replied", "closed"], default: "new" },
  },
  { timestamps: true }
);

contactMessageSchema.index({ email: 1 });
contactMessageSchema.index({ status: 1 });
contactMessageSchema.index({ createdAt: -1 });

export const ContactMessage = mongoose.model<IContactMessage>("ContactMessage", contactMessageSchema);
