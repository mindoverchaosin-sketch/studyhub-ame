import { signIn as nextAuthSignIn, signOut as nextAuthSignOut } from 'next-auth/react'
import { auth, authOptions } from '@/lib/auth'

export { auth, authOptions }

export async function signIn(...args: Parameters<typeof nextAuthSignIn>) {
  return nextAuthSignIn(...args)
}

export async function signOut(...args: Parameters<typeof nextAuthSignOut>) {
  return nextAuthSignOut(...args)
}
