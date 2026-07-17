'use server'

import bcrypt from 'bcrypt'
import prisma from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { signIn } from '@/auth'
import { getUserByEmail } from '@/server/services/user.service'

export async function registerWithCredentials(formData: FormData) {
  const email = formData.get('email')?.toString().trim().toLowerCase() ?? ''
  const password = formData.get('password')?.toString() ?? ''
  const name = formData.get('name')?.toString().trim() ?? ''

  if (!email || !password) {
    return { success: false, error: 'Email and password are required.' }
  }

  const existingUser = await getUserByEmail(email)

  if (existingUser) {
    return { success: false, error: 'An account with that email already exists.' }
  }

  const passwordHash = await bcrypt.hash(password, 10)

  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      displayName: name || email,
      role: 'STUDENT',
      emailVerified: true,
      isActive: true,
    },
  })

  await prisma.studentProfile.create({
    data: {
      userId: user.id,
      fullName: name || email,
      targetExam: 'BOTH',
    },
  })

  await signIn('credentials', {
    email,
    password,
    redirect: false,
  })

  redirect('/student/dashboard')
}
