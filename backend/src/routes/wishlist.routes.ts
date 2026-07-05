import { Router } from "express";
import { getAllWishlist, createWishlistItem, updateWishlistItem, deleteWishlistItem, reorderWishlist } from "../controllers/wishlist.controller";
import { protect, adminOnly } from "../middleware/auth";

const router = Router();

router.get("/", getAllWishlist);
router.post("/admin", protect, adminOnly, createWishlistItem);
router.put("/admin/reorder", protect, adminOnly, reorderWishlist);
router.put("/admin/:id", protect, adminOnly, updateWishlistItem);
router.delete("/admin/:id", protect, adminOnly, deleteWishlistItem);

export default router;
