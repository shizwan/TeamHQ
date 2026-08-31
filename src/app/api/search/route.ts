import { NextResponse } from 'next/server';
import { requireAuth, badRequestResponse, serverErrorResponse } from '@/lib/auth';
import { searchAll } from '@/lib/services/searchService';
import { SearchQuerySchema } from '@/lib/validation/schemas';

export async function GET(request: Request) {
  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q') || '';
    const category = (searchParams.get('category') || 'all') as any;
    const limit = parseInt(searchParams.get('limit') || '20', 10);

    const parseResult = SearchQuerySchema.safeParse({ q, category, limit });
    if (!parseResult.success) {
      return badRequestResponse('Invalid search query', parseResult.error.flatten().fieldErrors);
    }

    const results = await searchAll(parseResult.data, authResult.user.workspaceId);
    return NextResponse.json(results);
  } catch (error) {
    console.error('[SEARCH ERROR]', error);
    return serverErrorResponse('Search query failed');
  }
}
