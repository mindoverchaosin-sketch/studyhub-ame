import { prisma } from '../../lib/prisma'

export async function seedEasa() {
  // Upsert EASA course
  const easaCourse = await prisma.course.upsert({
    where: { slug: 'easa-part-66' },
    update: {},
    create: {
      title: 'EASA Part-66',
      slug: 'easa-part-66',
      description: 'European Union Aviation Safety Agency Part-66 Aircraft Maintenance Engineering course',
      status: 'PUBLISHED',
    },
  })

  // EASA Part-66 modules
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

  // Upsert each module
  for (const moduleData of easaModules) {
    await prisma.module.upsert({
      where: { slug: moduleData.slug },
      update: { displayOrder: moduleData.order },
      create: {
        courseId: easaCourse.id,
        title: moduleData.title,
        slug: moduleData.slug,
        moduleNumber: String(moduleData.order),
        displayOrder: moduleData.order,
        status: 'PUBLISHED',
      },
    })
  }
}

module.exports = { seedEasa }
