import { Router } from "express";
import {
  getDashboardStats,
  getActivityLogs,
  deleteActivityLogs,
  getAllAdmins,
  createAdmin,
  updateAdminStatus,
} from "../controllers/admin.controller";
import { protect, adminOnly, superAdminOnly } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { z } from "zod";

const router = Router();

const createAdminSchema = z.object({
  fullName: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(10, "Admin password must be at least 10 characters"),
  role: z.enum(["admin", "super_admin"]).optional(),
});

// All admin routes require auth
router.use(protect, adminOnly);

// PRD: Dashboard Widgets
router.get("/stats", getDashboardStats);

// PRD: Activity Logs (Admin audit)
router.get("/logs", getActivityLogs);
router.delete("/logs", superAdminOnly, deleteActivityLogs);

// PRD: Super Admin — Manage Admin Users
router.get("/users", superAdminOnly, getAllAdmins);
router.post("/users", superAdminOnly, validate(createAdminSchema), createAdmin);
router.patch("/users/:id/status", superAdminOnly, updateAdminStatus);

export default router;
