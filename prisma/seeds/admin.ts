import bcrypt from 'bcrypt'
import { prisma } from '../../lib/prisma'

export async function seedAdmin() {
  // Default admin password - in production, this should be set via environment variable
  const defaultPassword = process.env.ADMIN_PASSWORD || 'AeroPrep@2025'

  // Check if admin already exists
  const existingAdmin = await prisma.user.findUnique({
    where: { email: 'admin@aeroprep.com' },
  })

  if (existingAdmin) {
    return // Admin already exists, skip
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(defaultPassword, 10)

  // Create admin user
  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@aeroprep.com',
      displayName: 'Administrator',
      passwordHash: hashedPassword,
      role: 'ADMIN',
      emailVerified: true,
      isActive: true,
    },
  })

  // Create admin profile
  await prisma.adminProfile.create({
    data: {
      userId: adminUser.id,
      fullName: 'Administrator',
      department: 'Management',
      permissions: {
        canManageCourses: true,
        canManageUsers: true,
        canViewAnalytics: true,
      },
    },
  })
}

module.exports = { seedAdmin }
