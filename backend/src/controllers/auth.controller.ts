import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import { User } from "../models/User";
import { Session } from "../models/Session";
import { generateAccessToken, generateRefreshToken, verifyRefreshToken, setAuthCookies, clearAuthCookies } from "../utils/jwt";
import { createError } from "../middleware/errorHandler";
import { AuthRequest } from "../middleware/auth";
import logger from "../utils/logger";

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email, status: "active" });
    if (!user) throw createError("Invalid credentials", 401);

    const isMatch = await user.comparePassword(password);
    if (!isMatch) throw createError("Invalid credentials", 401);

    const accessToken = generateAccessToken({ id: user._id.toString(), role: user.role, email: user.email });
    const refreshToken = generateRefreshToken({ id: user._id.toString() });

    // Store session
    await Session.create({
      userId: user._id,
      refreshToken,
      ipAddress: req.ip,
      device: req.get("user-agent"),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    user.lastLogin = new Date();
    await user.save();

    setAuthCookies(res, accessToken, refreshToken);

    res.json({ success: true, data: { user }, message: "Login successful" });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
};

export const logout = async (req: AuthRequest, res: Response) => {
  try {
    const refreshToken = req.cookies?.refreshToken;
    if (refreshToken) await Session.deleteOne({ refreshToken });
    clearAuthCookies(res);
    res.json({ success: true, message: "Logged out successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Logout failed" });
  }
};

export const getMe = async (req: AuthRequest, res: Response) => {
  try {
    const user = await User.findById(req.user?.id).select("-passwordHash");
    if (!user) throw createError("User not found", 404);
    res.json({ success: true, data: { user } });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
};

export const refreshAccessToken = async (req: Request, res: Response) => {
  try {
    const token = req.cookies?.refreshToken;
    if (!token) throw createError("No refresh token", 401);

    const session = await Session.findOne({ refreshToken: token });
    if (!session) throw createError("Invalid session", 401);

    const decoded = verifyRefreshToken(token);
    const user = await User.findById(decoded.id);
    if (!user || user.status !== "active") throw createError("User not found", 401);

    const accessToken = generateAccessToken({ id: user._id.toString(), role: user.role, email: user.email });
    res.cookie("accessToken", accessToken, { httpOnly: true, secure: process.env.NODE_ENV === "production", maxAge: 15 * 60 * 1000 });

    res.json({ success: true, message: "Token refreshed" });
  } catch (error: any) {
    res.status(error.statusCode || 401).json({ success: false, message: error.message });
  }
};
