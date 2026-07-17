import { prisma } from '../../lib/prisma'

export async function seedDgca() {
  // Upsert DGCA course
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

  // DGCA Part-66 modules
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

  // Upsert each module
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
}

module.exports = { seedDgca }
