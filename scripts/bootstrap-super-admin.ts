import bcrypt from 'bcrypt'
import prisma from '@/lib/prisma'

type Logger = Pick<Console, 'info' | 'warn' | 'error'>

type BootstrapOptions = {
  email?: string
  password?: string
  logger?: Logger
  prismaClient?: typeof prisma
}

export function validateSuperAdminBootstrapInputs(email?: string, password?: string) {
  const normalizedEmail = (email ?? '').trim().toLowerCase()

  if (!normalizedEmail) {
    throw new Error('SUPER_ADMIN_EMAIL is required.')
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
    throw new Error('SUPER_ADMIN_EMAIL must be a valid email address.')
  }

  if (!password) {
    throw new Error('SUPER_ADMIN_PASSWORD is required.')
  }

  if (password.length < 8) {
    throw new Error('SUPER_ADMIN_PASSWORD must be at least 8 characters long.')
  }

  return {
    email: normalizedEmail,
    password,
  }
}

export async function bootstrapSuperAdmin(options: BootstrapOptions = {}) {
  const logger = options.logger ?? console
  const prismaClient = options.prismaClient ?? prisma

  const { email, password } = validateSuperAdminBootstrapInputs(
    options.email ?? process.env.SUPER_ADMIN_EMAIL,
    options.password ?? process.env.SUPER_ADMIN_PASSWORD,
  )

  const existingSuperAdmin = await prismaClient.user.findFirst({
    where: {
      role: { is: { name: 'SUPER_ADMIN' } },
    },
    include: { role: true },
  })

  if (existingSuperAdmin) {
    logger.info('Super admin already exists; bootstrap skipped.')
    return {
      created: false,
      userId: existingSuperAdmin.id,
      email: existingSuperAdmin.email,
      reason: 'existing-super-admin',
    }
  }

  const designatedUser = await prismaClient.user.findUnique({
    where: { email },
    include: { role: true },
  })

  if (designatedUser && designatedUser.role?.name !== 'SUPER_ADMIN') {
    logger.warn(
      `Designated email ${email} already belongs to a different user account. Bootstrap was cancelled to avoid overwriting unrelated credentials.`,
    )
    throw new Error('Designated super admin email already belongs to a different user account.')
  }

  if (designatedUser?.role?.name === 'SUPER_ADMIN') {
    logger.info('The designated email already belongs to the existing super admin. Bootstrap skipped.')
    return {
      created: false,
      userId: designatedUser.id,
      email: designatedUser.email,
      reason: 'existing-designated-super-admin',
    }
  }

  const superAdminRole = await prismaClient.role.upsert({
    where: { name: 'SUPER_ADMIN' },
    update: {},
    create: {
      name: 'SUPER_ADMIN',
      description: 'Super Administrator role',
    },
  })

  const passwordHash = await bcrypt.hash(password, 10)

  const createdUser = await prismaClient.user.create({
    data: {
      email,
      displayName: 'Super Admin',
      passwordHash,
      role: {
        connect: { id: superAdminRole.id },
      },
      isActive: true,
    },
  })

  logger.info(`Super admin bootstrap complete for ${email}.`)

  return {
    created: true,
    userId: createdUser.id,
    email: createdUser.email,
    reason: 'created-super-admin',
  }
}

export async function runBootstrapCommand() {
  const logger = console

  try {
    const result = await bootstrapSuperAdmin()
    logger.info(`Bootstrap result: ${result.created ? 'created' : 'already-present'} for ${result.email}.`)
    return result
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown bootstrap error.'
    logger.error(`Super admin bootstrap failed: ${message}`)
    throw error
  }
}

if (process.argv[1]?.includes('bootstrap-super-admin')) {
  void runBootstrapCommand()
}
