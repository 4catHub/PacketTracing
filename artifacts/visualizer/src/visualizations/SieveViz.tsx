import { useState, useEffect, useMemo, useCallback } from "react";
import { Play, Pause, RotateCcw, ChevronRight } from "lucide-react";

type CellState = "unvisited" | "active_prime" | "prime" | "composite";

interface Op {
  type: "prime" | "composite";
  value: number;
}

function computeOps(N: number): Op[] {
  const ops: Op[] = [];
  const isComposite = new Array(N + 1).fill(false);
  for (let p = 2; p <= N; p++) {
    if (!isComposite[p]) {
      ops.push({ type: "prime", value: p });
      for (let m = p * 2; m <= N; m += p) {
        if (!isComposite[m]) {
          isComposite[m] = true;
          ops.push({ type: "composite", value: m });
        }
      }
    }
  }
  return ops;
}

function makeInitialStates(N: number): CellState[] {
  return new Array(N + 1).fill("unvisited");
}

const MIN_SPEED_MS = 20;
const MAX_SPEED_MS = 600;

function sliderToMs(value: number): number {
  const pct = value / 100;
  return Math.round(MAX_SPEED_MS - pct * (MAX_SPEED_MS - MIN_SPEED_MS));
}

function msToLabel(ms: number): string {
  if (ms >= 400) return "느림";
  if (ms >= 100) return "보통";
  return "빠름";
}

export default function SieveViz() {
  const [N, setN] = useState(100);
  const [nInput, setNInput] = useState("100");
  const [speedPct, setSpeedPct] = useState(50);
  const [isPlaying, setIsPlaying] = useState(false);
  const [done, setDone] = useState(false);
  const [opIndex, setOpIndex] = useState(0);
  const [cellStates, setCellStates] = useState<CellState[]>(() => makeInitialStates(100));
  const [currentPrime, setCurrentPrime] = useState<number | null>(null);

  const ops = useMemo(() => computeOps(N), [N]);
  const speedMs = sliderToMs(speedPct);

  const reset = useCallback(() => {
    setCellStates(makeInitialStates(N));
    setOpIndex(0);
    setCurrentPrime(null);
    setIsPlaying(false);
    setDone(false);
  }, [N]);

  useEffect(() => {
    reset();
  }, [N]);

  const applyOp = useCallback(
    (idx: number) => {
      if (idx >= ops.length) {
        setCellStates((prev) => {
          const next = [...prev];
          for (let i = 2; i <= N; i++) {
            if (next[i] === "unvisited" || next[i] === "active_prime") next[i] = "prime";
          }
          return next;
        });
        setDone(true);
        setIsPlaying(false);
        return;
      }
      const op = ops[idx];
      if (op.type === "prime") {
        setCurrentPrime(op.value);
        setCellStates((prev) => {
          const next = [...prev];
          for (let i = 2; i <= N; i++) {
            if (next[i] === "active_prime") next[i] = "prime";
          }
          next[op.value] = "active_prime";
          return next;
        });
      } else {
        setCellStates((prev) => {
          const next = [...prev];
          next[op.value] = "composite";
          return next;
        });
      }
      setOpIndex(idx + 1);
    },
    [ops, N]
  );

  useEffect(() => {
    if (!isPlaying || done) return;
    const timer = setTimeout(() => {
      applyOp(opIndex);
    }, speedMs);
    return () => clearTimeout(timer);
  }, [isPlaying, opIndex, done, speedMs, applyOp]);

  const handleStep = () => {
    setIsPlaying(false);
    applyOp(opIndex);
  };

  const handlePlay = () => {
    if (done) {
      reset();
      setTimeout(() => setIsPlaying(true), 50);
    } else {
      setIsPlaying((p) => !p);
    }
  };

  const primeCount = useMemo(
    () => cellStates.filter((s, i) => i >= 2 && (s === "prime" || s === "active_prime")).length,
    [cellStates]
  );

  const progress = Math.min(100, (opIndex / Math.max(1, ops.length)) * 100);
  const cols = 10;

  const getCellClass = (state: CellState): string => {
    switch (state) {
      case "unvisited":
        return "bg-muted text-muted-foreground";
      case "active_prime":
        return "bg-amber-400 dark:bg-amber-500 text-amber-950 font-bold ring-2 ring-amber-300 dark:ring-amber-400 scale-110 z-10";
      case "prime":
        return "bg-primary text-primary-foreground font-bold";
      case "composite":
        return "bg-muted/40 text-muted-foreground/40 line-through";
    }
  };

  return (
    <div className="space-y-5">
      {/* Controls row */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between flex-wrap bg-muted/20 dark:bg-muted/5 p-4 rounded-xl border border-border/40">
        <div className="flex items-center gap-2">
          <button
            onClick={handlePlay}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground hover:opacity-90 text-sm font-medium transition-opacity"
            data-testid="button-play-pause"
          >
            {isPlaying ? <Pause size={14} /> : <Play size={14} />}
            {done ? "다시 실행" : isPlaying ? "일시정지" : opIndex === 0 ? "실행" : "계속"}
          </button>
          <button
            onClick={handleStep}
            disabled={isPlaying || done}
            className="flex items-center gap-1 px-3 py-2.5 rounded-lg border border-card-border bg-card hover:bg-muted text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            data-testid="button-step"
          >
            <ChevronRight size={14} />
            단계
          </button>
          <button
            onClick={reset}
            className="p-2.5 rounded-lg border border-card-border bg-card hover:bg-muted text-muted-foreground transition-colors"
            data-testid="button-reset"
          >
            <RotateCcw size={15} />
          </button>
        </div>

        {/* Speed slider */}
        <div className="flex items-center gap-3 flex-1 min-w-[200px]">
          <span className="text-xs sm:text-sm font-semibold text-muted-foreground whitespace-nowrap">속도</span>
          <input
            type="range"
            min={0}
            max={100}
            value={speedPct}
            onChange={(e) => setSpeedPct(Number(e.target.value))}
            className="flex-1 accent-primary cursor-pointer h-1.5 bg-muted rounded-lg appearance-none"
            data-testid="slider-speed"
            aria-label="애니메이션 속도"
          />
          <span className="text-xs sm:text-sm font-semibold text-foreground w-10 text-right whitespace-nowrap">
            {msToLabel(speedMs)}
          </span>
        </div>

        {/* N input */}
        <div className="flex items-center gap-2">
          <label className="text-xs sm:text-sm font-semibold text-muted-foreground">N =</label>
          <input
            type="number"
            value={nInput}
            onChange={(e) => setNInput(e.target.value)}
            onBlur={() => {
              const val = Math.max(20, Math.min(200, parseInt(nInput) || 100));
              setNInput(String(val));
              setN(val);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                const val = Math.max(20, Math.min(200, parseInt(nInput) || 100));
                setNInput(String(val));
                setN(val);
              }
            }}
            min={20}
            max={200}
            className="w-20 px-2 py-1.5 text-sm font-mono border border-input rounded-lg bg-background text-center font-bold focus:ring-2 focus:ring-primary focus:border-primary outline-none"
            data-testid="input-n"
          />
          <span className="text-xs text-muted-foreground whitespace-nowrap">(20–200)</span>
        </div>
      </div>

      {/* Progress & status */}
      <div className="flex items-center gap-4 bg-muted/10 p-3.5 rounded-xl border border-border/30">
        <div className="flex-1 space-y-1">
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-200"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
        <div className="flex items-center gap-4 text-xs sm:text-sm flex-shrink-0 font-medium">
          {currentPrime && !done && (
            <span className="text-muted-foreground">
              현재 소수:{" "}
              <span className="font-bold text-amber-500 dark:text-amber-400">{currentPrime}</span>
            </span>
          )}
          <span className="text-muted-foreground">
            소수: <span className="font-bold text-primary">{primeCount}</span>개
          </span>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 text-xs sm:text-sm font-medium">
        {[
          { color: "bg-muted", label: "미확인" },
          { color: "bg-amber-400 dark:bg-amber-500", label: "현재 소수 (처리 중)" },
          { color: "bg-primary", label: "확정 소수" },
          { color: "bg-muted/40", label: "합성수 (제거됨)" },
        ].map((item) => (
          <div key={item.label} className="flex items-center gap-1.5">
            <div className={`w-3.5 h-3.5 rounded ${item.color} flex-shrink-0 border border-border/40`} />
            <span className="text-muted-foreground">{item.label}</span>
          </div>
        ))}
      </div>

      {/* Number grid */}
      <div
        className="grid gap-1"
        style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
        data-testid="sieve-grid"
      >
        {Array.from({ length: N - 1 }, (_, i) => i + 2).map((num) => {
          const state = cellStates[num] ?? "unvisited";
          return (
            <div
              key={num}
              className={`
                relative aspect-square flex items-center justify-center rounded text-xs font-mono
                transition-all duration-150
                ${getCellClass(state)}
              `}
              data-testid={`cell-${num}`}
            >
              {num}
            </div>
          );
        })}
      </div>

      {/* Completion message */}
      {done && (
        <div className="p-4 bg-primary/10 border border-primary/20 rounded-xl text-center space-y-1.5 shadow-sm">
          <p className="text-sm sm:text-base font-semibold text-primary">
            완료! 2에서 {N} 사이의 소수는 총 {primeCount}개입니다.
          </p>
          <p className="text-xs sm:text-sm text-muted-foreground font-medium">
            시간 복잡도: O(N log log N) — 에라토스테네스의 체
          </p>
        </div>
      )}
    </div>
  );
}
