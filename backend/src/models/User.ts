import mongoose, { Document, Schema } from "mongoose";
import bcrypt from "bcryptjs";

export interface IUser extends Document {
  fullName: string;
  email: string;
  passwordHash: string;
  role: "admin" | "super_admin";
  avatar?: string;
  status: "active" | "inactive";
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(password: string): Promise<boolean>;
}

const userSchema = new Schema<IUser>(
  {
    fullName: { type: String, required: true, trim: true, maxlength: 100 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ["admin", "super_admin"], required: true, default: "admin" },
    avatar: { type: String },
    status: { type: String, enum: ["active", "inactive"], default: "active" },
    lastLogin: { type: Date },
  },
  { timestamps: true }
);

// unique: true on the field already creates the index — no need for schema.index()
userSchema.index({ role: 1 });
userSchema.index({ status: 1 });

userSchema.methods.comparePassword = async function (password: string): Promise<boolean> {
  return bcrypt.compare(password, this.passwordHash);
};

userSchema.set("toJSON", {
  transform: (_doc, ret) => { delete ret.passwordHash; return ret; },
});

export const User = mongoose.model<IUser>("User", userSchema);
