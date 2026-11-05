import type { LearningExercise } from "../data/content/content-types";

/** Deterministic ordering prevents SSG hydration mismatches while varying answer positions. */
export function presentLearningExercise(exercise: LearningExercise, seed: string): {
  options: string[];
  answerIndex: number;
} {
  const n = exercise.options.length;
  if (n < 2) return { options: [...exercise.options], answerIndex: exercise.answerIndex };
  let hash = 2166136261;
  const input = seed + ":" + exercise.question;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  const shift = (hash >>> 0) % n;
  return {
    options: Array.from({ length: n }, (_, i) => exercise.options[(i + n - shift) % n]),
    answerIndex: (exercise.answerIndex + shift) % n,
  };
}
