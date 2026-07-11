import { useState, useEffect, useCallback, useMemo } from "react";
import { motion } from "framer-motion";
import { Play, Pause, RotateCcw, ChevronLeft, ChevronRight, Layers, ListOrdered } from "lucide-react";

// Graph Adjacency List (Tree Structure)
const ADJACENCY_LIST: Record<number, number[]> = {
  0: [1, 2],    // A -> B, C
  1: [3, 4],    // B -> D, E
  2: [5, 6],    // C -> F, G
  3: [],        // D (Leaf)
  4: [],        // E (Leaf)
  5: [],        // F (Leaf)
  6: [],        // G (Leaf)
};

const NODE_LABELS = ["A", "B", "C", "D", "E", "F", "G"];

const GRAPH_NODES = [
  { id: 0, label: "A", x: 200, y: 35 },
  { id: 1, label: "B", x: 100, y: 105 },
  { id: 2, label: "C", x: 300, y: 105 },
  { id: 3, label: "D", x: 50, y: 175 },
  { id: 4, label: "E", x: 150, y: 175 },
  { id: 5, label: "F", x: 250, y: 175 },
  { id: 6, label: "G", x: 350, y: 175 },
];

const CONNECTIONS = [
  { from: 0, to: 1 },
  { from: 0, to: 2 },
  { from: 1, to: 3 },
  { from: 1, to: 4 },
  { from: 2, to: 5 },
  { from: 2, to: 6 },
];

const DFS_STEPS = [
  { current: 0, stack: [2, 1], visited: [0], desc: "시작 노드 A를 방문하고 Stack에 담았던 이웃 노드(C, B) 중 맨 위 노드 B를 탐색 준비합니다.", codeLine: 11 },
  { current: 1, stack: [2, 4, 3], visited: [0, 1], desc: "B를 Stack에서 꺼내 방문 처리하고, B의 자식인 E와 D를 차례로 Stack에 넣습니다. 다음 탐색 대상은 맨 위 노드 D입니다.", codeLine: 11 },
  { current: 3, stack: [2, 4], visited: [0, 1, 3], desc: "D를 꺼내 방문 처리합니다. D는 자식이 없으므로 Stack의 다음 원소인 E를 살펴봅니다.", codeLine: 7 },
  { current: 4, stack: [2], visited: [0, 1, 3, 4], desc: "E를 꺼내 방문 처리합니다. E 역시 자식이 없으므로 Stack의 다음 원소인 C로 돌아갑니다. (Backtracking)", codeLine: 7 },
  { current: 2, stack: [6, 5], visited: [0, 1, 3, 4, 2], desc: "C를 꺼내 방문 처리하고, C의 자식 F, G를 Stack에 넣습니다. 다음 탐색 대상은 F입니다.", codeLine: 11 },
  { current: 5, stack: [6], visited: [0, 1, 3, 4, 2, 5], desc: "F를 꺼내 방문 처리합니다. F는 자식이 없으므로 Stack에 남은 G로 넘어갑니다.", codeLine: 7 },
  { current: 6, stack: [], visited: [0, 1, 3, 4, 2, 5, 6], desc: "G를 꺼내 방문 처리합니다. Stack이 완전히 비었으므로 DFS 깊이 우선 탐색이 종료됩니다.", codeLine: 12 },
];

const BFS_STEPS = [
  { current: 0, queue: [1, 2], visited: [0], desc: "시작 노드 A를 방문하고 Queue에 이웃 노드 B, C를 차례로 삽입합니다. 맨 앞의 B를 꺼내어 다음으로 탐색합니다.", codeLine: 8 },
  { current: 1, queue: [2, 3, 4], visited: [0, 1], desc: "B를 꺼내 방문 처리하고, 자식 D, E를 Queue 뒤쪽에 추가합니다. 대기열 맨 앞의 C를 꺼냅니다.", codeLine: 9 },
  { current: 2, queue: [3, 4, 5, 6], visited: [0, 1, 2], desc: "C를 꺼내 방문 처리하고, 자식 F, G를 Queue 뒤쪽에 추가합니다. 레벨 1 탐색이 끝나고 대기열 맨 앞 D를 꺼냅니다.", codeLine: 9 },
  { current: 3, queue: [4, 5, 6], visited: [0, 1, 2, 3], desc: "D를 꺼내 방문 처리합니다. 자식이 없으므로 Queue 맨 앞의 E를 꺼냅니다.", codeLine: 5 },
  { current: 4, queue: [5, 6], visited: [0, 1, 2, 3, 4], desc: "E를 꺼내 방문 처리합니다. 마찬가지로 다음 원소 F를 꺼냅니다.", codeLine: 5 },
  { current: 5, queue: [6], visited: [0, 1, 2, 3, 4, 5], desc: "F를 꺼내 방문 처리합니다. 마지막 대기 노드 G를 꺼냅니다.", codeLine: 5 },
  { current: 6, queue: [], visited: [0, 1, 2, 3, 4, 5, 6], desc: "G를 꺼내 방문 처리합니다. Queue가 비었으므로 레벨 기반의 BFS 너비 우선 탐색이 종료됩니다.", codeLine: 10 },
];

const DFS_PYTHON = `def dfs(graph, start):
  visited = []
  stack = [start]
  while stack:
    node = stack.pop()
    if node not in visited:
      visited.append(node)
      for neighbor in reversed(graph[node]):
        if neighbor not in visited:
          stack.append(neighbor)
  return visited`;

const BFS_PYTHON = `def bfs(graph, start):
  visited = [start]
  queue = deque([start])
  while queue:
    node = queue.popleft()
    for neighbor in graph[node]:
      if neighbor not in visited:
        visited.append(neighbor)
        queue.append(neighbor)
  return visited`;

type NodeState = "unvisited" | "current" | "in_structure" | "visited";

const NODE_STYLES: Record<NodeState, string> = {
  unvisited: "border-border bg-card text-muted-foreground",
  current: "border-blue-400 bg-blue-50 text-blue-600 dark:bg-blue-950/20 ring-4 ring-blue-400 ring-offset-1 dark:ring-offset-background",
  in_structure: "border-amber-400 bg-amber-50 text-amber-600 dark:bg-amber-950/10 dark:text-amber-400",
  visited: "border-emerald-400 bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400",
};

export default function DfsVsBfsViz() {
  const [mode, setMode] = useState<"DFS" | "BFS">("DFS");
  const [activeStep, setActiveStep] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(60);

  const steps = mode === "DFS" ? DFS_STEPS : BFS_STEPS;
  const total = steps.length;
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

  const getNodeState = (nodeId: number): NodeState => {
    if (activeStep < 0) return "unvisited";
    const step = steps[activeStep];
    if (step.current === nodeId) return "current";
    if (step.visited.includes(nodeId)) return "visited";
    const structureList = mode === "DFS" ? (step as typeof DFS_STEPS[number]).stack : (step as typeof BFS_STEPS[number]).queue;
    if (structureList.includes(nodeId)) return "in_structure";
    return "unvisited";
  };

  const currentStepData = activeStep >= 0 ? steps[activeStep] : null;
  const pythonCode = mode === "DFS" ? DFS_PYTHON : BFS_PYTHON;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      <div className="lg:col-span-7 space-y-5">
        <div className="flex gap-1.5 p-1 bg-muted rounded-lg w-fit">
          <button onClick={() => handleModeChange("DFS")} className={`flex items-center gap-1.5 px-4 py-1.5 rounded-md text-xs font-semibold ${mode === "DFS" ? "bg-background shadow text-primary" : "text-muted-foreground"}`}>
            <Layers size={12} /> DFS
          </button>
          <button onClick={() => handleModeChange("BFS")} className={`flex items-center gap-1.5 px-4 py-1.5 rounded-md text-xs font-semibold ${mode === "BFS" ? "bg-background shadow text-primary" : "text-muted-foreground"}`}>
            <ListOrdered size={12} /> BFS
          </button>
        </div>

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

        <div className="relative w-full border border-border rounded-2xl bg-muted/5 overflow-hidden" style={{ aspectRatio: "400 / 220" }}>
          <svg viewBox="0 0 400 220" className="absolute inset-0 w-full h-full pointer-events-none z-0">
            {CONNECTIONS.map((conn, idx) => {
              const fromNode = GRAPH_NODES.find((n) => n.id === conn.from)!;
              const toNode = GRAPH_NODES.find((n) => n.id === conn.to)!;
              const stateFrom = getNodeState(conn.from);
              const stateTo = getNodeState(conn.to);
              const isPassed = stateFrom === "visited" && stateTo === "visited";
              return <line key={idx} x1={fromNode.x} y1={fromNode.y} x2={toNode.x} y2={toNode.y} stroke={isPassed ? "rgb(52, 211, 153)" : "rgba(156, 163, 175, 0.4)"} strokeWidth={isPassed ? "2" : "1"} />;
            })}
          </svg>
          {GRAPH_NODES.map((node) => {
            const state = getNodeState(node.id);
            return (
              <motion.div
                key={node.id}
                style={{ left: `${(node.x / 400) * 100}%`, top: `${(node.y / 220) * 100}%` }}
                animate={state === "current" ? { scale: [1, 1.1, 1] } : { scale: 1 }}
                className={`absolute w-8 h-8 rounded-full border-2 flex items-center justify-center -translate-x-1/2 -translate-y-1/2 font-bold text-xs z-10 transition-colors duration-300 ${NODE_STYLES[state]}`}
              >
                {node.label}
              </motion.div>
            );
          })}
        </div>
      </div>

      <div className="lg:col-span-5 flex flex-col gap-4">
        <div className="border border-border rounded-xl bg-muted/20 overflow-hidden flex flex-col">
          <div className="px-4 py-2 border-b border-border bg-muted/30 text-xs font-semibold">Python 구현 코드</div>
          <div className="p-4 font-mono text-xs space-y-0.5 select-none h-auto">
            {pythonCode.split("\n").map((line, idx) => (
              <div key={idx} className={`flex ${currentStepData && idx + 1 === currentStepData.codeLine ? "text-blue-600 dark:text-blue-400 font-bold bg-blue-500/10 -mx-4 px-4" : "text-muted-foreground"}`}>
                <span className="w-6 opacity-40 text-[10px] select-none">{idx + 1}</span>
                <pre className="whitespace-pre-wrap font-mono">{line || " "}</pre>
              </div>
            ))}
          </div>
        </div>

        <div className="border border-border rounded-xl p-3 bg-muted/5 flex flex-col gap-1.5">
          <div className="font-semibold text-foreground flex items-center gap-1.5 text-xs">
            <Layers size={12} className="text-amber-500" /> {mode === "DFS" ? "탐색 Stack (LIFO)" : "탐색 Queue (FIFO)"}
          </div>
          <div className="flex gap-1.5 items-center min-h-[30px] flex-wrap">
            {currentStepData ? (
              mode === "DFS" 
                ? (currentStepData as typeof DFS_STEPS[number]).stack.map((item, i) => <span key={i} className="px-2 py-1 rounded bg-amber-500/10 border text-amber-600 text-xs font-bold">{NODE_LABELS[item]}</span>)
                : (currentStepData as typeof BFS_STEPS[number]).queue.map((item, i) => <span key={i} className="px-2 py-1 rounded bg-amber-500/10 border text-amber-600 text-xs font-bold">{NODE_LABELS[item]}</span>)
            ) : <span className="text-muted-foreground italic text-xs">대기 중</span>}
          </div>
        </div>

        <div className="border border-border rounded-xl p-3 bg-muted/5 flex flex-col gap-1.5">
          <div className="font-semibold text-foreground flex items-center gap-1.5 text-xs">
            <ListOrdered size={12} className="text-emerald-500" /> 방문 기록 (Visited)
          </div>
          <div className="flex gap-1.5 items-center min-h-[30px] flex-wrap">
            {currentStepData?.visited.map((item) => <span key={item} className="px-2 py-1 rounded bg-emerald-500/10 border text-emerald-600 text-xs font-bold">{NODE_LABELS[item]}</span>) || <span className="text-muted-foreground italic text-xs">기록 없음</span>}
          </div>
        </div>
      </div>
    </div>
  );
}
