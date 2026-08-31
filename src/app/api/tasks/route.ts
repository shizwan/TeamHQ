import { NextResponse } from 'next/server';
import { requireAuth, badRequestResponse, serverErrorResponse } from '@/lib/auth';
import { getTasks, createTask } from '@/lib/services/taskService';
import { CreateTaskSchema, TaskQuerySchema } from '@/lib/validation/schemas';
import { validateCsrf } from '@/lib/security';

export async function GET(request: Request) {
  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId') || undefined;
    const assigneeId = searchParams.get('assigneeId') || undefined;
    const status = searchParams.get('status') || undefined;
    const slipCause = searchParams.get('slipCause') || undefined;
    const search = searchParams.get('search') || undefined;
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '500', 10);

    const queryParams = {
      projectId,
      assigneeId,
      status,
      slipCause,
      search,
      page,
      limit,
      workspaceId: authResult.user.workspaceId,
    };

    const result = await getTasks(queryParams);

    // If limit >= 500, return as array for backward-compatibility with useCollection
    if (limit >= 500 && !searchParams.has('page')) {
      return NextResponse.json(result.tasks);
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('[GET TASKS ERROR]', error);
    return serverErrorResponse('Failed to fetch deliverables');
  }
}

export async function POST(request: Request) {
  const authResult = await requireAuth(request, 'task:create');
  if (authResult instanceof NextResponse) return authResult;

  if (!validateCsrf(request)) {
    return badRequestResponse('CSRF validation failed');
  }

  try {
    const body = await request.json().catch(() => ({}));
    const parseResult = CreateTaskSchema.safeParse(body);

    if (!parseResult.success) {
      return badRequestResponse('Validation failed', parseResult.error.flatten().fieldErrors);
    }

    const created = await createTask(parseResult.data, {
      uid: authResult.user.uid,
      displayName: authResult.user.displayName,
      email: authResult.user.email,
      workspaceId: authResult.user.workspaceId,
    });

    return NextResponse.json(created, { status: 201 });
  } catch (error: any) {
    console.error('[CREATE TASK ERROR]', error);
    return badRequestResponse(error.message || 'Failed to create deliverable');
  }
}
