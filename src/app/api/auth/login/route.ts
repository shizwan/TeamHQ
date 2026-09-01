import { NextResponse } from 'next/server';
import { authenticateUser } from '@/lib/services/userService';
import {
  signSessionToken,
  SESSION_COOKIE_NAME,
  SESSION_DURATION_SECONDS,
  badRequestResponse,
  unauthorizedResponse,
} from '@/lib/auth';
import { checkRateLimit } from '@/lib/rateLimit';
import { LoginSchema } from '@/lib/validation/schemas';
import { logActivity } from '@/lib/services/activityService';

export async function POST(request: Request) {
  try {
    // 1. Enforce rate limiting on login attempts
    const rateLimitKey = request.headers.get('x-forwarded-for') || 'login-ip';
    const rateLimit = checkRateLimit(rateLimitKey, 10, 60000); // 10 attempts per minute
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: 'Too many login attempts. Please try again in 1 minute.', code: 'RATE_LIMITED' },
        { status: 429 }
      );
    }

    // 2. Validate input payload with Zod
    const body = await request.json().catch(() => ({}));
    const parseResult = LoginSchema.safeParse(body);

    if (!parseResult.success) {
      return badRequestResponse('Invalid login credentials', parseResult.error.flatten().fieldErrors);
    }

    const { email, password } = parseResult.data;

    // 3. Authenticate against database with bcrypt
    const user = await authenticateUser(email, password);

    if (!user) {
      // Audit failed login (non-blocking)
      logActivity({
        actorName: 'Anonymous User',
        actorEmail: email,
        action: 'updated',
        entityType: 'system',
        entityTitle: 'Failed Login Attempt',
        details: `Failed sign-in attempt for email: ${email}`,
      }).catch(() => {});

      return unauthorizedResponse('Invalid email or password.');
    }

    // 4. Generate JWT session token
    const token = await signSessionToken({
      uid: user.id,
      email: user.email,
      displayName: user.name,
      role: user.role,
      workspaceId: user.workspaceId,
    });

    // 5. Create secure session cookie response
    const response = NextResponse.json({
      success: true,
      user: {
        uid: user.id,
        email: user.email,
        displayName: user.name,
        role: user.role,
        workspaceId: user.workspaceId,
      },
    });

    response.cookies.set({
      name: SESSION_COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: SESSION_DURATION_SECONDS,
      path: '/',
    });

    // Audit successful login (non-blocking)
    logActivity({
      userId: user.id,
      actorName: user.name,
      actorEmail: user.email,
      action: 'updated',
      entityType: 'system',
      entityTitle: 'User Login',
      details: `${user.name} (${user.role}) logged in successfully.`,
    }).catch(() => {});

    return response;
  } catch (error: unknown) {
    console.error('[AUTH LOGIN ERROR]', error);
    const message = error instanceof Error ? error.message : 'An unexpected error occurred during sign in.';
    return NextResponse.json(
      { error: message, code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
