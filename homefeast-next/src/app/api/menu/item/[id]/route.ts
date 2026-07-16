import { NextRequest } from 'next/server';
import { menuRepository } from '@/server/repositories/menu.repository';
import { sendSuccess, sendError } from '@/server/utils/response';
import { handleApiError } from '@/server/middleware/errorHandler';
import ErrorCodes from '@/server/utils/errorCodes';

type Context = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: Context) {
  try {
    const { id } = await params;
    const item = await menuRepository.findById(id);
    if (!item) return sendError('Menu item not found', 404, ErrorCodes.MENU_ITEM_NOT_FOUND);
    return sendSuccess({ item });
  } catch (err) {
    return handleApiError(err);
  }
}
