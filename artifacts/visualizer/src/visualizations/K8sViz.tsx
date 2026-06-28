import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, RotateCcw } from "lucide-react";

type PodStatus = "running" | "failed" | "restarting" | "scaled";

interface Pod {
  id: number;
  status: PodStatus;
}

type Phase = "normal" | "failure" | "healing" | "scaled";

function PodIcon({ status, idx }: { status: PodStatus; idx: number }) {
  return (
    <motion.div
      key={`${status}-${idx}`}
      initial={{ scale: 0.7, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className={`flex flex-col items-center gap-1 p-2 rounded-xl border text-center w-16 transition-all duration-300 ${
        status === "running"
          ? "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-300 dark:border-emerald-700"
          : status === "failed"
          ? "bg-red-50 dark:bg-red-900/20 border-red-300 dark:border-red-700"
          : status === "restarting"
          ? "bg-amber-50 dark:bg-amber-900/20 border-amber-300 dark:border-amber-700"
          : "bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-700"
      }`}
    >
      <span className="text-base">
        {status === "running" ? "🟢" : status === "failed" ? "🔴" : status === "restarting" ? "🟡" : "🔵"}
      </span>
      <span className="text-[9px] font-semibold text-foreground">Pod {idx + 1}</span>
      <span className={`text-[8px] font-medium leading-tight ${
        status === "running" ? "text-emerald-600 dark:text-emerald-400" :
        status === "failed" ? "text-red-600 dark:text-red-400" :
        status === "restarting" ? "text-amber-600 dark:text-amber-400" :
        "text-blue-600 dark:text-blue-400"
      }`}>
        {status === "running" ? "Running" : status === "failed" ? "Failed" : status === "restarting" ? "Restart..." : "New Pod"}
      </span>
    </motion.div>
  );
}

const PHASE_SEQUENCE: Phase[] = ["normal", "failure", "healing", "scaled"];
const PHASE_LABELS: Record<Phase, string> = {
  normal: "정상 운영 중 (3개 파드)",
  failure: "Pod 1 장애 발생!",
  healing: "kubelet 감지 → 자동 재시작",
  scaled: "HPA: 트래픽 증가 → Pod 자동 추가",
};
const PHASE_DELAYS: Record<Phase, number> = {
  normal: 1400,
  failure: 1200,
  healing: 1400,
  scaled: 0,
};

export default function K8sViz() {
  const [phase, setPhase] = useState<Phase>("normal");
  const [isPlaying, setIsPlaying] = useState(false);
  const [phaseIdx, setPhaseIdx] = useState(0);

  const reset = useCallback(() => {
    setPhase("normal");
    setPhaseIdx(0);
    setIsPlaying(false);
  }, []);

  const isDone = phaseIdx >= PHASE_SEQUENCE.length - 1;

  useEffect(() => {
    if (!isPlaying) return;
    if (isDone) { setIsPlaying(false); return; }
    const nextIdx = phaseIdx + 1;
    const delay = PHASE_DELAYS[PHASE_SEQUENCE[phaseIdx]] || 1000;
    const t = setTimeout(() => {
      setPhaseIdx(nextIdx);
      setPhase(PHASE_SEQUENCE[nextIdx]);
    }, delay);
    return () => clearTimeout(t);
  }, [isPlaying, phaseIdx, isDone]);

  const handlePlay = useCallback(() => {
    if (isDone) { reset(); setTimeout(() => setIsPlaying(true), 50); }
    else setIsPlaying(true);
  }, [isDone, reset]);

  const afterPods: Pod[] = (() => {
    if (phase === "normal") return [
      { id: 0, status: "running" }, { id: 1, status: "running" }, { id: 2, status: "running" }
    ];
    if (phase === "failure") return [
      { id: 0, status: "failed" }, { id: 1, status: "running" }, { id: 2, status: "running" }
    ];
    if (phase === "healing") return [
      { id: 0, status: "restarting" }, { id: 1, status: "running" }, { id: 2, status: "running" }
    ];
    return [
      { id: 0, status: "running" }, { id: 1, status: "running" }, { id: 2, status: "running" },
      { id: 3, status: "scaled" }, { id: 4, status: "scaled" },
    ];
  })();

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Before — 단일 서버 */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800">
              ❌ k8s 적용 전
            </span>
          </div>

          <div className="rounded-2xl border-2 border-dashed border-red-300 dark:border-red-700 p-4 space-y-3 bg-red-50/30 dark:bg-red-900/10">
            <div className="flex items-center gap-2">
              <span className="text-base">🖥️</span>
              <span className="text-sm font-bold text-foreground">단일 서버</span>
            </div>

            <div className="flex justify-center">
              <div className="flex flex-col items-center gap-2 p-4 rounded-xl border border-red-300 dark:border-red-700 bg-red-100/60 dark:bg-red-900/30 w-36">
                <span className="text-3xl">🔴</span>
                <span className="text-sm font-bold text-red-700 dark:text-red-400">서버 다운</span>
                <span className="text-xs text-muted-foreground text-center">프로세스 1개 — SPOF</span>
              </div>
            </div>

            <div className="p-3 bg-red-100 dark:bg-red-900/40 border border-red-300 dark:border-red-700 rounded-xl text-center">
              <span className="text-xl block mb-1">🚫</span>
              <span className="text-sm font-semibold text-red-700 dark:text-red-400">서비스 전체 중단</span>
              <span className="text-xs text-muted-foreground block mt-1">수동 복구까지 수분~수시간 다운타임</span>
            </div>

            <div className="text-xs text-muted-foreground space-y-1">
              <div className="flex items-start gap-1.5"><span>•</span><span>SPOF — 장애 시 전체 서비스 중단</span></div>
              <div className="flex items-start gap-1.5"><span>•</span><span>트래픽 급증 시 수동으로 서버 추가 필요</span></div>
              <div className="flex items-start gap-1.5"><span>•</span><span>배포 시 다운타임 발생</span></div>
            </div>
          </div>
        </motion.div>

        {/* After — K8s 클러스터 */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
              ✅ k8s 적용 후
            </span>
            <div className="flex items-center gap-1.5">
              <button onClick={reset} className="p-1.5 rounded-lg border border-card-border bg-card hover:bg-muted text-muted-foreground" data-testid="button-reset">
                <RotateCcw size={13} />
              </button>
              <button
                onClick={handlePlay}
                disabled={isPlaying}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground hover:opacity-90 text-xs font-medium disabled:opacity-60"
                data-testid="button-play-pause"
              >
                <Play size={12} />
                {isDone ? "다시 보기" : "장애 시뮬레이션"}
              </button>
            </div>
          </div>

          <div className="rounded-2xl border-2 border-dashed border-emerald-300 dark:border-emerald-700 p-4 space-y-3 bg-emerald-50/20 dark:bg-emerald-900/10">
            {/* Phase bar */}
            <div className="flex items-center gap-1">
              {PHASE_SEQUENCE.map((p, i) => (
                <div key={p} className={`flex-1 h-1.5 rounded-full transition-all duration-500 ${i <= phaseIdx ? 'bg-primary' : 'bg-muted'}`} />
              ))}
            </div>

            {/* Phase label */}
            <AnimatePresence mode="wait">
              <motion.div
                key={phase}
                initial={{ opacity: 0, y: 3 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -3 }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold text-center border ${
                  phase === "failure"
                    ? "bg-red-50 dark:bg-red-900/20 border-red-300 dark:border-red-700 text-red-700 dark:text-red-400"
                    : phase === "healing"
                    ? "bg-amber-50 dark:bg-amber-900/20 border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-400"
                    : phase === "scaled"
                    ? "bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-400"
                    : "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-400"
                }`}
              >
                {PHASE_LABELS[phase]}
              </motion.div>
            </AnimatePresence>

            <div className="flex items-center gap-2 text-sm font-bold text-foreground">
              <span>☸️</span>
              <span>k8s 클러스터 — {afterPods.length}개 파드</span>
            </div>

            <div className="flex justify-center">
              <div className="px-4 py-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg border border-slate-300 dark:border-slate-600 text-xs font-semibold text-slate-600 dark:text-slate-400">
                ⚖️ Service (Load Balancer)
              </div>
            </div>

            <div className="flex flex-wrap justify-center gap-2">
              <AnimatePresence>
                {afterPods.map((pod) => (
                  <PodIcon key={pod.id} status={pod.status} idx={pod.id} />
                ))}
              </AnimatePresence>
            </div>

            {phase === "healing" && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="text-center text-xs text-amber-600 dark:text-amber-400 font-medium bg-amber-50 dark:bg-amber-900/20 py-1.5 rounded-lg border border-amber-200 dark:border-amber-800">
                kubelet 감지 → 동일/다른 노드에 자동 재스케줄링 (수초 내)
              </motion.div>
            )}
            {phase === "scaled" && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="text-center text-xs text-blue-600 dark:text-blue-400 font-medium bg-blue-50 dark:bg-blue-900/20 py-1.5 rounded-lg border border-blue-200 dark:border-blue-800">
                HPA: CPU 70% 초과 → Pod 3개 → 5개 자동 스케일 아웃
              </motion.div>
            )}

            <div className="text-xs text-muted-foreground space-y-1">
              <div className="flex items-start gap-1.5"><span className="text-emerald-500">✓</span><span>Pod 장애 시 수초 내 자동 재스케줄링 — 무중단</span></div>
              <div className="flex items-start gap-1.5"><span className="text-emerald-500">✓</span><span>HPA로 트래픽 급증 시 Pod 자동 스케일 아웃</span></div>
              <div className="flex items-start gap-1.5"><span className="text-emerald-500">✓</span><span>Rolling Update로 무중단 배포</span></div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
