import { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Play,
  Pause,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  Search,
  Database,
  Award,
  ArrowRight,
  Network,
  List
} from "lucide-react";

// B+ Tree Node structure
interface BPlusNode {
  id: string;
  keys: number[];
  children?: string[]; // Child node IDs (internal only)
  values?: string[]; // Records / pointers to data (leaf only)
  next?: string; // Next leaf pointer (leaf only)
  isLeaf: boolean;
  x: number; // percentage X position for center of node
  y: number; // percentage Y position for center of node
}

// Fixed B+ Tree structure for visualization
const TREE_NODES: Record<string, BPlusNode> = {
  root: {
    id: "root",
    keys: [15],
    children: ["internal_left", "internal_right"],
    isLeaf: false,
    x: 50,
    y: 15,
  },
  internal_left: {
    id: "internal_left",
    keys: [5, 10],
    children: ["leaf_0", "leaf_1", "leaf_2"],
    isLeaf: false,
    x: 28,
    y: 45,
  },
  internal_right: {
    id: "internal_right",
    keys: [25, 35],
    children: ["leaf_3", "leaf_4", "leaf_5"],
    isLeaf: false,
    x: 72,
    y: 45,
  },
  leaf_0: {
    id: "leaf_0",
    keys: [2, 3],
    values: ["Rec_2", "Rec_3"],
    next: "leaf_1",
    isLeaf: true,
    x: 10,
    y: 80,
  },
  leaf_1: {
    id: "leaf_1",
    keys: [5, 8],
    values: ["Rec_5", "Rec_8"],
    next: "leaf_2",
    isLeaf: true,
    x: 26,
    y: 80,
  },
  leaf_2: {
    id: "leaf_2",
    keys: [10, 12],
    values: ["Rec_10", "Rec_12"],
    next: "leaf_3",
    isLeaf: true,
    x: 42,
    y: 80,
  },
  leaf_3: {
    id: "leaf_3",
    keys: [15, 20],
    values: ["Rec_15", "Rec_20"],
    next: "leaf_4",
    isLeaf: true,
    x: 58,
    y: 80,
  },
  leaf_4: {
    id: "leaf_4",
    keys: [25, 30],
    values: ["Rec_25", "Rec_30"],
    next: "leaf_5",
    isLeaf: true,
    x: 74,
    y: 80,
  },
  leaf_5: {
    id: "leaf_5",
    keys: [35, 40],
    values: ["Rec_35", "Rec_40"],
    next: undefined,
    isLeaf: true,
    x: 90,
    y: 80,
  },
};

interface SearchStep {
  currentNodeId: string | null;
  currentKeyIndex: number | null; // index of key being compared inside the node
  targetKey: number;
  highlightedKeys: { nodeId: string; keyIndex: number }[]; // keys compared in current node
  found: boolean;
  value: string | null;
  label: string;
  codeLine: number;
  variables: Record<string, any>;
  path: string[]; // List of node IDs traversed so far
}

// Generate the search steps dynamically based on target key
function generateSteps(targetKey: number): SearchStep[] {
  const steps: SearchStep[] = [];
  let currentNodeId = "root";
  const path: string[] = ["root"];

  // Step 0: Start search at root
  steps.push({
    currentNodeId,
    currentKeyIndex: null,
    targetKey,
    highlightedKeys: [],
    found: false,
    value: null,
    label: `루트 노드(root)에서 대상 키 ${targetKey}의 검색을 시작합니다.`,
    codeLine: 2,
    variables: { "node": currentNodeId, "key": targetKey, "node.is_leaf": false },
    path: [...path]
  });

  while (true) {
    const node = TREE_NODES[currentNodeId];
    if (node.isLeaf) {
      break;
    }

    // Step: Check while not node.is_leaf
    steps.push({
      currentNodeId,
      currentKeyIndex: null,
      targetKey,
      highlightedKeys: [],
      found: false,
      value: null,
      label: `현재 노드가 단말(Leaf) 노드가 아니므로 자식으로 이동하기 위한 인덱스 분기를 탑색합니다.`,
      codeLine: 3,
      variables: { "node": currentNodeId, "key": targetKey, "node.is_leaf": false },
      path: [...path]
    });

    let idx = 0;
    const highlightedKeys: { nodeId: string; keyIndex: number }[] = [];
    
    // Step: initialize idx = 0
    steps.push({
      currentNodeId,
      currentKeyIndex: null,
      targetKey,
      highlightedKeys: [...highlightedKeys],
      found: false,
      value: null,
      label: `인덱스 idx를 0으로 초기화합니다.`,
      codeLine: 4,
      variables: { "node": currentNodeId, "key": targetKey, "idx": idx },
      path: [...path]
    });

    while (idx < node.keys.length) {
      highlightedKeys.push({ nodeId: currentNodeId, keyIndex: idx });
      const compareKey = node.keys[idx];
      
      if (targetKey >= compareKey) {
        steps.push({
          currentNodeId,
          currentKeyIndex: idx,
          targetKey,
          highlightedKeys: [...highlightedKeys],
          found: false,
          value: null,
          label: `대상 키 ${targetKey}가 현재 키 ${compareKey}보다 크거나 같으므로(key >= keys[idx]) idx를 증가시킵니다.`,
          codeLine: 5,
          variables: { "node": currentNodeId, "key": targetKey, "idx": idx, "node.keys[idx]": compareKey },
          path: [...path]
        });
        idx++;
        steps.push({
          currentNodeId,
          currentKeyIndex: null,
          targetKey,
          highlightedKeys: [...highlightedKeys],
          found: false,
          value: null,
          label: `인덱스 idx가 ${idx}로 증가했습니다.`,
          codeLine: 6,
          variables: { "node": currentNodeId, "key": targetKey, "idx": idx },
          path: [...path]
        });
      } else {
        steps.push({
          currentNodeId,
          currentKeyIndex: idx,
          targetKey,
          highlightedKeys: [...highlightedKeys],
          found: false,
          value: null,
          label: `대상 키 ${targetKey}가 현재 키 ${compareKey}보다 작으므로 분기 비교 루프를 종료합니다.`,
          codeLine: 5,
          variables: { "node": currentNodeId, "key": targetKey, "idx": idx, "node.keys[idx]": compareKey },
          path: [...path]
        });
        break;
      }
    }

    if (idx === node.keys.length && node.keys.length > 0) {
      steps.push({
        currentNodeId,
        currentKeyIndex: null,
        targetKey,
        highlightedKeys: [...highlightedKeys],
        found: false,
        value: null,
        label: `대상 키 ${targetKey}가 노드의 모든 키보다 크거나 같으므로 가장 오른쪽 자식 노드로 이동합니다.`,
        codeLine: 5,
        variables: { "node": currentNodeId, "key": targetKey, "idx": idx },
        path: [...path]
      });
    }

    const nextNodeId = node.children![idx];
    path.push(nextNodeId);
    currentNodeId = nextNodeId;

    // Step: move to child
    steps.push({
      currentNodeId,
      currentKeyIndex: null,
      targetKey,
      highlightedKeys: [],
      found: false,
      value: null,
      label: `인덱스 ${idx}번째 자식 노드(${currentNodeId})로 내려갑니다.`,
      codeLine: 7,
      variables: { "node": currentNodeId, "key": targetKey, "idx": idx },
      path: [...path]
    });
  }

  // Now we are at a leaf node
  const leafNode = TREE_NODES[currentNodeId];
  steps.push({
    currentNodeId,
    currentKeyIndex: null,
    targetKey,
    highlightedKeys: [],
    found: false,
    value: null,
    label: `단말(Leaf) 노드(${currentNodeId})에 도달했습니다. 선형 탐색을 시작합니다.`,
    codeLine: 9,
    variables: { "node": currentNodeId, "key": targetKey, "node.is_leaf": true },
    path: [...path]
  });

  let foundIndex = -1;
  const leafHighlightedKeys: { nodeId: string; keyIndex: number }[] = [];

  for (let i = 0; i < leafNode.keys.length; i++) {
    leafHighlightedKeys.push({ nodeId: currentNodeId, keyIndex: i });
    const cmpKey = leafNode.keys[i];

    if (cmpKey === targetKey) {
      foundIndex = i;
      steps.push({
        currentNodeId,
        currentKeyIndex: i,
        targetKey,
        highlightedKeys: [...leafHighlightedKeys],
        found: false,
        value: null,
        label: `비교: 단말 노드의 키 ${cmpKey}가 대상 키 ${targetKey}와 일치합니다.`,
        codeLine: 10,
        variables: { "node": currentNodeId, "key": targetKey, "i": i, "node.keys[i]": cmpKey },
        path: [...path]
      });
      break;
    } else {
      steps.push({
        currentNodeId,
        currentKeyIndex: i,
        targetKey,
        highlightedKeys: [...leafHighlightedKeys],
        found: false,
        value: null,
        label: `비교: 단말 노드의 키 ${cmpKey}가 대상 키 ${targetKey}와 일치하지 않습니다.`,
        codeLine: 10,
        variables: { "node": currentNodeId, "key": targetKey, "i": i, "node.keys[i]": cmpKey },
        path: [...path]
      });
    }
  }

  if (foundIndex !== -1) {
    const foundValue = leafNode.values![foundIndex];
    steps.push({
      currentNodeId,
      currentKeyIndex: foundIndex,
      targetKey,
      highlightedKeys: [...leafHighlightedKeys],
      found: true,
      value: foundValue,
      label: `탐색 성공: 키 ${targetKey}에 매핑된 데이터 레코드 '${foundValue}'를 찾았습니다!`,
      codeLine: 11,
      variables: { "node": currentNodeId, "key": targetKey, "found": true, "record": foundValue },
      path: [...path]
    });
  } else {
    steps.push({
      currentNodeId,
      currentKeyIndex: null,
      targetKey,
      highlightedKeys: [...leafHighlightedKeys],
      found: false,
      value: null,
      label: `탐색 실패: 단말 노드에서 일치하는 키를 찾지 못했습니다. 대상 키 ${targetKey}는 트리에 없습니다.`,
      codeLine: 12,
      variables: { "node": currentNodeId, "key": targetKey, "found": false },
      path: [...path]
    });
  }

  return steps;
}

const PYTHON_CODE = `def b_plus_tree_search(root, key):
  node = root
  while not node.is_leaf:
    idx = 0
    while idx < len(node.keys) and key >= node.keys[idx]:
      idx += 1
    node = node.children[idx]
  
  for i in range(len(node.keys)):
    if node.keys[i] == key:
      return node.values[i]
  return None`;

export default function BPlusTreeViz() {
  const [targetKey, setTargetKey] = useState(25);
  const [customInput, setCustomInput] = useState("25");
  const [steps, setSteps] = useState<SearchStep[]>(() => generateSteps(25));
  const [activeStep, setActiveStep] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(true);
  const [speed, setSpeed] = useState(60);

  const total = steps.length;
  const isComplete = activeStep >= total - 1;

  // Compute speed in milliseconds
  const speedMs = useMemo(() => {
    const MAX = 2200;
    const MIN = 150;
    return Math.round(MAX - (speed / 100) * (MAX - MIN));
  }, [speed]);

  // Handle auto-playing logic with auto-restart loop
  useEffect(() => {
    if (!isPlaying) return;
    if (isComplete) {
      const t = setTimeout(() => {
        setActiveStep(-1);
      }, 3000); // Wait 3 seconds at complete state before looping back
      return () => clearTimeout(t);
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

  const currentStepData = activeStep >= 0 ? steps[activeStep] : null;

  // Handle Preset Selection - Trigger autoplay immediately
  const handleSearchSelect = (key: number) => {
    setTargetKey(key);
    setCustomInput(key.toString());
    const newSteps = generateSteps(key);
    setSteps(newSteps);
    setActiveStep(-1);
    setIsPlaying(false);
  };

  // Handle Custom Input Search
  const handleCustomSearch = () => {
    const num = parseInt(customInput, 10);
    if (!isNaN(num)) {
      handleSearchSelect(num);
    }
  };

  const getCellLabel = (nodeId: string, idx: number): string | null => {
    if (!currentStepData) return null;
    const node = TREE_NODES[nodeId];
    if (node.isLeaf) {
      if (currentStepData.currentNodeId === nodeId && currentStepData.currentKeyIndex === idx) {
        return node.keys[idx] === targetKey ? "일치" : "불일치";
      }
    } else {
      if (currentStepData.currentNodeId === nodeId && currentStepData.currentKeyIndex === idx) {
        return targetKey >= node.keys[idx] ? ">= 참" : "< 거짓";
      }
    }
    return null;
  };

  const isBranchTraversed = (fromId: string, toId: string) => {
    if (!currentStepData) return false;
    const fromIdx = currentStepData.path.indexOf(fromId);
    return fromIdx !== -1 && currentStepData.path[fromIdx + 1] === toId;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Left Column (7 cols) */}
      <div className="lg:col-span-7 space-y-4">
        {/* Playback Controls Panel - Minimalist layout, auto-running by default */}
        <div className="flex items-center justify-between gap-4 bg-slate-50/50 dark:bg-slate-900/30 px-3 py-1.5 rounded-xl border border-border/60 text-xs shadow-sm">
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <button
              onClick={handleReset}
              className="p-1 rounded bg-card hover:bg-muted border border-border/80 text-muted-foreground transition-colors"
              title="Reset simulation"
            >
              <RotateCcw size={12} />
            </button>
            <button
              onClick={handlePrev}
              className="p-1 rounded bg-card hover:bg-muted border border-border/80 text-muted-foreground transition-colors"
              disabled={activeStep < 0}
              title="Previous step"
            >
              <ChevronLeft size={12} />
            </button>
            <button
              onClick={handlePlay}
              className="flex items-center gap-1 px-2.5 py-1 rounded bg-primary text-primary-foreground hover:opacity-90 font-medium text-[10px] transition-opacity"
            >
              {isPlaying ? <Pause size={10} /> : <Play size={10} />}
              <span>{isPlaying ? "Pause" : "Play"}</span>
            </button>
            <button
              onClick={handleNext}
              className="p-1 rounded bg-card hover:bg-muted border border-border/80 text-muted-foreground transition-colors"
              disabled={isComplete}
              title="Next step"
            >
              <ChevronRight size={12} />
            </button>
          </div>
          <div className="flex-1 max-w-sm flex items-center gap-3">
            <span className="text-[10px] font-mono text-muted-foreground font-bold whitespace-nowrap">
              {activeStep < 0 ? "READY" : activeStep >= total - 1 ? "DONE" : `STEP ${activeStep + 1}/${total}`}
            </span>
            <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all duration-200"
                style={{ width: `${total > 0 ? ((activeStep + 1) / total) * 100 : 0}%` }}
              />
            </div>
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <span className="text-[9px] text-muted-foreground font-mono">{speedMs}ms</span>
            <input
              type="range"
              min={0}
              max={100}
              value={speed}
              onChange={(e) => setSpeed(Number(e.target.value))}
              className="w-12 h-1 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
            />
          </div>
        </div>

        {/* Variables HUD */}
        <div className="grid grid-cols-4 gap-2">
          <div className="bg-card border p-2.5 rounded-xl flex flex-col justify-center">
            <span className="text-[10px] text-muted-foreground font-semibold">대상 키 (key)</span>
            <span className="text-sm font-black text-primary font-mono mt-0.5">
              {targetKey}
            </span>
          </div>
          <div className="bg-card border p-2.5 rounded-xl flex flex-col justify-center">
            <span className="text-[10px] text-muted-foreground font-semibold">현재 노드</span>
            <span className="text-xs font-bold text-foreground truncate mt-0.5">
              {currentStepData?.currentNodeId ? (
                currentStepData.currentNodeId === "root"
                  ? "Root"
                  : currentStepData.currentNodeId === "internal_left"
                  ? "Internal Left"
                  : currentStepData.currentNodeId === "internal_right"
                  ? "Internal Right"
                  : `Leaf ${currentStepData.currentNodeId.split("_")[1]}`
              ) : (
                "-"
              )}
            </span>
          </div>
          <div className="bg-card border p-2.5 rounded-xl flex flex-col justify-center">
            <span className="text-[10px] text-muted-foreground font-semibold">변수 값 (idx / i)</span>
            <span className="text-xs font-bold font-mono text-amber-500 mt-0.5">
              {currentStepData ? (
                currentStepData.variables.idx !== undefined
                  ? `idx = ${currentStepData.variables.idx}`
                  : currentStepData.variables.i !== undefined
                  ? `i = ${currentStepData.variables.i}`
                  : "-"
              ) : (
                "-"
              )}
            </span>
          </div>
          <div className="bg-card border p-2.5 rounded-xl flex flex-col justify-center">
            <span className="text-[10px] text-muted-foreground font-semibold">검색 상태</span>
            <span className={`text-xs font-bold mt-0.5 ${
              currentStepData?.found
                ? "text-emerald-500"
                : activeStep >= total - 1
                ? "text-rose-500"
                : "text-blue-500 animate-pulse"
            }`}>
              {currentStepData?.found ? "성공 (Found)" : activeStep >= total - 1 ? "실패 (Not Found)" : activeStep < 0 ? "대기" : "탐색 중..."}
            </span>
          </div>
        </div>

        {/* Dynamic Preset Search Controls */}
        <div className="flex flex-wrap items-center gap-2 bg-muted/10 p-2.5 rounded-xl border border-border/40">
          <span className="text-xs text-muted-foreground font-semibold flex items-center gap-1">
            <Search size={12} /> 탐색 타겟 선택:
          </span>
          {[15, 8, 30, 9, 40].map((k) => (
            <button
              key={k}
              onClick={() => handleSearchSelect(k)}
              className={`px-2.5 py-1 text-xs rounded-md border transition-all ${
                targetKey === k
                  ? "bg-primary text-primary-foreground border-primary font-bold shadow-sm"
                  : "bg-card hover:bg-muted/50 border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              키 {k} {k === 9 ? "(실패)" : ""}
            </button>
          ))}
          
          <div className="flex items-center gap-1.5 ml-auto border-l pl-3 border-border/40">
            <input
              type="number"
              value={customInput}
              onChange={(e) => setCustomInput(e.target.value)}
              placeholder="직접 입력"
              className="w-16 px-2 py-1 text-xs rounded border bg-card text-foreground font-mono focus:outline-none focus:ring-1 focus:ring-primary"
            />
            <button
              onClick={handleCustomSearch}
              className="px-2.5 py-1 text-xs rounded bg-muted hover:bg-primary hover:text-primary-foreground border border-border/60 transition-colors"
            >
              검색
            </button>
          </div>
        </div>

        {/* B+ Tree Visual Canvas Area */}
        <div
          className="relative w-full border border-border rounded-xl bg-card dark:bg-zinc-950/20 overflow-hidden shadow-inner flex flex-col justify-center"
          style={{ aspectRatio: "800 / 380" }}
        >
          {/* SVG Connection Lines */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none z-0" viewBox="0 0 100 100" preserveAspectRatio="none">
            <defs>
              <marker
                id="emerald-arrow"
                viewBox="0 0 10 10"
                refX="8"
                refY="5"
                markerWidth="6"
                markerHeight="6"
                orient="auto"
              >
                <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#10b981" />
              </marker>
            </defs>

            {/* Tree Branch Links */}
            {/* Root to internal_left */}
            <line
              x1={45} y1={19} x2={28} y2={41}
              strokeWidth={isBranchTraversed("root", "internal_left") ? 3.0 : 1.2}
              className={`transition-all duration-300 ${
                isBranchTraversed("root", "internal_left")
                  ? "stroke-blue-500 dark:stroke-blue-400"
                  : "stroke-zinc-300 dark:stroke-zinc-700 opacity-60"
              }`}
            />
            {/* Root to internal_right */}
            <line
              x1={55} y1={19} x2={72} y2={41}
              strokeWidth={isBranchTraversed("root", "internal_right") ? 3.0 : 1.2}
              className={`transition-all duration-300 ${
                isBranchTraversed("root", "internal_right")
                  ? "stroke-blue-500 dark:stroke-blue-400"
                  : "stroke-zinc-300 dark:stroke-zinc-700 opacity-60"
              }`}
            />

            {/* Internal Left to Leaves */}
            <line
              x1={22} y1={49} x2={10} y2={76}
              strokeWidth={isBranchTraversed("internal_left", "leaf_0") ? 3.0 : 1.2}
              className={`transition-all duration-300 ${
                isBranchTraversed("internal_left", "leaf_0")
                  ? "stroke-blue-500 dark:stroke-blue-400"
                  : "stroke-zinc-300 dark:stroke-zinc-700 opacity-60"
              }`}
            />
            <line
              x1={28} y1={49} x2={26} y2={76}
              strokeWidth={isBranchTraversed("internal_left", "leaf_1") ? 3.0 : 1.2}
              className={`transition-all duration-300 ${
                isBranchTraversed("internal_left", "leaf_1")
                  ? "stroke-blue-500 dark:stroke-blue-400"
                  : "stroke-zinc-300 dark:stroke-zinc-700 opacity-60"
              }`}
            />
            <line
              x1={34} y1={49} x2={42} y2={76}
              strokeWidth={isBranchTraversed("internal_left", "leaf_2") ? 3.0 : 1.2}
              className={`transition-all duration-300 ${
                isBranchTraversed("internal_left", "leaf_2")
                  ? "stroke-blue-500 dark:stroke-blue-400"
                  : "stroke-zinc-300 dark:stroke-zinc-700 opacity-60"
              }`}
            />

            {/* Internal Right to Leaves */}
            <line
              x1={66} y1={49} x2={58} y2={76}
              strokeWidth={isBranchTraversed("internal_right", "leaf_3") ? 3.0 : 1.2}
              className={`transition-all duration-300 ${
                isBranchTraversed("internal_right", "leaf_3")
                  ? "stroke-blue-500 dark:stroke-blue-400"
                  : "stroke-zinc-300 dark:stroke-zinc-700 opacity-60"
              }`}
            />
            <line
              x1={72} y1={49} x2={74} y2={76}
              strokeWidth={isBranchTraversed("internal_right", "leaf_4") ? 3.0 : 1.2}
              className={`transition-all duration-300 ${
                isBranchTraversed("internal_right", "leaf_4")
                  ? "stroke-blue-500 dark:stroke-blue-400"
                  : "stroke-zinc-300 dark:stroke-zinc-700 opacity-60"
              }`}
            />
            <line
              x1={78} y1={49} x2={90} y2={76}
              strokeWidth={isBranchTraversed("internal_right", "leaf_5") ? 3.0 : 1.2}
              className={`transition-all duration-300 ${
                isBranchTraversed("internal_right", "leaf_5")
                  ? "stroke-blue-500 dark:stroke-blue-400"
                  : "stroke-zinc-300 dark:stroke-zinc-700 opacity-60"
              }`}
            />

            {/* Leaf Nodes Sequential Linked List Links */}
            {Array.from({ length: 5 }).map((_, idx) => {
              const currentLeaf = TREE_NODES[`leaf_${idx}`];
              const nextLeaf = TREE_NODES[`leaf_${idx + 1}`];
              return (
                <path
                  key={`leaf-link-${idx}`}
                  d={`M ${currentLeaf.x + 3.8} 83 Q ${(currentLeaf.x + nextLeaf.x) / 2} 87 ${nextLeaf.x - 3.8} 83`}
                  fill="none"
                  strokeWidth={1.5}
                  strokeDasharray="3,3"
                  className="stroke-emerald-500/50 dark:stroke-emerald-400/40"
                  markerEnd="url(#emerald-arrow)"
                />
              );
            })}
          </svg>

          {/* HTML Overlay Nodes */}
          {Object.entries(TREE_NODES).map(([nodeId, node]) => {
            const isCurrentNode = currentStepData?.currentNodeId === nodeId;
            const isInPath = currentStepData?.path.includes(nodeId) ?? false;

            return (
              <motion.div
                key={nodeId}
                className={`absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center bg-card border-2 rounded-lg shadow-sm select-none transition-all duration-300 ${
                  isCurrentNode
                    ? "border-blue-500 ring-4 ring-blue-500/20 z-20 scale-105"
                    : isInPath
                    ? "border-violet-500 dark:border-violet-400 z-10"
                    : "border-border/80"
                }`}
                style={{
                  left: `${node.x}%`,
                  top: `${node.y}%`,
                  width: node.isLeaf ? "13%" : node.id === "root" ? "9%" : "12%",
                }}
              >
                {/* Node type header label */}
                <div
                  className={`w-full text-center text-[9px] font-bold uppercase tracking-wider py-0.5 border-b ${
                    isCurrentNode
                      ? "bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/20"
                      : isInPath
                      ? "bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/20"
                      : "bg-muted/50 text-muted-foreground border-border/50"
                  }`}
                >
                  {node.id === "root" ? "Root" : node.isLeaf ? "Leaf" : "Internal"}
                </div>

                {/* Keys compartment block */}
                <div className="flex w-full divide-x divide-border/60">
                  {node.keys.map((key, keyIdx) => {
                    const isKeyHighlighted =
                      currentStepData?.currentNodeId === nodeId && currentStepData.currentKeyIndex === keyIdx;
                    const isKeyCompareHistory = currentStepData?.highlightedKeys.some(
                      (hk) => hk.nodeId === nodeId && hk.keyIndex === keyIdx
                    );
                    const isKeyMatched =
                      node.isLeaf &&
                      key === targetKey &&
                      currentStepData?.found &&
                      currentStepData?.currentNodeId === nodeId;

                    let keyBg = "bg-transparent";
                    let keyText = "text-foreground";
                    const keyLabel = getCellLabel(nodeId, keyIdx);

                    if (isKeyMatched) {
                      keyBg = "bg-emerald-500/20 dark:bg-emerald-500/30 animate-pulse";
                      keyText = "text-emerald-600 dark:text-emerald-400 font-bold";
                    } else if (isKeyHighlighted) {
                      keyBg = "bg-amber-500/35 dark:bg-amber-500/40";
                      keyText = "text-amber-600 dark:text-amber-400 font-black scale-105";
                    } else if (isKeyCompareHistory) {
                      keyBg = "bg-violet-500/10 dark:bg-violet-500/20";
                      keyText = "text-violet-600 dark:text-violet-400 font-semibold";
                    }

                    return (
                      <div
                        key={keyIdx}
                        className={`relative flex-1 text-center py-1.5 font-mono text-xs sm:text-sm transition-all duration-200 ${keyBg} ${keyText}`}
                      >
                        {/* Dynamic comparison floating label */}
                        {keyLabel && (
                          <span className="absolute -top-4 left-1/2 -translate-x-1/2 text-[8px] font-sans font-black px-1 py-0.2 rounded bg-background border border-amber-500/40 text-amber-600 dark:text-amber-400 shadow-sm scale-95 whitespace-nowrap z-30">
                            {keyLabel}
                          </span>
                        )}
                        {key}
                      </div>
                    );
                  })}
                </div>

                {/* If Leaf, show mapped records */}
                {node.isLeaf && (
                  <div className="w-full flex border-t border-dashed border-border/50 bg-muted/20 divide-x divide-border/30 text-[8px] font-mono text-muted-foreground/80 py-0.5 justify-around select-none">
                    {node.values?.map((val, valIdx) => (
                      <div key={valIdx} className="flex-1 text-center font-mono">
                        {val}
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>

        {/* State Data Structures: Path Stack (Relocated under visualization canvas) */}
        <div className="border border-border rounded-xl p-3 bg-muted/5 flex flex-col gap-2 mt-4">
          <div className="font-semibold text-foreground flex items-center gap-1.5 text-xs">
            <Network size={12} className="text-violet-500" /> 탐색 노드 경로 (Path Stack)
          </div>
          <div className="flex flex-wrap items-center gap-1.5 min-h-[36px]">
            {currentStepData && currentStepData.path.length > 0 ? (
              currentStepData.path.map((nodeId, idx) => {
                const node = TREE_NODES[nodeId];
                const isLast = idx === currentStepData.path.length - 1;
                return (
                  <div key={nodeId} className="flex items-center gap-1.5">
                    <span
                      className={`px-2 py-1 rounded text-xs font-bold font-mono border transition-all ${
                        isLast
                          ? "bg-blue-500/10 border-blue-500/30 text-blue-600 dark:text-blue-400 ring-2 ring-blue-500/20"
                          : "bg-muted border-border/60 text-muted-foreground"
                      }`}
                    >
                      {nodeId === "root"
                        ? "Root"
                        : nodeId === "internal_left"
                        ? "Internal L"
                        : nodeId === "internal_right"
                        ? "Internal R"
                        : `Leaf ${nodeId.split("_")[1]}`}
                      <span className="ml-1 text-[10px] opacity-60">[{node.keys.join(",")}]</span>
                    </span>
                    {!isLast && <ArrowRight size={10} className="text-muted-foreground" />}
                  </div>
                );
              })
            ) : (
              <span className="text-muted-foreground italic text-xs select-none">
                탐색 대기 중 (Play 버튼을 누르면 시작됩니다)
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Right Column (5 cols) */}
      <div className="lg:col-span-5 flex flex-col gap-4">
        {/* Python Implementation Code Panel */}
        <div className="border border-border rounded-xl bg-muted/20 overflow-hidden flex flex-col">
          <div className="px-4 py-2 border-b border-border bg-muted/30 flex items-center justify-between">
            <span className="text-xs font-semibold text-foreground">Python 구현 코드</span>
            <span className="text-[10px] font-mono text-muted-foreground">python</span>
          </div>
          <div className="p-4 font-mono text-xs space-y-0.5 select-none h-auto">
            {PYTHON_CODE.split("\n").map((line, idx) => {
              const lineNum = idx + 1;
              const isCurrentLine = currentStepData && lineNum === currentStepData.codeLine;
              return (
                <div
                  key={lineNum}
                  className={`flex items-start -mx-4 px-4 py-0.5 transition-all duration-150 ${
                    isCurrentLine
                      ? "bg-blue-500/10 border-l-2 border-blue-500 text-foreground font-semibold dark:bg-blue-500/20"
                      : "text-muted-foreground"
                  }`}
                >
                  <span className="w-6 opacity-40 text-[10px] select-none font-mono pr-2 text-right">
                    {lineNum}
                  </span>
                  <pre className="whitespace-pre-wrap font-mono">{line || " "}</pre>
                </div>
              );
            })}
          </div>
        </div>

        {/* State Data Structures: Execution Log (Overwrite current step status) */}
        <div className="border border-border rounded-xl p-3 bg-muted/5 flex flex-col gap-2">
          <div className="font-semibold text-foreground flex items-center gap-1.5 text-xs">
            <List size={12} className="text-amber-500" /> 실시간 탐색 로그 (Execution Log)
          </div>
          <div className="min-h-[70px] flex items-center justify-center text-xs">
            {activeStep >= 0 && currentStepData ? (
              <div
                className="p-3 w-full rounded border bg-amber-500/10 border-amber-500/30 text-amber-900 dark:text-amber-300 font-semibold leading-relaxed font-sans"
              >
                {currentStepData.label}
              </div>
            ) : (
              <div className="text-muted-foreground italic text-center py-4 select-none">
                탐색이 아직 시작되지 않았습니다. (선택 또는 입력 후 시작)
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
