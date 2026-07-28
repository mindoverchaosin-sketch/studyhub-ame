import prisma from '@/lib/prisma'
import { examAttemptRepository } from '@/server/repositories/exam-attempt.repository'
import { examTemplateRepository } from '@/server/repositories/exam-template.repository'

async function main() {
  console.log('Verifying exam attempt creation...')

  const questions = await prisma.question.findMany({ take: 10 })
  console.log('Found questions:', questions.length)
  if (questions.length === 0) {
    console.log('No questions found; creating sample questions...')
    const qb = await prisma.questionBank.create({ data: { title: 'script-bank', description: 'temp', status: 'PUBLISHED' } })
    const created = []
    for (let i = 1; i <= 5; i++) {
      const q = await prisma.question.create({ data: { questionBankId: qb.id, prompt: `Sample question ${i}`, questionType: 'MULTIPLE_CHOICE', options: JSON.stringify([`A${i}`, `B${i}`, `C${i}`, `D${i}`]), correctOptionIndex: 0, explanation: `explain ${i}`, difficulty: 'BEGINNER', status: 'PUBLISHED', metadata: JSON.stringify({ tags: ['auto'], timeEstimateMinutes: 3 }) } })
      created.push(q)
    }
    console.log('Created sample questions:', created.length)
  }
  // refresh questions
  const refreshed = await prisma.question.findMany({ take: 10 })
  console.log('Now found questions:', refreshed.length)
  const useQuestions = refreshed

  // find or create a template
  let template = await examTemplateRepository.listTemplates({ take: 1 })
  let tpl = template[0]
  if (!tpl) {
    console.log('No template found; creating one...')
    tpl = await examTemplateRepository.createTemplate({ name: 'Auto Test Template', questionBankId: useQuestions[0].questionBankId ?? null, questionCount: Math.min(3, useQuestions.length), durationMinutes: 10, shuffleQuestions: true })
  }

  console.log('Using template:', tpl.id)

  const attempt = await import('@/server/services/exam-attempt.service').then((m) => m.generateExamAttempt(tpl.id, 'script-student'))

  console.log('Attempt created:', attempt.id)
  console.log('Questions in attempt:', attempt.questions?.length)

  // verify DB rows
  const rows = await prisma.examAttemptQuestion.findMany({ where: { attemptId: attempt.id } })
  console.log('DB rows for attempt:', rows.length)

  const uniqueIds = new Set(rows.map((r) => r.questionId))
  console.log('Unique question ids:', uniqueIds.size)

  if (rows.length !== tpl.questionCount) {
    console.error('Question count mismatch:', rows.length, '!=', tpl.questionCount)
    process.exit(1)
  }

  if (uniqueIds.size !== rows.length) {
    console.error('Duplicate question ids present')
    process.exit(1)
  }

  console.log('Attempt creation verification passed.')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
