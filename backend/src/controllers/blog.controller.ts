import { Request, Response } from "express";
import { BlogPost } from "../models/BlogPost";
import { uploadImage } from "../utils/cloudinary";
import { createError } from "../middleware/errorHandler";
import { ActivityLog } from "../models/ActivityLog";
import { AuthRequest } from "../middleware/auth";
import { slugify, estimateReadingTime } from "../utils/helpers";
import logger from "../utils/logger";

// ── PUBLIC ──

export const getAllPosts = async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 9, category, search } = req.query;
    const query: Record<string, any> = { isPublished: true };

    if (category) query.category = category;
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { excerpt: { $regex: search, $options: "i" } },
        { tags: { $in: [new RegExp(String(search), "i")] } },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);
    const [posts, total] = await Promise.all([
      BlogPost.find(query)
        .sort({ publishedAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .select("-content"),
      BlogPost.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: { posts, total, page: Number(page), totalPages: Math.ceil(total / Number(limit)) },
    });
  } catch {
    res.status(500).json({ success: false, message: "Failed to fetch posts" });
  }
};

export const getPostBySlug = async (req: Request, res: Response) => {
  try {
    const post = await BlogPost.findOne({ slug: req.params.slug, isPublished: true });
    if (!post) throw createError("Post not found", 404);
    // Increment views without blocking
    BlogPost.findByIdAndUpdate(post._id, { $inc: { views: 1 } }).exec();
    res.json({ success: true, data: { post } });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
};

export const getRelatedPosts = async (req: Request, res: Response) => {
  try {
    const post = await BlogPost.findOne({ slug: req.params.slug });
    if (!post) throw createError("Post not found", 404);
    const related = await BlogPost.find({
      _id: { $ne: post._id },
      isPublished: true,
      $or: [{ category: post.category }, { tags: { $in: post.tags } }],
    })
      .limit(3)
      .select("-content");
    res.json({ success: true, data: { posts: related } });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
};

// ── ADMIN ──

export const adminGetAllPosts = async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 20, search, published } = req.query;
    const query: Record<string, any> = {};

    if (published !== undefined) query.isPublished = published === "true";
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { category: { $regex: search, $options: "i" } },
        { author: { $regex: search, $options: "i" } },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);
    const [posts, total] = await Promise.all([
      BlogPost.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .select("-content"),
      BlogPost.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: { posts, total, page: Number(page), totalPages: Math.ceil(total / Number(limit)) },
    });
  } catch {
    res.status(500).json({ success: false, message: "Failed to fetch posts" });
  }
};

export const createPost = async (req: AuthRequest, res: Response) => {
  try {
    let featuredImage: string | undefined;
    if (req.file) {
      const { url } = await uploadImage(req.file, "blog");
      featuredImage = url;
    }

    const slug = slugify(req.body.title);
    const readingTime = estimateReadingTime(req.body.content);
    const isPublished = req.body.isPublished === "true" || req.body.isPublished === true;
    const publishedAt = isPublished ? new Date() : undefined;

    const post = await BlogPost.create({
      ...req.body,
      slug,
      featuredImage,
      readingTime,
      isPublished,
      publishedAt,
      author: req.body.author || "Neurovia Nexus",
    });

    if (req.user) {
      await ActivityLog.create({
        adminId: req.user.id,
        action: isPublished ? "Published blog post" : "Created blog draft",
        entity: "BlogPost",
        entityId: post._id.toString(),
        ipAddress: req.ip,
        userAgent: req.get("user-agent"),
      });
    }

    res.status(201).json({ success: true, data: { post }, message: isPublished ? "Post published" : "Draft saved" });
  } catch (error: any) {
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: "A post with this title already exists" });
    }
    logger.error("Create post error:", error);
    res.status(500).json({ success: false, message: "Failed to create post" });
  }
};

export const updatePost = async (req: AuthRequest, res: Response) => {
  try {
    let featuredImage: string | undefined;
    if (req.file) {
      const { url } = await uploadImage(req.file, "blog");
      featuredImage = url;
    }

    const isPublished = req.body.isPublished === "true" || req.body.isPublished === true;

    // Only set publishedAt when first publishing
    const existing = await BlogPost.findById(req.params.id);
    if (!existing) throw createError("Post not found", 404);

    const publishedAt =
      isPublished && !existing.isPublished ? new Date() : existing.publishedAt;

    const post = await BlogPost.findByIdAndUpdate(
      req.params.id,
      {
        ...req.body,
        isPublished,
        publishedAt,
        ...(featuredImage && { featuredImage }),
        readingTime: req.body.content
          ? estimateReadingTime(req.body.content)
          : existing.readingTime,
      },
      { new: true }
    );

    if (req.user) {
      await ActivityLog.create({
        adminId: req.user.id,
        action: "Updated blog post",
        entity: "BlogPost",
        entityId: post!._id.toString(),
        ipAddress: req.ip,
        userAgent: req.get("user-agent"),
      });
    }

    res.json({ success: true, data: { post }, message: "Post updated" });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
};

export const deletePost = async (req: AuthRequest, res: Response) => {
  try {
    const post = await BlogPost.findByIdAndDelete(req.params.id);
    if (!post) throw createError("Post not found", 404);

    if (req.user) {
      await ActivityLog.create({
        adminId: req.user.id,
        action: "Deleted blog post",
        entity: "BlogPost",
        entityId: req.params.id,
        ipAddress: req.ip,
        userAgent: req.get("user-agent"),
      });
    }

    res.json({ success: true, message: "Post deleted" });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
};

export const togglePublish = async (req: AuthRequest, res: Response) => {
  try {
    const post = await BlogPost.findById(req.params.id);
    if (!post) throw createError("Post not found", 404);

    post.isPublished = !post.isPublished;
    if (post.isPublished && !post.publishedAt) post.publishedAt = new Date();
    await post.save();

    if (req.user) {
      await ActivityLog.create({
        adminId: req.user.id,
        action: post.isPublished ? "Published blog post" : "Unpublished blog post",
        entity: "BlogPost",
        entityId: post._id.toString(),
        ipAddress: req.ip,
        userAgent: req.get("user-agent"),
      });
    }

    res.json({
      success: true,
      data: { post },
      message: post.isPublished ? "Post published" : "Post unpublished",
    });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
};
