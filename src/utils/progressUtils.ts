import { StudentProgress } from '../services/studentProgressService';
import { Module } from '../types';

export const calculateProgramProgress = (record: StudentProgress | null, curriculum: Module[]): number => {
  if (!record) return 0;
  
  let totalPoints = 0;
  let completedPoints = 0;

  for (const mod of curriculum) {
    for (const les of mod.lessons) {
      // Points: topics
      totalPoints += les.topics.length;
      const lessonProgress = record.lessons[les.id];
      if (lessonProgress) {
        completedPoints += lessonProgress.completedTopics.filter(tId => 
          les.topics.some(t => t.id === tId)
        ).length;
      }

      // Points: Quiz (if exists)
      if (les.quiz) {
        totalPoints += 1;
        if (lessonProgress?.quizCompleted) {
          completedPoints += 1;
        }
      }

      // Points: Assignment (if exists)
      if (les.assignment) {
        totalPoints += 1;
        if (lessonProgress?.assignmentSubmitted) {
          completedPoints += 1;
        }
      }
    }
  }

  if (totalPoints === 0) return 0;
  return Math.round((completedPoints / totalPoints) * 100);
};

export const getLastIncompleteLesson = (record: StudentProgress | null, curriculum: Module[]): { moduleId: string; lessonId: string } | null => {
  if (!record) return { moduleId: curriculum[0]?.id || '', lessonId: curriculum[0]?.lessons[0]?.id || '' };

  for (const mod of curriculum) {
    for (const les of mod.lessons) {
      const lp = record.lessons[les.id];
      const isLessonCompleted = lp && lp.completedAt;
      if (!isLessonCompleted) {
        return { moduleId: mod.id, lessonId: les.id };
      }
    }
  }

  return null;
};
