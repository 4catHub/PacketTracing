import { useCallback, useEffect, useMemo, useState } from "react";
import { Pause, Play } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";

type SearchMode = "binary" | "lower" | "upper";
type StepPhase = "initial" | "compare" | "narrow" | "complete";

interface SearchStep {
  low: number;
  high: number;
  mid: number | null;
  phase: StepPhase;
  codeLine: number;
  message: string;
  comparison?: string;
  result?: number;
}

const VALUES = [1, 2, 4, 4, 4, 7, 9, 11, 14, 18];
const TARGET = 4;

const MODE_META: Record<
  SearchMode,
  { label: string; shortLabel: string; definition: string; resultLabel: string }
> = {
  binary: {
    label: "일반 이진 탐색",
    shortLabel: "Binary Search",
    definition: "target과 같은 임의의 위치",
    resultLabel: "찾은 위치",
  },
  lower: {
    label: "Lower Bound",
    shortLabel: "첫 ≥ target",
    definition: "target 이상인 첫 위치",
    resultLabel: "시작 경계",
  },
  upper: {
    label: "Upper Bound",
    shortLabel: "첫 > target",
    definition: "target보다 큰 첫 위치",
    resultLabel: "끝 다음 경계",
  },
};

const CODE: Record<SearchMode, string> = {
  binary: `function binarySearch(values, target) {
  let low = 0;
  let high = values.length;
  while (low < high) {
    const mid = low + Math.floor((high - low) / 2);
    if (values[mid] === target) return mid;
    if (values[mid] < target) {
      low = mid + 1;
    } else {
      high = mid;
    }
  }
  return -1;
}`,
  lower: `function lowerBound(values, target) {
  let low = 0;
  let high = values.length;
  while (low < high) {
    const mid = low + Math.floor((high - low) / 2);
    if (values[mid] < target) {
      low = mid + 1;
    } else {
      high = mid;
    }
  }
  return low;
}`,
  upper: `function upperBound(values, target) {
  let low = 0;
  let high = values.length;
  while (low < high) {
    const mid = low + Math.floor((high - low) / 2);
    if (values[mid] <= target) {
      low = mid + 1;
    } else {
      high = mid;
    }
  }
  return low;
}`,
};

function generateSteps(mode: SearchMode): SearchStep[] {
  const steps: SearchStep[] = [
    {
      low: 0,
      high: VALUES.length,
      mid: null,
      phase: "initial",
      codeLine: 3,
      message: `전체 배열을 후보 구간 [0, ${VALUES.length})로 설정합니다.`,
    },
  ];

  let low = 0;
  let high = VALUES.length;

  while (low < high) {
    const mid = low + Math.floor((high - low) / 2);
    const value = VALUES[mid];

    steps.push({
      low,
      high,
      mid,
      phase: "compare",
      codeLine: 6,
      message: `가운데 인덱스 ${mid}의 값 ${value}을 target ${TARGET}와 비교합니다.`,
      comparison: `${value} ${value === TARGET ? "=" : value < TARGET ? "<" : ">"} ${TARGET}`,
    });

    if (mode === "binary" && value === TARGET) {
      steps.push({
        low,
        high,
        mid,
        phase: "complete",
        codeLine: 6,
        message: `값이 일치했습니다. 중복된 ${TARGET} 중 인덱스 ${mid}를 반환합니다.`,
        comparison: `${value} = ${TARGET}`,
        result: mid,
      });
      return steps;
    }

    const moveRight = mode === "upper" ? value <= TARGET : value < TARGET;

    if (moveRight) {
      low = mid + 1;
      steps.push({
        low,
        high,
        mid,
        phase: "narrow",
        codeLine: mode === "binary" ? 8 : 7,
        message:
          mode === "upper" && value === TARGET
            ? `${value}도 upper bound 후보가 아니므로 low를 ${low}로 옮겨 같은 값을 건너뜁니다.`
            : `${value}은 target보다 작으므로 low를 ${low}로 옮깁니다.`,
        comparison:
          mode === "upper"
            ? `${value} ≤ ${TARGET} → low = ${low}`
            : `${value} < ${TARGET} → low = ${low}`,
      });
    } else {
      high = mid;
      steps.push({
        low,
        high,
        mid,
        phase: "narrow",
        codeLine: mode === "binary" ? 10 : 9,
        message:
          mode === "lower" && value === TARGET
            ? `${value}과 일치해도 더 앞의 경계를 확인하기 위해 high를 ${high}로 옮깁니다.`
            : `${value}은 원하는 경계의 오른쪽이므로 high를 ${high}로 옮깁니다.`,
        comparison:
          mode === "lower"
            ? `${value} ≥ ${TARGET} → high = ${high}`
            : `${value} > ${TARGET} → high = ${high}`,
      });
    }
  }

  const result = mode === "binary" ? -1 : low;
  steps.push({
    low,
    high,
    mid: null,
    phase: "complete",
    codeLine: 12,
    message:
      mode === "binary"
        ? `후보 구간이 비어 target ${TARGET}이 없음을 확인했습니다.`
        : `low와 high가 ${low}에서 만났습니다. ${MODE_META[mode].label}는 인덱스 ${low}입니다.`,
    result,
  });

  return steps;
}

function sliderToMs(value: number) {
  const slow = 1800;
  const fast = 350;
  return Math.round(slow - (value / 100) * (slow - fast));
}

export default function BinarySearchBoundsViz() {
  const [mode, setMode] = useState<SearchMode>("binary");
  const [stepIndex, setStepIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [speed, setSpeed] = useState(55);
  const prefersReducedMotion = useReducedMotion();

  const steps = useMemo(() => generateSteps(mode), [mode]);
  const currentStep = steps[stepIndex];
  const isComplete = stepIndex === steps.length - 1;
  const speedMs = sliderToMs(speed);

  useEffect(() => {
    if (!isPlaying) return;

    const timer = window.setTimeout(
      () =>
        setStepIndex((current) =>
          isComplete ? 0 : Math.min(current + 1, steps.length - 1),
        ),
      isComplete ? Math.max(speedMs, 900) : speedMs,
    );
    return () => window.clearTimeout(timer);
  }, [isComplete, isPlaying, mode, speedMs, stepIndex, steps.length]);

  const selectMode = useCallback((nextMode: SearchMode) => {
    setMode(nextMode);
    setStepIndex(0);
    setIsPlaying(true);
  }, []);

  const togglePlayback = useCallback(() => {
    setIsPlaying((current) => !current);
  }, []);

  const progress = ((stepIndex + 1) / steps.length) * 100;
  const resultValue =
    currentStep.result !== undefined && currentStep.result >= 0
      ? VALUES[currentStep.result]
      : undefined;

  return (
    <div className="space-y-5">
      <div
        className="flex flex-wrap gap-2"
        role="group"
        aria-label="탐색 방식 선택"
      >
        {(Object.keys(MODE_META) as SearchMode[]).map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => selectMode(item)}
            aria-pressed={mode === item}
            className={`rounded-lg border px-3 py-2 text-left transition-colors ${
              mode === item
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-card text-muted-foreground hover:bg-muted/50"
            }`}
          >
            <span className="block text-xs font-semibold">
              {MODE_META[item].label}
            </span>
            <span
              className={`block text-[10px] ${mode === item ? "opacity-80" : "opacity-70"}`}
            >
              {MODE_META[item].shortLabel}
            </span>
          </button>
        ))}
      </div>

      <div className="rounded-xl border border-border bg-card px-3 py-2.5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={togglePlayback}
              className="flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:opacity-90"
            >
              {isPlaying ? <Pause size={12} /> : <Play size={12} />}
              {isPlaying ? "일시정지" : "계속 재생"}
            </button>
            <span className="text-[11px] text-muted-foreground">자동 반복</span>
          </div>

          <label className="flex min-w-[170px] items-center gap-2 text-[11px] text-muted-foreground">
            <span className="whitespace-nowrap">재생 속도</span>
            <input
              type="range"
              min={0}
              max={100}
              value={speed}
              onChange={(event) => setSpeed(Number(event.target.value))}
              className="h-1 flex-1 cursor-pointer appearance-none rounded bg-muted accent-primary"
              aria-label="재생 속도"
            />
          </label>
        </div>
        <div className="mt-2 h-1 overflow-hidden rounded-full bg-muted">
          <motion.div
            className="h-full rounded-full bg-primary"
            animate={{ width: `${progress}%` }}
            transition={{ duration: prefersReducedMotion ? 0 : 0.2 }}
          />
        </div>
      </div>

      <section
        className="overflow-hidden rounded-2xl border border-border bg-card"
        aria-label="이진 탐색 배열"
      >
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border bg-muted/20 px-4 py-3">
          <div>
            <p className="text-sm font-semibold text-foreground">
              {MODE_META[mode].label}
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {MODE_META[mode].definition}
            </p>
          </div>
          <div className="rounded-lg border border-border bg-background px-3 py-1.5 font-mono text-xs">
            target = <span className="font-bold text-primary">{TARGET}</span>
          </div>
        </div>

        <div className="overflow-x-auto px-4 py-6">
          <div className="mx-auto min-w-[680px] max-w-4xl">
            <div
              className="grid gap-1.5"
              style={{
                gridTemplateColumns: `repeat(${VALUES.length + 1}, minmax(48px, 1fr))`,
              }}
            >
              {VALUES.map((_, index) => (
                <div
                  key={`index-${index}`}
                  className="text-center font-mono text-[10px] text-muted-foreground"
                >
                  {index}
                </div>
              ))}
              <div className="text-center font-mono text-[10px] text-muted-foreground">
                n
              </div>

              {VALUES.map((value, index) => {
                const isCandidate =
                  index >= currentStep.low && index < currentStep.high;
                const isMid = currentStep.mid === index;
                const isResult =
                  currentStep.phase === "complete" &&
                  currentStep.result === index;
                const isTarget = value === TARGET;

                return (
                  <motion.div
                    key={`value-${index}`}
                    animate={
                      isMid && !prefersReducedMotion
                        ? { y: [0, -3, 0] }
                        : { y: 0 }
                    }
                    transition={{ duration: 0.3 }}
                    className={`relative flex h-14 items-center justify-center rounded-lg border-2 font-mono text-base font-bold transition-colors ${
                      isResult
                        ? "border-emerald-500 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                        : isMid
                          ? "border-amber-500 bg-amber-500/15 text-amber-700 dark:text-amber-300"
                          : isCandidate
                            ? "border-primary/40 bg-primary/5 text-foreground"
                            : "border-border bg-muted/30 text-muted-foreground opacity-45"
                    }`}
                  >
                    {value}
                    {isTarget && (
                      <span
                        className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full border-2 border-card bg-primary"
                        aria-hidden="true"
                      />
                    )}
                  </motion.div>
                );
              })}
              <div
                className={`flex h-14 items-center justify-center rounded-lg border-2 border-dashed font-mono text-[10px] transition-colors ${
                  currentStep.phase === "complete" &&
                  currentStep.result === VALUES.length
                    ? "border-emerald-500 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                    : currentStep.high === VALUES.length
                      ? "border-violet-400/60 bg-violet-500/5 text-violet-600 dark:text-violet-300"
                      : "border-border bg-muted/20 text-muted-foreground opacity-45"
                }`}
              >
                끝
              </div>

              {Array.from({ length: VALUES.length + 1 }, (_, index) => (
                <div
                  key={`pointers-${index}`}
                  className="flex min-h-[70px] flex-col items-center gap-1 pt-2"
                >
                  {currentStep.low === index && (
                    <span className="rounded bg-blue-500/15 px-1.5 py-0.5 font-mono text-[10px] font-bold text-blue-700 dark:text-blue-300">
                      low
                    </span>
                  )}
                  {currentStep.mid === index && (
                    <span className="rounded bg-amber-500/15 px-1.5 py-0.5 font-mono text-[10px] font-bold text-amber-700 dark:text-amber-300">
                      mid
                    </span>
                  )}
                  {currentStep.high === index && (
                    <span className="rounded bg-violet-500/15 px-1.5 py-0.5 font-mono text-[10px] font-bold text-violet-700 dark:text-violet-300">
                      high
                    </span>
                  )}
                  {currentStep.phase === "complete" &&
                    currentStep.result === index && (
                      <span className="rounded bg-emerald-500/15 px-1.5 py-0.5 font-mono text-[10px] font-bold text-emerald-700 dark:text-emerald-300">
                        result
                      </span>
                    )}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-x-4 gap-y-2 border-t border-border bg-muted/10 px-4 py-3 text-[11px] text-muted-foreground">
          <span>
            <span className="mr-1.5 inline-block h-2.5 w-2.5 rounded-sm bg-primary/40" />
            후보 구간 [low, high)
          </span>
          <span>
            <span className="mr-1.5 inline-block h-2.5 w-2.5 rounded-sm bg-amber-500" />
            현재 비교 mid
          </span>
          <span>
            <span className="mr-1.5 inline-block h-2.5 w-2.5 rounded-full bg-primary" />
            target과 같은 값
          </span>
          <span>high는 후보 구간에 포함되지 않음</span>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
        <div className="space-y-4 lg:col-span-5">
          <div className="rounded-xl border border-border bg-card p-4">
            <div className="grid grid-cols-3 gap-2">
              {[
                ["low", currentStep.low],
                ["mid", currentStep.mid ?? "—"],
                ["high", currentStep.high],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="rounded-lg bg-muted/30 px-3 py-2 text-center"
                >
                  <div className="text-[10px] font-semibold uppercase text-muted-foreground">
                    {label}
                  </div>
                  <div className="mt-1 font-mono text-lg font-bold text-foreground">
                    {value}
                  </div>
                </div>
              ))}
            </div>

            {currentStep.comparison && (
              <div className="mt-3 rounded-lg border border-amber-500/25 bg-amber-500/10 px-3 py-2 text-center font-mono text-sm font-semibold text-amber-800 dark:text-amber-200">
                {currentStep.comparison}
              </div>
            )}

            <p className="mt-3 min-h-[44px] text-sm leading-relaxed text-foreground">
              {currentStep.message}
            </p>
            <div className="mt-3 flex items-center justify-between border-t border-border pt-3 text-xs">
              <span className="text-muted-foreground">
                {stepIndex + 1} / {steps.length} 단계
              </span>
              {currentStep.phase === "complete" &&
                currentStep.result !== undefined && (
                  <span className="font-semibold text-emerald-700 dark:text-emerald-300">
                    {MODE_META[mode].resultLabel}: {currentStep.result}
                    {resultValue !== undefined ? ` (값 ${resultValue})` : ""}
                  </span>
                )}
            </div>
          </div>

          <div className="rounded-xl border border-border bg-muted/15 p-4 text-xs leading-relaxed text-muted-foreground">
            <span className="font-semibold text-foreground">경계의 차이:</span>{" "}
            Lower Bound는 같은 값을 만나도 왼쪽을 더 확인하고, Upper Bound는
            같은 값을 지나 오른쪽을 확인합니다. 이 예제의 결과는 lower = 2,
            upper = 5이므로 값 {TARGET}의 개수는 3개입니다.
          </div>
        </div>

        <div className="overflow-hidden rounded-xl border border-border bg-muted/15 lg:col-span-7">
          <div className="flex items-center justify-between border-b border-border bg-muted/30 px-4 py-2">
            <span className="text-xs font-semibold text-foreground">
              TypeScript 핵심 코드
            </span>
            <span className="font-mono text-[10px] text-muted-foreground">
              {MODE_META[mode].shortLabel}
            </span>
          </div>
          <div className="overflow-x-auto py-3 font-mono text-xs leading-relaxed">
            {CODE[mode].split("\n").map((line, index) => {
              const lineNumber = index + 1;
              const isActive = currentStep.codeLine === lineNumber;
              return (
                <div
                  key={`${mode}-${lineNumber}`}
                  className={`flex min-w-[510px] px-4 py-0.5 ${
                    isActive
                      ? "border-l-2 border-amber-500 bg-amber-500/10 font-semibold text-foreground"
                      : "border-l-2 border-transparent text-muted-foreground"
                  }`}
                >
                  <span className="mr-3 w-5 shrink-0 text-right text-[10px] opacity-45">
                    {lineNumber}
                  </span>
                  <pre className="font-mono">{line || " "}</pre>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
