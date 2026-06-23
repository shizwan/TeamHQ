import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const task = await prisma.task.update({
      where: { id },
      data: body,
    });
    return NextResponse.json(task);
  } catch (error) {
    console.error("PATCH Task Error:", error);
    return NextResponse.json({ error: 'Failed to update task', details: String(error) }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await prisma.task.delete({
      where: { id },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE Task Error:", error);
    return NextResponse.json({ error: 'Failed to delete task', details: String(error) }, { status: 500 });
  }
}
