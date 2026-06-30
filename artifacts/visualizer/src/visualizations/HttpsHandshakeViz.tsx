import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Pause, ChevronLeft, ChevronRight, RotateCcw, Key, ShieldCheck, FileText, Cpu } from "lucide-react";

const STEPS = [
  {
    title: "1. Client Hello (암호 제안 & Key Share)",
    srcNode: 0,
    dstNode: 1,
    desc: "브라우저가 보안 연결을 시작합니다. 자신이 지원하는 대칭키 암호 알고리즘 목록(Cipher Suites)과 보안 난수(Client Random), 그리고 디피-헬만 계산을 위해 자신이 생성한 임의 공개 키값(Client Key Share: g^x)을 서버로 날려 보냅니다.",
    details: {
      cipher: "TLS_AES_256_GCM_SHA384, TLS_CHACHA20...",
      keyShare: "Client Public Key (g^x)",
      random: "0x89F0A2B1..."
    }
  },
  {
    title: "2. Server Hello & Certificate (암호 선택, 인증서 전달)",
    srcNode: 1,
    dstNode: 0,
    desc: "서버가 암호 방식을 결정하고 자신의 난수(Server Random)와 공개 키값(Server Key Share: g^y)을 전송합니다. 또한 신뢰할 수 있는 기관(CA)의 서명이 들어있는 서버 디지털 인증서(Certificate)와 인증서 검증용 디지털 서명을 함께 브라우저에 보냅니다.",
    details: {
      cipher: "Selected: TLS_AES_256_GCM_SHA384",
      keyShare: "Server Public Key (g^y)",
      cert: "Issuer: DigiCert / Verified Signature"
    }
  },
  {
    title: "3. 대칭 세션 키 유도 (DH Key Derivation)",
    srcNode: 0,
    dstNode: 0,
    desc: "브라우저는 브라우저에 내장된 신뢰 CA 리스트로 서버 인증서가 가짜가 아님을 확인합니다. 검증 후, 양측은 상대방의 Key Share 값과 자신의 Secret 값을 공식(g^xy mod p)에 대입하여 완전히 동일한 '세션 대칭키'를 각자 독립적으로 계산해 냅니다.",
    details: {
      math: "Client DH: (g^y)^x = g^xy | Server DH: (g^x)^y = g^xy",
      verify: "Certificate: VALID ✅",
      key: "Session Key 생성 완료!"
    }
  },
  {
    title: "4. Finished & 암호화 데이터 통신 시작 (Secure Channel)",
    srcNode: 0,
    dstNode: 1,
    desc: "서로 핸드셰이크가 안전하게 끝났음을 암호화 메시지로 확인(Finished)합니다. 이후 실시간으로 오가는 모든 요청(HTTP Request)과 응답(HTTP Response) 데이터를 방금 합의한 대칭키로 완전 암호화(HTTPS)하여 안전하게 교환합니다.",
    details: {
      status: "HTTPS Tunnel Established",
      cipher: "AES-256-GCM Encrypted",
      key: "🔑 Session Key 활성화"
    }
  },
];

const NODES = [
  { id: 0, icon: "💻", label: "Client Browser", x: 70, y: 150 },
  { id: 1, icon: "🖥️", label: "Web Server", x: 330, y: 150 },
];

type Status = "idle" | "active" | "done" | "dim";

function getNodeStatus(nodeId: number, activeStep: number): Status {
  if (activeStep < 0) return "idle";
  const step = STEPS[activeStep];
  if (activeStep === 2 && nodeId === 0) return "active"; // DH 연산은 클라이언트/서버 동시 진행
  if (step.srcNode === nodeId || step.dstNode === nodeId) return "active";
  return "done";
}

const NODE_BASE = "absolute flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 text-center transition-all duration-300 w-[115px] -translate-x-1/2 -translate-y-1/2 bg-card z-10 select-none shadow-md";
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
    const t = setTimeout(() => setActiveStep((p) => p + 1), 2600);
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

  const getPacket = () => {
    if (activeStep < 0 || activeStep === 2) return null;
    const step = STEPS[activeStep];
    const src = NODES.find((n) => n.id === step.srcNode)!;
    const dst = NODES.find((n) => n.id === step.dstNode)!;
    return { x1: src.x, y1: src.y, x2: dst.x, y2: dst.y };
  };

  const packet = getPacket();
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
                {STEPS[activeStep].title}
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

      {/* Main Diagram Viewport */}
      <div className="relative w-full max-w-[480px] h-[270px] mx-auto border border-border rounded-2xl bg-muted/5 overflow-hidden">
        
        {/* Dynamic secure tunnel glow shield */}
        <AnimatePresence>
          {activeStep === 3 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-emerald-500/5 border-4 border-emerald-400/30 rounded-2xl z-0 pointer-events-none"
            />
          )}
        </AnimatePresence>

        <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
          <defs>
            <linearGradient id="secGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#3b82f6" />
              <stop offset="100%" stopColor="#8b5cf6" />
            </linearGradient>
            <filter id="secGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor="#3b82f6" floodOpacity="0.5" />
            </filter>
          </defs>

          {/* Core Handshake Line */}
          <line
            x1={NODES[0].x}
            y1={NODES[0].y}
            x2={NODES[1].x}
            y2={NODES[1].y}
            stroke="currentColor"
            strokeWidth={activeStep === 3 ? "3" : "1.5"}
            className={activeStep >= 3 ? "text-emerald-400" : "text-border/40"}
            strokeDasharray={activeStep >= 3 ? "0" : "4 4"}
            filter={activeStep === 3 ? "url(#secGlow)" : undefined}
          />

          {/* Message transmission animation */}
          {packet && (
            <motion.line
              x1={packet.x1}
              y1={packet.y1}
              x2={packet.x2}
              y2={packet.y2}
              stroke="url(#secGrad)"
              strokeWidth="4"
              filter="url(#secGlow)"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.6 }}
            />
          )}

          {/* Packet Dot */}
          {packet && (
            <motion.circle
              r="8"
              fill="#8b5cf6"
              filter="url(#secGlow)"
              initial={{ cx: packet.x1, cy: packet.y1 }}
              animate={{ cx: packet.x2, cy: packet.y2 }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                repeatType: "loop",
                ease: "easeInOut",
                delay: 0.3,
              }}
            />
          )}
        </svg>

        {/* Client & Server Nodes */}
        {NODES.map((node) => {
          const status = getNodeStatus(node.id, activeStep);
          return (
            <motion.div
              key={node.id}
              style={{ left: node.x, top: node.y }}
              animate={status === "active" ? { scale: [1, 1.05, 1] } : { scale: 1 }}
              transition={status === "active" ? { repeat: Infinity, duration: 1.2, ease: "easeInOut" } : {}}
              className={`${NODE_BASE} ${STATUS_STYLES[status]}`}
            >
              <span className="text-3xl leading-none">{node.icon}</span>
              <span className="text-xs font-bold text-foreground">{node.label}</span>

              {/* Symmetric Session Key generation visual */}
              {activeStep >= 2 && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.6 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex items-center gap-1 mt-1 px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[9px] font-bold border border-emerald-400/30"
                >
                  <Key size={10} className="animate-pulse" />
                  <span>대칭 세션키</span>
                </motion.div>
              )}
            </motion.div>
          );
        })}

        {/* Certificate Card flying animation (During step 2) */}
        <AnimatePresence>
          {activeStep === 1 && (
            <motion.div
              initial={{ opacity: 0, x: 280, y: 110, scale: 0.8 }}
              animate={{ opacity: 1, x: 130, y: 80, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 0.5 }}
              className="absolute p-1.5 rounded-lg border border-violet-300 bg-card shadow-lg flex items-center gap-1 z-20 text-[9px] font-bold text-violet-600"
            >
              <FileText size={10} />
              <span>CA인증서 전송</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* CPU calculation animation (During step 3) */}
        <AnimatePresence>
          {activeStep === 2 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.6 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              style={{ left: "50%", top: "25%" }}
              className="absolute -translate-x-1/2 flex flex-col items-center gap-1 bg-amber-50 dark:bg-amber-950/20 px-3 py-1 rounded-xl border border-amber-300 text-[10px] font-bold text-amber-700 dark:text-amber-400 z-20 shadow-sm"
            >
              <Cpu size={14} className="animate-spin text-amber-500" style={{ animationDuration: '3s' }} />
              <span>DH 키 유도 공식 실행 중 (g^xy mod p)</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Info-rich payload display block */}
      <div className="border border-border/60 rounded-2xl p-4 bg-muted/5">
        <span className="text-xs sm:text-sm font-bold text-muted-foreground block mb-2">
          🔍 상세 정보 및 전송 데이터 흐름
        </span>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-[11px] sm:text-xs">
          {stepData?.details ? (
            Object.entries(stepData.details).map(([key, val]) => (
              <div key={key} className="p-2.5 rounded-xl bg-card border border-border/60 space-y-1">
                <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-tight">
                  {key === "cipher" ? "암호 제품군 (Cipher)" : key === "keyShare" ? "DH 공개 키 (Key Share)" : key === "random" ? "보안 난수 (Random)" : key === "cert" ? "CA 인증서 (Cert)" : key === "math" ? "수학적 유도 공식" : "정보"}
                </span>
                <p className="font-mono text-foreground leading-relaxed break-all select-all font-semibold">
                  {val}
                </p>
              </div>
            ))
          ) : (
            <div className="col-span-3 text-center py-4 text-muted-foreground italic text-xs">
              인증 시작 버튼을 누르면 교환 데이터가 여기에 표시됩니다.
            </div>
          )}
        </div>
      </div>

      {/* Step Callout */}
      <AnimatePresence mode="wait">
        {stepData && (
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
                  {stepData.title}
                </h4>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  {stepData.desc}
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
          <ShieldCheck className="text-emerald-500 shrink-0 mt-0.5 animate-pulse" size={20} />
          <p className="text-xs sm:text-sm font-medium text-emerald-700 dark:text-emerald-400">
            <strong>HTTPS (TLS 1.3) 보안 세션 완비!</strong><br />
            CA 서명 인증서 유효성 검증과 디피-헬만(Diffie-Hellman) 키 교환을 거쳐 단 1회 왕복(1-RTT)만에 암호화 통신 채널이 생성되었습니다.
          </p>
        </motion.div>
      )}
    </div>
  );
}
