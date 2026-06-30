import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Pause, RotateCcw, ChevronLeft, ChevronRight, Layers, ListOrdered } from "lucide-react";

// Graph Adjacency List (Tree Structure)
// 0: Root A
// 1: B, 2: C
// 3: D, 4: E, 5: F, 6: G
const ADJACENCY = [
  [1, 2], // 0
  [3, 4], // 1
  [5, 6], // 2
  [],     // 3
  [],     // 4
  [],     // 5
  [],     // 6
];

const NODE_LABELS = ["A", "B", "C", "D", "E", "F", "G"];

const GRAPH_NODES = [
  { id: 0, label: "A", x: 200, y: 35 },
  { id: 1, label: "B", x: 100, y: 110 },
  { id: 2, label: "C", x: 300, y: 110 },
  { id: 3, label: "D", x: 50, y: 190 },
  { id: 4, label: "E", x: 150, y: 190 },
  { id: 5, label: "F", x: 250, y: 190 },
  { id: 6, label: "G", x: 350, y: 190 },
];

const CONNECTIONS = [
  { from: 0, to: 1 },
  { from: 0, to: 2 },
  { from: 1, to: 3 },
  { from: 1, to: 4 },
  { from: 2, to: 5 },
  { from: 2, to: 6 },
];

// DFS Steps data
const DFS_STEPS = [
  { current: 0, stack: [2, 1], visited: [0], desc: "시작 노드 A를 방문하고 Stack에 담았던 이웃 노드(C, B) 중 맨 위 노드 B를 탐색 준비합니다." },
  { current: 1, stack: [2, 4, 3], visited: [0, 1], desc: "B를 Stack에서 꺼내 방문 처리하고, B의 자식인 E와 D를 차례로 Stack에 넣습니다. 다음 탐색 대상은 맨 위 노드 D입니다." },
  { current: 3, stack: [2, 4], visited: [0, 1, 3], desc: "D를 꺼내 방문 처리합니다. D는 자식이 없으므로 Stack의 다음 원소인 E를 살펴봅니다." },
  { current: 4, stack: [2], visited: [0, 1, 3, 4], desc: "E를 꺼내 방문 처리합니다. E 역시 자식이 없으므로 Stack의 다음 원소인 C로 돌아갑니다. (Backtracking)" },
  { current: 2, stack: [6, 5], visited: [0, 1, 3, 4, 2], desc: "C를 꺼내 방문 처리하고, C의 자식 F, G를 Stack에 넣습니다. 다음 탐색 대상은 F입니다." },
  { current: 5, stack: [6], visited: [0, 1, 3, 4, 2, 5], desc: "F를 꺼내 방문 처리합니다. F는 자식이 없으므로 Stack에 남은 G로 넘어갑니다." },
  { current: 6, stack: [], visited: [0, 1, 3, 4, 2, 5, 6], desc: "G를 꺼내 방문 처리합니다. Stack이 완전히 비었으므로 DFS 깊이 우선 탐색이 종료됩니다." },
];

// BFS Steps data
const BFS_STEPS = [
  { current: 0, queue: [1, 2], visited: [0], desc: "시작 노드 A를 방문하고 Queue에 이웃 노드 B, C를 차례로 삽입합니다. 맨 앞의 B를 꺼내어 다음으로 탐색합니다." },
  { current: 1, queue: [2, 3, 4], visited: [0, 1], desc: "B를 꺼내 방문 처리하고, 자식 D, E를 Queue 뒤쪽에 추가합니다. 대기열 맨 앞의 C를 꺼냅니다." },
  { current: 2, queue: [3, 4, 5, 6], visited: [0, 1, 2], desc: "C를 꺼내 방문 처리하고, 자식 F, G를 Queue 뒤쪽에 추가합니다. 레벨 1 탐색이 끝나고 대기열 맨 앞 D를 꺼냅니다." },
  { current: 3, queue: [4, 5, 6], visited: [0, 1, 2, 3], desc: "D를 꺼내 방문 처리합니다. 자식이 없으므로 Queue 맨 앞의 E를 꺼냅니다." },
  { current: 4, queue: [5, 6], visited: [0, 1, 2, 3, 4], desc: "E를 꺼내 방문 처리합니다. 마찬가지로 다음 원소 F를 꺼냅니다." },
  { current: 5, queue: [6], visited: [0, 1, 2, 3, 4, 5], desc: "F를 꺼내 방문 처리합니다. 마지막 대기 노드 G를 꺼냅니다." },
  { current: 6, queue: [], visited: [0, 1, 2, 3, 4, 5, 6], desc: "G를 꺼내 방문 처리합니다. Queue가 비었으므로 레벨 기반의 BFS 너비 우선 탐색이 종료됩니다." },
];

type NodeState = "unvisited" | "current" | "in_structure" | "visited";

export default function DfsVsBfsViz() {
  const [mode, setMode] = useState<"DFS" | "BFS">("DFS");
  const [activeStep, setActiveStep] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(false);

  const steps = mode === "DFS" ? DFS_STEPS : BFS_STEPS;
  const total = steps.length;
  const isComplete = activeStep >= total - 1;

  useEffect(() => {
    if (!isPlaying) return;
    if (isComplete) {
      setIsPlaying(false);
      return;
    }
    const t = setTimeout(() => setActiveStep((p) => p + 1), 2200);
    return () => clearTimeout(t);
  }, [isPlaying, activeStep, isComplete]);

  // 모드 변경 시 리셋
  const handleModeChange = (newMode: "DFS" | "BFS") => {
    setIsPlaying(false);
    setMode(newMode);
    setActiveStep(-1);
  };

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

  const progress = ((activeStep + 1) / total) * 100;

  // 특정 노드의 실시간 상태 계산
  const getNodeState = (nodeId: number): NodeState => {
    if (activeStep < 0) return "unvisited";
    const step = steps[activeStep];
    if (step.current === nodeId) return "current";
    if (step.visited.includes(nodeId)) return "visited";

    const structureList = mode === "DFS"
      ? (step as typeof DFS_STEPS[number]).stack
      : (step as typeof BFS_STEPS[number]).queue;

    if (structureList.includes(nodeId)) return "in_structure";
    return "unvisited";
  };

  const NODE_STYLES: Record<NodeState, string> = {
    unvisited: "border-border bg-card text-muted-foreground",
    current: "border-blue-400 bg-blue-50 text-blue-600 dark:bg-blue-950/20 ring-4 ring-blue-400 ring-offset-1 dark:ring-offset-background",
    in_structure: "border-amber-400 bg-amber-50 text-amber-600 dark:bg-amber-950/10 dark:text-amber-400",
    visited: "border-emerald-400 bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400",
  };

  const currentStepData = activeStep >= 0 ? steps[activeStep] : null;

  return (
    <div className="space-y-5">
      {/* Mode Selectors */}
      <div className="flex gap-1.5 p-1 bg-muted rounded-lg w-fit">
        <button
          onClick={() => handleModeChange("DFS")}
          className={`flex items-center gap-1.5 px-4 py-1.5 rounded-md text-xs font-semibold transition-all ${
            mode === "DFS" ? "bg-background text-foreground shadow" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Layers size={13} />
          DFS (깊이 우선 - Stack)
        </button>
        <button
          onClick={() => handleModeChange("BFS")}
          className={`flex items-center gap-1.5 px-4 py-1.5 rounded-md text-xs font-semibold transition-all ${
            mode === "BFS" ? "bg-background text-foreground shadow" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <ListOrdered size={13} />
          BFS (너비 우선 - Queue)
        </button>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-2 flex-wrap">
        <button
          onClick={handleReset}
          className="p-2 rounded-lg border border-card-border bg-card hover:bg-muted text-muted-foreground transition-colors"
          data-testid="button-reset"
        >
          <RotateCcw size={15} />
        </button>
        <button
          onClick={handlePrev}
          disabled={activeStep < 0}
          className="p-2 rounded-lg border border-card-border bg-card hover:bg-muted text-muted-foreground disabled:opacity-40 transition-colors"
          data-testid="button-prev"
        >
          <ChevronLeft size={15} />
        </button>
        <button
          onClick={handlePlay}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:opacity-90 text-sm font-medium transition-opacity"
          data-testid="button-play-pause"
        >
          {isPlaying ? <Pause size={14} /> : <Play size={14} />}
          {isComplete ? "다시 보기" : isPlaying ? "일시정지" : activeStep < 0 ? "탐색 시작" : "계속"}
        </button>
        <button
          onClick={handleNext}
          disabled={isComplete}
          className="p-2 rounded-lg border border-card-border bg-card hover:bg-muted text-muted-foreground disabled:opacity-40 transition-colors"
          data-testid="button-next"
        >
          <ChevronRight size={15} />
        </button>
        <div className="flex-1 space-y-1">
          <div className="text-xs text-muted-foreground">
            {activeStep >= 0 ? `단계 ${activeStep + 1} / ${total}` : "대기 중"}
          </div>
          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-primary rounded-full"
              animate={{ width: `${Math.max(0, progress)}%` }}
              transition={{ duration: 0.4 }}
            />
          </div>
        </div>
      </div>

      {/* Visual Canvas Area */}
      <div className="relative w-full max-w-[420px] h-[240px] mx-auto border border-border rounded-2xl bg-muted/5 overflow-hidden">
        {/* SVG Connections */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
          {CONNECTIONS.map((conn, idx) => {
            const fromNode = GRAPH_NODES.find((n) => n.id === conn.from)!;
            const toNode = GRAPH_NODES.find((n) => n.id === conn.to)!;
            const stateFrom = getNodeState(conn.from);
            const stateTo = getNodeState(conn.to);
            const isPassed = stateFrom === "visited" && stateTo === "visited";

            return (
              <line
                key={idx}
                x1={fromNode.x}
                y1={fromNode.y}
                x2={toNode.x}
                y2={toNode.y}
                stroke="currentColor"
                strokeWidth={isPassed ? "2" : "1"}
                className={isPassed ? "text-emerald-400" : "text-border/40"}
              />
            );
          })}
        </svg>

        {/* Node Elements */}
        {GRAPH_NODES.map((node) => {
          const state = getNodeState(node.id);
          return (
            <motion.div
              key={node.id}
              style={{ left: node.x, top: node.y }}
              animate={state === "current" ? { scale: [1, 1.1, 1] } : { scale: 1 }}
              transition={state === "current" ? { repeat: Infinity, duration: 1.2, ease: "easeInOut" } : {}}
              className={`absolute flex items-center justify-center w-8 h-8 rounded-full border-2 text-[10px] font-bold -translate-x-1/2 -translate-y-1/2 transition-colors duration-300 z-10 ${NODE_STYLES[state]}`}
            >
              {node.label}
            </motion.div>
          );
        })}
      </div>

      {/* Traversal State: Stack/Queue & Visited */}
      <div className="grid grid-cols-2 gap-3 text-xs">
        {/* Data Structure State (Stack or Queue) */}
        <div className="border border-border rounded-xl p-3 bg-muted/5 flex flex-col gap-1.5">
          <div className="font-semibold text-foreground flex items-center gap-1.5 text-[11px]">
            <Layers size={12} className="text-amber-500" />
            {mode === "DFS" ? "탐색 Stack (LIFO)" : "탐색 Queue (FIFO)"}
          </div>
          <div className="flex gap-1.5 items-center min-h-[30px] flex-wrap">
            {currentStepData ? (
              mode === "DFS" ? (
                // Stack layout: reverse sequence to show Top at right
                (currentStepData as typeof DFS_STEPS[number]).stack.map((item, i) => (
                  <span key={i} className="px-2 py-1 rounded bg-amber-500/10 border border-amber-400/40 text-amber-600 dark:text-amber-400 font-bold text-[10px]">
                    {NODE_LABELS[item]} {i === (currentStepData as typeof DFS_STEPS[number]).stack.length - 1 && " (Top)"}
                  </span>
                ))
              ) : (
                // Queue layout: show head at left
                (currentStepData as typeof BFS_STEPS[number]).queue.map((item, i) => (
                  <span key={i} className="px-2 py-1 rounded bg-amber-500/10 border border-amber-400/40 text-amber-600 dark:text-amber-400 font-bold text-[10px]">
                    {NODE_LABELS[item]} {i === 0 && " (Front)"}
                  </span>
                ))
              )
            ) : (
              <span className="text-muted-foreground italic text-[10px]">대기열이 비어 있습니다.</span>
            )}
          </div>
        </div>

        {/* Visited List */}
        <div className="border border-border rounded-xl p-3 bg-muted/5 flex flex-col gap-1.5">
          <div className="font-semibold text-foreground flex items-center gap-1.5 text-[11px]">
            <ListOrdered size={12} className="text-emerald-500" />
            방문 기록 (Visited)
          </div>
          <div className="flex gap-1.5 items-center min-h-[30px] flex-wrap">
            {currentStepData && currentStepData.visited.length > 0 ? (
              currentStepData.visited.map((item) => (
                <span key={item} className="px-2 py-1 rounded bg-emerald-500/10 border border-emerald-400/40 text-emerald-600 dark:text-emerald-400 font-bold text-[10px]">
                  {NODE_LABELS[item]}
                </span>
              ))
            ) : (
              <span className="text-muted-foreground italic text-[10px]">방문 기록 없음</span>
            )}
          </div>
        </div>
      </div>

      {/* Step Callout */}
      <AnimatePresence mode="wait">
        {currentStepData && (
          <motion.div
            key={activeStep}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="p-3.5 rounded-xl border border-blue-200 dark:border-blue-900/60 bg-blue-50/50 dark:bg-blue-950/20"
          >
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              {currentStepData.desc}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
