import type { AdminCourse, AdminLesson, AdminModule, AdminMockTest, AdminQuestion, AdminPromptTemplate, AdminAnnouncement } from '@/types/admin';

export function validateCourse(input: Partial<AdminCourse>) {
  const errors: string[] = [];
  if (!input.title?.trim()) errors.push('Course title is required.');
  if (!input.slug?.trim()) errors.push('Course slug is required.');
  if (!input.description?.trim()) errors.push('Course description is required.');
  return errors;
}

export function validateModule(input: Partial<AdminModule>) {
  const errors: string[] = [];
  if (!input.title?.trim()) errors.push('Module title is required.');
  if (!input.duration?.trim()) errors.push('Duration is required.');
  return errors;
}

export function validateLesson(input: Partial<AdminLesson>) {
  const errors: string[] = [];
  if (!input.title?.trim()) errors.push('Lesson title is required.');
  if (!input.content?.trim()) errors.push('Lesson content is required.');
  return errors;
}

export function validateQuestion(input: Partial<AdminQuestion>) {
  const errors: string[] = [];
  if (!input.prompt?.trim()) errors.push('Question prompt is required.');
  if (!input.topic?.trim()) errors.push('Topic is required.');
  return errors;
}

export function validateMockTest(input: Partial<AdminMockTest>) {
  const errors: string[] = [];
  if (!input.title?.trim()) errors.push('Mock test title is required.');
  if (!input.durationMinutes || input.durationMinutes <= 0) errors.push('Duration must be greater than zero.');
  return errors;
}

export function validatePrompt(input: Partial<AdminPromptTemplate>) {
  const errors: string[] = [];
  if (!input.title?.trim()) errors.push('Prompt title is required.');
  if (!input.content?.trim()) errors.push('Prompt content is required.');
  return errors;
}

export function validateAnnouncement(input: Partial<AdminAnnouncement>) {
  const errors: string[] = [];
  if (!input.title?.trim()) errors.push('Announcement title is required.');
  if (!input.body?.trim()) errors.push('Announcement body is required.');
  return errors;
}
