import { NextResponse } from 'next/server';
import { seedDatabase } from '@/lib/seedData';
import { requireAuth, forbiddenResponse, badRequestResponse } from '@/lib/auth';
import { isProduction } from '@/lib/env';

/**
 * GET method is permanently disabled to prevent accidental browser prefetch database wipes.
 */
export async function GET() {
  return NextResponse.json(
    {
      error: 'Method Not Allowed: Database seeding via GET is disabled for security. Use CLI "npm run seed" or POST with Admin authorization.',
      code: 'METHOD_NOT_ALLOWED',
    },
    { status: 405 }
  );
}

/**
 * POST method allows administrative re-seeding only when explicitly authorized by an ADMIN.
 */
export async function POST(request: Request) {
  // In production, require strict ADMIN authentication
  if (isProduction()) {
    const authResult = await requireAuth(request, 'system:admin');
    if (authResult instanceof NextResponse) return authResult;
  }

  try {
    const body = await request.json().catch(() => ({}));
    const adminEmail = body.adminEmail || process.env.ADMIN_EMAIL || 'admin@teamhq.com';
    const adminPassword = body.adminPassword || process.env.ADMIN_PASSWORD || 'password';

    const result = await seedDatabase(adminEmail, adminPassword);
    return NextResponse.json({
      success: true,
      message: 'Database seeded successfully',
      result,
    });
  } catch (error: any) {
    console.error('[SEED ERROR]', error);
    return badRequestResponse(error.message || 'Seeding failed');
  }
}
