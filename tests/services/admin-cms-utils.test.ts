import { describe, expect, it } from 'vitest';
import { buildDeleteConfirmationMessage, filterLessons, filterMockTests, getNextStatus, validateLessonForm, validateMockTestForm } from '@/services/admin/cms-utils';
import type { AdminLesson, AdminMockTest } from '@/types/admin';

const lessons: AdminLesson[] = [
  {
    id: 'lesson-1',
    title: 'Corrosion Basics',
    content: 'Corrosion overview',
    objectives: ['Explain corrosion'],
    keyPoints: ['Preventive steps'],
    resources: ['Slides'],
    attachments: ['guide.pdf'],
    status: 'Published',
    order: 1,
    moduleId: 'm1',
    module: 'Aircraft Materials',
    updatedAt: '2026-07-29',
  },
  {
    id: 'lesson-2',
    title: 'Hydraulic Review',
    content: '',
    objectives: [],
    keyPoints: [],
    resources: [],
    attachments: [],
    status: 'Draft',
    order: 2,
    moduleId: 'm2',
    module: 'Hydraulic Systems',
    updatedAt: '2026-07-28',
  },
];

const mockTests: AdminMockTest[] = [
  {
    id: 'test-1',
    title: 'Airframes Practice',
    durationMinutes: 45,
    passingPercentage: 70,
    questionCount: 20,
    randomized: true,
    status: 'Published',
    updatedAt: '2026-07-29',
  },
  {
    id: 'test-2',
    title: 'Systems Mock',
    durationMinutes: 60,
    passingPercentage: 80,
    questionCount: 25,
    randomized: false,
    status: 'Draft',
    updatedAt: '2026-07-28',
  },
];

describe('admin cms utils', () => {
  it('validates lesson required fields and duplicate titles', () => {
    const errors = validateLessonForm({ title: 'Corrosion Basics', content: '', objectives: [], moduleId: '' }, lessons, 'lesson-3');
    expect(errors).toContain('Lesson content is required.');
    expect(errors).toContain('Lesson title already exists.');
    expect(errors).toContain('Lesson must be assigned to a module.');
  });

  it('validates mock test numeric ranges and publish requirements', () => {
    const errors = validateMockTestForm({ title: 'Systems Mock', durationMinutes: 0, passingPercentage: 120, questionCount: 0, status: 'Published' }, mockTests, 'test-1');
    expect(errors).toContain('Duration must be greater than zero.');
    expect(errors).toContain('Passing percentage must be between 1 and 100.');
    expect(errors).toContain('Published mock tests need at least one question.');
  });

  it('filters and sorts lessons', () => {
    const results = filterLessons(lessons, 'hydraulic', 'Hydraulic Systems', 'title');
    expect(results).toHaveLength(1);
    expect(results[0].title).toBe('Hydraulic Review');
  });

  it('filters and sorts mock tests', () => {
    const results = filterMockTests(mockTests, 'systems', 'Draft', 'title');
    expect(results).toHaveLength(1);
    expect(results[0].title).toBe('Systems Mock');
  });

  it('toggles publish state for the workflow', () => {
    expect(getNextStatus('Published')).toBe('Draft');
    expect(getNextStatus('Draft')).toBe('Published');
  });

  it('builds delete confirmation copy', () => {
    expect(buildDeleteConfirmationMessage('Corrosion Basics')).toContain('Corrosion Basics');
  });
});
