import { Router } from "express";
import multer from "multer";
import { getSettings, updateSettings, updateCountdown } from "../controllers/settings.controller";
import { protect, adminOnly, superAdminOnly } from "../middleware/auth";

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ["image/jpeg", "image/png", "image/webp", "image/svg+xml"];
    cb(null, allowed.includes(file.mimetype));
  },
});

// Public — frontend reads company info, hero text, countdown date
router.get("/", getSettings);

// Admin — PRD: Only super admins can modify global settings
router.put("/admin", protect, superAdminOnly, upload.single("logo"), updateSettings);
router.patch("/admin/countdown", protect, adminOnly, updateCountdown);

export default router;
