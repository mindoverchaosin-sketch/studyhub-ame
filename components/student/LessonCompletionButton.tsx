'use client'

import { useState, useTransition } from 'react'
import { FiFlag } from 'react-icons/fi'
import Button from '@/components/ui/Button'
import { setLessonCompletion } from '@/server/actions/student-learning.actions'

export default function LessonCompletionButton({ lessonId, completed }: { lessonId: string; completed: boolean }) {
  const [isPending, startTransition] = useTransition()
  const [isCompleted, setIsCompleted] = useState(completed)
  const [error, setError] = useState<string | null>(null)

  const toggleCompletion = () => {
    const nextValue = !isCompleted
    setError(null)
    startTransition(async () => {
      try {
        await setLessonCompletion(lessonId, nextValue)
        setIsCompleted(nextValue)
      } catch {
        setError('Unable to update lesson progress.')
      }
    })
  }

  return (
    <div>
      <Button variant={isCompleted ? 'secondary' : 'primary'} size="sm" type="button" onClick={toggleCompletion} disabled={isPending}>
        <span className="flex items-center gap-2"><FiFlag className="h-4 w-4" />{isPending ? 'Saving...' : isCompleted ? 'Completed' : 'Mark complete'}</span>
      </Button>
      {error ? <p className="mt-2 text-xs text-rose-600" role="alert">{error}</p> : null}
    </div>
  )
}