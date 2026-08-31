import { NextResponse } from 'next/server';
import { requireAuth, serverErrorResponse } from '@/lib/auth';
import { getDashboardMetrics } from '@/lib/services/dashboardService';

export async function GET(request: Request) {
  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const data = await getDashboardMetrics(authResult.user.workspaceId);
    return NextResponse.json(data);
  } catch (error) {
    console.error('[DASHBOARD METRICS ERROR]', error);
    return serverErrorResponse('Failed to calculate dashboard metrics');
  }
}
