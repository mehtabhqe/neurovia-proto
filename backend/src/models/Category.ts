import mongoose, { Document, Schema } from "mongoose";

export interface ICategory extends Document {
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  displayOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

const categorySchema = new Schema<ICategory>(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true },
    description: { type: String },
    icon: { type: String },
    displayOrder: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// unique: true already creates the index for slug
categorySchema.index({ displayOrder: 1 });

export const Category = mongoose.model<ICategory>("Category", categorySchema);
