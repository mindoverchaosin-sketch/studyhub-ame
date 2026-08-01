import type { AdminLesson, AdminMockTest } from '@/types/admin';

export type LessonSortKey = 'title' | 'status' | 'updatedAt';
export type MockTestSortKey = 'title' | 'status' | 'updatedAt';

export function validateLessonForm(input: Partial<AdminLesson>, existingLessons: AdminLesson[], currentId?: string) {
  const errors: string[] = [];

  if (!input.title?.trim()) {
    errors.push('Lesson title is required.');
  } else if (existingLessons.some((lesson) => lesson.id !== currentId && lesson.title.toLowerCase() === input.title!.trim().toLowerCase())) {
    errors.push('Lesson title already exists.');
  }

  if (!input.content?.trim()) {
    errors.push('Lesson content is required.');
  }

  if (!input.moduleId && !input.module) {
    errors.push('Lesson must be assigned to a module.');
  }

  if (!input.objectives || input.objectives.filter(Boolean).length === 0) {
    errors.push('At least one learning objective is required.');
  }

  return errors;
}

export function validateMockTestForm(input: Partial<AdminMockTest>, existingTests: AdminMockTest[], currentId?: string) {
  const errors: string[] = [];

  if (!input.title?.trim()) {
    errors.push('Mock test title is required.');
  } else if (existingTests.some((test) => test.id !== currentId && test.title.toLowerCase() === input.title!.trim().toLowerCase())) {
    errors.push('Mock test title already exists.');
  }

  if (!input.durationMinutes || input.durationMinutes <= 0) {
    errors.push('Duration must be greater than zero.');
  }

  if (typeof input.passingPercentage === 'number' && (input.passingPercentage < 1 || input.passingPercentage > 100)) {
    errors.push('Passing percentage must be between 1 and 100.');
  }

  if (input.status === 'Published' && (!input.questionCount || input.questionCount <= 0)) {
    errors.push('Published mock tests need at least one question.');
  }

  return errors;
}

export function filterLessons(items: AdminLesson[], query: string, module: string, sortKey: LessonSortKey) {
  const normalizedQuery = query.trim().toLowerCase();
  const filtered = items.filter((lesson) => {
    const matchesQuery = !normalizedQuery || `${lesson.title} ${lesson.content}`.toLowerCase().includes(normalizedQuery);
    const matchesModule = !module || module === 'All modules' || lesson.module === module;
    return matchesQuery && matchesModule;
  });

  return filtered.sort((left, right) => {
    if (sortKey === 'status') {
      return left.status.localeCompare(right.status);
    }

    if (sortKey === 'updatedAt') {
      return (right.updatedAt || '').localeCompare(left.updatedAt || '');
    }

    return left.title.localeCompare(right.title);
  });
}

export function filterMockTests(items: AdminMockTest[], query: string, status: string, sortKey: MockTestSortKey) {
  const normalizedQuery = query.trim().toLowerCase();
  const filtered = items.filter((test) => {
    const matchesQuery = !normalizedQuery || test.title.toLowerCase().includes(normalizedQuery);
    const matchesStatus = !status || status === 'All statuses' || test.status === status;
    return matchesQuery && matchesStatus;
  });

  return filtered.sort((left, right) => {
    if (sortKey === 'status') {
      return left.status.localeCompare(right.status);
    }

    if (sortKey === 'updatedAt') {
      return (right.updatedAt || '').localeCompare(left.updatedAt || '');
    }

    return left.title.localeCompare(right.title);
  });
}

export function getNextStatus(currentStatus: string) {
  return currentStatus === 'Published' ? 'Draft' : 'Published';
}

export function buildDeleteConfirmationMessage(itemName: string) {
  return `Delete ${itemName}? This action cannot be undone.`;
}
