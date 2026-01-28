import { Request, Response, NextFunction } from 'express';

export interface AuthUser {
    id: string;
    name: string;
    email: string;
    role: 'admin' | 'user';
    employeeId?: string;
}

// Extend Express Request to include user and IP
declare global {
    namespace Express {
        interface Request {
            user?: AuthUser;
            userIp?: string;
        }
    }
}

// Simple session storage (in production, use Redis or a database-backed session store)
const sessions: Map<string, AuthUser> = new Map();

export function generateSessionToken(): string {
    return `SESSION-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export function createSession(token: string, user: AuthUser): void {
    sessions.set(token, user);
}

export function getSession(token: string): AuthUser | undefined {
    return sessions.get(token);
}

export function deleteSession(token: string): void {
    sessions.delete(token);
}

// Middleware to authenticate requests
export function authMiddleware(req: any, res: any, next: any) {
    const token = req.headers['authorization']?.replace('Bearer ', '') || req.headers['x-session-token'];

    if (token) {
        const user = getSession(token);
        if (user) {
            req.user = user;
        }
    }

    // Capture IP address
    req.userIp = req.headers['x-forwarded-for']?.split(',')[0] || req.connection?.remoteAddress || req.ip;

    next();
}

// Middleware to require authentication
export function requireAuth(req: any, res: any, next: any) {
    if (!req.user) {
        return res.status(401).json({ error: 'Authentication required' });
    }
    next();
}

// Middleware to require admin role
export function requireAdmin(req: any, res: any, next: any) {
    if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Admin access required' });
    }
    next();
}
