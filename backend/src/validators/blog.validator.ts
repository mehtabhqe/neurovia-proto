import { z } from "zod";

export const createBlogSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters").max(200),
  excerpt: z.string().min(20).max(300),
  content: z.string().min(100, "Content must be at least 100 characters"),
  category: z.string().min(1, "Category is required"),
  tags: z.array(z.string()).optional().default([]),
  author: z.string().min(2),
  seoTitle: z.string().max(70).optional(),
  seoDescription: z.string().max(160).optional(),
  isPublished: z.boolean().optional().default(false),
});

export const updateBlogSchema = createBlogSchema.partial();
