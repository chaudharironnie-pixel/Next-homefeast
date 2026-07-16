import { NextRequest } from 'next/server';
import { categoryRepository } from '@/server/repositories/category.repository';
import { sendSuccess } from '@/server/utils/response';
import { handleApiError } from '@/server/middleware/errorHandler';
import { authenticate, authorize } from '@/server/middleware/auth';

export async function GET() {
  try {
    const categories = await categoryRepository.findAll();
    return sendSuccess({ categories });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await authenticate(request);
    authorize(user, 'admin');

    const body = await request.json();
    const { name, description, image, sortOrder } = body;

    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    const category = await categoryRepository.create({
      name,
      slug,
      description: description || null,
      image: image || null,
      sortOrder: sortOrder || 0,
    });

    return sendSuccess({ category }, 'Category created', 201);
  } catch (err) {
    return handleApiError(err);
  }
}
