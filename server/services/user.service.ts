import { userRepository } from '@/server/repositories/user.repository'

type UserRole = 'STUDENT' | 'ADMIN' | 'INSTRUCTOR'

/**
 * UserService
 * Handles user-related database operations
 */

export async function getUserByEmail(email: string) {
  return userRepository.findByEmail(email)
}

export async function getUserById(id: string) {
  return userRepository.findById(id)
}

export async function getStudentProfile(userId: string) {
  return userRepository.findStudentProfile(userId)
}

export async function getAdminProfile(userId: string) {
  return userRepository.findAdminProfile(userId)
}

export async function getUsersByRole(role: UserRole) {
  return userRepository.findByRole(role)
}

export async function getUserCountByRole(role: UserRole): Promise<number> {
  if (role === 'STUDENT') return userRepository.countStudents()
  if (role === 'ADMIN') return userRepository.countAdmins()
  return 0
}
