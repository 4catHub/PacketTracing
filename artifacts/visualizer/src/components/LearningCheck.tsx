import { useState } from "react";
import type { LearningExercise } from "@/data/content/content-types";

export function LearningCheck({ exercises }: { exercises: LearningExercise[] }) {
  const [answers, setAnswers] = useState<Record<number, number>>({});
  return (
    <section className="space-y-4" aria-label="학습 확인" data-testid="learning-check">
      <h2 className="text-xl font-semibold border-b border-border pb-2">학습 확인</h2>
      {exercises.map((exercise, index) => {
        const selected = answers[index];
        return (
          <fieldset key={index} className="rounded-xl border border-border bg-card p-4 space-y-3">
            <legend className="font-semibold px-1">문제 {index + 1}</legend>
            <p className="text-sm">{exercise.question}</p>
            <div className="grid gap-2">
              {exercise.options.map((option, optionIndex) => (
                <label key={optionIndex} className="flex items-center gap-2 rounded-lg border border-border p-2 text-sm cursor-pointer hover:bg-muted/50">
                  <input type="radio" name={`exercise-${index}`} checked={selected === optionIndex} onChange={() => setAnswers((prev) => ({ ...prev, [index]: optionIndex }))} />
                  <span>{option}</span>
                </label>
              ))}
            </div>
            {selected !== undefined && (
              <p role="status" className="text-sm rounded-lg bg-muted p-3">
                <strong>{selected === exercise.answerIndex ? "정답입니다." : "다시 확인해 보세요."}</strong> {exercise.explanation}
              </p>
            )}
          </fieldset>
        );
      })}
    </section>
  );
}
