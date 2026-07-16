import { NextRequest } from 'next/server';
import { userRepository } from '@/server/repositories/user.repository';
import { sendSuccess, sendError } from '@/server/utils/response';
import { handleApiError } from '@/server/middleware/errorHandler';
import { authenticate, authorize } from '@/server/middleware/auth';
import ErrorCodes from '@/server/utils/errorCodes';

type Context = { params: Promise<{ id: string }> };

export async function PUT(request: NextRequest, { params }: Context) {
  try {
    const user = await authenticate(request);
    authorize(user, 'admin');

    const { id } = await params;
    const body = await request.json();
    const { isActive } = body;

    const target = await userRepository.findById(id);
    if (!target) return sendError('User not found', 404, ErrorCodes.USER_NOT_FOUND);
    if (target.role === 'admin' && isActive === false) {
      return sendError('Cannot deactivate admin accounts', 400, ErrorCodes.BAD_REQUEST);
    }

    const updated = await userRepository.update(id, { isActive });
    return sendSuccess({ user: updated }, `User ${isActive ? 'activated' : 'deactivated'}`);
  } catch (err) {
    return handleApiError(err);
  }
}
