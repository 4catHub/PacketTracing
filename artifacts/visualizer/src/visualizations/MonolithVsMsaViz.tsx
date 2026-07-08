import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Pause, RotateCcw, ChevronLeft, ChevronRight, Clock, Cpu, Network, Database } from "lucide-react";

// 6 steps defining the comparative flow
const STEPS = [
  {
    title: "1. 클라이언트 요청 유입",
    desc: "사용자의 주문 생성 요청이 시스템으로 유입됩니다. 모놀리스는 하나의 큰 서버로 바로 진입하며, MSA는 API 게이트웨이로 도달해 각 서비스로 라우팅을 대기합니다.",
    monolith: { active: "Client -> Monolith", comm: "HTTP Request", db: "None", latency: 0.5 },
    msa: { active: "Client -> API Gateway", comm: "HTTP Request", db: "None", latency: 5.0 }
  },
  {
    title: "2. 인증 및 인가 처리",
    desc: "사용자의 토큰/세션을 검증합니다. 모놀리스는 메모리 내에서 직접 세션을 대조하지만, MSA는 인증 서비스를 별도로 호출해야 하므로 추가 네트워크 통신이 발생합니다.",
    monolith: { active: "Auth Module", comm: "In-Memory Call", db: "None", latency: 0.7 },
    msa: { active: "Auth Service", comm: "gRPC Network Call", db: "Read Auth DB", latency: 20.0 }
  },
  {
    title: "3. 비즈니스 로직 및 주문 생성",
    desc: "본격적인 주문 데이터 생성을 준비합니다. 모놀리스는 내부의 주문 모듈 함수를 호출합니다. MSA는 게이트웨이를 거쳐 주문 서비스(Order Service)로 요청을 전달합니다.",
    monolith: { active: "Order Module", comm: "In-Memory Call", db: "None", latency: 0.8 },
    msa: { active: "Order Service", comm: "HTTP Network Call", db: "None", latency: 30.0 }
  },
  {
    title: "4. 재고 확인 및 차감",
    desc: "주문 품목의 재고를 확인하고 차감합니다. 모놀리스는 내부 모듈을 호출해 처리하는 반면, MSA의 주문 서비스는 재고 서비스로 네트워크 API 요청을 전송합니다.",
    monolith: { active: "Inventory Module", comm: "In-Memory Call", db: "None", latency: 1.3 },
    msa: { active: "Inventory Service", comm: "gRPC Network Call", db: "Update Inventory DB", latency: 55.0 }
  },
  {
    title: "5. 결제 승인 및 트랜잭션",
    desc: "결제 처리를 수행합니다. 모놀리스는 단일 Shared DB의 로컬 트랜잭션(ACID)으로 한 번에 안전하게 커밋합니다. MSA는 결제 서비스를 호출하며 이종 DB 분산 트랜잭션(Saga 등)이 시작됩니다.",
    monolith: { active: "Payment Module", comm: "In-Memory Call", db: "Active (ACID Shared)", latency: 6.3 },
    msa: { active: "Payment Service", comm: "HTTP Network Call", db: "Update Payment DB", latency: 90.0 }
  },
  {
    title: "6. 알림 발송 및 최종 응답",
    desc: "주문 완료 알림을 보냅니다. 모놀리스는 동기적으로 알림 모듈을 실행 후 최종 응답합니다. MSA는 메시지 큐에 비동기 이벤트를 발행하여 알림 서비스를 병렬 수행하고, 주문 서비스는 클라이언트에 즉시 빠른 응답을 줍니다.",
    monolith: { active: "Notification Module", comm: "In-Memory / Sync", db: "Committed (Shared DB)", latency: 7.3 },
    msa: { active: "Notification Service", comm: "Kafka Message Event", db: "Committed (Saga / Eventual)", latency: 102.5 }
  }
];

export default function MonolithVsMsaViz() {
  const [activeStep, setActiveStep] = useState(0); // Start at step 1 automatically
  const [isPlaying, setIsPlaying] = useState(true); // Auto play on mount
  const [speed, setSpeed] = useState(1); // Playback speed multiplier
  const total = STEPS.length;
  const isComplete = activeStep >= total - 1;
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const getStepDuration = (step: number) => {
    const baseDuration = 3500; // Base duration 3.5s
    return baseDuration / speed;
  };

  const tick = useCallback(() => {
    setActiveStep((current) => {
      if (current >= total - 1) {
        // 마지막 단계 지연시간이 완료되면 처음(0단계)으로 루프 백
        timerRef.current = setTimeout(tick, getStepDuration(0));
        return 0;
      }
      const nextStep = current + 1;
      timerRef.current = setTimeout(tick, getStepDuration(nextStep));
      return nextStep;
    });
  }, [total, speed]);

  useEffect(() => {
    if (isPlaying) {
      if (activeStep >= total - 1) {
        // 마지막 단계인 상태에서 자동 재생할 경우,
        // 마지막 단계 지연시간만큼 충분히 머물렀다가 처음(0단계)으로 넘어가도록 타이머 예약
        timerRef.current = setTimeout(tick, getStepDuration(total - 1));
      } else {
        const nextStep = activeStep === -1 ? 0 : activeStep + 1;
        if (activeStep === -1) setActiveStep(0);
        timerRef.current = setTimeout(tick, getStepDuration(nextStep));
      }
    } else {
      if (timerRef.current) clearTimeout(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [isPlaying, activeStep, tick, total]);

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
    if (activeStep < total - 1) {
      setActiveStep((p) => p + 1);
    }
  }, [activeStep, total]);

  const handlePrev = useCallback(() => {
    setIsPlaying(false);
    if (activeStep >= 0) {
      setActiveStep((p) => p - 1);
    }
  }, [activeStep]);

  const handleReset = useCallback(() => {
    setIsPlaying(false);
    setActiveStep(-1);
  }, []);

  const progress = ((activeStep + 1) / total) * 100;

  // Custom step metrics
  const monolithCurrent = activeStep >= 0 ? STEPS[activeStep].monolith : { active: "Idle", comm: "None", db: "None", latency: 0.0 };
  const msaCurrent = activeStep >= 0 ? STEPS[activeStep].msa : { active: "Idle", comm: "None", db: "None", latency: 0.0 };

  return (
    <div className="space-y-6">
      {/* 1. 상단 컨트롤 바 (다른 워크플로우 페이지와 플랫 스타일 및 UI 규격 통일) */}
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
          {isComplete ? "다시 보기" : isPlaying ? "일시정지" : activeStep < 0 ? "자동 실행" : "계속"}
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

        {/* Playback speed controls (배속 설정 버튼 통합) */}
        <div className="flex bg-card border border-border rounded-lg p-0.5 shadow-sm">
          {[1, 1.5, 2].map((s) => (
            <button
              key={s}
              onClick={() => setSpeed(s)}
              className={`px-3 py-1 text-xs font-mono rounded-md transition-colors ${
                speed === s
                  ? "bg-primary text-primary-foreground font-bold"
                  : "text-slate-650 dark:text-slate-400 hover:bg-muted"
              }`}
            >
              {s}x
            </button>
          ))}
        </div>

        {/* Progress Info Area (동적 단계 및 프로그레스 바) */}
        <div className="flex-1 min-w-[200px] space-y-1">
          <div className="flex justify-between text-xs sm:text-sm text-muted-foreground font-semibold">
            <span>
              {activeStep >= 0 ? `단계 ${activeStep + 1} / ${total} — ${STEPS[activeStep].title}` : "자동 실행을 누르면 전체 흐름이 시작됩니다."}
            </span>
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

      {/* 2. Visual Workspace — 2 Columns (Monolith vs MSA) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Left Column: Monolith Architecture Visualizer */}
        <div className="border border-border rounded-2xl p-4 bg-muted/5 flex flex-col gap-4 shadow-sm">
          <div className="flex justify-between items-center border-b border-border pb-2.5">
            <span className="text-sm font-extrabold text-sky-600 dark:text-sky-400 uppercase tracking-wider flex items-center gap-1.5">
              📦 Monolithic Architecture
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded bg-sky-100 text-sky-855 dark:bg-sky-950/60 dark:text-sky-300 font-extrabold border border-sky-300 dark:border-sky-800">
              단일 프로세스
            </span>
          </div>

          <div className="relative border border-border rounded-xl bg-card overflow-hidden">
            <svg viewBox="0 0 400 620" className="w-full max-h-[480px] h-auto select-none">
              <defs>
                <pattern id="grid-monolith" width="20" height="20" patternUnits="userSpaceOnUse">
                  <path d="M 20 0 L 0 0 0 20" fill="none" className="stroke-zinc-200/40 dark:stroke-zinc-800/30" strokeWidth="1" />
                </pattern>
              </defs>
              <rect width="400" height="620" fill="url(#grid-monolith)" />
              <line x1="200" y1="0" x2="200" y2="620" stroke="currentColor" className="text-slate-400 dark:text-zinc-800" strokeDasharray="3 3" />

              {/* Client Node */}
              <g>
                <rect x="120" y="20" width="160" height="45" rx="8" stroke="currentColor" strokeWidth="2" className="fill-white dark:fill-zinc-900 text-slate-400 dark:text-zinc-700" />
                <text x="142" y="48" fontSize="16">💻</text>
                <text x="168" y="47" className="text-[12px] font-extrabold fill-slate-900 dark:fill-zinc-100">Client (브라우저)</text>
              </g>

              {/* Client to Monolith Connector */}
              <path
                d="M 200 65 L 200 110"
                className={`stroke-[2.5] fill-none transition-colors duration-300 ${
                  activeStep >= 0 ? "stroke-sky-500 dark:stroke-sky-400" : "stroke-slate-400 dark:stroke-zinc-700"
                }`}
                strokeDasharray={activeStep === 0 ? "5 3" : "none"}
              />

              {/* Monolith Web App Boundary (Wrapper) */}
              <rect
                x="40"
                y="110"
                width="320"
                height="350"
                rx="16"
                stroke="currentColor"
                strokeWidth="2"
                className={`fill-none stroke-2 transition-all duration-300 ${
                  activeStep >= 1 ? "text-sky-500/60 dark:text-sky-400/50" : "text-slate-400 dark:text-zinc-700"
                }`}
              />
              <text x="200" y="132" textAnchor="middle" className="text-[10px] font-extrabold fill-slate-400 dark:fill-slate-500 uppercase tracking-widest font-sans">
                Monolith Web Application
              </text>

              {/* Inner modules */}
              {/* Auth Module */}
              <g>
                <rect
                  x="70"
                  y="150"
                  width="260"
                  height="40"
                  rx="8"
                  stroke="currentColor"
                  strokeWidth={activeStep === 1 ? 3 : 2}
                  className={`transition-all duration-300 fill-white dark:fill-zinc-900 ${
                    activeStep === 1 ? "text-sky-500 dark:text-sky-400" : "text-slate-400 dark:text-zinc-700"
                  }`}
                />
                <text x="88" y="176" fontSize="16">🔑</text>
                <text x="114" y="175" className="text-[12px] font-extrabold fill-slate-900 dark:fill-zinc-100">Auth Module (인증)</text>
                <text x="310" y="174" textAnchor="end" className="text-[9px] font-extrabold font-mono fill-slate-500 dark:fill-zinc-400">In-Memory</text>
              </g>

              {/* Order Module */}
              <g>
                <rect
                  x="70"
                  y="210"
                  width="260"
                  height="40"
                  rx="8"
                  stroke="currentColor"
                  strokeWidth={activeStep === 2 ? 3 : 2}
                  className={`transition-all duration-300 fill-white dark:fill-zinc-900 ${
                    activeStep === 2 ? "text-sky-500 dark:text-sky-400" : "text-slate-400 dark:text-zinc-700"
                  }`}
                />
                <text x="88" y="236" fontSize="16">📦</text>
                <text x="114" y="235" className="text-[12px] font-extrabold fill-slate-900 dark:fill-zinc-100">Order Module (주문)</text>
                <text x="310" y="234" textAnchor="end" className="text-[9px] font-extrabold font-mono fill-slate-500 dark:fill-zinc-400">In-Memory</text>
              </g>

              {/* Inventory Module */}
              <g>
                <rect
                  x="70"
                  y="270"
                  width="260"
                  height="40"
                  rx="8"
                  stroke="currentColor"
                  strokeWidth={activeStep === 3 ? 3 : 2}
                  className={`transition-all duration-300 fill-white dark:fill-zinc-900 ${
                    activeStep === 3 ? "text-sky-500 dark:text-sky-400" : "text-slate-400 dark:text-zinc-700"
                  }`}
                />
                <text x="88" y="296" fontSize="16">🗃️</text>
                <text x="114" y="295" className="text-[12px] font-extrabold fill-slate-900 dark:fill-zinc-100">Inventory Module (재고)</text>
                <text x="310" y="294" textAnchor="end" className="text-[9px] font-extrabold font-mono fill-slate-500 dark:fill-zinc-400">In-Memory</text>
              </g>

              {/* Payment Module */}
              <g>
                <rect
                  x="70"
                  y="330"
                  width="260"
                  height="40"
                  rx="8"
                  stroke="currentColor"
                  strokeWidth={activeStep === 4 ? 3 : 2}
                  className={`transition-all duration-300 fill-white dark:fill-zinc-900 ${
                    activeStep === 4 ? "text-sky-500 dark:text-sky-400" : "text-slate-400 dark:text-zinc-700"
                  }`}
                />
                <text x="88" y="356" fontSize="16">💳</text>
                <text x="114" y="355" className="text-[12px] font-extrabold fill-slate-900 dark:fill-zinc-100">Payment Module (결제)</text>
                <text x="310" y="354" textAnchor="end" className="text-[9px] font-extrabold font-mono fill-slate-500 dark:fill-zinc-400">In-Memory</text>
              </g>

              {/* Notification Module */}
              <g>
                <rect
                  x="70"
                  y="390"
                  width="260"
                  height="40"
                  rx="8"
                  stroke="currentColor"
                  strokeWidth={activeStep === 5 ? 3 : 2}
                  className={`transition-all duration-300 fill-white dark:fill-zinc-900 ${
                    activeStep === 5 ? "text-sky-500 dark:text-sky-400" : "text-slate-400 dark:text-zinc-700"
                  }`}
                />
                <text x="88" y="416" fontSize="16">🔔</text>
                <text x="114" y="415" className="text-[12px] font-extrabold fill-slate-900 dark:fill-zinc-100">Notification Module (알림)</text>
                <text x="310" y="414" textAnchor="end" className="text-[9px] font-extrabold font-mono fill-slate-500 dark:fill-zinc-400">In-Memory</text>
              </g>

              {/* Monolith to Shared DB Connector */}
              <path
                d="M 200 460 L 200 510"
                className={`stroke-[2.5] fill-none transition-colors duration-300 ${
                  activeStep === 4 || activeStep === 5 ? "stroke-sky-500 dark:stroke-sky-400" : "stroke-slate-400 dark:stroke-zinc-700"
                }`}
                strokeDasharray={activeStep === 4 ? "5 3" : "none"}
              />

              {/* Shared Database */}
              <g>
                <rect
                  x="120"
                  y="510"
                  width="160"
                  height="65"
                  rx="10"
                  stroke="currentColor"
                  strokeWidth={activeStep === 4 || activeStep === 5 ? 3 : 2}
                  className={`transition-all duration-300 fill-white dark:fill-zinc-900 ${
                    activeStep === 4 || activeStep === 5 ? "text-sky-500 dark:text-sky-400" : "text-slate-400 dark:text-zinc-700"
                  }`}
                />
                <text x="143" y="548" fontSize="20">🛢️</text>
                <text x="171" y="538" className="text-[13px] font-extrabold fill-slate-900 dark:fill-zinc-100">Shared DB</text>
                <text x="171" y="556" className="text-[9px] font-extrabold fill-slate-550 dark:fill-zinc-400 uppercase tracking-widest font-mono">ACID Schema</text>
              </g>

              {/* Packet Flow Animation (Monolith) */}
              <AnimatePresence>
                {activeStep === 0 && (
                  <motion.circle
                    key={`mono-p0-${activeStep}`}
                    cx="200"
                    cy="65"
                    r="7"
                    className="fill-sky-500 dark:fill-sky-400"
                    animate={{ cy: [65, 140], opacity: [0, 1, 1] }}
                    transition={{ duration: 1.2, ease: "easeInOut" }}
                  />
                )}
                {activeStep === 1 && (
                  <motion.circle
                    key={`mono-p1-${activeStep}`}
                    cx="200"
                    cy="150"
                    r="7"
                    className="fill-sky-500 dark:fill-sky-400"
                    animate={{ cy: [150, 170], opacity: [0, 1, 1] }}
                    transition={{ duration: 1.0, ease: "easeInOut" }}
                  />
                )}
                {activeStep === 2 && (
                  <motion.circle
                    key={`mono-p2-${activeStep}`}
                    cx="200"
                    cy="170"
                    r="7"
                    className="fill-sky-500 dark:fill-sky-400"
                    animate={{ cy: [170, 230], opacity: [0, 1, 1] }}
                    transition={{ duration: 1.0, ease: "easeInOut" }}
                  />
                )}
                {activeStep === 3 && (
                  <motion.circle
                    key={`mono-p3-${activeStep}`}
                    cx="200"
                    cy="230"
                    r="7"
                    className="fill-sky-500 dark:fill-sky-400"
                    animate={{ cy: [230, 290], opacity: [0, 1, 1] }}
                    transition={{ duration: 1.0, ease: "easeInOut" }}
                  />
                )}
                {activeStep === 4 && (
                  <motion.circle
                    key={`mono-p4-${activeStep}`}
                    cx="200"
                    r="7"
                    className="fill-sky-500 dark:fill-sky-400"
                    animate={{
                      cy: [290, 350, 542.5, 350],
                      opacity: [0, 1, 1, 1]
                    }}
                    transition={{ duration: 2.2, ease: "easeInOut" }}
                  />
                )}
                {activeStep === 5 && (
                  <>
                    {/* Event/Response packet */}
                    <motion.circle
                      key={`mono-p5-1-${activeStep}`}
                      cx="200"
                      r="7"
                      className="fill-sky-500 dark:fill-sky-400"
                      animate={{
                        cy: [350, 410, 430, 42.5],
                        cx: [200, 200, 200, 200],
                        opacity: [0, 1, 1, 0]
                      }}
                      transition={{ duration: 2.2, ease: "easeInOut" }}
                    />
                  </>
                )}
              </AnimatePresence>
            </svg>
          </div>
        </div>

        {/* Right Column: MSA (Microservices) Visualizer */}
        <div className="border border-border rounded-2xl p-4 bg-muted/5 flex flex-col gap-4 shadow-sm">
          <div className="flex justify-between items-center border-b border-border pb-2.5">
            <span className="text-sm font-extrabold text-violet-600 dark:text-violet-400 uppercase tracking-wider flex items-center gap-1.5">
              🚀 Microservices Architecture
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded bg-violet-100 text-violet-855 dark:bg-violet-950/60 dark:text-violet-300 font-extrabold border border-violet-300 dark:border-violet-800">
              분산 프로세스
            </span>
          </div>

          <div className="relative border border-border rounded-xl bg-card overflow-hidden">
            <svg viewBox="0 0 400 620" className="w-full max-h-[480px] h-auto select-none">
              <defs>
                <pattern id="grid-msa" width="20" height="20" patternUnits="userSpaceOnUse">
                  <path d="M 20 0 L 0 0 0 20" fill="none" className="stroke-zinc-200/40 dark:stroke-zinc-800/30" strokeWidth="1" />
                </pattern>
              </defs>
              <rect width="400" height="620" fill="url(#grid-msa)" />
              <line x1="200" y1="0" x2="200" y2="620" stroke="currentColor" className="text-slate-400 dark:text-zinc-800/60" strokeDasharray="3 3" />

              {/* Client Node */}
              <g>
                <rect x="120" y="20" width="160" height="45" rx="8" stroke="currentColor" strokeWidth="2" className="fill-white dark:fill-zinc-900 text-slate-400 dark:text-zinc-700" />
                <text x="142" y="48" fontSize="16">💻</text>
                <text x="168" y="47" className="text-[12px] font-extrabold fill-slate-900 dark:fill-zinc-100">Client (브라우저)</text>
              </g>

              {/* Client to Gateway Connect */}
              <path
                d="M 200 65 L 200 110"
                className={`stroke-[2.5] fill-none transition-colors duration-300 ${
                  activeStep >= 0 ? "stroke-violet-500 dark:stroke-violet-400" : "stroke-slate-400 dark:stroke-zinc-700"
                }`}
                strokeDasharray={activeStep === 0 ? "5 3" : "none"}
              />

              {/* API Gateway */}
              <g>
                <rect
                  x="110"
                  y="110"
                  width="180"
                  height="40"
                  rx="6"
                  stroke="currentColor"
                  strokeWidth={activeStep >= 0 ? 3 : 2}
                  className={`transition-all duration-300 fill-white dark:fill-zinc-900 stroke-2 ${
                    activeStep >= 0
                      ? "stroke-violet-500 dark:stroke-violet-400 stroke-[3]"
                      : "stroke-slate-400 dark:stroke-zinc-700"
                  }`}
                />
                <text x="133" y="135" fontSize="16">🚪</text>
                <text x="158" y="134" className="text-[12px] font-extrabold fill-slate-900 dark:fill-zinc-100">API Gateway</text>
              </g>

              {/* Gateway to Services Connectors */}
              <path d="M 200 150 L 105 190" className="stroke-2 fill-none stroke-slate-400 dark:stroke-zinc-800" strokeDasharray="3 2" />
              <path d="M 200 150 L 295 190" className="stroke-2 fill-none stroke-slate-400 dark:stroke-zinc-800" strokeDasharray="3 2" />

              {/* 1. Auth Service & DB */}
              <g>
                <rect
                  x="30"
                  y="190"
                  width="150"
                  height="45"
                  rx="6"
                  stroke="currentColor"
                  strokeWidth={activeStep === 1 ? 3 : 2}
                  className={`transition-all duration-300 fill-white dark:fill-zinc-900 ${
                    activeStep === 1 ? "stroke-violet-500 dark:stroke-violet-400 stroke-[3]" : "stroke-slate-400 dark:stroke-zinc-700"
                  }`}
                />
                <text x="44" y="218" fontSize="16">🔑</text>
                <text x="68" y="217" className="text-[11px] font-extrabold fill-slate-900 dark:fill-zinc-100">Auth Service</text>

                <path d="M 105 235 L 105 255" className="stroke-2 fill-none stroke-slate-400 dark:stroke-zinc-800" strokeDasharray="2 2" />
                <rect
                  x="55"
                  y="255"
                  width="100"
                  height="25"
                  rx="4"
                  stroke="currentColor"
                  strokeWidth={activeStep === 1 ? 2 : 1.5}
                  className={`transition-all duration-300 fill-white dark:fill-zinc-900 ${
                    activeStep === 1 ? "text-violet-500 dark:text-violet-400 verify-active stroke-2" : "stroke-slate-400 dark:stroke-zinc-755"
                  }`}
                />
                <text x="105" y="271" textAnchor="middle" className="text-[9px] font-extrabold font-mono fill-slate-600 dark:fill-zinc-300">🛢️ Auth DB</text>
              </g>

              {/* 2. Order Service & DB */}
              <g>
                <rect
                  x="220"
                  y="190"
                  width="150"
                  height="45"
                  rx="6"
                  stroke="currentColor"
                  strokeWidth={activeStep === 2 || activeStep === 3 || activeStep === 4 || activeStep === 5 ? 3 : 2}
                  className={`transition-all duration-300 fill-white dark:fill-zinc-900 ${
                    activeStep === 2 || activeStep === 3 || activeStep === 4 || activeStep === 5 ? "stroke-violet-500 dark:stroke-violet-400 stroke-[3]" : "stroke-slate-400 dark:text-zinc-700"
                  }`}
                />
                <text x="234" y="218" fontSize="16">📦</text>
                <text x="258" y="217" className="text-[11px] font-extrabold fill-slate-900 dark:fill-zinc-100">Order Service</text>

                <path d="M 295 235 L 295 255" className="stroke-2 fill-none stroke-slate-400 dark:stroke-zinc-800" strokeDasharray="2 2" />
                <rect
                  x="245"
                  y="255"
                  width="100"
                  height="25"
                  rx="4"
                  stroke="currentColor"
                  strokeWidth={activeStep === 2 ? 2 : 1.5}
                  className={`transition-all duration-300 fill-white dark:fill-zinc-900 ${
                    activeStep === 2 ? "text-violet-500 dark:text-violet-400 verify-active stroke-2" : "stroke-slate-400 dark:stroke-zinc-755"
                  }`}
                />
                <text x="295" y="271" textAnchor="middle" className="text-[9px] font-extrabold font-mono fill-slate-600 dark:fill-zinc-300">🛢️ Order DB</text>
              </g>

              {/* 3. Inventory Service & DB */}
              <g>
                <rect
                  x="30"
                  y="315"
                  width="150"
                  height="45"
                  rx="6"
                  stroke="currentColor"
                  strokeWidth={activeStep === 3 ? 3 : 2}
                  className={`transition-all duration-300 fill-white dark:fill-zinc-900 ${
                    activeStep === 3 ? "stroke-violet-500 dark:stroke-violet-400 stroke-[3]" : "stroke-slate-400 dark:text-zinc-700"
                  }`}
                />
                <text x="44" y="343" fontSize="16">🗃️</text>
                <text x="68" y="342" className="text-[11px] font-extrabold fill-slate-900 dark:fill-zinc-100">Inventory Svc</text>

                <path d="M 105 360 L 105 380" className="stroke-2 fill-none stroke-slate-400 dark:stroke-zinc-850" strokeDasharray="2 2" />
                <rect
                  x="55"
                  y="380"
                  width="100"
                  height="25"
                  rx="4"
                  stroke="currentColor"
                  strokeWidth={activeStep === 3 ? 2 : 1.5}
                  className={`transition-all duration-300 fill-white dark:fill-zinc-900 ${
                    activeStep === 3 ? "text-violet-500 dark:text-violet-400 verify-active stroke-2" : "stroke-slate-400 dark:stroke-zinc-755"
                  }`}
                />
                <text x="105" y="396" textAnchor="middle" className="text-[9px] font-extrabold font-mono fill-slate-600 dark:fill-zinc-300">🛢️ Inventory DB</text>
              </g>

              {/* 4. Payment Service & DB */}
              <g>
                <rect
                  x="220"
                  y="315"
                  width="150"
                  height="45"
                  rx="6"
                  stroke="currentColor"
                  strokeWidth={activeStep === 4 ? 3 : 2}
                  className={`transition-all duration-300 fill-white dark:fill-zinc-900 ${
                    activeStep === 4 ? "text-violet-500 dark:text-violet-400 stroke-[3]" : "stroke-slate-400 dark:text-zinc-700"
                  }`}
                />
                <text x="234" y="343" fontSize="16">💳</text>
                <text x="258" y="342" className="text-[11px] font-extrabold fill-slate-900 dark:fill-zinc-100">Payment Svc</text>

                <path d="M 295 360 L 295 380" className="stroke-2 fill-none stroke-slate-400 dark:stroke-zinc-850" strokeDasharray="2 2" />
                <rect
                  x="245"
                  y="380"
                  width="100"
                  height="25"
                  rx="4"
                  stroke="currentColor"
                  strokeWidth={activeStep === 4 ? 2 : 1.5}
                  className={`transition-all duration-300 fill-white dark:fill-zinc-900 ${
                    activeStep === 4 ? "text-violet-500 dark:text-violet-400 verify-active stroke-2" : "stroke-slate-400 dark:stroke-zinc-755"
                  }`}
                />
                <text x="295" y="396" textAnchor="middle" className="text-[9px] font-extrabold font-mono fill-slate-600 dark:fill-zinc-300">🛢️ Payment DB</text>
              </g>

              {/* Message Broker (Kafka) */}
              <g>
                <rect
                  x="30"
                  y="445"
                  width="340"
                  height="35"
                  rx="6"
                  stroke="currentColor"
                  strokeWidth={activeStep === 5 ? 2.5 : 2}
                  className={`transition-all duration-300 fill-white dark:fill-zinc-900 ${
                    activeStep === 5 ? "text-amber-500" : "text-slate-400 dark:text-zinc-700"
                  }`}
                />
                <text x="200" y="468" textAnchor="middle" className="text-xs font-extrabold fill-slate-900 dark:fill-zinc-100">📨 Message Broker (Kafka/Event Queue)</text>
              </g>

              {/* 5. Notification Service */}
              <g>
                <rect
                  x="110"
                  y="515"
                  width="180"
                  height="45"
                  rx="6"
                  stroke="currentColor"
                  strokeWidth={activeStep === 5 ? 3 : 2}
                  className={`transition-all duration-300 fill-white dark:fill-zinc-900 ${
                    activeStep === 5 ? "text-violet-500 dark:text-violet-400" : "text-slate-400 dark:text-zinc-700"
                  }`}
                />
                <text x="132" y="543" fontSize="16">🔔</text>
                <text x="156" y="542" className="text-[11px] font-extrabold fill-slate-900 dark:fill-zinc-100">Notification Service</text>
              </g>

              {/* Service Connectors (Internal Network Calls) */}
              {/* Order -> Inventory (Network) */}
              <path
                d="M 220 212 L 180 212 L 180 337 L 180 337"
                className="fill-none stroke-slate-400 dark:stroke-zinc-800 stroke-2"
                strokeDasharray="3 3"
              />
              {/* Order -> Payment (Network) */}
              <path
                d="M 295 235 L 295 315"
                className="fill-none stroke-slate-400 dark:stroke-zinc-800 stroke-2"
                strokeDasharray="3 3"
              />

              {/* Packet Flow Animation (MSA) */}
              <AnimatePresence>
                {activeStep === 0 && (
                  <motion.circle
                    key={`msa-p0-${activeStep}`}
                    cx="200"
                    cy="65"
                    r="7"
                    className="fill-violet-500 dark:fill-violet-400"
                    animate={{ cy: [65, 120], opacity: [0, 1, 1] }}
                    transition={{ duration: 1.2, ease: "easeInOut" }}
                  />
                )}
                {activeStep === 1 && (
                  <motion.circle
                    key={`msa-p1-${activeStep}`}
                    r="7"
                    className="fill-violet-500 dark:fill-violet-400"
                    animate={{
                      cx: [200, 105, 105, 105, 105, 200],
                      cy: [130, 190, 255, 255, 190, 130],
                      opacity: [0, 1, 1, 1, 1, 0]
                    }}
                    transition={{ duration: 2.2, ease: "easeInOut" }}
                  />
                )}
                {activeStep === 2 && (
                  <motion.circle
                    key={`msa-p2-${activeStep}`}
                    cx="200"
                    cy="130"
                    r="7"
                    className="fill-violet-500 dark:fill-violet-400"
                    animate={{ cx: [200, 295], cy: [130, 190], opacity: [0, 1, 1] }}
                    transition={{ duration: 1.2, ease: "easeInOut" }}
                  />
                )}
                {activeStep === 3 && (
                  <motion.circle
                    key={`msa-p3-${activeStep}`}
                    r="7"
                    className="fill-violet-500 dark:fill-violet-400"
                    animate={{
                      cx: [295, 180, 180, 105, 105, 105, 180, 180, 295],
                      cy: [212, 212, 337.5, 337.5, 392.5, 337.5, 337.5, 212, 212],
                      opacity: [0, 1, 1, 1, 1, 1, 1, 1, 1]
                    }}
                    transition={{ duration: 2.5, ease: "easeInOut" }}
                  />
                )}
                {activeStep === 4 && (
                  <motion.circle
                    key={`msa-p4-${activeStep}`}
                    r="7"
                    className="fill-violet-500 dark:fill-violet-400"
                    animate={{
                      cx: [295, 295, 295, 295, 295],
                      cy: [212, 337.5, 392.5, 337.5, 212],
                      opacity: [0, 1, 1, 1, 1]
                    }}
                    transition={{ duration: 2.2, ease: "easeInOut" }}
                  />
                )}
                {activeStep === 5 && (
                  <>
                    {/* Synchronous client response */}
                    <motion.circle
                      key={`msa-p5-resp-${activeStep}`}
                      r="7"
                      className="fill-violet-500 dark:fill-violet-405"
                      animate={{
                        cx: [295, 200, 200],
                        cy: [212, 130, 42.5],
                        opacity: [0, 1, 1, 0]
                      }}
                      transition={{ duration: 1.8, ease: "easeInOut" }}
                    />
                    {/* Asynchronous Event to Kafka and Notification Service */}
                    <motion.circle
                      key={`msa-p5-event-${activeStep}`}
                      r="6"
                      className="fill-amber-500"
                      animate={{
                        cx: [295, 200, 200],
                        cy: [212, 462.5, 537.5],
                        opacity: [0, 1, 1, 0]
                      }}
                      transition={{ duration: 2.2, ease: "easeInOut", delay: 0.2 }}
                    />
                  </>
                )}
              </AnimatePresence>
            </svg>
          </div>
        </div>

      </div>

      {/* 3. Variables HUD / Live Inspector */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-5 border border-border bg-card rounded-2xl shadow-sm">
        {/* Monolith HUD */}
        <div className="space-y-3.5">
          <div className="flex items-center gap-1.5 border-b border-border pb-2">
            <Cpu size={16} className="text-sky-600 dark:text-sky-400" />
            <h3 className="text-sm font-extrabold text-foreground">Monolith 변수 모니터</h3>
          </div>
          <div className="grid grid-cols-2 gap-3 text-xs font-mono">
            <div className="p-2.5 bg-muted/40 rounded-lg border border-border/40">
              <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-0.5">Active Module</div>
              <div className="font-extrabold text-foreground">{monolithCurrent.active}</div>
            </div>
            <div className="p-2.5 bg-muted/40 rounded-lg border border-border/40">
              <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-0.5">Communication</div>
              <div className="font-extrabold text-sky-600 dark:text-sky-400 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-sky-500"></span>
                {monolithCurrent.comm}
              </div>
            </div>
            <div className="p-2.5 bg-muted/40 rounded-lg border border-border/40">
              <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-0.5">DB Transaction</div>
              <div className="font-extrabold text-foreground flex items-center gap-1">
                <Database size={12} className="text-muted-foreground" />
                {monolithCurrent.db}
              </div>
            </div>
            <div className="p-2.5 bg-muted/40 rounded-lg border border-border/40">
              <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-0.5">Acc. Latency</div>
              <div className="font-extrabold text-sky-600 dark:text-sky-400 font-mono text-sm">
                {monolithCurrent.latency.toFixed(1)} ms
              </div>
            </div>
          </div>
        </div>

        {/* MSA HUD */}
        <div className="space-y-3.5">
          <div className="flex items-center gap-1.5 border-b border-border pb-2">
            <Network size={16} className="text-violet-600 dark:text-violet-400" />
            <h3 className="text-sm font-extrabold text-foreground">MSA 변수 모니터</h3>
          </div>
          <div className="grid grid-cols-2 gap-3 text-xs font-mono">
            <div className="p-2.5 bg-muted/40 rounded-lg border border-border/40">
              <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-0.5">Active Service</div>
              <div className="font-extrabold text-foreground">{msaCurrent.active}</div>
            </div>
            <div className="p-2.5 bg-muted/40 rounded-lg border border-border/40">
              <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-0.5">Communication</div>
              <div className="font-extrabold text-violet-600 dark:text-violet-400 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-violet-500"></span>
                {msaCurrent.comm}
              </div>
            </div>
            <div className="p-2.5 bg-muted/40 rounded-lg border border-border/40">
              <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-0.5">DB Transaction</div>
              <div className="font-extrabold text-foreground flex items-center gap-1">
                <Database size={12} className="text-muted-foreground" />
                {msaCurrent.db}
              </div>
            </div>
            <div className="p-2.5 bg-muted/40 rounded-lg border border-border/40">
              <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-0.5">Acc. Latency</div>
              <div className="font-extrabold text-violet-600 dark:text-violet-400 font-mono text-sm">
                {msaCurrent.latency.toFixed(1)} ms
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Comparative Protocol / Payload Inspector */}
      {activeStep >= 0 && (
        <div className="border border-border bg-card p-5 rounded-2xl space-y-4">
          <h4 className="text-sm font-extrabold text-foreground">단계별 데이터 포맷 및 통신 스펙 대조</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            {/* Monolith Info */}
            <div className="space-y-2 bg-muted/20 p-4 rounded-xl border border-border/60">
              <div className="font-extrabold text-sky-700 dark:text-sky-400 flex justify-between text-[13px] border-b border-border pb-1.5">
                <span>[Monolith] {STEPS[activeStep].monolith.active}</span>
                <span className="font-mono text-muted-foreground">지연: +{(activeStep > 0 ? (STEPS[activeStep].monolith.latency - STEPS[activeStep - 1].monolith.latency) : STEPS[activeStep].monolith.latency).toFixed(1)}ms</span>
              </div>
              <p className="text-muted-foreground leading-relaxed pt-1 font-medium">
                {activeStep === 0 && "클라이언트의 일반 HTTP 요청 패킷입니다. 세션 쿠키 정보 등이 포함되어 서버에 도달합니다."}
                {activeStep === 1 && "메모리 상에서 쿠키/세션 저장소를 Direct Method 호출로 비교합니다. 네트워크 통신이 없어 극도로 빠릅니다."}
                {activeStep === 2 && "Order Module의 Java/Kotlin/Node 객체 생성 및 서비스 비즈니스 함수를 즉시 호출합니다."}
                {activeStep === 3 && "주문 생성 로직 내에서 Inventory Module의 로직(수량 차감 등)을 메모리 상에서 직접 호출하여 수행합니다."}
                {activeStep === 4 && "단일 DB에 커넥션을 맺고 주문 데이터 저장 및 재고 차감, 결제 데이터 저장을 하나의 단일 데이터베이스 로컬 트랜잭션(ACID)으로 묶어 처리합니다."}
                {activeStep === 5 && "알림 모듈을 직접 동기 방식으로 호출한 뒤, 트랜잭션 Commit 후 클라이언트에게 200 OK HTML/JSON을 반환하며 커넥션을 해제합니다."}
              </p>
              <pre className="p-3 bg-card rounded-lg border border-border text-[10px] font-mono text-foreground overflow-x-auto whitespace-pre font-bold">
                {activeStep === 0 && `GET /orders HTTP/1.1\nHost: myapp.com\nCookie: JSESSIONID=abc123xyz`}
                {activeStep === 1 && `// Java In-Memory Call\nUser user = sessionManager.getUser(sessionId);`}
                {activeStep === 2 && `// Process Stack Call\norderService.createOrder(userId, items);`}
                {activeStep === 3 && `// Local Function Call\ninventoryService.decreaseStock(itemId, qty);`}
                {activeStep === 4 && `BEGIN TRANSACTION;\nINSERT INTO orders ...\nUPDATE inventory SET stock = stock - 1;\nCOMMIT; // ACID Guarantee`}
                {activeStep === 5 && `notificationService.sendEmail(userId, msg);\nreturn ResponseEntity.ok(orderResponse);`}
              </pre>
            </div>

            {/* MSA Info */}
            <div className="space-y-2 bg-muted/20 p-4 rounded-xl border border-border/60">
              <div className="font-extrabold text-violet-750 dark:text-violet-400 flex justify-between text-[13px] border-b border-border pb-1.5">
                <span>[MSA] {STEPS[activeStep].msa.active}</span>
                <span className="font-mono text-muted-foreground">지연: +{(activeStep > 0 ? (STEPS[activeStep].msa.latency - STEPS[activeStep - 1].msa.latency) : STEPS[activeStep].msa.latency).toFixed(1)}ms</span>
              </div>
              <p className="text-muted-foreground leading-relaxed pt-1 font-medium">
                {activeStep === 0 && "인터넷 망을 타고 API Gateway로 요청이 인입됩니다. 게이트웨이는 인가 헤더(JWT 등)를 파싱합니다."}
                {activeStep === 1 && "Gateway가 Auth Service로 gRPC/HTTP 네트워크 호출을 보냅니다. 분산 환경의 JWT를 확인하고 권한을 체크합니다."}
                {activeStep >= 2 && activeStep <= 5 && "인증 완료 후 API Gateway가 Order Service(주문 마이크로서비스)로 REST API 라우팅을 수행합니다."}
                {activeStep === 3 && "Order Service가 내부 REST/gRPC 클라이언트를 사용하여 네트워크를 거쳐 Inventory Service에 재고 차감을 위임합니다."}
                {activeStep === 4 && "Order Service가 결제 서비스(Payment Service)로 네트워크 API 호출을 수행합니다. 결제 서비스는 외부 PG사 망을 타고 결제를 진행한 뒤, 자체 DB를 커밋합니다."}
                {activeStep === 5 && "Order Service는 주문을 대기(Pending)에서 완료(Completed)로 바꾸며 클라이언트에게 최종 HTTP 201 Response를 먼저 전송하고, 동시에 비동기로 알림 서비스(Notification Svc)로 이벤트를 발행합니다."}
              </p>
              <pre className="p-3 bg-card rounded-lg border border-border text-[10px] font-mono text-foreground overflow-x-auto whitespace-pre font-bold">
                {activeStep === 0 && `POST /api/v1/orders HTTP/1.1\nHost: gateway.myapp.com\nAuthorization: Bearer eyJhbGci...`}
                {activeStep === 1 && `// Gateway -> Auth Service Network Call\nPOST /auth/verify HTTP/1.1\n{ "token": "eyJhbGci..." }`}
                {activeStep >= 2 && activeStep <= 5 && `// API Gateway -> Order Service Routing\nPOST /orders HTTP/1.1\n{ "userId": 1, "items": [...] }`}
                {activeStep === 3 && `// Order Service -> Inventory Service (gRPC)\nservice Inventory {\n  rpc DecreaseStock (StockRequest) returns (StockReply);\n}`}
                {activeStep === 4 && `// Order Service -> Payment Service\nPOST /payments HTTP/1.1\n{ "orderId": "ORD-102", "amount": 25000 }`}
                {activeStep === 5 && `// Async Message Queue Event (JSON)\nTopic: "order-events"\nPayload: { "type": "ORDER_CREATED", "userId": 1 }`}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
