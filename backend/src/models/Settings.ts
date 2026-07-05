import mongoose, { Document, Schema } from "mongoose";

export interface ISettings extends Document {
  companyName: string;
  tagline?: string;
  logo?: string;
  supportEmail: string;
  phone: string;
  address: string;
  socialLinks: {
    facebook?: string;
    twitter?: string;
    instagram?: string;
    linkedin?: string;
    youtube?: string;
    github?: string;
  };
  countdownTargetDate: Date;
  googleMapsEmbed?: string;
  heroHeadline: string;
  heroSubtitle: string;
  updatedAt: Date;
}

const settingsSchema = new Schema<ISettings>(
  {
    companyName: { type: String, default: "Neurovia Nexus" },
    tagline: { type: String },
    logo: { type: String },
    supportEmail: { type: String, required: true },
    phone: { type: String, required: true },
    address: { type: String, required: true },
    socialLinks: {
      facebook: String,
      twitter: String,
      instagram: String,
      linkedin: String,
      youtube: String,
      github: String,
    },
    countdownTargetDate: { type: Date, required: true },
    googleMapsEmbed: { type: String },
    heroHeadline: { type: String, default: "IT Support. Software Solutions. AI Innovation." },
    heroSubtitle: {
      type: String,
      default:
        "Professional remote and onsite IT services powered by certified experts and the future of autonomous diagnostics.",
    },
  },
  { timestamps: true }
);

export const Settings = mongoose.model<ISettings>("Settings", settingsSchema);
