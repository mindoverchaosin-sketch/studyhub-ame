import { getServerSession } from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import bcrypt from 'bcrypt'
import { getUserByEmail } from '@/server/services/user.service'
import type { UserRole } from '@prisma/client'
import type { Session, User } from 'next-auth'
import type { JWT } from 'next-auth/jwt'

type AuthUser = User & { role?: UserRole }
type AuthSessionUser = Session['user'] & { id?: string; role?: UserRole }

export const authOptions = {
  session: {
    strategy: 'jwt' as const,
  },
  pages: {
    signIn: '/login',
  },
  secret: process.env.AUTH_SECRET || 'development-secret',
  trustHost: true,
  providers: [
    Credentials({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
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
          role: user.role as UserRole,
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }: { token: JWT; user?: AuthUser }) {
      if (user) {
        token.id = user.id
        token.role = user.role as UserRole
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
}

export async function auth() {
  return getServerSession(authOptions)
}
