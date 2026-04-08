import { Request, Response, NextFunction } from "express";
import crypto from "crypto";

const COOKIE_NAME = "mp_credentials";
const ALGORITHM = "aes-256-gcm";

function getEncryptionKey(): Buffer {
  const secret = process.env.COOKIE_SECRET;
  if (!secret) throw new Error("COOKIE_SECRET environment variable is required");
  return crypto.scryptSync(secret, "salt", 32);
}

export function encryptCredentials(data: { username: string; secret: string; projectId: number }): string {
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  let encrypted = cipher.update(JSON.stringify(data), "utf8", "hex");
  encrypted += cipher.final("hex");
  const authTag = cipher.getAuthTag().toString("hex");
  return `${iv.toString("hex")}:${authTag}:${encrypted}`;
}

export function decryptCredentials(encrypted: string): { username: string; secret: string; projectId: number } | null {
  try {
    const key = getEncryptionKey();
    const [ivHex, authTagHex, encryptedData] = encrypted.split(":");
    const iv = Buffer.from(ivHex, "hex");
    const authTag = Buffer.from(authTagHex, "hex");
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);
    let decrypted = decipher.update(encryptedData, "hex", "utf8");
    decrypted += decipher.final("utf8");
    return JSON.parse(decrypted);
  } catch {
    return null;
  }
}

export function setCredentialsCookie(res: Response, data: { username: string; secret: string; projectId: number }): void {
  const encrypted = encryptCredentials(data);
  const isProduction = process.env.NODE_ENV === "production" || !!process.env.RAILWAY_ENVIRONMENT;
  res.cookie(COOKIE_NAME, encrypted, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax",
    path: "/",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
}

export function getCredentials(req: Request): { username: string; secret: string; projectId: number } | null {
  const cookie = req.cookies?.[COOKIE_NAME];
  if (!cookie) return null;
  return decryptCredentials(cookie);
}

export function clearCredentialsCookie(res: Response): void {
  const isProduction = process.env.NODE_ENV === "production" || !!process.env.RAILWAY_ENVIRONMENT;
  res.clearCookie(COOKIE_NAME, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax",
    path: "/",
  });
}

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const credentials = getCredentials(req);
  if (!credentials) {
    res.status(401).json({ error: "Not authenticated", code: "auth_expired" });
    return;
  }
  // Attach credentials to request for downstream use
  (req as any).mixpanelCredentials = credentials;
  next();
}

export function isMockMode(): boolean {
  return process.env.USE_MOCK === "true";
}
