'use server'

import { requireAuth } from '@/auth'
import bcrypt from 'bcrypt'
import { getUserByEmail } from '@/server/services/user.service'
import { userRepository } from '@/server/repositories/user.repository'
import { roleRepository } from '@/server/repositories/role.repository'
import type { Prisma } from '@prisma/client'

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

  let studentRole = await roleRepository.findByName('STUDENT')

  if (!studentRole) {
    studentRole = await roleRepository.create({
      name: 'STUDENT',
      description: 'Student role',
    })
  }

  const createUserInput: Prisma.UserCreateInput = {
    email,
    passwordHash,
    displayName: name || email,
    role: {
      connect: { id: studentRole.id },
    },
    isActive: true,
  }

  const user = await userRepository.createUser(createUserInput)

  const createProfileInput: Prisma.StudentProfileCreateInput = {
    user: { connect: { id: user.id } },
    fullName: name || email,
    targetExam: 'BOTH',
  }

  await userRepository.createStudentProfile(createProfileInput)

  return {
    success: true,
  }
}
