import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, SkipBack, SkipForward, RotateCcw } from 'lucide-react';

const TOTAL_STEPS = 4;

const stepDescriptions = [
  "Step 0: 대기 (Waiting) - 관람객이 입장을 위해 대기 중입니다.",
  "Step 1: 발급 (Login) - Session은 DB에 기록 후 팔찌 발급, JWT는 서명된 티켓을 즉시 발급합니다.",
  "Step 2: 입장 (Access) - Session은 매표소에 유효성을 확인 후 오픈, JWT는 자체 검증으로 즉시 오픈합니다.",
  "Step 3: 퇴장 (Logout) - Session은 DB에서 삭제, JWT는 블랙리스트에 등록되어 재사용을 막습니다."
];

export default function JwtVsSessionViz() {
  const [activeStep, setActiveStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isPlaying) {
      timerRef.current = setInterval(() => {
        setActiveStep((prev) => {
          if (prev >= TOTAL_STEPS - 1) {
            return 0; // Auto-cycle back to step 0
          }
          return prev + 1;
        });
      }, 3000); // 3 seconds delay for each step
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying]);

  const handleReset = () => {
    setActiveStep(0);
    setIsPlaying(false);
  };

  const handleNext = () => setActiveStep((p) => Math.min(p + 1, TOTAL_STEPS - 1));
  const handlePrev = () => setActiveStep((p) => Math.max(p - 1, 0));

  // Y-coordinates for the two rows
  const sessionY = 100;
  const jwtY = 240;

  return (
    <div className="w-full flex flex-col gap-3 p-4">
      {/* Top Controller Bar */}
      <div className="flex items-center gap-4 bg-white dark:bg-zinc-900 p-2 px-4 rounded-xl border border-slate-200 dark:border-zinc-800 shadow-sm h-12">
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
            disabled={activeStep === TOTAL_STEPS - 1}
            className="p-1.5 text-slate-500 hover:text-slate-800 dark:text-zinc-400 dark:hover:text-zinc-100 disabled:opacity-30 transition-colors"
          >
            <SkipForward size={16} />
          </button>
        </div>
        
        {/* Progress Bar */}
        <div className="flex-1 relative h-2 bg-slate-100 dark:bg-zinc-800 rounded-full overflow-hidden">
          <motion.div
            className="absolute top-0 left-0 h-full bg-blue-500 dark:bg-blue-400"
            initial={{ width: 0 }}
            animate={{ width: `${(activeStep / (TOTAL_STEPS - 1)) * 100}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
        
        <div className="text-xs font-bold text-slate-500 dark:text-zinc-400 min-w-[50px] text-right">
          {activeStep + 1} / {TOTAL_STEPS}
        </div>
      </div>

      {/* Description Text */}
      <div className="text-sm text-center font-medium text-slate-700 dark:text-zinc-300 px-2">
        {stepDescriptions[activeStep]}
      </div>

      {/* Visualization Canvas */}
      <div className="w-full overflow-hidden rounded-xl bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 shadow-inner flex items-center justify-center">
        <svg viewBox="0 0 800 320" className="w-full h-auto drop-shadow-sm">
          <defs>
            <marker id="arrowhead" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
              <polygon points="0 0, 8 3, 0 6" fill="currentColor" />
            </marker>
          </defs>

          {/* Zones Background */}
          <rect x="40" y="30" width="160" height="270" rx="8" className="fill-slate-200/50 dark:fill-zinc-900/50" />
          <text x="120" y="20" textAnchor="middle" className="text-xs font-bold fill-slate-400 dark:fill-zinc-500">CLIENT (관람객)</text>

          <rect x="320" y="30" width="160" height="270" rx="8" className="fill-slate-200/50 dark:fill-zinc-900/50" />
          <text x="400" y="20" textAnchor="middle" className="text-xs font-bold fill-slate-400 dark:fill-zinc-500">AUTH SERVER (매표소)</text>

          <rect x="600" y="30" width="160" height="270" rx="8" className="fill-slate-200/50 dark:fill-zinc-900/50" />
          <text x="680" y="20" textAnchor="middle" className="text-xs font-bold fill-slate-400 dark:fill-zinc-500">RESOURCE SERVER (게이트)</text>

          {/* Row Separator */}
          <line x1="20" y1="170" x2="780" y2="170" strokeDasharray="4 4" className="stroke-slate-300 dark:stroke-zinc-800" strokeWidth="2" />

          {/* ==================== ROW 1: SESSION ==================== */}
          <text x="30" y={sessionY + 4} transform="rotate(-90 30,104)" textAnchor="middle" className="text-[10px] font-bold fill-slate-400 dark:fill-zinc-500 tracking-widest">SESSION</text>
          
          {/* Session Client */}
          <g transform={`translate(120, ${sessionY})`}>
            <circle cx="0" cy="-12" r="10" className="fill-blue-500 dark:fill-blue-400" />
            <rect x="-12" y="-2" width="24" height="24" rx="4" className="fill-blue-500 dark:fill-blue-400" />
            {(activeStep === 1 || activeStep === 2) && (
              <rect x="-14" y="6" width="6" height="10" rx="2" className="fill-yellow-400" />
            )}
          </g>

          {/* Session Auth Server */}
          <g transform={`translate(400, ${sessionY})`}>
            <rect x="-35" y="-25" width="70" height="50" rx="4" className="fill-slate-300 dark:fill-zinc-700" />
            <text x="0" y="-8" textAnchor="middle" className="text-[10px] font-bold fill-slate-700 dark:fill-zinc-200">DB 장부</text>
            {activeStep >= 1 && activeStep < 3 && (
              <line x1="-25" y1="5" x2="25" y2="5" strokeWidth="3" className="stroke-blue-500 dark:stroke-blue-400" />
            )}
            {activeStep === 3 && (
              <line x1="-25" y1="5" x2="25" y2="5" strokeWidth="3" className="stroke-red-500" />
            )}
          </g>

          {/* Session Resource Server */}
          <g transform={`translate(680, ${sessionY})`}>
            <rect x="-35" y="-35" width="70" height="70" rx="4" className="fill-slate-300 dark:fill-zinc-700" />
            <text x="0" y="-42" textAnchor="middle" className="text-[10px] font-bold fill-slate-500 dark:fill-zinc-400">경호원 게이트</text>
            <rect
              x="-20" y="-25" width="40" height="50" rx="2"
              className={activeStep === 2 ? "fill-green-100 dark:fill-green-900/30 stroke-green-500" : "fill-slate-200 dark:fill-zinc-800 stroke-slate-400"}
              strokeWidth="2"
            />
            {activeStep === 2 && <text x="0" y="4" textAnchor="middle" className="text-[10px] font-bold fill-green-600 dark:fill-green-400">OPEN</text>}
          </g>


          {/* ==================== ROW 2: JWT ==================== */}
          <text x="30" y={jwtY + 4} transform="rotate(-90 30,244)" textAnchor="middle" className="text-[10px] font-bold fill-slate-400 dark:fill-zinc-500 tracking-widest">JWT</text>
          
          {/* JWT Client */}
          <g transform={`translate(120, ${jwtY})`}>
            <circle cx="0" cy="-12" r="10" className="fill-blue-500 dark:fill-blue-400" />
            <rect x="-12" y="-2" width="24" height="24" rx="4" className="fill-blue-500 dark:fill-blue-400" />
            {(activeStep === 1 || activeStep === 2) && (
              <rect x="8" y="2" width="14" height="10" rx="2" className="fill-green-400" />
            )}
          </g>

          {/* JWT Auth Server */}
          <g transform={`translate(400, ${jwtY})`}>
            <rect x="-35" y="-25" width="70" height="50" rx="4" className="fill-slate-300 dark:fill-zinc-700" />
            <text x="0" y="-8" textAnchor="middle" className="text-[10px] font-bold fill-slate-700 dark:fill-zinc-200">스탬프 머신</text>
            {activeStep === 1 && (
              <motion.circle
                key={`jwt-stamp-${activeStep}`}
                cx="0" cy="8" r="8"
                className="stroke-green-500 dark:stroke-green-400 fill-transparent" strokeWidth="2" strokeDasharray="3 2"
                animate={{ rotate: 360 }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
              />
            )}
          </g>

          {/* JWT Resource Server */}
          <g transform={`translate(680, ${jwtY})`}>
            <rect x="-35" y="-35" width="70" height="70" rx="4" className="fill-slate-300 dark:fill-zinc-700" />
            <text x="0" y="-42" textAnchor="middle" className="text-[10px] font-bold fill-slate-500 dark:fill-zinc-400">무인 게이트</text>
            
            {/* Blacklist screen */}
            <rect x="-30" y="-28" width="60" height="14" rx="2" className="fill-zinc-800 dark:fill-zinc-950" />
            <text x="0" y="-18" textAnchor="middle" className="text-[7px] font-bold fill-red-500">
              {activeStep === 3 ? 'BLACKLISTED' : 'READY'}
            </text>

            {/* Door */}
            <rect
              x="-20" y="-10" width="40" height="35" rx="2"
              className={activeStep === 2 ? "fill-green-100 dark:fill-green-900/30 stroke-green-500" : "fill-slate-200 dark:fill-zinc-800 stroke-slate-400"}
              strokeWidth="2"
            />
            {activeStep === 2 && <text x="0" y="10" textAnchor="middle" className="text-[10px] font-bold fill-green-600 dark:fill-green-400">OPEN</text>}
          </g>


          {/* ==================== ANIMATED PACKETS ==================== */}
          <AnimatePresence>
            {/* STEP 1: Login Request (ID/PW) */}
            {activeStep === 1 && (
              <>
                <motion.g
                  key={`s-req1-${activeStep}`}
                  initial={{ x: 140, y: sessionY, opacity: 0 }}
                  animate={{ x: 350, y: sessionY, opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 1 }}
                >
                  <rect x="-15" y="-8" width="30" height="16" rx="3" className="fill-slate-700 dark:fill-zinc-300" />
                  <text x="0" y="3" textAnchor="middle" className="text-[8px] font-bold fill-white dark:fill-black">ID/PW</text>
                </motion.g>
                <motion.g
                  key={`j-req1-${activeStep}`}
                  initial={{ x: 140, y: jwtY, opacity: 0 }}
                  animate={{ x: 350, y: jwtY, opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 1 }}
                >
                  <rect x="-15" y="-8" width="30" height="16" rx="3" className="fill-slate-700 dark:fill-zinc-300" />
                  <text x="0" y="3" textAnchor="middle" className="text-[8px] font-bold fill-white dark:fill-black">ID/PW</text>
                </motion.g>

                {/* Login Response (Tokens) */}
                <motion.g
                  key={`s-res1-${activeStep}`}
                  initial={{ x: 350, y: sessionY + 15, opacity: 0 }}
                  animate={{ x: 140, y: sessionY + 15, opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 1, delay: 1 }}
                >
                  <rect x="-20" y="-8" width="40" height="16" rx="3" className="fill-yellow-500" />
                  <text x="0" y="3" textAnchor="middle" className="text-[8px] font-bold fill-white">SessionID</text>
                </motion.g>
                <motion.g
                  key={`j-res1-${activeStep}`}
                  initial={{ x: 350, y: jwtY + 15, opacity: 0 }}
                  animate={{ x: 140, y: jwtY + 15, opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 1, delay: 1 }}
                >
                  <rect x="-15" y="-8" width="30" height="16" rx="3" className="fill-green-500" />
                  <text x="0" y="3" textAnchor="middle" className="text-[8px] font-bold fill-white">JWT</text>
                </motion.g>
              </>
            )}

            {/* STEP 2: Access */}
            {activeStep === 2 && (
              <>
                {/* Send Token to Gate */}
                <motion.g
                  key={`s-req2-${activeStep}`}
                  initial={{ x: 140, y: sessionY, opacity: 0 }}
                  animate={{ x: 630, y: sessionY, opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 1 }}
                >
                  <rect x="-20" y="-8" width="40" height="16" rx="3" className="fill-yellow-500" />
                  <text x="0" y="3" textAnchor="middle" className="text-[8px] font-bold fill-white">SessionID</text>
                </motion.g>
                <motion.g
                  key={`j-req2-${activeStep}`}
                  initial={{ x: 140, y: jwtY, opacity: 0 }}
                  animate={{ x: 630, y: jwtY, opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 1 }}
                >
                  <rect x="-15" y="-8" width="30" height="16" rx="3" className="fill-green-500" />
                  <text x="0" y="3" textAnchor="middle" className="text-[8px] font-bold fill-white">JWT</text>
                </motion.g>

                {/* Session ONLY: Verify with Auth Server */}
                <motion.g key={`s-verify-${activeStep}`}>
                  <motion.line
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={{ pathLength: 1, opacity: 1 }}
                    transition={{ duration: 0.4, delay: 1 }}
                    x1="640" y1={sessionY - 15} x2="440" y2={sessionY - 15}
                    strokeWidth="1.5" strokeDasharray="3" className="stroke-orange-500"
                    markerEnd="url(#arrowhead)"
                  />
                  <motion.text
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.1 }}
                    x="540" y={sessionY - 20} textAnchor="middle" className="text-[8px] font-bold fill-orange-500"
                  >
                    조회 요청
                  </motion.text>
                  <motion.line
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={{ pathLength: 1, opacity: 1 }}
                    transition={{ duration: 0.4, delay: 1.5 }}
                    x1="440" y1={sessionY + 15} x2="640" y2={sessionY + 15}
                    strokeWidth="1.5" strokeDasharray="3" className="stroke-green-500"
                    markerEnd="url(#arrowhead)"
                  />
                  <motion.text
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.6 }}
                    x="540" y={sessionY + 25} textAnchor="middle" className="text-[8px] font-bold fill-green-500"
                  >
                    유효함
                  </motion.text>
                </motion.g>
              </>
            )}

            {/* STEP 3: Logout */}
            {activeStep === 3 && (
              <>
                <motion.g
                  key={`s-req3-${activeStep}`}
                  initial={{ x: 140, y: sessionY, opacity: 0 }}
                  animate={{ x: 350, y: sessionY, opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 1 }}
                >
                  <rect x="-20" y="-8" width="40" height="16" rx="3" className="fill-red-500" />
                  <text x="0" y="3" textAnchor="middle" className="text-[8px] font-bold fill-white">Logout</text>
                </motion.g>
                <motion.g
                  key={`j-req3-${activeStep}`}
                  initial={{ x: 140, y: jwtY, opacity: 0 }}
                  animate={{ x: 350, y: jwtY, opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 1 }}
                >
                  <rect x="-20" y="-8" width="40" height="16" rx="3" className="fill-red-500" />
                  <text x="0" y="3" textAnchor="middle" className="text-[8px] font-bold fill-white">Logout</text>
                </motion.g>

                {/* JWT ONLY: Sync to Blacklist */}
                <motion.g key={`j-blacklist-${activeStep}`}>
                  <motion.line
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={{ pathLength: 1, opacity: 1 }}
                    transition={{ duration: 0.5, delay: 1 }}
                    x1="440" y1={jwtY - 10} x2="640" y2={jwtY - 10}
                    strokeWidth="1.5" strokeDasharray="3" className="stroke-red-500"
                    markerEnd="url(#arrowhead)"
                  />
                  <motion.text
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.2 }}
                    x="540" y={jwtY - 15} textAnchor="middle" className="text-[8px] font-bold fill-red-500"
                  >
                    블랙리스트 동기화
                  </motion.text>
                </motion.g>
              </>
            )}
          </AnimatePresence>
        </svg>
      </div>
    </div>
  );
}
