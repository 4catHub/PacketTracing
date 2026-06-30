import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Pause, ChevronLeft, ChevronRight, RotateCcw, ShieldCheck } from "lucide-react";

// OAuth 2.0 Authorization Code Grant Flow Steps
const STEPS = [
  {
    title: "1. 로그인 요청 (Redirect to Auth Server)",
    timing: "Redirect",
    srcNode: 0, // User
    dstNode: 2, // Auth Server
    desc: "사용자가 Client 서비스의 '소셜 로그인' 버튼을 클릭합니다. Client는 사용자를 Authorization Server의 로그인 페이지로 리다이렉트시킵니다. 이때 Client ID, Redirect URI, Scope 등이 쿼리 스트링에 포함됩니다.",
  },
  {
    title: "2. 로그인 및 동의 (Authenticate & Consent)",
    timing: "User Action",
    srcNode: 0, // User
    dstNode: 2, // Auth Server
    desc: "사용자가 Authorization Server에 자신의 계정으로 로그인하고, Client가 요청한 권한(Scope: 이메일, 프로필 등)에 대해 동의(Consent) 버튼을 누릅니다.",
  },
  {
    title: "3. 인증 코드 반환 (Authorization Code Return)",
    timing: "Redirect",
    srcNode: 2, // Auth Server
    dstNode: 1, // Client App
    desc: "인증이 성공하면 Authorization Server는 사용자의 브라우저를 통해 Client의 Redirect URI로 302 리다이렉트하며, 일회용 인증 코드(Authorization Code)를 전달합니다.",
  },
  {
    title: "4. 토큰 요청 (Access Token Request)",
    timing: "Backchannel",
    srcNode: 1, // Client App
    dstNode: 2, // Auth Server
    desc: "Client 백엔드 서버는 브라우저가 전달해준 인증 코드(Auth Code)와 자신의 비밀 키(Client Secret)를 모아 Authorization Server에 직접 HTTPS POST 요청을 보내 토큰을 청구합니다.",
  },
  {
    title: "5. Access Token 발급 (Token Issuance)",
    timing: "Backchannel",
    srcNode: 2, // Auth Server
    dstNode: 1, // Client App
    desc: "Authorization Server는 전송받은 코드와 Client Secret을 검증한 뒤, 안전한 채널을 통해 Access Token(및 필요 시 Refresh Token)을 Client 백엔드로 발급합니다.",
  },
  {
    title: "6. 리소스 요청 (Resource Request)",
    timing: "API Call",
    srcNode: 1, // Client App
    dstNode: 3, // Resource Server
    desc: "토큰을 획득한 Client 백엔드는 사용자의 데이터를 가져오기 위해 HTTP Authorization 헤더에 Access Token을 실어서 Resource Server에 자원을 요청합니다.",
  },
  {
    title: "7. 리소스 반환 및 로그인 완료 (Response & Login Success)",
    timing: "API Response",
    srcNode: 3, // Resource Server
    dstNode: 0, // User
    desc: "Resource Server는 토큰의 유효성을 검증한 뒤 Client에게 요청된 데이터를 반환하고, Client는 사용자의 로그인을 처리하여 최종 완료 화면을 브라우저에 표시합니다.",
  },
];

// Expanded coordinates for 650x380 viewport
const NODES = [
  { id: 0, icon: "👤", label: "Resource Owner", sub: "사용자 (브라우저)", x: 325, y: 50 },
  { id: 1, icon: "💻", label: "Client App", sub: "서비스 백엔드", x: 100, y: 200 },
  { id: 2, icon: "🔑", label: "Auth Server", sub: "인증 서버 (IDP)", x: 550, y: 200 },
  { id: 3, icon: "🖥️", label: "Resource Server", sub: "API 리소스 서버", x: 325, y: 330 },
];

type Status = "idle" | "active" | "done" | "dim";

function getNodeStatus(nodeId: number, activeStep: number): Status {
  if (activeStep < 0) return "idle";
  const currentStep = STEPS[activeStep];
  if (currentStep.srcNode === nodeId || currentStep.dstNode === nodeId) {
    return "active";
  }
  for (let i = 0; i < activeStep; i++) {
    if (STEPS[i].srcNode === nodeId || STEPS[i].dstNode === nodeId) {
      return "done";
    }
  }
  return "dim";
}

const NODE_BASE = "absolute flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 text-center transition-all duration-300 w-[125px] -translate-x-1/2 -translate-y-1/2 bg-card z-10 select-none shadow-sm";
const NODE_STATUS: Record<Status, string> = {
  idle: "border-border",
  active: "border-blue-400 ring-2 ring-blue-400 ring-offset-1 dark:ring-offset-background shadow-lg shadow-blue-500/20",
  done: "border-emerald-400 bg-emerald-50/50 dark:bg-emerald-950/20",
  dim: "border-border opacity-30",
};

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

  const getPacketPath = () => {
    if (activeStep < 0 || activeStep >= total) return null;
    const step = STEPS[activeStep];
    const src = NODES.find((n) => n.id === step.srcNode)!;
    const dst = NODES.find((n) => n.id === step.dstNode)!;

    return {
      x1: src.x,
      y1: src.y,
      x2: dst.x,
      y2: dst.y,
    };
  };

  const packet = getPacketPath();

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
                {STEPS[activeStep].timing}
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

      {/* Expanded Diagram Area */}
      <div className="relative w-full max-w-[650px] h-[380px] mx-auto border border-border rounded-2xl bg-muted/5 overflow-hidden">
        {/* SVG Connections & Packets */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none z-0" viewBox="0 0 650 380">
          <defs>
            <linearGradient id="activeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#3b82f6" />
              <stop offset="100%" stopColor="#10b981" />
            </linearGradient>
            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor="#3b82f6" floodOpacity="0.6" />
            </filter>
          </defs>

          {/* Background Static Links */}
          <line x1={325} y1={50} x2={100} y2={200} stroke="currentColor" strokeWidth="1.5" className="text-border/40" strokeDasharray="4 4" />
          <line x1={325} y1={50} x2={550} y2={200} stroke="currentColor" strokeWidth="1.5" className="text-border/40" strokeDasharray="4 4" />
          <line x1={100} y1={200} x2={550} y2={200} stroke="currentColor" strokeWidth="1.5" className="text-border/40" strokeDasharray="4 4" />
          <line x1={100} y1={200} x2={325} y2={330} stroke="currentColor" strokeWidth="1.5" className="text-border/40" strokeDasharray="4 4" />
          <line x1={325} y1={330} x2={325} y2={50} stroke="currentColor" strokeWidth="1.5" className="text-border/40" strokeDasharray="4 4" />

          {/* Active Highlight Connection */}
          {packet && (
            <motion.line
              x1={packet.x1}
              y1={packet.y1}
              x2={packet.x2}
              y2={packet.y2}
              stroke="url(#activeGrad)"
              strokeWidth="3.5"
              filter="url(#glow)"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.6, ease: "easeInOut" }}
            />
          )}

          {/* Flowing Packet (Data Dot) */}
          {packet && (
            <motion.circle
              r="7"
              fill="#3b82f6"
              filter="url(#glow)"
              initial={{ cx: packet.x1, cy: packet.y1 }}
              animate={{ cx: packet.x2, cy: packet.y2 }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                repeatType: "loop",
                ease: "easeInOut",
                delay: 0.4,
              }}
            />
          )}
        </svg>

        {/* Nodes */}
        {NODES.map((node) => {
          const status = getNodeStatus(node.id, activeStep);
          return (
            <motion.div
              key={node.id}
              style={{ left: node.x, top: node.y }}
              animate={status === "active" ? { scale: [1, 1.05, 1] } : { scale: 1 }}
              transition={status === "active" ? { repeat: Infinity, duration: 1.2, ease: "easeInOut" } : {}}
              className={`${NODE_BASE} ${NODE_STATUS[status]}`}
            >
              <span className="text-3xl leading-none select-none">{node.icon}</span>
              <span className="text-xs font-bold leading-tight text-foreground">{node.label}</span>
              <span className="text-[10px] text-muted-foreground leading-none">{node.sub}</span>
            </motion.div>
          );
        })}
      </div>

      {/* Step Callout */}
      <AnimatePresence mode="wait">
        {activeStep >= 0 && activeStep < total && (
          <motion.div
            key={activeStep}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="p-4 rounded-xl border border-blue-200 dark:border-blue-900/60 bg-blue-50/50 dark:bg-blue-950/20"
          >
            <div className="flex items-start gap-3">
              <div className="w-7 h-7 rounded-full bg-blue-500 text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                {activeStep + 1}
              </div>
              <div className="flex-1 min-w-0 space-y-1">
                <h4 className="font-semibold text-sm sm:text-base text-foreground">
                  {STEPS[activeStep].title}
                </h4>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
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
          className="p-4 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/40 rounded-xl flex items-center gap-3"
        >
          <ShieldCheck className="text-emerald-500 shrink-0" size={22} />
          <p className="text-xs sm:text-sm font-medium text-emerald-700 dark:text-emerald-400">
            <strong>OAuth 2.0 Authorization Code 인증 완료!</strong><br />
            인증 코드(Auth Code) 교환 덕분에 브라우저에 민감한 Access Token이 노출되지 않고 백엔드 간 보안 채널을 통해 토큰을 안전하게 획득했습니다.
          </p>
        </motion.div>
      )}
    </div>
  );
}
