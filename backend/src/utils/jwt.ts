import jwt from "jsonwebtoken";

export const generateAccessToken = (payload: { id: string; role: string; email: string }) => {
  return jwt.sign(payload, process.env.JWT_SECRET!, {
    expiresIn: process.env.JWT_EXPIRES_IN || "15m",
  } as jwt.SignOptions);
};

export const generateRefreshToken = (payload: { id: string }) => {
  return jwt.sign(payload, process.env.REFRESH_TOKEN_SECRET!, {
    expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || "7d",
  } as jwt.SignOptions);
};

export const verifyRefreshToken = (token: string): { id: string } => {
  return jwt.verify(token, process.env.REFRESH_TOKEN_SECRET!) as { id: string };
};

export const setAuthCookies = (
  res: import("express").Response,
  accessToken: string,
  refreshToken: string
) => {
  const isProduction = process.env.NODE_ENV === "production";

  res.cookie("accessToken", accessToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "strict" : "lax",
    maxAge: 15 * 60 * 1000, // 15 minutes
  });

  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "strict" : "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    path: "/api/auth",
  });
};

export const clearAuthCookies = (res: import("express").Response) => {
  res.clearCookie("accessToken");
  res.clearCookie("refreshToken", { path: "/api/auth" });
};
