import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Pause, RotateCcw, ChevronLeft, ChevronRight, Server, Database, Key } from "lucide-react";

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

const NODE_BASE = "flex flex-col items-center gap-1.5 px-3 py-3 rounded-xl border-2 text-center transition-all duration-300 w-[100px] shrink-0 bg-card";
const NODE_STATUS: Record<Status, string> = {
  idle: "border-border",
  active: "border-blue-400 ring-2 ring-blue-400 ring-offset-1 dark:ring-offset-background shadow-lg shadow-blue-500/20",
  done: "border-emerald-400 bg-emerald-50/50 dark:bg-emerald-950/20",
  dim: "border-border opacity-20",
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

      {/* Traversal / Architecture Diagrams Side-by-side */}
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

            {/* Dynamic Diagram */}
            <div className="relative border border-border/60 rounded-xl p-3 h-[140px] flex items-center justify-between bg-card overflow-hidden">
              <motion.div className={`${NODE_BASE} ${NODE_STATUS[layerStatus(0, activeStep)]}`}>
                <span className="text-xl">👤</span>
                <span className="text-xs font-bold mt-1 text-foreground">Client</span>
              </motion.div>

              {/* Server & DB logic flow */}
              <div className="flex-1 flex items-center justify-around px-2 relative">
                {/* Flow lines */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
                  {(activeStep === 0 || activeStep === 3) && (
                    <motion.path
                      d="M 10 30 Q 75 10 140 30"
                      fill="none"
                      stroke="#3b82f6"
                      strokeWidth="2.5"
                      strokeDasharray="4 4"
                      animate={{ strokeDashoffset: [-20, 0] }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    />
                  )}
                  {activeStep === 2 && (
                    <motion.path
                      d="M 140 30 Q 75 50 10 30"
                      fill="none"
                      stroke="#10b981"
                      strokeWidth="2.5"
                      strokeDasharray="4 4"
                      animate={{ strokeDashoffset: [0, -20] }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    />
                  )}
                </svg>

                {/* Server */}
                <motion.div className={`${NODE_BASE} ${NODE_STATUS[layerStatus(1, activeStep)]} z-10`}>
                  <Server size={22} className="text-blue-500" />
                  <span className="text-[10px] font-semibold mt-1">Web Server</span>
                </motion.div>

                {/* Connection DB Arrow */}
                <div className="flex flex-col items-center gap-0.5">
                  <span className="text-[8px] text-amber-500 font-bold uppercase">DB Query</span>
                  <div className="h-0.5 w-12 bg-amber-400/80 relative">
                    {(activeStep === 1 || activeStep === 3) && (
                      <motion.div
                        className="absolute w-2 h-2 rounded-full bg-amber-500 top-1/2 -translate-y-1/2"
                        animate={{ left: ["0%", "100%"] }}
                        transition={{ duration: 0.8, repeat: Infinity }}
                      />
                    )}
                  </div>
                </div>

                {/* Session DB */}
                <motion.div className={`${NODE_BASE} ${NODE_STATUS[layerStatus(2, activeStep)]} z-10`}>
                  <Database size={22} className="text-amber-500" />
                  <span className="text-[10px] font-semibold mt-1">Session DB</span>
                </motion.div>
              </div>
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

            {/* Dynamic Diagram */}
            <div className="relative border border-border/60 rounded-xl p-3 h-[140px] flex items-center justify-between bg-card overflow-hidden">
              <motion.div className={`${NODE_BASE} ${NODE_STATUS[layerStatus(3, activeStep)]}`}>
                <span className="text-xl">👤</span>
                <span className="text-xs font-bold mt-1 text-foreground">Client</span>
              </motion.div>

              {/* Only client & Server, no DB storage line */}
              <div className="flex-1 flex items-center justify-center relative">
                <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
                  {(activeStep === 0 || activeStep === 3) && (
                    <motion.path
                      d="M 10 70 Q 75 40 140 70"
                      fill="none"
                      stroke="#a78bfa"
                      strokeWidth="2.5"
                      strokeDasharray="4 4"
                      animate={{ strokeDashoffset: [-20, 0] }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    />
                  )}
                  {activeStep === 2 && (
                    <motion.path
                      d="M 140 70 Q 75 100 10 70"
                      fill="none"
                      stroke="#10b981"
                      strokeWidth="2.5"
                      strokeDasharray="4 4"
                      animate={{ strokeDashoffset: [0, -20] }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    />
                  )}
                </svg>

                <motion.div className={`${NODE_BASE} ${NODE_STATUS[layerStatus(4, activeStep)]} relative border border-violet-500/20 rounded-xl p-2.5 bg-violet-50/10 z-10`}>
                  <Server size={22} className="text-violet-500" />
                  <span className="text-[10px] font-semibold mt-1">Web Server</span>
                  {activeStep === 3 && (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                      className="absolute -top-2 -right-2 text-amber-500"
                    >
                      <Key size={12} />
                    </motion.div>
                  )}
                </motion.div>
              </div>
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
            className="p-5 rounded-2xl border border-blue-200 dark:border-blue-900/60 bg-blue-50/50 dark:bg-blue-950/20 shadow-sm"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <span className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wide">세션 처리 설명</span>
                <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">{stepData.sessionDesc}</p>
              </div>
              <div className="space-y-1">
                <span className="text-xs font-bold text-violet-600 dark:text-violet-400 uppercase tracking-wide">JWT 처리 설명</span>
                <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">{stepData.jwtDesc}</p>
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
