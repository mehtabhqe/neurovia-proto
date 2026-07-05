import { Router } from "express";
import authRoutes from "./auth.routes";
import bookingRoutes from "./booking.routes";
import blogRoutes from "./blog.routes";
import serviceRoutes from "./service.routes";
import contactRoutes from "./contact.routes";
import wishlistRoutes from "./wishlist.routes";
import testimonialRoutes from "./testimonial.routes";
import settingsRoutes from "./settings.routes";
import adminRoutes from "./admin.routes";

const router = Router();

// ── Health ──
router.get("/health", (_req, res) => {
  res.json({
    success: true,
    message: "Neurovia Nexus API is running",
    version: "1.0.0",
    environment: process.env.NODE_ENV || "development",
    timestamp: new Date().toISOString(),
  });
});

// ── Public + Mixed ──
router.use("/auth", authRoutes);
router.use("/bookings", bookingRoutes);
router.use("/blog", blogRoutes);
router.use("/services", serviceRoutes);
router.use("/contact", contactRoutes);
router.use("/wishlist", wishlistRoutes);
router.use("/testimonials", testimonialRoutes);
router.use("/settings", settingsRoutes);

// ── Admin-only (dashboard stats, logs, user management) ──
router.use("/admin", adminRoutes);

export default router;
