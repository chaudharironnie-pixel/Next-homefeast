import { NextRequest } from 'next/server';
import { userRepository } from '@/server/repositories/user.repository';
import { sendSuccess } from '@/server/utils/response';
import { handleApiError } from '@/server/middleware/errorHandler';
import { authenticate, authorize } from '@/server/middleware/auth';

export async function GET(request: NextRequest) {
  try {
    const user = await authenticate(request);
    authorize(user, 'admin');

    const { searchParams } = new URL(request.url);
    const role = searchParams.get('role') || undefined;
    const isActiveParam = searchParams.get('isActive');
    const isActive = isActiveParam !== null ? isActiveParam === 'true' : undefined;
    const search = searchParams.get('search') || undefined;
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const skip = (page - 1) * limit;

    const [users, total] = await userRepository.findMany({ role, isActive, search, skip, take: limit });
    const pages = Math.ceil(total / limit);
    return sendSuccess({ users, total, page, pages });
  } catch (err) {
    return handleApiError(err);
  }
}
