import { NextResponse } from 'next/server';
import { requireAuth, badRequestResponse, notFoundResponse, serverErrorResponse } from '@/lib/auth';
import { getProjectById, updateProject, deleteProject } from '@/lib/services/projectService';
import { UpdateProjectSchema } from '@/lib/validation/schemas';
import { validateCsrf } from '@/lib/security';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const { id } = await params;
    const project = await getProjectById(id, authResult.user.workspaceId);
    if (!project) return notFoundResponse('Project not found');
    return NextResponse.json(project);
  } catch (error) {
    console.error('[GET PROJECT BY ID ERROR]', error);
    return serverErrorResponse('Failed to fetch project');
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAuth(request, 'project:edit');
  if (authResult instanceof NextResponse) return authResult;

  if (!validateCsrf(request)) {
    return badRequestResponse('CSRF validation failed');
  }

  try {
    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const parseResult = UpdateProjectSchema.safeParse(body);

    if (!parseResult.success) {
      return badRequestResponse('Validation failed', parseResult.error.flatten().fieldErrors);
    }

    const updated = await updateProject(id, parseResult.data, {
      uid: authResult.user.uid,
      displayName: authResult.user.displayName,
      email: authResult.user.email,
      workspaceId: authResult.user.workspaceId,
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error('[UPDATE PROJECT ERROR]', error);
    if (error.message === 'Project not found') {
      return notFoundResponse('Project not found');
    }
    return badRequestResponse(error.message || 'Failed to update project');
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAuth(request, 'project:delete');
  if (authResult instanceof NextResponse) return authResult;

  if (!validateCsrf(request)) {
    return badRequestResponse('CSRF validation failed');
  }

  try {
    const { id } = await params;
    const result = await deleteProject(id, {
      uid: authResult.user.uid,
      displayName: authResult.user.displayName,
      email: authResult.user.email,
      workspaceId: authResult.user.workspaceId,
    });

    return NextResponse.json({
      success: true,
      message: `Project deleted successfully. ${result.affectedTasksCount} deliverables were removed.`,
      affectedTasksCount: result.affectedTasksCount,
    });
  } catch (error: any) {
    console.error('[DELETE PROJECT ERROR]', error);
    if (error.message === 'Project not found') {
      return notFoundResponse('Project not found');
    }
    return badRequestResponse(error.message || 'Failed to delete project');
  }
}
