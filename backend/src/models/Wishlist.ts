import mongoose, { Document, Schema } from "mongoose";

export interface IWishlistItem extends Document {
  title: string;
  description: string;
  status: "Research" | "Planning" | "In Development" | "Completed";
  icon?: string;
  displayOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

const wishlistSchema = new Schema<IWishlistItem>(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    status: {
      type: String,
      enum: ["Research", "Planning", "In Development", "Completed"],
      required: true,
      default: "Research",
    },
    icon: { type: String },
    displayOrder: { type: Number, default: 0 },
  },
  { timestamps: true }
);

wishlistSchema.index({ displayOrder: 1 });
wishlistSchema.index({ status: 1 });

export const Wishlist = mongoose.model<IWishlistItem>("Wishlist", wishlistSchema);
