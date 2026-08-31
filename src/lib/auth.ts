import { SignJWT, jwtVerify } from 'jose';
import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { getEnv } from '@/lib/env';
import { hasPermission, Permission, UserRole } from '@/lib/security';

export const SESSION_COOKIE_NAME = 'teamhq_session';
export const SESSION_DURATION_SECONDS = 7 * 24 * 60 * 60; // 7 days

export interface SessionUser {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole | string;
  workspaceId: string;
}

function getJwtSecret(): Uint8Array {
  const secret = getEnv().AUTH_SECRET;
  return new TextEncoder().encode(secret);
}

/**
 * Signs and encrypts a session token using jose JWT (HS256)
 */
export async function signSessionToken(user: SessionUser): Promise<string> {
  return await new SignJWT({
    uid: user.uid,
    email: user.email,
    displayName: user.displayName,
    role: (user.role || 'MEMBER').toUpperCase(),
    workspaceId: user.workspaceId || 'default-workspace',
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DURATION_SECONDS}s`)
    .sign(getJwtSecret());
}

/**
 * Verifies and decodes a session token
 */
export async function verifySessionToken(token: string): Promise<SessionUser | null> {
  try {
    const { payload } = await jwtVerify(token, getJwtSecret());
    if (!payload || !payload.uid || !payload.email) {
      return null;
    }
    return {
      uid: String(payload.uid),
      email: String(payload.email),
      displayName: String(payload.displayName || 'Team Member'),
      role: String(payload.role || 'MEMBER').toUpperCase() as UserRole,
      workspaceId: String(payload.workspaceId || 'default-workspace'),
    };
  } catch {
    return null;
  }
}

/**
 * Extracts and verifies the session from incoming Request or Next.js cookies
 */
export async function getSessionUser(req?: Request): Promise<SessionUser | null> {
  let token: string | undefined;

  if (req) {
    // Check Cookie header or Authorization Bearer header
    const cookieHeader = req.headers.get('cookie') || '';
    const match = cookieHeader.match(new RegExp(`(?:^|;\\s*)${SESSION_COOKIE_NAME}=([^;]+)`));
    if (match) {
      token = match[1];
    }
    if (!token) {
      const authHeader = req.headers.get('authorization');
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7).trim();
      }
    }
  }

  // Fallback to Next.js cookies() helper if in Server Component / Route Handler
  if (!token) {
    try {
      const cookieStore = await cookies();
      token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    } catch {
      // Not in next/headers context
    }
  }

  if (!token) return null;
  return await verifySessionToken(token);
}

/**
 * Enforces authentication and optional permission requirement on route handlers.
 */
export async function requireAuth(
  req?: Request,
  requiredPermission?: Permission
): Promise<{ user: SessionUser } | NextResponse> {
  const user = await getSessionUser(req);
  if (!user) {
    return unauthorizedResponse('Authentication required. Please sign in.');
  }

  if (requiredPermission && !hasPermission(user.role, requiredPermission)) {
    return forbiddenResponse(`Forbidden: You do not have permission to perform this action (${requiredPermission}).`);
  }

  return { user };
}

/**
 * Returns standardized 401 Unauthorized JSON response
 */
export function unauthorizedResponse(message: string = 'Unauthorized: Active session required') {
  return NextResponse.json({ error: message, code: 'UNAUTHORIZED' }, { status: 401 });
}

/**
 * Returns standardized 403 Forbidden JSON response
 */
export function forbiddenResponse(message: string = 'Forbidden: Insufficient permissions') {
  return NextResponse.json({ error: message, code: 'FORBIDDEN' }, { status: 403 });
}

/**
 * Returns standardized 400 Bad Request JSON response
 */
export function badRequestResponse(message: string = 'Invalid request parameters', errors?: any) {
  return NextResponse.json({ error: message, code: 'BAD_REQUEST', details: errors }, { status: 400 });
}

/**
 * Returns standardized 404 Not Found JSON response
 */
export function notFoundResponse(message: string = 'Resource not found') {
  return NextResponse.json({ error: message, code: 'NOT_FOUND' }, { status: 404 });
}

/**
 * Returns standardized 500 Internal Server Error JSON response
 */
export function serverErrorResponse(message: string = 'Internal server error occurred') {
  return NextResponse.json({ error: message, code: 'INTERNAL_SERVER_ERROR' }, { status: 500 });
}

/**
 * Hash password using bcrypt (12 rounds)
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(12);
  return await bcrypt.hash(password, salt);
}

/**
 * Verify password against bcrypt hash
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  if (!password || !hash) return false;
  return await bcrypt.compare(password, hash);
}
