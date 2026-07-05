import { Request, Response } from "express";
import { Wishlist } from "../models/Wishlist";
import { createError } from "../middleware/errorHandler";

export const getAllWishlist = async (_req: Request, res: Response) => {
  try {
    const items = await Wishlist.find().sort({ displayOrder: 1 });
    res.json({ success: true, data: { items } });
  } catch {
    res.status(500).json({ success: false, message: "Failed to fetch wishlist" });
  }
};

export const createWishlistItem = async (req: Request, res: Response) => {
  try {
    const item = await Wishlist.create(req.body);
    res.status(201).json({ success: true, data: { item }, message: "Wishlist item created" });
  } catch {
    res.status(500).json({ success: false, message: "Failed to create item" });
  }
};

export const updateWishlistItem = async (req: Request, res: Response) => {
  try {
    const item = await Wishlist.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!item) throw createError("Item not found", 404);
    res.json({ success: true, data: { item }, message: "Item updated" });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
};

export const deleteWishlistItem = async (req: Request, res: Response) => {
  try {
    const item = await Wishlist.findByIdAndDelete(req.params.id);
    if (!item) throw createError("Item not found", 404);
    res.json({ success: true, message: "Item deleted" });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
};

export const reorderWishlist = async (req: Request, res: Response) => {
  try {
    const { order }: { order: { id: string; displayOrder: number }[] } = req.body;
    await Promise.all(order.map(({ id, displayOrder }) =>
      Wishlist.findByIdAndUpdate(id, { displayOrder })
    ));
    res.json({ success: true, message: "Order updated" });
  } catch {
    res.status(500).json({ success: false, message: "Failed to reorder" });
  }
};
