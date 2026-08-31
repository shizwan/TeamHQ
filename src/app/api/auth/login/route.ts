import { NextResponse } from 'next/server';
import { signSessionToken, SESSION_COOKIE_NAME, SESSION_DURATION_SECONDS } from '@/lib/auth';
import { checkRateLimit } from '@/lib/rateLimit';

export const dynamic = 'force-dynamic';

// Default production admin credentials (can be overridden by environment variables)
const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || 'admin@teamhq.com').toLowerCase().trim();
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'password';

export async function POST(req: Request) {
  try {
    // 1. IP / Key-based Rate Limiting for Login (Max 5 attempts / 60 seconds)
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'localhost';
    const rateLimit = checkRateLimit(`login:${ip}`, 5, 60000);

    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: `Too many login attempts. Please wait ${Math.ceil(rateLimit.resetMs / 1000)} seconds.` },
        { status: 429 }
      );
    }

    const body = await req.json();
    const email = (body.email || '').toLowerCase().trim();
    const password = body.password || '';

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    // 2. Validate credentials
    if (email !== ADMIN_EMAIL || password !== ADMIN_PASSWORD) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    // 3. Generate signed JWT session
    const sessionUser = {
      uid: 'admin-user',
      email: ADMIN_EMAIL,
      displayName: 'Admin User',
      role: 'admin',
    };

    const token = await signSessionToken(sessionUser);

    // 4. Create secure response with HttpOnly cookie
    const response = NextResponse.json({
      success: true,
      user: sessionUser,
    });

    const isProd = process.env.NODE_ENV === 'production';

    response.cookies.set({
      name: SESSION_COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: isProd,
      sameSite: 'lax',
      path: '/',
      maxAge: SESSION_DURATION_SECONDS,
    });

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Authentication failed' }, { status: 500 });
  }
}
