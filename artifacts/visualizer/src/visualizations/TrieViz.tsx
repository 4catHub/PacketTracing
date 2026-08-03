import { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Pause, RotateCcw, ChevronLeft, ChevronRight, Search, PlusCircle, Sparkles, FolderTree, Code2, TableProperties } from "lucide-react";

interface TrieNodeData {
  id: number;
  char: string;
  parentId: number | null;
  isEndOfWord: boolean;
  word?: string;
  x: number; // percentage (0-100)
  y: number; // percentage (0-100)
}

// Tree layout structure for visualization
const TRIE_NODES: TrieNodeData[] = [
  { id: 0, char: "ROOT", parentId: null, isEndOfWord: false, x: 50, y: 12 },
  
  // Left branch (c -> a -> t / r -> d)
  { id: 1, char: "c", parentId: 0, isEndOfWord: false, x: 32, y: 34 },
  { id: 2, char: "a", parentId: 1, isEndOfWord: false, x: 32, y: 56 },
  { id: 3, char: "t", parentId: 2, isEndOfWord: true, word: "cat", x: 18, y: 78 },
  { id: 4, char: "r", parentId: 2, isEndOfWord: true, word: "car", x: 44, y: 78 },
  { id: 5, char: "d", parentId: 4, isEndOfWord: true, word: "card", x: 44, y: 94 },

  // Right branch (d -> o -> g)
  { id: 6, char: "d", parentId: 0, isEndOfWord: false, x: 68, y: 34 },
  { id: 7, char: "o", parentId: 6, isEndOfWord: false, x: 68, y: 56 },
  { id: 8, char: "g", parentId: 7, isEndOfWord: true, word: "dog", x: 68, y: 78 },
];

interface SimulationStep {
  mode: "INSERT" | "SEARCH" | "PREFIX";
  targetWord: string;
  activeNodeId: number;
  visitedNodeIds: number[];
  currentCharIndex: number;
  isMatch?: boolean;
  statusText: string;
  codeLine: number;
  autoCompleteWords: string[];
  childrenMap: Record<string, number>;
}

// Scenarios
const INSERT_STEPS: SimulationStep[] = [
  {
    mode: "INSERT",
    targetWord: "card",
    activeNodeId: 0,
    visitedNodeIds: [0],
    currentCharIndex: 0,
    statusText: "루트(ROOT) 노드에서 시작하여 'card'의 첫 문자 'c' 탐색",
    codeLine: 11,
    autoCompleteWords: [],
    childrenMap: { c: 1, d: 6 },
  },
  {
    mode: "INSERT",
    targetWord: "card",
    activeNodeId: 1,
    visitedNodeIds: [0, 1],
    currentCharIndex: 0,
    statusText: "'c' 자식 노드 존재 확인. 'c' 노드로 이동",
    codeLine: 14,
    autoCompleteWords: [],
    childrenMap: { a: 2 },
  },
  {
    mode: "INSERT",
    targetWord: "card",
    activeNodeId: 2,
    visitedNodeIds: [0, 1, 2],
    currentCharIndex: 1,
    statusText: "두 번째 문자 'a' 탐색. 'a' 자식 노드로 이동",
    codeLine: 14,
    autoCompleteWords: [],
    childrenMap: { t: 3, r: 4 },
  },
  {
    mode: "INSERT",
    targetWord: "card",
    activeNodeId: 4,
    visitedNodeIds: [0, 1, 2, 4],
    currentCharIndex: 2,
    statusText: "세 번째 문자 'r' 탐색. 'r' 자식 노드로 이동 (기존 'car' 단어 지점)",
    codeLine: 14,
    autoCompleteWords: ["car"],
    childrenMap: { d: 5 },
  },
  {
    mode: "INSERT",
    targetWord: "card",
    activeNodeId: 5,
    visitedNodeIds: [0, 1, 2, 4, 5],
    currentCharIndex: 3,
    statusText: "네 번째 문자 'd' 신규 생성 및 연결 완료! isEndOfWord = True 설정",
    codeLine: 15,
    autoCompleteWords: ["car", "card"],
    childrenMap: {},
  },
];

const SEARCH_STEPS: SimulationStep[] = [
  {
    mode: "SEARCH",
    targetWord: "car",
    activeNodeId: 0,
    visitedNodeIds: [0],
    currentCharIndex: 0,
    statusText: "'car' 단어 존재 여부 검색 시작. 루트 노드 출발",
    codeLine: 18,
    autoCompleteWords: [],
    childrenMap: { c: 1, d: 6 },
  },
  {
    mode: "SEARCH",
    targetWord: "car",
    activeNodeId: 1,
    visitedNodeIds: [0, 1],
    currentCharIndex: 0,
    statusText: "첫 문자 'c' 매칭 성공. 자식 노드로 이동",
    codeLine: 22,
    autoCompleteWords: [],
    childrenMap: { a: 2 },
  },
  {
    mode: "SEARCH",
    targetWord: "car",
    activeNodeId: 2,
    visitedNodeIds: [0, 1, 2],
    currentCharIndex: 1,
    statusText: "두 번째 문자 'a' 매칭 성공. 자식 노드로 이동",
    codeLine: 22,
    autoCompleteWords: [],
    childrenMap: { t: 3, r: 4 },
  },
  {
    mode: "SEARCH",
    targetWord: "car",
    activeNodeId: 4,
    visitedNodeIds: [0, 1, 2, 4],
    currentCharIndex: 2,
    isMatch: true,
    statusText: "세 번째 문자 'r' 매칭 성공 및 isEndOfWord == True 확인! 단어 존재함 (Return True)",
    codeLine: 23,
    autoCompleteWords: ["car"],
    childrenMap: { d: 5 },
  },
];

const PREFIX_STEPS: SimulationStep[] = [
  {
    mode: "PREFIX",
    targetWord: "ca",
    activeNodeId: 0,
    visitedNodeIds: [0],
    currentCharIndex: 0,
    statusText: "접두사 'ca'로 시작하는 모든 단어 자동완성 탐색 시작",
    codeLine: 26,
    autoCompleteWords: [],
    childrenMap: { c: 1, d: 6 },
  },
  {
    mode: "PREFIX",
    targetWord: "ca",
    activeNodeId: 1,
    visitedNodeIds: [0, 1],
    currentCharIndex: 0,
    statusText: "접두사 문자 'c' 탐색 완료",
    codeLine: 29,
    autoCompleteWords: [],
    childrenMap: { a: 2 },
  },
  {
    mode: "PREFIX",
    targetWord: "ca",
    activeNodeId: 2,
    visitedNodeIds: [0, 1, 2],
    currentCharIndex: 1,
    statusText: "접두사 문자 'a' 탐색 완료! 'ca' 노드 도달. 하위 트리 DFS 탐색 개시",
    codeLine: 30,
    autoCompleteWords: [],
    childrenMap: { t: 3, r: 4 },
  },
  {
    mode: "PREFIX",
    targetWord: "ca",
    activeNodeId: 3,
    visitedNodeIds: [0, 1, 2, 3],
    currentCharIndex: 2,
    statusText: "하위 경로 1: 't' 노드 탐색 완료 -> 단어 'cat' 자동완성 수집",
    codeLine: 30,
    autoCompleteWords: ["cat"],
    childrenMap: {},
  },
  {
    mode: "PREFIX",
    targetWord: "ca",
    activeNodeId: 4,
    visitedNodeIds: [0, 1, 2, 3, 4],
    currentCharIndex: 2,
    statusText: "하위 경로 2: 'r' 노드 탐색 완료 -> 단어 'car' 자동완성 수집",
    codeLine: 30,
    autoCompleteWords: ["cat", "car"],
    childrenMap: { d: 5 },
  },
  {
    mode: "PREFIX",
    targetWord: "ca",
    activeNodeId: 5,
    visitedNodeIds: [0, 1, 2, 3, 4, 5],
    currentCharIndex: 2,
    isMatch: true,
    statusText: "하위 경로 3: 'd' 노드 탐색 완료 -> 단어 'card' 수집! 최종 목록 ['cat', 'car', 'card'] 완성",
    codeLine: 30,
    autoCompleteWords: ["cat", "car", "card"],
    childrenMap: {},
  },
];

const PYTHON_CODE = `class TrieNode:
  def __init__(self):
    self.children = {}
    self.is_end_of_word = False

class Trie:
  def __init__(self):
    self.root = TrieNode()

  def insert(self, word: str) -> None:
    node = self.root
    for char in word:
      if char not in node.children:
        node.children[char] = TrieNode()
      node = node.children[char]
    node.is_end_of_word = True

  def search(self, word: str) -> bool:
    node = self.root
    for char in word:
      if char not in node.children:
        return False
      node = node.children[char]
    return node.is_end_of_word

  def starts_with(self, prefix: str) -> bool:
    node = self.root
    for char in prefix:
      if char not in node.children:
        return False
      node = node.children[char]
    return True`;

export default function TrieViz() {
  const [selectedScenario, setSelectedScenario] = useState<"INSERT" | "SEARCH" | "PREFIX">("PREFIX");
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [speed, setSpeed] = useState(1500);

  const steps = useMemo(() => {
    switch (selectedScenario) {
      case "INSERT":
        return INSERT_STEPS;
      case "SEARCH":
        return SEARCH_STEPS;
      case "PREFIX":
        return PREFIX_STEPS;
    }
  }, [selectedScenario]);

  const currentStep = steps[currentStepIndex] || steps[0];

  // Reset step on scenario change
  const handleScenarioChange = (scenario: "INSERT" | "SEARCH" | "PREFIX") => {
    setSelectedScenario(scenario);
    setCurrentStepIndex(0);
  };

  // Autoplay control
  useEffect(() => {
    if (!isPlaying) return;

    const timer = setTimeout(() => {
      if (currentStepIndex < steps.length - 1) {
        setCurrentStepIndex((prev) => prev + 1);
      } else {
        // Pause 3 seconds at final step before auto-looping
        setTimeout(() => {
          setCurrentStepIndex(0);
        }, 3000);
      }
    }, speed);

    return () => clearTimeout(timer);
  }, [isPlaying, currentStepIndex, steps.length, speed]);

  return (
    <div className="w-full space-y-6">
      {/* Top Main Grid Layout (7 cols : 5 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Visual Canvas & Controls (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          {/* Scenario Mode Selector */}
          <div className="flex flex-wrap items-center gap-2 p-1.5 bg-slate-100 dark:bg-zinc-900 rounded-xl border border-slate-200 dark:border-zinc-800">
            <button
              onClick={() => handleScenarioChange("PREFIX")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                selectedScenario === "PREFIX"
                  ? "bg-white dark:bg-zinc-800 text-primary shadow-sm font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Sparkles className="w-4 h-4 text-amber-500" />
              접두사 자동완성 ('ca')
            </button>
            <button
              onClick={() => handleScenarioChange("INSERT")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                selectedScenario === "INSERT"
                  ? "bg-white dark:bg-zinc-800 text-primary shadow-sm font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <PlusCircle className="w-4 h-4 text-emerald-500" />
              단어 삽입 ('card')
            </button>
            <button
              onClick={() => handleScenarioChange("SEARCH")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                selectedScenario === "SEARCH"
                  ? "bg-white dark:bg-zinc-800 text-primary shadow-sm font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Search className="w-4 h-4 text-blue-500" />
              단어 검색 ('car')
            </button>
          </div>

          {/* Compact Player Controls */}
          <div className="flex items-center justify-between gap-3 p-3 bg-white dark:bg-zinc-900 rounded-xl border border-slate-200 dark:border-zinc-800 shadow-sm">
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="p-2 rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
                title={isPlaying ? "일시정지" : "재생"}
              >
                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              </button>
              <button
                onClick={() => {
                  setIsPlaying(false);
                  setCurrentStepIndex(0);
                }}
                className="p-2 rounded-lg bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors"
                title="초기화"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
              <button
                onClick={() => {
                  setIsPlaying(false);
                  setCurrentStepIndex((prev) => Math.max(0, prev - 1));
                }}
                disabled={currentStepIndex === 0}
                className="p-2 rounded-lg bg-secondary text-secondary-foreground hover:bg-secondary/80 disabled:opacity-40 transition-colors"
                title="이전 단계"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => {
                  setIsPlaying(false);
                  setCurrentStepIndex((prev) => Math.min(steps.length - 1, prev + 1));
                }}
                disabled={currentStepIndex === steps.length - 1}
                className="p-2 rounded-lg bg-secondary text-secondary-foreground hover:bg-secondary/80 disabled:opacity-40 transition-colors"
                title="다음 단계"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Speed slider & Step label */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground font-medium">속도</span>
                <input
                  type="range"
                  min="500"
                  max="2500"
                  step="250"
                  value={3000 - speed}
                  onChange={(e) => setSpeed(3000 - Number(e.target.value))}
                  className="w-20 accent-primary cursor-pointer"
                />
              </div>
              <span className="text-xs font-mono px-2 py-1 bg-slate-100 dark:bg-zinc-800 rounded-md font-semibold">
                {currentStepIndex + 1} / {steps.length}
              </span>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-slate-100 dark:bg-zinc-800 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-primary h-full transition-all duration-300 ease-out"
              style={{ width: `${((currentStepIndex + 1) / steps.length) * 100}%` }}
            />
          </div>

          {/* Variables HUD */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div className="p-2.5 bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl">
              <span className="text-[11px] text-muted-foreground block">대상 문자열</span>
              <span className="text-xs sm:text-sm font-bold font-mono text-primary">
                "{currentStep.targetWord}"
              </span>
            </div>
            <div className="p-2.5 bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl">
              <span className="text-[11px] text-muted-foreground block">현재 문자 색인</span>
              <span className="text-xs sm:text-sm font-bold font-mono">
                Index [{currentStep.currentCharIndex}]
              </span>
            </div>
            <div className="p-2.5 bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl">
              <span className="text-[11px] text-muted-foreground block">활성 노드 ID</span>
              <span className="text-xs sm:text-sm font-bold font-mono text-blue-600 dark:text-blue-400">
                Node #{currentStep.activeNodeId}
              </span>
            </div>
            <div className="p-2.5 bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl">
              <span className="text-[11px] text-muted-foreground block">매칭 상태</span>
              <span className="text-xs sm:text-sm font-bold font-mono text-emerald-600 dark:text-emerald-400">
                {currentStep.isMatch ? "SUCCESS" : "IN_PROGRESS"}
              </span>
            </div>
          </div>

          {/* Visual Canvas Area (Dynamic Light & Dark Theme Support) */}
          <div
            className="relative w-full rounded-2xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-950 text-slate-900 dark:text-zinc-100 overflow-hidden shadow-sm"
            style={{ aspectRatio: "400 / 280" }}
          >
            {/* SVG Connecting Edges */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none">
              {TRIE_NODES.map((node) => {
                if (node.parentId === null) return null;
                const parent = TRIE_NODES.find((n) => n.id === node.parentId);
                if (!parent) return null;

                const isPathActive =
                  currentStep.visitedNodeIds.includes(node.id) &&
                  currentStep.visitedNodeIds.includes(parent.id);

                return (
                  <g key={`edge-${node.id}-${currentStepIndex}`}>
                    <line
                      x1={`${parent.x}%`}
                      y1={`${parent.y}%`}
                      x2={`${node.x}%`}
                      y2={`${node.y}%`}
                      className={`transition-all duration-300 ${
                        isPathActive
                          ? "stroke-blue-500 dark:stroke-blue-400 stroke-[3]"
                          : "stroke-slate-300 dark:stroke-zinc-700 stroke-[1.5]"
                      }`}
                      strokeDasharray={isPathActive ? "none" : "3,3"}
                    />
                  </g>
                );
              })}
            </svg>

            {/* Render Nodes */}
            {TRIE_NODES.map((node) => {
              const isActive = currentStep.activeNodeId === node.id;
              const isVisited = currentStep.visitedNodeIds.includes(node.id);

              return (
                <motion.div
                  key={`node-${node.id}-${currentStepIndex}`}
                  initial={{ scale: 0.9 }}
                  animate={{ scale: isActive ? 1.15 : 1 }}
                  transition={{ duration: 0.2 }}
                  className="absolute transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center"
                  style={{ left: `${node.x}%`, top: `${node.y}%` }}
                >
                  <div
                    className={`relative flex items-center justify-center rounded-full font-mono text-xs font-bold transition-all shadow-sm ${
                      node.id === 0
                        ? "w-11 h-11 bg-slate-200 dark:bg-zinc-800 border-2 border-slate-400 dark:border-zinc-600 text-slate-800 dark:text-zinc-200"
                        : isActive
                        ? "w-10 h-10 bg-blue-600 dark:bg-blue-500 border-2 border-blue-200 dark:border-blue-300 text-white ring-4 ring-blue-500/40 shadow-lg shadow-blue-500/30"
                        : isVisited
                        ? "w-9 h-9 bg-blue-100 dark:bg-blue-950/80 border-2 border-blue-500 text-blue-700 dark:text-blue-300"
                        : "w-9 h-9 bg-white dark:bg-zinc-900 border border-slate-300 dark:border-zinc-700 text-slate-700 dark:text-zinc-300 shadow-sm"
                    }`}
                  >
                    {node.char}

                    {/* End of Word indicator ring/badge */}
                    {node.isEndOfWord && (
                      <span
                        className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-emerald-500 border-2 border-slate-50 dark:border-zinc-950 rounded-full"
                        title={`단어 완성: ${node.word}`}
                      />
                    )}
                  </div>

                  {/* Word Tag Label under leaf nodes */}
                  {node.word && (
                    <span
                      className={`mt-1 text-[10px] font-mono px-1.5 py-0.5 rounded transition-all ${
                        currentStep.autoCompleteWords.includes(node.word)
                          ? "bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 font-bold shadow-sm"
                          : "bg-slate-200/80 dark:bg-zinc-800/80 text-slate-600 dark:text-zinc-400"
                      }`}
                    >
                      {node.word}
                    </span>
                  )}
                </motion.div>
              );
            })}

            {/* Status Callout inside canvas header */}
            <div className="absolute top-3 left-3 right-3 p-2.5 rounded-xl bg-white/90 dark:bg-zinc-900/90 backdrop-blur border border-slate-200 dark:border-zinc-800 text-xs text-slate-800 dark:text-zinc-200 flex items-center justify-between shadow-sm">
              <span className="font-medium">{currentStep.statusText}</span>
              {currentStep.isMatch && (
                <span className="px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 font-bold text-[11px] border border-emerald-200 dark:border-emerald-800">
                  MATCH
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Python Implementation & Data Structure HUD (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          {/* Python Code Panel (Dynamic Light & Dark Theme Support) */}
          <div className="p-4 bg-white dark:bg-zinc-950 text-slate-900 dark:text-slate-100 rounded-2xl border border-slate-200 dark:border-zinc-800 shadow-sm">
            <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-200 dark:border-zinc-800">
              <div className="flex items-center gap-2">
                <Code2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span className="text-xs font-semibold font-mono text-slate-800 dark:text-slate-200">
                  Python Trie 클래스
                </span>
              </div>
              <span className="text-[10px] text-muted-foreground font-mono">Trie.py</span>
            </div>

            <div className="font-mono text-xs overflow-x-auto leading-relaxed h-auto max-h-[300px] overflow-y-auto">
              {PYTHON_CODE.split("\n").map((line, idx) => {
                const lineNum = idx + 1;
                const isHighlighted = currentStep.codeLine === lineNum;

                return (
                  <div
                    key={`code-${lineNum}`}
                    className={`px-2 py-0.5 rounded transition-colors flex ${
                      isHighlighted
                        ? "bg-blue-100/90 dark:bg-blue-900/60 text-blue-900 dark:text-blue-100 font-semibold border-l-2 border-blue-500"
                        : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                    }`}
                  >
                    <span className="w-6 text-slate-400 dark:text-slate-600 select-none text-[10px] inline-block">
                      {lineNum}
                    </span>
                    <pre className="whitespace-pre-wrap font-mono flex-1">{line}</pre>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Data Structure HUD 1: Children Map */}
          <div className="p-4 bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-800 shadow-sm space-y-2">
            <div className="flex items-center gap-2 text-xs font-semibold">
              <FolderTree className="w-4 h-4 text-blue-500" />
              <span>현재 노드 자식 맵 (node.children)</span>
            </div>
            <div className="p-2.5 bg-slate-50 dark:bg-zinc-800/60 rounded-xl font-mono text-xs">
              {Object.keys(currentStep.childrenMap).length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {Object.entries(currentStep.childrenMap).map(([char, targetId]) => (
                    <span
                      key={char}
                      className="px-2 py-1 bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 rounded border border-blue-200 dark:border-blue-800 font-bold"
                    >
                      '{char}' &rarr; Node #{targetId}
                    </span>
                  ))}
                </div>
              ) : (
                <span className="text-muted-foreground italic">자식 노드 없음 (Leaf Node)</span>
              )}
            </div>
          </div>

          {/* Data Structure HUD 2: Autocomplete Results */}
          <div className="p-4 bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-800 shadow-sm space-y-2">
            <div className="flex items-center gap-2 text-xs font-semibold">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>수집된 자동완성 단어 목록</span>
            </div>
            <div className="p-2.5 bg-slate-50 dark:bg-zinc-800/60 rounded-xl font-mono text-xs">
              {currentStep.autoCompleteWords.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  <AnimatePresence>
                    {currentStep.autoCompleteWords.map((word) => (
                      <motion.span
                        key={word}
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="px-2 py-1 bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 rounded border border-emerald-200 dark:border-emerald-800 font-bold"
                      >
                        "{word}"
                      </motion.span>
                    ))}
                  </AnimatePresence>
                </div>
              ) : (
                <span className="text-muted-foreground italic">수집된 단어 없음</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Section: Scenario Comparison Table directly under Visualizer */}
      <div className="p-5 bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-800 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-zinc-800 pb-3">
          <div className="flex items-center gap-2">
            <TableProperties className="w-5 h-5 text-primary" />
            <h4 className="text-sm sm:text-base font-semibold">
              Trie 3가지 핵심 연산 시나리오 비교
            </h4>
          </div>
          <span className="text-xs text-muted-foreground">
            클릭하여 해당 시나리오 시뮬레이션 전환
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-zinc-800 text-muted-foreground bg-slate-50 dark:bg-zinc-800/50">
                <th className="p-3 font-semibold">연산 시나리오</th>
                <th className="p-3 font-semibold">동작 목적</th>
                <th className="p-3 font-semibold">탐색 중단 조건</th>
                <th className="p-3 font-semibold">최종 성공 조건</th>
                <th className="p-3 font-semibold">반환 결과</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-zinc-800 font-mono text-xs">
              {/* Insert Row */}
              <tr
                onClick={() => handleScenarioChange("INSERT")}
                className={`cursor-pointer transition-colors ${
                  selectedScenario === "INSERT"
                    ? "bg-emerald-50/80 dark:bg-emerald-950/40 font-semibold"
                    : "hover:bg-slate-50 dark:hover:bg-zinc-800/30"
                }`}
              >
                <td className="p-3 font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                  <PlusCircle className="w-4 h-4 inline-block" />
                  단어 삽입 (Insert)
                </td>
                <td className="p-3 font-sans">문자열을 트라이 노드로 차례대로 추가</td>
                <td className="p-3 font-sans text-muted-foreground">없음 (미존재 문자는 신규 생성)</td>
                <td className="p-3 font-sans">단어의 마지막 문자 노드 도달</td>
                <td className="p-3">노드 연결 및 isEndOfWord = True</td>
              </tr>

              {/* Search Row */}
              <tr
                onClick={() => handleScenarioChange("SEARCH")}
                className={`cursor-pointer transition-colors ${
                  selectedScenario === "SEARCH"
                    ? "bg-blue-50/80 dark:bg-blue-950/40 font-semibold"
                    : "hover:bg-slate-50 dark:hover:bg-zinc-800/30"
                }`}
              >
                <td className="p-3 font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1.5">
                  <Search className="w-4 h-4 inline-block" />
                  단어 검색 (Search)
                </td>
                <td className="p-3 font-sans">특정 완결 단어의 존재 여부 확인</td>
                <td className="p-3 font-sans text-muted-foreground">경로 상에 문자가 존재하지 않을 때</td>
                <td className="p-3 font-sans">모든 문자 경로 존재 및 isEndOfWord == True</td>
                <td className="p-3 text-blue-600 dark:text-blue-400 font-bold">True / False</td>
              </tr>

              {/* Prefix Row */}
              <tr
                onClick={() => handleScenarioChange("PREFIX")}
                className={`cursor-pointer transition-colors ${
                  selectedScenario === "PREFIX"
                    ? "bg-amber-50/80 dark:bg-amber-950/40 font-semibold"
                    : "hover:bg-slate-50 dark:hover:bg-zinc-800/30"
                }`}
              >
                <td className="p-3 font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 inline-block" />
                  접두사 탐색 (StartsWith)
                </td>
                <td className="p-3 font-sans">접두사 시작 단어 모음 및 자동완성 수집</td>
                <td className="p-3 font-sans text-muted-foreground">경로 상에 문자가 존재하지 않을 때</td>
                <td className="p-3 font-sans">접두사의 모든 문자 경로 존재 (isEndOfWord 무관)</td>
                <td className="p-3 text-amber-600 dark:text-amber-400 font-bold">True / False (또는 자동완성 단어 목록)</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
