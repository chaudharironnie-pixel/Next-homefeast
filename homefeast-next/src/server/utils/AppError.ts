import ErrorCodes from './errorCodes';

class AppError extends Error {
  statusCode: number;
  errorCode: string | null;
  isOperational: boolean;

  constructor(message: string, statusCode: number, code: string | null = null) {
    super(message);
    this.statusCode = statusCode;
    this.errorCode = code;
    this.isOperational = true;
    Error.captureStackTrace?.(this, this.constructor);
  }

  static badRequest(message = 'Bad request', code = ErrorCodes.BAD_REQUEST) {
    return new AppError(message, 400, code);
  }
  static validationFailed(message = 'Validation failed', code = ErrorCodes.VALIDATION_FAILED) {
    return new AppError(message, 400, code);
  }
  static unauthorized(message = 'Unauthorized', code = ErrorCodes.UNAUTHORIZED) {
    return new AppError(message, 401, code);
  }
  static forbidden(message = 'Forbidden', code = ErrorCodes.FORBIDDEN) {
    return new AppError(message, 403, code);
  }
  static notFound(message = 'Resource not found', code = ErrorCodes.NOT_FOUND) {
    return new AppError(message, 404, code);
  }
  static conflict(message = 'Conflict', code = ErrorCodes.CONFLICT) {
    return new AppError(message, 409, code);
  }
  static tooManyRequests(message = 'Too many requests', code = ErrorCodes.TOO_MANY_REQUESTS) {
    return new AppError(message, 429, code);
  }
  static internal(message = 'Internal server error', code = ErrorCodes.INTERNAL_ERROR) {
    return new AppError(message, 500, code);
  }
  static serviceUnavailable(message = 'Service unavailable', code = ErrorCodes.SERVICE_UNAVAILABLE) {
    return new AppError(message, 503, code);
  }
}

export default AppError;
