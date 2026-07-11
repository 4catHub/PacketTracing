export type Category = 'workflow' | 'algorithm';

export interface ComplexityInfo {
  best: string;
  avg: string;
  worst: string;
  space: string;
  stable?: boolean;
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
}
