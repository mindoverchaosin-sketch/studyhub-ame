export { auth, authOptions, AppError, UnauthorizedError, ForbiddenError, NotFoundError, ValidationError, DatabaseError, UnexpectedError, requireAuth, requireStudent, requireAdmin, requireRole, requirePermission, requireOwnership, getCurrentUser } from './auth/index'
export type { AuthSession, UserRole } from './auth/index'
