import mongoose, { Document, Schema } from "mongoose";

export interface INewsletterSubscriber extends Document {
  email: string;
  subscribedAt: Date;
  isActive: boolean;
}

const subscriberSchema = new Schema<INewsletterSubscriber>({
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  subscribedAt: { type: Date, default: Date.now },
  isActive: { type: Boolean, default: true },
});

// unique: true on email already creates the index

export const NewsletterSubscriber = mongoose.model<INewsletterSubscriber>(
  "NewsletterSubscriber",
  subscriberSchema
);
