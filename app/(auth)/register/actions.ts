'use server'

import { requireAuth } from '@/auth'
import bcrypt from 'bcrypt'
import prisma from '@/lib/prisma'
import { getUserByEmail } from '@/server/services/user.service'

export async function registerWithCredentials(formData: FormData) {
  await requireAuth().catch(() => undefined)
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

  const studentRole = await prisma.role.findUnique({ where: { name: 'STUDENT' } })

  if (!studentRole) {
    return { success: false, error: 'User role configuration is missing.' }
  }

  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      displayName: name || email,
      roleId: studentRole.id,
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

  return {
    success: true,
  }
}
