import { Request, Response } from "express";
import { Testimonial } from "../models/Testimonial";
import { uploadImage } from "../utils/cloudinary";
import { createError } from "../middleware/errorHandler";

export const getAllTestimonials = async (_req: Request, res: Response) => {
  try {
    const testimonials = await Testimonial.find({ isPublished: true }).sort({ displayOrder: 1 });
    res.json({ success: true, data: { testimonials } });
  } catch {
    res.status(500).json({ success: false, message: "Failed to fetch testimonials" });
  }
};

export const createTestimonial = async (req: Request, res: Response) => {
  try {
    let image: string | undefined;
    if (req.file) {
      const { url } = await uploadImage(req.file, "testimonials");
      image = url;
    }
    const t = await Testimonial.create({ ...req.body, ...(image && { image }) });
    res.status(201).json({ success: true, data: { testimonial: t }, message: "Testimonial added" });
  } catch {
    res.status(500).json({ success: false, message: "Failed to create testimonial" });
  }
};

export const updateTestimonial = async (req: Request, res: Response) => {
  try {
    let image: string | undefined;
    if (req.file) {
      const { url } = await uploadImage(req.file, "testimonials");
      image = url;
    }
    const t = await Testimonial.findByIdAndUpdate(req.params.id, { ...req.body, ...(image && { image }) }, { new: true });
    if (!t) throw createError("Testimonial not found", 404);
    res.json({ success: true, data: { testimonial: t }, message: "Testimonial updated" });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
};

export const deleteTestimonial = async (req: Request, res: Response) => {
  try {
    const t = await Testimonial.findByIdAndDelete(req.params.id);
    if (!t) throw createError("Testimonial not found", 404);
    res.json({ success: true, message: "Testimonial deleted" });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
};
