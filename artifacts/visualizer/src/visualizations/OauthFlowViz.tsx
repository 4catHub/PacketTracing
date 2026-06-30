import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Pause, ChevronLeft, ChevronRight, RotateCcw, ShieldCheck } from "lucide-react";

// OAuth 2.0 Sequence Diagram Steps
// Using clean horizontal trajectories to prevent diagonal layout overlap
const STEPS = [
  {
    title: "1. 소셜 로그인 시도 (Browser ➔ Auth Server)",
    y: 100,
    x1: 80, // Browser
    x2: 420, // Auth Server
    desc: "사용자가 Client 서비스의 '소셜 로그인' 버튼을 누르면, 서비스는 사용자의 브라우저를 Authorization Server의 로그인 화면으로 리다이렉트 시킵니다.",
  },
  {
    title: "2. 인증 및 권한 동의 (Browser ➔ Auth Server)",
    y: 140,
    x1: 80, // Browser
    x2: 420, // Auth Server
    desc: "사용자가 Authorization Server에 로그인하고, 서비스(Client)가 요청한 프로필 등의 권한 부여 동의 버튼을 클릭합니다.",
  },
  {
    title: "3. 인증 코드 반환 (Auth Server ➔ Browser ➔ Client)",
    y: 180,
    x1: 420, // Auth Server
    x2: 230, // Client App (via Browser 302 Redirect)
    desc: "동의가 완료되면 인증 서버는 브라우저를 거쳐 일회용 인증 코드(Authorization Code)를 Client의 Redirect URI로 전달합니다.",
  },
  {
    title: "4. 토큰 요청 (Client ➔ Auth Server)",
    y: 220,
    x1: 230, // Client App (Server-to-Server backchannel)
    x2: 420, // Auth Server
    desc: "Client 백엔드 서버는 브라우저로부터 받은 인증 코드와 자신의 고유 비밀 키(Client Secret)를 모아 Auth Server에 직접 Access Token을 요청합니다.",
  },
  {
    title: "5. Access Token 발급 (Auth Server ➔ Client)",
    y: 260,
    x1: 420, // Auth Server
    x2: 230, // Client App
    desc: "Auth Server는 코드와 Secret을 검증한 후, 외부 노출 없이 안전한 백채널을 통해 Client 백엔드로 Access Token을 직접 발급합니다.",
  },
  {
    title: "6. 사용자 데이터 요청 (Client ➔ Resource Server)",
    y: 300,
    x1: 230, // Client App
    x2: 570, // Resource Server
    desc: "토큰을 얻은 Client 백엔드는 사용자의 프로필 데이터를 가져오기 위해 HTTP 헤더에 Access Token을 실어 Resource Server에 자원을 요청합니다.",
  },
  {
    title: "7. 리소스 반환 및 로그인 성공 (Resource Server ➔ Client ➔ Browser)",
    y: 340,
    x1: 570, // Resource Server
    x2: 80, // Browser (Final UI response)
    desc: "Resource Server는 토큰 검증 후 유저 데이터를 반환하고, Client는 사용자의 로그인을 완료하여 최종 로그인 성공 화면을 브라우저에 표시합니다.",
  },
];

const LIFELINES = [
  { id: 0, label: "Browser (User)", x: 80, icon: "👤" },
  { id: 1, label: "Client App", x: 230, icon: "💻" },
  { id: 2, label: "Auth Server", x: 420, icon: "🔑" },
  { id: 3, label: "Resource Server", x: 570, icon: "🖥️" },
];

export default function OauthFlowViz() {
  const [activeStep, setActiveStep] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const total = STEPS.length;
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

  const handlePlay = useCallback(() => {
    if (isComplete) {
      setActiveStep(-1);
      setTimeout(() => setIsPlaying(true), 50);
    } else {
      setIsPlaying((p) => !p);
    }
  }, [isComplete]);

  const handleNext = useCallback(() => {
    setIsPlaying(false);
    if (activeStep < total - 1) setActiveStep((p) => p + 1);
  }, [activeStep, total]);

  const handlePrev = useCallback(() => {
    setIsPlaying(false);
    if (activeStep >= 0) setActiveStep((p) => p - 1);
  }, [activeStep]);

  const handleReset = useCallback(() => {
    setIsPlaying(false);
    setActiveStep(-1);
  }, []);

  const progress = ((activeStep + 1) / total) * 100;
  const stepData = activeStep >= 0 ? STEPS[activeStep] : null;

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex items-center gap-3 flex-wrap">
        <button
          onClick={handleReset}
          className="p-2.5 rounded-lg border border-card-border bg-card hover:bg-muted text-muted-foreground transition-colors"
          data-testid="button-reset"
        >
          <RotateCcw size={16} />
        </button>
        <button
          onClick={handlePrev}
          disabled={activeStep < 0}
          className="p-2.5 rounded-lg border border-card-border bg-card hover:bg-muted text-muted-foreground disabled:opacity-40 transition-colors"
          data-testid="button-prev"
        >
          <ChevronLeft size={16} />
        </button>
        <button
          onClick={handlePlay}
          className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary text-primary-foreground hover:opacity-90 text-sm font-medium transition-opacity"
          data-testid="button-play-pause"
        >
          {isPlaying ? <Pause size={15} /> : <Play size={15} />}
          {isComplete ? "다시 보기" : isPlaying ? "일시정지" : activeStep < 0 ? "인증 시작" : "계속"}
        </button>
        <button
          onClick={handleNext}
          disabled={isComplete}
          className="p-2.5 rounded-lg border border-card-border bg-card hover:bg-muted text-muted-foreground disabled:opacity-40 transition-colors"
          data-testid="button-next"
        >
          <ChevronRight size={16} />
        </button>
        <div className="flex-1 space-y-1">
          <div className="flex justify-between text-xs sm:text-sm text-muted-foreground">
            <span>단계 {Math.max(0, activeStep + 1)} / {total}</span>
            {activeStep >= 0 && (
              <span className="flex items-center gap-1 font-bold text-primary">
                Sequence Flow
              </span>
            )}
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-primary rounded-full"
              animate={{ width: `${Math.max(0, progress)}%` }}
              transition={{ duration: 0.4 }}
            />
          </div>
        </div>
      </div>

      {/* Sequence Diagram Layout */}
      <div className="relative w-full max-w-[650px] mx-auto border border-border rounded-2xl bg-muted/5 p-1 select-none">
        <svg className="w-full h-auto aspect-[650/380] block" viewBox="0 0 650 380">
          <defs>
            <linearGradient id="seqLineGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#3b82f6" />
              <stop offset="100%" stopColor="#10b981" />
            </linearGradient>
            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="0" stdDeviation="3" floodColor="#3b82f6" floodOpacity="0.5" />
            </filter>
          </defs>

          {/* Lifelines (Vertical Dashed Lines) */}
          {LIFELINES.map((line) => (
            <g key={line.id}>
              <line
                x1={line.x}
                y1={60}
                x2={line.x}
                y2={360}
                stroke="#cbd5e1"
                strokeWidth="1.5"
                strokeDasharray="4 4"
                className="dark:stroke-slate-700"
              />
              {/* Header Box */}
              <rect
                x={line.x - 45}
                y={15}
                width="90"
                height="36"
                rx="8"
                fill="var(--card, #ffffff)"
                stroke="#cbd5e1"
                strokeWidth="1.5"
                className="fill-card dark:fill-slate-900 dark:stroke-slate-700"
              />
              <text x={line.x} y={30} textAnchor="middle" fontSize="12" className="select-none">
                {line.icon}
              </text>
              <text x={line.x} y={45} textAnchor="middle" fontSize="8" fontWeight="bold" className="fill-foreground">
                {line.label}
              </text>
            </g>
          ))}

          {/* Historical / Completed Step Lines */}
          {STEPS.map((step, idx) => {
            if (idx >= activeStep) return null;
            return (
              <g key={idx}>
                {/* Horizontal line for past steps (Ensuring y2 is exactly bound to step.y to keep it flat) */}
                <line
                  x1={step.x1}
                  y1={step.y}
                  x2={step.x2}
                  y2={step.y}
                  stroke="#10b981"
                  strokeWidth="1.5"
                  strokeDasharray="2 2"
                  opacity="0.4"
                />
                {/* Small indicator dot at endpoint */}
                <circle cx={step.x2} cy={step.y} r="3" fill="#10b981" opacity="0.5" />
                {/* Step Number Label */}
                <text x={(step.x1 + step.x2) / 2} y={step.y - 4} textAnchor="middle" fontSize="8" className="fill-emerald-600 font-bold" opacity="0.4">
                  Step {idx + 1}
                </text>
              </g>
            );
          })}

          {/* Active Flow Line and Packet Animation */}
          {stepData && (
            <g>
              {/* Active Connection Line (Ensuring y2 is bound to stepData.y to prevent diagonal lines) */}
              <motion.line
                x1={stepData.x1}
                y1={stepData.y}
                x2={stepData.x2}
                y2={stepData.y}
                stroke="url(#seqLineGrad)"
                strokeWidth="3.5"
                filter="url(#glow)"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.6, ease: "easeInOut" }}
              />

              {/* Arrow Head pointing to destination */}
              <polygon
                points={
                  stepData.x1 < stepData.x2
                    ? `${stepData.x2 - 10},${stepData.y - 5} ${stepData.x2},${stepData.y} ${stepData.x2 - 10},${stepData.y + 5}`
                    : `${stepData.x2 + 10},${stepData.y - 5} ${stepData.x2},${stepData.y} ${stepData.x2 + 10},${stepData.y + 5}`
                }
                fill="#10b981"
                filter="url(#glow)"
              />

              {/* Running Packet (Data dot) */}
              <motion.circle
                r="7"
                fill="#3b82f6"
                filter="url(#glow)"
                initial={{ cx: stepData.x1 }}
                animate={{ cx: stepData.x2 }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  repeatType: "loop",
                  ease: "easeInOut",
                  delay: 0.3,
                }}
                cy={stepData.y}
              />
              
              {/* Active Step Number Badge */}
              <rect
                x={((stepData.x1 + stepData.x2) / 2) - 16}
                y={stepData.y - 14}
                width="32"
                height="10"
                rx="3"
                fill="#3b82f6"
              />
              <text
                x={(stepData.x1 + stepData.x2) / 2}
                y={stepData.y - 6}
                textAnchor="middle"
                fontSize="7"
                fontWeight="bold"
                fill="#ffffff"
              >
                Step {activeStep + 1}
              </text>
            </g>
          )}
        </svg>
      </div>

      {/* Step Callout */}
      <AnimatePresence mode="wait">
        {activeStep >= 0 && activeStep < total && (
          <motion.div
            key={activeStep}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="p-5 rounded-2xl border border-blue-200 dark:border-blue-900/60 bg-blue-50/50 dark:bg-blue-950/20 shadow-sm"
          >
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 rounded-full bg-blue-500 text-white text-sm font-bold flex items-center justify-center shrink-0 mt-0.5 shadow">
                {activeStep + 1}
              </div>
              <div className="flex-1 min-w-0 space-y-1.5">
                <h4 className="font-bold text-base sm:text-lg text-foreground">
                  {STEPS[activeStep].title}
                </h4>
                <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                  {STEPS[activeStep].desc}
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Completion Banner */}
      {isComplete && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-5 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/40 rounded-2xl flex items-center gap-3.5"
        >
          <ShieldCheck className="text-emerald-500 shrink-0" size={24} />
          <p className="text-sm sm:text-base font-semibold text-emerald-700 dark:text-emerald-400 leading-relaxed">
            <strong>OAuth 2.0 Authorization Code 인증 완료!</strong><br />
            시퀀스 흐름이 완벽히 검증되었습니다. 사용자의 브라우저를 통한 Redirect와 백채널(Server-to-Server) 요청이 명확히 격리되어 Access Token을 완전 무결하게 확보했습니다.
          </p>
        </motion.div>
      )}
    </div>
  );
}
