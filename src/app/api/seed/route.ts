import { NextResponse } from 'next/server';
import { seedDatabase } from '@/lib/seedData';
import { getSessionUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

const ADMIN_SECRET = process.env.ADMIN_SECRET || 'teamhq-dev-secret';

async function handleSeed(req: Request) {
  // 1. Strict production block: Never allow database wiping in production
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { error: 'Endpoint disabled in production environment' },
      { status: 403 }
    );
  }

  // 2. In development, require either an active authenticated session or secret header
  const authHeader = req.headers.get('x-admin-secret');
  const user = await getSessionUser(req);

  if (authHeader !== ADMIN_SECRET && (!user || user.role !== 'admin')) {
    return NextResponse.json(
      { error: 'Forbidden: Admin authorization required to seed database' },
      { status: 403 }
    );
  }

  try {
    const result = await seedDatabase();
    return NextResponse.json({ success: true, message: 'Database seeded successfully', ...result });
  } catch (error: any) {
    console.error('Seed API error:', error);
    return NextResponse.json({ error: 'Failed to seed database', details: error.message }, { status: 500 });
  }
}

export async function GET(req: Request) {
  return handleSeed(req);
}

export async function POST(req: Request) {
  return handleSeed(req);
}
