import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Pause, RotateCcw, ChevronLeft, ChevronRight, Clock, AlertTriangle, ShieldCheck } from "lucide-react";

// 3단계 시각화 정보 정의
const STEPS = [
  {
    title: "1. 정상 라우팅 (Normal Gateway Routing)",
    timing: "< 5ms",
    desc: "춤추는 클라이언트들이 입구로 향하고, 경비원이 입장 팔찌(토큰)를 채워 클럽 내부(댄스 플로어)로 정상 안내합니다. 토큰은 충전기에서 서서히 충전됩니다.",
  },
  {
    title: "2. 트래픽 폭주 (Traffic Spike)",
    timing: "~50ms",
    desc: "수많은 클라이언트 캐릭터들이 몰려들며 대기 줄이 길어지고, 가용 토큰(팔찌)이 빠르게 소모되어 바닥을 보이기 시작합니다.",
  },
  {
    title: "3. 게이트 과부하 & 요청 차단 (Access Blocked)",
    timing: "> 500ms",
    desc: "토큰이 완전히 소진되어 경비원이 차단막을 내리고, 팔찌가 없는 요청들을 HTTP 429 에러 코드와 함께 눈물을 흘리며 돌려보냅니다.",
  },
];

// HTTP Inspector 데이터 구조
const HTTP_INSPECT_DATA = [
  {
    status: "200 OK",
    statusColor: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
    headers: [
      { key: "HTTP/1.1", val: "200 OK", color: "text-emerald-400 font-bold" },
      { key: "Content-Type", val: "application/json" },
      { key: "X-RateLimit-Limit", val: "100" },
      { key: "X-RateLimit-Remaining", val: "84" },
      { key: "X-RateLimit-Reset", val: "12s" },
    ],
    body: `# API Gateway check: SUCCESS\n{\n  "status": "success",\n  "message": "Authorized. Request forwarded."\n}`,
  },
  {
    status: "200 OK",
    statusColor: "text-amber-400 bg-amber-500/10 border-amber-500/20",
    headers: [
      { key: "HTTP/1.1", val: "200 OK", color: "text-amber-400 font-bold" },
      { key: "Content-Type", val: "application/json" },
      { key: "X-RateLimit-Limit", val: "100" },
      { key: "X-RateLimit-Remaining", val: "1", color: "text-rose-400 font-bold" },
      { key: "X-RateLimit-Reset", val: "4s" },
    ],
    body: `# Warning: Traffic spike detected!\n# Available tokens depleted.\n{\n  "status": "warning",\n  "remaining_tokens": 1\n}`,
  },
  {
    status: "429 Too Many Requests",
    statusColor: "text-rose-400 bg-rose-500/10 border-rose-500/20",
    headers: [
      { key: "HTTP/1.1", val: "429 Too Many Requests", color: "text-rose-400 font-bold" },
      { key: "Content-Type", val: "application/json" },
      { key: "Retry-After", val: "30s", color: "text-amber-400 font-bold" },
    ],
    body: `{\n  "status": 429,\n  "error": "TooManyRequests",\n  "message": "Rate limit exceeded. Retry in 30s."\n}`,
  },
];

export default function ApiGatewayViz() {
  const [activeStep, setActiveStep] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [routedCount, setRoutedCount] = useState(14);
  const [blockedCount, setBlockedCount] = useState(0);
  const [tokenCount, setTokenCount] = useState(4);

  const total = STEPS.length;
  const isComplete = activeStep >= total - 1;

  // 자동 재생 제어
  useEffect(() => {
    if (!isPlaying) return;
    const t = setTimeout(() => {
      if (isComplete) {
        setIsPlaying(false);
      } else {
        setActiveStep((p) => p + 1);
      }
    }, 5000);
    return () => clearTimeout(t);
  }, [isPlaying, activeStep, isComplete]);

  // 카운터 및 토큰 수 상태 관리
  useEffect(() => {
    if (activeStep === -1) {
      setRoutedCount(14);
      setBlockedCount(0);
      setTokenCount(4);
      return;
    }

    let intervalId: NodeJS.Timeout;

    if (activeStep === 0) {
      setTokenCount(4);
      intervalId = setInterval(() => {
        setRoutedCount((prev) => prev + 1);
        setTokenCount((t) => (t === 4 ? 3 : 4));
      }, 1500);
    } else if (activeStep === 1) {
      setTokenCount(1);
      intervalId = setInterval(() => {
        if (Math.random() > 0.7) {
          setRoutedCount((prev) => prev + 1);
        } else {
          setBlockedCount((prev) => prev + 1);
        }
      }, 1000);
    } else if (activeStep === 2) {
      setTokenCount(0);
      intervalId = setInterval(() => {
        setBlockedCount((prev) => prev + Math.floor(Math.random() * 4) + 2);
      }, 180);
    }

    return () => clearInterval(intervalId);
  }, [activeStep]);

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
  const isOverload = activeStep === 2;
  const isSpike = activeStep === 1 || activeStep === 2;

  return (
    <div className="space-y-6">
      {/* 상단 재생 컨트롤러 */}
      <div className="flex items-center gap-3 flex-wrap">
        <button
          onClick={handleReset}
          className="p-2.5 rounded-lg border border-card-border bg-card hover:bg-muted transition-colors text-muted-foreground"
          data-testid="button-reset"
          aria-label="초기화"
        >
          <RotateCcw size={16} />
        </button>
        <button
          onClick={handlePrev}
          disabled={activeStep < 0}
          className="p-2.5 rounded-lg border border-card-border bg-card hover:bg-muted text-muted-foreground disabled:opacity-40 transition-colors"
          data-testid="button-prev"
          aria-label="이전 단계"
        >
          <ChevronLeft size={16} />
        </button>
        <button
          onClick={handlePlay}
          className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary text-primary-foreground hover:opacity-90 text-sm font-medium transition-opacity"
          data-testid="button-play-pause"
        >
          {isPlaying ? <Pause size={15} /> : <Play size={15} />}
          {isComplete ? "다시 보기" : isPlaying ? "일시정지" : activeStep < 0 ? "시작" : "계속"}
        </button>
        <button
          onClick={handleNext}
          disabled={isComplete}
          className="p-2.5 rounded-lg border border-card-border bg-card hover:bg-muted text-muted-foreground disabled:opacity-40 transition-colors"
          data-testid="button-next"
          aria-label="다음 단계"
        >
          <ChevronRight size={16} />
        </button>
        <div className="flex-1 min-w-[250px] space-y-1">
          <div className="flex justify-between text-xs sm:text-sm text-muted-foreground">
            <span className="font-semibold text-sm">
              {activeStep >= 0 ? `단계 ${activeStep + 1} / ${total} — ${STEPS[activeStep].title}` : "시작을 눌러 시각화를 진행하세요"}
            </span>
            {activeStep >= 0 && (
              <span className="flex items-center gap-1 font-semibold text-xs">
                <Clock size={12} /> {STEPS[activeStep].timing}
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

      {/* 메인 5열 레이아웃 (좌측 SVG: 3열, 우측 Inspector: 2열로 넉넉하게 3:2 분리) */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        
        {/* 좌측: SVG 시뮬레이터 (3/5 비중) */}
        <div className="lg:col-span-3 relative border border-border/60 rounded-2xl bg-[#0B0F19] overflow-hidden flex justify-center py-6">
          <svg
            viewBox="0 0 600 640"
            className="w-full max-w-[600px] h-auto select-none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              {/* 네온 글로우 필터 */}
              <filter id="glow-cyan" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="4" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
              <filter id="glow-red" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="5" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
              <filter id="glow-orange" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
              <filter id="glow-yellow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="4" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
              
              <linearGradient id="gate-fence-grad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#1E293B" />
                <stop offset="100%" stopColor="#0F172A" />
              </linearGradient>
            </defs>

            {/* 1. 상단 CLUB GATEWAY 간판 (폰트 및 박스 스케일링) */}
            <rect x="170" y="15" width="260" height="44" rx="22" fill="#111827" stroke="#1E293B" strokeWidth="2" />
            <text x="300" y="42" textAnchor="middle" fill="#FFFFFF" fontSize="17" fontWeight="bold" letterSpacing="2" fontFamily="sans-serif">
              CLUB GATEWAY
            </text>
            <text x="300" y="82" textAnchor="middle" fill="#64748B" fontSize="12" fontWeight="semibold">
              Protected by The Bouncer (API Gateway Rate Limiter)
            </text>

            {/* 2. 클럽 내부 (Club Inner Dance Floor) */}
            <g>
              {/* 클럽 벽면 네온 룸 (더 크게 넓힘) */}
              <rect
                x="30"
                y="100"
                width="540"
                height="120"
                rx="16"
                fill="#111827"
                stroke={isOverload ? "#7F1D1D" : isSpike ? "#B45309" : "#312E81"}
                strokeWidth="2.5"
                opacity="0.9"
                className="transition-colors duration-500"
              />
              
              {/* 클럽 댄스 플로어 네온 간판 (더 넉넉하게 확장) */}
              <rect x="50" y="112" width="160" height="24" rx="12" fill="#0D0E1C" stroke="#A855F7" strokeWidth="1.5" filter="url(#glow-orange)" />
              <text x="130" y="128" textAnchor="middle" fill="#FFFFFF" fontSize="10.5" fontWeight="bold" letterSpacing="1">
                🕺 DANCE FLOOR 💃
              </text>

              {/* 클럽 내부에서 춤추는 피들 이모지 (사이즈 키움) */}
              <g opacity={isOverload ? 0.2 : 0.8}>
                <text x="75" y="175" fontSize="26">💃</text>
                <text x="135" y="180" fontSize="20">🎵</text>
                <text x="180" y="170" fontSize="26">🕺</text>
                <text x="245" y="180" fontSize="24">🥳</text>
                <text x="310" y="175" fontSize="26">💃</text>
                <text x="375" y="180" fontSize="20">✨</text>
              </g>

              {/* 팔찌 충전기 (Dispenser) - 컴포넌트 간격 및 텍스트 밖으로 나감 원천 방지 */}
              <g transform="translate(440, 112)">
                <rect
                  x="0"
                  y="0"
                  width="110"
                  height="42"
                  rx="8"
                  fill="#070A13"
                  stroke={isOverload ? "#EF4444" : "#F59E0B"}
                  strokeWidth="1.5"
                  filter={isOverload ? "url(#glow-red)" : "url(#glow-orange)"}
                  className="transition-colors duration-500"
                />
                {/* 텍스트 크기 및 패딩 정렬 확보 */}
                <text x="55" y="17" textAnchor="middle" fill="#FFFFFF" fontSize="9.5" fontWeight="bold" letterSpacing="0.5">
                  BRACELETS
                </text>
                <text
                  x="55"
                  y="30"
                  textAnchor="middle"
                  fill={isOverload ? "#EF4444" : "#10B981"}
                  fontSize="8.5"
                  fontWeight="bold"
                  fontFamily="monospace"
                  className="animate-pulse"
                >
                  {isOverload ? "OUT OF STOCK" : "REFILLING"}
                </text>
              </g>
              {/* 충전기에서 바운서로 전달되는 가이드 선 */}
              <path d="M 300 220 L 300 300" fill="none" stroke="#1E293B" strokeWidth="2.5" strokeDasharray="3,3" />
            </g>

            {/* 3. 클럽 입구 & 경비원 (The Bouncer 👮) */}
            {/* 안전 바리케이드 / 게이트 벽 (넓힘) */}
            <rect x="20" y="295" width="150" height="90" rx="8" fill="url(#gate-fence-grad)" stroke="#334155" strokeWidth="1.5" />
            <text x="95" y="342" fill="#64748B" fontSize="12" fontWeight="bold" textAnchor="middle">WAITING LINE</text>
            
            <rect x="430" y="295" width="150" height="90" rx="8" fill="url(#gate-fence-grad)" stroke="#334155" strokeWidth="1.5" />
            <text x="505" y="342" fill="#64748B" fontSize="12" fontWeight="bold" textAnchor="middle">ENTRY FILTER</text>

            {/* 게이트 아치 탑 빔 (가로 확장) */}
            <rect
              x="170"
              y="285"
              width="260"
              height="18"
              rx="9"
              fill="#0F172A"
              stroke={isOverload ? "#EF4444" : isSpike ? "#F59E0B" : "#10B981"}
              strokeWidth="2.5"
              filter={isOverload ? "url(#glow-red)" : isSpike ? "url(#glow-orange)" : "none"}
              className="transition-colors duration-500"
            />
            <text
              x="300"
              y="297"
              textAnchor="middle"
              fill={isOverload ? "#EF4444" : isSpike ? "#F59E0B" : "#10B981"}
              fontSize="9"
              fontWeight="bold"
              letterSpacing="1.5"
              className="transition-colors duration-500"
            >
              {isOverload ? "ACCESS CLOSED" : isSpike ? "WARNING: LIMIT REACHED" : "ACCESS OPEN"}
            </text>

            {/* 경비원 전용 베이스 */}
            <ellipse cx="300" cy="375" rx="35" ry="11" fill="#1E293B" stroke="#334155" strokeWidth="1.5" />
            
            {/* 경비원 (Bouncer 캐릭터) */}
            <motion.text
              x="300"
              y="365"
              textAnchor="middle"
              fontSize="38"
              animate={
                isOverload
                  ? { rotate: [0, -8, 8, 0], scale: [1, 1.08, 1] }
                  : isSpike
                  ? { scale: [1, 1.05, 1] }
                  : { rotate: [0, -4, 4, 0] }
              }
              transition={{
                repeat: Infinity,
                duration: isOverload ? 0.6 : 2,
                ease: "easeInOut"
              }}
            >
              👮
            </motion.text>
            <text x="300" y="395" textAnchor="middle" fill="#94A3B8" fontSize="10.5" fontWeight="bold">
              THE BOUNCER
            </text>

            {/* 경비원 땀방울 데코 */}
            {isSpike && (
              <motion.text
                x="325"
                y="338"
                fontSize="13"
                animate={{ opacity: [1, 0, 1], y: [338, 342, 338] }}
                transition={{ repeat: Infinity, duration: 1 }}
              >
                💦
              </motion.text>
            )}

            {/* Bouncer 말풍선 (박스 너비를 170으로 넉넉히 확보하여 글자가 밖으로 삐져나가지 않게 개선) */}
            <g transform="translate(300, 298)">
              <rect
                x="-85"
                y="-28"
                width="170"
                height="26"
                rx="6"
                fill="#111827"
                stroke={isOverload ? "#EF4444" : isSpike ? "#F59E0B" : "#10B981"}
                strokeWidth="1.5"
                filter={isOverload ? "url(#glow-red)" : "none"}
                className="transition-colors duration-500"
              />
              <text
                x="0"
                y="-11"
                textAnchor="middle"
                fill={isOverload ? "#FCA5A5" : isSpike ? "#FDE68A" : "#A7F3D0"}
                fontSize="10"
                fontWeight="bold"
              >
                {isOverload ? "⛔ FULL! BACK OFF" : isSpike ? "⚠️ Line up! No token" : "👋 Bracelet check!"}
              </text>
            </g>

            {/* 3단계 과부하 시의 빨간색 레이저 차단막 (Barrier) - 박스 크기 및 폰트 확장 */}
            <AnimatePresence>
              {isOverload && (
                <g key="laser-barrier-streamlined">
                  {/* 정밀한 수평 매치 (y1, y2 일치) */}
                  <motion.line
                    x1="172"
                    y1="315"
                    x2="428"
                    y2="315"
                    stroke="#EF4444"
                    strokeWidth="5"
                    filter="url(#glow-red)"
                    initial={{ opacity: 0, scaleX: 0 }}
                    animate={{ opacity: 1, scaleX: 1 }}
                    exit={{ opacity: 0, scaleX: 0 }}
                    transition={{ duration: 0.3 }}
                    style={{ originX: "300px" }}
                  />
                  <motion.rect
                    x="210"
                    y="303"
                    width="180"
                    height="24"
                    rx="4"
                    fill="#7F1D1D"
                    stroke="#EF4444"
                    strokeWidth="1"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: [0.7, 1, 0.7] }}
                    transition={{ repeat: Infinity, duration: 0.6 }}
                  />
                  <text x="300" y="319" textAnchor="middle" fill="#FFFFFF" fontSize="11" fontWeight="bold" letterSpacing="0.5">
                    HTTP 429 BLOCKED
                  </text>
                </g>
              )}
            </AnimatePresence>

            {/* 4. 요청 대기열 컨베이어 벨트 (너비 및 두께 상향) */}
            <rect
              x="130"
              y="420"
              width="340"
              height="24"
              rx="12"
              fill="#0F172A"
              stroke={isOverload ? "#EF4444" : isSpike ? "#F59E0B" : "#38BDF8"}
              strokeWidth="2.5"
              filter={isOverload ? "url(#glow-red)" : "isSpike ? url(#glow-orange) : none"}
              className="transition-colors duration-500"
            />
            {/* 벨트 롤러 */}
            <circle cx="145" cy="432" r="5" fill="#334155" />
            <circle cx="455" cy="432" r="5" fill="#334155" />
            <line x1="165" y1="432" x2="435" y2="432" stroke="#1E293B" strokeWidth="1.5" strokeDasharray="5,10" />

            {/* 5. 실시간 흐르는 캐릭터 애니메이션 (바뀐 스펙 및 간격에 따라 궤적 재조정) */}
            {activeStep >= 0 && (
              <g key={`scen-chars-large-${activeStep}`}>
                {/* 1단계 정상상태 애니메이션 */}
                {activeStep === 0 && (
                  <>
                    {/* 캐릭터 1: 🤓 -> 🥳 */}
                    <motion.g
                      initial={{ opacity: 0 }}
                      animate={{
                        x: [160, 300, 150],
                        y: [560, 350, 160],
                        opacity: [0, 1, 1, 0],
                        scale: [1, 1.2, 1.2, 0.8]
                      }}
                      transition={{
                        repeat: Infinity,
                        duration: 3.5,
                        delay: 0,
                        ease: "easeInOut"
                      }}
                    >
                      <text x="0" y="0" fontSize="24" textAnchor="middle">🤓</text>
                      <motion.circle
                        cx="0"
                        cy="-22"
                        r="4.5"
                        fill="#F59E0B"
                        filter="url(#glow-yellow)"
                        animate={{ opacity: [0, 0, 1, 0] }}
                        transition={{ repeat: Infinity, duration: 3.5, times: [0, 0.35, 0.45, 1] }}
                      />
                      <motion.text
                        x="0"
                        y="16"
                        fontSize="8.5"
                        fill="#A7F3D0"
                        fontWeight="bold"
                        textAnchor="middle"
                        animate={{ opacity: [0, 0, 1, 0] }}
                        transition={{ repeat: Infinity, duration: 3.5, times: [0, 0.35, 0.45, 1] }}
                      >
                        ENTRY
                      </motion.text>
                    </motion.g>

                    {/* 캐릭터 2: 😎 -> 💃 */}
                    <motion.g
                      initial={{ opacity: 0 }}
                      animate={{
                        x: [300, 300, 250],
                        y: [560, 350, 160],
                        opacity: [0, 1, 1, 0],
                        scale: [1, 1.2, 1.2, 0.8]
                      }}
                      transition={{
                        repeat: Infinity,
                        duration: 3.5,
                        delay: 1.2,
                        ease: "easeInOut"
                      }}
                    >
                      <text x="0" y="0" fontSize="24" textAnchor="middle">😎</text>
                      <motion.circle
                        cx="0"
                        cy="-22"
                        r="4.5"
                        fill="#F59E0B"
                        filter="url(#glow-yellow)"
                        animate={{ opacity: [0, 0, 1, 0] }}
                        transition={{ repeat: Infinity, duration: 3.5, delay: 1.2, times: [0, 0.35, 0.45, 1] }}
                      />
                      <motion.text
                        x="0"
                        y="16"
                        fontSize="8.5"
                        fill="#A7F3D0"
                        fontWeight="bold"
                        textAnchor="middle"
                        animate={{ opacity: [0, 0, 1, 0] }}
                        transition={{ repeat: Infinity, duration: 3.5, delay: 1.2, times: [0, 0.35, 0.45, 1] }}
                      >
                        ENTRY
                      </motion.text>
                    </motion.g>

                    {/* 캐릭터 3: 😴 -> 🕺 */}
                    <motion.g
                      initial={{ opacity: 0 }}
                      animate={{
                        x: [440, 300, 350],
                        y: [560, 350, 160],
                        opacity: [0, 1, 1, 0],
                        scale: [1, 1.2, 1.2, 0.8]
                      }}
                      transition={{
                        repeat: Infinity,
                        duration: 3.5,
                        delay: 2.4,
                        ease: "easeInOut"
                      }}
                    >
                      <text x="0" y="0" fontSize="24" textAnchor="middle">😴</text>
                      <motion.circle
                        cx="0"
                        cy="-22"
                        r="4.5"
                        fill="#F59E0B"
                        filter="url(#glow-yellow)"
                        animate={{ opacity: [0, 0, 1, 0] }}
                        transition={{ repeat: Infinity, duration: 3.5, delay: 2.4, times: [0, 0.35, 0.45, 1] }}
                      />
                      <motion.text
                        x="0"
                        y="16"
                        fontSize="8.5"
                        fill="#A7F3D0"
                        fontWeight="bold"
                        textAnchor="middle"
                        animate={{ opacity: [0, 0, 1, 0] }}
                        transition={{ repeat: Infinity, duration: 3.5, delay: 2.4, times: [0, 0.35, 0.45, 1] }}
                      >
                        ENTRY
                      </motion.text>
                    </motion.g>

                    {/* 팔찌 구슬이 충전기에서 바운서 손으로 전달되는 궤적 */}
                    <motion.circle
                      cx="300"
                      cy="210"
                      r="5.5"
                      fill="#F59E0B"
                      filter="url(#glow-yellow)"
                      animate={{
                        cy: [210, 320],
                        opacity: [0, 1, 1, 0.2]
                      }}
                      transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
                    />
                  </>
                )}

                {/* 2단계 폭주 상태 애니메이션 */}
                {activeStep === 1 && (
                  <>
                    {/* 대기줄 캐릭터들 (벨트 위에 골고루 분산 배치하여 뭉침 해소) */}
                    {[
                      { startX: 160, waitX: 160, waitY: 440, delay: 0, emoji: "🤠" },
                      { startX: 160, waitX: 200, waitY: 450, delay: 0.6, emoji: "🤓" },
                      { startX: 300, waitX: 240, waitY: 455, delay: 1.2, emoji: "😴" },
                      { startX: 300, waitX: 280, waitY: 450, delay: 1.8, emoji: "😎" },
                      { startX: 440, waitX: 320, waitY: 440, delay: 2.4, emoji: "👽" },
                      { startX: 160, waitX: 220, waitY: 470, delay: 3.0, emoji: "🤠" },
                      { startX: 440, waitX: 260, waitY: 470, delay: 3.6, emoji: "🤓" },
                    ].map((char, idx) => (
                      <motion.g
                        key={`spike-line-${idx}`}
                        initial={{ opacity: 0 }}
                        animate={{
                          x: [char.startX, char.waitX, char.waitX + 1.5, char.waitX - 1.5, char.waitX],
                          y: [560, char.waitY, char.waitY - 2, char.waitY + 2, char.waitY],
                          opacity: [0, 1, 1, 1, 0]
                        }}
                        transition={{
                          repeat: Infinity,
                          duration: 4.5,
                          delay: char.delay,
                          ease: "easeInOut"
                        }}
                      >
                        <text x="0" y="0" fontSize="22" textAnchor="middle">{char.emoji}</text>
                        <text x="0" y="-18" fontSize="9.5" fill="#F59E0B" fontWeight="bold" textAnchor="middle">❓</text>
                      </motion.g>
                    ))}

                    {/* 간신히 토큰 얻어 입장하는 단 한 명의 캐릭터 */}
                    <motion.g
                      initial={{ opacity: 0 }}
                      animate={{
                        x: [300, 300, 250],
                        y: [560, 350, 160],
                        opacity: [0, 1, 1, 0],
                        scale: [1, 1.2, 1.2, 0.8]
                      }}
                      transition={{
                        repeat: Infinity,
                        duration: 4.5,
                        ease: "easeInOut"
                      }}
                    >
                      <text x="0" y="0" fontSize="24" textAnchor="middle">🥳</text>
                      <circle cx="0" cy="-22" r="4.5" fill="#F59E0B" filter="url(#glow-yellow)" />
                      <text x="0" y="16" fontSize="8.5" fill="#A7F3D0" fontWeight="bold" textAnchor="middle">LUCKY</text>
                    </motion.g>
                  </>
                )}

                {/* 3단계 차단 및 눈물 튕김 애니메이션 */}
                {activeStep === 2 && (
                  <>
                    {[
                      { startX: 160, bounceX: 50, delay: 0, emoji: "🤓" },
                      { startX: 300, bounceX: 120, delay: 0.6, emoji: "😴" },
                      { startX: 300, bounceX: 470, delay: 1.2, emoji: "😎" },
                      { startX: 440, bounceX: 540, delay: 1.8, emoji: "🤠" },
                      { startX: 440, bounceX: 90, delay: 2.4, emoji: "👽" },
                    ].map((char, idx) => (
                      <g key={`blocked-large-char-${idx}`}>
                        <motion.g
                          initial={{ opacity: 0 }}
                          animate={{
                            x: [char.startX, 300, char.bounceX],
                            y: [560, 340, 480],
                            opacity: [0, 1, 1, 0],
                            scale: [1, 1.1, 0.9, 0.8]
                          }}
                          transition={{
                            repeat: Infinity,
                            duration: 2.2,
                            delay: char.delay,
                            ease: "easeInOut"
                          }}
                        >
                          <motion.text
                            x="0"
                            y="0"
                            fontSize="24"
                            textAnchor="middle"
                            animate={{ scale: [1, 1, 1.2, 1.2] }}
                            transition={{ repeat: Infinity, duration: 2.2, delay: char.delay, times: [0, 0.35, 0.45, 1] }}
                          >
                            {char.emoji === "😎" || char.emoji === "🤓" ? "😭" : "😢"}
                          </motion.text>
                          <text x="0" y="15" fontSize="8" fill="#FCA5A5" fontWeight="bold" textAnchor="middle">DENIED</text>
                        </motion.g>

                        {/* 눈물방울 효과 */}
                        <motion.text
                          x="300"
                          y="340"
                          fontSize="12"
                          initial={{ opacity: 0 }}
                          animate={{
                            x: [300, char.bounceX - 12],
                            y: [340, 400],
                            opacity: [0, 0, 1, 0]
                          }}
                          transition={{
                            repeat: Infinity,
                            duration: 2.2,
                            delay: char.delay,
                            times: [0, 0.38, 0.42, 0.8]
                          }}
                        >
                          💧
                        </motion.text>
                        <motion.text
                          x="300"
                          y="340"
                          fontSize="12"
                          initial={{ opacity: 0 }}
                          animate={{
                            x: [300, char.bounceX + 16],
                            y: [340, 390],
                            opacity: [0, 0, 1, 0]
                          }}
                          transition={{
                            repeat: Infinity,
                            duration: 2.2,
                            delay: char.delay,
                            times: [0, 0.38, 0.42, 0.8]
                          }}
                        >
                          💧
                        </motion.text>
                      </g>
                    ))}
                  </>
                )}
              </g>
            )}

            {/* 6. 가용 입장 팔찌 정보 (구슬 구형화) */}
            <text x="300" y="465" textAnchor="middle" fill={isOverload ? "#EF4444" : "#F59E0B"} fontSize="13" fontWeight="bold" letterSpacing="1">
              AVAILABLE BRACELETS (TOKENS)
            </text>

            <g>
              {[210, 270, 330, 390].map((tx, idx) => {
                const isOn = idx < tokenCount;
                return (
                  <g key={idx}>
                    <circle
                      cx={tx}
                      cy="495"
                      r="11"
                      fill={isOn ? "#F59E0B" : "#1E293B"}
                      stroke={isOn ? "#FFFFFF" : "#334155"}
                      strokeWidth="1.5"
                      opacity={isOn ? 1 : 0.2}
                      filter={isOn ? "url(#glow-yellow)" : "none"}
                      className="transition-all duration-300"
                    />
                    {isOn && (
                      <text x={tx} y="499" textAnchor="middle" fill="#FFFFFF" fontSize="11" fontWeight="bold">
                        ⚡
                      </text>
                    )}
                  </g>
                );
              })}
            </g>
            <text x="300" y="522" textAnchor="middle" fill="#64748B" fontSize="11" fontWeight="medium">
              1 token = 1 request • bracelets refill from the dispenser above
            </text>

            {/* 7. 최하단 CLIENTS 구역 (컴포넌트 간격 조정 및 스마트폰 확대) */}
            <text x="300" y="560" textAnchor="middle" fill="#475569" fontSize="12" fontWeight="bold" letterSpacing="2">
              CLIENT SOURCES • REQUEST GENERATION
            </text>
            
            {/* 좌우 간격을 더 넓게 벌림 (160, 300, 440) */}
            {[160, 300, 440].map((cx, cIdx) => (
              <motion.g
                key={cIdx}
                animate={isSpike ? { scale: [1, 1.05, 1] } : {}}
                transition={{ repeat: Infinity, duration: isOverload ? 0.3 : 0.6, delay: cIdx * 0.15 }}
              >
                {/* 스마트폰 크기 확대 */}
                <rect
                  x={cx - 24}
                  y="575"
                  width="48"
                  height="24"
                  rx="6"
                  fill="#1E293B"
                  stroke={isSpike ? "#EF4444" : "#334155"}
                  strokeWidth="2"
                  className="transition-colors duration-300"
                />
                <circle cx={cx} cy="587" r="2.5" fill={isSpike ? "#EF4444" : "#475569"} />
              </motion.g>
            ))}
          </svg>

          {/* 하단 말풍선 오버레이 (모바일 대응 폰트 사이즈) */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full bg-[#111827] border border-[#1F2937] text-[12px] text-muted-foreground font-semibold font-sans shadow-md text-center max-w-[90%]">
            {activeStep === 2
              ? "Rate limit exceeded (0 tokens). Bouncer returns HTTP 429."
              : activeStep === 1
              ? "Traffic spike detected. Gateway bracelets are running out."
              : "Club Gateway secures internal stages by metering requests."}
          </div>
        </div>

        {/* 우측: HTTP Inspector & 상태 모니터 (2/5 비중 - 글자 밖으로 삐져나감 원천 차단) */}
        <div className="lg:col-span-2 space-y-4 flex flex-col justify-start">
          
          {/* 1. Rate Limit 상태 모니터 패널 */}
          <div className="p-5 rounded-2xl bg-card border border-card-border space-y-4 shadow-md">
            <div className="text-xs text-muted-foreground uppercase font-bold tracking-wider flex items-center gap-1.5 border-b border-border/40 pb-2">
              <span>📈 GATEWAY MONITOR</span>
            </div>
            
            {/* 가용 토큰량 시각 배지 */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs sm:text-sm text-muted-foreground font-bold">
                <span>Available Bracelets (Tokens)</span>
                <span className={isOverload ? "text-rose-400 text-sm font-bold" : isSpike ? "text-amber-400 text-sm font-bold" : "text-emerald-400 text-sm font-bold"}>
                  {tokenCount} / 4
                </span>
              </div>
              <div className="flex gap-2.5">
                {[1, 2, 3, 4].map((tIdx) => {
                  const isOn = tIdx <= tokenCount;
                  return (
                    <div
                      key={tIdx}
                      className={`flex-1 h-5 rounded-full transition-all duration-300 flex items-center justify-center text-xs font-bold ${
                        isOn 
                          ? "bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)] border border-amber-300 text-white" 
                          : "bg-muted-foreground/10 border border-muted-foreground/20 text-muted-foreground/35"
                      }`}
                    >
                      {isOn && "🟡"}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* HTTP Status Badge */}
            <div className="flex justify-between items-center border-t border-border/40 pt-4">
              <span className="text-xs sm:text-sm text-muted-foreground font-bold">Gateway Status</span>
              <span className={`px-3 py-1 rounded-full text-xs font-extrabold flex items-center gap-1 border ${
                isOverload
                  ? "text-rose-500 bg-rose-500/10 border-rose-500/30"
                  : isSpike
                  ? "text-amber-500 bg-amber-500/10 border-amber-500/30"
                  : "text-emerald-500 bg-emerald-500/10 border-emerald-500/30"
              }`}>
                {isOverload ? <AlertTriangle size={12} /> : <ShieldCheck size={12} />}
                {isOverload ? "OVERLOADED (429)" : isSpike ? "WARNING (SPIKE)" : "NORMAL (200 OK)"}
              </span>
            </div>

            {/* 카운터 지표 */}
            <div className="grid grid-cols-2 gap-3 pt-4 border-t border-border/40 font-mono">
              <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-3 text-center">
                <div className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider">ROUTED COUNT</div>
                <div className="text-xl sm:text-2xl font-black text-emerald-400 mt-1">{routedCount}</div>
              </div>
              <div className={`border rounded-xl p-3 text-center transition-colors ${
                isOverload 
                  ? "bg-rose-500/10 border-rose-500/20" 
                  : "bg-muted/10 border-border/40"
              }`}>
                <div className={`text-[10px] font-bold uppercase tracking-wider ${isOverload ? "text-rose-400" : "text-muted-foreground"}`}>BLOCKED COUNT</div>
                <div className={`text-xl sm:text-2xl font-black mt-1 ${isOverload ? "text-rose-400" : "text-muted-foreground"}`}>{blockedCount}</div>
              </div>
            </div>
          </div>

          {/* 2. HTTP Request/Response Inspector (터미널 스타일 - 폰트 확대 & whitespace-pre-wrap으로 넘침 차단) */}
          <div className="p-5 rounded-2xl bg-[#070B14] border border-border/80 font-mono text-xs sm:text-sm shadow-lg space-y-3.5 flex-1 flex flex-col justify-start">
            <div className="flex justify-between items-center border-b border-border/40 pb-2.5">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-rose-500" />
                <div className="w-3 h-3 rounded-full bg-amber-500" />
                <div className="w-3 h-3 rounded-full bg-emerald-500" />
              </div>
              <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">HTTP Headers Inspector</span>
            </div>

            {activeStep === -1 ? (
              <div className="text-muted-foreground/45 italic py-16 text-center text-xs flex-1 flex items-center justify-center font-mono">
                # Press Start button to trace HTTP headers...
              </div>
            ) : (
              <div className="space-y-4 text-xs sm:text-sm text-slate-300 flex-1 flex flex-col justify-start font-mono">
                
                {/* Headers */}
                <div className="space-y-1.5">
                  <div className="text-[10px] text-muted-foreground uppercase font-bold tracking-wide">Response Headers</div>
                  <div className="bg-[#0D1527] p-3 rounded-lg border border-border/30 space-y-1.5">
                    {HTTP_INSPECT_DATA[activeStep].headers.map((hdr, hIdx) => (
                      <div key={hIdx} className="flex justify-between text-[11px] sm:text-xs">
                        <span className="text-slate-500">{hdr.key}:</span>
                        <span className={hdr.color || "text-blue-400 font-bold"}>{hdr.val}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Body (pre-wrap & break-all로 바깥 침범 원천 방지) */}
                <div className="space-y-1.5 flex-1 flex flex-col justify-start">
                  <div className="text-[10px] text-muted-foreground uppercase font-bold tracking-wide">Response Payload (JSON)</div>
                  <pre className="bg-[#0D1527] p-3.5 rounded-lg border border-border/30 text-[11px] sm:text-xs overflow-x-auto text-slate-300 leading-relaxed font-mono flex-1 whitespace-pre-wrap break-all">
                    {HTTP_INSPECT_DATA[activeStep].body}
                  </pre>
                </div>
              </div>
            )}
          </div>

        </div>

      </div>

      {/* 단계별 설명 Callout 박스 */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeStep}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -15 }}
          transition={{ duration: 0.3 }}
          className="p-5 rounded-2xl bg-card border border-card-border shadow-lg space-y-2.5"
        >
          <h3 className="text-base sm:text-lg font-bold text-foreground">
            {activeStep >= 0 ? STEPS[activeStep].title : "API Gateway Rate Limiter 안내"}
          </h3>
          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
            {activeStep >= 0
              ? STEPS[activeStep].desc
              : "시작 버튼 또는 각 단계 버튼을 눌러 API Gateway의 처리 속도 조절(Rate Limiting)과 과부하 및 요청 차단 애니메이션 과정을 자세히 확인할 수 있습니다."}
          </p>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
