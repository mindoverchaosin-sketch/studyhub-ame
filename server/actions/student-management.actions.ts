'use server'

import { revalidatePath } from 'next/cache'
import { requirePermission } from '@/auth'
import { withAuditLogging } from '@/server/actions/audit-helpers'
import type { StudentDetailDTO, StudentDirectoryDTO, StudentManagementActionResult } from '@/server/application/dto/student-management.dto'
import { getStudentDetail, getStudentManagementDirectory, reactivateStudentAccount, resetStudentProgress, suspendStudentAccount } from '@/server/services/student-management.service'

function resolveStudentId(studentIdOrFormData: string | FormData): string {
  if (typeof studentIdOrFormData === 'string') {
    return studentIdOrFormData
  }

  const studentId = studentIdOrFormData.get('studentId')
  return typeof studentId === 'string' ? studentId : ''
}

export async function getStudentDirectoryAction(filters?: { search?: string; status?: 'ACTIVE' | 'SUSPENDED' | 'ALL'; role?: 'STUDENT' | 'ALL'; page?: number; pageSize?: number; sortBy?: 'newest' | 'lastActive' | 'name' }): Promise<StudentDirectoryDTO> {
  await requirePermission('manageStudents')
  return getStudentManagementDirectory(filters)
}

export async function getStudentDetailAction(studentId: string): Promise<StudentDetailDTO> {
  await requirePermission('manageStudents')
  return getStudentDetail(studentId)
}

export async function suspendStudentAction(studentIdOrFormData: string | FormData): Promise<void> {
  await requirePermission('manageStudents')
  const studentId = resolveStudentId(studentIdOrFormData)
  await withAuditLogging({
    permission: 'manageStudents',
    action: 'student.suspend',
    entityType: 'STUDENT',
    entityId: studentId,
    metadata: { source: 'student-management' },
    run: async () => {
      await suspendStudentAccount(studentId)
      revalidatePath('/admin/students')
    },
  })
}

export async function reactivateStudentAction(studentIdOrFormData: string | FormData): Promise<void> {
  await requirePermission('manageStudents')
  const studentId = resolveStudentId(studentIdOrFormData)
  await withAuditLogging({
    permission: 'manageStudents',
    action: 'student.reactivate',
    entityType: 'STUDENT',
    entityId: studentId,
    metadata: { source: 'student-management' },
    run: async () => {
      await reactivateStudentAccount(studentId)
      revalidatePath('/admin/students')
    },
  })
}

export async function resetStudentProgressAction(studentIdOrFormData: string | FormData): Promise<void> {
  await requirePermission('manageStudents')
  const studentId = resolveStudentId(studentIdOrFormData)
  await withAuditLogging({
    permission: 'manageStudents',
    action: 'student.reset-progress',
    entityType: 'STUDENT',
    entityId: studentId,
    metadata: { source: 'student-management' },
    run: async () => {
      await resetStudentProgress(studentId)
      revalidatePath('/admin/students')
    },
  })
}
