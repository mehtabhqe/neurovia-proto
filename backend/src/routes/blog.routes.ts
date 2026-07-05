import { Router } from "express";
import multer from "multer";
import {
  getAllPosts,
  getPostBySlug,
  getRelatedPosts,
  adminGetAllPosts,
  createPost,
  updatePost,
  deletePost,
  togglePublish,
} from "../controllers/blog.controller";
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
router.get("/", getAllPosts);
router.get("/:slug/related", getRelatedPosts);
router.get("/:slug", getPostBySlug);

// Admin (PRD: Create, Edit, Delete, Publish/Unpublish, Drafts, SEO metadata, Featured image)
router.get("/admin/all", protect, adminOnly, adminGetAllPosts);
router.post("/admin", protect, adminOnly, upload.single("featuredImage"), createPost);
router.put("/admin/:id", protect, adminOnly, upload.single("featuredImage"), updatePost);
router.patch("/admin/:id/publish", protect, adminOnly, togglePublish);
router.delete("/admin/:id", protect, adminOnly, deletePost);

export default router;
