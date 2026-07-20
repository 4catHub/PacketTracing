import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

type SlotData = { id: string; val: string; badge?: string };
type RowState = { slots: (SlotData | null)[]; hand?: number; hit?: number; evicted?: number; randTarget?: number };
type StepState = { input: string; queue: string[]; fifo: RowState; lru: RowState; lfu: RowState; clock: RowState; rand: RowState };

const STEPS: StepState[] = [
  {
    input: '', queue: ['A', 'B', 'C', 'A', 'D', 'B'],
    fifo: { slots: [null, null, null] },
    lru: { slots: [null, null, null] },
    lfu: { slots: [null, null, null] },
    clock: { slots: [null, null, null], hand: 0 },
    rand: { slots: [null, null, null] }
  },
  {
    input: 'A', queue: ['B', 'C', 'A', 'D', 'B'],
    fifo: { slots: [{id:'A1', val:'A'}, null, null] },
    lru: { slots: [{id:'A1', val:'A'}, null, null] },
    lfu: { slots: [{id:'A1', val:'A', badge:'1'}, null, null] },
    clock: { slots: [{id:'A1', val:'A', badge:'1'}, null, null], hand: 1 },
    rand: { slots: [{id:'A1', val:'A'}, null, null] }
  },
  {
    input: 'B', queue: ['C', 'A', 'D', 'B'],
    fifo: { slots: [{id:'A1', val:'A'}, {id:'B1', val:'B'}, null] },
    lru: { slots: [{id:'A1', val:'A'}, {id:'B1', val:'B'}, null] },
    lfu: { slots: [{id:'A1', val:'A', badge:'1'}, {id:'B1', val:'B', badge:'1'}, null] },
    clock: { slots: [{id:'A1', val:'A', badge:'1'}, {id:'B1', val:'B', badge:'1'}, null], hand: 2 },
    rand: { slots: [{id:'A1', val:'A'}, {id:'B1', val:'B'}, null] }
  },
  {
    input: 'C', queue: ['A', 'D', 'B'],
    fifo: { slots: [{id:'A1', val:'A'}, {id:'B1', val:'B'}, {id:'C1', val:'C'}] },
    lru: { slots: [{id:'A1', val:'A'}, {id:'B1', val:'B'}, {id:'C1', val:'C'}] },
    lfu: { slots: [{id:'A1', val:'A', badge:'1'}, {id:'B1', val:'B', badge:'1'}, {id:'C1', val:'C', badge:'1'}] },
    clock: { slots: [{id:'A1', val:'A', badge:'1'}, {id:'B1', val:'B', badge:'1'}, {id:'C1', val:'C', badge:'1'}], hand: 0 },
    rand: { slots: [{id:'A1', val:'A'}, {id:'B1', val:'B'}, {id:'C1', val:'C'}] }
  },
  {
    input: 'A', queue: ['D', 'B'],
    fifo: { slots: [{id:'A1', val:'A'}, {id:'B1', val:'B'}, {id:'C1', val:'C'}], hit: 0 },
    lru: { slots: [{id:'A1', val:'A'}, {id:'B1', val:'B'}, {id:'C1', val:'C'}], hit: 0 },
    lfu: { slots: [{id:'A1', val:'A', badge:'2'}, {id:'B1', val:'B', badge:'1'}, {id:'C1', val:'C', badge:'1'}], hit: 0 },
    clock: { slots: [{id:'A1', val:'A', badge:'1'}, {id:'B1', val:'B', badge:'1'}, {id:'C1', val:'C', badge:'1'}], hand: 0, hit: 0 },
    rand: { slots: [{id:'A1', val:'A'}, {id:'B1', val:'B'}, {id:'C1', val:'C'}], hit: 0 }
  },
  {
    input: 'D', queue: ['B'],
    fifo: { slots: [{id:'D1', val:'D'}, {id:'B1', val:'B'}, {id:'C1', val:'C'}], evicted: 0 },
    lru: { slots: [{id:'A1', val:'A'}, {id:'D1', val:'D'}, {id:'C1', val:'C'}], evicted: 1 },
    lfu: { slots: [{id:'A1', val:'A', badge:'2'}, {id:'D1', val:'D', badge:'1'}, {id:'C1', val:'C', badge:'1'}], evicted: 1 },
    clock: { slots: [{id:'D1', val:'D', badge:'1'}, {id:'B1', val:'B', badge:'0'}, {id:'C1', val:'C', badge:'0'}], hand: 1, evicted: 0 },
    rand: { slots: [{id:'A1', val:'A'}, {id:'B1', val:'B'}, {id:'D1', val:'D'}], evicted: 2, randTarget: 2 }
  },
  {
    input: 'B', queue: [],
    fifo: { slots: [{id:'D1', val:'D'}, {id:'B1', val:'B'}, {id:'C1', val:'C'}], hit: 1 },
    lru: { slots: [{id:'A1', val:'A'}, {id:'D1', val:'D'}, {id:'B2', val:'B'}], evicted: 2 },
    lfu: { slots: [{id:'A1', val:'A', badge:'2'}, {id:'D1', val:'D', badge:'1'}, {id:'B2', val:'B', badge:'1'}], evicted: 2 },
    clock: { slots: [{id:'D1', val:'D', badge:'1'}, {id:'B1', val:'B', badge:'1'}, {id:'C1', val:'C', badge:'0'}], hand: 1, hit: 1 },
    rand: { slots: [{id:'A1', val:'A'}, {id:'B1', val:'B'}, {id:'D1', val:'D'}], hit: 1 }
  }
];

const ROW_DEFS = [
  { key: 'fifo', label: 'FIFO', desc: 'Evict Oldest', y: 80 },
  { key: 'lru', label: 'LRU', desc: 'Least Rec. Used', y: 160 },
  { key: 'lfu', label: 'LFU', desc: 'Least Freq. Used', y: 240 },
  { key: 'clock', label: 'Clock', desc: 'Second Chance', y: 320 },
  { key: 'rand', label: 'Random', desc: 'Random Pick', y: 400 }
];

export default function CacheReplacementViz() {
  const [activeStep, setActiveStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const totalSteps = STEPS.length;
  
  useEffect(() => {
    if (!isPlaying) return;
    const timer = setTimeout(() => {
      if (activeStep < totalSteps - 1) {
        setActiveStep(s => s + 1);
      } else {
        setTimeout(() => setActiveStep(0), 3000); // Loop after 3s
      }
    }, 1500);
    return () => clearTimeout(timer);
  }, [isPlaying, activeStep, totalSteps]);

  const stepData = STEPS[activeStep];

  return (
    <div className="w-full flex flex-col items-center p-4 bg-white dark:bg-neutral-900 rounded-xl shadow-lg border border-neutral-200 dark:border-neutral-800">
      {/* UI Controls */}
      <div className="flex items-center gap-4 mb-4 w-full max-w-[800px] bg-neutral-100 dark:bg-neutral-800 p-2 rounded-lg">
        <button onClick={() => setIsPlaying(!isPlaying)} className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600 transition-colors">
          {isPlaying ? 'Pause' : 'Play'}
        </button>
        <button onClick={() => { setActiveStep(0); setIsPlaying(false); }} className="px-3 py-1 bg-neutral-300 dark:bg-neutral-600 text-neutral-800 dark:text-neutral-200 rounded text-sm hover:bg-neutral-400 transition-colors">
          Reset
        </button>
        <div className="flex-1 h-2 bg-neutral-300 dark:bg-neutral-700 rounded-full overflow-hidden">
          <motion.div 
            className="h-full bg-blue-500"
            initial={{ width: 0 }}
            animate={{ width: `${(activeStep / (totalSteps - 1)) * 100}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
        <div className="text-sm font-mono text-neutral-600 dark:text-neutral-400">
          Step {activeStep}/{totalSteps - 1}
        </div>
      </div>

      <div className="w-full max-w-[800px] overflow-hidden">
        <svg viewBox="0 0 800 480" className="w-full h-auto">
          <defs>
            <marker id="arrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
              <path d="M 0 0 L 10 5 L 0 10 z" fill="currentColor" />
            </marker>
          </defs>

          {/* Incoming Queue Conveyor */}
          <g transform="translate(480, 20)">
            <text x="0" y="20" className="text-sm font-bold fill-neutral-700 dark:fill-neutral-300" fontSize="14">Incoming Sequence</text>
            <path d="M 130 35 L 300 35" stroke="currentColor" strokeWidth="2" className="text-neutral-300 dark:text-neutral-700" strokeDasharray="4 4" />
            <AnimatePresence>
              {stepData.queue.map((qItem, idx) => (
                <motion.g 
                  key={`q-${totalSteps - stepData.queue.length + idx}`}
                  initial={{ opacity: 0, x: 280 }}
                  animate={{ opacity: 1, x: 130 + idx * 30 }}
                  exit={{ opacity: 0, x: 100, scale: 0.5 }}
                  transition={{ duration: 0.5 }}
                >
                  <rect x="0" y="25" width="22" height="22" rx="4" className="fill-orange-100 dark:fill-orange-900 stroke-orange-500" strokeWidth="1.5" />
                  <text x="11" y="41" textAnchor="middle" fontSize="12" className="fill-orange-700 dark:fill-orange-300 font-bold">{qItem}</text>
                </motion.g>
              ))}
            </AnimatePresence>
            {/* Current processing item */}
            {stepData.input && (
              <motion.g
                key={`input-${activeStep}`}
                initial={{ opacity: 0, y: -20, scale: 0.8 }}
                animate={{ opacity: 1, y: 15, scale: 1.2 }}
                transition={{ duration: 0.5 }}
              >
                <rect x="70" y="10" width="30" height="30" rx="6" className="fill-blue-100 dark:fill-blue-900 stroke-blue-500" strokeWidth="2" />
                <text x="85" y="30" textAnchor="middle" fontSize="16" className="fill-blue-700 dark:fill-blue-300 font-bold">{stepData.input}</text>
              </motion.g>
            )}
          </g>

          {/* Rows */}
          {ROW_DEFS.map((row) => {
            const rowData = stepData[row.key as keyof Omit<StepState, 'input'|'queue'>] as RowState;
            return (
              <g key={row.key} transform={`translate(0, ${row.y})`}>
                {/* Labels */}
                <rect x="20" y="0" width="120" height="50" rx="8" className="fill-neutral-100 dark:fill-neutral-800 stroke-neutral-300 dark:stroke-neutral-700" />
                <text x="80" y="22" textAnchor="middle" fontSize="14" className="font-bold fill-neutral-800 dark:fill-neutral-200">{row.label}</text>
                <text x="80" y="40" textAnchor="middle" fontSize="11" className="fill-neutral-500 dark:fill-neutral-400">{row.desc}</text>
                
                {/* Connection line to slots */}
                <line x1="140" y1="25" x2="180" y2="25" stroke="currentColor" strokeWidth="2" className="text-neutral-300 dark:text-neutral-700" markerEnd="url(#arrow)" />

                {/* Slots */}
                <g transform="translate(190, 0)">
                  {[0, 1, 2].map(slotIdx => {
                    const slotItem = rowData.slots[slotIdx];
                    const isHit = rowData.hit === slotIdx;
                    const isEvicted = rowData.evicted === slotIdx;
                    const isRandTarget = rowData.randTarget === slotIdx;

                    return (
                      <g key={`slot-${row.key}-${slotIdx}`} transform={`translate(${slotIdx * 70}, 0)`}>
                        {/* Empty slot container */}
                        <rect x="0" y="0" width="50" height="50" rx="8" className="fill-neutral-50 dark:fill-neutral-900 stroke-neutral-200 dark:stroke-neutral-800 stroke-2 stroke-dashed" />
                        
                        {/* Slot Item */}
                        <AnimatePresence>
                          {slotItem && (
                            <motion.g
                              key={slotItem.id}
                              initial={{ opacity: 0, scale: 0.5, y: -20 }}
                              animate={{ 
                                opacity: 1, 
                                scale: isHit ? [1, 1.2, 1] : 1,
                                y: 0
                              }}
                              exit={{ opacity: 0, scale: 0.5, y: 20 }}
                              transition={{ duration: 0.4 }}
                            >
                              <rect 
                                x="0" y="0" width="50" height="50" rx="8" 
                                className={`
                                  ${isHit ? 'fill-green-100 dark:fill-green-900 stroke-green-500' : 
                                    isEvicted ? 'fill-red-100 dark:fill-red-900 stroke-red-500' : 
                                    'fill-white dark:fill-neutral-800 stroke-neutral-400 dark:stroke-neutral-600'}
                                  stroke-2
                                `} 
                              />
                              <text x="25" y="32" textAnchor="middle" fontSize="20" className="font-bold fill-neutral-800 dark:fill-neutral-200">{slotItem.val}</text>
                              
                              {/* Badge for LFU / Clock */}
                              {slotItem.badge !== undefined && (
                                <g transform="translate(35, -5)">
                                  <circle cx="5" cy="5" r="9" className="fill-purple-500" />
                                  <text x="5" y="9" textAnchor="middle" fontSize="10" className="fill-white font-bold">{slotItem.badge}</text>
                                </g>
                              )}
                            </motion.g>
                          )}
                        </AnimatePresence>

                        {/* Clock Hand */}
                        {row.key === 'clock' && rowData.hand === slotIdx && (
                          <motion.g
                            layoutId={`clock-hand-${activeStep}`}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ type: 'spring' }}
                          >
                            <path d="M 25 65 L 20 75 L 30 75 z" className="fill-blue-500" />
                          </motion.g>
                        )}

                        {/* Random Target Lightning */}
                        {row.key === 'rand' && isRandTarget && (
                          <motion.g
                            initial={{ opacity: 0, scale: 2 }}
                            animate={{ opacity: [0, 1, 0, 1], scale: 1 }}
                            transition={{ duration: 0.5 }}
                          >
                            <path d="M 25 -20 L 15 5 L 25 5 L 20 25 L 35 0 L 25 0 z" className="fill-yellow-400 stroke-yellow-600 stroke-1" />
                          </motion.g>
                        )}
                      </g>
                    );
                  })}
                </g>

                {/* Status Indicator */}
                <g transform="translate(420, 25)">
                  <AnimatePresence mode="wait">
                    {rowData.hit !== undefined && (
                      <motion.text key={`hit-${activeStep}`} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} fontSize="14" className="fill-green-600 dark:fill-green-400 font-bold">
                        HIT!
                      </motion.text>
                    )}
                    {rowData.evicted !== undefined && (
                      <motion.text key={`miss-${activeStep}`} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} fontSize="14" className="fill-red-600 dark:fill-red-400 font-bold">
                        MISS (Evict)
                      </motion.text>
                    )}
                  </AnimatePresence>
                </g>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}
