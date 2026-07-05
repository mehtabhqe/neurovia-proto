import mongoose, { Document, Schema } from "mongoose";

export interface IService extends Document {
  title: string;
  slug: string;
  shortDescription: string;
  description: string;
  categoryId: mongoose.Types.ObjectId;
  icon?: string;
  image?: string;
  supportType: "remote" | "onsite" | "both";
  estimatedTime?: string;
  isFeatured: boolean;
  displayOrder: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const serviceSchema = new Schema<IService>(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true },
    shortDescription: { type: String, required: true, maxlength: 200 },
    description: { type: String, required: true },
    categoryId: { type: Schema.Types.ObjectId, ref: "Category", required: true },
    icon: { type: String },
    image: { type: String },
    supportType: { type: String, enum: ["remote", "onsite", "both"], required: true },
    estimatedTime: { type: String },
    isFeatured: { type: Boolean, default: false },
    displayOrder: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// unique: true already creates the index for slug
serviceSchema.index({ categoryId: 1 });
serviceSchema.index({ isFeatured: 1 });
serviceSchema.index({ displayOrder: 1 });
serviceSchema.index({ title: "text" });

export const Service = mongoose.model<IService>("Service", serviceSchema);
