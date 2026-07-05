import { Router } from "express";
import {
  submitContact,
  subscribeNewsletter,
  getAllMessages,
  updateMessageStatus,
  getAllSubscribers,
} from "../controllers/contact.controller";
import { protect, adminOnly } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { contactLimiter, newsletterLimiter } from "../middleware/rateLimiter";
import { contactSchema, newsletterSchema } from "../validators/contact.validator";

const router = Router();

// Public
router.post("/", contactLimiter, validate(contactSchema), submitContact);
router.post("/newsletter", newsletterLimiter, validate(newsletterSchema), subscribeNewsletter);

// Admin
router.get("/admin/messages", protect, adminOnly, getAllMessages);
router.patch("/admin/messages/:id", protect, adminOnly, updateMessageStatus);
router.get("/admin/subscribers", protect, adminOnly, getAllSubscribers);

export default router;
