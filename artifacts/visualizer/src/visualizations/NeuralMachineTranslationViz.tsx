import { useMemo, useState } from "react";
import WorkflowFocusedViz, {
  type WorkflowTopologyCanvasProps,
} from "./WorkflowFocusedViz";
import TranslationScene from "./TranslationScene";
import {
  translationExamples,
  translationSpec,
  type TranslationDirection,
} from "./translation-model";

export default function NeuralMachineTranslationViz() {
  const [direction, setDirection] = useState<TranslationDirection>("ko-en");
  const example = translationExamples[direction];
  const spec = useMemo(() => translationSpec(example), [example]);
  const Canvas = useMemo(
    () =>
      function Canvas(props: WorkflowTopologyCanvasProps) {
        return <TranslationScene {...props} example={example} />;
      },
    [example],
  );
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div
          role="group"
          aria-label="번역 방향"
          className="flex gap-1 rounded-lg border border-border bg-background p-1"
        >
          {(Object.keys(translationExamples) as TranslationDirection[]).map(
            (value) => (
              <button
                key={value}
                type="button"
                aria-pressed={direction === value}
                onClick={() => setDirection(value)}
                className={`rounded-md px-3 py-2 text-xs font-semibold ${direction === value ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted"}`}
              >
                {translationExamples[value].label}
              </button>
            ),
          )}
        </div>
        <span className="text-xs text-muted-foreground">
          교육용 예제 · 실제 번역 API 호출 없음
        </span>
      </div>
      <WorkflowFocusedViz key={direction} spec={spec} TopologyCanvas={Canvas} />
    </div>
  );
}
