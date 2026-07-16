import { NextRequest } from 'next/server';
import { complaintRepository } from '@/server/repositories/complaint.repository';
import { sendSuccess, sendError } from '@/server/utils/response';
import { handleApiError } from '@/server/middleware/errorHandler';
import { authenticate, authorize } from '@/server/middleware/auth';
import ErrorCodes from '@/server/utils/errorCodes';

export async function POST(request: NextRequest) {
  try {
    const user = await authenticate(request);
    const body = await request.json();
    const { subject, description, category, providerId, orderId, priority } = body;

    if (!subject || !description || !category) {
      return sendError('subject, description, and category are required', 400, ErrorCodes.VALIDATION_FAILED);
    }

    const complaint = await complaintRepository.create({
      customerId: user.id,
      subject,
      description,
      category,
      providerId: providerId || null,
      orderId: orderId || null,
      priority: priority || 'medium',
    });

    return sendSuccess({ complaint }, 'Complaint submitted', 201);
  } catch (err) {
    return handleApiError(err);
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = await authenticate(request);
    const { searchParams } = new URL(request.url);

    if (user.role === 'admin') {
      const status = searchParams.get('status') || undefined;
      const priority = searchParams.get('priority') || undefined;
      const page = parseInt(searchParams.get('page') || '1', 10);
      const limit = parseInt(searchParams.get('limit') || '20', 10);
      const skip = (page - 1) * limit;

      const [complaints, total] = await complaintRepository.findAll({ status, priority, skip, take: limit });
      const pages = Math.ceil(total / limit);
      return sendSuccess({ complaints, total, page, pages });
    }

    const complaints = await complaintRepository.findByCustomer(user.id);
    return sendSuccess({ complaints });
  } catch (err) {
    return handleApiError(err);
  }
}
