import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Pause, ChevronLeft, ChevronRight, RotateCcw, ShieldCheck } from "lucide-react";

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
  { id: 0, icon: "💻", label: "Client Browser", x: 75, y: 145 },
  { id: 1, icon: "🖥️", label: "Web Server", x: 405, y: 145 },
];

type Status = "idle" | "active" | "done" | "dim";

function getNodeStatus(nodeId: number, activeStep: number): Status {
  if (activeStep < 0) return "idle";
  const step = STEPS[activeStep];
  if (activeStep === 2) return "active"; // DH 연산은 클라이언트/서버 상호 작용
  if (step.srcNode === nodeId || step.dstNode === nodeId) return "active";
  return "done";
}

const NODE_COLORS: Record<Status, { stroke: string; fill: string; opacity: number }> = {
  idle: { stroke: "var(--border, #cbd5e1)", fill: "var(--card, #ffffff)", opacity: 1 },
  active: { stroke: "#3b82f6", fill: "rgba(59, 130, 246, 0.08)", opacity: 1 },
  done: { stroke: "#10b981", fill: "rgba(16, 185, 129, 0.08)", opacity: 1 },
  dim: { stroke: "var(--border, #cbd5e1)", fill: "var(--card, #ffffff)", opacity: 0.35 },
};

export default function HttpsHandshakeViz() {
  const [activeStep, setActiveStep] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const total = STEPS.length;
  const isComplete = activeStep >= total - 1;

  useEffect(() => {
    if (!isPlaying) return;
    
    const t = setTimeout(() => {
      if (activeStep < total - 1) {
        setActiveStep((p) => p + 1);
      } else {
        setIsPlaying(false);
      }
    }, 2800);
    return () => clearTimeout(t);
  }, [isPlaying, activeStep, total]);

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

  const getPacketDirection = () => {
    if (activeStep < 0 || activeStep === 2) return null;
    const step = STEPS[activeStep];
    const src = NODES.find((n) => n.id === step.srcNode)!;
    const dst = NODES.find((n) => n.id === step.dstNode)!;
    return { x1: src.x, y1: src.y, x2: dst.x, y2: dst.y };
  };

  const packet = getPacketDirection();
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
          <div className="flex justify-between text-xs sm:text-sm text-muted-foreground font-semibold">
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

      {/* Main Diagram 100% SVG Viewport */}
      <div className="relative w-full max-w-[480px] mx-auto border border-border rounded-2xl bg-muted/5 overflow-hidden">
        <svg viewBox="0 0 480 270" className="w-full h-auto block select-none">
          <defs>
            <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
              <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#000000" floodOpacity="0.1" />
            </filter>
            <filter id="glow-blue" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="1" stdDeviation="3" floodColor="#3b82f6" floodOpacity="0.4" />
            </filter>
            <filter id="glow-green" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="0" stdDeviation="6" floodColor="#10b981" floodOpacity="0.6" />
            </filter>
            <filter id="glow-violet" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="1" stdDeviation="3" floodColor="#8b5cf6" floodOpacity="0.4" />
            </filter>
            <filter id="glow-amber" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="1" stdDeviation="3" floodColor="#f59e0b" floodOpacity="0.4" />
            </filter>

            <linearGradient id="secTunnelGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#3b82f6" />
              <stop offset="50%" stopColor="#10b981" />
              <stop offset="100%" stopColor="#8b5cf6" />
            </linearGradient>
          </defs>

          {/* HTTPS Secure Tunnel Background Shield/Border (Step 4) */}
          {activeStep === 3 && (
            <g key="secure-shield">
              <rect x="8" y="8" width="464" height="254" rx="14" fill="rgba(16, 185, 129, 0.02)" stroke="#10b981" strokeWidth="2" strokeDasharray="4 4" filter="url(#glow-green)" />
              <rect x="20" y="20" width="105" height="18" rx="4" fill="rgba(16, 185, 129, 0.1)" stroke="#10b981" strokeWidth="1" />
              <text x="26" y="32" fill="#10b981" fontSize="7.5" fontWeight="bold">🛡️ 보안 암호 터널 활성화</text>
            </g>
          )}

          {/* Connection line */}
          <line
            x1={NODES[0].x}
            y1={NODES[0].y}
            x2={NODES[1].x}
            y2={NODES[1].y}
            stroke={activeStep === 3 ? "url(#secTunnelGrad)" : "#cbd5e1"}
            strokeWidth={activeStep === 3 ? "4" : "1.5"}
            strokeDasharray={activeStep === 3 ? "0" : "4 4"}
            filter={activeStep === 3 ? "url(#glow-green)" : undefined}
            className="transition-all duration-500"
          />

          {/* Active handshake link path animation */}
          {packet && (
            <motion.line
              key={`handshake-link-${activeStep}`}
              x1={packet.x1}
              y1={packet.y1}
              x2={packet.x2}
              y2={packet.y2}
              stroke="url(#secTunnelGrad)"
              strokeWidth="3.5"
              filter="url(#glow-blue)"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.6 }}
            />
          )}

          {/* Packet Dot */}
          {packet && (
            <motion.circle
              key={`handshake-dot-${activeStep}`}
              r="7"
              fill="#8b5cf6"
              filter="url(#glow-violet)"
              initial={{ cx: packet.x1, cy: packet.y1 }}
              animate={{ cx: packet.x2, cy: packet.y2 }}
              transition={{
                duration: 1.4,
                repeat: Infinity,
                repeatType: "loop",
                ease: "easeInOut",
                delay: 0.2,
              }}
            />
          )}

          {/* Certificate Card flying animation (During step 2) */}
          {activeStep === 1 && (
            <motion.g
              key={`cert-card-${activeStep}`}
              initial={{ opacity: 0, x: 405, y: 95, scale: 0.8 }}
              animate={{ opacity: 1, x: 75, y: 95, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.6, repeat: Infinity, repeatDelay: 0.4 }}
            >
              <rect x="-42" y="-12" width="84" height="24" rx="6" fill="var(--card, #ffffff)" stroke="#8b5cf6" strokeWidth="1.5" filter="url(#shadow)" />
              <text x="-34" y="4" fontSize="12">📄</text>
              <text x="6" y="3" fill="#8b5cf6" fontSize="8" fontWeight="bold" textAnchor="middle">CA 인증서 전송</text>
            </motion.g>
          )}

          {/* CPU calculation animation (During step 3) */}
          {activeStep === 2 && (
            <motion.g
              key={`cpu-calc-${activeStep}`}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: [0.75, 1, 0.75], scale: [0.97, 1.03, 0.97] }}
              transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
              transform="translate(240, 75)"
            >
              <rect x="-95" y="-15" width="190" height="30" rx="8" fill="rgba(245, 158, 11, 0.08)" stroke="#f59e0b" strokeWidth="1" filter="url(#glow-amber)" />
              <text x="-76" y="5" fontSize="13">⚙️</text>
              <text x="9" y="4" fill="#f59e0b" fontSize="8.5" fontWeight="bold" textAnchor="middle">DH 키 유도 중 (g^xy mod p)</text>
            </motion.g>
          )}

          {/* Client & Server Nodes */}
          {NODES.map((node) => {
            const status = getNodeStatus(node.id, activeStep);
            const colors = NODE_COLORS[status];
            const isActive = status === "active";

            return (
              <g
                key={`node-${node.id}-${status}-${activeStep}`}
                transform={`translate(${node.x}, ${node.y})`}
              >
                {/* Node enclosure rect */}
                <motion.rect
                  x="-55"
                  y="-32"
                  width="110"
                  height="64"
                  rx="10"
                  fill={colors.fill}
                  stroke={colors.stroke}
                  strokeWidth="2"
                  filter={isActive ? "url(#glow-blue)" : "url(#shadow)"}
                  animate={isActive ? { scale: [1, 1.03, 1] } : { scale: 1 }}
                  transition={isActive ? { repeat: Infinity, duration: 1.5, ease: "easeInOut" } : {}}
                  className="transition-colors duration-300"
                />

                {/* Node icon & label */}
                <text x="0" y="-8" textAnchor="middle" fontSize="22">{node.icon}</text>
                <text x="0" y="16" textAnchor="middle" fill="var(--foreground, #000)" fontSize="9.5" fontWeight="bold">{node.label}</text>

                {/* Symmetric Session Key badge below the node */}
                {activeStep >= 2 && (
                  <g transform="translate(0, 48)" key={`key-badge-${node.id}`}>
                    <rect x="-38" y="-8" width="76" height="16" rx="4" fill="rgba(16, 185, 129, 0.08)" stroke="#10b981" strokeWidth="1" />
                    <text x="0" y="3" textAnchor="middle" fill="#10b981" fontSize="8" fontWeight="bold">🔑 대칭 세션키</text>
                  </g>
                )}
              </g>
            );
          })}
        </svg>
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
            className="p-5 rounded-2xl border border-blue-200 dark:border-blue-900/60 bg-blue-50/30 dark:bg-blue-950/10 shadow-sm"
          >
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 rounded-full bg-blue-500 text-white text-sm font-bold flex items-center justify-center shrink-0 mt-0.5 shadow">
                {activeStep + 1}
              </div>
              <div className="flex-1 min-w-0 space-y-1.5">
                <h4 className="font-bold text-base sm:text-lg text-foreground">
                  {stepData.title}
                </h4>
                <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
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
          <div className="text-xs sm:text-sm font-medium text-emerald-700 dark:text-emerald-400">
            <strong>HTTPS (TLS 1.3) 보안 세션 완비!</strong><br />
            CA 서명 인증서 유효성 검증과 디피-헬만(Diffie-Hellman) 키 교환을 거쳐 단 1회 왕복(1-RTT)만에 암호화 통신 채널이 생성되었습니다.
          </div>
        </motion.div>
      )}
    </div>
  );
}
