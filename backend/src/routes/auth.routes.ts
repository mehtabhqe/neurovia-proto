import { Router } from "express";
import { login, logout, getMe, refreshAccessToken } from "../controllers/auth.controller";
import { protect } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { authLimiter } from "../middleware/rateLimiter";
import { loginSchema } from "../validators/auth.validator";

const router = Router();

router.post("/login", authLimiter, validate(loginSchema), login);
router.post("/logout", protect, logout);
router.get("/me", protect, getMe);
router.post("/refresh", refreshAccessToken);

export default router;
