import { Router } from "express";
import multer from "multer";
import {
  createBooking,
  getAllBookings,
  getBookingById,
  updateBookingStatus,
  assignTechnician,
  deleteBooking,
  exportBookingsCSV,
} from "../controllers/booking.controller";
import { protect, adminOnly } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { bookingLimiter } from "../middleware/rateLimiter";
import {
  createBookingSchema,
  updateBookingStatusSchema,
  assignTechnicianSchema,
} from "../validators/booking.validator";

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 5 },
  fileFilter: (_req, file, cb) => {
    const allowed = ["image/jpeg", "image/png", "image/webp", "image/jpg"];
    cb(null, allowed.includes(file.mimetype));
  },
});

// Public
router.post("/", bookingLimiter, upload.array("images", 5), validate(createBookingSchema), createBooking);

// Admin
router.get("/admin", protect, adminOnly, getAllBookings);
router.get("/admin/export", protect, adminOnly, exportBookingsCSV);
router.get("/admin/:id", protect, adminOnly, getBookingById);
router.patch("/admin/:id/status", protect, adminOnly, validate(updateBookingStatusSchema), updateBookingStatus);
router.patch("/admin/:id/assign", protect, adminOnly, validate(assignTechnicianSchema), assignTechnician);
router.delete("/admin/:id", protect, adminOnly, deleteBooking);

export default router;
