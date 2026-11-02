import { NextResponse } from 'next/server';

/**
 * Database bootstrap and demo-data seeding must only be performed through
 * the CLI, under the operator's control. Keeping an HTTP entry point for
 * a database-changing action is unsafe even when middleware is present.
 */
export async function GET() {
  return NextResponse.json(
    { error: 'HTTP database seeding is disabled. Run npm run seed from an authorized environment.' },
    { status: 403 }
  );
}

export async function POST() {
  return NextResponse.json(
    { error: 'HTTP database seeding is disabled. Run npm run seed from an authorized environment.' },
    { status: 403 }
  );
}
