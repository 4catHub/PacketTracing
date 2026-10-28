export type Category = 'workflow' | 'attack' | 'algorithm';

export interface ComplexityInfo {
  best: string;
  avg: string;
  worst: string;
  space: string;
  stable?: boolean;
}

export interface RelatedItem {
  slug: string;
  category: Category;
  relation?: string;
}

export interface LearningExercise {
  question: string;
  options: string[];
  answerIndex: number;
  explanation: string;
}

export interface ContentItem {
  slug: string;
  category: Category;
  title: string;
  subtitle: string;
  tags: string[];
  description: string;
  steps?: string[];
  examples: string[];
  complexity?: ComplexityInfo;
  related?: RelatedItem[];
  learningObjectives?: string[];
  exercises?: LearningExercise[];
  commonMistakes?: string[];
  keyTakeaways?: string[];
}

