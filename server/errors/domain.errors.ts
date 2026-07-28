export class AppError extends Error {
  constructor(message: string, public readonly statusCode: number = 500, public readonly code?: string) {
    super(message)
    this.name = 'AppError'
    Object.setPrototypeOf(this, new.target.prototype)
  }

  get status() {
    return this.statusCode
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Authentication required.', code = 'UNAUTHORIZED') {
    super(message, 401, code)
    this.name = 'UnauthorizedError'
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Access denied.', code = 'FORBIDDEN') {
    super(message, 403, code)
    this.name = 'ForbiddenError'
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Resource not found.', code = 'NOT_FOUND') {
    super(message, 404, code)
    this.name = 'NotFoundError'
  }
}

export class ValidationError extends AppError {
  constructor(message = 'Validation failed.', code = 'VALIDATION_ERROR') {
    super(message, 400, code)
    this.name = 'ValidationError'
  }
}

export class ConflictError extends AppError {
  constructor(message = 'Conflict occurred.', code = 'CONFLICT') {
    super(message, 409, code)
    this.name = 'ConflictError'
  }
}

export class ResourceNotFoundError extends NotFoundError {
  constructor(message = 'Resource not found.', code = 'RESOURCE_NOT_FOUND') {
    super(message, code)
    this.name = 'ResourceNotFoundError'
  }
}

export class BusinessRuleError extends ConflictError {
  constructor(message = 'Business rule violation.', code = 'BUSINESS_RULE') {
    super(message, code)
    this.name = 'BusinessRuleError'
  }
}

export class DatabaseError extends AppError {
  constructor(message = 'Database request failed.', code = 'DATABASE_ERROR') {
    super(message, 500, code)
    this.name = 'DatabaseError'
  }
}

export class UnexpectedError extends AppError {
  constructor(message = 'Unexpected error.', code = 'UNEXPECTED_ERROR') {
    super(message, 500, code)
    this.name = 'UnexpectedError'
  }
}

export class ServiceUnavailableError extends AppError {
  constructor(message = 'Service unavailable.', code = 'SERVICE_UNAVAILABLE') {
    super(message, 503, code)
    this.name = 'ServiceUnavailableError'
  }
}
