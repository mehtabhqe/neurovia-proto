import mongoose, { Document, Schema } from "mongoose";

export interface IBlogPost extends Document {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  featuredImage?: string;
  category: string;
  tags: string[];
  author: string;
  seoTitle?: string;
  seoDescription?: string;
  isPublished: boolean;
  publishedAt?: Date;
  readingTime?: number;
  views: number;
  createdAt: Date;
  updatedAt: Date;
}

const blogPostSchema = new Schema<IBlogPost>(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true },
    excerpt: { type: String, required: true, maxlength: 300 },
    content: { type: String, required: true },
    featuredImage: { type: String },
    category: { type: String, required: true },
    tags: [{ type: String }],
    author: { type: String, required: true },
    seoTitle: { type: String },
    seoDescription: { type: String },
    isPublished: { type: Boolean, default: false },
    publishedAt: { type: Date },
    readingTime: { type: Number },
    views: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// unique: true already creates the index for slug
blogPostSchema.index({ publishedAt: -1 });
blogPostSchema.index({ isPublished: 1 });
blogPostSchema.index({ category: 1 });
blogPostSchema.index({ tags: 1 });
blogPostSchema.index({ title: "text", content: "text" });

export const BlogPost = mongoose.model<IBlogPost>("BlogPost", blogPostSchema);
