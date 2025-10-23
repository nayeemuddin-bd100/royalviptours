import { Request, Response, NextFunction } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { User } from "@shared/schema";
import { db } from "../db";
import { userTenants } from "@shared/schema";
import { eq, and } from "drizzle-orm";

if (!process.env.SESSION_SECRET) {
  throw new Error("SESSION_SECRET environment variable must be set");
}
const JWT_SECRET = process.env.SESSION_SECRET;
const TOKEN_EXPIRY = "7d";

export interface TenantContext {
  tenantId: string;
  tenantRole: string;
}

export interface AuthRequest extends Request {
  user?: User;
  tenantContext?: TenantContext;
}

export function hashPassword(password: string): string {
  return bcrypt.hashSync(password, 10);
}

export function comparePassword(password: string, hash: string): boolean {
  return bcrypt.compareSync(password, hash);
}

export function generateToken(userId: string): string {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: TOKEN_EXPIRY });
}

export function verifyToken(token: string): { userId: string } | null {
  try {
    return jwt.verify(token, JWT_SECRET) as { userId: string };
  } catch {
    return null;
  }
}

export function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ message: "Authentication required" });
  }
  next();
}

export function requireRole(...roles: string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: "Authentication required" });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: "Insufficient permissions" });
    }
    next();
  };
}

export function requireTenantRole(...allowedRoles: string[]) {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: "Authentication required" });
    }
    
    const tenantId = req.headers['x-tenant-id'] as string;
    if (!tenantId) {
      return res.status(400).json({ message: "Tenant context required. Please select a tenant." });
    }

    const [userTenant] = await db
      .select()
      .from(userTenants)
      .where(and(
        eq(userTenants.userId, req.user.id),
        eq(userTenants.tenantId, tenantId)
      ));

    if (!userTenant) {
      return res.status(403).json({ message: "You do not have access to this tenant" });
    }

    if (!allowedRoles.includes(userTenant.tenantRole)) {
      return res.status(403).json({ message: `This action requires one of the following roles: ${allowedRoles.join(', ')}` });
    }

    req.tenantContext = {
      tenantId: userTenant.tenantId,
      tenantRole: userTenant.tenantRole
    };

    next();
  };
}
