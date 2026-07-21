import type { Enrollment } from "@/types/domain/learning";

export interface EnrollmentService {
  enrollUser(userId: string, courseId: string): Promise<Enrollment>;
  getEnrollment(userId: string, courseId: string): Promise<Enrollment | null>;
  cancelEnrollment(enrollmentId: string): Promise<void>;
}
