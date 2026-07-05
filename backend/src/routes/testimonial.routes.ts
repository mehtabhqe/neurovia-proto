import { Router } from "express";
import multer from "multer";
import { getAllTestimonials, createTestimonial, updateTestimonial, deleteTestimonial } from "../controllers/testimonial.controller";
import { protect, adminOnly } from "../middleware/auth";

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 2 * 1024 * 1024 } });

router.get("/", getAllTestimonials);
router.post("/admin", protect, adminOnly, upload.single("image"), createTestimonial);
router.put("/admin/:id", protect, adminOnly, upload.single("image"), updateTestimonial);
router.delete("/admin/:id", protect, adminOnly, deleteTestimonial);

export default router;
