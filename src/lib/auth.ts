import { SignJWT, jwtVerify } from 'jose';
import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export const SESSION_COOKIE_NAME = 'teamhq_session';
export const SESSION_DURATION_SECONDS = 7 * 24 * 60 * 60; // 7 days

export interface SessionUser {
  uid: string;
  email: string;
  displayName: string;
  role: string;
}

// Fallback high-entropy secret key for development; in production should be provided via AUTH_SECRET env
const DEFAULT_AUTH_SECRET = 'teamhq_production_grade_secret_key_at_least_32_chars_long!';
const authSecretString = process.env.AUTH_SECRET || DEFAULT_AUTH_SECRET;
const JWT_SECRET = new TextEncoder().encode(authSecretString);

/**
 * Signs and encrypts a session token using jose JWT (HS256)
 */
export async function signSessionToken(user: SessionUser): Promise<string> {
  return await new SignJWT({
    uid: user.uid,
    email: user.email,
    displayName: user.displayName,
    role: user.role,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DURATION_SECONDS}s`)
    .sign(JWT_SECRET);
}

/**
 * Verifies and decodes a session token
 */
export async function verifySessionToken(token: string): Promise<SessionUser | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    if (!payload || !payload.uid || !payload.email) {
      return null;
    }
    return {
      uid: String(payload.uid),
      email: String(payload.email),
      displayName: String(payload.displayName || 'Admin User'),
      role: String(payload.role || 'admin'),
    };
  } catch (error) {
    return null;
  }
}

/**
 * Extracts and verifies the session from incoming Request or Next.js cookies
 */
export async function getSessionUser(req?: Request): Promise<SessionUser | null> {
  let token: string | undefined;

  if (req) {
    // Check Authorization header or Cookie header
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
      // Ignore if called in environment without next/headers context
    }
  }

  if (!token) return null;
  return await verifySessionToken(token);
}

/**
 * Enforces authentication on route handlers. Returns user or throws/returns 401 response
 */
export async function requireAuth(req?: Request): Promise<{ user: SessionUser } | null> {
  const user = await getSessionUser(req);
  if (!user) {
    return null;
  }
  return { user };
}

/**
 * Returns standardized 401 Unauthorized JSON response
 */
export function unauthorizedResponse(message: string = 'Unauthorized: Active session required') {
  return NextResponse.json({ error: message }, { status: 401 });
}

/**
 * Hash password using bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return await bcrypt.hash(password, salt);
}

/**
 * Verify password against bcrypt hash
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return await bcrypt.compare(password, hash);
}
