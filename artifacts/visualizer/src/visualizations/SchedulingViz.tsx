import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, RotateCcw, SkipBack, SkipForward } from 'lucide-react';

type Task = { id: string; val: string; len: number; priority: number; color: string; isVip?: boolean };
type RowState = { 
  cpu: Task | null; 
  queue: Task[]; 
  completed: Task[]; 
  preempted?: boolean; 
};
type StepState = {
  stepName: string;
  desc: string;
  fifo: RowState;
  rr: RowState;
  sjf: RowState;
  srtf: RowState;
  priority: RowState;
};

// Task instances
const T1: Task = { id: 'T1', val: 'T1', len: 3, priority: 2, color: '#3B82F6' }; // Blue, len 3
const T2: Task = { id: 'T2', val: 'T2', len: 1, priority: 3, color: '#F59E0B' }; // Orange, len 1
const T3: Task = { id: 'T3', val: 'T3', len: 2, priority: 1, color: '#8B5CF6', isVip: true }; // Purple, len 2 (VIP)

const STEPS: StepState[] = [
  {
    stepName: "Step 0: 대기 상태",
    desc: "준비 대기열(Queue)에 T1(길이 3, 우선순위 보통)과 T2(길이 1, 우선순위 낮음)가 들어옵니다.",
    fifo: { cpu: null, queue: [T1, T2], completed: [] },
    rr: { cpu: null, queue: [T1, T2], completed: [] },
    sjf: { cpu: null, queue: [T1, T2], completed: [] },
    srtf: { cpu: null, queue: [T1, T2], completed: [] },
    priority: { cpu: null, queue: [T1, T2], completed: [] }
  },
  {
    stepName: "Step 1: 최초 스케줄링 실행",
    desc: "SJF와 SRTF는 가장 짧은 T2를 먼저 골라 CPU에 올리고, 나머지는 도착 순서대로 T1을 CPU에 올립니다.",
    fifo: { cpu: { ...T1, len: 2 }, queue: [T2], completed: [] },
    rr: { cpu: { ...T1, len: 2 }, queue: [T2], completed: [] },
    sjf: { cpu: { ...T2, len: 0 }, queue: [T1], completed: [] }, // T2(길이1)는 1틱만에 완료 예정
    srtf: { cpu: { ...T2, len: 0 }, queue: [T1], completed: [] },
    priority: { cpu: { ...T1, len: 2 }, queue: [T2], completed: [] }
  },
  {
    stepName: "Step 2: 작업 완료 및 시분할 갱신",
    desc: "SJF/SRTF는 T2 완료 후 T1을 시작합니다. RR은 T1의 할당 시간(1)이 끝나 큐 뒤로 밀리고 T2가 CPU에 올라옵니다.",
    fifo: { cpu: { ...T1, len: 1 }, queue: [T2], completed: [] },
    rr: { cpu: { ...T2, len: 0 }, queue: [{ ...T1, len: 2 }], completed: [] },
    sjf: { cpu: { ...T1, len: 2 }, queue: [], completed: [T2] },
    srtf: { cpu: { ...T1, len: 2 }, queue: [], completed: [T2] },
    priority: { cpu: { ...T1, len: 1 }, queue: [T2], completed: [] }
  },
  {
    stepName: "Step 3: 신규 VIP 태스크(T3)의 유입",
    desc: "VIP인 T3가 도착합니다. 선점형 우선순위 기법은 작동 중인 T1을 즉시 큐로 튕겨내고(Preempt) VIP 작업을 먼저 실행합니다.",
    fifo: { cpu: { ...T1, len: 0 }, queue: [T2, T3], completed: [] }, // FCFS에서 T1 완료
    rr: { cpu: { ...T1, len: 1 }, queue: [T3], completed: [T2] }, // RR에서 T2 완료
    sjf: { cpu: { ...T1, len: 1 }, queue: [T3], completed: [T2] }, // 비선점 SJF는 기존 T1 계속 실행
    srtf: { cpu: { ...T1, len: 1 }, queue: [T3], completed: [T2] }, // 잔여시간이 T1(1) < T3(2) 이므로 계속 실행
    priority: { cpu: { ...T3, len: 1 }, queue: [{ ...T1, len: 1 }, T2], completed: [], preempted: true } // T1 선점당해 큐로 복귀
  },
  {
    stepName: "Step 4: 작업 정체 및 선점 진행",
    desc: "FCFS는 순서대로 T2를 처리하고, RR은 T1 할당시간 만료로 튕겨낸 뒤 VIP(T3)를 처리하기 시작합니다.",
    fifo: { cpu: { ...T2, len: 0 }, queue: [T3], completed: [T1] },
    rr: { cpu: { ...T3, len: 1 }, queue: [{ ...T1, len: 1 }], completed: [T2] },
    sjf: { cpu: { ...T3, len: 1 }, queue: [], completed: [T2, T1] }, // SJF에서 T1 완료 후 T3 진입
    srtf: { cpu: { ...T3, len: 1 }, queue: [], completed: [T2, T1] },
    priority: { cpu: { ...T3, len: 0 }, queue: [{ ...T1, len: 1 }, T2], completed: [] } // Priority에서 T3 완료 예정
  },
  {
    stepName: "Step 5: 후속 작업 순차 처리",
    desc: "각 알고리즘들이 남은 태스크들을 지정된 스케줄링 전략에 맞춰 순서대로 처리해 나갑니다.",
    fifo: { cpu: { ...T3, len: 1 }, queue: [], completed: [T1, T2] },
    rr: { cpu: { ...T1, len: 0 }, queue: [{ ...T3, len: 1 }], completed: [T2] },
    sjf: { cpu: { ...T3, len: 0 }, queue: [], completed: [T2, T1] },
    srtf: { cpu: { ...T3, len: 0 }, queue: [], completed: [T2, T1] },
    priority: { cpu: { ...T1, len: 0 }, queue: [T2], completed: [T3] } // VIP 완료 후 대기 중이던 T1 진입
  },
  {
    stepName: "Step 6: 시뮬레이션 완료",
    desc: "모든 프로세스의 자원 배분이 완료되었습니다. 알고리즘마다 최종 완료 순서와 총 대기 시간의 차이가 발생합니다.",
    fifo: { cpu: null, queue: [], completed: [T1, T2, T3] },
    rr: { cpu: null, queue: [], completed: [T2, T1, T3] },
    sjf: { cpu: null, queue: [], completed: [T2, T1, T3] },
    srtf: { cpu: null, queue: [], completed: [T2, T1, T3] },
    priority: { cpu: null, queue: [], completed: [T3, T1, T2] }
  }
];

const ROW_DEFS = [
  { key: 'fifo', label: 'FCFS', desc: '선착순 처리 (비선점)', y: 80 },
  { key: 'rr', label: 'Round Robin', desc: '시분할 균등배분', y: 160 },
  { key: 'sjf', label: 'SJF', desc: '짧은 작업 우선 (비선점)', y: 240 },
  { key: 'srtf', label: 'SRTF', desc: '남은시간 기준 (선점)', y: 320 },
  { key: 'priority', label: 'Priority', desc: '우선순위 선점형', y: 400 }
];

export default function SchedulingViz() {
  const [activeStep, setActiveStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const totalSteps = STEPS.length;
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isPlaying) {
      timerRef.current = setInterval(() => {
        setActiveStep((prev) => {
          if (prev >= totalSteps - 1) {
            return 0; // Loop back
          }
          return prev + 1;
        });
      }, 3500); // 3.5s per step for clear view of animations
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, totalSteps]);

  const handleReset = () => {
    setActiveStep(0);
    setIsPlaying(false);
  };

  const handleNext = () => setActiveStep((p) => Math.min(p + 1, totalSteps - 1));
  const handlePrev = () => setActiveStep((p) => Math.max(p - 1, 0));

  const stepData = STEPS[activeStep] || STEPS[0];

  return (
    <div className="w-full flex flex-col gap-3 p-4 bg-white dark:bg-zinc-950 text-slate-800 dark:text-zinc-200 rounded-xl shadow-lg border border-slate-200 dark:border-zinc-800 transition-colors duration-300">
      
      {/* Top Controller Bar */}
      <div className="flex items-center gap-4 bg-slate-50 dark:bg-zinc-900 p-2 px-4 rounded-xl border border-slate-200 dark:border-zinc-800 shadow-sm h-12">
        <div className="flex items-center gap-1">
          <button
            onClick={handleReset}
            className="p-1.5 text-slate-500 hover:text-slate-800 dark:text-zinc-400 dark:hover:text-zinc-100 transition-colors"
            title="처음부터"
          >
            <RotateCcw size={16} />
          </button>
          <button
            onClick={handlePrev}
            disabled={activeStep === 0}
            className="p-1.5 text-slate-500 hover:text-slate-800 dark:text-zinc-400 dark:hover:text-zinc-100 disabled:opacity-30 transition-colors"
          >
            <SkipBack size={16} />
          </button>
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="p-1.5 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors"
          >
            {isPlaying ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" />}
          </button>
          <button
            onClick={handleNext}
            disabled={activeStep === totalSteps - 1}
            className="p-1.5 text-slate-500 hover:text-slate-800 dark:text-zinc-400 dark:hover:text-zinc-100 disabled:opacity-30 transition-colors"
          >
            <SkipForward size={16} />
          </button>
        </div>
        
        {/* Progress Bar */}
        <div className="flex-1 relative h-2 bg-slate-200 dark:bg-zinc-800 rounded-full overflow-hidden">
          <motion.div
            className="absolute top-0 left-0 h-full bg-blue-500 dark:bg-blue-400"
            initial={{ width: 0 }}
            animate={{ width: `${(activeStep / (totalSteps - 1)) * 100}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
        
        <div className="text-xs font-bold text-slate-500 dark:text-zinc-400 min-w-[50px] text-right">
          {activeStep + 1} / {totalSteps}
        </div>
      </div>

      {/* Description Title & Text */}
      <div className="bg-slate-50 dark:bg-zinc-900/50 p-3 rounded-lg border border-slate-200/50 dark:border-zinc-800/50 text-center">
        <h4 className="text-sm font-bold text-slate-800 dark:text-zinc-100 mb-1">{stepData.stepName}</h4>
        <p className="text-xs sm:text-sm text-slate-600 dark:text-zinc-400">{stepData.desc}</p>
      </div>

      {/* Visualization Canvas */}
      <div className="w-full overflow-hidden rounded-xl bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 shadow-inner flex items-center justify-center">
        <svg viewBox="0 0 800 460" className="w-full h-auto drop-shadow-sm">
          <defs>
            <marker id="arrowhead" markerWidth="6" markerHeight="4" refX="5" refY="2" orient="auto">
              <polygon points="0 0, 6 2, 0 4" fill="currentColor" />
            </marker>
          </defs>

          {/* Vertical Guides for Columns */}
          <line x1="170" y1="20" x2="170" y2="450" className="stroke-slate-200 dark:stroke-zinc-800" strokeWidth="1" strokeDasharray="3 3" />
          <line x1="360" y1="20" x2="360" y2="450" className="stroke-slate-200 dark:stroke-zinc-800" strokeWidth="1" strokeDasharray="3 3" />
          <line x1="500" y1="20" x2="500" y2="450" className="stroke-slate-200 dark:stroke-zinc-800" strokeWidth="1" strokeDasharray="3 3" />

          {/* Column Header Titles */}
          <text x="90" y="25" textAnchor="middle" className="text-[10px] font-bold fill-slate-400 dark:fill-zinc-500 tracking-wider">알고리즘</text>
          <text x="265" y="25" textAnchor="middle" className="text-[10px] font-bold fill-slate-400 dark:fill-zinc-500 tracking-wider">대기열 (QUEUE)</text>
          <text x="430" y="25" textAnchor="middle" className="text-[10px] font-bold fill-slate-400 dark:fill-zinc-500 tracking-wider">CPU 작업</text>
          <text x="650" y="25" textAnchor="middle" className="text-[10px] font-bold fill-slate-400 dark:fill-zinc-500 tracking-wider">완료 (COMPLETED)</text>

          {ROW_DEFS.map((row) => {
            const rowData = stepData[row.key as keyof Omit<StepState, 'stepName'|'desc'>] as RowState;
            
            return (
              <g key={row.key} transform={`translate(0, ${row.y})`}>
                {/* Horizontal row line */}
                <line x1="20" y1="50" x2="780" y2="50" className="stroke-slate-200 dark:stroke-zinc-900" strokeWidth="1" />

                {/* 1. Algorithm label box (Prevent Overflow) */}
                <rect x="15" y="-15" width="140" height="46" rx="6" className="fill-white dark:fill-zinc-900 stroke-slate-200 dark:stroke-zinc-800" strokeWidth="1.5" />
                <text x="25" y="3" className="text-xs font-extrabold fill-slate-800 dark:fill-zinc-100">{row.label}</text>
                <text x="25" y="18" className="text-[9px] font-medium fill-slate-400 dark:fill-zinc-500">{row.desc}</text>

                {/* Connection arrows */}
                <path d="M 160 8 L 180 8" className="stroke-slate-300 dark:stroke-zinc-700" strokeWidth="1.5" markerEnd="url(#arrowhead)" />
                <path d="M 355 8 L 385 8" className="stroke-slate-300 dark:stroke-zinc-700" strokeWidth="1.5" markerEnd="url(#arrowhead)" />
                <path d="M 480 8 L 525 8" className="stroke-slate-300 dark:stroke-zinc-700" strokeWidth="1.5" markerEnd="url(#arrowhead)" />

                {/* 2. 대기열 (Queue) Area - Horizontal slots */}
                <g transform="translate(180, -20)">
                  {[0, 1, 2].map((slotIdx) => {
                    const task = rowData.queue[slotIdx];
                    return (
                      <g key={`q-${row.key}-${slotIdx}`} transform={`translate(${slotIdx * 48}, 0)`}>
                        <rect x="5" y="5" width="40" height="40" rx="6" className="fill-slate-100 dark:fill-zinc-900/30 stroke-slate-200 dark:stroke-zinc-800 stroke-dashed" strokeWidth="1" />
                        <AnimatePresence>
                          {task && (
                            <motion.g
                              key={`task-q-${task.id}`}
                              initial={{ opacity: 0, scale: 0.8 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0 }}
                              transition={{ duration: 0.3 }}
                            >
                              <rect x="7" y="7" width="36" height="36" rx="5" fill={task.color} className="stroke-white/20" strokeWidth="1" />
                              <text x="25" y="26" textAnchor="middle" className="text-xs font-bold fill-white">{task.val}</text>
                              <text x="25" y="37" textAnchor="middle" className="text-[8px] fill-white/80 font-mono">Len:{task.len}</text>
                              {task.isVip && <circle cx="37" cy="13" r="4" className="fill-yellow-400 stroke-yellow-500" strokeWidth="1" />}
                            </motion.g>
                          )}
                        </AnimatePresence>
                      </g>
                    );
                  })}
                </g>

                {/* 3. CPU 작업 Area */}
                <g transform="translate(390, -20)">
                  <circle cx="40" cy="25" r="24" className="fill-slate-100 dark:fill-zinc-900/60 stroke-slate-300 dark:stroke-zinc-800" strokeWidth="2" />
                  <text x="40" y="44" textAnchor="middle" className="text-[8px] font-bold fill-slate-400 dark:fill-zinc-500">CPU</text>
                  
                  <AnimatePresence>
                    {rowData.cpu && (
                      <motion.g
                        key={`task-cpu-${rowData.cpu.id}-${activeStep}`}
                        initial={{ opacity: 0, scale: 0.6 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.4 }}
                        transform="translate(15, 0)"
                      >
                        <rect x="5" y="5" width="40" height="40" rx="20" fill={rowData.cpu.color} />
                        <text x="25" y="24" textAnchor="middle" className="text-xs font-bold fill-white">{rowData.cpu.val}</text>
                        <text x="25" y="34" textAnchor="middle" className="text-[8px] fill-white/90 font-mono">Rem:{rowData.cpu.len}</text>
                        {rowData.cpu.isVip && (
                          <g transform="translate(25, 8)">
                            <text x="0" y="0" textAnchor="middle" className="text-[7px] fill-yellow-300 font-bold" style={{ filter: "drop-shadow(0px 1px 1px rgba(0,0,0,0.5))" }}>★VIP</text>
                          </g>
                        )}
                      </motion.g>
                    )}
                  </AnimatePresence>
                </g>

                {/* 선점(Preemption) 발생 애니메이션 연출 */}
                {rowData.preempted && (
                  <motion.path
                    key={`preempt-curve-${activeStep}`}
                    d="M 430 -20 Q 330 -60 210 -20"
                    fill="transparent"
                    stroke="#EF4444"
                    strokeWidth="2.5"
                    strokeDasharray="4 4"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 0.5 }}
                    markerEnd="url(#arrowhead)"
                  />
                )}

                {/* 4. 완료 (Completed) List Area - Horizontal cubes */}
                <g transform="translate(540, -15)">
                  {[0, 1, 2].map((idx) => {
                    const task = rowData.completed[idx];
                    return (
                      <g key={`comp-${row.key}-${idx}`} transform={`translate(${idx * 40}, 0)`}>
                        <AnimatePresence>
                          {task && (
                            <motion.g
                              key={`task-comp-${task.id}`}
                              initial={{ opacity: 0, x: -30, scale: 0.5 }}
                              animate={{ opacity: 1, x: 0, scale: 1 }}
                              transition={{ duration: 0.5 }}
                            >
                              <rect x="5" y="5" width="30" height="30" rx="4" fill={task.color} className="stroke-white/20" strokeWidth="1" opacity="0.6" />
                              <text x="20" y="24" textAnchor="middle" className="text-[10px] font-bold fill-white">{task.val}</text>
                            </motion.g>
                          )}
                        </AnimatePresence>
                      </g>
                    );
                  })}
                </g>

              </g>
            );
          })}
        </svg>
      </div>

    </div>
  );
}
