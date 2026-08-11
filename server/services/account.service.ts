import { userRepository } from '@/server/repositories/user.repository'

export async function getStudentAccountData(userId: string) {
  return userRepository.findStudentDetail(userId)
}
