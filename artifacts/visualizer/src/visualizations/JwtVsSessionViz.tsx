import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { RotateCcw, ChevronLeft, ChevronRight, Play, Pause, Database, Lock } from "lucide-react";
import { contentData } from "../data/content";

// 1. contentData에서 'jwt-vs-session' 슬러그 데이터 동기화
const content = contentData.find((item) => item.slug === "jwt-vs-session");
const rawSteps = content?.steps || [];

// 정적 설명글 가이드라인 클리닝 필터 적용
const steps = rawSteps.map((stepText) => {
  let title = "단계";
  let desc = stepText;

  if (stepText.includes(" - ")) {
    const parts = stepText.split(" - ");
    title = parts[0];
    desc = parts[1];
  } else if (stepText.includes(": ")) {
    const parts = stepText.split(": ");
    title = parts[0];
    desc = parts[1];
  }

  // ** 볼드체 마크다운 제거
  title = title.replace(/\*\*/g, "");
  desc = desc.replace(/\*\*/g, "");

  return { title, desc };
});

const total = steps.length;

const COMPARISON = [
  { feature: "보관 위치", session: "서버 세션 DB / 메모리", jwt: "클라이언트 LocalStorage / Cookie" },
  { feature: "검증 주체", session: "매 요청마다 DB 조회로 검증", jwt: "서버 비밀키 기반 Signature 수학 검증" },
  { feature: "DB 부하", session: "유저가 많아질수록 세션 DB 병목 발생 가능", jwt: "Stateless 무상태로 DB 조회 불필요" },
  { feature: "만료/제어", session: "서버에서 세션 삭제 시 즉시 만료 가능 (강제 로그아웃)", jwt: "발급 후 만료시간까지 통제 불가 (블랙리스트 필요)" },
];

export default function JwtVsSessionViz() {
  const [activeStep, setActiveStep] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(true);

  const isComplete = activeStep >= total - 1;
  const passedCount = isComplete ? total : Math.max(0, activeStep + 1);
  const progress = (passedCount / total) * 100;

  // Auto-cycling Loop: 마지막 단계 틱(Dwell) 지연 후 자동 순환되는 구조 유지
  useEffect(() => {
    if (!isPlaying) return;

    const t = setTimeout(() => {
      if (activeStep < total - 1) {
        setActiveStep((p) => p + 1);
      } else {
        // 마지막 단계 완료 후 2.5초 대기(Dwell) 후 자동 순환
        setActiveStep(-1);
      }
    }, 2800);
    return () => clearTimeout(t);
  }, [isPlaying, activeStep]);

  const handleReset = useCallback(() => {
    setActiveStep(-1);
    setIsPlaying(false);
  }, []);

  const handlePrev = useCallback(() => {
    setIsPlaying(false);
    if (activeStep >= 0) {
      setActiveStep((p) => p - 1);
    } else {
      setActiveStep(total - 1);
    }
  }, [activeStep]);

  const handleNext = useCallback(() => {
    setIsPlaying(false);
    if (activeStep < total - 1) {
      setActiveStep((p) => p + 1);
    } else {
      setActiveStep(-1);
    }
  }, [activeStep]);

  const handlePlay = useCallback(() => {
    if (isComplete) {
      setActiveStep(0);
      setIsPlaying(true);
    } else {
      setIsPlaying((p) => !p);
    }
  }, [isComplete]);

  const cleanText = (txt: string) => txt.replace(/\*\*/g, "");

  const currentStepTitle = activeStep >= 0 ? steps[activeStep].title : "인증 시작 대기";
  const currentStepDesc = activeStep >= 0 ? steps[activeStep].desc : "제어 버튼 또는 자동 재생을 가동하여 세션과 JWT의 통신 동작을 실시간으로 대조해 보세요.";

  const isNodeActive = (node: "client" | "server" | "auth" | "db" | "ride") => {
    if (activeStep < 0) return false;
    if (node === "client") return true;
    if (node === "server") return activeStep >= 1;
    if (node === "auth") return activeStep === 1;
    if (node === "db") return activeStep === 1 || activeStep === 2;
    if (node === "ride") return activeStep === 2;
    return false;
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Controls */}
      <div className="flex items-center gap-2 flex-wrap bg-slate-50/50 dark:bg-slate-900/30 p-2 rounded-xl border border-border/60 text-xs">
        <button
          onClick={handleReset}
          className="p-1.5 rounded-lg border border-border/80 bg-card hover:bg-muted transition-colors text-muted-foreground"
          data-testid="button-reset"
          title="초기화"
        >
          <RotateCcw size={13} />
        </button>
        <button
          onClick={handlePrev}
          className="p-1.5 rounded-lg border border-border/80 bg-card hover:bg-muted text-muted-foreground disabled:opacity-40 transition-colors"
          data-testid="button-prev"
          title="이전 단계"
        >
          <ChevronLeft size={13} />
        </button>
        <button
          onClick={handlePlay}
          className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground hover:opacity-90 text-xs font-semibold transition-opacity"
          data-testid="button-play-pause"
        >
          {isPlaying ? <Pause size={12} /> : <Play size={12} />}
          <span>{isPlaying ? "일시정지" : "재생"}</span>
        </button>
        <button
          onClick={handleNext}
          className="p-1.5 rounded-lg border border-border/80 bg-card hover:bg-muted text-muted-foreground disabled:opacity-40 transition-colors"
          data-testid="button-next"
          title="다음 단계"
        >
          <ChevronRight size={13} />
        </button>
        <div className="flex-1 min-w-[150px] flex items-center gap-2">
          <div className="text-[11px] text-muted-foreground font-semibold whitespace-nowrap">
            {activeStep >= 0 ? `${activeStep + 1} / ${total}` : "대기"}
          </div>
          <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-primary rounded-full"
              animate={{ width: `${Math.max(0, progress)}%` }}
              transition={{ duration: 0.4 }}
            />
          </div>
        </div>
      </div>

      {/* Explanation Callout */}
      <div className="p-5 rounded-2xl border border-border/80 bg-slate-50/80 dark:bg-slate-900/40 shadow-sm space-y-2">
        <h4 className="text-base sm:text-lg font-bold text-foreground flex items-center gap-2">
          <span className="w-2.5 h-4 rounded bg-primary" />
          {cleanText(currentStepTitle)}
        </h4>
        <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
          {cleanText(currentStepDesc)}
        </p>
      </div>

      {/* 2열 레이아웃: 좌측 세션 방식 vs 우측 JWT 방식 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        
        {/* ==================== 1열: 세션 기반 방식 ==================== */}
        <div className="space-y-4">
          <div className="text-sm font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1.5 justify-center py-1.5 bg-blue-50/50 dark:bg-blue-950/20 rounded-xl border border-blue-100 dark:border-blue-900/30">
            <span>🍪 세션 기반 방식 (Session)</span>
          </div>

          {/* Session SVG Diagram */}
          <div className="relative border border-border/80 rounded-2xl p-2 bg-white dark:bg-slate-950 overflow-hidden shadow-sm">
            <svg className="w-full h-auto aspect-[500/420] block text-foreground rounded-xl overflow-hidden" viewBox="0 0 500 420">
              <defs>
                <pattern id="grid-sess" width="20" height="20" patternUnits="userSpaceOnUse">
                  <path d="M 20 0 L 0 0 0 20" fill="none" stroke="currentColor" strokeWidth="0.5" className="text-slate-100 dark:text-slate-900/30" />
                </pattern>
                <filter id="shadow-sess" x="-20%" y="-20%" width="140%" height="140%">
                  <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="currentColor" floodOpacity="0.04" className="text-slate-900 dark:text-black" />
                </filter>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid-sess)" rx="12" ry="12" />

              {/* Edges */}
              <line x1={250} y1={85} x2={250} y2={185} stroke="currentColor" strokeWidth="1.5" strokeDasharray="3 3" className="text-slate-300 dark:text-slate-700" />
              <line x1={250} y1={210} x2={150} y2={335} stroke="currentColor" strokeWidth="1.5" strokeDasharray="3 3" className="text-slate-300 dark:text-slate-700" />
              <line x1={250} y1={210} x2={350} y2={335} stroke="currentColor" strokeWidth="1.5" strokeDasharray="3 3" className="text-slate-300 dark:text-slate-700" />

              {/* Client Node (상) */}
              <g transform="translate(250, 60)" className="cursor-default">
                <rect
                  x="-50" y="-25" width="100" height="50" rx="8"
                  className={`transition-all duration-300 ${
                    isNodeActive("client")
                      ? "stroke-blue-500 fill-blue-50/50 dark:fill-blue-950/20"
                      : "stroke-slate-200 dark:stroke-slate-800 fill-slate-50/50 dark:fill-slate-900/50"
                  }`}
                  strokeWidth={isNodeActive("client") ? 1.5 : 1}
                  filter="url(#shadow-sess)"
                />
                <text x="0" y="-6" textAnchor="middle" fill="currentColor" fontSize="11" fontWeight="700" className="fill-foreground font-sans">💻 CLIENT</text>
                <text x="0" y="10" textAnchor="middle" fill="currentColor" fontSize="8" className="fill-muted-foreground font-sans">회원 (브라우저)</text>
              </g>

              {/* Server Node (중) */}
              <g transform="translate(250, 210)">
                <rect
                  x="-50" y="-25" width="100" height="50" rx="8"
                  className={`transition-all duration-300 ${
                    isNodeActive("server")
                      ? "stroke-blue-500 fill-blue-50/50 dark:fill-blue-950/20"
                      : "stroke-slate-200 dark:stroke-slate-800 fill-slate-50/50 dark:fill-slate-900/50"
                  }`}
                  strokeWidth={isNodeActive("server") ? 1.5 : 1}
                  filter="url(#shadow-sess)"
                />
                <text x="0" y="-6" textAnchor="middle" fill="currentColor" fontSize="11" fontWeight="700" className="fill-foreground font-sans">🖥️ SERVER</text>
                <text x="0" y="10" textAnchor="middle" fill="currentColor" fontSize="8" className="fill-muted-foreground font-sans">인프라 API 서버</text>
              </g>

              {/* Auth DB Node (하 좌) */}
              <g transform="translate(150, 360)">
                <rect
                  x="-50" y="-25" width="100" height="50" rx="8"
                  className={`transition-all duration-300 ${
                    isNodeActive("db")
                      ? "stroke-blue-500 fill-blue-50/50 dark:fill-blue-950/20"
                      : "stroke-slate-200 dark:stroke-slate-800 fill-slate-50/50 dark:fill-slate-900/50"
                  }`}
                  strokeWidth={isNodeActive("db") ? 1.5 : 1}
                  filter="url(#shadow-sess)"
                />
                <text x="0" y="-6" textAnchor="middle" fill="currentColor" fontSize="11" fontWeight="700" className="fill-foreground font-sans">🗄️ SESSION DB</text>
                <text x="0" y="10" textAnchor="middle" fill="currentColor" fontSize="8" className="fill-muted-foreground font-sans">세션 스토어</text>
              </g>

              {/* Ride Service Node (하 우) */}
              <g transform="translate(350, 360)">
                <rect
                  x="-50" y="-25" width="100" height="50" rx="8"
                  className={`transition-all duration-300 ${
                    isNodeActive("ride")
                      ? "stroke-blue-500 fill-blue-50/50 dark:fill-blue-950/20"
                      : "stroke-slate-200 dark:stroke-slate-800 fill-slate-50/50 dark:fill-slate-900/50"
                  }`}
                  strokeWidth={isNodeActive("ride") ? 1.5 : 1}
                  filter="url(#shadow-sess)"
                />
                <text x="0" y="-6" textAnchor="middle" fill="currentColor" fontSize="11" fontWeight="700" className="fill-foreground font-sans">🎢 SERVICE</text>
                <text x="0" y="10" textAnchor="middle" fill="currentColor" fontSize="8" className="fill-muted-foreground font-sans">탑승 승인 서비스</text>
              </g>

              {/* Packets & Animations */}
              <AnimatePresence>
                {activeStep >= 0 && (
                  <g key={`session-packets-${activeStep}`}>
                    {activeStep === 0 && (
                      <motion.g
                        initial={{ x: 250, y: 60, opacity: 0 }}
                        animate={{ x: 250, y: 210, opacity: [0, 1, 1, 0] }}
                        transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
                      >
                        <circle cx="0" cy="0" r="5" className="fill-blue-500" />
                        <circle cx="0" cy="0" r="2" className="fill-white" />
                      </motion.g>
                    )}
                    {activeStep === 1 && (
                      <>
                        {/* Server ➔ DB 세션 키 기록 */}
                        <motion.g
                          initial={{ x: 250, y: 210, opacity: 0 }}
                          animate={{ x: 150, y: 360, opacity: [0, 1, 1, 0] }}
                          transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
                        >
                          <circle cx="0" cy="0" r="5" className="fill-amber-500" />
                          <text x="0" y="-8" textAnchor="middle" className="text-[7px] fill-amber-600 font-bold font-sans">DB WRITE</text>
                        </motion.g>
                        {/* Server ➔ Client 쿠키로 세션 키 전달 */}
                        <motion.g
                          initial={{ x: 250, y: 210, opacity: 0 }}
                          animate={{ x: 250, y: 60, opacity: [0, 1, 1, 0] }}
                          transition={{ duration: 1.8, repeat: Infinity, delay: 0.9, ease: "easeInOut" }}
                        >
                          <circle cx="0" cy="0" r="5" className="fill-blue-400" />
                          <text x="8" y="2" textAnchor="start" className="text-[7px] fill-blue-500 font-bold font-sans">Cookie 발급</text>
                        </motion.g>
                      </>
                    )}
                    {activeStep === 2 && (
                      <>
                        {/* Client ➔ Server API 호출 (쿠키 동반) */}
                        <motion.g
                          initial={{ x: 250, y: 60, opacity: 0 }}
                          animate={{ x: 250, y: 210, opacity: [0, 1, 1, 0] }}
                          transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
                        >
                          <circle cx="0" cy="0" r="5" className="fill-blue-500" />
                          <text x="-8" y="2" textAnchor="end" className="text-[7px] fill-blue-500 font-bold font-sans">Cookie 전송</text>
                        </motion.g>
                        {/* Server ➔ DB 세션 검증 */}
                        <motion.g
                          initial={{ x: 250, y: 210, opacity: 0 }}
                          animate={{ x: 150, y: 360, opacity: [0, 1, 1, 0] }}
                          transition={{ duration: 1.8, repeat: Infinity, delay: 0.6, ease: "easeInOut" }}
                        >
                          <circle cx="0" cy="0" r="4" className="fill-amber-500" />
                          <text x="-8" y="2" textAnchor="end" className="text-[7px] fill-amber-600 font-bold font-sans">조회</text>
                        </motion.g>
                        {/* Server ➔ Service 트래픽 흐름 */}
                        <motion.g
                          initial={{ x: 250, y: 210, opacity: 0 }}
                          animate={{ x: 350, y: 360, opacity: [0, 1, 1, 0] }}
                          transition={{ duration: 1.8, repeat: Infinity, delay: 1.2, ease: "easeInOut" }}
                        >
                          <circle cx="0" cy="0" r="5" className="fill-emerald-500" />
                          <text x="8" y="2" textAnchor="start" className="text-[7px] fill-emerald-600 font-bold font-sans">승인</text>
                        </motion.g>
                      </>
                    )}
                    {activeStep === 3 && (
                      <>
                        {/* Client ➔ Server API 호출 (만료된 쿠키) */}
                        <motion.g
                          initial={{ x: 250, y: 60, opacity: 0 }}
                          animate={{ x: 250, y: 210, opacity: [0, 1, 1, 0] }}
                          transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
                        >
                          <circle cx="0" cy="0" r="5" className="fill-red-400" />
                        </motion.g>
                        {/* Server ➔ DB 세션 확인 (부재) */}
                        <motion.g
                          initial={{ x: 250, y: 210, opacity: 0 }}
                          animate={{ x: 150, y: 360, opacity: [0, 1, 1, 0] }}
                          transition={{ duration: 1.8, repeat: Infinity, delay: 0.6, ease: "easeInOut" }}
                        >
                          <circle cx="0" cy="0" r="4" className="fill-red-400" />
                          <text x="-8" y="2" textAnchor="end" className="text-[7px] fill-red-500 font-bold font-sans">조회 실패</text>
                        </motion.g>
                      </>
                    )}

                    {/* Status Badges Overlays */}
                    {activeStep === 2 && (
                      <>
                        <motion.g
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0 }}
                          transform="translate(150, 310)"
                        >
                          <rect x="-24" y="-8" width="48" height="16" rx="4" className="fill-blue-50/95 dark:fill-blue-950/80 stroke-blue-200 dark:stroke-blue-800" strokeWidth="1" />
                          <text x="0" y="3" textAnchor="middle" className="fill-blue-600 dark:fill-blue-400 text-[8px] font-bold font-sans">EXIST ○</text>
                        </motion.g>
                        <motion.g
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0 }}
                          transform="translate(350, 310)"
                        >
                          <rect x="-30" y="-8" width="60" height="16" rx="4" className="fill-emerald-50/95 dark:fill-emerald-950/80 stroke-emerald-200 dark:stroke-emerald-800" strokeWidth="1" />
                          <text x="0" y="3" textAnchor="middle" className="fill-emerald-600 dark:fill-emerald-400 text-[8px] font-bold font-sans">ALLOWED 🎢</text>
                        </motion.g>
                      </>
                    )}
                    {activeStep === 3 && (
                      <motion.g
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0 }}
                        transform="translate(150, 310)"
                      >
                        <rect x="-24" y="-8" width="48" height="16" rx="4" className="fill-red-50/95 dark:fill-red-950/80 stroke-red-200 dark:stroke-red-800" strokeWidth="1" />
                        <text x="0" y="3" textAnchor="middle" className="fill-red-600 dark:fill-red-400 text-[8px] font-bold font-sans">NIL ❌</text>
                      </motion.g>
                    )}
                  </g>
                )}
              </AnimatePresence>
            </svg>
          </div>

          {/* Session Inspectors (세로 직렬 배치) */}
          <div className="space-y-4">
            {/* Cookie Inspector */}
            <div className="border border-border/60 rounded-2xl p-4 bg-slate-50/30 dark:bg-slate-900/10 shadow-sm space-y-3">
              <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-semibold text-sm">
                <span>🍪 Client Cookie Store (쿠키 저장소)</span>
              </div>
              <div className="p-3 bg-white dark:bg-slate-950 border border-border/60 rounded-xl min-h-[90px] flex flex-col justify-center shadow-inner">
                {activeStep === 0 ? (
                  <span className="text-xs text-muted-foreground italic text-center">쿠키가 존재하지 않습니다.</span>
                ) : activeStep === 3 ? (
                  <div className="space-y-1">
                    <span className="text-[10px] text-muted-foreground block font-mono">Cookie Header:</span>
                    <span className="text-xs font-mono text-red-500 font-semibold line-through">session_id=sess_key_vip_99</span>
                    <span className="text-[9px] text-red-500 block">(만료/삭제 상태)</span>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] text-muted-foreground font-mono">session_id</span>
                      <span className="text-[9px] bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 px-1.5 py-0.5 rounded font-mono font-semibold">HttpOnly</span>
                    </div>
                    <span className="text-xs font-mono text-blue-600 dark:text-blue-400 font-semibold break-all">sess_key_vip_99</span>
                  </div>
                )}
              </div>
            </div>

            {/* Session DB Inspector */}
            <div className="border border-border/60 rounded-2xl p-4 bg-slate-50/30 dark:bg-slate-900/10 shadow-sm space-y-3">
              <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-semibold text-sm">
                <Database size={15} />
                <span>🗄️ Server Session Database (세션 DB)</span>
              </div>
              <div className="p-3 bg-white dark:bg-slate-950 border border-border/60 rounded-xl min-h-[90px] flex flex-col justify-center shadow-inner">
                {activeStep === 0 ? (
                  <span className="text-xs text-muted-foreground italic text-center">세션 정보가 없습니다. (로그인 전)</span>
                ) : activeStep === 3 ? (
                  <div className="space-y-1 text-center">
                    <span className="text-xs text-red-500 font-semibold block">Record Deleted</span>
                    <span className="text-[10px] text-muted-foreground block font-mono">KEY 'sess_key_vip_99' =&gt; nil</span>
                  </div>
                ) : (
                  <div className="space-y-1 font-mono text-[10px]">
                    <div className="text-blue-600 dark:text-blue-400 font-semibold mb-1">KEY: sess_key_vip_99</div>
                    <div className="text-muted-foreground">
                      {`{`}
                      <div className="pl-3 text-foreground">"memberId": "gym_vip_gildong",</div>
                      <div className="pl-3 text-foreground">"name": "홍길동",</div>
                      <div className="pl-3 text-foreground">"grade": "VIP"</div>
                      {`}`}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ==================== 2열: JWT 토큰 방식 ==================== */}
        <div className="space-y-4">
          <div className="text-sm font-bold text-purple-600 dark:text-purple-400 flex items-center gap-1.5 justify-center py-1.5 bg-purple-50/50 dark:bg-purple-950/20 rounded-xl border border-purple-100 dark:border-purple-900/30">
            <span>🔑 JWT 토큰 방식 (JWT)</span>
          </div>

          {/* JWT SVG Diagram */}
          <div className="relative border border-border/80 rounded-2xl p-2 bg-white dark:bg-slate-955 overflow-hidden shadow-sm">
            <svg className="w-full h-auto aspect-[500/420] block text-foreground rounded-xl overflow-hidden" viewBox="0 0 500 420">
              <defs>
                <pattern id="grid-jwt" width="20" height="20" patternUnits="userSpaceOnUse">
                  <path d="M 20 0 L 0 0 0 20" fill="none" stroke="currentColor" strokeWidth="0.5" className="text-slate-100 dark:text-slate-900/30" />
                </pattern>
                <filter id="shadow-jwt" x="-20%" y="-20%" width="140%" height="140%">
                  <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="currentColor" floodOpacity="0.04" className="text-slate-900 dark:text-black" />
                </filter>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid-jwt)" rx="12" ry="12" />

              {/* Edges */}
              <line x1={250} y1={85} x2={250} y2={185} stroke="currentColor" strokeWidth="1.5" strokeDasharray="3 3" className="text-slate-300 dark:text-slate-700" />
              {/* JWT에서는 Server가 DB인증이 완료되면 더 이상 DB 조회를 안 함 (검증 단계선 DB 연결선 삭제) */}
              {activeStep <= 1 && (
                <line x1={250} y1={210} x2={150} y2={335} stroke="currentColor" strokeWidth="1.5" strokeDasharray="3 3" className="text-slate-300 dark:text-slate-700" />
              )}
              <line x1={250} y1={210} x2={350} y2={335} stroke="currentColor" strokeWidth="1.5" strokeDasharray="3 3" className="text-slate-300 dark:text-slate-700" />

              {/* Client Node (상) */}
              <g transform="translate(250, 60)" className="cursor-default">
                <rect
                  x="-50" y="-25" width="100" height="50" rx="8"
                  className={`transition-all duration-300 ${
                    isNodeActive("client")
                      ? "stroke-purple-500 fill-purple-50/50 dark:fill-purple-950/20"
                      : "stroke-slate-200 dark:stroke-slate-800 fill-slate-50/50 dark:fill-slate-900/50"
                  }`}
                  strokeWidth={isNodeActive("client") ? 1.5 : 1}
                  filter="url(#shadow-jwt)"
                />
                <text x="0" y="-6" textAnchor="middle" fill="currentColor" fontSize="11" fontWeight="700" className="fill-foreground font-sans">💻 CLIENT</text>
                <text x="0" y="10" textAnchor="middle" fill="currentColor" fontSize="8" className="fill-muted-foreground font-sans">회원 (브라우저)</text>
              </g>

              {/* Server Node (중) */}
              <g transform="translate(250, 210)">
                <rect
                  x="-50" y="-25" width="100" height="50" rx="8"
                  className={`transition-all duration-300 ${
                    isNodeActive("server")
                      ? "stroke-purple-500 fill-purple-50/50 dark:fill-purple-950/20"
                      : "stroke-slate-200 dark:stroke-slate-800 fill-slate-50/50 dark:fill-slate-900/50"
                  }`}
                  strokeWidth={isNodeActive("server") ? 1.5 : 1}
                  filter="url(#shadow-jwt)"
                />
                <text x="0" y="-6" textAnchor="middle" fill="currentColor" fontSize="11" fontWeight="700" className="fill-foreground font-sans">🖥️ SERVER</text>
                <text x="0" y="10" textAnchor="middle" fill="currentColor" fontSize="8" className="fill-muted-foreground font-sans">인프라 API 서버</text>
              </g>

              {/* Auth DB Node (하 좌) - 1단계까지만 로그인용 인증 DB 사용 */}
              {activeStep <= 1 && (
                <g transform="translate(150, 360)">
                  <rect
                    x="-50" y="-25" width="100" height="50" rx="8"
                    className={`transition-all duration-300 ${
                      isNodeActive("db")
                        ? "stroke-purple-500 fill-purple-50/50 dark:fill-purple-950/20"
                        : "stroke-slate-200 dark:stroke-slate-800 fill-slate-50/50 dark:fill-slate-900/50"
                    }`}
                    strokeWidth={isNodeActive("db") ? 1.5 : 1}
                    filter="url(#shadow-jwt)"
                  />
                  <text x="0" y="-6" textAnchor="middle" fill="currentColor" fontSize="11" fontWeight="700" className="fill-foreground font-sans">🗄️ MEMBER DB</text>
                  <text x="0" y="10" textAnchor="middle" fill="currentColor" fontSize="8" className="fill-muted-foreground font-sans">회원 계정 DB</text>
                </g>
              )}

              {/* Ride Service Node (하 우) */}
              <g transform="translate(350, 360)">
                <rect
                  x="-50" y="-25" width="100" height="50" rx="8"
                  className={`transition-all duration-300 ${
                    isNodeActive("ride")
                      ? "stroke-purple-500 fill-purple-50/50 dark:fill-purple-950/20"
                      : "stroke-slate-200 dark:stroke-slate-800 fill-slate-50/50 dark:fill-slate-900/50"
                  }`}
                  strokeWidth={isNodeActive("ride") ? 1.5 : 1}
                  filter="url(#shadow-jwt)"
                />
                <text x="0" y="-6" textAnchor="middle" fill="currentColor" fontSize="11" fontWeight="700" className="fill-foreground font-sans">🎢 SERVICE</text>
                <text x="0" y="10" textAnchor="middle" fill="currentColor" fontSize="8" className="fill-muted-foreground font-sans">탑승 승인 서비스</text>
              </g>

              {/* Packets & Animations */}
              <AnimatePresence>
                {activeStep >= 0 && (
                  <g key={`jwt-packets-${activeStep}`}>
                    {activeStep === 0 && (
                      <motion.g
                        initial={{ x: 250, y: 60, opacity: 0 }}
                        animate={{ x: 250, y: 210, opacity: [0, 1, 1, 0] }}
                        transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
                      >
                        <circle cx="0" cy="0" r="5" className="fill-purple-500" />
                        <circle cx="0" cy="0" r="2" className="fill-white" />
                      </motion.g>
                    )}
                    {activeStep === 1 && (
                      <>
                        {/* Server ➔ DB 계정 확인 */}
                        <motion.g
                          initial={{ x: 250, y: 210, opacity: 0 }}
                          animate={{ x: 150, y: 360, opacity: [0, 1, 1, 0] }}
                          transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
                        >
                          <circle cx="0" cy="0" r="5" className="fill-amber-500" />
                          <text x="0" y="-8" textAnchor="middle" className="text-[7px] fill-amber-600 font-bold font-sans">인증</text>
                        </motion.g>
                        {/* Server ➔ Client 토큰 서명 후 발급 */}
                        <motion.g
                          initial={{ x: 250, y: 210, opacity: 0 }}
                          animate={{ x: 250, y: 60, opacity: [0, 1, 1, 0] }}
                          transition={{ duration: 1.8, repeat: Infinity, delay: 0.9, ease: "easeInOut" }}
                        >
                          <circle cx="0" cy="0" r="5" className="fill-purple-400" />
                          <text x="8" y="2" textAnchor="start" className="text-[7px] fill-purple-500 font-bold font-sans">JWT 발급</text>
                        </motion.g>
                      </>
                    )}
                    {activeStep === 2 && (
                      <>
                        {/* Client ➔ Server API 호출 (JWT 전송) */}
                        <motion.g
                          initial={{ x: 250, y: 60, opacity: 0 }}
                          animate={{ x: 250, y: 210, opacity: [0, 1, 1, 0] }}
                          transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
                        >
                          <circle cx="0" cy="0" r="5" className="fill-purple-500" />
                          <text x="-8" y="2" textAnchor="end" className="text-[7px] fill-purple-500 font-bold font-sans">JWT 전송</text>
                        </motion.g>
                        {/* DB 조회 없이 Server 자체 서명 해독(Signature Check) */}
                        <motion.g
                          initial={{ x: 250, y: 210, scale: 0.7, opacity: 0 }}
                          animate={{ scale: [0.7, 1.3, 0.7], opacity: [0, 1, 1, 0] }}
                          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                        >
                          <circle cx="0" cy="0" r="8" fill="none" stroke="#a855f7" strokeWidth="1.5" />
                          <text x="0" y="-12" textAnchor="middle" className="text-[6.5px] fill-purple-500 font-bold font-mono">SELF VERIFY</text>
                        </motion.g>
                        {/* Server ➔ Service 트래픽 흐름 */}
                        <motion.g
                          initial={{ x: 250, y: 210, opacity: 0 }}
                          animate={{ x: 350, y: 360, opacity: [0, 1, 1, 0] }}
                          transition={{ duration: 1.8, repeat: Infinity, delay: 1.0, ease: "easeInOut" }}
                        >
                          <circle cx="0" cy="0" r="5" className="fill-emerald-500" />
                          <text x="8" y="2" textAnchor="start" className="text-[7px] fill-emerald-600 font-bold font-sans">승인</text>
                        </motion.g>
                      </>
                    )}
                    {activeStep === 3 && (
                      <>
                        {/* Client ➔ Server API 호출 (만료된 JWT) */}
                        <motion.g
                          initial={{ x: 250, y: 60, opacity: 0 }}
                          animate={{ x: 250, y: 210, opacity: [0, 1, 1, 0] }}
                          transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
                        >
                          <circle cx="0" cy="0" r="5" className="fill-red-400" />
                        </motion.g>
                        {/* DB 조회 없이 자체 서명 검증 단계에서 Expired 파악 */}
                        <motion.g
                          initial={{ x: 250, y: 210, scale: 0.7, opacity: 0 }}
                          animate={{ scale: [0.7, 1.3, 0.7], opacity: [0, 1, 1, 0] }}
                          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                        >
                          <circle cx="0" cy="0" r="8" fill="none" stroke="#ef4444" strokeWidth="1.5" />
                          <text x="-4" y="-8" className="text-[8px] font-bold fill-red-500">⚠️</text>
                        </motion.g>
                      </>
                    )}

                    {/* Status Badges Overlays */}
                    {activeStep === 2 && (
                      <>
                        <motion.g
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0 }}
                          transform="translate(250, 140)"
                        >
                          <rect x="-30" y="-10" width="60" height="16" rx="4" className="fill-emerald-50/95 dark:fill-emerald-950/80 stroke-emerald-200 dark:stroke-emerald-800" strokeWidth="1" />
                          <text x="0" y="1.5" textAnchor="middle" className="fill-emerald-600 dark:fill-emerald-400 text-[8px] font-bold font-sans">ALLOWED 🎢</text>
                        </motion.g>
                      </>
                    )}
                    {activeStep === 3 && (
                      <motion.g
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0 }}
                        transform="translate(250, 140)"
                      >
                        <rect x="-32" y="-10" width="64" height="16" rx="4" className="fill-red-50/95 dark:fill-red-950/80 stroke-red-200 dark:stroke-red-800" strokeWidth="1" />
                        <text x="0" y="1.5" textAnchor="middle" className="fill-red-600 dark:fill-red-400 text-[8px] font-bold font-sans">EXPIRED 🚨</text>
                      </motion.g>
                    )}
                  </g>
                )}
              </AnimatePresence>
            </svg>
          </div>

          {/* JWT Inspectors (세로 직렬 배치) */}
          <div className="space-y-4">
            {/* JWT LocalStorage Inspector */}
            <div className="border border-border/60 rounded-2xl p-4 bg-slate-50/30 dark:bg-slate-900/10 shadow-sm space-y-3">
              <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400 font-semibold text-sm">
                <span>🔑 Client Token Storage (localStorage)</span>
              </div>
              <div className="p-3 bg-white dark:bg-slate-950 border border-border/60 rounded-xl min-h-[120px] flex flex-col justify-center shadow-inner">
                {activeStep === 0 ? (
                  <span className="text-xs text-muted-foreground italic text-center">토큰이 존재하지 않습니다.</span>
                ) : (
                  <div className="space-y-2">
                    <span className="text-[10px] text-muted-foreground block font-mono">Encoded Token String:</span>
                    <div className="break-all text-[10px] font-mono leading-relaxed select-all">
                      <span className="text-rose-500 font-bold">eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9</span>
                      <span className="text-muted-foreground">.</span>
                      <span className="text-purple-500 dark:text-purple-400 font-bold">eyJ1c2VySWQiOjEwMDQsIm5hbWUiOiLtmY3subjsj5kiLCJyb2xlIjoiVklQIiwiZXhwIjoxODAwfQ</span>
                      <span className="text-muted-foreground">.</span>
                      <span className="text-emerald-500 font-bold">SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c</span>
                    </div>
                    {activeStep === 3 && (
                      <span className="inline-block bg-red-100 dark:bg-red-950/40 text-red-700 dark:text-red-300 text-[8px] font-bold px-1.5 py-0.5 rounded uppercase font-mono">
                        Expired Token (만료됨)
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Decoded JWT Inspector */}
            <div className="border border-border/60 rounded-2xl p-4 bg-slate-50/30 dark:bg-slate-900/10 shadow-sm space-y-3">
              <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400 font-semibold text-sm">
                <Lock size={15} />
                <span>🔓 Decoded JWT (토큰 복호화)</span>
              </div>
              <div className="p-3 bg-white dark:bg-slate-950 border border-border/60 rounded-xl min-h-[120px] flex flex-col justify-center shadow-inner">
                {activeStep === 0 ? (
                  <span className="text-xs text-muted-foreground italic text-center">해독 가능한 토큰이 없습니다.</span>
                ) : (
                  <div className="space-y-2 font-mono text-[9px] leading-tight">
                    <div>
                      <span className="text-rose-500 font-bold">Header</span>: <span className="text-foreground">{`{"alg": "HS256", "typ": "JWT"}`}</span>
                    </div>
                    <div>
                      <span className="text-purple-500 dark:text-purple-400 font-bold">Payload</span>: 
                      <span className="text-foreground">
                        {` { "visitorId": "amuse_gildong", "name": "홍길동", "grade": "VIP", "exp": `}
                        <span className={activeStep === 3 ? "text-red-500 font-bold" : "text-emerald-500"}>
                          {activeStep === 3 ? "18:00 (만료됨)" : "18:00"}
                        </span>
                        {` }`}
                      </span>
                    </div>
                    <div>
                      <span className="text-emerald-500 font-bold">Signature</span>: 
                      <span className="text-foreground">
                        {activeStep === 3 ? (
                          <span className="text-red-500 font-bold">EXPIRED ERROR (위조 검증 불필요 - 시간 초과)</span>
                        ) : (
                          <span className="text-emerald-500 font-semibold">VALID (서버 암호화 비밀키로 자체 서명 확인됨)</span>
                        )}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Comparison Table */}
      <div className="overflow-x-auto rounded-2xl border border-border/60 p-1 bg-slate-50/30 dark:bg-slate-900/10">
        <table className="w-full text-xs sm:text-sm border-collapse bg-white dark:bg-slate-950 rounded-xl overflow-hidden shadow-sm">
          <thead>
            <tr className="border-b border-border/60 bg-slate-50/50 dark:bg-slate-900/30">
              <th className="text-left py-3 px-4 text-muted-foreground font-semibold uppercase tracking-wider text-xs font-sans">비교 항목</th>
              <th className="text-center py-3 px-4 text-blue-600 dark:text-blue-400 font-bold font-sans">세션 기반 (ID 카드)</th>
              <th className="text-center py-3 px-4 text-purple-600 dark:text-purple-400 font-bold font-sans">JWT 토큰 (자유이용권 팔찌)</th>
            </tr>
          </thead>
          <tbody>
            {COMPARISON.map((row, i) => (
              <tr key={row.feature} className={`border-b border-border/40 last:border-0 ${i % 2 === 0 ? "bg-slate-50/30 dark:bg-slate-900/10" : ""}`}>
                <td className="py-3 px-4 font-semibold text-foreground text-xs sm:text-sm font-sans">{cleanText(row.feature)}</td>
                <td className="py-3 px-4 text-center text-muted-foreground text-xs sm:text-sm leading-relaxed font-sans">{cleanText(row.session)}</td>
                <td className="py-3 px-4 text-center text-muted-foreground text-xs sm:text-sm leading-relaxed font-sans">{cleanText(row.jwt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
