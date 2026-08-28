import { NextResponse } from 'next/server';
import { seedDatabase } from '@/lib/seedData';

export const dynamic = 'force-dynamic';

export async function POST() {
  try {
    const result = await seedDatabase();
    return NextResponse.json({ success: true, ...result });
  } catch (error: any) {
    console.error('Seed API error:', error);
    return NextResponse.json({ error: 'Failed to seed database', details: error.message }, { status: 500 });
  }
}
