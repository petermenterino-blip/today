import { Module } from '../types';

// Simplified curriculum - this will eventually be fetched from the backend API
export const getProgramCurriculum = (programId: string): Module[] => {
  return [
    {
      id: `m-${programId}-1`,
      title: 'Module 1: Fundamental Concepts',
      description: 'Core theories and operational concepts for success in this domain.',
      lessons: [
        {
          id: `l-${programId}-1-1`,
          title: 'Lesson 1.1: Introduction and Scope',
          videoUrl: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
          duration: '09:30',
          topics: [
            { id: `tf-${programId}-1`, title: 'Domain context and historical overview' },
            { id: `tf-${programId}-2`, title: 'Critical vocabulary and paradigms' }
          ],
          quiz: {
            question: 'What is the primary objective of this introductory module?',
            options: [
              'To provide a foundational layout and common vocabulary',
              'To test advanced engineering tools',
              'To evaluate financial constraints',
              'To complete terminal assignments'
            ],
            correctIndex: 0
          }
        }
      ]
    }
  ];
};
