export class AIServiceError extends Error {
  constructor(message: string, public readonly status = 500, public readonly code = 'AI_SERVICE_ERROR') {
    super(message);
    this.name = 'AIServiceError';
  }
}

export class ValidationError extends AIServiceError {
  constructor(message: string) {
    super(message, 400, 'VALIDATION_ERROR');
  }
}

export class AuthenticationError extends AIServiceError {
  constructor(message = 'Authentication required.') {
    super(message, 401, 'AUTHENTICATION_ERROR');
  }
}

export class RateLimitError extends AIServiceError {
  constructor(message = 'Too many requests.') {
    super(message, 429, 'RATE_LIMIT_ERROR');
  }
}

export function toErrorResponse(error: unknown) {
  if (error instanceof AIServiceError) {
    return {
      success: false,
      error: error.message,
      code: error.code,
      status: error.status,
    };
  }

  return {
    success: false,
    error: 'Unexpected AI service failure.',
    code: 'UNKNOWN_ERROR',
    status: 500,
  };
}
