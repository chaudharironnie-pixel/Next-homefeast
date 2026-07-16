import { NextRequest } from 'next/server';
import { categoryRepository } from '@/server/repositories/category.repository';
import { sendSuccess } from '@/server/utils/response';
import { handleApiError } from '@/server/middleware/errorHandler';
import { authenticate, authorize } from '@/server/middleware/auth';

type Context = { params: Promise<{ id: string }> };

export async function PUT(request: NextRequest, { params }: Context) {
  try {
    const user = await authenticate(request);
    authorize(user, 'admin');

    const { id } = await params;
    const body = await request.json();

    const updates: Record<string, unknown> = {};
    if (body.name !== undefined) {
      updates.name = body.name;
      updates.slug = body.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    }
    if (body.description !== undefined) updates.description = body.description;
    if (body.image !== undefined) updates.image = body.image;
    if (body.sortOrder !== undefined) updates.sortOrder = body.sortOrder;
    if (body.isActive !== undefined) updates.isActive = body.isActive;

    const category = await categoryRepository.update(id, updates);
    return sendSuccess({ category }, 'Category updated');
  } catch (err) {
    return handleApiError(err);
  }
}

export async function DELETE(request: NextRequest, { params }: Context) {
  try {
    const user = await authenticate(request);
    authorize(user, 'admin');

    const { id } = await params;
    await categoryRepository.softDelete(id);
    return sendSuccess(null, 'Category deleted');
  } catch (err) {
    return handleApiError(err);
  }
}
