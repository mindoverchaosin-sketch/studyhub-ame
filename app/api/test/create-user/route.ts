import { requireAdmin } from '@/auth'
import { NextResponse } from 'next/server'
import bcrypt from 'bcrypt'
import prisma from '@/lib/prisma'

export async function POST(request: Request) {
  await requireAdmin()
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'Not allowed' }, { status: 403 })
  }

  const body = await request.json()
  const { email, password, name } = body

  if (!email || !password) {
    return NextResponse.json({ error: 'email and password required' }, { status: 400 })
  }

  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) {
    return NextResponse.json({ ok: true, message: 'already exists' })
  }

  const passwordHash = await bcrypt.hash(password, 10)
  const studentRole = await prisma.role.findUnique({ where: { name: 'STUDENT' } })

  if (!studentRole) {
    return NextResponse.json({ error: 'student role missing' }, { status: 500 })
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

  return NextResponse.json({ ok: true, email: user.email })
}
