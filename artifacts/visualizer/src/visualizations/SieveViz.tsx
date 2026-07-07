import { useState, useEffect, useMemo, useCallback } from "react";
import { Play, Pause, RotateCcw, ChevronRight } from "lucide-react";

type CellState = "unvisited" | "active_prime" | "prime" | "composite";

interface Op {
  type: "prime" | "composite";
  value: number;
  codeLine: number;
  variables: Record<string, any>;
}

const PYTHON_CODE = `def sieve_of_eratosthenes(n):
  is_prime = [True] * (n + 1)
  is_prime[0] = is_prime[1] = False
  for p in range(2, n + 1):
    if is_prime[p]:
      for i in range(p * 2, n + 1, p):
        is_prime[i] = False
  return [i for i in range(n + 1) if is_prime[i]]`;

function computeOps(N: number): Op[] {
  const ops: Op[] = [];
  const isComposite = new Array(N + 1).fill(false);
  for (let p = 2; p <= N; p++) {
    if (!isComposite[p]) {
      ops.push({
        type: "prime",
        value: p,
        codeLine: 5,
        variables: { p, "is_prime[p]": "True" },
      });
      for (let m = p * 2; m <= N; m += p) {
        if (!isComposite[m]) {
          isComposite[m] = true;
          ops.push({
            type: "composite",
            value: m,
            codeLine: 8,
            variables: { p, i: m, "is_prime[p]": "True", "is_prime[i]": "False" },
          });
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

  let currentCodeLine = 4;
  let variables: Record<string, any> = { n: N };

  if (done) {
    currentCodeLine = 9;
    variables = { n: N, primes_count: primeCount };
  } else if (opIndex > 0 && opIndex <= ops.length) {
    const currentOp = ops[opIndex - 1];
    currentCodeLine = currentOp.codeLine;
    variables = { n: N, ...currentOp.variables };
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      <div className="lg:col-span-7 space-y-5">
        <div className="bg-muted/20 dark:bg-muted/5 p-4 rounded-xl border border-border/40 space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
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

          <div className="flex items-center gap-3 border-t border-border/40 pt-3">
            <span className="text-xs sm:text-sm font-semibold text-muted-foreground whitespace-nowrap">재생 속도</span>
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
            <span className="text-xs sm:text-sm font-semibold text-muted-foreground w-10 text-right whitespace-nowrap">
              {msToLabel(speedMs)}
            </span>
          </div>
        </div>

        <div className="space-y-1.5">
          <div className="flex justify-between items-center text-xs text-muted-foreground">
            <span className="font-medium">진행도</span>
            <div className="flex items-center gap-4 font-mono font-semibold text-foreground">
              {currentPrime && !done && (
                <span className="text-[11px] text-muted-foreground font-normal">
                  현재 소수:{" "}
                  <span className="font-bold text-amber-500 dark:text-amber-400">{currentPrime}</span>
                </span>
              )}
              <span>{done ? "완료" : `${opIndex} / ${ops.length} 단계`}</span>
            </div>
          </div>
          <div className="flex items-center gap-4 bg-muted/10 p-3.5 rounded-xl border border-border/30">
            <div className="flex-1">
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all duration-200"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
            <div className="flex items-center gap-4 text-xs sm:text-sm flex-shrink-0 font-medium font-mono text-muted-foreground">
              소수: <span className="font-bold text-primary">{primeCount}</span>개
            </div>
          </div>
        </div>

        <div className="border border-border rounded-xl p-4 bg-muted/20 dark:bg-muted/5 space-y-3">
          <div className="font-semibold text-foreground text-xs flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded bg-amber-500" />
            변수 상태 추적 (Variables)
          </div>
          <div className="min-h-[60px] flex flex-col justify-center">
            {variables ? (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-2 text-xs font-mono">
                {Object.entries(variables).map(([key, val]) => (
                  <div key={key} className="flex justify-between items-center border-b border-border/40 py-1.5">
                    <span className="text-muted-foreground font-semibold">{key}</span>
                    <span className="text-foreground font-medium text-right truncate max-w-[120px]" title={Array.isArray(val) ? `[${val.join(", ")}]` : String(val)}>
                      {Array.isArray(val) ? `[${val.join(", ")}]` : String(val)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-xs text-muted-foreground italic">
                {opIndex === 0 ? "실행을 시작하면 변수 상태가 표시됩니다." : "추적 중인 변수가 없습니다."}
              </div>
            )}
          </div>
        </div>

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

      <div className="lg:col-span-5 flex flex-col gap-4">
        <div className="border border-border rounded-xl bg-muted/20 dark:bg-muted/5 overflow-hidden flex flex-col h-auto">
          <div className="px-4 py-2 border-b border-border bg-muted/30 flex items-center justify-between">
            <span className="text-xs font-semibold text-foreground">Python 구현 코드</span>
            <span className="text-[10px] font-mono text-muted-foreground">python</span>
          </div>
          <div className="flex-1 p-4 font-mono text-xs leading-relaxed space-y-0.5 select-none">
            {PYTHON_CODE.split("\n").map((line, idx) => {
              const lineNum = idx + 1;
              const isCurrent = lineNum === currentCodeLine;
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
