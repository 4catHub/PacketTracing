import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Pause, ChevronLeft, ChevronRight, RotateCcw, Key, ShieldAlert, CheckCircle2 } from "lucide-react";

const STEPS = [
  {
    title: "1. Client Hello (제안 및 Key Share)",
    srcNode: 0,
    dstNode: 1,
    desc: "클라이언트가 지원하는 암호 제품군(Cipher Suites) 리스트와 함께, 디피-헬만(Diffie-Hellman) 키 교환을 위해 자신이 임의로 생성한 공개 파라미터 값(Client Key Share)을 서버에 전송합니다.",
    tag: "TLS 1.3 - 1 RTT 시작",
  },
  {
    title: "2. Server Hello (선택, 인증서 및 Key Share)",
    srcNode: 1,
    dstNode: 0,
    desc: "서버는 클라이언트가 제시한 암호 중 하나를 선택하고, 자신의 공개 파라미터(Server Key Share)와 신뢰할 수 있는 기관(CA)의 디지털 서명이 포함된 인증서(Certificate)를 함께 반환합니다.",
    tag: "서버 검증 데이터 획득",
  },
  {
    title: "3. 대칭 세션 키 생성 (Key Derivation & Verify)",
    srcNode: 0,
    dstNode: 0,
    desc: "클라이언트는 내장된 CA 공개키로 서버 인증서의 신뢰성을 검증합니다. 통과 시, 양측은 상대방의 Key Share 값과 자신의 Secret 값을 디피-헬만 알고리즘으로 수학적 조합하여 동일한 '세션 대칭키(Session Key)'를 각자 로컬 메모리상에 생성합니다.",
    tag: "비밀 공유 대칭키 확보 완료",
  },
  {
    title: "4. 암호화 통신 개시 (Finished & Encrypted App Data)",
    srcNode: 0,
    dstNode: 1,
    desc: "양측은 합의된 세션 대칭키로 Handshake 과정을 마무리(Finished)함을 선언하고, 이후 실시간으로 주고받는 모든 HTTP 요청과 응답 데이터(HTML, JSON 등)를 이 대칭키로 안전하게 암호화하여 통신합니다.",
    tag: "보안 채널 수립 (HTTPS)",
  },
];

const NODES = [
  { id: 0, icon: "💻", label: "Client Browser", x: 60, y: 150 },
  { id: 1, icon: "🖥️", label: "Web Server", x: 340, y: 150 },
];

type Status = "idle" | "active" | "done" | "dim";

function getNodeStatus(nodeId: number, activeStep: number): Status {
  if (activeStep < 0) return "idle";
  const step = STEPS[activeStep];
  if (activeStep === 2 && nodeId === 0) return "active"; // 3단계는 클라이언트 중심 자체 연산
  if (step.srcNode === nodeId || step.dstNode === nodeId) return "active";
  return "done";
}

const NODE_BASE = "absolute flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 text-center transition-all duration-300 w-[110px] -translate-x-1/2 -translate-y-1/2 bg-card z-10 select-none shadow-md";
const STATUS_STYLES: Record<Status, string> = {
  idle: "border-border",
  active: "border-blue-400 ring-2 ring-blue-400 ring-offset-1 dark:ring-offset-background shadow-lg shadow-blue-500/20",
  done: "border-emerald-400 bg-emerald-50/50 dark:bg-emerald-950/20",
  dim: "border-border opacity-30",
};

export default function HttpsHandshakeViz() {
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

  // 패킷 전송 애니메이션 경로 정보
  const getPacket = () => {
    if (activeStep < 0 || activeStep === 2) return null; // 3단계(index 2)는 로컬 연산 단계이므로 패킷 이동 안 함
    const step = STEPS[activeStep];
    const src = NODES.find((n) => n.id === step.srcNode)!;
    const dst = NODES.find((n) => n.id === step.dstNode)!;
    return { x1: src.x, y1: src.y, x2: dst.x, y2: dst.y };
  };

  const packet = getPacket();

  return (
    <div className="space-y-5">
      {/* Controls */}
      <div className="flex items-center gap-2 flex-wrap">
        <button
          onClick={handleReset}
          className="p-2 rounded-lg border border-card-border bg-card hover:bg-muted text-muted-foreground transition-colors"
          data-testid="button-reset"
        >
          <RotateCcw size={15} />
        </button>
        <button
          onClick={handlePrev}
          disabled={activeStep < 0}
          className="p-2 rounded-lg border border-card-border bg-card hover:bg-muted text-muted-foreground disabled:opacity-40 transition-colors"
          data-testid="button-prev"
        >
          <ChevronLeft size={15} />
        </button>
        <button
          onClick={handlePlay}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:opacity-90 text-sm font-medium transition-opacity"
          data-testid="button-play-pause"
        >
          {isPlaying ? <Pause size={14} /> : <Play size={14} />}
          {isComplete ? "다시 보기" : isPlaying ? "일시정지" : activeStep < 0 ? "인증 시작" : "계속"}
        </button>
        <button
          onClick={handleNext}
          disabled={isComplete}
          className="p-2 rounded-lg border border-card-border bg-card hover:bg-muted text-muted-foreground disabled:opacity-40 transition-colors"
          data-testid="button-next"
        >
          <ChevronRight size={15} />
        </button>
        <div className="flex-1 space-y-1">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>단계 {Math.max(0, activeStep + 1)} / {total}</span>
            {activeStep >= 0 && (
              <span className="flex items-center gap-1 font-semibold text-primary">
                {STEPS[activeStep].tag}
              </span>
            )}
          </div>
          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-primary rounded-full"
              animate={{ width: `${Math.max(0, progress)}%` }}
              transition={{ duration: 0.4 }}
            />
          </div>
        </div>
      </div>

      {/* Visual Map Area */}
      <div className="relative w-full max-w-[440px] h-[260px] mx-auto border border-border rounded-2xl bg-muted/5 overflow-hidden">
        <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
          <defs>
            <linearGradient id="secGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#3b82f6" />
              <stop offset="100%" stopColor="#8b5cf6" />
            </linearGradient>
            <filter id="secGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="0" stdDeviation="3" floodColor="#3b82f6" floodOpacity="0.5" />
            </filter>
          </defs>

          {/* Connection Cable */}
          <line
            x1={NODES[0].x}
            y1={NODES[0].y}
            x2={NODES[1].x}
            y2={NODES[1].y}
            stroke="currentColor"
            strokeWidth="2"
            className={activeStep >= 3 ? "text-emerald-400" : "text-border/40"}
            strokeDasharray={activeStep === 3 ? "0" : "4 4"}
            filter={activeStep === 3 ? "url(#secGlow)" : undefined}
          />

          {/* Active Packet Animation */}
          {packet && (
            <motion.line
              x1={packet.x1}
              y1={packet.y1}
              x2={packet.x2}
              y2={packet.y2}
              stroke="url(#secGrad)"
              strokeWidth="3"
              filter="url(#secGlow)"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.5 }}
            />
          )}

          {/* Glowing Packet Particle */}
          {packet && (
            <motion.circle
              r="7"
              fill="#8b5cf6"
              filter="url(#secGlow)"
              initial={{ cx: packet.x1, cy: packet.y1 }}
              animate={{ cx: packet.x2, cy: packet.y2 }}
              transition={{
                duration: 1.4,
                repeat: Infinity,
                repeatType: "loop",
                ease: "easeInOut",
                delay: 0.3,
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
              animate={status === "active" ? { scale: [1, 1.04, 1] } : { scale: 1 }}
              transition={status === "active" ? { repeat: Infinity, duration: 1.2, ease: "easeInOut" } : {}}
              className={`${NODE_BASE} ${STATUS_STYLES[status]}`}
            >
              <span className="text-2xl leading-none">{node.icon}</span>
              <span className="text-[10px] font-bold text-foreground">{node.label}</span>

              {/* Show Session Key Status */}
              {activeStep >= 2 && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex items-center gap-0.5 mt-1 px-1 py-0.5 rounded bg-emerald-500/10 text-emerald-500 text-[8px] font-bold"
                >
                  <Key size={8} />
                  <span>대칭키 보유</span>
                </motion.div>
              )}
            </motion.div>
          );
        })}

        {/* Cryptography Badge Overlay (Middle of the cable) */}
        <AnimatePresence>
          {activeStep >= 2 && (
            <motion.div
              initial={{ opacity: 0, y: 10, x: "-50%" }}
              animate={{ opacity: 1, y: 0, x: "-50%" }}
              exit={{ opacity: 0 }}
              style={{ left: "50%", top: "35%" }}
              className="absolute flex items-center gap-1 px-2 py-1 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400 text-[9px] font-bold z-20 shadow-sm border border-emerald-300 dark:border-emerald-800"
            >
              <CheckCircle2 size={10} strokeWidth={3} />
              <span>TLS 1.3 채널 암호화 활성화</span>
            </motion.div>
          )}
        </AnimatePresence>
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
              <div className="w-6 h-6 rounded-full bg-blue-500 text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                {activeStep + 1}
              </div>
              <div className="flex-1 min-w-0 space-y-1">
                <h4 className="font-semibold text-sm text-foreground">
                  {STEPS[activeStep].title}
                </h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
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
          className="p-4 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/40 rounded-xl flex items-start gap-3"
        >
          <Key className="text-emerald-500 shrink-0 mt-0.5 animate-pulse" size={18} />
          <p className="text-xs font-medium text-emerald-700 dark:text-emerald-400">
            <strong>HTTPS 보안 채널 구축 완료!</strong><br />
            비대칭 디피-헬만 알고리즘으로 양측이 안전하게 세션 대칭키를 획득했습니다. 이후 오가는 데이터는 이 대칭키로 완전 암호화되어 중간자 공격(MITM)을 원천 차단합니다.
          </p>
        </motion.div>
      )}
    </div>
  );
}
