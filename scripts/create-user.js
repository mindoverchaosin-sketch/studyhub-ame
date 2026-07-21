#!/usr/bin/env node
require('dotenv').config()
const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcrypt')

const prisma = new PrismaClient()

async function main() {
  const [email, password, name] = process.argv.slice(2)
  if (!email || !password) {
    console.error('Usage: node scripts/create-user.js email password [name]')
    process.exit(1)
  }

  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) {
    console.log('User already exists:', email)
    process.exit(0)
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

  console.log('Created user', user.email)
  await prisma.$disconnect()
}

main().catch((e) => { console.error(e); process.exit(1) })
