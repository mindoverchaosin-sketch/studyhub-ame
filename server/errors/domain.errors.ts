export class AppError extends Error {
  constructor(message: string, public readonly status: number = 500) {
    super(message)
    this.name = 'AppError'
  }
}

export class NotImplementedError extends AppError {
  constructor(message = 'This functionality is not implemented.') {
    super(message, 501)
    this.name = 'NotImplementedError'
  }
}

export class ResourceNotFoundError extends AppError {
  constructor(message = 'Resource not found.') {
    super(message, 404)
    this.name = 'ResourceNotFoundError'
  }
}

export class BusinessRuleError extends AppError {
  constructor(message = 'Business rule violation.') {
    super(message, 409)
    this.name = 'BusinessRuleError'
  }
}

export class ConflictError extends AppError {
  constructor(message = 'Conflict occurred.') {
    super(message, 409)
    this.name = 'ConflictError'
  }
}

export class ServiceUnavailableError extends AppError {
  constructor(message = 'Service unavailable.') {
    super(message, 503)
    this.name = 'ServiceUnavailableError'
  }
}
