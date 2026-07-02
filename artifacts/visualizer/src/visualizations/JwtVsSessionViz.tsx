import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Pause, RotateCcw, ChevronLeft, ChevronRight } from "lucide-react";
import { contentData } from "@/data/content";

// Remove bold markdowns ** from text helper
const cleanText = (str: string) => {
  if (!str) return "";
  return str.replace(/\*\==g/g, "").replace(/\*\*/g, "");
};

// Visualization-specific step configurations (payloads, custom steps)
const STEPS = [
  {
    sessionTitle: "회원의 카운터 방문 및 로그인",
    sessionDesc: "회원(클라이언트)이 카운터로 가서 ID/PW 정보가 담긴 로그인 패킷과 등록비를 서버에 제출합니다.",
    sessionPayload: `[POST /login Request]
Content-Type: application/json

{
  "memberId": "gym_vip_gildong",
  "cash": "100,000 KRW"
}`,
    jwtTitle: "방문객의 매표소 방문 및 로그인",
    jwtDesc: "방문객(클라이언트)이 매표소로 가서 이용료 정보가 담긴 패킷을 보내 인증을 요청합니다.",
    jwtPayload: `[POST /login Request]
Content-Type: application/json

{
  "visitorId": "amuse_gildong",
  "cash": "50,000 KRW"
}`,
  },
  {
    sessionTitle: "서버의 장부 기록 및 세션 쿠키 발급",
    sessionDesc: "서버가 뒷벽의 사물함 장부(DB)에 회원의 VIP 권한을 기록하고, 개인정보가 숨겨진 낡은 세션 ID(쿠키)를 생성해 발급합니다.",
    sessionPayload: `[Server Session Memory Write]
sess_key_vip_99: { "name": "홍길동", "grade": "VIP" }

[Response Headers]
Set-Cookie: session_id=sess_key_vip_99; HttpOnly`,
    jwtTitle: "자유이용권 팔찌(JWT) 토큰 발급",
    jwtDesc: "인증 서버는 상태를 기록하지 않고, [이름, 등급, 만료시간] 정보를 담아 암호화 서명한 자유이용권 팔찌(JWT)를 채워줍니다.",
    jwtPayload: `[JWT Generated (Header.Payload.Signature)]
- Payload: { "name": "홍길동", "grade": "VIP", "exp": 1800 }
- Secret Key: ******* (서버 전용 서명 검증 키)`,
  },
  {
    sessionTitle: "세션 ID 대조 및 운동기구 가동",
    sessionDesc: "회원이 기구를 쓸 때마다 열쇠(세션 ID)를 서버에 보내고, 서버는 뒷벽의 장부(DB)를 매번 뒤져 대조한 후에야 운동기구를 켜줍니다.",
    sessionPayload: `[GET /use-treadmill Request]
Cookie: session_id=sess_key_vip_99

[Redis/DB Lookup]
SELECT * FROM sessions WHERE id = 'sess_key_vip_99'
=> MATCH! (Status: Unlocked)`,
    jwtTitle: "게이트 스캔 및 놀이기구 자체 검증 통과",
    jwtDesc: "방문객이 게이트에 팔찌를 대면, 게이트 스캐너가 장부 조회 없이 팔찌의 암호 서명 위조 여부만 순식간에 확인(스캔)하고 켜줍니다.",
    jwtPayload: `[GET /ride-rollercoaster Request]
Authorization: Bearer eyJhbGciOi...

[Gateway Validation]
Signature verification SUCCESS (Local Cryptographic Verification)
=> MATCH! (Status: Allowed)`,
  },
  {
    sessionTitle: "세션 삭제 및 낡은 열쇠 무효화",
    sessionDesc: "사용자가 나가자 서버가 장부(DB)에서 회원의 정보를 삭제합니다. 이후 회원이 동일 열쇠를 다시 제출해도 조회에 실패하여 차단됩니다.",
    sessionPayload: `[DELETE /logout Request]
Cookie: session_id=sess_key_vip_99

[Redis/DB Remove]
DELETE FROM sessions WHERE id = 'sess_key_vip_99'
=> LOOKUP sess_key_vip_99 => NULL (401 Unauthorized)`,
    jwtTitle: "만료에 따른 게이트 자동 차단 및 반사",
    jwtDesc: "시간이 경과하자 팔찌의 서명이 자동으로 만료(18:01)됩니다. 게이트 스캐너는 삐빅! 차단 빨간 불을 켜고, 클라이언트는 매표소로 튕겨 나갑니다.",
    jwtPayload: `[GET /ride-rollercoaster Request]
Authorization: Bearer eyJhbGciOi...

[Gateway Validation]
Current Time: 18:01 | Expiry: 18:00
=> ERROR: Expired Token (401 Unauthorized)`,
  },
];

const COMPARISON = [
  { feature: "인증 상태 저장소", session: "서버 세션 DB / Redis (Stateful)", jwt: "없음 - 클라이언트가 토큰 직접 관리 (Stateless)" },
  { feature: "다중 서버 확장성", session: "불리 (세션 복제 또는 분산 세션 DB 연동 필요)", jwt: "유리 (모든 서버가 서명 키만 공유하면 자체 검증 가능)" },
  { feature: "강제 로그아웃 (제어)", session: "매우 쉬움 (서버에서 세션 레코드 삭제 즉시 만료)", jwt: "어려움 (만료 시각 전까지는 유효, 블랙리스트 필요)" },
  { feature: "데이터 전송 비용", session: "최소화 (짧은 임의 문자열 세션 ID만 전송)", jwt: "큼 (토큰 내 유저 세부 데이터가 들어 있어 헤더 부하)" },
  { feature: "메모리 / I/O 비용", session: "유저가 늘어날수록 서버 메모리 및 DB I/O 부담 증가", jwt: "서버 리소스 거의 소모 안 함 (CPU 대칭 연산만 수행)" },
];

export default function JwtVsSessionViz() {
  const [activeStep, setActiveStep] = useState(0); // Start at 0 for instant auto play
  const [isPlaying, setIsPlaying] = useState(true); // Auto-play enabled by default

  // Retrieve steps description from content.ts to sync real-time
  const contentItem = contentData.find((d) => d.slug === "jwt-vs-session");
  const contentSteps = contentItem?.steps || [];
  const total = contentSteps.length || STEPS.length;
  const isComplete = activeStep >= total - 1;

  // Split content step text into title and description
  const currentStepText = activeStep >= 0 && contentSteps[activeStep] ? contentSteps[activeStep] : "";
  const [currentStepTitle, currentStepDesc] = currentStepText.includes(":")
    ? currentStepText.split(":", 2).map((s) => s.trim())
    : [currentStepText, ""];

  // Custom durations for each step with +2 seconds delay added
  useEffect(() => {
    if (!isPlaying) return;

    const durations = [6000, 7000, 8000, 8000];
    const duration = durations[activeStep] || 7000;

    const t = setTimeout(() => {
      if (activeStep < total - 1) {
        setActiveStep((p) => p + 1);
      } else {
        // Infinite auto loop back to start (0)
        setActiveStep(0);
      }
    }, duration);
    return () => clearTimeout(t);
  }, [isPlaying, activeStep, total]);

  const handleReset = useCallback(() => {
    setIsPlaying(false);
    setActiveStep(0);
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
    if (activeStep < total - 1) {
      setActiveStep((p) => p + 1);
    } else {
      setActiveStep(0);
    }
  }, [activeStep, total]);

  const handlePrev = useCallback(() => {
    setIsPlaying(false);
    if (activeStep > 0) {
      setActiveStep((p) => p - 1);
    } else {
      setActiveStep(total - 1);
    }
  }, [activeStep, total]);

  const progress = ((activeStep + 1) / total) * 100;
  const stepData = activeStep >= 0 ? STEPS[activeStep] : null;

  // Highlights nodes that are currently active in the step
  const isSessionNodeActive = (nodeId: number) => {
    if (activeStep < 0) return false;
    if (activeStep === 0) return nodeId === 0 || nodeId === 1;
    if (activeStep === 1) return nodeId === 1 || nodeId === 2;
    if (activeStep === 2) return nodeId === 0 || nodeId === 1 || nodeId === 2 || nodeId === 3;
    if (activeStep === 3) return nodeId === 0 || nodeId === 1 || nodeId === 2;
    return false;
  };

  const isJwtNodeActive = (nodeId: number) => {
    if (activeStep < 0) return false;
    if (activeStep === 0) return nodeId === 4 || nodeId === 5;
    if (activeStep === 1) return nodeId === 4 || nodeId === 5;
    if (activeStep === 2) return nodeId === 4 || nodeId === 6 || nodeId === 7;
    if (activeStep === 3) return nodeId === 4 || nodeId === 6;
    return false;
  };

  // Increased box height to h-[180px] to prevent scrollbars
  const renderPayloadBox = (type: "session" | "jwt") => {
    if (activeStep < 0 || !stepData) {
      return (
        <div className="flex items-center justify-center h-[180px] bg-muted/40 border border-dashed border-border rounded-xl text-xs text-muted-foreground italic font-sans">
          시뮬레이션을 시작하여 리퀘스트 패킷을 모니터링하세요.
        </div>
      );
    }

    if (type === "session") {
      return (
        <pre className="p-4 bg-slate-50 dark:bg-slate-900 rounded-xl text-xs font-mono text-blue-600 dark:text-blue-400 leading-relaxed overflow-x-auto h-[180px] border border-border/80 shadow-sm">
          {cleanText(stepData.sessionPayload)}
        </pre>
      );
    } else {
      if (activeStep === 1) {
        return (
          <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-xl text-xs font-mono text-purple-600 dark:text-purple-400 leading-relaxed overflow-x-auto h-[180px] border border-border/80 shadow-sm flex flex-col justify-between">
            <div>
              <span className="font-semibold text-muted-foreground text-[10px] uppercase block mb-1">
                자유이용권 팔찌 토큰 (Header.Payload.Signature):
              </span>
              <div className="break-all whitespace-pre-wrap text-xs leading-normal">
                <span className="text-pink-500 font-bold">eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9</span>
                <span className="text-foreground">.</span>
                <span className="text-purple-500 dark:text-purple-400 font-bold">
                  eyJ1c2VySWQiOjEwMDQsIm5hbWUiOiLtmY3subjsj5kiLCJyb2xlIjoiVklQIiwiZXhwIjoxODAwfQ
                </span>
                <span className="text-foreground">.</span>
                <span className="text-emerald-500 font-bold">
                  SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c
                </span>
              </div>
            </div>
            <div className="text-[9px] text-muted-foreground border-t border-border/40 pt-1 flex justify-between font-sans">
              <span>
                <span className="text-pink-500 font-semibold">Header</span>: 알고리즘 규격
              </span>
              <span>
                <span className="text-purple-500 dark:text-purple-400 font-semibold">Payload</span>: 이름/VIP/18:00
              </span>
              <span>
                <span className="text-emerald-500 font-semibold">Signature</span>: 위조방지 서명
              </span>
            </div>
          </div>
        );
      }

      return (
        <pre className="p-4 bg-slate-50 dark:bg-slate-900 rounded-xl text-xs font-mono text-purple-600 dark:text-purple-400 leading-relaxed overflow-x-auto h-[180px] border border-border/80 shadow-sm">
          {cleanText(stepData.jwtPayload)}
        </pre>
      );
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Controls */}
      <div className="flex items-center gap-3 flex-wrap">
        <button
          onClick={handleReset}
          className="p-2.5 rounded-lg border border-card-border bg-card hover:bg-muted transition-colors text-muted-foreground"
          data-testid="button-reset"
          title="초기화"
        >
          <RotateCcw size={16} />
        </button>
        <button
          onClick={handlePrev}
          disabled={activeStep < 0}
          className="p-2.5 rounded-lg border border-card-border bg-card hover:bg-muted text-muted-foreground disabled:opacity-40 transition-colors"
          data-testid="button-prev"
          title="이전 단계"
        >
          <ChevronLeft size={16} />
        </button>
        <button
          onClick={handlePlay}
          className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary text-primary-foreground hover:opacity-90 text-sm font-medium transition-opacity"
          data-testid="button-play-pause"
        >
          {isPlaying ? <Pause size={15} /> : <Play size={15} />}
          {isComplete ? "다시 보기" : isPlaying ? "일시정지" : activeStep < 0 ? "시뮬레이션 시작" : "계속"}
        </button>
        <button
          onClick={handleNext}
          disabled={isComplete}
          className="p-2.5 rounded-lg border border-card-border bg-card hover:bg-muted text-muted-foreground disabled:opacity-40 transition-colors"
          data-testid="button-next"
          title="다음 단계"
        >
          <ChevronRight size={16} />
        </button>
        <div className="flex-1 space-y-1">
          <div className="text-xs sm:text-sm text-muted-foreground font-semibold">
            {activeStep >= 0 ? `단계 ${activeStep + 1} / ${total} — ${cleanText(currentStepTitle)}` : `총 ${total}단계`}
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

      {/* Stacked Layout: Session Gym on top, JWT Amusement Park below */}
      <div className="flex flex-col gap-8">
        
        {/* 1. Stateful Session Gym Card - Clean Light Glass Theme */}
        <div className="border border-border rounded-2xl p-5 bg-card flex flex-col justify-between min-h-[440px] shadow-sm">
          <div>
            <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
              <span className="text-sm sm:text-base font-semibold text-blue-600 dark:text-blue-400 tracking-wider flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
                세션 기반 인증 (Stateful Session)
              </span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/40 text-blue-600 dark:text-blue-400 font-bold">
                🏢 실생활 비유: 사물함 장부 & ID 카드
              </span>
            </div>

            {/* SVG Diagram Area */}
            <div className="relative border border-border/80 rounded-2xl p-1 bg-white dark:bg-slate-950 overflow-hidden shadow-sm">
              <svg className="w-full h-auto aspect-[600/200] block text-foreground" viewBox="0 0 600 200">
                <defs>
                  {/* Flat Soft Drop Shadow filters instead of Neon glow */}
                  <filter id="soft-shadow" x="-10%" y="-10%" width="120%" height="120%">
                    <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#0f172a" floodOpacity="0.08" />
                  </filter>
                  <filter id="soft-shadow-active" x="-10%" y="-10%" width="120%" height="120%">
                    <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#3b82f6" floodOpacity="0.2" />
                  </filter>
                </defs>

                {/* Connection lines */}
                <line x1={100} y1={140} x2={260} y2={140} stroke="currentColor" strokeWidth="1.2" strokeDasharray="3 3" className="text-muted-foreground/30" />
                <line x1={260} y1={140} x2={260} y2={60} stroke="currentColor" strokeWidth="1.2" strokeDasharray="3 3" className="text-muted-foreground/30" />
                <line x1={260} y1={140} x2={470} y2={140} stroke="currentColor" strokeWidth="1.2" strokeDasharray="3 3" className="text-muted-foreground/30" />

                {/* Cabinet DB Node (2) */}
                <g transform="translate(260, 60)">
                  <motion.rect
                    x="-40" y="-20" width="80" height="40" rx="6"
                    className={`transition-all duration-300 ${
                      isSessionNodeActive(2)
                        ? "stroke-blue-500 fill-blue-50/50 dark:fill-blue-950/20"
                        : "stroke-border fill-slate-50 dark:fill-slate-900/50"
                    }`}
                    strokeWidth={isSessionNodeActive(2) ? 2 : 1.2}
                    filter="url(#soft-shadow)"
                    animate={isSessionNodeActive(2) ? { scale: [1, 1.02, 1] } : { scale: 1 }}
                    transition={{ duration: 1.5, repeat: isSessionNodeActive(2) ? Infinity : 0 }}
                  />
                  <text x="0" y="-3" textAnchor="middle" fill="currentColor" fontSize="10" fontWeight="600" className="fill-foreground font-sans">SESSION DB</text>
                  
                  {/* DB Slots */}
                  <rect x="-30" y="7" width="10" height="6" rx="1" className={activeStep >= 1 && activeStep < 3 ? "fill-blue-500" : "fill-slate-200 dark:fill-slate-800"} />
                  <rect x="-15" y="7" width="10" height="6" rx="1" className="fill-slate-200 dark:fill-slate-800" />
                  <rect x="0" y="7" width="10" height="6" rx="1" className="fill-slate-200 dark:fill-slate-800" />
                  <rect x="15" y="7" width="10" height="6" rx="1" className="fill-slate-200 dark:fill-slate-800" />

                  {/* Active DB records label */}
                  {activeStep >= 1 && activeStep < 3 && (
                    <g transform="translate(48, -12)">
                      <rect x="0" y="0" width="60" height="24" rx="4" className="fill-blue-50/80 dark:fill-blue-950/40 stroke-blue-400" strokeWidth="1" />
                      <text x="6" y="9" fontSize="6" className="fill-blue-600 dark:fill-blue-400 font-mono">ID: vip_gildong</text>
                      <text x="6" y="17" fontSize="6" className="fill-blue-600 dark:fill-blue-400 font-mono">status: ACTIVE</text>
                    </g>
                  )}
                  {activeStep === 3 && (
                    <g transform="translate(48, -12)">
                      <rect x="0" y="0" width="60" height="24" rx="4" className="fill-red-50/50 dark:fill-red-950/20 stroke-red-300" strokeWidth="1" strokeDasharray="2 2" />
                      <text x="6" y="14" fontSize="6" className="fill-red-600 dark:fill-red-400 font-mono">DELETED (삭제)</text>
                    </g>
                  )}
                </g>

                {/* Member Node Anchor (0) - Browser lookalike */}
                <g transform="translate(100, 140)">
                  <motion.rect
                    x="-35" y="-22" width="70" height="44" rx="5"
                    className={`transition-all duration-300 ${
                      isSessionNodeActive(0)
                        ? "stroke-blue-500 fill-blue-50/30 dark:fill-blue-950/10"
                        : "stroke-border fill-slate-50 dark:fill-slate-900/50"
                    }`}
                    strokeWidth={isSessionNodeActive(0) ? 2 : 1.2}
                    filter="url(#soft-shadow)"
                    animate={isSessionNodeActive(0) ? { scale: [1, 1.02, 1] } : { scale: 1 }}
                    transition={{ duration: 1.5, repeat: isSessionNodeActive(0) ? Infinity : 0 }}
                  />
                  {/* Browser top bar */}
                  <line x1="-35" y1="-12" x2="35" y2="-12" stroke="currentColor" strokeWidth="0.8" className="text-border" />
                  <circle cx="-27" cy="-17" r="1.2" fill="#ef4444" />
                  <circle cx="-22" cy="-17" r="1.2" fill="#f59e0b" />
                  <circle cx="-17" cy="-17" r="1.2" fill="#10b981" />
                  
                  <text x="0" y="12" textAnchor="middle" fill="currentColor" fontSize="9" fontWeight="600" className="fill-muted-foreground font-sans">CLIENT</text>
                </g>

                {/* Counter Node Anchor (1) - Server lookalike */}
                <g transform="translate(260, 140)">
                  <motion.rect
                    x="-35" y="-22" width="70" height="44" rx="5"
                    className={`transition-all duration-300 ${
                      isSessionNodeActive(1)
                        ? "stroke-blue-500 fill-blue-50/30 dark:fill-blue-950/10"
                        : "stroke-border fill-slate-50 dark:fill-slate-900/50"
                    }`}
                    strokeWidth={isSessionNodeActive(1) ? 2 : 1.2}
                    filter="url(#soft-shadow)"
                    animate={isSessionNodeActive(1) ? { scale: [1, 1.02, 1] } : { scale: 1 }}
                    transition={{ duration: 1.5, repeat: isSessionNodeActive(1) ? Infinity : 0 }}
                  />
                  <line x1="-28" y1="-6" x2="28" y2="-6" stroke="currentColor" strokeWidth="1" className="text-border" />
                  <line x1="-28" y1="4" x2="28" y2="4" stroke="currentColor" strokeWidth="1" className="text-border" />
                  <circle cx="22" cy="-6" r="1" fill="#3b82f6" />
                  <circle cx="22" cy="4" r="1" fill="#3b82f6" />
                  
                  <text x="0" y="16" textAnchor="middle" fill="currentColor" fontSize="8" fontWeight="600" className="fill-muted-foreground font-sans">SERVER</text>
                </g>

                {/* Gym Gear Node Anchor (3) */}
                <g transform="translate(470, 140)">
                  <motion.rect
                    x="-35" y="-22" width="70" height="44" rx="5"
                    className={`transition-all duration-300 ${
                      isSessionNodeActive(3)
                        ? "stroke-blue-500 fill-blue-50/30 dark:fill-blue-950/10"
                        : "stroke-border fill-slate-50 dark:fill-slate-900/50"
                    }`}
                    strokeWidth={isSessionNodeActive(3) ? 2 : 1.2}
                    filter="url(#soft-shadow)"
                    animate={isSessionNodeActive(3) ? { scale: [1, 1.02, 1] } : { scale: 1 }}
                    transition={{ duration: 1.5, repeat: isSessionNodeActive(3) ? Infinity : 0 }}
                  />
                  <text x="0" y="4" textAnchor="middle" fill="#3b82f6" fontSize="16">⚙️</text>
                  <text x="0" y="16" textAnchor="middle" fill="currentColor" fontSize="8" fontWeight="600" className="fill-muted-foreground font-sans">GYM SERVICE</text>
                </g>

                {/* ============================================================== */}
                {/* DYNAMIC SHINING LIGHT POINT DYNAMICS (FLAT FLOW)                */}
                {/* ============================================================== */}

                {/* Active glow indicators */}
                {activeStep === 2 && (
                  <rect x="433" y="116" width="74" height="48" rx="7" fill="none" stroke="#10b981" strokeWidth="1.5" />
                )}

                {/* Client Point / User Dot */}
                <motion.g
                  key={`sess-point-${activeStep}`}
                  initial={{ x: 100, y: 140, opacity: 0 }}
                  animate={
                    activeStep === 0
                      ? {
                          x: [100, 260, 260],
                          opacity: [0, 1, 1, 0]
                        }
                      : activeStep === 1
                      ? {
                          x: [260, 260, 100, 100],
                          opacity: [0, 0, 1, 1]
                        }
                      : activeStep === 2
                      ? {
                          x: [100, 260, 260, 470, 470],
                          opacity: [0, 1, 1, 1, 0]
                        }
                      : activeStep === 3
                      ? {
                          x: [470, 580, 580, 100, 260, 260, 100],
                          opacity: [1, 1, 0, 1, 1, 1, 1]
                        }
                      : { x: 100, y: 140, opacity: 0 }
                  }
                  transition={{
                    duration: activeStep === 3 ? 8.5 : activeStep === 2 ? 7.5 : activeStep === 1 ? 6.5 : 5.5,
                    times: activeStep === 3
                      ? [0, 0.15, 0.25, 0.35, 0.5, 0.8, 0.95]
                      : activeStep === 2
                      ? [0, 0.2, 0.5, 0.75, 0.95]
                      : activeStep === 1
                      ? [0, 0.25, 0.7, 0.95]
                      : [0, 0.5, 0.95],
                    repeat: Infinity,
                    repeatDelay: 1.0,
                    ease: "easeInOut"
                  }}
                >
                  <circle cx="0" cy="0" r="5" fill="#3b82f6" />
                  <circle cx="0" cy="0" r="2.5" fill="#ffffff" />
                  
                  {/* Key cookie indicator carried along */}
                  {(activeStep === 2 || activeStep === 3) && (
                    <motion.text
                      x="10"
                      y="-8"
                      fontSize="9"
                      fill="#3b82f6"
                      animate={{ opacity: [1, 0.5, 1] }}
                      transition={{ duration: 0.8, repeat: Infinity }}
                    >
                      🔑
                    </motion.text>
                  )}
                </motion.g>

                {/* Server to DB internal check dot */}
                {activeStep === 1 && (
                  <motion.circle
                    key="sess-pt-write"
                    cx={260}
                    initial={{ y: 140, opacity: 0 }}
                    animate={{
                      y: [140, 60, 60],
                      opacity: [0, 1, 1, 0]
                    }}
                    transition={{
                      duration: 6.5,
                      times: [0, 0.3, 0.5, 0.55],
                      repeat: Infinity,
                      repeatDelay: 1.0
                    }}
                    r="3.5"
                    fill="#3b82f6"
                  />
                )}

                {activeStep === 2 && (
                  <motion.circle
                    key="sess-pt-read"
                    cx={260}
                    initial={{ y: 140, opacity: 0 }}
                    animate={{
                      y: [140, 140, 60, 60, 140],
                      opacity: [0, 0, 1, 1, 1]
                    }}
                    transition={{
                      duration: 7.5,
                      times: [0, 0.2, 0.35, 0.55, 0.7],
                      repeat: Infinity,
                      repeatDelay: 1.0
                    }}
                    r="3.5"
                    fill="#3b82f6"
                  />
                )}

                {activeStep === 3 && (
                  <motion.circle
                    key="sess-pt-delete"
                    cx={260}
                    initial={{ y: 140, opacity: 0 }}
                    animate={{
                      y: [140, 140, 60, 60],
                      opacity: [0, 0.35, 1, 0]
                    }}
                    transition={{
                      duration: 8.5,
                      times: [0, 0.4, 0.55, 0.65],
                      repeat: Infinity,
                      repeatDelay: 1.0
                    }}
                    r="3.5"
                    fill="#ef4444"
                  />
                )}

                {/* Stamp beam or action helper */}
                {activeStep === 2 && (
                  <motion.line
                    key="sess-stamp-beam"
                    x1={225} y1={60} x2={295} y2={60}
                    stroke="#10b981" strokeWidth="1.5"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: [0, 0, 1, 0, 1, 0] }}
                    transition={{
                      duration: 7.5,
                      times: [0, 0.4, 0.45, 0.5, 0.55, 0.6],
                      repeat: Infinity,
                      repeatDelay: 1.0
                    }}
                  />
                )}

                {/* Reject Blocked sign */}
                {activeStep === 3 && (
                  <motion.g
                    key="sess-block-bubble"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{
                      opacity: [0, 0, 1, 1, 0],
                      scale: [0.8, 0.8, 1, 1, 0.8]
                    }}
                    transition={{
                      duration: 8.5,
                      times: [0, 0.55, 0.6, 0.75, 0.85],
                      repeat: Infinity,
                      repeatDelay: 1.0
                    }}
                    transform="translate(260, 105)"
                  >
                    <rect x="-26" y="-9" width="52" height="14" rx="3" fill="#ef4444" opacity="0.95" />
                    <text x="0" y="1" textAnchor="middle" fill="#ffffff" fontSize="7" fontWeight="bold">BLOCK 🚫</text>
                  </motion.g>
                )}
              </svg>
            </div>

            {/* Data Box */}
            <div className="mt-4">
              <span className="text-xs font-semibold text-muted-foreground block mb-1 font-sans">
                서버 장부 기록 / 전달 열쇠 데이터
              </span>
              {renderPayloadBox("session")}
            </div>
          </div>
        </div>

        {/* 2. Stateless JWT Amusement Park Card - Clean Light Glass Theme */}
        <div className="border border-border rounded-2xl p-5 bg-card flex flex-col justify-between min-h-[440px] shadow-sm">
          <div>
            <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
              <span className="text-sm sm:text-base font-semibold text-purple-600 dark:text-purple-400 tracking-wider flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-purple-500"></span>
                토큰 기반 인증 (Stateless JWT)
              </span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-purple-5/50 dark:bg-purple-950/20 border border-purple-100 dark:border-purple-900/40 text-purple-600 dark:text-purple-400 font-bold">
                🎡 실생활 비유: 자유이용권 팔찌
              </span>
            </div>

            {/* SVG Diagram Area */}
            <div className="relative border border-border/80 rounded-2xl p-1 bg-white dark:bg-slate-950 overflow-hidden shadow-sm">
              <svg className="w-full h-auto aspect-[600/200] block text-foreground" viewBox="0 0 600 200">
                <defs>
                  {/* Flat Soft Drop Shadow filters */}
                  <filter id="soft-shadow-purple" x="-10%" y="-10%" width="120%" height="120%">
                    <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#8b5cf6" floodOpacity="0.15" />
                  </filter>
                </defs>

                {/* Connection lines */}
                <line x1={100} y1={140} x2={260} y2={60} stroke="currentColor" strokeWidth="1.2" strokeDasharray="3 3" className="text-muted-foreground/30" />
                <line x1={100} y1={140} x2={380} y2={140} stroke="currentColor" strokeWidth="1.2" strokeDasharray="3 3" className="text-muted-foreground/30" />
                <line x1={380} y1={140} x2={470} y2={140} stroke="currentColor" strokeWidth="1.2" strokeDasharray="3 3" className="text-muted-foreground/30" />

                {/* Ticket Booth Node (5) - Castle lookalike */}
                <g transform="translate(260, 60)">
                  <motion.rect
                    x="-40" y="-20" width="80" height="40" rx="6"
                    className={`transition-all duration-300 ${
                      isJwtNodeActive(5)
                        ? "stroke-purple-500 fill-purple-50/50 dark:fill-purple-950/20"
                        : "stroke-border fill-slate-50 dark:fill-slate-900/50"
                    }`}
                    strokeWidth={isJwtNodeActive(5) ? 2 : 1.2}
                    filter="url(#soft-shadow-purple)"
                    animate={isJwtNodeActive(5) ? { scale: [1, 1.02, 1] } : { scale: 1 }}
                    transition={{ duration: 1.5, repeat: isJwtNodeActive(5) ? Infinity : 0 }}
                  />
                  <text x="0" y="2" textAnchor="middle" fill="currentColor" fontSize="10" fontWeight="600" className="fill-foreground font-sans">AUTH SERVER</text>
                  <circle cx="-25" cy="-9" r="1.5" fill="#8b5cf6" />
                  <circle cx="25" cy="-9" r="1.5" fill="#8b5cf6" />
                </g>

                {/* Ride Gate Node (6) - API Gateway lookalike */}
                <g transform="translate(380, 140)">
                  <motion.rect
                    x="-35" y="-22" width="70" height="44" rx="5"
                    className={`transition-all duration-300 ${
                      isJwtNodeActive(6)
                        ? "stroke-purple-500 fill-purple-50/30 dark:fill-purple-950/10"
                        : "stroke-border fill-slate-50 dark:fill-slate-900/50"
                    }`}
                    strokeWidth={isJwtNodeActive(6) ? 2 : 1.2}
                    filter="url(#soft-shadow-purple)"
                    animate={isJwtNodeActive(6) ? { scale: [1, 1.02, 1] } : { scale: 1 }}
                    transition={{ duration: 1.5, repeat: isJwtNodeActive(6) ? Infinity : 0 }}
                  />
                  <line x1="-35" y1="0" x2="35" y2="0" stroke="currentColor" strokeWidth="0.8" className="text-border" />
                  <text x="0" y="-6" textAnchor="middle" fill="currentColor" fontSize="8" fontWeight="600" className="fill-foreground font-sans">GATEWAY</text>
                  <text x="0" y="14" textAnchor="middle" fill="currentColor" fontSize="7" className="fill-muted-foreground font-mono">[VERIFY]</text>
                </g>

                {/* Rollercoaster Node (7) */}
                <g transform="translate(470, 140)">
                  <motion.rect
                    x="-35" y="-22" width="70" height="44" rx="5"
                    className={`transition-all duration-300 ${
                      isJwtNodeActive(7)
                        ? "stroke-purple-500 fill-purple-50/30 dark:fill-purple-950/10"
                        : "stroke-border fill-slate-50 dark:fill-slate-900/50"
                    }`}
                    strokeWidth={isJwtNodeActive(7) ? 2 : 1.2}
                    filter="url(#soft-shadow-purple)"
                    animate={isJwtNodeActive(7) ? { scale: [1, 1.02, 1] } : { scale: 1 }}
                    transition={{ duration: 1.5, repeat: isJwtNodeActive(7) ? Infinity : 0 }}
                  />
                  <text x="0" y="4" textAnchor="middle" fill="#8b5cf6" fontSize="16">🎢</text>
                  <text x="0" y="16" textAnchor="middle" fill="currentColor" fontSize="8" fontWeight="600" className="fill-muted-foreground font-sans">RIDE SERVICE</text>
                </g>

                {/* Visitor Node Anchor (4) - Browser lookalike */}
                <g transform="translate(100, 140)">
                  <motion.rect
                    x="-35" y="-22" width="70" height="44" rx="5"
                    className={`transition-all duration-300 ${
                      isJwtNodeActive(4)
                        ? "stroke-purple-500 fill-purple-50/30 dark:fill-purple-950/10"
                        : "stroke-border fill-slate-50 dark:fill-slate-900/50"
                    }`}
                    strokeWidth={isJwtNodeActive(4) ? 2 : 1.2}
                    filter="url(#soft-shadow-purple)"
                    animate={isJwtNodeActive(4) ? { scale: [1, 1.02, 1] } : { scale: 1 }}
                    transition={{ duration: 1.5, repeat: isJwtNodeActive(4) ? Infinity : 0 }}
                  />
                  <line x1="-35" y1="-12" x2="35" y2="-12" stroke="currentColor" strokeWidth="0.8" className="text-border" />
                  <circle cx="-27" cy="-17" r="1.2" fill="#ef4444" />
                  <circle cx="-22" cy="-17" r="1.2" fill="#f59e0b" />
                  <circle cx="-17" cy="-17" r="1.2" fill="#10b981" />
                  
                  <text x="0" y="12" textAnchor="middle" fill="currentColor" fontSize="9" fontWeight="600" className="fill-muted-foreground font-sans">CLIENT</text>
                </g>

                {/* ============================================================== */}
                {/* DYNAMIC SHINING LIGHT POINT DYNAMICS (FLAT FLOW)                */}
                {/* ============================================================== */}

                {/* Active glow indicators */}
                {activeStep === 2 && (
                  <rect x="433" y="116" width="74" height="48" rx="7" fill="none" stroke="#10b981" strokeWidth="1.5" />
                )}

                {/* Visitor Point / Light Dot */}
                <motion.g
                  key={`jwt-point-${activeStep}`}
                  initial={{ x: 100, y: 140, opacity: 0 }}
                  animate={
                    activeStep === 0
                      ? {
                          x: [100, 260],
                          y: [140, 60],
                          opacity: [0, 1, 0]
                        }
                      : activeStep === 1
                      ? {
                          x: [260, 100],
                          y: [60, 140],
                          opacity: [0, 1, 1]
                        }
                      : activeStep === 2
                      ? {
                          x: [100, 380, 470],
                          y: [140, 140, 140],
                          opacity: [0, 1, 0]
                        }
                      : activeStep === 3
                      ? {
                          x: [100, 380, 260],
                          y: [140, 140, 60],
                          opacity: [0, 1, 0]
                        }
                      : { x: 100, y: 140, opacity: 0 }
                  }
                  transition={{
                    duration: activeStep === 3 ? 8.5 : activeStep === 2 ? 7.5 : activeStep === 1 ? 6.5 : 5.5,
                    times: activeStep === 3
                      ? [0, 0.4, 0.8, 1.0]
                      : activeStep === 2
                      ? [0, 0.5, 0.85]
                      : activeStep === 1
                      ? [0, 0.5, 0.95]
                      : [0, 0.6, 0.95],
                    repeat: Infinity,
                    repeatDelay: 1.0,
                    ease: "easeInOut"
                  }}
                >
                  <circle cx="0" cy="0" r="5" fill="#8b5cf6" />
                  <circle cx="0" cy="0" r="2.5" fill="#ffffff" />

                  {/* JWT Token bracelet badge carried inside packet */}
                  {activeStep >= 1 && activeStep < 3 && (
                    <motion.g
                      key="jwt-badge-flow"
                      animate={{ scale: [1, 1.15, 1] }}
                      transition={{ duration: 0.8, repeat: Infinity }}
                    >
                      <rect x="7" y="-12" width="14" height="7" rx="1.5" fill="#8b5cf6" />
                      <text x="14" y="-7" fontSize="4" fill="#ffffff" fontWeight="bold" textAnchor="middle" className="font-mono">JWT</text>
                    </motion.g>
                  )}
                  {activeStep === 3 && (
                    <g key="jwt-badge-flow-expired">
                      <rect x="7" y="-12" width="14" height="7" rx="1.5" fill="#64748b" />
                      <text x="14" y="-7" fontSize="4" fill="#ffffff" fontWeight="bold" textAnchor="middle" className="font-mono">EXP</text>
                    </g>
                  )}
                </motion.g>

                {/* Laser scan scanning line */}
                {activeStep === 2 && (
                  <motion.line
                    key="jwt-laser-beam"
                    x1={380} y1={118} x2={380} y2={162}
                    stroke="#10b981" strokeWidth="2"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: [0, 0, 1, 1, 0] }}
                    transition={{
                      duration: 7.5,
                      times: [0, 0.45, 0.5, 0.65, 0.7],
                      repeat: Infinity,
                      repeatDelay: 1.0
                    }}
                  />
                )}

                {activeStep === 3 && (
                  <motion.line
                    key="jwt-laser-beam-red"
                    x1={380} y1={118} x2={380} y2={162}
                    stroke="#ef4444" strokeWidth="2"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: [0, 0, 1, 1, 0] }}
                    transition={{
                      duration: 8.5,
                      times: [0, 0.35, 0.4, 0.55, 0.6],
                      repeat: Infinity,
                      repeatDelay: 1.0
                    }}
                  />
                )}

                {/* Gate scan labels */}
                {activeStep === 2 && (
                  <motion.g
                    key="jwt-scan-ok"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{
                      opacity: [0, 0, 1, 1, 0],
                      scale: [0.8, 0.8, 1, 1, 0.8]
                    }}
                    transition={{
                      duration: 7.5,
                      times: [0, 0.5, 0.55, 0.7, 0.8],
                      repeat: Infinity,
                      repeatDelay: 1.0
                    }}
                    transform="translate(380, 105)"
                  >
                    <rect x="-24" y="-9" width="48" height="14" rx="3" fill="#10b981" opacity="0.95" />
                    <text x="0" y="1" textAnchor="middle" fill="#ffffff" fontSize="7" fontWeight="bold">VERIFIED 🟢</text>
                  </motion.g>
                )}

                {activeStep === 3 && (
                  <motion.g
                    key="jwt-scan-blocked"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{
                      opacity: [0, 0, 1, 1, 0],
                      scale: [0.8, 0.8, 1, 1, 0.8]
                    }}
                    transition={{
                      duration: 8.5,
                      times: [0, 0.4, 0.45, 0.6, 0.7],
                      repeat: Infinity,
                      repeatDelay: 1.0
                    }}
                    transform="translate(380, 105)"
                  >
                    <rect x="-28" y="-9" width="56" height="14" rx="3" fill="#ef4444" opacity="0.95" />
                    <text x="0" y="1" textAnchor="middle" fill="#ffffff" fontSize="7" fontWeight="bold">EXPIRED 🚨</text>
                  </motion.g>
                )}

              </svg>
            </div>

            {/* Data Box */}
            <div className="mt-4">
              <span className="text-xs font-semibold text-muted-foreground block mb-1 font-sans">
                자유이용권 팔찌 인코딩 / 암호 서명 데이터
              </span>
              {renderPayloadBox("jwt")}
            </div>
          </div>
        </div>

      </div>



      {/* Comparison table */}
      <div className="overflow-x-auto rounded-2xl border border-border/80 p-1 bg-card/20">
        <table className="w-full text-xs sm:text-sm border-collapse">
          <thead>
            <tr className="border-b border-border/80">
              <th className="text-left py-3 px-3 text-muted-foreground font-semibold uppercase tracking-wider text-xs font-sans">비교 항목</th>
              <th className="text-center py-3 px-3 text-blue-600 dark:text-blue-400 font-bold font-sans">세션 기반 (ID 카드)</th>
              <th className="text-center py-3 px-3 text-purple-600 dark:text-purple-400 font-bold font-sans">JWT 토큰 (자유이용권 팔찌)</th>
            </tr>
          </thead>
          <tbody>
            {COMPARISON.map((row, i) => (
              <tr key={row.feature} className={`border-b border-border/40 ${i % 2 === 0 ? "bg-muted/5" : ""}`}>
                <td className="py-3 px-3 font-semibold text-foreground text-xs sm:text-sm font-sans">{cleanText(row.feature)}</td>
                <td className="py-3 px-3 text-center text-muted-foreground text-xs sm:text-sm leading-relaxed font-sans">{cleanText(row.session)}</td>
                <td className="py-3 px-3 text-center text-muted-foreground text-xs sm:text-sm leading-relaxed font-sans">{cleanText(row.jwt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
