import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { AlertTriangle, ShieldCheck, Play, Pause } from "lucide-react";

// API Gateway Rate Limiting Scenarios
const SCENARIOS = [
  {
    phase: 0,
    title: "정상 라우팅 (Normal Gateway Routing)",
    timing: "< 5ms",
    desc: "클라이언트 요청이 원활하게 게이트웨이를 통과하여 백엔드로 전달됩니다. 가용한 입장 토큰(팔찌)이 넉넉하며, 사용된 토큰은 디스펜서에서 즉시 충전됩니다.",
  },
  {
    phase: 1,
    title: "트래픽 폭주 (Traffic Spike)",
    timing: "~50ms",
    desc: "갑작스러운 요청 폭증으로 게이트웨이의 가용 토큰이 소모되기 시작합니다. 대기열이 생성되고 처리 속도가 지연되며 일부 요청은 차단(429)되기 시작합니다.",
  },
  {
    phase: 2,
    title: "게이트 과부하 & 요청 차단 (Access Blocked)",
    timing: "> 500ms",
    desc: "가용 토큰이 완전히 소진되어 게이트웨이가 즉각적으로 차단막을 내립니다. 이후의 모든 요청은 처리되지 않고 HTTP 429 에러 코드와 함께 반려됩니다.",
  },
];

// HTTP Inspector 데이터 구조
const HTTP_INSPECT_DATA = [
  {
    status: "200 OK",
    headers: [
      { key: "HTTP/1.1", val: "200 OK", color: "text-emerald-600 dark:text-emerald-400 font-bold" },
      { key: "Content-Type", val: "application/json" },
      { key: "X-RateLimit-Limit", val: "100" },
      { key: "X-RateLimit-Remaining", val: "84" },
      { key: "X-RateLimit-Reset", val: "12s" },
    ],
    body: `{\n  "status": "success",\n  "message": "Authorized. Request forwarded."\n}`,
  },
  {
    status: "200 OK",
    headers: [
      { key: "HTTP/1.1", val: "200 OK", color: "text-amber-600 dark:text-amber-400 font-bold" },
      { key: "Content-Type", val: "application/json" },
      { key: "X-RateLimit-Limit", val: "100" },
      { key: "X-RateLimit-Remaining", val: "1", color: "text-rose-500 dark:text-rose-400 font-bold" },
      { key: "X-RateLimit-Reset", val: "4s" },
    ],
    body: `{\n  "status": "warning",\n  "remaining_tokens": 1\n}`,
  },
  {
    status: "429 Too Many Requests",
    headers: [
      { key: "HTTP/1.1", val: "429 Too Many Requests", color: "text-rose-600 dark:text-rose-400 font-bold" },
      { key: "Content-Type", val: "application/json" },
      { key: "Retry-After", val: "30s", color: "text-amber-500 dark:text-amber-400 font-bold" },
    ],
    body: `{\n  "status": 429,\n  "error": "TooManyRequests",\n  "message": "Rate limit exceeded. Retry in 30s."\n}`,
  },
];

interface UnifiedSvgProps {
  phase: number;
}

function UnifiedSvg({ phase }: UnifiedSvgProps) {
  return (
    <svg
      viewBox="0 0 600 450"
      className="w-full max-w-[600px] h-auto select-none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Background connector lines */}
      <path
        d="M 180 85 L 300 170"
        className="stroke-slate-200 dark:stroke-slate-800/60"
        strokeWidth="1.5"
        strokeDasharray="3 3"
        fill="none"
      />
      <path
        d="M 300 85 L 300 170"
        className="stroke-slate-200 dark:stroke-slate-800/60"
        strokeWidth="1.5"
        strokeDasharray="3 3"
        fill="none"
      />
      <path
        d="M 420 85 L 300 170"
        className="stroke-slate-200 dark:stroke-slate-800/60"
        strokeWidth="1.5"
        strokeDasharray="3 3"
        fill="none"
      />

      <path
        d="M 300 265 L 450 340"
        className="stroke-slate-200 dark:stroke-slate-800/60"
        strokeWidth="1.5"
        strokeDasharray="3 3"
        fill="none"
      />
      <path
        d="M 300 265 L 150 340"
        className="stroke-slate-200 dark:stroke-slate-800/60"
        strokeWidth="1.5"
        strokeDasharray="3 3"
        fill="none"
      />

      {/* Top box: Clients container */}
      <rect
        x="100"
        y="20"
        width="400"
        height="70"
        rx="8"
        className="fill-slate-50/50 dark:fill-slate-900/20 stroke-slate-200 dark:stroke-slate-800/80"
        strokeWidth="1"
        strokeDasharray="3 3"
      />
      <text
        x="300"
        y="38"
        textAnchor="middle"
        className="text-[9px] font-bold fill-slate-400 dark:fill-slate-500 uppercase tracking-widest font-sans"
      >
        Client Request Sources
      </text>
      
      {/* Clients */}
      <g>
        <text x="180" y="65" textAnchor="middle" className="text-[18px]">💻</text>
        <text x="180" y="78" textAnchor="middle" className="text-[8px] fill-slate-400 dark:fill-slate-500 font-semibold font-sans">Client A</text>
        
        <text x="300" y="65" textAnchor="middle" className="text-[18px]">📱</text>
        <text x="300" y="78" textAnchor="middle" className="text-[8px] fill-slate-400 dark:fill-slate-500 font-semibold font-sans">Client B</text>
        
        <text x="420" y="65" textAnchor="middle" className="text-[18px]">💻</text>
        <text x="420" y="78" textAnchor="middle" className="text-[8px] fill-slate-400 dark:fill-slate-500 font-semibold font-sans">Client C</text>
      </g>

      {/* Gateway Box (Middle) */}
      <rect
        x="175"
        y="170"
        width="250"
        height="95"
        rx="10"
        className={`fill-white dark:fill-slate-900 stroke-2 transition-all duration-500 ${
          phase === 0
            ? "stroke-emerald-300 dark:stroke-emerald-800"
            : phase === 1
            ? "stroke-amber-300 dark:stroke-amber-800"
            : "stroke-rose-300 dark:stroke-rose-800"
        }`}
      />
      <text
        x="300"
        y="190"
        textAnchor="middle"
        className="text-[10px] font-bold fill-slate-400 dark:fill-slate-500 uppercase tracking-widest font-sans"
      >
        API Gateway / Rate Limiter
      </text>

      {/* Bouncer */}
      <g>
        <text x="225" y="235" textAnchor="middle" className="text-[26px]">👮</text>
        <text x="244" y="218" textAnchor="middle" className="text-[14px] select-none">
          {phase === 0 ? "✅" : phase === 1 ? "⚠️" : "🚫"}
        </text>
      </g>

      {/* Token Dispenser */}
      <g>
        <rect
          x="295"
          y="200"
          width="110"
          height="45"
          rx="6"
          className="fill-slate-50/80 dark:fill-slate-950/60 stroke-slate-200 dark:stroke-slate-800/80"
          strokeWidth="1"
        />
        <text
          x="350"
          y="212"
          textAnchor="middle"
          className="text-[8px] font-bold fill-slate-400 dark:fill-slate-500 tracking-wider font-sans"
        >
          TOKEN DISPENSER
        </text>
        {phase === 2 ? (
          <text
            x="350"
            y="233"
            textAnchor="middle"
            className="text-[10px] font-extrabold fill-rose-500 dark:fill-rose-400 tracking-wide font-mono"
          >
            DEPLETED
          </text>
        ) : (
          [1, 2, 3, 4].map((tIdx) => {
            const isFilled = phase === 0 || (phase === 1 && tIdx === 1);
            return (
              <circle
                key={tIdx}
                cx={310 + tIdx * 16}
                cy={230}
                r={4.5}
                className={
                  isFilled
                    ? phase === 0
                      ? "fill-emerald-500 dark:fill-emerald-400"
                      : "fill-amber-500 dark:fill-amber-400"
                    : "fill-slate-200 dark:fill-slate-800"
                }
              />
            );
          })
        )}
      </g>

      {/* Dispenser Refill Animation */}
      {phase === 0 && (
        <motion.circle
          cx="350"
          cy="185"
          r="3"
          className="fill-emerald-500"
          animate={{
            cy: [185, 220],
            opacity: [0, 1, 0]
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: "linear"
          }}
        />
      )}
      {phase === 1 && (
        <motion.circle
          cx="350"
          cy="185"
          r="3"
          className="fill-amber-500"
          animate={{
            cy: [185, 220],
            opacity: [0, 1, 0]
          }}
          transition={{
            duration: 3.5,
            repeat: Infinity,
            ease: "linear"
          }}
        />
      )}

      {/* Laser Barrier (Phase 2) */}
      {phase === 2 && (
        <motion.g
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          key="p2-barrier"
        >
          <line
            x1="185"
            y1="168"
            x2="415"
            y2="168"
            className="stroke-rose-500"
            strokeWidth="3.5"
            strokeDasharray="4 2"
          />
          <rect
            x="245"
            y="158"
            width="110"
            height="18"
            rx="4"
            className="fill-rose-500"
          />
          <text
            x="300"
            y="170"
            textAnchor="middle"
            className="text-[8px] font-extrabold fill-white uppercase tracking-wider font-sans"
          >
            LASER SHIELD ACTIVE
          </text>
        </motion.g>
      )}

      {/* Phase 1 Wait Queue */}
      {phase === 1 && (
        <motion.g
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          key="p1-queue-static"
        >
          <rect
            x="250"
            y="125"
            width="100"
            height="30"
            rx="4"
            className="fill-slate-50/80 dark:fill-slate-900/60 stroke-slate-200/50 dark:stroke-slate-800/50"
            strokeWidth="1"
            strokeDasharray="2 2"
          />
          <text
            x="300"
            y="120"
            textAnchor="middle"
            className="text-[7px] font-extrabold fill-slate-400 dark:fill-slate-500 uppercase tracking-wider font-sans"
          >
            Wait Queue
          </text>
          <motion.text
            x="270"
            y="145"
            fontSize="14"
            textAnchor="middle"
            animate={{ y: [143, 147, 143] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
          >
            😐
          </motion.text>
          <motion.text
            x="300"
            y="145"
            fontSize="14"
            textAnchor="middle"
            animate={{ y: [146, 142, 146] }}
            transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut", delay: 0.2 }}
          >
            😰
          </motion.text>
          <motion.text
            x="330"
            y="145"
            fontSize="14"
            textAnchor="middle"
            animate={{ y: [144, 148, 144] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut", delay: 0.4 }}
          >
            🥱
          </motion.text>
        </motion.g>
      )}

      {/* Bottom Box (Blocked Path - Left) */}
      <g>
        <rect
          x="60"
          y="340"
          width="180"
          height="65"
          rx="8"
          className="fill-white dark:fill-slate-900 stroke-slate-200 dark:stroke-slate-800/80"
          strokeWidth="1"
        />
        <text
          x="75"
          y="363"
          className="text-[11px] font-bold fill-slate-800 dark:fill-slate-100 font-sans"
        >
          🚫 Blocked Path
        </text>
        <text
          x="75"
          y="378"
          className="text-[8px] fill-slate-400 dark:fill-slate-500 font-medium font-sans"
        >
          {phase === 0 ? "No dropped requests" : phase === 1 ? "HTTP 429 Too Many" : "HTTP 429 Shield Block"}
        </text>

        {/* Status Badge Pill */}
        {(() => {
          let label = "CLEAR";
          let fill = "fill-emerald-50 dark:fill-emerald-950/30";
          let stroke = "stroke-emerald-200 dark:stroke-emerald-800/50";
          let text = "fill-emerald-600 dark:fill-emerald-400";
          if (phase === 1) {
            label = "DROPPING";
            fill = "fill-amber-50 dark:fill-amber-950/30";
            stroke = "stroke-amber-200 dark:stroke-amber-800/50";
            text = "fill-amber-600 dark:fill-amber-400";
          } else if (phase === 2) {
            label = "SHIELDING";
            fill = "fill-rose-50 dark:fill-rose-950/30";
            stroke = "stroke-rose-200 dark:stroke-rose-800/50";
            text = "fill-rose-600 dark:fill-rose-400";
          }
          return (
            <g>
              <rect x="75" y="385" width="55" height="12" rx="3" className={`${fill} ${stroke}`} strokeWidth="1" />
              <text x="102.5" y="394" textAnchor="middle" className={`text-[7px] font-extrabold uppercase ${text} tracking-wider font-sans`}>
                {label}
              </text>
            </g>
          );
        })()}
      </g>

      {/* Bottom Box (Backend Server - Right) */}
      <g>
        <rect
          x="360"
          y="340"
          width="180"
          height="65"
          rx="8"
          className="fill-white dark:fill-slate-900 stroke-slate-200 dark:stroke-slate-800/80"
          strokeWidth="1"
        />
        <text
          x="375"
          y="363"
          className="text-[11px] font-bold fill-slate-800 dark:fill-slate-100 font-sans"
        >
          🖥️ Backend Services
        </text>
        <text
          x="375"
          y="378"
          className="text-[8px] fill-slate-400 dark:fill-slate-500 font-medium font-sans"
        >
          {phase === 0 ? "Normal request forward" : phase === 1 ? "Slow responses" : "No incoming traffic"}
        </text>

        {/* Status Badge Pill */}
        {(() => {
          let label = "ACTIVE";
          let fill = "fill-emerald-50 dark:fill-emerald-950/30";
          let stroke = "stroke-emerald-200 dark:stroke-emerald-800/50";
          let text = "fill-emerald-600 dark:fill-emerald-400";
          if (phase === 1) {
            label = "STRESSED";
            fill = "fill-amber-50 dark:fill-amber-950/30";
            stroke = "stroke-amber-200 dark:stroke-amber-800/50";
            text = "fill-amber-600 dark:fill-amber-400";
          } else if (phase === 2) {
            label = "IDLE";
            fill = "fill-slate-100 dark:fill-slate-800/40";
            stroke = "stroke-slate-200 dark:stroke-slate-700/50";
            text = "fill-slate-500 dark:text-slate-400";
          }
          return (
            <g>
              <rect x="375" y="385" width="55" height="12" rx="3" className={`${fill} ${stroke}`} strokeWidth="1" />
              <text x="402.5" y="394" textAnchor="middle" className={`text-[7px] font-extrabold uppercase ${text} tracking-wider font-sans`}>
                {label}
              </text>
            </g>
          );
        })()}
      </g>

      {/* Floating Emojis (Request Particles) */}
      {phase === 0 && (
        <g key="phase-0-particles">
          <motion.g
            key="p0-req1"
            initial={{ x: 180, y: 60, opacity: 0 }}
            animate={{
              x: [180, 300, 300, 450],
              y: [60, 170, 245, 345],
              opacity: [0, 1, 1, 1, 0],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut",
              times: [0, 0.35, 0.45, 0.9, 1]
            }}
          >
            <text x="0" y="6" fontSize="18" textAnchor="middle">😎</text>
            <motion.circle
              cx="0"
              cy="-14"
              r="4.5"
              className="fill-emerald-500 dark:fill-emerald-400"
              animate={{ scale: [0, 0, 1, 1, 0] }}
              transition={{ duration: 3, repeat: Infinity, times: [0, 0.35, 0.45, 0.9, 1] }}
            />
          </motion.g>

          <motion.g
            key="p0-req2"
            initial={{ x: 300, y: 60, opacity: 0 }}
            animate={{
              x: [300, 300, 300, 450],
              y: [60, 170, 245, 345],
              opacity: [0, 1, 1, 1, 0],
            }}
            transition={{
              duration: 3,
              delay: 1,
              repeat: Infinity,
              ease: "easeInOut",
              times: [0, 0.35, 0.45, 0.9, 1]
            }}
          >
            <text x="0" y="6" fontSize="18" textAnchor="middle">🤓</text>
            <motion.circle
              cx="0"
              cy="-14"
              r="4.5"
              className="fill-emerald-500 dark:fill-emerald-400"
              animate={{ scale: [0, 0, 1, 1, 0] }}
              transition={{ duration: 3, delay: 1, repeat: Infinity, times: [0, 0.35, 0.45, 0.9, 1] }}
            />
          </motion.g>

          <motion.g
            key="p0-req3"
            initial={{ x: 420, y: 60, opacity: 0 }}
            animate={{
              x: [420, 300, 300, 450],
              y: [60, 170, 245, 345],
              opacity: [0, 1, 1, 1, 0],
            }}
            transition={{
              duration: 3,
              delay: 2,
              repeat: Infinity,
              ease: "easeInOut",
              times: [0, 0.35, 0.45, 0.9, 1]
            }}
          >
            <text x="0" y="6" fontSize="18" textAnchor="middle">🤠</text>
            <motion.circle
              cx="0"
              cy="-14"
              r="4.5"
              className="fill-emerald-500 dark:fill-emerald-400"
              animate={{ scale: [0, 0, 1, 1, 0] }}
              transition={{ duration: 3, delay: 2, repeat: Infinity, times: [0, 0.35, 0.45, 0.9, 1] }}
            />
          </motion.g>
        </g>
      )}

      {phase === 1 && (
        <g key="phase-1-particles">
          {/* Lucky request */}
          <motion.g
            key="p1-lucky"
            initial={{ x: 300, y: 60, opacity: 0 }}
            animate={{
              x: [300, 300, 300, 300, 450],
              y: [60, 135, 135, 245, 345],
              opacity: [0, 1, 1, 1, 0],
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: "easeInOut",
              times: [0, 0.25, 0.45, 0.65, 1]
            }}
          >
            <text x="0" y="6" fontSize="18" textAnchor="middle">🥳</text>
            <motion.circle
              cx="0"
              cy="-14"
              r="4.5"
              className="fill-amber-500 dark:fill-amber-400"
              animate={{ scale: [0, 0, 1, 1, 0] }}
              transition={{ duration: 4, repeat: Infinity, times: [0, 0.45, 0.65, 0.9, 1] }}
            />
          </motion.g>

          {/* Unlucky request */}
          <motion.g
            key="p1-unlucky"
            initial={{ x: 420, y: 60, opacity: 0 }}
            animate={{
              x: [420, 300, 300, 200, 150],
              y: [60, 135, 135, 190, 345],
              opacity: [0, 1, 1, 1, 0],
            }}
            transition={{
              duration: 4,
              delay: 2,
              repeat: Infinity,
              ease: "easeInOut",
              times: [0, 0.25, 0.45, 0.65, 1]
            }}
          >
            <text x="0" y="6" fontSize="18" textAnchor="middle">😢</text>
            <text x="0" y="-12" fontSize="8" className="fill-rose-500 font-bold" textAnchor="middle">429</text>
          </motion.g>
        </g>
      )}

      {phase === 2 && (
        <g key="phase-2-particles">
          {/* Request from Client A */}
          <motion.g
            key="p2-req1"
            initial={{ x: 180, y: 60, opacity: 0 }}
            animate={{
              x: [180, 220, 150],
              y: [60, 168, 345],
              opacity: [0, 1, 1, 0],
            }}
            transition={{
              duration: 2.5,
              repeat: Infinity,
              ease: "linear",
              times: [0, 0.4, 1]
            }}
          >
            <text x="0" y="6" fontSize="18" textAnchor="middle">😭</text>
            <text x="0" y="-12" fontSize="8" className="fill-rose-500 font-bold" textAnchor="middle">429</text>
          </motion.g>

          {/* Request from Client B */}
          <motion.g
            key="p2-req2"
            initial={{ x: 300, y: 60, opacity: 0 }}
            animate={{
              x: [300, 300, 150],
              y: [60, 168, 345],
              opacity: [0, 1, 1, 0],
            }}
            transition={{
              duration: 2.5,
              delay: 0.8,
              repeat: Infinity,
              ease: "linear",
              times: [0, 0.4, 1]
            }}
          >
            <text x="0" y="6" fontSize="18" textAnchor="middle">😢</text>
            <text x="0" y="-12" fontSize="8" className="fill-rose-500 font-bold" textAnchor="middle">429</text>
          </motion.g>

          {/* Request from Client C */}
          <motion.g
            key="p2-req3"
            initial={{ x: 420, y: 60, opacity: 0 }}
            animate={{
              x: [420, 380, 150],
              y: [60, 168, 345],
              opacity: [0, 1, 1, 0],
            }}
            transition={{
              duration: 2.5,
              delay: 1.6,
              repeat: Infinity,
              ease: "linear",
              times: [0, 0.4, 1]
            }}
          >
            <text x="0" y="6" fontSize="18" textAnchor="middle">😡</text>
            <text x="0" y="-12" fontSize="8" className="fill-rose-500 font-bold" textAnchor="middle">429</text>
          </motion.g>
        </g>
      )}
    </svg>
  );
}

export default function ApiGatewayViz() {
  const PHASE_DURATION = 6000; // 6 seconds per phase
  const [phase, setPhase] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isAutoPlay, setIsAutoPlay] = useState(true);

  // Dynamic status counters
  const [routedCount, setRoutedCount] = useState(105);
  const [blockedCount, setBlockedCount] = useState(12);
  const [tokenCount, setTokenCount] = useState(4);

  // Sync token count immediately on phase transitions
  useEffect(() => {
    if (phase === 0) {
      setTokenCount(4);
    } else if (phase === 1) {
      setTokenCount(1);
    } else if (phase === 2) {
      setTokenCount(0);
    }
  }, [phase]);

  // Phase transition auto-loop
  useEffect(() => {
    if (!isAutoPlay) return;
    const intervalTime = 100;
    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          setPhase((p) => (p + 1) % 3);
          return 0;
        }
        return prev + (intervalTime / PHASE_DURATION) * 100;
      });
    }, intervalTime);

    return () => clearInterval(timer);
  }, [isAutoPlay]);

  // Counters background simulator
  useEffect(() => {
    const interval = setInterval(() => {
      if (phase === 0) {
        setRoutedCount((prev) => prev + 1);
        setTokenCount((prev) => (prev === 4 ? 3 : 4));
      } else if (phase === 1) {
        if (Math.random() > 0.6) {
          setRoutedCount((prev) => prev + 1);
          setTokenCount(1);
        } else {
          setBlockedCount((prev) => prev + 1);
          setTokenCount(0);
        }
      } else if (phase === 2) {
        setBlockedCount((prev) => prev + Math.floor(Math.random() * 2) + 1);
        setTokenCount(0);
      }
    }, 1200);

    return () => clearInterval(interval);
  }, [phase]);

  const handlePhaseSelect = (selectedPhase: number) => {
    setPhase(selectedPhase);
    setProgress(0);
    setIsAutoPlay(false);
  };

  const toggleAutoPlay = () => {
    setIsAutoPlay((prev) => !prev);
    if (!isAutoPlay) {
      setProgress(0);
    }
  };

  const activeScenario = SCENARIOS[phase];
  const inspect = HTTP_INSPECT_DATA[phase];

  return (
    <div className="flex flex-col gap-6 py-2 font-sans">
      {/* Main Unified Simulator Panel */}
      <div className="border border-slate-200 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900 shadow-sm overflow-hidden flex flex-col p-5 sm:p-6 gap-6">
        
        {/* HUD control banner */}
        <div className="border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-950/20 p-5 flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/60 dark:border-slate-800/40 pb-3">
            <div className="flex items-center gap-3">
              <button
                onClick={toggleAutoPlay}
                className="p-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-55 dark:hover:bg-slate-800 transition-colors text-slate-600 dark:text-slate-300"
                title={isAutoPlay ? "일시정지" : "자동재생"}
              >
                {isAutoPlay ? <Pause size={15} /> : <Play size={15} />}
              </button>
              <div className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                {isAutoPlay ? "Auto-Cycling" : "Paused / Manual"}
              </div>
            </div>
            
            <div className="flex flex-wrap gap-1.5">
              {SCENARIOS.map((scen) => {
                const isActive = phase === scen.phase;
                return (
                  <button
                    key={scen.phase}
                    onClick={() => handlePhaseSelect(scen.phase)}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold border transition-all ${
                      isActive
                        ? "bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 border-slate-900 dark:border-slate-100"
                        : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:bg-slate-55 dark:hover:bg-slate-800"
                    }`}
                  >
                    {scen.phase === 0 ? "1. Normal" : scen.phase === 1 ? "2. Spike" : "3. Blocked"}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-sm sm:text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <span className={`inline-block w-2.5 h-2.5 rounded-full ${
                  phase === 0 ? "bg-emerald-500" : phase === 1 ? "bg-amber-500" : "bg-rose-500"
                }`} />
                {activeScenario.title}
              </h3>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900 text-slate-500 dark:text-slate-400">
                Latency: {activeScenario.timing}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              {activeScenario.desc}
            </p>
          </div>

          <div className="space-y-1 pt-1">
            <div className="flex justify-between text-[9px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">
              <span>Phase Timer Indicator</span>
              <span>
                {isAutoPlay 
                  ? `Next phase in ${((100 - progress) * 0.06).toFixed(1)}s` 
                  : "Auto-cycle paused"}
              </span>
            </div>
            <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-100 ${
                  phase === 0 ? "bg-emerald-500" : phase === 1 ? "bg-amber-500" : "bg-rose-500"
                }`}
                style={{ width: `${isAutoPlay ? progress : 100}%` }}
              />
            </div>
          </div>
        </div>

        {/* Vertical Flow Diagram SVG */}
        <div className="border border-slate-100 dark:border-slate-800/60 rounded-xl bg-slate-50/30 dark:bg-slate-950/10 overflow-hidden py-4 flex justify-center">
          <UnifiedSvg phase={phase} />
        </div>

        {/* Integrated Monitor & HTTP Inspector */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Gateway Monitor */}
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 space-y-4 flex flex-col justify-between">
            <div className="space-y-3.5">
              <div className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200 dark:border-slate-800 pb-1.5 flex justify-between items-center">
                <span>Gateway Monitor</span>
                <span className="font-mono text-slate-400">PHASE {phase}</span>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 font-medium">
                  <span>Available Bracelets (Tokens)</span>
                  <span className={phase === 2 ? "text-rose-500 font-bold" : phase === 1 ? "text-amber-500 font-bold" : "text-emerald-500 font-bold"}>
                    {tokenCount} / 4
                  </span>
                </div>
                <div className="flex gap-2">
                  {[1, 2, 3, 4].map((tIdx) => {
                    const isOn = tIdx <= tokenCount;
                    return (
                      <div
                        key={tIdx}
                        className={`flex-1 h-3 rounded-full transition-all duration-300 ${
                          isOn 
                            ? phase === 0
                              ? "bg-emerald-500 dark:bg-emerald-600"
                              : phase === 1
                              ? "bg-amber-500 dark:bg-amber-600"
                              : "bg-rose-500 dark:bg-rose-600"
                            : "bg-slate-200 dark:bg-slate-800"
                        }`}
                      />
                    );
                  })}
                </div>
              </div>

              <div className="flex justify-between items-center pt-1">
                <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Gateway Status</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1 border ${
                  phase === 2
                    ? "text-rose-600 bg-rose-50 border-rose-200 dark:text-rose-400 dark:bg-rose-950/20 dark:border-rose-800/40"
                    : phase === 1
                    ? "text-amber-600 bg-amber-50 border-amber-200 dark:text-amber-400 dark:bg-amber-950/20 dark:border-amber-800/40"
                    : "text-emerald-600 bg-emerald-50 border-emerald-200 dark:text-emerald-400 dark:bg-emerald-950/20 dark:border-emerald-800/40"
                }`}>
                  {phase === 2 ? <AlertTriangle size={10} /> : <ShieldCheck size={10} />}
                  {phase === 2 ? "OVERLOADED (429)" : phase === 1 ? "WARNING (SPIKE)" : "NORMAL (200 OK)"}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200 dark:border-slate-800 font-mono text-xs">
              <div className="bg-emerald-50/50 dark:bg-emerald-950/10 border border-emerald-100 dark:border-emerald-900/30 rounded-lg p-2 text-center">
                <div className="text-[9px] text-emerald-600 dark:text-emerald-400 font-bold uppercase tracking-wider">ROUTED</div>
                <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">{routedCount}</div>
              </div>
              <div className={`border rounded-lg p-2 text-center ${
                phase === 2 
                  ? "bg-rose-50/50 dark:bg-rose-950/10 border-rose-100 dark:border-rose-900/30" 
                  : "bg-slate-100/50 dark:bg-slate-900/10 border-slate-200/40 dark:border-slate-800/30"
              }`}>
                <div className={`text-[9px] font-bold uppercase tracking-wider ${phase === 2 ? "text-rose-600 dark:text-rose-400" : "text-slate-400 dark:text-slate-500"}`}>BLOCKED</div>
                <div className={`text-lg font-bold mt-0.5 ${phase === 2 ? "text-rose-600 dark:text-rose-400" : "text-slate-600 dark:text-slate-400"}`}>{blockedCount}</div>
              </div>
            </div>
          </div>

          {/* HTTP Inspector */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200/60 dark:border-slate-800/60 font-mono text-xs space-y-3 flex flex-col justify-start">
            <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-1.5">
              <div className="flex gap-1">
                <div className="w-2 h-2 rounded-full bg-slate-300 dark:bg-slate-700" />
                <div className="w-2 h-2 rounded-full bg-slate-300 dark:bg-slate-700" />
                <div className="w-2 h-2 rounded-full bg-slate-300 dark:bg-slate-700" />
              </div>
              <span className="text-[9px] text-slate-400 dark:text-slate-500 uppercase font-bold tracking-wider">HTTP Headers Inspector</span>
            </div>

            <div className="space-y-3 flex-1 flex flex-col justify-start">
              <div className="space-y-1">
                <div className="text-[9px] text-slate-400 dark:text-slate-500 uppercase font-bold tracking-wide">Response Headers</div>
                <div className="bg-white dark:bg-slate-950 p-2 rounded-lg border border-slate-200/50 dark:border-slate-800/50 space-y-1">
                  {inspect.headers.map((hdr, hIdx) => (
                    <div key={hIdx} className="flex justify-between text-[10px] sm:text-xs">
                      <span className="text-slate-400 dark:text-slate-500">{hdr.key}:</span>
                      <span className={hdr.color || "text-slate-800 dark:text-slate-200 font-medium"}>
                        {hdr.val}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-1 flex-1 flex flex-col justify-start">
                <div className="text-[9px] text-slate-400 dark:text-slate-500 uppercase font-bold tracking-wide">Response Payload (JSON)</div>
                <pre className="bg-white dark:bg-slate-950 p-2 rounded-lg border border-slate-200/50 dark:border-slate-800/50 text-[10px] sm:text-xs overflow-x-auto text-slate-600 dark:text-slate-300 leading-relaxed font-mono flex-1 whitespace-pre-wrap break-all">
                  {inspect.body}
                </pre>
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
