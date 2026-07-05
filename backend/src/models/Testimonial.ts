import mongoose, { Document, Schema } from "mongoose";

export interface ITestimonial extends Document {
  customerName: string;
  designation?: string;
  company?: string;
  message: string;
  rating: number;
  image?: string;
  displayOrder: number;
  isFeatured: boolean;
  isPublished: boolean;
  createdAt: Date;
}

const testimonialSchema = new Schema<ITestimonial>(
  {
    customerName: { type: String, required: true, trim: true },
    designation: { type: String },
    company: { type: String },
    message: { type: String, required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    image: { type: String },
    displayOrder: { type: Number, default: 0 },
    isFeatured: { type: Boolean, default: false },
    isPublished: { type: Boolean, default: true },
  },
  { timestamps: true }
);

testimonialSchema.index({ displayOrder: 1 });
testimonialSchema.index({ isPublished: 1 });
testimonialSchema.index({ isFeatured: 1 });

export const Testimonial = mongoose.model<ITestimonial>("Testimonial", testimonialSchema);
