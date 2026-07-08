import { supabase } from '../lib/supabase';
import { Module } from '../types';

// Fallback curriculum used when DB has no curriculum data for a program
function getFallbackCurriculum(programId: string): Module[] {
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
}

// Fetch curriculum from DB; fall back to hardcoded data if none is stored
export const getProgramCurriculum = async (programId: string): Promise<Module[]> => {
  try {
    const { data, error } = await supabase
      .from('programs')
      .select('curriculum')
      .eq('id', programId)
      .maybeSingle();

    if (error) throw error;

    if (data?.curriculum && Array.isArray(data.curriculum) && data.curriculum.length > 0) {
      return data.curriculum as Module[];
    }
  } catch {
    // Silently fall through to fallback
  }

  return getFallbackCurriculum(programId);
};
