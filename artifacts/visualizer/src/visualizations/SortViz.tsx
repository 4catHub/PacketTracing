import { useState, useEffect, useCallback, useMemo } from "react";
import { Play, Pause, RotateCcw, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";

export interface SortStep {
  array: number[];
  comparing: number[];
  swapping: number[];
  sorted: number[];
  label: string;
  codeLine?: number;
  variables?: Record<string, any>;
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
  pythonCode: string;
}

export const DEFAULT_ARRAY = [14, 3, 10, 6, 17, 1, 12, 8, 15, 4, 11, 7, 16, 2, 9, 13, 5];

function sliderToMs(v: number): number {
  const MAX = 700;
  const MIN = 15;
  return Math.round(MAX - (v / 100) * (MAX - MIN));
}

export default function SortViz({ algorithmName, complexity, generateSteps, pythonCode }: Props) {
  const steps = useMemo(() => generateSteps([...DEFAULT_ARRAY]), [generateSteps]);

  const [stepIdx, setStepIdx] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(60);

  const isDone = stepIdx >= steps.length - 1;
  const currentStep: SortStep =
    stepIdx >= 0
      ? steps[stepIdx]
      : { array: [...DEFAULT_ARRAY], comparing: [], swapping: [], sorted: [], label: "시작 전", codeLine: 0, variables: {} };

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
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Left Column: Visualization & Controls */}
      <div className="lg:col-span-7 space-y-5">
        {/* Controls */}
        <div className="bg-muted/20 dark:bg-muted/5 p-4 rounded-xl border border-border/40 space-y-4">
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handleReset}
              className="p-2.5 rounded-lg border border-card-border bg-card hover:bg-muted text-muted-foreground transition-colors"
              title="처음으로"
              data-testid="button-reset"
            >
              <RotateCcw size={15} />
            </button>
            <button
              onClick={handlePlay}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground hover:opacity-90 text-sm font-medium transition-opacity"
              data-testid="button-play-pause"
            >
              {isPlaying ? <Pause size={14} /> : <Play size={14} />}
              {isDone ? "다시 실행" : isPlaying ? "일시정지" : stepIdx < 0 ? "시작" : "계속"}
            </button>
            <button
              onClick={handleStep}
              disabled={isPlaying || isDone}
              className="flex items-center gap-1 px-3 py-2.5 rounded-lg border border-card-border bg-card hover:bg-muted text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              data-testid="button-step"
            >
              <ChevronRight size={14} />
              한 단계
            </button>
          </div>
          <div className="flex items-center gap-3 border-t border-border/40 pt-3">
            <span className="text-xs sm:text-sm font-semibold text-muted-foreground whitespace-nowrap">재생 속도</span>
            <input
              type="range"
              min={0}
              max={100}
              value={speed}
              onChange={(e) => setSpeed(Number(e.target.value))}
              className="flex-1 accent-primary cursor-pointer h-1.5 bg-muted rounded-lg appearance-none"
              data-testid="slider-speed"
            />
            <span className="text-xs sm:text-sm font-semibold text-muted-foreground w-10 text-right whitespace-nowrap">
              {speed < 34 ? "느림" : speed < 67 ? "보통" : "빠름"}
            </span>
          </div>
        </div>

        {/* Progress & Step Info */}
        <div className="space-y-1.5">
          <div className="flex justify-between items-center text-xs text-muted-foreground">
            <span className="font-medium">진행도</span>
            <span className="font-mono font-semibold text-foreground">
              {Math.max(0, stepIdx + 1)} / {steps.length} 단계
            </span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-primary rounded-full"
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.15 }}
            />
          </div>
        </div>

        {/* Variables HUD */}
        <div className="border border-border rounded-xl p-4 bg-muted/20 dark:bg-muted/5 space-y-3">
          <div className="font-semibold text-foreground text-xs flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded bg-amber-500" />
            변수 상태 추적 (Variables)
          </div>
          <div className="min-h-[60px] flex flex-col justify-center">
            {currentStep.variables && Object.keys(currentStep.variables).length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-2 text-xs font-mono">
                {Object.entries(currentStep.variables).map(([key, val]) => (
                  <div key={key} className="flex justify-between items-center border-b border-border/40 py-1.5">
                    <span className="text-muted-foreground font-semibold">{key}</span>
                    <span className="text-foreground font-medium text-right truncate max-w-[80px]" title={Array.isArray(val) ? `[${val.join(", ")}]` : String(val)}>
                      {Array.isArray(val) ? `[${val.join(", ")}]` : String(val)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-xs text-muted-foreground italic">
                {stepIdx < 0 ? "정렬을 시작하면 변수 상태가 표시됩니다." : "추적 중인 변수가 없습니다."}
              </div>
            )}
          </div>
        </div>

        {/* Current step label */}
        <div className="min-h-[32px] flex items-center bg-muted/10 px-3 py-1.5 rounded-lg border border-border/20">
          <span className="text-xs sm:text-sm font-mono font-medium text-foreground">{currentStep.label}</span>
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
        <div className="flex flex-wrap gap-4 text-xs sm:text-sm font-medium">
          {[
            { cls: "bg-blue-300 dark:bg-blue-600", label: "미정렬" },
            { cls: "bg-amber-400 dark:bg-amber-500", label: "비교 중" },
            { cls: "bg-red-400 dark:bg-red-500", label: "교환 중" },
            { cls: "bg-emerald-400 dark:bg-emerald-500", label: "정렬 완료" },
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-1.5">
              <div className={`w-3.5 h-3.5 rounded ${item.cls} border border-border/40`} />
              <span className="text-muted-foreground">{item.label}</span>
            </div>
          ))}
        </div>

        {isDone && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/30 rounded-xl text-center text-sm sm:text-base text-emerald-700 dark:text-emerald-400 font-semibold shadow-sm"
          >
            정렬 완료! {algorithmName} — 총 {steps.length}단계
          </motion.div>
        )}
      </div>

      {/* Right Column: Python Code */}
      <div className="lg:col-span-5 flex flex-col gap-4">
        {/* Python Code Panel */}
        <div className="border border-border rounded-xl bg-muted/20 dark:bg-muted/5 overflow-hidden flex flex-col h-auto">
          <div className="px-4 py-2 border-b border-border bg-muted/30 flex items-center justify-between">
            <span className="text-xs font-semibold text-foreground">Python 구현 코드</span>
            <span className="text-[10px] font-mono text-muted-foreground">python</span>
          </div>
          <div className="flex-1 p-4 font-mono text-xs leading-relaxed space-y-0.5 select-none">
            {pythonCode.split("\n").map((line, idx) => {
              const lineNum = idx + 1;
              const isCurrent = lineNum === currentStep.codeLine;
              return (
                <div
                  key={lineNum}
                  className={`flex items-start -mx-4 px-4 py-0.5 transition-all duration-150 ${
                    isCurrent
                      ? "bg-amber-500/10 border-l-2 border-amber-500 text-foreground font-semibold dark:bg-amber-500/20"
                      : "text-muted-foreground"
                  }`}
                >
                  <span className="w-6 text-right pr-2 select-none opacity-40 font-mono text-[10px]">
                    {lineNum}
                  </span>
                  <pre className="whitespace-pre-wrap font-mono">{line || " "}</pre>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
