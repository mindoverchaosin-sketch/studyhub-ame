'use server'

import { getUserByEmail } from '@/server/services/user.service'

export async function loginWithCredentials(formData: FormData) {
  const email = formData.get('email')?.toString().trim().toLowerCase() ?? ''
  const password = formData.get('password')?.toString() ?? ''

  if (!email || !password) {
    return {
      success: false,
      error: 'Email and password are required.',
    }
  }

  const user = await getUserByEmail(email)

  if (!user || !user.isActive) {
    return {
      success: false,
      error: 'Invalid email or password.',
    }
  }

  return {
    success: true,
  }
}