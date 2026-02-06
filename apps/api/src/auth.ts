import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

const JWT_SECRET = process.env.JWT_SECRET ?? "vibeaff-dev-secret-change-in-production";

// Warn loudly if using the default secret
if (JWT_SECRET === "vibeaff-dev-secret-change-in-production" || JWT_SECRET === "change-me-in-production") {
  if (process.env.NODE_ENV === "production") {
    throw new Error("FATAL: JWT_SECRET must be set to a strong secret in production. Refusing to start.");
  }
  // eslint-disable-next-line no-console
  console.warn("WARNING: Using default JWT_SECRET. Set a strong secret before deploying to production.");
}

export type UserPayload = {
  userId: string;
  email: string;
  role: "admin" | "partner" | "affiliate";
};

export function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function signToken(payload: UserPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
}

export function verifyToken(token: string): UserPayload {
  return jwt.verify(token, JWT_SECRET) as UserPayload;
}

export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Missing or invalid authorization header" });
  }
  try {
    const payload = verifyToken(header.slice(7));
    (req as Request & { user: UserPayload }).user = payload;
    next();
  } catch (_err) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}

export function requireRole(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = (req as Request & { user: UserPayload }).user;
    if (!user || !roles.includes(user.role)) {
      return res.status(403).json({ error: "Insufficient permissions" });
    }
    next();
  };
}
