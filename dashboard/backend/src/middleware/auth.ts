import { Request, Response, NextFunction } from "express";

const COOKIE_NAME = "mp_token";

export function getToken(req: Request): string | undefined {
  return req.cookies?.[COOKIE_NAME];
}

export function setToken(res: Response, token: string): void {
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    path: "/",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
}

export function clearToken(res: Response): void {
  res.clearCookie(COOKIE_NAME, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    path: "/",
  });
}

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const token = getToken(req);
  if (!token) {
    res.status(401).json({ error: "Not authenticated", code: "auth_expired" });
    return;
  }
  next();
}

export function isMockMode(): boolean {
  return process.env.USE_MOCK === "true";
}
