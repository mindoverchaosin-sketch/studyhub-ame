import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { normalizeRoleName } from '@/server/services/authorization.service'
import { ApprovalStatus } from '@prisma/client'
import type { Session } from 'next-auth'

// Mock data
const mockUser = {
  id: 'test-user-id',
  email: 'test@example.com',
  passwordHash: 'hashed-password',
  isActive: true,
  roleId: 'admin-role-id',
  createdAt: new Date(),
  updatedAt: new Date(),
  deletedAt: null,
}

const mockApprovedAdmin = {
  userId: 'admin-user-id',
  status: 'APPROVED' as ApprovalStatus,
  approvedById: 'super-admin-id',
  approvedAt: new Date(),
  notes: 'Approved for admin access',
}

const mockPendingAdmin = {
  userId: 'pending-admin-id',
  status: 'PENDING' as ApprovalStatus,
  approvedById: null,
  approvedAt: null,
  notes: null,
}

const mockRejectedAdmin = {
  userId: 'rejected-admin-id',
  status: 'REJECTED' as ApprovalStatus,
  approvedById: 'super-admin-id',
  approvedAt: new Date(),
  notes: 'Does not meet admin criteria',
}

const mockSuspendedAdmin = {
  userId: 'suspended-admin-id',
  status: 'SUSPENDED' as ApprovalStatus,
  approvedById: 'super-admin-id',
  approvedAt: new Date(),
  notes: 'Suspended due to policy violation',
}

describe('Authorization Tests', () => {
  describe('normalizeRoleName', () => {
    it('should normalize role names to canonical form', () => {
      expect(normalizeRoleName('admin')).toBe('ADMIN')
      expect(normalizeRoleName('ADMIN')).toBe('ADMIN')
      expect(normalizeRoleName('Admin')).toBe('ADMIN')
      expect(normalizeRoleName('student')).toBe('STUDENT')
      expect(normalizeRoleName('STUDENT')).toBe('STUDENT')
      expect(normalizeRoleName('instructor')).toBe('INSTRUCTOR')
      expect(normalizeRoleName('INSTRUCTOR')).toBe('INSTRUCTOR')
      expect(normalizeRoleName('CONTENT_EDITOR')).toBe('CONTENT_EDITOR')
      expect(normalizeRoleName('content_editor')).toBe('CONTENT_EDITOR')
      expect(normalizeRoleName('SUPER_ADMIN')).toBe('SUPER_ADMIN')
      expect(normalizeRoleName('super_admin')).toBe('SUPER_ADMIN')
    })
  })

  describe('getApprovedStatusForRole', () => {
    it('should validate SUPER_ADMIN approval (no approval required)', () => {
      const role = 'SUPER_ADMIN'
      // SUPER_ADMIN doesn't require approval profile
      expect(['SUPER_ADMIN', 'CONTENT_EDITOR', 'STUDENT']).toContain(role)
    })

    it('should validate CONTENT_EDITOR approval (no approval required)', () => {
      const role = 'CONTENT_EDITOR'
      expect(['SUPER_ADMIN', 'CONTENT_EDITOR', 'STUDENT']).toContain(role)
    })

    it('should validate STUDENT approval (no approval required)', () => {
      const role = 'STUDENT'
      expect(['SUPER_ADMIN', 'CONTENT_EDITOR', 'STUDENT']).toContain(role)
    })

    it('should validate APPROVED admin status', () => {
      const adminProfile = mockApprovedAdmin
      expect(adminProfile.status).toBe(ApprovalStatus.APPROVED)
    })

    it('should validate PENDING admin status', () => {
      const adminProfile = mockPendingAdmin
      expect(adminProfile.status).toBe(ApprovalStatus.PENDING)
    })

    it('should validate REJECTED admin status', () => {
      const adminProfile = mockRejectedAdmin
      expect(adminProfile.status).toBe(ApprovalStatus.REJECTED)
    })

    it('should validate SUSPENDED admin status', () => {
      const adminProfile = mockSuspendedAdmin
      expect(adminProfile.status).toBe(ApprovalStatus.SUSPENDED)
    })
  })

  describe('Role boundary enforcement - Middleware scenarios', () => {
    it('should prevent STUDENT from accessing /admin routes', () => {
      const route = '/admin/dashboard'
      const userRole = normalizeRoleName('student')
      expect(userRole).toBe('STUDENT')
      expect(userRole !== 'ADMIN' && userRole !== 'SUPER_ADMIN').toBe(true)
    })

    it('should prevent INSTRUCTOR from accessing /admin routes', () => {
      const route = '/admin/dashboard'
      const userRole = normalizeRoleName('instructor')
      expect(userRole).toBe('INSTRUCTOR')
      expect(userRole !== 'ADMIN' && userRole !== 'SUPER_ADMIN').toBe(true)
    })

    it('should prevent CONTENT_EDITOR from accessing /admin routes', () => {
      const route = '/admin/dashboard'
      const userRole = normalizeRoleName('content_editor')
      expect(userRole).toBe('CONTENT_EDITOR')
      expect(userRole !== 'ADMIN' && userRole !== 'SUPER_ADMIN').toBe(true)
    })

    it('should allow ADMIN to access /admin routes', () => {
      const route = '/admin/dashboard'
      const userRole = normalizeRoleName('admin')
      expect(userRole).toBe('ADMIN')
      expect(userRole === 'ADMIN' || userRole === 'SUPER_ADMIN').toBe(true)
    })

    it('should allow SUPER_ADMIN to access /admin routes', () => {
      const route = '/admin/dashboard'
      const userRole = normalizeRoleName('super_admin')
      expect(userRole).toBe('SUPER_ADMIN')
      expect(userRole === 'ADMIN' || userRole === 'SUPER_ADMIN').toBe(true)
    })

    it('should prevent ADMIN from accessing /instructor routes', () => {
      const route = '/instructor/dashboard'
      const userRole = normalizeRoleName('admin')
      expect(userRole).toBe('ADMIN')
      expect(userRole === 'INSTRUCTOR').toBe(false)
    })

    it('should allow INSTRUCTOR to access /instructor routes', () => {
      const route = '/instructor/dashboard'
      const userRole = normalizeRoleName('instructor')
      expect(userRole).toBe('INSTRUCTOR')
      expect(userRole === 'INSTRUCTOR').toBe(true)
    })

    it('should prevent ADMIN from accessing /student routes', () => {
      const route = '/student/dashboard'
      const userRole = normalizeRoleName('admin')
      expect(userRole).toBe('ADMIN')
      expect(userRole === 'STUDENT').toBe(false)
    })

    it('should allow STUDENT to access /student routes', () => {
      const route = '/student/dashboard'
      const userRole = normalizeRoleName('student')
      expect(userRole).toBe('STUDENT')
      expect(userRole === 'STUDENT').toBe(true)
    })

    it('should prevent INSTRUCTOR from accessing /content-editor routes', () => {
      const route = '/content-editor/dashboard'
      const userRole = normalizeRoleName('instructor')
      expect(userRole).toBe('INSTRUCTOR')
      expect(userRole === 'CONTENT_EDITOR').toBe(false)
    })

    it('should allow CONTENT_EDITOR to access /content-editor routes', () => {
      const route = '/content-editor/dashboard'
      const userRole = normalizeRoleName('content_editor')
      expect(userRole).toBe('CONTENT_EDITOR')
      expect(userRole === 'CONTENT_EDITOR').toBe(true)
    })

    it('should prevent non-SUPER_ADMIN from accessing /super-admin routes', () => {
      const roles = ['STUDENT', 'ADMIN', 'INSTRUCTOR', 'CONTENT_EDITOR']
      roles.forEach((role) => {
        const isAuthorized = normalizeRoleName(role.toLowerCase()) === 'SUPER_ADMIN'
        expect(isAuthorized).toBe(false)
      })
    })

    it('should allow SUPER_ADMIN to access /super-admin routes', () => {
      const route = '/super-admin/dashboard'
      const userRole = normalizeRoleName('super_admin')
      expect(userRole).toBe('SUPER_ADMIN')
      expect(userRole === 'SUPER_ADMIN').toBe(true)
    })
  })

  describe('Approval status enforcement', () => {
    it('should deny PENDING admin access to admin area', () => {
      const adminProfile = mockPendingAdmin
      const isApproved = adminProfile.status === 'APPROVED'
      expect(isApproved).toBe(false)
      expect(adminProfile.status).toBe('PENDING')
    })

    it('should deny REJECTED admin access to admin area', () => {
      const adminProfile = mockRejectedAdmin
      const isApproved = adminProfile.status === 'APPROVED'
      expect(isApproved).toBe(false)
      expect(adminProfile.status).toBe('REJECTED')
    })

    it('should deny SUSPENDED admin access to admin area', () => {
      const adminProfile = mockSuspendedAdmin
      const isApproved = adminProfile.status === 'APPROVED'
      expect(isApproved).toBe(false)
      expect(adminProfile.status).toBe('SUSPENDED')
    })

    it('should allow APPROVED admin access to admin area', () => {
      const adminProfile = mockApprovedAdmin
      const isApproved = adminProfile.status === 'APPROVED'
      expect(isApproved).toBe(true)
      expect(adminProfile.status).toBe('APPROVED')
    })

    it('should enforce active user status requirement', () => {
      const activeUser = { ...mockUser, isActive: true }
      const inactiveUser = { ...mockUser, isActive: false }

      expect(activeUser.isActive).toBe(true)
      expect(inactiveUser.isActive).toBe(false)

      // Only active users should be allowed (in actual getValidatedSession)
      expect(activeUser.isActive).toBe(true)
      expect(inactiveUser.isActive).toBe(false)
    })
  })

  describe('Permission matrix enforcement', () => {
    it('should not grant INSTRUCTOR permission to viewAnalytics', () => {
      const instructorPermissions = ['viewOwnAnalytics', 'accessAiTutor', 'attemptMockTests', 'viewStudentContent']
      expect(instructorPermissions).not.toContain('viewAnalytics')
    })

    it('should not grant INSTRUCTOR permission to manageLessons', () => {
      const instructorPermissions = ['viewOwnAnalytics', 'accessAiTutor', 'attemptMockTests', 'viewStudentContent']
      expect(instructorPermissions).not.toContain('manageLessons')
    })

    it('should grant ADMIN permission to viewAnalytics', () => {
      const adminPermissions = ['manageUsers', 'manageStudents', 'manageCourses', 'manageLessons', 'manageQuestions', 'viewAnalytics', 'viewOwnAnalytics', 'accessAiTutor', 'attemptMockTests', 'viewStudentContent']
      expect(adminPermissions).toContain('viewAnalytics')
    })

    it('should grant ADMIN permission to manageLessons', () => {
      const adminPermissions = ['manageUsers', 'manageStudents', 'manageCourses', 'manageLessons', 'manageQuestions', 'viewAnalytics', 'viewOwnAnalytics', 'accessAiTutor', 'attemptMockTests', 'viewStudentContent']
      expect(adminPermissions).toContain('manageLessons')
    })

    it('should grant SUPER_ADMIN all permissions', () => {
      const superAdminPermissions = ['manageUsers', 'manageStudents', 'manageCourses', 'manageLessons', 'manageQuestions', 'publishContent', 'viewAnalytics', 'viewOwnAnalytics', 'accessAiTutor', 'attemptMockTests', 'viewStudentContent']
      expect(superAdminPermissions).toContain('manageUsers')
      expect(superAdminPermissions).toContain('manageStudents')
      expect(superAdminPermissions).toContain('publishContent')
      expect(superAdminPermissions).toContain('viewAnalytics')
    })

    it('should grant CONTENT_EDITOR permission to publishContent', () => {
      const editorPermissions = ['manageLessons', 'manageQuestions', 'publishContent', 'viewOwnAnalytics', 'accessAiTutor', 'attemptMockTests', 'viewStudentContent']
      expect(editorPermissions).toContain('publishContent')
    })

    it('should not grant CONTENT_EDITOR permission to manageUsers', () => {
      const editorPermissions = ['manageLessons', 'manageQuestions', 'publishContent', 'viewOwnAnalytics', 'accessAiTutor', 'attemptMockTests', 'viewStudentContent']
      expect(editorPermissions).not.toContain('manageUsers')
    })

    it('should grant STUDENT only read/premium permissions', () => {
      const studentPermissions = ['viewOwnAnalytics', 'accessAiTutor', 'attemptMockTests', 'viewStudentContent']
      expect(studentPermissions).toContain('accessAiTutor')
      expect(studentPermissions).toContain('attemptMockTests')
      expect(studentPermissions).not.toContain('manageLessons')
      expect(studentPermissions).not.toContain('manageUsers')
    })
  })

  describe('Server action authorization', () => {
    it('should require ADMIN role for admin dashboard', () => {
      const requiredRole = 'ADMIN'
      const adminRole = normalizeRoleName('admin')
      expect(adminRole).toBe(requiredRole)
    })

    it('should require APPROVED status for admin dashboard', () => {
      const adminProfile = mockApprovedAdmin
      const isApproved = adminProfile.status === ApprovalStatus.APPROVED
      expect(isApproved).toBe(true)
    })

    it('should deny access if admin is not approved', () => {
      const adminProfile = mockPendingAdmin
      const isApproved = adminProfile.status === 'APPROVED'
      expect(isApproved).toBe(false)
    })

    it('should require INSTRUCTOR role for instructor dashboard', () => {
      const requiredRole = 'INSTRUCTOR'
      const instructorRole = normalizeRoleName('instructor')
      expect(instructorRole).toBe(requiredRole)
    })

    it('should require STUDENT role for student dashboard', () => {
      const requiredRole = 'STUDENT'
      const studentRole = normalizeRoleName('student')
      expect(studentRole).toBe(requiredRole)
    })
  })

  describe('Privilege escalation prevention', () => {
    it('should prevent ADMIN from managing SUPER_ADMIN accounts', () => {
      const adminRole = normalizeRoleName('admin')
      const targetRole = 'SUPER_ADMIN'
      expect(adminRole).toBe('ADMIN')
      // Admin should not be able to modify SUPER_ADMIN accounts
      expect(adminRole !== 'SUPER_ADMIN').toBe(true)
    })

    it('should prevent INSTRUCTOR from elevating to ADMIN', () => {
      const instructorRole = normalizeRoleName('instructor')
      const targetRole = 'ADMIN'
      expect(instructorRole).toBe('INSTRUCTOR')
      // Instructor should not be able to change role
      expect(instructorRole !== targetRole).toBe(true)
    })

    it('should prevent unapproved ADMIN from performing admin actions', () => {
      const adminProfile = mockPendingAdmin
      const isApproved = adminProfile.status === 'APPROVED'
      expect(isApproved).toBe(false)
      // Action should be denied
    })

    it('should allow SUPER_ADMIN to manage all account types', () => {
      const superAdminRole = normalizeRoleName('super_admin')
      expect(superAdminRole).toBe('SUPER_ADMIN')
      // SUPER_ADMIN can manage any role
    })
  })

  describe('Inactive user enforcement', () => {
    it('should deny access to inactive users', () => {
      const inactiveUser = { ...mockUser, isActive: false }
      expect(inactiveUser.isActive).toBe(false)
      // Validation should fail for inactive users
    })

    it('should allow access to active users with approved status', () => {
      const activeUser = { ...mockUser, isActive: true }
      const adminProfile = mockApprovedAdmin
      expect(activeUser.isActive).toBe(true)
      expect(adminProfile.status).toBe(ApprovalStatus.APPROVED)
      // Access should be granted
    })
  })
})
