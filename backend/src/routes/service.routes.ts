import { Router } from "express";
import multer from "multer";
import {
  getAllServices,
  getServiceBySlug,
  getAllCategories,
  adminGetAllServices,
  createService,
  updateService,
  deleteService,
  toggleServiceActive,
  createCategory,
  updateCategory,
  deleteCategory,
} from "../controllers/service.controller";
import { protect, adminOnly } from "../middleware/auth";

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ["image/jpeg", "image/png", "image/webp"];
    cb(null, allowed.includes(file.mimetype));
  },
});

// Public
router.get("/", getAllServices);
router.get("/categories", getAllCategories);
router.get("/:slug", getServiceBySlug);

// Admin — Services
router.get("/admin/all", protect, adminOnly, adminGetAllServices);
router.post("/admin", protect, adminOnly, upload.single("image"), createService);
router.put("/admin/:id", protect, adminOnly, upload.single("image"), updateService);
router.patch("/admin/:id/toggle", protect, adminOnly, toggleServiceActive);
router.delete("/admin/:id", protect, adminOnly, deleteService);

// Admin — Categories
router.post("/admin/categories", protect, adminOnly, createCategory);
router.put("/admin/categories/:id", protect, adminOnly, updateCategory);
router.delete("/admin/categories/:id", protect, adminOnly, deleteCategory);

export default router;
