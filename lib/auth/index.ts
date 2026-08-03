import { getServerSession, type NextAuthOptions } from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import bcrypt from 'bcrypt'
import { getUserByEmail } from '@/server/services/user.service'
import { userRepository } from '@/server/repositories/user.repository'
import { roleRepository } from '@/server/repositories/role.repository'
import { permissionService } from '@/server/services/permission.service'
import { auditLogService } from '@/server/services/audit-log.service'
import type { Session, User } from 'next-auth'
import type { JWT } from 'next-auth/jwt'

export type UserRole = 'STUDENT' | 'ADMIN' | 'INSTRUCTOR' | 'SUPER_ADMIN' | 'CONTENT_MANAGER' | 'STUDENT_MANAGER' | 'FINANCE_MANAGER' | 'SUPPORT_AGENT' | 'QUESTION_REVIEWER'

const AUTH_ROLE_VALUES = ['STUDENT', 'ADMIN', 'INSTRUCTOR', 'SUPER_ADMIN', 'CONTENT_MANAGER', 'STUDENT_MANAGER', 'FINANCE_MANAGER', 'SUPPORT_AGENT', 'QUESTION_REVIEWER'] as const

export type AuthSession = Session & {
  user: Session['user'] & {
    id?: string
    role?: UserRole
  }
}

type AuthUser = User & { role?: UserRole | string }
type AuthSessionUser = Session['user'] & { id?: string; role?: UserRole }

const VALID_ROLES = new Set<UserRole>(['STUDENT', 'ADMIN', 'INSTRUCTOR', 'SUPER_ADMIN', 'CONTENT_MANAGER', 'STUDENT_MANAGER', 'FINANCE_MANAGER', 'SUPPORT_AGENT', 'QUESTION_REVIEWER'])

function isValidRole(role: string | undefined): role is UserRole {
  return typeof role === 'string' && VALID_ROLES.has(role as UserRole)
}

export class AppError extends Error {
  constructor(message: string, public readonly status: number = 500) {
    super(message)
    this.name = 'AppError'
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Authentication required.') {
    super(message, 401)
    this.name = 'UnauthorizedError'
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Access denied.') {
    super(message, 403)
    this.name = 'ForbiddenError'
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Resource not found.') {
    super(message, 404)
    this.name = 'NotFoundError'
  }
}

export class ValidationError extends AppError {
  constructor(message = 'Validation failed.') {
    super(message, 400)
    this.name = 'ValidationError'
  }
}

export class DatabaseError extends AppError {
  constructor(message = 'Database request failed.') {
    super(message, 500)
    this.name = 'DatabaseError'
  }
}

export class UnexpectedError extends AppError {
  constructor(message = 'Unexpected error.') {
    super(message, 500)
    this.name = 'UnexpectedError'
  }
}

async function getValidatedSession(): Promise<AuthSession | null> {
  const session = await auth()

  if (!session?.user?.id) {
    return null
  }

  const sessionRole = session.user.role

  if (!isValidRole(sessionRole)) {
    return null
  }

  const dbUser = await userRepository.findById(session.user.id)

  if (!dbUser || !dbUser.isActive) {
    return null
  }

  const databaseRole = dbUser.role?.name

  if (!isValidRole(databaseRole) || databaseRole !== sessionRole) {
    return null
  }

  return session as AuthSession
}

export async function getCurrentUser(): Promise<AuthSession | null> {
  return getValidatedSession()
}

export async function requireAuth(): Promise<AuthSession> {
  const session = await getValidatedSession()

  if (!session) {
    throw new UnauthorizedError()
  }

  return session
}

export async function requireAuthenticated(): Promise<AuthSession> {
  return requireAuth()
}

export async function requireStudent(): Promise<AuthSession> {
  const session = await requireAuth()

  if (session.user.role !== 'STUDENT') {
    throw new ForbiddenError('Student access required.')
  }

  return session
}

export async function requireAdmin(): Promise<AuthSession> {
  const session = await requireAuth()

  if (session.user.role === 'ADMIN' || session.user.role === 'SUPER_ADMIN') {
    return session
  }

  throw new ForbiddenError('Admin access required.')
}

export async function requireRole(role: UserRole): Promise<AuthSession> {
  const session = await requireAuth()

  if (session.user.role !== role) {
    throw new ForbiddenError(`Role required: ${role}`)
  }

  return session
}

export function requireOwnership(resourceUserId: string, currentUserId: string, allowAdmin = false, currentUserRole?: string): void {
  const normalizedRole = typeof currentUserRole === 'string' ? currentUserRole.toUpperCase() : undefined

  if (allowAdmin && (normalizedRole === 'ADMIN' || normalizedRole === 'SUPER_ADMIN')) {
    return
  }

  if (resourceUserId !== currentUserId) {
    throw new ForbiddenError('Access denied.')
  }
}

export async function requirePermission(permission: string): Promise<AuthSession> {
  const session = await requireAuth()

  if (permissionService.hasPermission(session.user.role, permission as any)) {
    return session
  }

  const userWithPerms = await roleRepository.getPermissionsForUser(session.user.id)

  const hasPermission =
    userWithPerms?.role?.permissions?.some(
      (
        permissionRecord: {
          permission: {
            name: string
          }
        }
      ) => permissionRecord.permission.name === permission
    ) ?? false

  if (!hasPermission) {
    throw new ForbiddenError(`Permission required: ${permission}`)
  }

  return session
}

export const authOptions: NextAuthOptions = {
  session: {
    strategy: 'jwt',
  },

  pages: {
    signIn: '/login',
  },

  secret: process.env.AUTH_SECRET || 'development-secret',

  providers: [
    Credentials({
      name: 'Credentials',

      credentials: {
        email: {
          label: 'Email',
          type: 'email',
        },

        password: {
          label: 'Password',
          type: 'password',
        },
      },

      async authorize(credentials) {
        const email = credentials?.email?.toString().trim().toLowerCase()
        const password = credentials?.password?.toString()

        if (!email || !password) {
          return null
        }

        const user = await getUserByEmail(email)

        if (!user || !user.isActive || !user.passwordHash) {
          return null
        }

        const isValidPassword = await bcrypt.compare(password, user.passwordHash)

        if (!isValidPassword) {
          return null
        }

        return {
          id: user.id,
          email: user.email,
          name: user.displayName ?? user.email,
          role: (user.role?.name ?? 'STUDENT') as UserRole,
        } as import('next-auth').User
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user }: { token: JWT; user?: AuthUser }) {
      if (user) {
        token.id = user.id
        token.role = (user.role as UserRole) ?? 'STUDENT'
      }

      return token
    },

    async session({ session, token }: { session: Session; token: JWT }) {
      if (session.user) {
        const sessionUser = session.user as AuthSessionUser

        sessionUser.id = token.id as string
        sessionUser.role = token.role as UserRole
      }

      return session
    },
  },

  events: {
    async signIn(message) {
      try {
        const actorId = (message.user as { id?: string } | undefined)?.id ?? null
        if (actorId) {
          await auditLogService.recordEvent({ actorId, actorRole: (message.user as { role?: string } | undefined)?.role ?? null, action: 'auth.login', entityType: 'USER', entityId: actorId, metadata: { source: 'next-auth' } })
        }
      } catch {
        // Swallow audit failures so auth remains available.
      }
    },

    async signOut(message) {
      try {
        const actorId = ((message as { token?: { sub?: string } }).token?.sub) ?? ((message as { session?: { user?: { id?: string } } }).session?.user?.id) ?? null
        if (actorId) {
          await auditLogService.recordEvent({ actorId, action: 'auth.logout', entityType: 'USER', entityId: actorId, metadata: { source: 'next-auth' } })
        }
      } catch {
        // Swallow audit failures so sign-out remains available.
      }
    },
  },
}

export async function auth() {
  return getServerSession(authOptions)
}
