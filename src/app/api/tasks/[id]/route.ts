import { NextResponse } from 'next/server';
import { requireAuth, badRequestResponse, notFoundResponse, serverErrorResponse } from '@/lib/auth';
import { getTaskById, updateTask, deleteTask } from '@/lib/services/taskService';
import { UpdateTaskSchema } from '@/lib/validation/schemas';
import { validateCsrf } from '@/lib/security';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const { id } = await params;
    const task = await getTaskById(id, authResult.user.workspaceId);
    if (!task) return notFoundResponse('Deliverable not found');
    return NextResponse.json(task);
  } catch (error) {
    console.error('[GET TASK BY ID ERROR]', error);
    return serverErrorResponse('Failed to fetch deliverable');
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAuth(request, 'task:edit');
  if (authResult instanceof NextResponse) return authResult;

  if (!validateCsrf(request)) {
    return badRequestResponse('CSRF validation failed');
  }

  try {
    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const parseResult = UpdateTaskSchema.safeParse(body);

    if (!parseResult.success) {
      return badRequestResponse('Validation failed', parseResult.error.flatten().fieldErrors);
    }

    const updated = await updateTask(id, parseResult.data, {
      uid: authResult.user.uid,
      displayName: authResult.user.displayName,
      email: authResult.user.email,
      workspaceId: authResult.user.workspaceId,
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error('[UPDATE TASK ERROR]', error);
    if (error.message === 'Task not found') {
      return notFoundResponse('Deliverable not found');
    }
    return badRequestResponse(error.message || 'Failed to update deliverable');
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAuth(request, 'task:delete');
  if (authResult instanceof NextResponse) return authResult;

  if (!validateCsrf(request)) {
    return badRequestResponse('CSRF validation failed');
  }

  try {
    const { id } = await params;
    await deleteTask(id, {
      uid: authResult.user.uid,
      displayName: authResult.user.displayName,
      email: authResult.user.email,
      workspaceId: authResult.user.workspaceId,
    });

    return NextResponse.json({ success: true, message: 'Deliverable deleted successfully' });
  } catch (error: any) {
    console.error('[DELETE TASK ERROR]', error);
    if (error.message === 'Task not found') {
      return notFoundResponse('Deliverable not found');
    }
    return badRequestResponse(error.message || 'Failed to delete deliverable');
  }
}
