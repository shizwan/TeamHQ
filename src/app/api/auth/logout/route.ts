import { NextResponse } from 'next/server';
import { SESSION_COOKIE_NAME, getSessionUser } from '@/lib/auth';
import { logActivity } from '@/lib/services/activityService';

export async function POST(request: Request) {
  const user = await getSessionUser(request);
  if (user) {
    await logActivity({
      userId: user.uid,
      actorName: user.displayName,
      actorEmail: user.email,
      action: 'updated',
      entityType: 'system',
      entityTitle: 'User Logout',
      details: `${user.displayName} signed out.`,
    });
  }

  const response = NextResponse.json({ success: true, message: 'Logged out successfully' });

  // Clear session cookie
  response.cookies.set({
    name: SESSION_COOKIE_NAME,
    value: '',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 0,
    path: '/',
  });

  return response;
}
