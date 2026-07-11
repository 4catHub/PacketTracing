import { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Pause, RotateCcw, ChevronLeft, ChevronRight, Share2, Award, Eye, Clock } from "lucide-react";

interface GraphNode {
  id: number;
  label: string;
  x: number;
  y: number;
}

interface Connection {
  from: number;
  to: number;
  weight: number;
}

const GRAPH_NODES: GraphNode[] = [
  { id: 0, label: "A", x: 60, y: 110 },
  { id: 1, label: "B", x: 160, y: 55 },
  { id: 2, label: "C", x: 160, y: 165 },
  { id: 3, label: "D", x: 260, y: 55 },
  { id: 4, label: "E", x: 260, y: 165 },
  { id: 5, label: "F", x: 340, y: 110 },
];

const CONNECTIONS: Connection[] = [
  { from: 0, to: 1, weight: 4 }, // A - B
  { from: 0, to: 2, weight: 2 }, // A - C
  { from: 1, to: 2, weight: 1 }, // B - C
  { from: 1, to: 3, weight: 5 }, // B - D
  { from: 1, to: 4, weight: 2 }, // B - E
  { from: 2, to: 4, weight: 3 }, // C - E
  { from: 3, to: 5, weight: 1 }, // D - F
  { from: 4, to: 5, weight: 2 }, // E - F
];

interface PQItem {
  node: string;
  dist: number;
}

interface DijkstraStep {
  current: string | null;
  pq: PQItem[];
  distances: Record<string, number>;
  visited: string[];
  codeLine: number;
  activeEdges: [string, string][]; // 현재 완화(Relaxation) 검사 대상 간선들
  shortestPathTree: [string, string][]; // 확정된 최단 경로 트리 간선들
}

const INF = 999; // 무한대 대용

const DIJKSTRA_STEPS: DijkstraStep[] = [
  {
    current: null,
    pq: [{ node: "A", dist: 0 }],
    distances: { A: 0, B: INF, C: INF, D: INF, E: INF, F: INF },
    visited: [],
    codeLine: 3,
    activeEdges: [],
    shortestPathTree: []
  },
  {
    current: "A",
    pq: [{ node: "C", dist: 2 }, { node: "B", dist: 4 }],
    distances: { A: 0, B: 4, C: 2, D: INF, E: INF, F: INF },
    visited: ["A"],
    codeLine: 7,
    activeEdges: [["A", "B"], ["A", "C"]],
    shortestPathTree: []
  },
  {
    current: "C",
    pq: [{ node: "B", dist: 3 }, { node: "E", dist: 5 }],
    distances: { A: 0, B: 3, C: 2, D: INF, E: 5, F: INF },
    visited: ["A", "C"],
    codeLine: 7,
    activeEdges: [["C", "B"], ["C", "E"]],
    shortestPathTree: [["A", "C"]]
  },
  {
    current: "B",
    pq: [{ node: "E", dist: 5 }, { node: "D", dist: 8 }],
    distances: { A: 0, B: 3, C: 2, D: 8, E: 5, F: INF },
    visited: ["A", "C", "B"],
    codeLine: 7,
    activeEdges: [["B", "D"], ["B", "E"]],
    shortestPathTree: [["A", "C"], ["C", "B"]]
  },
  {
    current: "E",
    pq: [{ node: "F", dist: 7 }, { node: "D", dist: 8 }],
    distances: { A: 0, B: 3, C: 2, D: 8, E: 5, F: 7 },
    visited: ["A", "C", "B", "E"],
    codeLine: 7,
    activeEdges: [["E", "F"]],
    shortestPathTree: [["A", "C"], ["C", "B"], ["C", "E"]]
  },
  {
    current: "F",
    pq: [{ node: "D", dist: 8 }],
    distances: { A: 0, B: 3, C: 2, D: 8, E: 5, F: 7 },
    visited: ["A", "C", "B", "E", "F"],
    codeLine: 7,
    activeEdges: [["F", "D"]],
    shortestPathTree: [["A", "C"], ["C", "B"], ["C", "E"], ["E", "F"]]
  },
  {
    current: "D",
    pq: [],
    distances: { A: 0, B: 3, C: 2, D: 8, E: 5, F: 7 },
    visited: ["A", "C", "B", "E", "F", "D"],
    codeLine: 7,
    activeEdges: [],
    shortestPathTree: [["A", "C"], ["C", "B"], ["C", "E"], ["E", "F"], ["B", "D"]]
  },
  {
    current: null,
    pq: [],
    distances: { A: 0, B: 3, C: 2, D: 8, E: 5, F: 7 },
    visited: ["A", "C", "B", "E", "F", "D"],
    codeLine: 17,
    activeEdges: [],
    shortestPathTree: [["A", "C"], ["C", "B"], ["C", "E"], ["E", "F"], ["B", "D"]]
  }
];

const PYTHON_CODE = `def dijkstra(graph, start):
  distances = {node: float('inf') for node in graph}
  distances[start] = 0
  queue = [[0, start]]

  while queue:
    curr_dist, curr_node = heapq.heappop(queue)

    if distances[curr_node] < curr_dist:
      continue

    for neighbor, weight in graph[curr_node].items():
      distance = curr_dist + weight
      if distance < distances[neighbor]:
        distances[neighbor] = distance
        heapq.heappush(queue, [distance, neighbor])

  return distances`;

type NodeState = "unvisited" | "current" | "in_queue" | "visited";

const NODE_STYLES: Record<NodeState, string> = {
  unvisited: "border-border bg-card text-muted-foreground",
  current: "border-blue-400 bg-blue-50 text-blue-600 dark:bg-blue-950/20 ring-4 ring-blue-400 ring-offset-1 dark:ring-offset-background",
  in_queue: "border-amber-400 bg-amber-50 text-amber-600 dark:bg-amber-950/10 dark:text-amber-400",
  visited: "border-emerald-400 bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400",
};

export default function DijkstraViz() {
  const [activeStep, setActiveStep] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(60);

  const total = DIJKSTRA_STEPS.length;
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

  const getNodeState = (label: string): NodeState => {
    if (activeStep < 0) return "unvisited";
    const step = DIJKSTRA_STEPS[activeStep];
    if (step.current === label) return "current";
    if (step.visited.includes(label)) return "visited";
    if (step.pq.some((item) => item.node === label)) return "in_queue";
    return "unvisited";
  };

  const getEdgeState = (fromLabel: string, toLabel: string): "default" | "active" | "shortest" => {
    if (activeStep < 0) return "default";
    const step = DIJKSTRA_STEPS[activeStep];
    
    // 최단 경로 트리 포함 여부 (양방향 대응)
    const isShortest = step.shortestPathTree.some(
      ([u, v]) => (u === fromLabel && v === toLabel) || (u === toLabel && v === fromLabel)
    );
    if (isShortest) return "shortest";

    // 현재 완화 검사 대상 여부
    const isActive = step.activeEdges.some(
      ([u, v]) => (u === fromLabel && v === toLabel) || (u === toLabel && v === fromLabel)
    );
    if (isActive) return "active";

    return "default";
  };

  const currentStepData = activeStep >= 0 ? DIJKSTRA_STEPS[activeStep] : null;

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
            <span className="text-xs text-muted-foreground font-semibold">현재 노드</span>
            <span className="text-base font-bold text-foreground font-mono mt-0.5">
              {currentStepData?.current || "None"}
            </span>
          </div>
          <div className="bg-card border p-3 rounded-xl flex flex-col justify-center">
            <span className="text-xs text-muted-foreground font-semibold">우선순위 큐 대기</span>
            <span className="text-base font-bold text-amber-500 font-mono mt-0.5">
              {currentStepData ? `${currentStepData.pq.length}개` : "1개"}
            </span>
          </div>
          <div className="bg-card border p-3 rounded-xl flex flex-col justify-center">
            <span className="text-xs text-muted-foreground font-semibold">방문 확정 노드</span>
            <span className="text-base font-bold text-emerald-500 font-mono mt-0.5">
              {currentStepData ? `${currentStepData.visited.length} / 6` : "0 / 6"}
            </span>
          </div>
        </div>

        {/* Visual Canvas Area */}
        <div className="relative w-full border border-border rounded-2xl bg-muted/5 overflow-hidden" style={{ aspectRatio: "400 / 220" }}>
          <svg viewBox="0 0 400 220" className="absolute inset-0 w-full h-full pointer-events-none z-0">
            {/* Defs for arrow marker */}
            <defs>
              <marker id="arrow" viewBox="0 0 10 10" refX="22" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                <path d="M 0 0 L 10 5 L 0 10 z" fill="rgba(156, 163, 175, 0.4)" />
              </marker>
              <marker id="arrow-active" viewBox="0 0 10 10" refX="22" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                <path d="M 0 0 L 10 5 L 0 10 z" fill="#f59e0b" />
              </marker>
              <marker id="arrow-shortest" viewBox="0 0 10 10" refX="22" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                <path d="M 0 0 L 10 5 L 0 10 z" fill="#10b981" />
              </marker>
            </defs>

            {/* Render Edges */}
            {CONNECTIONS.map((conn, idx) => {
              const fromNode = GRAPH_NODES.find((n) => n.id === conn.from)!;
              const toNode = GRAPH_NODES.find((n) => n.id === conn.to)!;
              const edgeState = getEdgeState(fromNode.label, toNode.label);

              let strokeColor = "rgba(156, 163, 175, 0.25)";
              let strokeWidth = "1";
              let markerId = "url(#arrow)";

              if (edgeState === "active") {
                strokeColor = "#f59e0b"; // amber-500
                strokeWidth = "2";
                markerId = "url(#arrow-active)";
              } else if (edgeState === "shortest") {
                strokeColor = "#10b981"; // emerald-500
                strokeWidth = "2.5";
                markerId = "url(#arrow-shortest)";
              }

              // 가중치 텍스트 배치 좌표 (중간점)
              const midX = (fromNode.x + toNode.x) / 2;
              const midY = (fromNode.y + toNode.y) / 2 - 6;

              return (
                <g key={`edge-${idx}`}>
                  {/* Line element with key based on activeStep to trigger remount/restart animation */}
                  <motion.line
                    key={`line-${activeStep}-${idx}`}
                    x1={fromNode.x}
                    y1={fromNode.y}
                    x2={toNode.x}
                    y2={toNode.y}
                    stroke={strokeColor}
                    strokeWidth={strokeWidth}
                    markerEnd={markerId}
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 0.4 }}
                  />
                  <text
                    x={midX}
                    y={midY}
                    fill={edgeState === "default" ? "currentColor" : strokeColor}
                    className="text-[11px] font-semibold text-muted-foreground fill-current text-center select-none"
                    textAnchor="middle"
                  >
                    {conn.weight}
                  </text>
                </g>
              );
            })}
          </svg>

          {/* Render Nodes as HTML overlay for better aesthetics */}
          {GRAPH_NODES.map((node) => {
            const state = getNodeState(node.label);
            return (
              <motion.div
                key={node.id}
                style={{ left: `${(node.x / 400) * 100}%`, top: `${(node.y / 220) * 100}%` }}
                animate={state === "current" ? { scale: [1, 1.15, 1], rotate: [0, 5, -5, 0] } : { scale: 1 }}
                transition={{ duration: 0.5 }}
                className={`absolute w-9 h-9 rounded-full border-2 flex items-center justify-center -translate-x-1/2 -translate-y-1/2 font-bold text-sm z-10 transition-colors duration-300 ${NODE_STYLES[state]}`}
              >
                {node.label}
              </motion.div>
            );
          })}
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

        {/* Priority Queue Status Card */}
        <div className="border border-border rounded-xl p-3 bg-muted/5 flex flex-col gap-1.5">
          <div className="font-semibold text-foreground flex items-center gap-1.5 text-xs">
            <Clock size={12} className="text-amber-500" /> 우선순위 큐 (Heap Queue)
          </div>
          <div className="flex gap-1.5 items-center min-h-[32px] flex-wrap">
            <AnimatePresence mode="popLayout">
              {currentStepData && currentStepData.pq.length > 0 ? (
                currentStepData.pq.map((item) => (
                  <motion.span
                    key={`pq-${item.node}-${item.dist}`}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="px-2.5 py-1 rounded bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-xs font-mono font-bold"
                  >
                    [{item.node}: {item.dist}]
                  </motion.span>
                ))
              ) : (
                <span className="text-muted-foreground italic text-xs">Empty (비어있음)</span>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Distance Table Status Card */}
        <div className="border border-border rounded-xl p-3 bg-muted/5 flex flex-col gap-1.5">
          <div className="font-semibold text-foreground flex items-center gap-1.5 text-xs">
            <Award size={12} className="text-emerald-500" /> 최단 거리 테이블 (Distance Table)
          </div>
          <div className="grid grid-cols-6 gap-1 bg-card/50 p-2 rounded-lg border">
            {GRAPH_NODES.map((n) => {
              const distVal = currentStepData ? currentStepData.distances[n.label] : INF;
              const isVisited = currentStepData?.visited.includes(n.label);
              return (
                <div key={n.label} className="flex flex-col items-center p-1 rounded transition-colors duration-200">
                  <span className={`text-xs font-bold ${isVisited ? "text-emerald-500" : "text-muted-foreground"}`}>{n.label}</span>
                  <span className={`text-xs font-mono font-semibold mt-0.5 ${distVal === 0 ? "text-primary" : distVal === INF ? "opacity-30" : "text-foreground"}`}>
                    {distVal === INF ? "∞" : distVal}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
