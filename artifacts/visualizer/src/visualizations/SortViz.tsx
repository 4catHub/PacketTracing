import { useState, useEffect, useCallback, useMemo } from "react";
import { Play, Pause, RotateCcw, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";

export interface SortStep {
  array: number[];
  comparing: number[];
  swapping: number[];
  sorted: number[];
  label: string;
}

export interface ComplexityInfo {
  best: string;
  avg: string;
  worst: string;
  space: string;
  stable: boolean;
}

interface Props {
  algorithmName: string;
  complexity: ComplexityInfo;
  generateSteps: (arr: number[]) => SortStep[];
}

export const DEFAULT_ARRAY = [14, 3, 10, 6, 17, 1, 12, 8, 15, 4, 11, 7, 16, 2, 9, 13, 5];

function sliderToMs(v: number): number {
  const MAX = 700;
  const MIN = 15;
  return Math.round(MAX - (v / 100) * (MAX - MIN));
}

export default function SortViz({ algorithmName, complexity, generateSteps }: Props) {
  const steps = useMemo(() => generateSteps([...DEFAULT_ARRAY]), [generateSteps]);

  const [stepIdx, setStepIdx] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(60);

  const isDone = stepIdx >= steps.length - 1;
  const currentStep: SortStep =
    stepIdx >= 0
      ? steps[stepIdx]
      : { array: [...DEFAULT_ARRAY], comparing: [], swapping: [], sorted: [], label: "시작 전" };

  const speedMs = sliderToMs(speed);

  useEffect(() => {
    if (!isPlaying) return;
    if (isDone) { setIsPlaying(false); return; }
    const t = setTimeout(() => setStepIdx((p) => p + 1), speedMs);
    return () => clearTimeout(t);
  }, [isPlaying, stepIdx, isDone, speedMs]);

  const handlePlay = useCallback(() => {
    if (isDone) { setStepIdx(-1); setTimeout(() => setIsPlaying(true), 30); }
    else setIsPlaying((p) => !p);
  }, [isDone]);

  const handleStep = useCallback(() => {
    setIsPlaying(false);
    setStepIdx((p) => Math.min(p + 1, steps.length - 1));
  }, [steps.length]);

  const handleReset = useCallback(() => {
    setIsPlaying(false);
    setStepIdx(-1);
  }, []);

  const maxVal = Math.max(...DEFAULT_ARRAY);
  const progress = stepIdx < 0 ? 0 : ((stepIdx + 1) / steps.length) * 100;

  function getBarClass(i: number) {
    const { comparing, swapping, sorted } = currentStep;
    if (swapping.includes(i)) return "bg-red-400 dark:bg-red-500";
    if (comparing.includes(i)) return "bg-amber-400 dark:bg-amber-500";
    if (sorted.includes(i)) return "bg-emerald-400 dark:bg-emerald-500";
    return "bg-blue-300 dark:bg-blue-600";
  }

  return (
    <div className="space-y-5">
      {/* Complexity badges */}
      <div className="flex flex-wrap gap-2 text-xs">
        {[
          ["최선", complexity.best],
          ["평균", complexity.avg],
          ["최악", complexity.worst],
          ["공간", complexity.space],
        ].map(([label, val]) => (
          <div key={label} className="flex items-center gap-1.5 px-2.5 py-1 bg-muted rounded-md">
            <span className="text-muted-foreground">{label}</span>
            <span className="font-mono font-semibold text-foreground">{val}</span>
          </div>
        ))}
        <div
          className={`px-2.5 py-1 rounded-md text-xs font-medium ${
            complexity.stable
              ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
              : "bg-muted text-muted-foreground"
          }`}
        >
          {complexity.stable ? "안정 정렬" : "불안정 정렬"}
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-2 flex-wrap">
        <button
          onClick={handleReset}
          className="p-2 rounded-lg border border-card-border bg-card hover:bg-muted text-muted-foreground transition-colors"
          title="처음으로"
          data-testid="button-reset"
        >
          <RotateCcw size={15} />
        </button>
        <button
          onClick={handlePlay}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:opacity-90 text-sm font-medium"
          data-testid="button-play-pause"
        >
          {isPlaying ? <Pause size={14} /> : <Play size={14} />}
          {isDone ? "다시 실행" : isPlaying ? "일시정지" : stepIdx < 0 ? "시작" : "계속"}
        </button>
        <button
          onClick={handleStep}
          disabled={isPlaying || isDone}
          className="flex items-center gap-1 px-3 py-2 rounded-lg border border-card-border bg-card hover:bg-muted text-sm disabled:opacity-40 disabled:cursor-not-allowed"
          data-testid="button-step"
        >
          <ChevronRight size={14} />
          한 단계
        </button>
        <div className="flex items-center gap-2 flex-1 min-w-[130px]">
          <span className="text-xs text-muted-foreground whitespace-nowrap">속도</span>
          <input
            type="range"
            min={0}
            max={100}
            value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))}
            className="flex-1 accent-primary cursor-pointer"
            data-testid="slider-speed"
          />
          <span className="text-xs text-muted-foreground w-8 text-right">
            {speed < 34 ? "느림" : speed < 67 ? "보통" : "빠름"}
          </span>
        </div>
        <span className="text-xs text-muted-foreground whitespace-nowrap">
          {Math.max(0, stepIdx + 1)}/{steps.length}
        </span>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-primary rounded-full"
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.15 }}
        />
      </div>

      {/* Current step label */}
      <div className="min-h-[28px] flex items-center">
        <span className="text-sm font-mono text-muted-foreground">{currentStep.label}</span>
      </div>

      {/* Bar chart visualization */}
      <div
        className="flex items-end gap-px h-52 bg-muted/20 rounded-xl px-2 py-3"
        data-testid="sort-bars"
      >
        {currentStep.array.map((val, i) => (
          <div
            key={i}
            className="flex-1 flex items-end justify-center"
            style={{ height: "100%" }}
          >
            <div
              className={`w-full rounded-t transition-all duration-100 ${getBarClass(i)}`}
              style={{ height: `${(val / maxVal) * 100}%` }}
              title={`${val}`}
            />
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 text-xs">
        {[
          { cls: "bg-blue-300 dark:bg-blue-600", label: "미정렬" },
          { cls: "bg-amber-400 dark:bg-amber-500", label: "비교 중" },
          { cls: "bg-red-400 dark:bg-red-500", label: "교환 중" },
          { cls: "bg-emerald-400 dark:bg-emerald-500", label: "정렬 완료" },
        ].map((item) => (
          <div key={item.label} className="flex items-center gap-1.5">
            <div className={`w-3 h-3 rounded ${item.cls}`} />
            <span className="text-muted-foreground">{item.label}</span>
          </div>
        ))}
      </div>

      {isDone && (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-3 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg text-center text-sm text-emerald-700 dark:text-emerald-400 font-medium"
        >
          정렬 완료! {algorithmName} — 총 {steps.length}단계
        </motion.div>
      )}
    </div>
  );
}
