import type { User, Student, Admin, Instructor, Role, Permission, AuditLog, Notification, Session } from "@/types/domain/identity";

export interface IdentityRepository {
  getUser(id: string): Promise<User | null>;
  getStudent(userId: string): Promise<Student | null>;
  getAdmin(userId: string): Promise<Admin | null>;
  getInstructor(userId: string): Promise<Instructor | null>;
  getRoles(): Promise<Role[]>;
  getPermissions(): Promise<Permission[]>;
  getAuditLogs(userId: string): Promise<AuditLog[]>;
  getNotifications(userId: string): Promise<Notification[]>;
  getSessions(userId: string): Promise<Session[]>;
}
