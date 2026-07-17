import "dotenv/config";
import prisma from "../lib/prisma";

async function main() {
  console.log('🌱 Starting seed...')

  try {
    // Seed DGCA
    const dgcaCourse = await prisma.course.upsert({
      where: { slug: 'dgca-part-66' },
      update: {},
      create: {
        title: 'DGCA Part-66',
        slug: 'dgca-part-66',
        description: 'Directorate General of Civil Aviation Part-66 Aircraft Maintenance Engineering course',
        examType: 'DGCA',
        isPublished: true,
      },
    })

    const dgcaModules = [
      { order: 1, title: 'Module 1 Mathematics', slug: 'module-1-mathematics' },
      { order: 2, title: 'Module 2 Physics', slug: 'module-2-physics' },
      { order: 3, title: 'Module 3 Electrical Fundamentals', slug: 'module-3-electrical-fundamentals' },
      { order: 4, title: 'Module 4 Electronic Fundamentals', slug: 'module-4-electronic-fundamentals' },
      { order: 5, title: 'Module 5 Digital Techniques', slug: 'module-5-digital-techniques' },
      { order: 6, title: 'Module 6 Avionics Systems', slug: 'module-6-avionics-systems' },
      { order: 7, title: 'Module 7 Airframes and Structures', slug: 'module-7-airframes-structures' },
      { order: 8, title: 'Module 8 Aircraft Systems', slug: 'module-8-aircraft-systems' },
      { order: 9, title: 'Module 9 Aircraft Powerplants', slug: 'module-9-aircraft-powerplants' },
      { order: 10, title: 'Module 10 Aircraft Materials and Hardware', slug: 'module-10-materials-hardware' },
      { order: 11, title: 'Module 11 Basic Aerodynamics', slug: 'module-11-basic-aerodynamics' },
      { order: 12, title: 'Module 12 Human Performance', slug: 'module-12-human-performance' },
      { order: 13, title: 'Module 13 Principles of Flight', slug: 'module-13-principles-flight' },
      { order: 14, title: 'Module 14 Aircraft Fuel Systems', slug: 'module-14-fuel-systems' },
      { order: 15, title: 'Module 15 Aircraft Hydraulic Power', slug: 'module-15-hydraulic-power' },
      { order: 16, title: 'Module 16 Aircraft Pneumatic Power', slug: 'module-16-pneumatic-power' },
      { order: 17, title: 'Module 17 Propellers', slug: 'module-17-propellers' },
    ]

    for (const moduleData of dgcaModules) {
      await prisma.module.upsert({
        where: { slug: moduleData.slug },
        update: { order: moduleData.order },
        create: {
          courseId: dgcaCourse.id,
          title: moduleData.title,
          slug: moduleData.slug,
          order: moduleData.order,
          isPublished: true,
        },
      })
    }
    console.log('✓ DGCA seed completed')

    // Seed EASA
    const easaCourse = await prisma.course.upsert({
      where: { slug: 'easa-part-66' },
      update: {},
      create: {
        title: 'EASA Part-66',
        slug: 'easa-part-66',
        description: 'European Union Aviation Safety Agency Part-66 Aircraft Maintenance Engineering course',
        examType: 'EASA',
        isPublished: true,
      },
    })

    const easaModules = [
      { order: 1, title: 'Module 1 Mathematics', slug: 'easa-module-1-mathematics' },
      { order: 2, title: 'Module 2 Physics', slug: 'easa-module-2-physics' },
      { order: 3, title: 'Module 3 Electrical Fundamentals', slug: 'easa-module-3-electrical' },
      { order: 4, title: 'Module 4 Electronic Fundamentals', slug: 'easa-module-4-electronic' },
      { order: 5, title: 'Module 5 Digital Techniques', slug: 'easa-module-5-digital' },
      { order: 6, title: 'Module 6 Avionics Systems', slug: 'easa-module-6-avionics' },
      { order: 7, title: 'Module 7 Airframes and Structures', slug: 'easa-module-7-airframes' },
      { order: 8, title: 'Module 8 Aerodynamics', slug: 'easa-module-8-aerodynamics' },
      { order: 9, title: 'Module 9 Aircraft Systems', slug: 'easa-module-9-aircraft-systems' },
      { order: 10, title: 'Module 10 Aircraft Powerplants and Propellers', slug: 'easa-module-10-powerplants' },
      { order: 11, title: 'Module 11 Aircraft Maintenance Practices', slug: 'easa-module-11-maintenance' },
    ]

    for (const moduleData of easaModules) {
      await prisma.module.upsert({
        where: { slug: moduleData.slug },
        update: { order: moduleData.order },
        create: {
          courseId: easaCourse.id,
          title: moduleData.title,
          slug: moduleData.slug,
          order: moduleData.order,
          isPublished: true,
        },
      })
    }
    console.log('✓ EASA seed completed')

    // Seed Admin
    const bcrypt = await import('bcrypt')
    const defaultPassword = process.env.ADMIN_PASSWORD || 'AeroPrep@2025'

    const existingAdmin = await prisma.user.findUnique({
      where: { email: 'admin@aeroprep.com' },
    })

    if (!existingAdmin) {
      const hashedPassword = await bcrypt.default.hash(defaultPassword, 10)

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
    console.log('✓ Admin seed completed')

    console.log('✅ Seed completed successfully!')
    process.exit(0)
  } catch (error) {
    console.error('❌ Seed failed:', error)
    process.exit(1)
  }
}

main()
