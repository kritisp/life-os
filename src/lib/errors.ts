export class AppError extends Error {
  constructor(
    message: string,
    public code: string = 'INTERNAL_ERROR',
    public statusCode: number = 500
  ) {
    super(message)
    this.name = 'AppError'
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Authentication required') {
    super(message, 'UNAUTHORIZED', 401)
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Access forbidden') {
    super(message, 'FORBIDDEN', 403)
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Resource not found') {
    super(message, 'NOT_FOUND', 404)
  }
}

export class ValidationError extends AppError {
  constructor(message = 'Invalid request payload') {
    super(message, 'VALIDATION_ERROR', 400)
  }
}

/**
 * Safely formats any caught error into a standardized user-facing string message
 * without leaking raw SQL or sensitive stack traces.
 */
export function sanitizeErrorMessage(error: unknown): string {
  if (error instanceof AppError) {
    return error.message
  }
  if (error instanceof Error) {
    // Suppress Postgres / Supabase SQL error details in client-facing response
    if (error.message.includes('postgres') || error.message.includes('relation')) {
      return 'A database operation failed. Please try again.'
    }
    return error.message
  }
  return 'An unexpected error occurred. Please try again.'
}
