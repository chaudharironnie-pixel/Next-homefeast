import { NextResponse } from 'next/server';
import logger from '../utils/logger';
import ErrorCodes from '../utils/errorCodes';

interface HandledError {
  statusCode?: number;
  errorCode?: string | null;
  message?: string;
  isOperational?: boolean;
  code?: string;
  meta?: { target?: string[] };
  name?: string;
  errors?: unknown;
  stack?: string;
}

const prismaErrorMap: Record<string, { statusCode: number; code: string; message: string }> = {
  P2000: { statusCode: 400, code: ErrorCodes.DB_VALUE_TOO_LONG, message: 'Value too long for one or more fields' },
  P2001: { statusCode: 404, code: ErrorCodes.DB_RECORD_NOT_FOUND, message: 'Record not found' },
  P2002: { statusCode: 409, code: ErrorCodes.DB_UNIQUE_VIOLATION, message: 'A record with this value already exists' },
  P2003: { statusCode: 400, code: ErrorCodes.DB_FOREIGN_KEY_VIOLATION, message: 'Related record not found' },
  P2005: { statusCode: 400, code: ErrorCodes.DB_INVALID_FIELD_VALUE, message: 'Invalid value provided for one or more fields' },
  P2006: { statusCode: 400, code: ErrorCodes.DB_INVALID_FIELD_VALUE, message: 'Invalid value provided for one or more fields' },
  P2010: { statusCode: 400, code: ErrorCodes.DB_INVALID_FIELD_VALUE, message: 'Database query failed' },
  P2011: { statusCode: 400, code: ErrorCodes.DB_INVALID_FIELD_VALUE, message: 'Null value not allowed for required field' },
  P2014: { statusCode: 400, code: ErrorCodes.DB_FOREIGN_KEY_VIOLATION, message: 'Invalid relation data provided' },
  P2021: { statusCode: 400, code: ErrorCodes.DB_INVALID_FIELD_VALUE, message: 'Invalid table or column reference' },
  P2022: { statusCode: 400, code: ErrorCodes.DB_INVALID_FIELD_VALUE, message: 'Invalid column value' },
  P2023: { statusCode: 400, code: ErrorCodes.DB_INVALID_FIELD_VALUE, message: 'Inconsistent data provided' },
  P2025: { statusCode: 404, code: ErrorCodes.DB_RECORD_NOT_FOUND, message: 'Record not found' },
  P2033: { statusCode: 400, code: ErrorCodes.DB_INVALID_FIELD_VALUE, message: 'Number out of range' },
};

export function handleApiError(err: unknown) {
  const error = err as HandledError;
  let statusCode = error.statusCode || 500;
  let message = error.message || 'Internal server error';
  let code = error.errorCode || null;

  // Prisma known errors
  if (error.code && prismaErrorMap[error.code]) {
    const mapped = prismaErrorMap[error.code];
    statusCode = mapped.statusCode;
    code = mapped.code;
    message = mapped.message;
    if (error.code === 'P2002' && error.meta?.target?.length) {
      message = `${error.meta.target[0]} is already in use`;
    }
  }

  // JWT errors
  if (error.name === 'JsonWebTokenError') {
    statusCode = 401;
    code = ErrorCodes.AUTH_TOKEN_INVALID;
    message = 'Invalid authentication token';
  } else if (error.name === 'TokenExpiredError') {
    statusCode = 401;
    code = ErrorCodes.AUTH_TOKEN_EXPIRED;
    message = 'Authentication token expired';
  }

  const isOperational = error.isOperational === true || !!code;
  if (!isOperational) {
    statusCode = 500;
    code = ErrorCodes.INTERNAL_ERROR;
    message = 'Internal server error';
  }

  const logPayload = { statusCode, clientCode: code, message: error.message, stack: error.stack };
  if (statusCode >= 500) {
    logger.error('Server error', logPayload);
  } else {
    logger.warn('Client error', logPayload);
  }

  const body: Record<string, unknown> = { success: false, message };
  if (code) body.code = code;
  if (error.errors) body.errors = error.errors;

  return NextResponse.json(body, { status: statusCode });
}
