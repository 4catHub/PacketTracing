import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Pause, RotateCcw, CheckCircle, XCircle, Loader2, Circle } from "lucide-react";

type StageStatus = "pending" | "running" | "passed" | "failed";

interface Stage {
  id: string;
  label: string;
  sublabel: string;
  icon: string;
  duration: number;
}

const STAGES: Stage[] = [
  { id: "push", label: "Code Push", sublabel: "Git → main", icon: "📤", duration: 600 },
  { id: "build", label: "Build", sublabel: "Compile & Bundle", icon: "🔨", duration: 900 },
  { id: "test", label: "Unit Test", sublabel: "Jest / pytest", icon: "🧪", duration: 800 },
  { id: "lint", label: "Lint & SAST", sublabel: "정적 분석 / 보안 스캔", icon: "🔍", duration: 700 },
  { id: "docker", label: "Docker Build", sublabel: "이미지 생성", icon: "🐳", duration: 900 },
  { id: "registry", label: "Push Registry", sublabel: "ECR / Docker Hub", icon: "📦", duration: 600 },
  { id: "staging", label: "Deploy Staging", sublabel: "스테이징 배포 & E2E", icon: "🚀", duration: 1000 },
  { id: "prod", label: "Deploy Prod", sublabel: "프로덕션 배포 완료", icon: "✅", duration: 700 },
];

function StatusIcon({ status }: { status: StageStatus }) {
  if (status === "running") return <Loader2 size={16} className="animate-spin text-blue-500" />;
  if (status === "passed") return <CheckCircle size={16} className="text-emerald-500" />;
  if (status === "failed") return <XCircle size={16} className="text-red-500" />;
  return <Circle size={16} className="text-muted-foreground/40" />;
}

function getConnectorColor(statuses: StageStatus[], idx: number) {
  if (idx >= statuses.length - 1) return "bg-muted/40";
  if (statuses[idx] === "passed") return "bg-emerald-400";
  return "bg-muted/40";
}

export default function CiCdViz() {
  const [statuses, setStatuses] = useState<StageStatus[]>(STAGES.map(() => "pending"));
  const [currentIdx, setCurrentIdx] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isDone, setIsDone] = useState(false);

  const isComplete = currentIdx >= STAGES.length;

  const reset = useCallback(() => {
    setStatuses(STAGES.map(() => "pending"));
    setCurrentIdx(-1);
    setIsPlaying(false);
    setIsDone(false);
  }, []);

  useEffect(() => {
    if (!isPlaying || isDone) return;
    if (currentIdx >= STAGES.length) {
      setIsPlaying(false);
      setIsDone(true);
      return;
    }

    const stage = STAGES[currentIdx];
    if (!stage) {
      setIsDone(true);
      setIsPlaying(false);
      return;
    }

    // Mark current as running
    setStatuses((prev) => {
      const next = [...prev];
      next[currentIdx] = "running";
      return next;
    });

    const t = setTimeout(() => {
      setStatuses((prev) => {
        const next = [...prev];
        next[currentIdx] = "passed";
        return next;
      });
      setCurrentIdx((p) => p + 1);
    }, stage.duration);

    return () => clearTimeout(t);
  }, [isPlaying, currentIdx, isDone]);

  const handlePlay = useCallback(() => {
    if (isDone || isComplete) {
      reset();
      setTimeout(() => {
        setCurrentIdx(0);
        setIsPlaying(true);
      }, 50);
    } else if (currentIdx === -1) {
      setCurrentIdx(0);
      setIsPlaying(true);
    } else {
      setIsPlaying((p) => !p);
    }
  }, [isDone, isComplete, currentIdx, reset]);

  const passedCount = statuses.filter((s) => s === "passed").length;
  const progress = (passedCount / STAGES.length) * 100;

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex items-center gap-2 flex-wrap">
        <button
          onClick={reset}
          className="p-2 rounded-lg border border-card-border bg-card hover:bg-muted text-muted-foreground transition-colors"
          data-testid="button-reset"
        >
          <RotateCcw size={15} />
        </button>
        <button
          onClick={handlePlay}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:opacity-90 text-sm font-medium"
          data-testid="button-play-pause"
        >
          {isPlaying ? <Pause size={14} /> : <Play size={14} />}
          {isDone ? "다시 실행" : isPlaying ? "일시정지" : currentIdx < 0 ? "파이프라인 시작" : "계속"}
        </button>
        <div className="flex-1 space-y-1">
          <div className="text-xs text-muted-foreground">
            {passedCount}/{STAGES.length} 단계 완료
          </div>
          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-primary rounded-full"
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.4 }}
            />
          </div>
        </div>
      </div>

      {/* Pipeline — horizontal on large, vertical on small */}
      <div className="overflow-x-auto pb-2">
        <div className="flex items-center min-w-max gap-0">
          {STAGES.map((stage, i) => {
            const status = statuses[i];
            const isActive = i === currentIdx && status === "running";

            return (
              <div key={stage.id} className="flex items-center">
                {/* Stage node */}
                <motion.div
                  animate={
                    isActive
                      ? { scale: [1, 1.04, 1], transition: { repeat: Infinity, duration: 1 } }
                      : { scale: 1 }
                  }
                  className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all duration-300 w-28 ${
                    status === "running"
                      ? "border-blue-400 bg-blue-50 dark:bg-blue-900/20"
                      : status === "passed"
                      ? "border-emerald-400 bg-emerald-50 dark:bg-emerald-900/20"
                      : status === "failed"
                      ? "border-red-400 bg-red-50 dark:bg-red-900/20"
                      : "border-card-border bg-card"
                  }`}
                  data-testid={`stage-${stage.id}`}
                >
                  <div className="text-xl">{stage.icon}</div>
                  <span
                    className={`text-xs font-semibold text-center leading-tight ${
                      status === "passed" ? "text-emerald-700 dark:text-emerald-400" :
                      status === "running" ? "text-blue-700 dark:text-blue-400" :
                      status === "failed" ? "text-red-700 dark:text-red-400" :
                      "text-foreground"
                    }`}
                  >
                    {stage.label}
                  </span>
                  <span className="text-[10px] text-muted-foreground text-center leading-tight">
                    {stage.sublabel}
                  </span>
                  <StatusIcon status={status} />
                </motion.div>

                {/* Connector arrow */}
                {i < STAGES.length - 1 && (
                  <div className="flex items-center mx-0.5">
                    <div
                      className={`h-0.5 w-5 transition-colors duration-500 ${getConnectorColor(statuses, i)}`}
                    />
                    <div
                      className={`border-t-2 border-r-2 w-2 h-2 rotate-45 -ml-1.5 transition-colors duration-500 ${
                        statuses[i] === "passed"
                          ? "border-emerald-400"
                          : "border-muted/40"
                      }`}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Active stage detail */}
      <AnimatePresence mode="wait">
        {currentIdx >= 0 && currentIdx < STAGES.length && (
          <motion.div
            key={currentIdx}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className={`p-4 rounded-xl border text-sm ${
              statuses[currentIdx] === "running"
                ? "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800"
                : statuses[currentIdx] === "passed"
                ? "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800"
                : "bg-muted/40 border-border"
            }`}
          >
            <div className="flex items-center gap-2">
              <StatusIcon status={statuses[currentIdx]} />
              <span className="font-semibold text-foreground">
                {STAGES[currentIdx]?.label}
              </span>
              <span className="text-muted-foreground text-xs">
                — {STAGES[currentIdx]?.sublabel}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {isDone && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl text-center"
        >
          <p className="font-semibold text-emerald-700 dark:text-emerald-400">
            🎉 파이프라인 완료! 코드가 프로덕션에 자동 배포되었습니다.
          </p>
        </motion.div>
      )}
    </div>
  );
}
