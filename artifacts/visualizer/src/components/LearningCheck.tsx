import { useState } from "react";
import type { LearningExercise } from "@/data/content/content-types";

export function LearningCheck({ exercises }: { exercises: LearningExercise[] }) {
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [revealed, setRevealed] = useState<Record<number, boolean>>({});
  return (
    <section className="space-y-4" aria-label="학습 확인" data-testid="learning-check">
      <h2 className="text-xl font-semibold border-b border-border pb-2">학습 확인</h2>
      {exercises.map((exercise, index) => {
        const selected = answers[index];
        const checked = revealed[index] === true;
        return (
          <fieldset key={index} className="rounded-xl border border-border bg-card p-4 space-y-3">
            <legend className="font-semibold px-1">문제 {index + 1}</legend>
            <p className="text-sm">{exercise.question}</p>
            <div className="grid gap-2">
              {exercise.options.map((option, optionIndex) => (
                <label key={optionIndex} className="flex items-center gap-2 rounded-lg border border-border p-2 text-sm cursor-pointer hover:bg-muted/50">
                  <input type="radio" name={`exercise-${index}`} checked={selected === optionIndex} onChange={() => { setAnswers(prev => ({ ...prev, [index]: optionIndex })); setRevealed(prev => ({ ...prev, [index]: false })); }} />
                  <span>{option}</span>
                </label>
              ))}
            </div>
            <div className="flex gap-2">
              <button type="button" disabled={selected === undefined || checked} onClick={() => setRevealed(prev => ({ ...prev, [index]: true }))} className="rounded-lg border border-border bg-primary px-3 py-2 text-sm text-primary-foreground disabled:opacity-50">정답 확인</button>
              <button type="button" onClick={() => { setAnswers(prev => { const next = { ...prev }; delete next[index]; return next; }); setRevealed(prev => ({ ...prev, [index]: false })); }} className="rounded-lg border border-border px-3 py-2 text-sm">다시 풀기</button>
            </div>
            {checked && <p role="status" className="text-sm rounded-lg bg-muted p-3"><strong>{selected === exercise.answerIndex ? "정답입니다." : "오답입니다."}</strong> {exercise.explanation}</p>}
          </fieldset>
        );
      })}
    </section>
  );
}
