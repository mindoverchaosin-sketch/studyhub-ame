import { requirePermission } from '@/auth'
import { NextResponse } from 'next/server'
import bcrypt from 'bcrypt'
import { userRepository } from '@/server/repositories/user.repository'
import { roleRepository } from '@/server/repositories/role.repository'
import { withRequestLogging } from '@/lib/request-logger'
import { getRequestId } from '@/lib/request-context'

export async function POST(req: Request) {
  return withRequestLogging(req, 'createUserTest', async () => {
    await requirePermission('manageUsers')
    if (process.env.NODE_ENV !== 'development') {
      const response = NextResponse.json({ error: 'Not allowed' }, { status: 403 })
      const requestId = getRequestId()
      if (requestId) response.headers.set('x-request-id', requestId)
      return response
    }

    const body = await req.json()
    const { email, password, name } = body

    if (!email || !password) {
      const response = NextResponse.json({ error: 'email and password required' }, { status: 400 })
      const requestId = getRequestId()
      if (requestId) response.headers.set('x-request-id', requestId)
      return response
    }

    const existing = await userRepository.findByEmail(email)
    if (existing) {
      const response = NextResponse.json({ ok: true, message: 'already exists' })
      const requestId = getRequestId()
      if (requestId) response.headers.set('x-request-id', requestId)
      return response
    }

    const passwordHash = await bcrypt.hash(password, 10)
    let studentRole = await roleRepository.findByName('STUDENT')

    if (!studentRole) {
      studentRole = await roleRepository.create({
        name: 'STUDENT',
        description: 'Student role',
      })
    }

    const user = await userRepository.createUser({
      email,
      passwordHash,
      displayName: name || email,
      roleId: studentRole.id,
      isActive: true,
    } as any)

    await userRepository.createStudentProfile({ userId: user.id, fullName: name || email, targetExam: 'BOTH' } as any)

    const response = NextResponse.json({ ok: true, email: user.email })
    const requestId = getRequestId()
    if (requestId) response.headers.set('x-request-id', requestId)
    return response
  })
}
