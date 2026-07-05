import { Request, Response } from "express";
import { Service } from "../models/Service";
import { Category } from "../models/Category";
import { uploadImage } from "../utils/cloudinary";
import { createError } from "../middleware/errorHandler";
import { ActivityLog } from "../models/ActivityLog";
import { AuthRequest } from "../middleware/auth";
import { slugify } from "../utils/helpers";

// ── PUBLIC ──

export const getAllServices = async (req: Request, res: Response) => {
  try {
    const { category, supportType, search, featured } = req.query;
    const query: Record<string, any> = { isActive: true };

    if (category) query.categoryId = category;
    if (supportType) query.supportType = { $in: [supportType, "both"] };
    if (featured === "true") query.isFeatured = true;
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { shortDescription: { $regex: search, $options: "i" } },
      ];
    }

    const services = await Service.find(query)
      .sort({ displayOrder: 1, createdAt: -1 })
      .populate("categoryId", "name slug icon");

    res.json({ success: true, data: { services } });
  } catch {
    res.status(500).json({ success: false, message: "Failed to fetch services" });
  }
};

export const getServiceBySlug = async (req: Request, res: Response) => {
  try {
    const service = await Service.findOne({ slug: req.params.slug, isActive: true })
      .populate("categoryId");
    if (!service) throw createError("Service not found", 404);
    res.json({ success: true, data: { service } });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
};

export const getAllCategories = async (_req: Request, res: Response) => {
  try {
    const categories = await Category.find().sort({ displayOrder: 1 });
    res.json({ success: true, data: { categories } });
  } catch {
    res.status(500).json({ success: false, message: "Failed to fetch categories" });
  }
};

// ── ADMIN ──

export const adminGetAllServices = async (req: Request, res: Response) => {
  try {
    const { search, categoryId, isActive } = req.query;
    const query: Record<string, any> = {};

    if (isActive !== undefined) query.isActive = isActive === "true";
    if (categoryId) query.categoryId = categoryId;
    if (search) query.$or = [
      { title: { $regex: search, $options: "i" } },
      { shortDescription: { $regex: search, $options: "i" } },
    ];

    const services = await Service.find(query)
      .sort({ displayOrder: 1 })
      .populate("categoryId", "name slug");

    res.json({ success: true, data: { services } });
  } catch {
    res.status(500).json({ success: false, message: "Failed to fetch services" });
  }
};

export const createService = async (req: AuthRequest, res: Response) => {
  try {
    let image: string | undefined;
    if (req.file) {
      const { url } = await uploadImage(req.file, "services");
      image = url;
    }

    const slug = slugify(req.body.title);
    const service = await Service.create({
      ...req.body,
      slug,
      ...(image && { image }),
    });

    if (req.user) {
      await ActivityLog.create({
        adminId: req.user.id,
        action: "Created service",
        entity: "Service",
        entityId: service._id.toString(),
        ipAddress: req.ip,
        userAgent: req.get("user-agent"),
      });
    }

    res.status(201).json({ success: true, data: { service }, message: "Service created" });
  } catch (error: any) {
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: "Service with this title already exists" });
    }
    res.status(500).json({ success: false, message: "Failed to create service" });
  }
};

export const updateService = async (req: AuthRequest, res: Response) => {
  try {
    let image: string | undefined;
    if (req.file) {
      const { url } = await uploadImage(req.file, "services");
      image = url;
    }

    const service = await Service.findByIdAndUpdate(
      req.params.id,
      { ...req.body, ...(image && { image }) },
      { new: true }
    );

    if (!service) throw createError("Service not found", 404);

    if (req.user) {
      await ActivityLog.create({
        adminId: req.user.id,
        action: "Updated service",
        entity: "Service",
        entityId: service._id.toString(),
        ipAddress: req.ip,
        userAgent: req.get("user-agent"),
      });
    }

    res.json({ success: true, data: { service }, message: "Service updated" });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
};

export const deleteService = async (req: AuthRequest, res: Response) => {
  try {
    const service = await Service.findByIdAndDelete(req.params.id);
    if (!service) throw createError("Service not found", 404);

    if (req.user) {
      await ActivityLog.create({
        adminId: req.user.id,
        action: "Deleted service",
        entity: "Service",
        entityId: req.params.id,
        ipAddress: req.ip,
        userAgent: req.get("user-agent"),
      });
    }

    res.json({ success: true, message: "Service deleted" });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
};

export const toggleServiceActive = async (req: AuthRequest, res: Response) => {
  try {
    const service = await Service.findById(req.params.id);
    if (!service) throw createError("Service not found", 404);

    service.isActive = !service.isActive;
    await service.save();

    if (req.user) {
      await ActivityLog.create({
        adminId: req.user.id,
        action: service.isActive ? "Activated service" : "Deactivated service",
        entity: "Service",
        entityId: service._id.toString(),
        ipAddress: req.ip,
        userAgent: req.get("user-agent"),
      });
    }

    res.json({
      success: true,
      data: { service },
      message: service.isActive ? "Service activated" : "Service deactivated",
    });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
};

// ── CATEGORIES CRUD (Admin) ──

export const createCategory = async (req: AuthRequest, res: Response) => {
  try {
    const slug = slugify(req.body.name);
    const category = await Category.create({ ...req.body, slug });

    if (req.user) {
      await ActivityLog.create({
        adminId: req.user.id,
        action: "Created service category",
        entity: "Category",
        entityId: category._id.toString(),
        ipAddress: req.ip,
        userAgent: req.get("user-agent"),
      });
    }

    res.status(201).json({ success: true, data: { category }, message: "Category created" });
  } catch (error: any) {
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: "Category already exists" });
    }
    res.status(500).json({ success: false, message: "Failed to create category" });
  }
};

export const updateCategory = async (req: AuthRequest, res: Response) => {
  try {
    const category = await Category.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!category) throw createError("Category not found", 404);
    res.json({ success: true, data: { category }, message: "Category updated" });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
};

export const deleteCategory = async (req: AuthRequest, res: Response) => {
  try {
    // Prevent deletion if services are using this category
    const serviceCount = await Service.countDocuments({ categoryId: req.params.id });
    if (serviceCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete — ${serviceCount} service(s) use this category. Reassign them first.`,
      });
    }

    const category = await Category.findByIdAndDelete(req.params.id);
    if (!category) throw createError("Category not found", 404);

    res.json({ success: true, message: "Category deleted" });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
};
