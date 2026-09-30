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

const actorSurface: Record<WorkflowAccent, string> = {
  blue: "border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-900/70 dark:bg-blue-950/35 dark:text-blue-200",
  cyan: "border-cyan-200 bg-cyan-50 text-cyan-800 dark:border-cyan-900/70 dark:bg-cyan-950/35 dark:text-cyan-200",
  violet: "border-violet-200 bg-violet-50 text-violet-800 dark:border-violet-900/70 dark:bg-violet-950/35 dark:text-violet-200",
  emerald: "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900/70 dark:bg-emerald-950/35 dark:text-emerald-200",
  amber: "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900/70 dark:bg-amber-950/35 dark:text-amber-200",
  rose: "border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-900/70 dark:bg-rose-950/35 dark:text-rose-200",
};

const actorSolid: Record<WorkflowAccent, string> = {
  blue: "bg-blue-500 dark:bg-blue-400",
  cyan: "bg-cyan-500 dark:bg-cyan-400",
  violet: "bg-violet-500 dark:bg-violet-400",
  emerald: "bg-emerald-500 dark:bg-emerald-400",
  amber: "bg-amber-500 dark:bg-amber-400",
  rose: "bg-rose-500 dark:bg-rose-400",
};

const actorRing: Record<WorkflowAccent, string> = {
  blue: "ring-blue-500/10 dark:ring-blue-400/10",
  cyan: "ring-cyan-500/10 dark:ring-cyan-400/10",
  violet: "ring-violet-500/10 dark:ring-violet-400/10",
  emerald: "ring-emerald-500/10 dark:ring-emerald-400/10",
  amber: "ring-amber-500/10 dark:ring-amber-400/10",
  rose: "ring-rose-500/10 dark:ring-rose-400/10",
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

function StepContextRail({
  spec,
  activeStep,
}: {
  spec: WorkflowVisualizationSpec;
  activeStep: number;
}) {
  const previous = spec.steps[activeStep - 1];
  const current = spec.steps[activeStep];
  const next = spec.steps[activeStep + 1];

  return (
    <div className="flex min-w-0 items-center gap-2 px-1 text-[10px] sm:text-[11px]">
      <div className="min-w-0 flex-1 truncate text-right text-muted-foreground">
        {previous ? previous.title : "START"}
      </div>
      <div className="h-px w-4 shrink-0 bg-border sm:w-8" />
      <div className="flex max-w-[52%] shrink-0 items-center gap-2 rounded-full bg-primary/10 px-3 py-1.5 font-semibold text-primary">
        <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
        <span className="truncate">{current.title}</span>
      </div>
      <div className="h-px w-4 shrink-0 bg-border sm:w-8" />
      <div className="min-w-0 flex-1 truncate text-muted-foreground">
        {next ? next.title : "DONE"}
      </div>
    </div>
  );
}

function FocusNode({
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
      key={`${actor.id}-${stepTitle}`}
      initial={{ opacity: 0, scale: 0.97, y: 8 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.28 }}
      className={`relative mx-auto flex min-h-[250px] w-full max-w-[320px] flex-col items-center justify-center overflow-hidden rounded-[28px] border bg-card px-6 py-7 text-center shadow-sm ring-8 ${actorSurface[accent]} ${actorRing[accent]}`}
    >
      <div className="absolute inset-4 rounded-[22px] border border-current/10" />
      <div className="relative mb-4 text-[10px] font-bold uppercase tracking-[0.2em] opacity-65">
        Focused state
      </div>

      <div className="relative mb-4 flex h-20 w-20 items-center justify-center rounded-full border border-current/20 bg-card/80">
        <motion.span
          className={`h-7 w-7 rounded-full ${actorSolid[accent]}`}
          animate={tone === "restrained" ? undefined : { scale: [1, 1.08, 1] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        />
        <span className="absolute inset-2 rounded-full border border-current/10" />
      </div>

      <div className="relative text-xl font-black tracking-tight">{actor.label}</div>
      {actor.detail && (
        <div className="relative mt-1 text-xs font-medium opacity-70">{actor.detail}</div>
      )}

      <div className="relative mt-5 w-full border-t border-current/10 pt-4 text-sm font-semibold leading-snug">
        {stepTitle}
      </div>
    </motion.div>
  );
}

function ParticipantCard({
  actor,
  order,
}: {
  actor: WorkflowActor;
  order: number;
}) {
  const accent = accentOf(actor);

  return (
    <div className={`min-w-0 rounded-xl border px-3 py-2.5 ${actorSurface[accent]}`}>
      <div className="flex items-center gap-2">
        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-card/80 text-[9px] font-black">
          {String(order).padStart(2, "0")}
        </span>
        <div className="min-w-0">
          <div className="truncate text-[11px] font-bold">{actor.label}</div>
          {actor.detail && <div className="truncate text-[9px] opacity-65">{actor.detail}</div>}
        </div>
      </div>
    </div>
  );
}

function SignalBeam({
  label,
  kind,
  reducedMotion,
  delay,
}: {
  label: string;
  kind: WorkflowTransition["kind"];
  reducedMotion: boolean;
  delay: number;
}) {
  const packetClass = transitionTone[kind ?? "request"];

  return (
    <div className="relative h-12 min-w-0 overflow-hidden">
      <div className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-border" />
      <div className="absolute right-0 top-1/2 -translate-y-1/2 border-y-[4px] border-l-[7px] border-y-transparent border-l-border" />
      <div className="absolute inset-x-1 top-1 flex justify-center">
        <span className="max-w-full truncate rounded-md bg-background/90 px-2 py-0.5 text-[9px] font-semibold text-muted-foreground backdrop-blur">
          {label}
        </span>
      </div>
      <motion.div
        className={`absolute top-1/2 h-3 w-3 -translate-y-1/2 rounded-full shadow-sm ${packetClass}`}
        initial={reducedMotion ? { left: "82%" } : { left: "4%", opacity: 0.55 }}
        animate={reducedMotion ? { left: "82%" } : { left: ["4%", "82%"], opacity: [0.55, 1, 0.8] }}
        transition={
          reducedMotion
            ? { duration: 0 }
            : { duration: 1.15, delay, repeat: Infinity, repeatDelay: 0.7, ease: "easeInOut" }
        }
      />
    </div>
  );
}

function IncomingSignal({
  actor,
  transition,
  order,
  reducedMotion,
}: {
  actor: WorkflowActor;
  transition: WorkflowTransition;
  order: number;
  reducedMotion: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.22, delay: order * 0.04 }}
      className="grid grid-cols-[minmax(92px,132px)_1fr] items-center gap-2"
    >
      <ParticipantCard actor={actor} order={order} />
      <SignalBeam
        label={transition.label}
        kind={transition.kind}
        reducedMotion={reducedMotion}
        delay={(order - 1) * 0.14}
      />
    </motion.div>
  );
}

function OutgoingSignal({
  actor,
  transition,
  order,
  reducedMotion,
}: {
  actor: WorkflowActor;
  transition: WorkflowTransition;
  order: number;
  reducedMotion: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.22, delay: order * 0.04 }}
      className="grid grid-cols-[1fr_minmax(92px,132px)] items-center gap-2"
    >
      <SignalBeam
        label={transition.label}
        kind={transition.kind}
        reducedMotion={reducedMotion}
        delay={(order - 1) * 0.14}
      />
      <ParticipantCard actor={actor} order={order} />
    </motion.div>
  );
}

function QuietSide({
  side,
}: {
  side: "incoming" | "outgoing";
}) {
  return (
    <div className="flex min-h-16 items-center justify-center rounded-xl border border-dashed border-border px-3 text-center text-[10px] leading-relaxed text-muted-foreground">
      {side === "incoming"
        ? "외부 신호보다 현재 내부 상태 확인이 먼저입니다."
        : "이 단계에서는 외부 전송 없이 상태가 다음 판단으로 이어집니다."}
    </div>
  );
}

function ContinuationFlow({
  transition,
  actorMap,
  order,
}: {
  transition: WorkflowTransition;
  actorMap: Record<string, WorkflowActor>;
  order: number;
}) {
  const from = actorMap[transition.from];
  const to = actorMap[transition.to];
  if (!from || !to) return null;

  return (
    <div className="grid grid-cols-[minmax(72px,120px)_1fr_minmax(72px,120px)] items-center gap-2 text-[10px]">
      <div className="truncate text-right font-semibold text-muted-foreground">{from.label}</div>
      <div className="flex min-w-0 items-center gap-2">
        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-muted text-[9px] font-bold text-muted-foreground">
          {String(order).padStart(2, "0")}
        </span>
        <div className="relative h-px min-w-0 flex-1 bg-border">
          <span className="absolute left-1/2 top-1/2 max-w-[90%] -translate-x-1/2 -translate-y-1/2 truncate rounded bg-card px-1.5 py-0.5 font-medium text-muted-foreground">
            {transition.label}
          </span>
        </div>
      </div>
      <div className="truncate font-semibold text-muted-foreground">{to.label}</div>
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

  const indexedTransitions = (step.transitions ?? []).map((transition, index) => ({
    transition,
    order: index + 1,
  }));

  const incoming = indexedTransitions.filter(
    ({ transition }) => transition.to === step.focusActorId && transition.from !== step.focusActorId,
  );
  const outgoing = indexedTransitions.filter(
    ({ transition }) => transition.from === step.focusActorId && transition.to !== step.focusActorId,
  );
  const continuations = indexedTransitions.filter(
    ({ transition }) => transition.from !== step.focusActorId && transition.to !== step.focusActorId,
  );

  return (
    <section className="overflow-hidden rounded-2xl border border-border bg-gradient-to-b from-muted/15 via-card to-muted/20">
      <div className="border-b border-border bg-card/75 px-4 py-3">
        <StepContextRail spec={spec} activeStep={activeStep} />
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeStep}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="px-4 py-5 sm:px-6 sm:py-7"
        >
          <div className="mx-auto mb-6 max-w-2xl text-center text-sm font-medium leading-relaxed text-foreground">
            {step.summary}
          </div>

          <div className="grid items-center gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(260px,320px)_minmax(0,1fr)]">
            <div className="space-y-3">
              <div className="text-[9px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
                Incoming cause
              </div>
              {incoming.length > 0 ? (
                incoming.map(({ transition, order }) => {
                  const actor = actorMap[transition.from];
                  return actor ? (
                    <IncomingSignal
                      key={`in-${order}-${transition.from}`}
                      actor={actor}
                      transition={transition}
                      order={order}
                      reducedMotion={reducedMotion}
                    />
                  ) : null;
                })
              ) : (
                <QuietSide side="incoming" />
              )}
            </div>

            <FocusNode actor={focusActor} stepTitle={step.title} tone={tone} />

            <div className="space-y-3">
              <div className="text-right text-[9px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
                Result / next effect
              </div>
              {outgoing.length > 0 ? (
                outgoing.map(({ transition, order }) => {
                  const actor = actorMap[transition.to];
                  return actor ? (
                    <OutgoingSignal
                      key={`out-${order}-${transition.to}`}
                      actor={actor}
                      transition={transition}
                      order={order}
                      reducedMotion={reducedMotion}
                    />
                  ) : null;
                })
              ) : (
                <QuietSide side="outgoing" />
              )}
            </div>
          </div>

          {continuations.length > 0 && (
            <div className="mx-auto mt-6 max-w-2xl rounded-xl border border-border bg-card/75 p-3">
              <div className="mb-2 text-[9px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
                Continuation after focus
              </div>
              <div className="space-y-2">
                {continuations.map(({ transition, order }) => (
                  <ContinuationFlow
                    key={`continuation-${order}-${transition.from}-${transition.to}`}
                    transition={transition}
                    actorMap={actorMap}
                    order={order}
                  />
                ))}
              </div>
            </div>
          )}

          {tone === "playful" && step.playfulHint && (
            <div className="mx-auto mt-4 max-w-xl text-center text-[11px] text-muted-foreground">
              {step.playfulHint}
            </div>
          )}
        </motion.div>
      </AnimatePresence>
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

      <FocusedStateStage spec={spec} activeStep={safeStep} />
      <StepWaterfall spec={spec} activeStep={safeStep} />
    </div>
  );
}
