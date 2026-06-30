import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Pause, RotateCcw, ChevronLeft, ChevronRight } from "lucide-react";

// Steps for Side-by-Side Comparison with completely defined node states
const STEPS = [
  {
    title: "1. 로그인 요청 (Authentication)",
    nodes: { session: [0, 1], jwt: [3, 4] },
    sessionDesc: "클라이언트가 사용자 ID와 비밀번호를 평문으로 서버에 전송하며 로그인을 요청합니다.",
    jwtDesc: "클라이언트가 동일하게 사용자 ID와 비밀번호를 서버에 전송하며 인증을 요청합니다.",
    sessionPayload: "POST /login\nContent-Type: application/json\n\n{ \"username\": \"alice\" }",
    jwtPayload: "POST /login\nContent-Type: application/json\n\n{ \"username\": \"alice\" }",
    flow: "login",
  },
  {
    title: "2. 상태 저장 vs 자체 서명 (Store vs Issue)",
    nodes: { session: [1, 2], jwt: [4] },
    sessionDesc: "서버가 정보를 검증한 뒤 세션 ID를 생성하고, 세션 DB/Redis에 세션 ID와 사용자 세부 정보(권한 등)를 저장합니다.",
    jwtDesc: "서버가 정보를 검증한 뒤, 사용자 정보와 만료 시간을 담은 JSON 데이터(Payload)에 서버만 아는 시크릿 키로 디지털 서명하여 JWT 토큰을 발행합니다. (서버 측 저장소 이용 없음)",
    sessionPayload: "Session DB 저장 완료\n- Session ID: sess_8f21bc90\n- Data: { userId: 123, role: 'admin' }",
    jwtPayload: "JWT 토큰 생성 완료\n[Header].[Payload].[Signature]\n- Header: { alg: HS256 }\n- Payload: { userId: 123, role: 'admin' }\n- Signature: HMACSHA256(Header+Payload, ServerSecretKey)",
    flow: "store",
  },
  {
    title: "3. 토큰 전달 및 보관 (Token Return)",
    nodes: { session: [1, 0], jwt: [4, 3] },
    sessionDesc: "서버는 클라이언트 브라우저로 'Set-Cookie: session_id=sess_8f21bc90'를 전송해 쿠키에 세션 ID를 자동 저장하도록 합니다.",
    jwtDesc: "서버는 HTTP 응답 본문(JSON)에 JWT 토큰을 담아 반환하며, 클라이언트는 이를 LocalStorage 또는 쿠키에 직접 보관합니다.",
    sessionPayload: "Set-Cookie: session_id=sess_8f21bc90; HttpOnly",
    jwtPayload: "{\n  \"accessToken\": \"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEyMywicm9sZSI6ImFkbWluIn0.c2lnbmF0dXJl\"\n}",
    flow: "return",
  },
  {
    title: "4. 자원 요청 및 검증 방식 (API Request & Verify)",
    nodes: { session: [0, 1, 2], jwt: [3, 4] },
    sessionDesc: "클라이언트가 API를 호출하면 브라우저가 쿠키에 있는 세션 ID를 자동으로 동봉해 전송합니다. 서버는 세션 ID를 받아 반드시 세션 DB를 '조회'하러 가야 합니다. (DB 병목 가능)",
    jwtDesc: "클라이언트가 API를 호출할 때 Authorization 헤더에 토큰을 실어 전송합니다. 서버는 DB를 거치지 않고, 오직 자신의 시크릿 키만 사용하여 토큰의 유효성을 로컬 메모리에서 즉시 검증합니다. (DB 접근 0회)",
    sessionPayload: "GET /api/user\nCookie: session_id=sess_8f21bc90\n==> DB Query: SELECT * FROM sessions WHERE id = 'sess_8f21bc90'",
    jwtPayload: "GET /api/user\nAuthorization: Bearer eyJhbGciOiJIUzI1...\n==> Local CPU Verification (서명 키 유효성 체크)",
    flow: "verify",
  },
];

const COMPARISON = [
  { feature: "인증 상태 저장소", session: "서버 세션 DB / Redis (Stateful)", jwt: "없음 - 클라이언트가 토큰 직접 관리 (Stateless)" },
  { feature: "다중 서버 확장성", session: "불리 (세션 복제 또는 분산 세션 DB 연동 필요)", jwt: "유리 (모든 서버가 서명 키만 공유하면 자체 검증 가능)" },
  { feature: "강제 로그아웃 (제어)", session: "매우 쉬움 (서버에서 세션 레코드 삭제 즉시 만료)", jwt: "어려움 (만료 시각 전까지는 유효, 블랙리스트 필요)" },
  { feature: "데이터 전송 비용", session: "최소화 (짧은 임의 문자열 세션 ID만 전송)", jwt: "큼 (토큰 내 유저 세부 데이터가 들어 있어 헤더 부하)" },
  { feature: "메모리 / I/O 비용", session: "유저가 늘어날수록 서버 메모리 및 DB I/O 부담 증가", jwt: "서버 리소스 거의 소모 안 함 (CPU 대칭 연산만 수행)" },
];

type Status = "idle" | "active" | "done" | "dim";

function layerStatus(nodeId: number, activeStep: number): Status {
  if (activeStep < 0) return "idle";
  const cur = STEPS[activeStep];
  const allActive = [...(cur?.nodes.session ?? []), ...(cur?.nodes.jwt ?? [])];
  if (allActive.includes(nodeId)) return "active";

  for (let i = 0; i < activeStep; i++) {
    const s = STEPS[i];
    const prev = [...(s.nodes.session ?? []), ...(s.nodes.jwt ?? [])];
    if (prev.includes(nodeId)) return "done";
  }
  return "dim";
}

const NODE_COLORS: Record<Status, { stroke: string; fill: string; opacity: number }> = {
  idle: { stroke: "#cbd5e1", fill: "var(--card, #ffffff)", opacity: 1 },
  active: { stroke: "#3b82f6", fill: "#eff6ff", opacity: 1 },
  done: { stroke: "#10b981", fill: "#ecfdf5", opacity: 1 },
  dim: { stroke: "#cbd5e1", fill: "var(--card, #ffffff)", opacity: 0.35 },
};

export default function JwtVsSessionViz() {
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
    const t = setTimeout(() => setActiveStep((p) => p + 1), 2400);
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
  const stepData = activeStep >= 0 ? STEPS[activeStep] : null;

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex items-center gap-3 flex-wrap">
        <button
          onClick={handleReset}
          className="p-2.5 rounded-lg border border-card-border bg-card hover:bg-muted transition-colors text-muted-foreground"
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
          {isComplete ? "다시 보기" : isPlaying ? "일시정지" : activeStep < 0 ? "비교 시작" : "계속"}
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
          <div className="text-xs sm:text-sm text-muted-foreground">
            {activeStep >= 0 ? `단계 ${activeStep + 1} / ${total} — ${STEPS[activeStep].title}` : `총 ${total}단계`}
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

      {/* Traversal / Architecture Diagrams Side-by-side using 100% SVG for perfect rendering alignment */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Stateful Session Column */}
        <div className="border border-border rounded-2xl p-4 bg-muted/5 flex flex-col justify-between min-h-[400px]">
          <div>
            <div className="flex justify-between items-center mb-3">
              <span className="text-sm font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                💾 세션 인증 아키텍처 (Stateful)
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 font-bold">
                DB 검증 필수
              </span>
            </div>

            {/* SVG Diagram Area */}
            <div className="relative border border-border/60 rounded-xl p-1 bg-card overflow-hidden">
              <svg className="w-full h-auto aspect-[320/120] block" viewBox="0 0 320 120">
                {/* Background Links */}
                <line x1={45} y1={60} x2={160} y2={60} stroke="#cbd5e1" strokeWidth="1.5" strokeDasharray="3 3" className="dark:stroke-slate-700" />
                <line x1={160} y1={60} x2={275} y2={60} stroke="#cbd5e1" strokeWidth="1.5" strokeDasharray="3 3" className="dark:stroke-slate-700" />

                {/* Packet Animations */}
                {activeStep === 0 && (
                  <motion.circle r="6" fill="#3b82f6" initial={{ cx: 45 }} animate={{ cx: 160 }} transition={{ duration: 1.2, repeat: Infinity }} cy="60" />
                )}
                {activeStep === 1 && (
                  <motion.circle r="6" fill="#f59e0b" initial={{ cx: 160 }} animate={{ cx: 275 }} transition={{ duration: 1.2, repeat: Infinity }} cy="60" />
                )}
                {activeStep === 2 && (
                  <motion.circle r="6" fill="#10b981" initial={{ cx: 160 }} animate={{ cx: 45 }} transition={{ duration: 1.2, repeat: Infinity }} cy="60" />
                )}
                {activeStep === 3 && (
                  <>
                    <motion.circle r="6" fill="#3b82f6" initial={{ cx: 45 }} animate={{ cx: 160 }} transition={{ duration: 1.2, repeat: Infinity }} cy="60" />
                    <motion.circle r="4" fill="#f59e0b" initial={{ cx: 160 }} animate={{ cx: 275 }} transition={{ duration: 1.2, repeat: Infinity, delay: 0.3 }} cy="60" />
                  </>
                )}

                {/* Client Node (0) */}
                <g transform="translate(45, 60)">
                  <rect x="-30" y="-30" width="60" height="60" rx="8" fill={NODE_COLORS[layerStatus(0, activeStep)].fill} stroke={NODE_COLORS[layerStatus(0, activeStep)].stroke} strokeWidth="1.5" className="fill-card dark:fill-slate-900" />
                  <text x="0" y="-5" textAnchor="middle" fontSize="18">👤</text>
                  <text x="0" y="15" textAnchor="middle" fontSize="8" fontWeight="bold" className="fill-foreground">Client</text>
                </g>

                {/* Server Node (1) */}
                <g transform="translate(160, 60)">
                  <rect x="-30" y="-30" width="60" height="60" rx="8" fill={NODE_COLORS[layerStatus(1, activeStep)].fill} stroke={NODE_COLORS[layerStatus(1, activeStep)].stroke} strokeWidth="1.5" className="fill-card dark:fill-slate-900" />
                  <text x="0" y="-5" textAnchor="middle" fontSize="18">🖥️</text>
                  <text x="0" y="15" textAnchor="middle" fontSize="8" fontWeight="bold" className="fill-foreground">Server</text>
                </g>

                {/* DB Node (2) */}
                <g transform="translate(275, 60)">
                  <rect x="-30" y="-30" width="60" height="60" rx="8" fill={NODE_COLORS[layerStatus(2, activeStep)].fill} stroke={NODE_COLORS[layerStatus(2, activeStep)].stroke} strokeWidth="1.5" className="fill-card dark:fill-slate-900" />
                  <text x="0" y="-5" textAnchor="middle" fontSize="18">💾</text>
                  <text x="0" y="15" textAnchor="middle" fontSize="8" fontWeight="bold" className="fill-foreground">DB</text>
                </g>
              </svg>
            </div>

            {/* Code / Data representation box */}
            <div className="mt-4">
              <span className="text-xs font-semibold text-muted-foreground block mb-1">
                서버 세션 저장 상태 / 통신 데이터
              </span>
              <pre className="p-3 bg-muted rounded-xl text-xs font-mono text-foreground leading-relaxed overflow-x-auto h-[130px] border border-border/60">
                {stepData ? stepData.sessionPayload : '// 비교를 시작해 주세요.'}
              </pre>
            </div>
          </div>
        </div>

        {/* Stateless JWT Column */}
        <div className="border border-border rounded-2xl p-4 bg-muted/5 flex flex-col justify-between min-h-[400px]">
          <div>
            <div className="flex justify-between items-center mb-3">
              <span className="text-sm font-bold text-violet-600 dark:text-violet-400 uppercase tracking-wider">
                🔑 JWT 인증 아키텍처 (Stateless)
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-400 font-bold">
                자체 암호 서명 검증
              </span>
            </div>

            {/* SVG Diagram Area */}
            <div className="relative border border-border/60 rounded-xl p-1 bg-card overflow-hidden">
              <svg className="w-full h-auto aspect-[320/120] block" viewBox="0 0 320 120">
                {/* Background Links */}
                <line x1={80} y1={60} x2={240} y2={60} stroke="#cbd5e1" strokeWidth="1.5" strokeDasharray="3 3" className="dark:stroke-slate-700" />

                {/* Packet Animations */}
                {activeStep === 0 && (
                  <motion.circle r="6" fill="#3b82f6" initial={{ cx: 80 }} animate={{ cx: 240 }} transition={{ duration: 1.2, repeat: Infinity }} cy="60" />
                )}
                {activeStep === 2 && (
                  <motion.circle r="6" fill="#10b981" initial={{ cx: 240 }} animate={{ cx: 80 }} transition={{ duration: 1.2, repeat: Infinity }} cy="60" />
                )}
                {activeStep === 3 && (
                  <motion.circle r="6" fill="#3b82f6" initial={{ cx: 80 }} animate={{ cx: 240 }} transition={{ duration: 1.2, repeat: Infinity }} cy="60" />
                )}

                {/* Client Node (3) */}
                <g transform="translate(80, 60)">
                  <rect x="-30" y="-30" width="60" height="60" rx="8" fill={NODE_COLORS[layerStatus(3, activeStep)].fill} stroke={NODE_COLORS[layerStatus(3, activeStep)].stroke} strokeWidth="1.5" className="fill-card dark:fill-slate-900" />
                  <text x="0" y="-5" textAnchor="middle" fontSize="18">👤</text>
                  <text x="0" y="15" textAnchor="middle" fontSize="8" fontWeight="bold" className="fill-foreground">Client</text>
                </g>

                {/* Server Node (4) */}
                <g transform="translate(240, 60)">
                  <rect x="-30" y="-30" width="60" height="60" rx="8" fill={NODE_COLORS[layerStatus(4, activeStep)].fill} stroke={NODE_COLORS[layerStatus(4, activeStep)].stroke} strokeWidth="1.5" className="fill-card dark:fill-slate-900" />
                  <text x="0" y="-5" textAnchor="middle" fontSize="18">🖥️</text>
                  <text x="0" y="15" textAnchor="middle" fontSize="8" fontWeight="bold" className="fill-foreground">Server</text>
                  
                  {/* Rotate key icon during verification step (Step 4) */}
                  {activeStep === 3 && (
                    <motion.text
                      x="20"
                      y="-12"
                      fontSize="10"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                      style={{ originX: "20px", originY: "-12px" }}
                    >
                      🔑
                    </motion.text>
                  )}
                </g>
              </svg>
            </div>

            {/* Code / Data representation box */}
            <div className="mt-4">
              <span className="text-xs font-semibold text-muted-foreground block mb-1">
                서버 메모리 데이터 / 토큰 포맷 구조
              </span>
              <pre className="p-3 bg-muted rounded-xl text-xs font-mono text-foreground leading-relaxed overflow-x-auto h-[130px] border border-border/60">
                {stepData ? stepData.jwtPayload : '// 비교를 시작해 주세요.'}
              </pre>
            </div>
          </div>
        </div>

      </div>

      {/* Traversal Info Description Box - 폰트 크기 2단계 업 */}
      <AnimatePresence mode="wait">
        {stepData && (
          <motion.div
            key={activeStep}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="p-5 rounded-2xl border border-blue-200 dark:border-blue-900/60 bg-blue-50/50 dark:bg-blue-950/20 shadow-sm text-sm sm:text-base text-muted-foreground leading-relaxed space-y-3"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <span className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wide">세션 처리 설명</span>
                <p className="leading-relaxed">{stepData.sessionDesc}</p>
              </div>
              <div className="space-y-1">
                <span className="text-xs font-bold text-violet-600 dark:text-violet-400 uppercase tracking-wide">JWT 처리 설명</span>
                <p className="leading-relaxed">{stepData.jwtDesc}</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Comparison table */}
      <div className="overflow-x-auto">
        <table className="w-full text-xs sm:text-sm border-collapse">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left py-2.5 px-3 text-muted-foreground font-semibold uppercase tracking-wider text-xs">비교 항목</th>
              <th className="text-center py-2.5 px-3 text-blue-600 dark:text-blue-400 font-bold">세션 기반</th>
              <th className="text-center py-2.5 px-3 text-violet-600 dark:text-violet-400 font-bold">JWT 토큰</th>
            </tr>
          </thead>
          <tbody>
            {COMPARISON.map((row, i) => (
              <tr key={row.feature} className={`border-b border-border/40 ${i % 2 === 0 ? "bg-muted/10" : ""}`}>
                <td className="py-3 px-3 font-semibold text-foreground text-xs sm:text-sm">{row.feature}</td>
                <td className="py-3 px-3 text-center text-muted-foreground text-xs sm:text-sm leading-relaxed">{row.session}</td>
                <td className="py-3 px-3 text-center text-muted-foreground text-xs sm:text-sm leading-relaxed">{row.jwt}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
