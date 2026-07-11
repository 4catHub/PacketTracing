import { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Pause, RotateCcw, ChevronLeft, ChevronRight, Briefcase, Award, List } from "lucide-react";

interface Item {
  id: number;
  name: string;
  weight: number;
  value: number;
}

const ITEMS: Item[] = [
  { id: 1, name: "책", weight: 1, value: 15 },
  { id: 2, name: "시계", weight: 3, value: 20 },
  { id: 3, name: "보석", weight: 4, value: 30 },
  { id: 4, name: "노트북", weight: 5, value: 35 },
];

interface KnapsackStep {
  dpTable: number[][];
  activeRow: number | null;
  activeCells: [number, number][]; // 연산 완료/진행 중인 셀들
  compareCells: {
    target: [number, number];
    prevBest: [number, number];
    withCurrent: [number, number];
  } | null; // 비교 하이라이트 셀 정보
  backtrackCells: [number, number][]; // 역추적 경로 셀들
  selectedItemIds: number[]; // 현재 선택 완료된 아이템 ID들
  codeLine: number;
}

const CAPACITY = 8;
const INITIAL_TABLE = Array(5).fill(null).map(() => Array(CAPACITY + 1).fill(0));

const TABLE_STEP_0 = [
  [0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 15, 15, 15, 15, 15, 15, 15, 15],
  [0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0]
];

const TABLE_STEP_1 = [
  [0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 15, 15, 15, 15, 15, 15, 15, 15],
  [0, 15, 15, 20, 35, 35, 35, 35, 35],
  [0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0]
];

const TABLE_STEP_2 = [
  [0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 15, 15, 15, 15, 15, 15, 15, 15],
  [0, 15, 15, 20, 35, 35, 35, 35, 35],
  [0, 15, 15, 20, 35, 45, 45, 50, 65],
  [0, 0, 0, 0, 0, 0, 0, 0, 0]
];

const TABLE_FINAL = [
  [0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 15, 15, 15, 15, 15, 15, 15, 15],
  [0, 15, 15, 20, 35, 35, 35, 35, 35],
  [0, 15, 15, 20, 35, 45, 45, 50, 65],
  [0, 15, 15, 20, 35, 45, 50, 50, 65]
];

const KNAPSACK_STEPS: KnapsackStep[] = [
  {
    dpTable: INITIAL_TABLE,
    activeRow: null,
    activeCells: [],
    compareCells: null,
    backtrackCells: [],
    selectedItemIds: [],
    codeLine: 3
  },
  {
    dpTable: TABLE_STEP_0,
    activeRow: 1,
    activeCells: Array(9).fill(null).map((_, i) => [1, i]),
    compareCells: { target: [1, 1], prevBest: [0, 1], withCurrent: [0, 0] },
    backtrackCells: [],
    selectedItemIds: [],
    codeLine: 8
  },
  {
    dpTable: TABLE_STEP_1,
    activeRow: 2,
    activeCells: Array(9).fill(null).map((_, i) => [2, i]),
    compareCells: { target: [2, 4], prevBest: [1, 4], withCurrent: [1, 1] },
    backtrackCells: [],
    selectedItemIds: [],
    codeLine: 8
  },
  {
    dpTable: TABLE_STEP_2,
    activeRow: 3,
    activeCells: Array(9).fill(null).map((_, i) => [3, i]),
    compareCells: { target: [3, 8], prevBest: [2, 8], withCurrent: [2, 4] },
    backtrackCells: [],
    selectedItemIds: [],
    codeLine: 8
  },
  {
    dpTable: TABLE_FINAL,
    activeRow: 4,
    activeCells: Array(9).fill(null).map((_, i) => [4, i]),
    compareCells: { target: [4, 8], prevBest: [3, 8], withCurrent: [3, 3] },
    backtrackCells: [],
    selectedItemIds: [],
    codeLine: 8
  },
  {
    dpTable: TABLE_FINAL,
    activeRow: null,
    activeCells: [],
    compareCells: null,
    backtrackCells: [[4, 8]],
    selectedItemIds: [],
    codeLine: 14
  },
  {
    dpTable: TABLE_FINAL,
    activeRow: null,
    activeCells: [],
    compareCells: null,
    backtrackCells: [[4, 8], [3, 8]],
    selectedItemIds: [3],
    codeLine: 16
  },
  {
    dpTable: TABLE_FINAL,
    activeRow: null,
    activeCells: [],
    compareCells: null,
    backtrackCells: [[4, 8], [3, 8], [2, 4]],
    selectedItemIds: [3, 2],
    codeLine: 16
  },
  {
    dpTable: TABLE_FINAL,
    activeRow: null,
    activeCells: [],
    compareCells: null,
    backtrackCells: [[4, 8], [3, 8], [2, 4], [1, 1]],
    selectedItemIds: [3, 2, 1],
    codeLine: 16
  },
  {
    dpTable: TABLE_FINAL,
    activeRow: null,
    activeCells: [],
    compareCells: null,
    backtrackCells: [[4, 8], [3, 8], [2, 4], [1, 1], [0, 0]],
    selectedItemIds: [3, 2, 1],
    codeLine: 18
  }
];

const PYTHON_CODE = `def knapsack(weights, values, capacity):
  n = len(weights)
  dp = [[0] * (capacity + 1) for _ in range(n + 1)]

  for i in range(1, n + 1):
    for w in range(capacity + 1):
      if weights[i - 1] <= w:
        dp[i][w] = max(dp[i - 1][w], dp[i - 1][w - weights[i - 1]] + values[i - 1])
      else:
        dp[i][w] = dp[i - 1][w]

  # 역추적 (Backtracking)
  selected = []
  w = capacity
  for i in range(n, 0, -1):
    if dp[i][w] != dp[i - 1][w]:
      selected.append(i - 1)
      w -= weights[i - 1]

  return dp[n][capacity], selected`;

export default function KnapsackViz() {
  const [activeStep, setActiveStep] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(60);

  const total = KNAPSACK_STEPS.length;
  const isComplete = activeStep >= total - 1;

  const speedMs = useMemo(() => {
    const MAX = 2500;
    const MIN = 150;
    return Math.round(MAX - (speed / 100) * (MAX - MIN));
  }, [speed]);

  useEffect(() => {
    if (!isPlaying) return;
    if (isComplete) {
      setIsPlaying(false);
      return;
    }
    const t = setTimeout(() => setActiveStep((p) => p + 1), speedMs);
    return () => clearTimeout(t);
  }, [isPlaying, activeStep, isComplete, speedMs]);

  const handleReset = useCallback(() => {
    setIsPlaying(false);
    setActiveStep(-1);
  }, []);

  const handlePlay = useCallback(() => {
    if (isComplete) {
      handleReset();
      setTimeout(() => setIsPlaying(true), 50);
    } else {
      setIsPlaying((p) => !p);
    }
  }, [isComplete, handleReset]);

  const handleNext = useCallback(() => {
    setIsPlaying(false);
    if (activeStep < total - 1) setActiveStep((p) => p + 1);
  }, [activeStep, total]);

  const handlePrev = useCallback(() => {
    setIsPlaying(false);
    if (activeStep >= 0) setActiveStep((p) => p - 1);
  }, [activeStep]);

  const currentStepData = activeStep >= 0 ? KNAPSACK_STEPS[activeStep] : null;
  const dpTable = currentStepData?.dpTable || INITIAL_TABLE;

  const totalValue = useMemo(() => {
    if (!currentStepData) return 0;
    return currentStepData.selectedItemIds.reduce((acc, id) => {
      const item = ITEMS.find((i) => i.id === id);
      return acc + (item?.value || 0);
    }, 0);
  }, [currentStepData]);

  const totalWeight = useMemo(() => {
    if (!currentStepData) return 0;
    return currentStepData.selectedItemIds.reduce((acc, id) => {
      const item = ITEMS.find((i) => i.id === id);
      return acc + (item?.weight || 0);
    }, 0);
  }, [currentStepData]);

  const getCellClassName = (r: number, c: number) => {
    if (activeStep < 0) return "border-border/30 text-muted-foreground/60";
    const step = KNAPSACK_STEPS[activeStep];
    
    const isBacktrack = step.backtrackCells.some(([row, col]) => row === r && col === c);
    if (isBacktrack) {
      return "border-emerald-500 bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-bold ring-2 ring-emerald-500 ring-offset-1 dark:ring-offset-background";
    }

    const isTarget = step.compareCells?.target[0] === r && step.compareCells?.target[1] === c;
    const isPrevBest = step.compareCells?.prevBest[0] === r && step.compareCells?.prevBest[1] === c;
    const isWithCurrent = step.compareCells?.withCurrent[0] === r && step.compareCells?.withCurrent[1] === c;

    if (isTarget) {
      return "border-blue-500 bg-blue-500/20 text-blue-600 dark:text-blue-400 font-bold ring-2 ring-blue-500";
    }
    if (isPrevBest) {
      return "border-sky-400 bg-sky-400/15 text-sky-600 dark:text-sky-400 font-medium";
    }
    if (isWithCurrent) {
      return "border-orange-400 bg-orange-400/15 text-orange-600 dark:text-orange-400 font-medium";
    }

    const isActiveCell = step.activeCells.some(([row, col]) => row === r && col === c);
    if (isActiveCell) {
      return "border-blue-400/40 bg-blue-500/5 text-blue-500 dark:text-blue-400/70";
    }

    if (step.activeRow === r) {
      return "border-border text-foreground";
    }

    if (r > 0 && r < (step.activeRow ?? 5)) {
      return "border-border/60 text-muted-foreground";
    }

    return "border-border/20 text-muted-foreground/30";
  };

  const getCellLabel = (r: number, c: number) => {
    if (activeStep < 0) return null;
    const step = KNAPSACK_STEPS[activeStep];
    if (step.compareCells?.target[0] === r && step.compareCells?.target[1] === c) return "결과";
    if (step.compareCells?.prevBest[0] === r && step.compareCells?.prevBest[1] === c) return "제외";
    if (step.compareCells?.withCurrent[0] === r && step.compareCells?.withCurrent[1] === c) return "선택";
    return null;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Left Column (7 cols) */}
      <div className="lg:col-span-7 space-y-4">
        {/* Controller (Minimized) */}
        <div className="bg-muted/20 px-3 py-2 rounded-xl border border-border/40 flex items-center justify-between gap-4">
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <button onClick={handleReset} className="p-1.5 rounded-md bg-card border hover:bg-muted/50 transition-colors" title="초기화"><RotateCcw size={13} /></button>
            <button onClick={handlePrev} className="p-1.5 rounded-md bg-card border hover:bg-muted/50 transition-colors" disabled={activeStep < 0}><ChevronLeft size={13} /></button>
            <button onClick={handlePlay} className="px-3 py-1.5 rounded-md bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/95 transition-colors flex items-center gap-1">
              {isPlaying ? <Pause size={11} /> : <Play size={11} />}
              {isPlaying ? "Pause" : "Play"}
            </button>
            <button onClick={handleNext} className="p-1.5 rounded-md bg-card border hover:bg-muted/50 transition-colors" disabled={isComplete}><ChevronRight size={13} /></button>
          </div>
          <div className="flex items-center gap-2 flex-grow max-w-[180px]">
            <span className="text-[10px] text-muted-foreground whitespace-nowrap">{speedMs}ms</span>
            <input type="range" min={0} max={100} value={speed} onChange={(e) => setSpeed(Number(e.target.value))} className="w-full h-1 bg-muted rounded-lg appearance-none cursor-pointer accent-primary" />
          </div>
        </div>

        {/* Variables HUD */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-card border p-3 rounded-xl flex flex-col justify-center">
            <span className="text-xs text-muted-foreground font-semibold">검토 대상 물건</span>
            <span className="text-xs sm:text-sm font-bold text-foreground font-sans mt-0.5">
              {currentStepData && currentStepData.activeRow !== null ? ITEMS[currentStepData.activeRow - 1].name : "역추적 / 탐색 완료"}
            </span>
          </div>
          <div className="bg-card border p-3 rounded-xl flex flex-col justify-center">
            <span className="text-xs text-muted-foreground font-semibold">배낭 적재 무게</span>
            <span className="text-base font-bold text-amber-500 font-mono mt-0.5">
              {totalWeight} / 8 kg
            </span>
          </div>
          <div className="bg-card border p-3 rounded-xl flex flex-col justify-center">
            <span className="text-xs text-muted-foreground font-semibold">배낭 담긴 가치</span>
            <span className="text-base font-bold text-emerald-500 font-mono mt-0.5">
              {totalValue} 만원
            </span>
          </div>
        </div>

        {/* Backpack Graphic & Item selection status (Top half of canvas) */}
        <div className="bg-card border rounded-xl p-4 flex flex-col sm:flex-row gap-4 items-center justify-between shadow-sm">
          {/* Backpack Silhouette Illustration */}
          <div className="flex-[1.3] w-full max-w-[240px] flex flex-col items-center justify-center p-3 bg-muted/10 border border-dashed rounded-xl relative">
            <span className="text-xs text-muted-foreground font-semibold mb-2 flex items-center gap-1">
              <Briefcase size={10} /> 배낭 상태
            </span>

            {/* Visual Bag Silhouette */}
            <div className="w-20 h-20 bg-muted/50 rounded-t-2xl rounded-b-lg border-2 border-primary/45 relative flex flex-col items-center justify-end p-2 overflow-hidden shadow-inner">
              {/* Bag Handle */}
              <div className="absolute top-1 w-8 h-2 border-2 border-primary/45 rounded-t-md -translate-y-full" />
              
              {/* Backpack internal items */}
              <div className="flex flex-col gap-0.5 w-full z-10 max-h-[50px] overflow-y-auto">
                <AnimatePresence>
                  {currentStepData && currentStepData.selectedItemIds.length > 0 ? (
                    currentStepData.selectedItemIds.map((id) => {
                      const item = ITEMS.find((i) => i.id === id)!;
                      return (
                        <motion.div
                          key={`bag-item-${id}`}
                          initial={{ opacity: 0, y: -10, scale: 0.9 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.9 }}
                          className="px-1 py-0.5 rounded bg-primary text-primary-foreground text-[10px] font-bold text-center truncate"
                        >
                          {item.name}
                        </motion.div>
                      );
                    })
                  ) : (
                    <div className="text-xs text-muted-foreground/50 text-center pb-2 select-none">비어있음</div>
                  )}
                </AnimatePresence>
              </div>

              {/* Dynamic filled height background */}
              <motion.div
                className="absolute bottom-0 left-0 right-0 bg-primary/10"
                animate={{ height: `${(totalWeight / CAPACITY) * 100}%` }}
                transition={{ duration: 0.4 }}
              />
            </div>

            {/* Capacity gauge bar */}
            <div className="w-full mt-3 space-y-1">
              <div className="flex justify-between text-xs font-bold text-muted-foreground">
                <span>{totalWeight}kg 적재</span>
                <span>{CAPACITY - totalWeight}kg 여유</span>
              </div>
              <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-emerald-500"
                  animate={{ width: `${(totalWeight / CAPACITY) * 100}%` }}
                  transition={{ duration: 0.4 }}
                />
              </div>
            </div>
          </div>

          {/* Item Selector Grid (Status overview) */}
          <div className="flex-1 w-full grid grid-cols-2 gap-2">
            {ITEMS.map((item) => {
              const isSelected = currentStepData?.selectedItemIds.includes(item.id);
              const isCurrentItem = currentStepData?.activeRow === item.id;
              
              let borderClass = "border-border bg-card";
              let statusLabel = "대기";

              if (isSelected) {
                borderClass = "border-emerald-500 bg-emerald-500/5";
                statusLabel = "선택됨";
              } else if (isCurrentItem) {
                borderClass = "border-blue-500 bg-blue-500/5 ring-1 ring-blue-500/40";
                statusLabel = "비교 연산 중";
              }

              return (
                <div key={item.id} className={`p-2 rounded-lg border flex flex-col justify-between gap-1 transition-all duration-300 ${borderClass}`}>
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-foreground">{item.name}</span>
                    <span className={`text-[10px] font-extrabold px-1 rounded-sm ${isSelected ? "text-emerald-600 bg-emerald-100 dark:text-emerald-400 dark:bg-emerald-950/30" : isCurrentItem ? "text-blue-600 bg-blue-100 dark:text-blue-400 dark:bg-blue-950/30 animate-pulse" : "text-muted-foreground bg-muted"}`}>
                      {statusLabel}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground font-mono mt-1">
                    <span>{item.weight}kg</span>
                    <span>{item.value}만원</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* DP Tabulation Table (Bottom half of canvas) */}
        <div className="relative w-full border border-border rounded-xl bg-muted/5 p-3 overflow-x-auto flex flex-col justify-center">
          <div className="min-w-[460px] space-y-2">
            <div className="flex justify-between items-center text-xs text-muted-foreground font-semibold px-1">
              <span>DP 테이블 채우기 (Tabulation) 및 역추적 경로</span>
              {currentStepData?.compareCells && (
                <div className="flex gap-2 text-[11px] items-center">
                  <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-blue-500" /> 결과</span>
                  <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-sky-400" /> 제외(이전행)</span>
                  <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-orange-400" /> 선택(대각선)</span>
                </div>
              )}
            </div>
            
            <div className="grid grid-cols-10 gap-1 text-center font-mono select-none">
              {/* Header: Weights */}
              <div className="flex items-center justify-center font-semibold text-xs text-muted-foreground p-1 border border-transparent">
                아이템 \ W
              </div>
              {Array.from({ length: CAPACITY + 1 }).map((_, w) => (
                <div key={`header-w-${w}`} className="flex items-center justify-center font-bold text-xs bg-muted/50 text-foreground p-1 rounded border border-border/30">
                  {w}kg
                </div>
              ))}

              {/* Rows */}
              {dpTable.map((row, r) => {
                const itemName = r === 0 ? "None" : ITEMS[r - 1].name;
                return (
                  <>
                    <div className="flex items-center justify-start text-xs font-semibold text-muted-foreground text-left p-1 border-r border-border/30 bg-muted/10 truncate rounded">
                      {itemName}
                    </div>
                    {row.map((val, c) => {
                      const className = getCellClassName(r, c);
                      const label = getCellLabel(r, c);
                      return (
                        <motion.div
                          key={`cell-${r}-${c}`}
                          className={`relative flex flex-col items-center justify-center text-xs p-1.5 rounded border transition-all duration-300 ${className}`}
                          style={{ aspectRatio: "1" }}
                        >
                          {label && (
                            <span className="absolute -top-1.5 text-[8px] font-sans font-black px-0.5 rounded bg-background border shadow-sm scale-90">
                              {label}
                            </span>
                          )}
                          <span className={label ? "mt-1 font-mono font-bold" : "font-mono"}>{val}</span>
                        </motion.div>
                      );
                    })}
                  </>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Right Column (5 cols) */}
      <div className="lg:col-span-5 flex flex-col gap-4">
        {/* Python Code Panel */}
        <div className="border border-border rounded-xl bg-muted/20 overflow-hidden flex flex-col">
          <div className="px-4 py-2 border-b border-border bg-muted/30 text-xs font-semibold">Python 구현 코드</div>
          <div className="p-4 font-mono text-xs space-y-0.5 select-none h-auto">
            {PYTHON_CODE.split("\n").map((line, idx) => (
              <div key={idx} className={`flex ${currentStepData && idx + 1 === currentStepData.codeLine ? "text-blue-600 dark:text-blue-400 font-bold bg-blue-500/10 -mx-4 px-4" : "text-muted-foreground"}`}>
                <span className="w-6 opacity-40 text-[10px] select-none">{idx + 1}</span>
                <pre className="whitespace-pre-wrap font-mono">{line || " "}</pre>
              </div>
            ))}
          </div>
        </div>

        {/* Selected Items Detail (HUD List) */}
        <div className="border border-border rounded-xl p-3 bg-muted/5 flex flex-col gap-1.5">
          <div className="font-semibold text-foreground flex items-center gap-1.5 text-xs">
            <List size={12} className="text-emerald-500" /> 가방에 최종 선택된 물건들
          </div>
          <div className="flex gap-1.5 items-center min-h-[36px] flex-wrap">
            <AnimatePresence mode="popLayout">
              {currentStepData && currentStepData.selectedItemIds.length > 0 ? (
                currentStepData.selectedItemIds.map((id) => {
                  const item = ITEMS.find((i) => i.id === id)!;
                  return (
                    <motion.span
                      key={`backpack-item-${id}`}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      className="px-2 py-1 rounded bg-emerald-500/15 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-bold"
                    >
                      {item.name} ({item.weight}kg, {item.value}만원)
                    </motion.span>
                  );
                })
              ) : (
                <span className="text-muted-foreground italic text-xs select-none">
                  비어있음 (역추적 탐색 단계에서 획득이 시작됩니다)
                </span>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Standard Complexity Brief */}
        <div className="border border-border rounded-xl p-3 bg-muted/5 flex flex-col gap-1.5">
          <div className="font-semibold text-foreground flex items-center gap-1.5 text-xs">
            <Award size={12} className="text-primary" /> 상태 요약
          </div>
          <div className="text-xs text-muted-foreground leading-relaxed space-y-1">
            <p>• <b>DP Tabulation:</b> 0행에서 시작해 물건별 최적해를 누적하여 표를 채웁니다.</p>
            <p>• <b>비교 방식:</b> 이전 가치와 신규 대안 가치를 $O(1)$에 비교 검토합니다.</p>
            <p>• <b>역추적:</b> 최종 우측 하단 65만원에서 역산하며 배낭에 포함될 물건들을 결정합니다.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
