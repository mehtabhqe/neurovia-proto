import mongoose, { Document, Schema } from "mongoose";

export interface ISession extends Document {
  userId: mongoose.Types.ObjectId;
  refreshToken: string;
  ipAddress?: string;
  device?: string;
  expiresAt: Date;
  createdAt: Date;
}

const sessionSchema = new Schema<ISession>({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  refreshToken: { type: String, required: true },
  ipAddress: { type: String },
  device: { type: String },
  expiresAt: { type: Date, required: true },
  createdAt: { type: Date, default: Date.now },
});

sessionSchema.index({ userId: 1 });
sessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL index

export const Session = mongoose.model<ISession>("Session", sessionSchema);
