import { DefaultSession } from "next-auth"
import { DefaultJWT } from "next-auth/jwt"

type UserRole = "STUDENT" | "ADMIN" | "INSTRUCTOR" | "SUPER_ADMIN" | "CONTENT_MANAGER" | "STUDENT_MANAGER" | "FINANCE_MANAGER" | "SUPPORT_AGENT" | "QUESTION_REVIEWER"

declare module "next-auth" {
  interface Session {
    user: DefaultSession["user"] & {
      id: string
      role: UserRole
    }
  }

  interface User {
    id: string
    role: UserRole
  }
}

declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    id: string
    role: UserRole
  }
}