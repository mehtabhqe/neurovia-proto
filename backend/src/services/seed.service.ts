/**
 * Database Seeder — run with: ts-node src/services/seed.service.ts
 * Seeds initial admin user, categories, services, wishlist items, and settings.
 */
import "dotenv/config";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { User } from "../models/User";
import { Category } from "../models/Category";
import { Service } from "../models/Service";
import { Wishlist } from "../models/Wishlist";
import { Settings } from "../models/Settings";
import { Testimonial } from "../models/Testimonial";

const seed = async () => {
  await mongoose.connect(process.env.MONGODB_URI!);
  console.log("✅ Connected to MongoDB");

  // Admin user
  const existing = await User.findOne({ email: "admin@neurovianexus.com" });
  if (!existing) {
    const hash = await bcrypt.hash("Admin@123456", 12);
    await User.create({
      fullName: "Neurovia Admin",
      email: "admin@neurovianexus.com",
      passwordHash: hash,
      role: "super_admin",
      status: "active",
    });
    console.log("✅ Admin user created — admin@neurovianexus.com / Admin@123456");
  }

  // Categories
  const cats = [
    { name: "Remote Support", slug: "remote-support", description: "Online technical assistance", displayOrder: 1 },
    { name: "Onsite Support", slug: "onsite-support", description: "In-person technical help", displayOrder: 2 },
    { name: "Business Solutions", slug: "business-solutions", description: "Enterprise IT services", displayOrder: 3 },
    { name: "Software Development", slug: "software-development", description: "Custom software solutions", displayOrder: 4 },
    { name: "Cloud Solutions", slug: "cloud-solutions", description: "Cloud migration and management", displayOrder: 5 },
    { name: "Cybersecurity", slug: "cybersecurity", description: "Security audits and protection", displayOrder: 6 },
  ];

  for (const cat of cats) {
    await Category.findOneAndUpdate({ slug: cat.slug }, cat, { upsert: true });
  }
  console.log("✅ Categories seeded");

  const remoteCategory = await Category.findOne({ slug: "remote-support" });

  // Sample services
  if (remoteCategory) {
    const services = [
      { title: "Remote Desktop Support", slug: "remote-desktop-support", shortDescription: "Fast remote access support for Windows, macOS, and Linux.", description: "Our certified technicians connect to your device remotely and resolve issues including software conflicts, OS errors, and performance problems.", categoryId: remoteCategory._id, supportType: "remote", isFeatured: true, displayOrder: 1, isActive: true },
      { title: "Virus & Malware Removal", slug: "virus-malware-removal", shortDescription: "Complete removal of viruses, malware, and ransomware.", description: "Thorough scanning and removal of all malicious software with post-cleanup protection setup.", categoryId: remoteCategory._id, supportType: "remote", isFeatured: true, displayOrder: 2, isActive: true },
      { title: "Performance Optimization", slug: "performance-optimization", shortDescription: "Speed up your slow computer with our optimization service.", description: "We diagnose and fix performance bottlenecks, clean startup programs, and optimize your system settings.", categoryId: remoteCategory._id, supportType: "remote", isFeatured: true, displayOrder: 3, isActive: true },
    ];

    for (const svc of services) {
      await Service.findOneAndUpdate({ slug: svc.slug }, svc, { upsert: true });
    }
    console.log("✅ Sample services seeded");
  }

  // Wishlist items
  const wishlistItems = [
    { title: "Neurovia Autonomous Device Technician (NADT)", description: "AI-powered autonomous device diagnostics and repair system.", status: "Research", displayOrder: 1 },
    { title: "Smart Ticket Routing", description: "AI-driven automatic technician matching based on expertise and location.", status: "In Development", displayOrder: 2 },
    { title: "Mobile Customer App", description: "Native iOS and Android app for booking, tracking, and communication.", status: "Planning", displayOrder: 3 },
    { title: "Remote Monitoring Dashboard", description: "24/7 proactive monitoring for enterprise clients.", status: "Research", displayOrder: 4 },
  ];

  for (const item of wishlistItems) {
    await Wishlist.findOneAndUpdate({ title: item.title }, item, { upsert: true });
  }
  console.log("✅ Wishlist items seeded");

  // Settings
  await Settings.findOneAndUpdate(
    {},
    {
      companyName: "Neurovia Nexus",
      tagline: "IT Support. Software Solutions. AI Innovation.",
      supportEmail: "support@neurovianexus.com",
      phone: "+91 98765 43210",
      address: "Mumbai, Maharashtra, India",
      heroHeadline: "IT Support. Software Solutions. AI Innovation.",
      heroSubtitle: "Professional remote and onsite IT services powered by certified experts and the future of autonomous diagnostics.",
      countdownTargetDate: new Date("2027-06-01"),
      socialLinks: {
        linkedin: "https://linkedin.com/company/neurovia-nexus",
        twitter: "https://twitter.com/neurovianexus",
        instagram: "https://instagram.com/neurovianexus",
      },
    },
    { upsert: true }
  );
  console.log("✅ Settings seeded");

  // Sample testimonials
  const testimonials = [
    { customerName: "Rohit Sharma", designation: "IT Manager", company: "TechCorp India", message: "Neurovia Nexus resolved our server issue within 2 hours. Incredibly professional.", rating: 5, isFeatured: true, isPublished: true, displayOrder: 1 },
    { customerName: "Priya Patel", designation: "Founder", company: "StartupHub", message: "Set up our entire office network and has been maintaining it flawlessly for 6 months.", rating: 5, isFeatured: true, isPublished: true, displayOrder: 2 },
    { customerName: "Amir Khan", designation: "Software Engineer", company: "Freelancer", message: "Fixed my MacBook issue in under an hour remotely. Highly recommend!", rating: 5, isFeatured: false, isPublished: true, displayOrder: 3 },
  ];

  for (const t of testimonials) {
    await Testimonial.findOneAndUpdate({ customerName: t.customerName }, t, { upsert: true });
  }
  console.log("✅ Testimonials seeded");

  console.log("\n🎉 Database seeded successfully!");
  await mongoose.connection.close();
  process.exit(0);
};

seed().catch((e) => { console.error("Seed failed:", e); process.exit(1); });
