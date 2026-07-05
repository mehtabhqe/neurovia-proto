import mongoose, { Document, Schema } from "mongoose";

export interface IActivityLog extends Document {
  adminId: mongoose.Types.ObjectId;
  action: string;
  entity: string;
  entityId?: string;
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
}

const activityLogSchema = new Schema<IActivityLog>({
  adminId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  action: { type: String, required: true },
  entity: { type: String, required: true },
  entityId: { type: String },
  ipAddress: { type: String },
  userAgent: { type: String },
  createdAt: { type: Date, default: Date.now },
});

activityLogSchema.index({ adminId: 1 });
activityLogSchema.index({ createdAt: -1 });

export const ActivityLog = mongoose.model<IActivityLog>("ActivityLog", activityLogSchema);
