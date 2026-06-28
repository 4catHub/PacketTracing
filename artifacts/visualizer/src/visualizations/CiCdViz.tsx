import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Pause, RotateCcw } from "lucide-react";

const STEPS = [
  { title: "코드 Push", duration: 700, nodes: [0, 1], desc: "개발자가 feature 브랜치를 main에 머지 후 GitHub에 Push합니다." },
  { title: "CI 파이프라인 트리거", duration: 600, nodes: [1, 2], desc: "GitHub webhook이 CI Runner를 트리거합니다." },
  { title: "Unit Test 실행", duration: 1000, nodes: [2, 3], desc: "Jest / pytest로 단위 테스트를 실행합니다. 실패 시 파이프라인이 중단됩니다." },
  { title: "Lint & SAST 검사", duration: 800, nodes: [2, 4], desc: "코드 스타일 검사와 보안 취약점 정적 분석(SAST)을 실행합니다." },
  { title: "Docker 이미지 빌드", duration: 1200, nodes: [2, 5], desc: "애플리케이션을 Docker 이미지로 빌드합니다. 레이어 캐싱으로 속도를 최적화합니다." },
  { title: "Registry에 이미지 Push", duration: 700, nodes: [5, 6], desc: "빌드된 이미지를 ECR / Docker Hub 등의 컨테이너 레지스트리에 업로드합니다." },
  { title: "Staging 배포 & E2E 테스트", duration: 1200, nodes: [6, 7], desc: "스테이징 환경에 배포 후 Playwright / Cypress로 E2E 테스트를 실행합니다." },
  { title: "Production 배포 완료", duration: 900, nodes: [7, 8], desc: "승인 후 프로덕션 환경에 자동 배포됩니다. 블루-그린 또는 롤링 배포를 사용합니다." },
];

const NODES = [
  { id: 0, icon: "💻", label: "Developer" },
  { id: 1, icon: "🐙", label: "GitHub" },
  { id: 2, icon: "⚙️", label: "CI Runner" },
  { id: 3, icon: "🧪", label: "Unit Test" },
  { id: 4, icon: "🔍", label: "Lint & SAST" },
  { id: 5, icon: "🐳", label: "Docker Build" },
  { id: 6, icon: "📦", label: "Registry" },
  { id: 7, icon: "🚀", label: "Staging" },
  { id: 8, icon: "✅", label: "Production" },
];

type Status = "idle" | "active" | "done" | "dim";

function nodeStatus(id: number, active: number): Status {
  if (active < 0) return "idle";
  if (STEPS[active]?.nodes.includes(id)) return "active";
  for (let i = 0; i < active; i++) if (STEPS[i].nodes.includes(id)) return "done";
  return "dim";
}

function edgeStatus(edge: number, active: number): Status {
  if (active < 0) return "idle";
  if (active === edge) return "active";
  if (active > edge) return "done";
  return "dim";
}

const NODE_BASE = "flex flex-col items-center gap-1 p-2.5 rounded-xl border-2 text-center transition-all duration-300 w-[76px] shrink-0";
const NODE_STATUS: Record<Status, string> = {
  idle: "border-border bg-card",
  active: "border-blue-400 bg-blue-50 dark:bg-blue-900/20 ring-2 ring-blue-400 ring-offset-1 dark:ring-offset-background shadow-lg shadow-blue-500/20",
  done: "border-emerald-400 bg-emerald-50 dark:bg-emerald-900/20",
  dim: "border-border bg-card opacity-20",
};

function ArchNode({ id, active }: { id: number; active: number }) {
  const def = NODES.find(n => n.id === id)!;
  const s = nodeStatus(id, active);
  return (
    <motion.div
      animate={s === "active" ? { scale: [1, 1.06, 1] } : { scale: 1 }}
      transition={s === "active" ? { repeat: Infinity, duration: 1.2, ease: "easeInOut" } : {}}
      className={`${NODE_BASE} ${NODE_STATUS[s]}`}
    >
      <span className="text-xl leading-none">{def.icon}</span>
      <span className="text-[10px] font-bold leading-tight">{def.label}</span>
    </motion.div>
  );
}

function ArrowH({ edge, active }: { edge: number; active: number }) {
  const s = edgeStatus(edge, active);
  const started = active >= 0;
  const line = s === "active" ? "bg-blue-500" : s === "done" ? "bg-emerald-400" : started ? "bg-border/25" : "bg-border/50";
  const head = s === "active" ? "border-l-blue-500" : s === "done" ? "border-l-emerald-400" : started ? "border-l-border/25" : "border-l-border/50";
  const badge = s === "active" ? "bg-blue-500 text-white shadow" : s === "done" ? "bg-emerald-500 text-white" : "bg-muted text-muted-foreground/50";
  return (
    <div className="relative flex items-center w-10 shrink-0 mx-0.5">
      <div className={`h-0.5 flex-1 transition-colors duration-300 ${line}`} />
      <div className={`w-0 h-0 border-t-[4px] border-b-[4px] border-l-[6px] border-transparent transition-colors duration-300 ${head}`} />
      <div className={`absolute -top-[18px] left-1/2 -translate-x-1/2 w-5 h-5 rounded-full text-[9px] font-bold flex items-center justify-center transition-all duration-300 ${badge}`}>
        {edge + 1}
      </div>
    </div>
  );
}

function ArrowV({ edge, active, badgeLeft = false }: { edge: number; active: number; badgeLeft?: boolean }) {
  const s = edgeStatus(edge, active);
  const started = active >= 0;
  const line = s === "active" ? "bg-blue-500" : s === "done" ? "bg-emerald-400" : started ? "bg-border/25" : "bg-border/50";
  const head = s === "active" ? "border-t-blue-500" : s === "done" ? "border-t-emerald-400" : started ? "border-t-border/25" : "border-t-border/50";
  const badge = s === "active" ? "bg-blue-500 text-white shadow" : s === "done" ? "bg-emerald-500 text-white" : "bg-muted text-muted-foreground/50";
  return (
    <div className="relative flex flex-col items-center h-8 shrink-0 my-0.5">
      <div className={`w-0.5 flex-1 transition-colors duration-300 ${line}`} />
      <div className={`w-0 h-0 border-l-[4px] border-r-[4px] border-t-[6px] border-transparent transition-colors duration-300 ${head}`} />
      <div className={`absolute ${badgeLeft ? "-left-6" : "-right-6"} top-1/2 -translate-y-1/2 w-5 h-5 rounded-full text-[9px] font-bold flex items-center justify-center transition-all duration-300 ${badge}`}>
        {edge + 1}
      </div>
    </div>
  );
}

function ConnectorV({ active, steps }: { active: number; steps: number[] }) {
  const isActive = steps.includes(active);
  const isDone = steps.some(s => s < active);
  const started = active >= 0;
  const color = isActive ? "bg-blue-500" : isDone ? "bg-emerald-400" : started ? "bg-border/25" : "bg-border/50";
  return <div className={`w-0.5 h-5 transition-colors duration-300 ${color}`} />;
}

function groupBorderClass(nodeIds: number[], active: number): string {
  const anyActive = nodeIds.some(id => nodeStatus(id, active) === "active");
  const anyDone = nodeIds.some(id => nodeStatus(id, active) === "done");
  if (anyActive) return "border-blue-400/70 bg-blue-50/30 dark:bg-blue-900/10";
  if (anyDone) return "border-emerald-400/50 bg-emerald-50/20 dark:bg-emerald-900/5";
  if (active >= 0) return "border-border/30 opacity-40";
  return "border-border/50 bg-muted/10";
}

export default function CiCdViz() {
  const [activeStep, setActiveStep] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isDone, setIsDone] = useState(false);
  const total = STEPS.length;

  const reset = useCallback(() => { setActiveStep(-1); setIsPlaying(false); setIsDone(false); }, []);

  useEffect(() => {
    if (!isPlaying || isDone) return;
    if (activeStep >= total) { setIsPlaying(false); setIsDone(true); return; }
    const step = STEPS[activeStep];
    if (!step) { setIsDone(true); setIsPlaying(false); return; }
    const t = setTimeout(() => setActiveStep(p => p + 1), step.duration);
    return () => clearTimeout(t);
  }, [isPlaying, activeStep, isDone, total]);

  const handlePlay = useCallback(() => {
    if (isDone || activeStep >= total) {
      reset();
      setTimeout(() => { setActiveStep(0); setIsPlaying(true); }, 50);
    } else if (activeStep === -1) {
      setActiveStep(0);
      setIsPlaying(true);
    } else {
      setIsPlaying(p => !p);
    }
  }, [isDone, activeStep, total, reset]);

  const passedCount = isDone ? total : Math.max(0, activeStep);
  const progress = (passedCount / total) * 100;

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex items-center gap-2 flex-wrap">
        <button onClick={reset} className="p-2 rounded-lg border border-card-border bg-card hover:bg-muted text-muted-foreground" data-testid="button-reset">
          <RotateCcw size={15} />
        </button>
        <button onClick={handlePlay} className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:opacity-90 text-sm font-medium" data-testid="button-play-pause">
          {isPlaying ? <Pause size={14} /> : <Play size={14} />}
          {isDone ? "다시 실행" : isPlaying ? "일시정지" : activeStep < 0 ? "파이프라인 시작" : "계속"}
        </button>
        <div className="flex-1 space-y-1">
          <div className="text-xs text-muted-foreground">{passedCount}/{total} 단계 완료</div>
          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
            <motion.div className="h-full bg-primary rounded-full" animate={{ width: `${progress}%` }} transition={{ duration: 0.4 }} />
          </div>
        </div>
      </div>

      {/* Architecture Diagram */}
      <div className="overflow-x-auto pb-2">
        <div className="flex flex-col items-center gap-0 min-w-[360px]">

          {/* Row 1: Developer → GitHub → CI Runner */}
          <div className="flex items-center gap-0">
            <ArchNode id={0} active={activeStep} />
            <ArrowH edge={0} active={activeStep} />
            <ArchNode id={1} active={activeStep} />
            <ArrowH edge={1} active={activeStep} />
            <ArchNode id={2} active={activeStep} />
          </div>

          {/* Connector down from CI Runner to CI Checks */}
          <ConnectorV active={activeStep} steps={[2, 3, 4]} />

          {/* CI Checks group */}
          <div className={`border border-dashed rounded-xl p-3 space-y-2 transition-all duration-300 ${groupBorderClass([3, 4, 5], activeStep)}`}>
            <div className="text-[10px] font-bold text-muted-foreground text-center uppercase tracking-wide">CI 검사 (병렬)</div>
            <div className="flex items-center gap-2">
              <ArchNode id={3} active={activeStep} />
              <ArchNode id={4} active={activeStep} />
              <ArchNode id={5} active={activeStep} />
            </div>
          </div>

          {/* Arrow down to Registry */}
          <ArrowV edge={5} active={activeStep} />

          {/* Registry */}
          <ArchNode id={6} active={activeStep} />

          {/* Arrow to Staging */}
          <ArrowV edge={6} active={activeStep} />

          {/* Staging → Production */}
          <div className="flex items-center gap-0">
            <ArchNode id={7} active={activeStep} />
            <ArrowH edge={7} active={activeStep} />
            <ArchNode id={8} active={activeStep} />
          </div>
        </div>
      </div>

      {/* Step callout */}
      <AnimatePresence mode="wait">
        {activeStep >= 0 && activeStep < total && (
          <motion.div key={activeStep} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
            className="p-4 rounded-xl border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-blue-500 text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                {activeStep + 1}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-sm text-foreground">{STEPS[activeStep].title}</div>
                <div className="text-xs text-muted-foreground mt-0.5">{STEPS[activeStep].desc}</div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {isDone && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl text-center">
          <p className="font-semibold text-emerald-700 dark:text-emerald-400">
            🎉 파이프라인 완료! 코드가 프로덕션에 자동 배포되었습니다.
          </p>
        </motion.div>
      )}
    </div>
  );
}
