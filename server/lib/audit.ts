import { db } from "../db";
import { auditLogs, type InsertAuditLog } from "@shared/schema";
import type { Request } from "express";
import type { AuthRequest } from "./auth";

type AuditAction = InsertAuditLog['action'];

interface AuditLogParams {
  action: AuditAction;
  entityType?: string | null;
  entityId?: string | null;
  details?: Record<string, any> | null;
  userId?: string | null;
  userName?: string | null;
  userEmail?: string | null;
}

export async function logAudit(req: Request | AuthRequest, params: AuditLogParams): Promise<void> {
  try {
    const authReq = req as AuthRequest;
    
    // Extract user context from authenticated request
    const userId = params.userId ?? authReq.user?.id ?? null;
    const userName = params.userName ?? authReq.user?.name ?? null;
    const userEmail = params.userEmail ?? authReq.user?.email ?? null;
    
    // Extract IP address (handle proxies with x-forwarded-for)
    const ipAddress = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() 
      || req.ip 
      || null;
    
    // Extract user agent
    const userAgent = req.get('user-agent') || null;
    
    // Insert audit log entry
    await db.insert(auditLogs).values({
      userId,
      userName,
      userEmail,
      action: params.action,
      entityType: params.entityType ?? null,
      entityId: params.entityId ?? null,
      details: params.details ?? null,
      ipAddress,
      userAgent,
    });
  } catch (error) {
    // Log error but don't fail the request
    console.warn('Failed to create audit log entry:', error);
  }
}
