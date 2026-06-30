import { calculateProgramProgress, getLastIncompleteLesson } from '../progressUtils';
import type { StudentProgress } from '@/src/services/studentProgressService';
import type { Module, Lesson, Topic } from '@/src/types';

function makeTopic(id: string): Topic {
  return { id, title: `Topic ${id}` };
}

function makeLesson(id: string, topicCount: number, overrides?: Partial<Lesson>): Lesson {
  return {
    id,
    title: `Lesson ${id}`,
    topics: Array.from({ length: topicCount }, (_, i) => makeTopic(`${id}-t${i}`)),
    ...overrides,
  };
}

function makeModule(id: string, lessons: Lesson[]): Module {
  return {
    id,
    title: `Module ${id}`,
    description: `Module ${id} description`,
    lessons,
  };
}

describe('calculateProgramProgress', () => {
  it('returns 0 when progress record is null', () => {
    const curriculum = [makeModule('m1', [makeLesson('l1', 2)])];
    expect(calculateProgramProgress(null, curriculum)).toBe(0);
  });

  it('returns 0 when curriculum is empty', () => {
    const record: StudentProgress = {
      userId: 'u1',
      programId: 'p1',
      lessons: {},
    };
    expect(calculateProgramProgress(record, [])).toBe(0);
  });

  it('returns 100 when all topics and quizzes are completed', () => {
    const curriculum = [
      makeModule('m1', [
        makeLesson('l1', 2, {
          quiz: { question: 'Q1?', options: ['A', 'B'], correctIndex: 0 },
        }),
        makeLesson('l2', 1),
      ]),
    ];

    const record: StudentProgress = {
      userId: 'u1',
      programId: 'p1',
      lessons: {
        l1: {
          completedTopics: ['l1-t0', 'l1-t1'],
          quizCompleted: true,
        },
        l2: {
          completedTopics: ['l2-t0'],
        },
      },
    };

    // 2 topics + 1 quiz + 1 topic = 4 total points, all completed
    expect(calculateProgramProgress(record, curriculum)).toBe(100);
  });

  it('calculates partial progress correctly', () => {
    const curriculum = [
      makeModule('m1', [
        makeLesson('l1', 2),
        makeLesson('l2', 2),
      ]),
    ];

    const record: StudentProgress = {
      userId: 'u1',
      programId: 'p1',
      lessons: {
        l1: {
          completedTopics: ['l1-t0'],
        },
      },
    };

    // 4 total topics, 1 completed = 25%
    expect(calculateProgramProgress(record, curriculum)).toBe(25);
  });

  it('ignores completedTopics not matching any curriculum topic', () => {
    const curriculum = [
      makeModule('m1', [
        makeLesson('l1', 1),
      ]),
    ];

    const record: StudentProgress = {
      userId: 'u1',
      programId: 'p1',
      lessons: {
        l1: {
          completedTopics: ['l1-t0', 'nonexistent-topic'],
        },
      },
    };

    expect(calculateProgramProgress(record, curriculum)).toBe(100);
  });

  it('handles assignment completion', () => {
    const curriculum = [
      makeModule('m1', [
        makeLesson('l1', 1, {
          assignment: { title: 'A1', description: 'Do it' },
        }),
      ]),
    ];

    const record: StudentProgress = {
      userId: 'u1',
      programId: 'p1',
      lessons: {
        l1: {
          completedTopics: ['l1-t0'],
          assignmentSubmitted: true,
        },
      },
    };

    // 1 topic + 1 assignment = 2 total, both completed
    expect(calculateProgramProgress(record, curriculum)).toBe(100);
  });
});

describe('getLastIncompleteLesson', () => {
  const curriculum = [
    makeModule('m1', [
      makeLesson('l1', 1),
      makeLesson('l2', 1),
    ]),
    makeModule('m2', [
      makeLesson('l3', 1),
    ]),
  ];

  it('returns first lesson when no progress record', () => {
    expect(getLastIncompleteLesson(null, curriculum)).toEqual({
      moduleId: 'm1',
      lessonId: 'l1',
    });
  });

  it('returns first incomplete lesson', () => {
    const record: StudentProgress = {
      userId: 'u1',
      programId: 'p1',
      lessons: {
        l1: {
          completedTopics: ['l1-t0'],
          completedAt: '2024-01-01T00:00:00Z',
        },
      },
    };

    expect(getLastIncompleteLesson(record, curriculum)).toEqual({
      moduleId: 'm1',
      lessonId: 'l2',
    });
  });

  it('returns null when all lessons are completed', () => {
    const record: StudentProgress = {
      userId: 'u1',
      programId: 'p1',
      lessons: {
        l1: {
          completedTopics: ['l1-t0'],
          completedAt: '2024-01-01T00:00:00Z',
        },
        l2: {
          completedTopics: ['l2-t0'],
          completedAt: '2024-01-02T00:00:00Z',
        },
        l3: {
          completedTopics: ['l3-t0'],
          completedAt: '2024-01-03T00:00:00Z',
        },
      },
    };

    expect(getLastIncompleteLesson(record, curriculum)).toBeNull();
  });
});
