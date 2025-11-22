import { Request, Response, NextFunction } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { User } from "@shared/schema";
import { db } from "../db";
import { userTenants, refreshTokens } from "@shared/schema";
import { eq, and, lt, isNull } from "drizzle-orm";

if (!process.env.SESSION_SECRET) {
  throw new Error("SESSION_SECRET environment variable must be set");
}
const JWT_SECRET = process.env.SESSION_SECRET;
const ACCESS_TOKEN_EXPIRY = "15m"; // Short-lived access tokens
const REFRESH_TOKEN_EXPIRY_DAYS = 7; // Long-lived refresh tokens

export interface TenantContext {
  tenantId: string;
  tenantRole: string;
}

export interface AuthRequest extends Request {
  user?: User;
  tenantId?: string;
  tenantContext?: TenantContext;
}

export function hashPassword(password: string): string {
  return bcrypt.hashSync(password, 10);
}

export function comparePassword(password: string, hash: string): boolean {
  return bcrypt.compareSync(password, hash);
}

export function generateAccessToken(userId: string, userType: "user" | "agency" = "user"): string {
  return jwt.sign({ userId, userType }, JWT_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRY });
}

function hashRefreshToken(token: string): string {
  // Use SHA-256 for deterministic hashing (unlike bcrypt which uses random salts)
  return crypto.createHash('sha256').update(token).digest('hex');
}

export async function generateRefreshToken(userId: string): Promise<string> {
  // Generate a random refresh token
  const token = crypto.randomBytes(32).toString('hex');
  const tokenHash = hashRefreshToken(token);
  
  // Calculate expiry date
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + REFRESH_TOKEN_EXPIRY_DAYS);
  
  // Store the hashed token in database
  await db.insert(refreshTokens).values({
    userId,
    tokenHash,
    expiresAt,
  });
  
  return token;
}

export async function verifyRefreshToken(token: string): Promise<string | null> {
  const tokenHash = hashRefreshToken(token);
  
  const [refreshToken] = await db
    .select()
    .from(refreshTokens)
    .where(
      and(
        eq(refreshTokens.tokenHash, tokenHash),
        isNull(refreshTokens.revokedAt)
      )
    );
  
  if (!refreshToken) {
    return null;
  }
  
  // Check if token is expired
  if (new Date() > new Date(refreshToken.expiresAt)) {
    return null;
  }
  
  return refreshToken.userId;
}

export async function revokeRefreshToken(token: string): Promise<void> {
  const tokenHash = hashRefreshToken(token);
  
  await db
    .update(refreshTokens)
    .set({ revokedAt: new Date() })
    .where(eq(refreshTokens.tokenHash, tokenHash));
}

export async function revokeAllUserTokens(userId: string): Promise<void> {
  await db
    .update(refreshTokens)
    .set({ revokedAt: new Date() })
    .where(
      and(
        eq(refreshTokens.userId, userId),
        isNull(refreshTokens.revokedAt)
      )
    );
}

export function verifyToken(token: string): { userId: string; userType?: string } | null {
  try {
    return jwt.verify(token, JWT_SECRET) as { userId: string; userType?: string };
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

    req.tenantId = userTenant.tenantId;
    req.tenantContext = {
      tenantId: userTenant.tenantId,
      tenantRole: userTenant.tenantRole
    };

    next();
  };
}

// Helper function to get agencyId for both agency contacts and travel agent users
export async function getAgencyIdForUser(userId: string, userType?: string, directAgencyId?: string): Promise<string | null> {
  // If user is an agency contact, return the direct agencyId
  if (userType === "agency" && directAgencyId) {
    return directAgencyId;
  }
  
  // If user is a regular user (travel agent), find their agency
  const [agency] = await db
    .select({ id: agencies.id })
    .from(agencies)
    .where(eq(agencies.travelAgentId, userId))
    .limit(1);
  
  return agency?.id || null;
}

// Middleware to ensure request is from an agency contact OR travel agent user
export function requireAgencyContact(req: AuthRequest, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ message: "Authentication required" });
  }
  
  const userType = (req.user as any).userType;
  const agencyId = (req.user as any).agencyId;
  
  // Allow if user is an agency contact with agencyId
  if (userType === "agency" && agencyId) {
    return next();
  }
  
  // Allow if user is a regular user (travel agent)
  // Travel agents will get their agency via agencies.travelAgentId in the route handlers
  if (userType === "user" || !userType) {
    return next();
  }
  
  return res.status(403).json({ message: "Access denied" });
}
