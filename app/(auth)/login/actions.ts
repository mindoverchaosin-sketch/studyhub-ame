'use server'

import { signIn } from '@/auth'
import { getUserByEmail } from '@/server/services/user.service'
import { redirect } from 'next/navigation'

export async function loginWithCredentials(formData: FormData) {
  const email = formData.get('email')?.toString().trim().toLowerCase() ?? ''
  const password = formData.get('password')?.toString() ?? ''

  const user = await getUserByEmail(email)

  if (!user || !user.isActive) {
    return { success: false, error: 'Invalid email or password.' }
  }

  const result = await signIn('credentials', {
    email,
    password,
    redirect: false,
  })

  if (result?.error) {
    return { success: false, error: 'Invalid email or password.' }
  }

  redirect(user.role === 'ADMIN' ? '/admin/dashboard' : '/student/dashboard')
}
