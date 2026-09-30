import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Pause, Play, RotateCcw, SkipBack, SkipForward } from "lucide-react";
import {
  clampWorkflowSpan,
  resolveWorkflowMotionTone,
  type WorkflowAccent,
  type WorkflowActor,
  type WorkflowTransition,
  type WorkflowVisualizationSpec,
  type WorkflowWaterfallSpan,
} from "./workflow-visualization";

const actorAccent: Record<WorkflowAccent, string> = {
  blue: "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900/60 dark:bg-blue-950/35 dark:text-blue-300",
  cyan: "border-cyan-200 bg-cyan-50 text-cyan-700 dark:border-cyan-900/60 dark:bg-cyan-950/35 dark:text-cyan-300",
  violet: "border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-900/60 dark:bg-violet-950/35 dark:text-violet-300",
  emerald: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/35 dark:text-emerald-300",
  amber: "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/60 dark:bg-amber-950/35 dark:text-amber-300",
  rose: "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/35 dark:text-rose-300",
};

const actorDot: Record<WorkflowAccent, string> = {
  blue: "bg-blue-500 dark:bg-blue-400",
  cyan: "bg-cyan-500 dark:bg-cyan-400",
  violet: "bg-violet-500 dark:bg-violet-400",
  emerald: "bg-emerald-500 dark:bg-emerald-400",
  amber: "bg-amber-500 dark:bg-amber-400",
  rose: "bg-rose-500 dark:bg-rose-400",
};

const spanTone: Record<NonNullable<WorkflowWaterfallSpan["tone"]>, string> = {
  primary: "bg-blue-500 dark:bg-blue-400",
  secondary: "bg-violet-500 dark:bg-violet-400",
  success: "bg-emerald-500 dark:bg-emerald-400",
  warning: "bg-amber-500 dark:bg-amber-400",
  danger: "bg-rose-500 dark:bg-rose-400",
};

const transitionTone: Record<NonNullable<WorkflowTransition["kind"]>, string> = {
  request: "bg-blue-500 dark:bg-blue-400",
  response: "bg-emerald-500 dark:bg-emerald-400",
  event: "bg-violet-500 dark:bg-violet-400",
  state: "bg-amber-500 dark:bg-amber-400",
};

function accentOf(actor: WorkflowActor): WorkflowAccent {
  return actor.accent ?? "blue";
}

function MinimalPlaybackBar({
  activeStep,
  totalSteps,
  isPlaying,
  onReset,
  onPrevious,
  onTogglePlay,
  onNext,
}: {
  activeStep: number;
  totalSteps: number;
  isPlaying: boolean;
  onReset: () => void;
  onPrevious: () => void;
  onTogglePlay: () => void;
  onNext: () => void;
}) {
  const progress = totalSteps <= 1 ? 100 : (activeStep / (totalSteps - 1)) * 100;

  return (
    <div className="flex h-11 items-center gap-3 rounded-xl border border-border bg-card px-3 shadow-sm">
      <div className="flex items-center gap-0.5">
        <button type="button" onClick={onReset} title="처음부터" className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
          <RotateCcw size={15} />
        </button>
        <button type="button" onClick={onPrevious} disabled={activeStep === 0} title="이전 단계" className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-30">
          <SkipBack size={15} />
        </button>
        <button type="button" onClick={onTogglePlay} title={isPlaying ? "일시정지" : "재생"} className="rounded-md p-1.5 text-primary transition-colors hover:bg-primary/10">
          {isPlaying ? <Pause size={17} fill="currentColor" /> : <Play size={17} fill="currentColor" />}
        </button>
        <button type="button" onClick={onNext} disabled={activeStep === totalSteps - 1} title="다음 단계" className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-30">
          <SkipForward size={15} />
        </button>
      </div>

      <div className="relative h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
        <motion.div
          className="absolute inset-y-0 left-0 rounded-full bg-primary"
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.22 }}
        />
      </div>

      <span className="min-w-[46px] text-right text-[11px] font-semibold text-muted-foreground">
        {activeStep + 1}/{totalSteps}
      </span>
    </div>
  );
}

function ActorChip({
  actor,
  active,
}: {
  actor: WorkflowActor;
  active: boolean;
}) {
  const accent = accentOf(actor);

  return (
    <div
      className={
        active
          ? `flex min-w-0 items-center gap-2 rounded-lg border px-2.5 py-2 text-xs font-semibold ${actorAccent[accent]}`
          : "flex min-w-0 items-center gap-2 rounded-lg border border-border bg-card px-2.5 py-2 text-xs font-medium text-muted-foreground"
      }
    >
      <span className={`h-2 w-2 shrink-0 rounded-full ${active ? actorDot[accent] : "bg-muted-foreground/35"}`} />
      <span className="truncate">{actor.label}</span>
    </div>
  );
}

function FocusCard({
  actor,
  stepTitle,
  tone,
}: {
  actor: WorkflowActor;
  stepTitle: string;
  tone: ReturnType<typeof resolveWorkflowMotionTone>;
}) {
  const accent = accentOf(actor);

  return (
    <motion.div
      key={actor.id}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.24 }}
      className="mx-auto w-full max-w-sm rounded-2xl border border-border bg-card p-5 text-center shadow-sm"
    >
      <div className="mb-3 text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
        Focused state
      </div>
      <div className={`mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl border ${actorAccent[accent]}`}>
        <span className={`h-4 w-4 rounded-full ${actorDot[accent]}`} />
      </div>
      <div className="text-lg font-bold text-foreground">{actor.label}</div>
      {actor.detail && <div className="mt-1 text-sm text-muted-foreground">{actor.detail}</div>}
      <div className="mt-4 rounded-lg bg-muted/60 px-3 py-2 text-xs font-medium text-foreground">
        {stepTitle}
      </div>
      {tone === "playful" && (
        <motion.div
          aria-hidden="true"
          className="mx-auto mt-3 h-1.5 w-16 rounded-full bg-primary/25"
          animate={{ scaleX: [0.75, 1, 0.75] }}
          transition={{ duration: 1.8, repeat: Infinity }}
        />
      )}
    </motion.div>
  );
}

function TransitionLane({
  transition,
  actorMap,
  tone,
  reducedMotion,
  index,
}: {
  transition: WorkflowTransition;
  actorMap: Record<string, WorkflowActor>;
  tone: ReturnType<typeof resolveWorkflowMotionTone>;
  reducedMotion: boolean;
  index: number;
}) {
  const from = actorMap[transition.from];
  const to = actorMap[transition.to];
  if (!from || !to) return null;

  const packetClass = transitionTone[transition.kind ?? "request"];

  return (
    <div className="grid grid-cols-[minmax(76px,120px)_1fr_minmax(76px,120px)] items-center gap-2">
      <div className="truncate text-right text-[11px] font-semibold text-muted-foreground" title={from.label}>
        {from.label}
      </div>

      <div className="relative h-9 overflow-hidden rounded-lg border border-border bg-muted/35">
        <div className="absolute inset-x-3 top-1/2 h-px -translate-y-1/2 bg-border" />
        <div className="absolute inset-0 flex items-center justify-center px-8">
          <span className="max-w-full truncate rounded-md bg-card px-2 py-1 text-[10px] font-semibold text-foreground shadow-sm">
            {transition.label}
          </span>
        </div>
        <motion.div
          className={`absolute top-1/2 h-3 w-3 -translate-y-1/2 rounded-full ${packetClass}`}
          initial={reducedMotion ? { left: "86%" } : { left: "4%", opacity: 0.65 }}
          animate={reducedMotion ? { left: "86%" } : { left: ["4%", "86%"], opacity: [0.65, 1, 0.85] }}
          transition={
            reducedMotion
              ? { duration: 0 }
              : { duration: 1.25, delay: index * 0.14, repeat: Infinity, repeatDelay: 0.45, ease: "easeInOut" }
          }
        >
          {tone === "playful" && (
            <>
              <span className="absolute left-[2px] top-[3px] h-0.5 w-0.5 rounded-full bg-white" />
              <span className="absolute right-[2px] top-[3px] h-0.5 w-0.5 rounded-full bg-white" />
            </>
          )}
        </motion.div>
      </div>

      <div className="truncate text-[11px] font-semibold text-muted-foreground" title={to.label}>
        {to.label}
      </div>
    </div>
  );
}

function FocusedStateStage({
  spec,
  activeStep,
}: {
  spec: WorkflowVisualizationSpec;
  activeStep: number;
}) {
  const reducedMotion = useReducedMotion() ?? false;
  const tone = resolveWorkflowMotionTone(spec);
  const step = spec.steps[activeStep];
  const actorMap = useMemo(
    () => Object.fromEntries(spec.actors.map((actor) => [actor.id, actor])),
    [spec.actors],
  );
  const focusActor = actorMap[step.focusActorId] ?? spec.actors[0];

  return (
    <section className="overflow-hidden rounded-2xl border border-border bg-muted/20">
      <div className="border-b border-border bg-card/70 p-3">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {spec.actors.map((actor) => (
            <ActorChip key={actor.id} actor={actor} active={actor.id === step.focusActorId} />
          ))}
        </div>
      </div>

      <div className="space-y-5 p-4 sm:p-6">
        <FocusCard actor={focusActor} stepTitle={step.title} tone={tone} />

        <AnimatePresence mode="wait">
          <motion.div
            key={activeStep}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="mx-auto w-full max-w-2xl space-y-2"
          >
            {(step.transitions ?? []).length > 0 ? (
              step.transitions?.map((transition, index) => (
                <TransitionLane
                  key={`${transition.from}-${transition.to}-${index}`}
                  transition={transition}
                  actorMap={actorMap}
                  tone={tone}
                  reducedMotion={reducedMotion}
                  index={index}
                />
              ))
            ) : (
              <div className="rounded-lg border border-dashed border-border bg-card/60 px-4 py-3 text-center text-xs text-muted-foreground">
                이 단계는 외부 통신보다 현재 상태 확인이 핵심입니다.
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {tone === "playful" && step.playfulHint && (
          <div className="text-center text-[11px] text-muted-foreground">{step.playfulHint}</div>
        )}
      </div>
    </section>
  );
}

function StepWaterfall({
  spec,
  activeStep,
}: {
  spec: WorkflowVisualizationSpec;
  activeStep: number;
}) {
  const reducedMotion = useReducedMotion() ?? false;
  const step = spec.steps[activeStep];

  return (
    <section className="rounded-2xl border border-border bg-card p-4 shadow-sm">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
        <div>
          <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
            {spec.waterfallLabel ?? "Step detail · relative waterfall"}
          </div>
          <div className="mt-1 text-sm font-bold text-foreground">{step.title}</div>
        </div>
        <div className="text-[10px] text-muted-foreground">상대적 실행 순서 · 정밀 벤치마크 아님</div>
      </div>

      <div className="grid grid-cols-[minmax(92px,150px)_1fr] items-center gap-x-3 gap-y-2">
        <div />
        <div className="grid grid-cols-5 text-[9px] text-muted-foreground">
          <span>0</span>
          <span>25</span>
          <span>50</span>
          <span>75</span>
          <span className="text-right">100</span>
        </div>

        {step.spans.map((span, index) => {
          const start = clampWorkflowSpan(span.start);
          const end = Math.max(start, clampWorkflowSpan(span.end));
          const width = Math.max((end - start) * 100, 2);

          return (
            <div key={`${activeStep}-${span.label}-${index}`} className="contents">
              <div className="truncate text-[11px] font-medium text-muted-foreground" title={span.label}>
                {span.label}
              </div>
              <div className="relative h-7 overflow-hidden rounded-md border border-border bg-muted/45">
                <motion.div
                  className={`absolute inset-y-0 rounded-md ${spanTone[span.tone ?? "primary"]}`}
                  style={{ left: `${start * 100}%`, width: `${width}%`, transformOrigin: "left center" }}
                  initial={reducedMotion ? undefined : { scaleX: 0, opacity: 0.55 }}
                  animate={{ scaleX: 1, opacity: 1 }}
                  transition={{ duration: reducedMotion ? 0 : 0.32, delay: index * 0.05 }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

export default function WorkflowFocusedViz({
  spec,
}: {
  spec: WorkflowVisualizationSpec;
}) {
  const [activeStep, setActiveStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const reducedMotion = useReducedMotion() ?? false;
  const totalSteps = spec.steps.length;

  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current);

    if (!isPlaying || reducedMotion || totalSteps <= 1) return;

    timerRef.current = setInterval(() => {
      setActiveStep((previous) => (previous >= totalSteps - 1 ? 0 : previous + 1));
    }, spec.autoplayMs ?? 3600);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, reducedMotion, spec.autoplayMs, totalSteps]);

  if (totalSteps === 0) {
    return (
      <div className="rounded-xl border border-border bg-muted/30 p-6 text-center text-sm text-muted-foreground">
        표시할 워크플로우 단계가 없습니다.
      </div>
    );
  }

  const safeStep = Math.min(activeStep, totalSteps - 1);

  return (
    <div className="flex w-full flex-col gap-3">
      <MinimalPlaybackBar
        activeStep={safeStep}
        totalSteps={totalSteps}
        isPlaying={isPlaying && !reducedMotion}
        onReset={() => {
          setActiveStep(0);
          setIsPlaying(false);
        }}
        onPrevious={() => {
          setActiveStep((previous) => Math.max(previous - 1, 0));
          setIsPlaying(false);
        }}
        onTogglePlay={() => setIsPlaying((value) => !value)}
        onNext={() => {
          setActiveStep((previous) => Math.min(previous + 1, totalSteps - 1));
          setIsPlaying(false);
        }}
      />

      <div className="px-2 text-center text-sm font-medium text-foreground">
        {spec.steps[safeStep].summary}
      </div>

      <FocusedStateStage spec={spec} activeStep={safeStep} />
      <StepWaterfall spec={spec} activeStep={safeStep} />
    </div>
  );
}
