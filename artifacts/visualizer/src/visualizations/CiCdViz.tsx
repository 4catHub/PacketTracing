import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Pause, RotateCcw } from "lucide-react";

const STEPS = [
  {
    title: "1. 코드 Push",
    desc: "개발자가 소스코드를 Main 브랜치에 머지하고 GitHub 원격 저장소에 Push합니다.",
    duration: 1500,
  },
  {
    title: "2. CI 파이프라인 트리거",
    desc: "GitHub Webhook이 작동하여 약속된 스펙에 따라 CI Runner 가상환경을 기동합니다.",
    duration: 1200,
  },
  {
    title: "3. 단위 테스트 (Unit Test)",
    desc: "기존 기능과 충돌 여부를 감시하기 위해 Jest / pytest 등 단위 테스트를 수행하고 검증합니다.",
    duration: 1800,
  },
  {
    title: "4. Lint & SAST 코드 분석",
    desc: "코드 스타일 검사(ESLint) 및 잠재적인 보안 취약점을 찾는 정적 분석(SAST)을 진행합니다.",
    duration: 1500,
  },
  {
    title: "5. Docker 이미지 빌드",
    desc: "안정적으로 패키징된 실행 본체를 만들기 위해 Dockerfile 기반 컨테이너 이미지를 빌드합니다.",
    duration: 2000,
  },
  {
    title: "6. 이미지 레지스트리 Push",
    desc: "완성된 Docker 이미지를 중앙 컨테이너 레지스트리(Docker Hub / AWS ECR)에 업로드합니다.",
    duration: 1600,
  },
  {
    title: "7. Staging 배포 & E2E 테스트",
    desc: "스테이징 서버에 이미지를 배포하고, Playwright로 브라우저 동작 시나리오(E2E)를 자동 검증합니다.",
    duration: 2200,
  },
  {
    title: "8. Production 무중단 배포",
    desc: "안전하게 실서버에 적용합니다. 블루-그린 스왑으로 트래픽을 전환해 다운타임 없이 릴리즈를 마칩니다.",
    duration: 2000,
  },
];

export default function CiCdViz() {
  const [activeStep, setActiveStep] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isDone, setIsDone] = useState(false);
  const total = STEPS.length;

  const reset = useCallback(() => {
    setActiveStep(-1);
    setIsPlaying(false);
    setIsDone(false);
  }, []);

  useEffect(() => {
    if (!isPlaying || isDone) return;
    if (activeStep >= total - 1) {
      setIsPlaying(false);
      setIsDone(true);
      return;
    }
    const stepIdx = activeStep + 1;
    const duration = STEPS[stepIdx]?.duration || 1500;
    const t = setTimeout(() => {
      setActiveStep(stepIdx);
    }, duration);
    return () => clearTimeout(t);
  }, [isPlaying, activeStep, isDone, total]);

  const handlePlay = useCallback(() => {
    if (isDone) {
      reset();
      setTimeout(() => {
        setActiveStep(0);
        setIsPlaying(true);
      }, 50);
    } else if (activeStep === -1) {
      setActiveStep(0);
      setIsPlaying(true);
    } else {
      setIsPlaying((p) => !p);
    }
  }, [isDone, activeStep, reset]);

  const handleNext = useCallback(() => {
    setIsPlaying(false);
    if (activeStep < total - 1) {
      setActiveStep((p) => p + 1);
    } else {
      setIsDone(true);
    }
  }, [activeStep, total]);

  const handlePrev = useCallback(() => {
    setIsPlaying(false);
    setIsDone(false);
    if (activeStep >= 0) {
      setActiveStep((p) => p - 1);
    }
  }, [activeStep]);

  const passedCount = isDone ? total : Math.max(0, activeStep + 1);
  const progress = (passedCount / total) * 100;

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex items-center gap-3 flex-wrap">
        <button
          onClick={reset}
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
          {`<`}
        </button>
        <button
          onClick={handlePlay}
          className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary text-primary-foreground hover:opacity-90 text-sm font-medium transition-opacity"
          data-testid="button-play-pause"
        >
          {isPlaying ? <Pause size={15} /> : <Play size={15} />}
          {isDone ? "다시 실행" : isPlaying ? "일시정지" : activeStep < 0 ? "파이프라인 시작" : "계속"}
        </button>
        <button
          onClick={handleNext}
          disabled={isDone}
          className="p-2.5 rounded-lg border border-card-border bg-card hover:bg-muted text-muted-foreground disabled:opacity-40 transition-colors"
          data-testid="button-next"
        >
          {`>`}
        </button>
        <div className="flex-1 space-y-1">
          <div className="text-xs sm:text-sm text-muted-foreground font-medium">
            {isDone ? "파이프라인 완료" : activeStep >= 0 ? `단계 ${activeStep + 1} / ${total} — ${STEPS[activeStep].title}` : "대기 중"}
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-primary rounded-full"
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.4 }}
            />
          </div>
        </div>
      </div>

      {/* 100% SVG Diagram Area */}
      <div className="relative border border-border/60 rounded-2xl bg-card overflow-hidden">
        <svg viewBox="0 0 840 260" className="w-full h-auto">
          {/* Background zones for CI and CD */}
          {/* CI Zone */}
          <rect x="5" y="5" width="465" height="250" rx="10" className="fill-blue-50/10 dark:fill-blue-950/5 stroke-blue-500/20 stroke-1 stroke-dashed" />
          <text x="20" y="24" className="text-[10px] font-bold fill-blue-500 uppercase tracking-widest">CI: 지속적 통합 (Continuous Integration)</text>

          {/* CD Zone */}
          <rect x="475" y="5" width="360" height="250" rx="10" className="fill-emerald-50/10 dark:fill-emerald-950/5 stroke-emerald-500/20 stroke-1 stroke-dashed" />
          <text x="490" y="24" className="text-[10px] font-bold fill-emerald-500 uppercase tracking-widest">CD: 지속적 배포 (Continuous Deployment)</text>

          {/* Connection Lines between main nodes */}
          {/* Developer to GitHub */}
          <line x1="90" y1="70" x2="150" y2="70" stroke="currentColor" className={activeStep >= 0 ? "text-blue-500 stroke-2" : "text-border stroke-1"} />
          {/* GitHub to CI Runner */}
          <line x1="220" y1="70" x2="280" y2="70" stroke="currentColor" className={activeStep >= 1 ? "text-blue-500 stroke-2 animate-pulse" : "text-border stroke-1"} />

          {/* CI Runner to Test/Lint/Build (Split paths) */}
          <path d="M 320 90 L 320 115 L 205 115 L 205 140" fill="none" stroke="currentColor" className={activeStep >= 2 ? "text-blue-500 stroke-2" : "text-border stroke-1"} />
          <path d="M 320 90 L 320 140" fill="none" stroke="currentColor" className={activeStep >= 3 ? "text-blue-500 stroke-2" : "text-border stroke-1"} />
          <path d="M 320 90 L 320 115 L 415 115 L 415 140" fill="none" stroke="currentColor" className={activeStep >= 4 ? "text-blue-500 stroke-2" : "text-border stroke-1"} />

          {/* Docker Build to Registry */}
          <path d="M 415 176 L 415 210 L 525 210 L 525 90" fill="none" stroke="currentColor" className={activeStep >= 5 ? "text-emerald-500 stroke-2" : "text-border stroke-1"} />

          {/* Registry to Staging */}
          <line x1="560" y1="70" x2="610" y2="70" stroke="currentColor" className={activeStep >= 6 ? "text-emerald-500 stroke-2" : "text-border stroke-1"} />
          {/* Staging to Production */}
          <line x1="680" y1="70" x2="730" y2="70" stroke="currentColor" className={activeStep >= 7 ? "text-emerald-500 stroke-2" : "text-border stroke-1"} />

          {/* --- Main Workflow Nodes --- */}
          
          {/* Node 1: Developer */}
          <g>
            <rect x="20" y="45" width="70" height="50" rx="8" className={`fill-card stroke-2 ${activeStep === 0 ? "stroke-blue-500 fill-blue-500/10" : "stroke-border"}`} />
            <text x="55" y="68" textAnchor="middle" className="text-sm">💻</text>
            <text x="55" y="85" textAnchor="middle" className="text-[9px] font-semibold fill-foreground">Developer</text>
          </g>

          {/* Node 2: GitHub */}
          <g>
            <rect x="150" y="45" width="70" height="50" rx="8" className={`fill-card stroke-2 ${activeStep === 0 || activeStep === 1 ? "stroke-blue-500 fill-blue-500/10" : "stroke-border"}`} />
            <text x="185" y="68" textAnchor="middle" className="text-sm">🐙</text>
            <text x="185" y="85" textAnchor="middle" className="text-[9px] font-semibold fill-foreground">GitHub</text>
          </g>

          {/* Node 3: CI Runner */}
          <g>
            <rect x="280" y="45" width="80" height="50" rx="8" className={`fill-card stroke-2 ${[1, 2, 3, 4].includes(activeStep) ? "stroke-blue-500 fill-blue-500/10" : "stroke-border"}`} />
            <text x="320" y="68" textAnchor="middle" className="text-sm">⚙️</text>
            <text x="320" y="85" textAnchor="middle" className="text-[9px] font-semibold fill-foreground">CI Runner</text>
          </g>

          {/* CI Checks subnodes (Step 3, 4, 5) */}
          {/* Node 4: Unit Test */}
          <g>
            <rect x="170" y="140" width="70" height="36" rx="6" className={`fill-card stroke-2 ${activeStep === 2 ? "stroke-blue-500 fill-blue-500/10" : activeStep > 2 ? "stroke-emerald-500 fill-emerald-500/10" : "stroke-border"}`} />
            <text x="205" y="156" textAnchor="middle" className="text-xs">🧪</text>
            <text x="205" y="168" textAnchor="middle" className="text-[8px] font-semibold fill-foreground">Unit Test</text>
          </g>

          {/* Node 5: Lint & SAST */}
          <g>
            <rect x="285" y="140" width="70" height="36" rx="6" className={`fill-card stroke-2 ${activeStep === 3 ? "stroke-blue-500 fill-blue-500/10" : activeStep > 3 ? "stroke-emerald-500 fill-emerald-500/10" : "stroke-border"}`} />
            <text x="320" y="156" textAnchor="middle" className="text-xs">🔍</text>
            <text x="320" y="168" textAnchor="middle" className="text-[8px] font-semibold fill-foreground">Lint & SAST</text>
          </g>

          {/* Node 6: Docker Build */}
          <g>
            <rect x="380" y="140" width="70" height="36" rx="6" className={`fill-card stroke-2 ${activeStep === 4 ? "stroke-blue-500 fill-blue-500/10" : activeStep > 4 ? "stroke-emerald-500 fill-emerald-500/10" : "stroke-border"}`} />
            <text x="415" y="156" textAnchor="middle" className="text-xs">🐳</text>
            <text x="415" y="168" textAnchor="middle" className="text-[8px] font-semibold fill-foreground">Docker Build</text>
          </g>

          {/* Node 7: Container Registry */}
          <g>
            <rect x="490" y="45" width="70" height="50" rx="8" className={`fill-card stroke-2 ${activeStep === 5 ? "stroke-emerald-500 fill-emerald-500/10" : activeStep > 5 ? "stroke-emerald-500" : "stroke-border"}`} />
            <text x="525" y="68" textAnchor="middle" className="text-sm">📦</text>
            <text x="525" y="85" textAnchor="middle" className="text-[9px] font-semibold fill-foreground">Registry</text>
          </g>

          {/* Node 8: Staging Env */}
          <g>
            <rect x="610" y="45" width="70" height="50" rx="8" className={`fill-card stroke-2 ${activeStep === 6 ? "stroke-emerald-500 fill-emerald-500/10" : activeStep > 6 ? "stroke-emerald-500" : "stroke-border"}`} />
            <text x="645" y="68" textAnchor="middle" className="text-sm">🚀</text>
            <text x="645" y="85" textAnchor="middle" className="text-[9px] font-semibold fill-foreground">Staging</text>
          </g>

          {/* Node 9: Production Env */}
          <g>
            <rect x="740" y="45" width="70" height="50" rx="8" className={`fill-card stroke-2 ${activeStep === 7 ? "stroke-emerald-500 fill-emerald-500/10" : isDone ? "stroke-emerald-500" : "stroke-border"}`} />
            <text x="775" y="68" textAnchor="middle" className="text-sm">✅</text>
            <text x="775" y="85" textAnchor="middle" className="text-[9px] font-semibold fill-foreground">Production</text>
          </g>


          {/* --- Dynamic Stage-by-Stage Animations --- */}

          {/* Step 0: Code Push Commit Packet */}
          {activeStep === 0 && (
            <motion.rect
              key="git-push-commit"
              x={90}
              y={64}
              width={16}
              height={12}
              rx={2}
              className="fill-blue-500 stroke-blue-600 stroke-[0.5px]"
              animate={{ x: [90, 142] }}
              transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
            />
          )}

          {/* Step 1: Webhook signal to runner */}
          {activeStep === 1 && (
            <motion.circle
              key="webhook-packet"
              cx={220}
              cy={70}
              r={4}
              className="fill-blue-400 stroke-blue-500"
              animate={{ cx: [220, 275], scale: [1, 1.4, 1] }}
              transition={{ duration: 1.0, repeat: Infinity, ease: "linear" }}
            />
          )}

          {/* Step 2: Unit Test execution details inside node */}
          {activeStep === 2 && (
            <g transform="translate(170, 185)">
              {/* Progress dots inside box */}
              <motion.circle cx="15" cy="5" r="2.5" className="fill-blue-400" animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 0.6 }} />
              <motion.circle cx="35" cy="5" r="2.5" className="fill-blue-400" animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.2 }} />
              <motion.circle cx="55" cy="5" r="2.5" className="fill-blue-400" animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.4 }} />
              <motion.text x="35" y="24" textAnchor="middle" className="text-[7px] fill-blue-500 font-bold font-mono" animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 1, repeat: Infinity }}>
                RUNNING TESTS...
              </motion.text>
            </g>
          )}

          {/* Step 3: Lint scan bar animation */}
          {activeStep === 3 && (
            <g>
              <motion.line
                key="lint-scan-bar"
                x1={287}
                y1={142}
                x2="353"
                y2={142}
                stroke="#3b82f6"
                strokeWidth="1.5"
                animate={{ y: [142, 174, 142] }}
                transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
              />
              <text x="320" y="190" textAnchor="middle" className="text-[7px] fill-blue-500 font-bold font-mono animate-pulse">SAST SCANNING...</text>
            </g>
          )}

          {/* Step 4: Docker Image Build packing animation */}
          {activeStep === 4 && (
            <g transform="translate(380, 182)">
              <motion.rect
                key="docker-build-box"
                x="15"
                y="2"
                width="40"
                height="8"
                className="fill-blue-400/40 stroke-blue-500 stroke-[0.5px]"
                animate={{ y: [2, 10, 2] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
              />
              <text x="35" y="22" textAnchor="middle" className="text-[7px] fill-blue-500 font-bold font-mono animate-pulse">BUILDING LAYER...</text>
            </g>
          )}

          {/* Step 5: Registry Push container card traveling */}
          {activeStep === 5 && (
            <motion.g
              key="registry-push-packet"
              animate={{
                x: [385, 385, 495, 495],
                y: [142, 200, 200, 50],
                scale: [1, 0.8, 0.8, 1],
              }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
            >
              <rect x="0" y="0" width="20" height="15" rx="2" className="fill-emerald-500 stroke-emerald-600 stroke-[0.5px]" />
              <text x="10" y="10" textAnchor="middle" className="text-[7px] fill-white font-bold font-mono">IMG</text>
            </motion.g>
          )}

          {/* Step 6: Staging deploy & Playwright E2E simulation */}
          {activeStep === 6 && (
            <g>
              {/* Image pull animation to Staging */}
              <motion.circle cx="585" cy="70" r="3" className="fill-emerald-500" animate={{ cx: [565, 605] }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }} />
              {/* Playwright Browser simulation inside Staging Node */}
              <g transform="translate(605, 110)">
                <rect x="0" y="0" width="80" height="60" rx="4" className="fill-card stroke-emerald-500/50 stroke-1 shadow-md" />
                <rect x="0" y="0" width="80" height="10" className="fill-muted-foreground/10 rounded-t-[4px]" />
                <circle cx="5" cy="5" r="2" className="fill-red-400" />
                <circle cx="10" cy="5" r="2" className="fill-amber-400" />
                <circle cx="15" cy="5" r="2" className="fill-emerald-400" />
                
                {/* Simulated mouse pointer */}
                <motion.polygon
                  points="25,45 25,25 35,35"
                  className="fill-primary"
                  animate={{
                    x: [0, 20, 10, 0],
                    y: [0, -10, -5, 0],
                    scale: [1, 0.9, 1.1, 1],
                  }}
                  transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
                />
                
                {/* Mock E2E page click result */}
                <motion.rect
                  x="20"
                  y="20"
                  width="40"
                  height="20"
                  rx="2"
                  className="fill-emerald-500/10 stroke-emerald-500 stroke-[0.5px]"
                  animate={{ opacity: [0.2, 1, 0.2] }}
                  transition={{ duration: 1.8, repeat: Infinity }}
                />
                <text x="40" y="32" textAnchor="middle" className="text-[5px] fill-emerald-600 font-bold font-mono">E2E TESTING...</text>
              </g>
            </g>
          )}

          {/* Step 7: Production deploy Blue-Green Swap */}
          {activeStep === 7 && (
            <g transform="translate(710, 110)">
              {/* Blue Server Node */}
              <rect x="5" y="5" width="55" height="24" rx="3" className="fill-blue-500/20 stroke-blue-500 stroke-1" />
              <text x="32" y="17" textAnchor="middle" className="text-[7px] font-bold fill-blue-600 dark:fill-blue-400">Blue (Active)</text>

              {/* Green Server Node */}
              <rect x="5" y="35" width="55" height="24" rx="3" className="fill-emerald-500/20 stroke-emerald-500 stroke-1" />
              <text x="32" y="47" textAnchor="middle" className="text-[7px] font-bold fill-emerald-600 dark:fill-emerald-400">Green (New)</text>

              {/* Routing Arrow swap */}
              <motion.path
                d="M -15 32 Q -5 20 5 17"
                fill="none"
                stroke="#3b82f6"
                strokeWidth="1.5"
                animate={{ d: ["M -15 32 Q -5 20 5 17", "M -15 32 Q -5 40 5 47"] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
              />
              <text x="-25" y="36" textAnchor="end" className="text-[6px] fill-muted-foreground font-mono">Traffic</text>
            </g>
          )}
        </svg>
      </div>

      {/* Step Callout */}
      <AnimatePresence mode="wait">
        {activeStep >= 0 && activeStep < total && (
          <motion.div
            key={activeStep}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            className={`p-4 rounded-xl border ${
              activeStep >= 5
                ? "border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/20 dark:bg-emerald-950/10"
                : "border-blue-200 dark:border-blue-900/60 bg-blue-50/20 dark:bg-blue-950/10"
            }`}
          >
            <div className="flex items-start gap-3">
              <div
                className={`w-6 h-6 rounded-full text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5 ${
                  activeStep >= 5 ? "bg-emerald-500" : "bg-blue-500"
                }`}
              >
                {activeStep + 1}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-sm text-foreground">
                  {STEPS[activeStep].title}
                </div>
                <div className="text-xs sm:text-sm text-muted-foreground mt-1">
                  {STEPS[activeStep].desc}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {isDone && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-emerald-500/10 dark:bg-emerald-950/20 border border-emerald-500/20 dark:border-emerald-900/40 rounded-xl text-center"
        >
          <p className="font-semibold text-emerald-700 dark:text-emerald-400 text-sm">
            🎉 파이프라인 전체 과정 검증 성공! 변경 사항이 다운타임 없이 가동 환경에 안착했습니다.
          </p>
        </motion.div>
      )}
    </div>
  );
}
