import { useEffect, useMemo, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Pause, Play, RotateCcw, SkipBack, SkipForward } from "lucide-react";
import {
  clampWorkflowSpan,
  resolveWorkflowMotionTone,
  type WorkflowActor,
  type WorkflowTransition,
  type WorkflowVisualizationSpec,
  type WorkflowWaterfallSpan,
} from "./workflow-visualization";

const actorAccent: Record<string, string> = {
  blue: "stroke-blue-500 dark:stroke-blue-400",
  cyan: "stroke-cyan-500 dark:stroke-cyan-400",
  violet: "stroke-violet-500 dark:stroke-violet-400",
  emerald: "stroke-emerald-500 dark:stroke-emerald-400",
  amber: "stroke-amber-500 dark:stroke-amber-400",
  rose: "stroke-rose-500 dark:stroke-rose-400",
};

const spanTone: Record<NonNullable<WorkflowWaterfallSpan["tone"]>, string> = {
  primary: "bg-blue-500 dark:bg-blue-400",
  secondary: "bg-violet-500 dark:bg-violet-400",
  success: "bg-emerald-500 dark:bg-emerald-400",
  warning: "bg-amber-500 dark:bg-amber-400",
  danger: "bg-rose-500 dark:bg-rose-400",
};

function actorStroke(actor: WorkflowActor) {
  if (!actor.accentClass) return actorAccent.blue;
  return actorAccent[actor.accentClass] ?? actor.accentClass;
}

function transitionTone(kind: WorkflowTransition["kind"]) {
  if (kind === "response") return "text-emerald-500 dark:text-emerald-400";
  if (kind === "event") return "text-violet-500 dark:text-violet-400";
  if (kind === "state") return "text-amber-500 dark:text-amber-400";
  return "text-blue-500 dark:text-blue-400";
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
    <div className="flex h-12 items-center gap-4 rounded-xl border border-slate-200 bg-white px-4 py-2 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex items-center gap-1">
        <button type="button" onClick={onReset} title="처음부터" className="p-1.5 text-slate-500 transition-colors hover:text-slate-900 dark:text-zinc-400 dark:hover:text-zinc-100">
          <RotateCcw size={16} />
        </button>
        <button type="button" onClick={onPrevious} disabled={activeStep === 0} title="이전 단계" className="p-1.5 text-slate-500 transition-colors hover:text-slate-900 disabled:opacity-30 dark:text-zinc-400 dark:hover:text-zinc-100">
          <SkipBack size={16} />
        </button>
        <button type="button" onClick={onTogglePlay} title={isPlaying ? "일시정지" : "재생"} className="p-1.5 text-blue-600 transition-colors hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300">
          {isPlaying ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" />}
        </button>
        <button type="button" onClick={onNext} disabled={activeStep === totalSteps - 1} title="다음 단계" className="p-1.5 text-slate-500 transition-colors hover:text-slate-900 disabled:opacity-30 dark:text-zinc-400 dark:hover:text-zinc-100">
          <SkipForward size={16} />
        </button>
      </div>

      <div className="relative h-2 flex-1 overflow-hidden rounded-full bg-slate-100 dark:bg-zinc-800">
        <motion.div
          className="absolute inset-y-0 left-0 rounded-full bg-blue-500 dark:bg-blue-400"
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.25 }}
        />
      </div>

      <div className="min-w-[56px] text-right text-xs font-bold text-slate-500 dark:text-zinc-400">
        {activeStep + 1} / {totalSteps}
      </div>
    </div>
  );
}

function FocusedActor({
  actor,
  focused,
}: {
  actor: WorkflowActor;
  focused: boolean;
}) {
  const radius = focused ? 76 : 48;

  return (
    <motion.g
      animate={{ opacity: focused ? 1 : 0.72, scale: focused ? 1 : 0.96 }}
      transition={{ duration: 0.25 }}
      style={{ transformOrigin: `${actor.x}px ${actor.y}px` }}
    >
      {focused && (
        <circle
          cx={actor.x}
          cy={actor.y}
          r={96}
          className="fill-blue-100/50 dark:fill-blue-950/25"
        />
      )}
      <circle
        cx={actor.x}
        cy={actor.y}
        r={radius}
        className={`fill-white dark:fill-zinc-900 ${actorStroke(actor)}`}
        strokeWidth={focused ? 4 : 2}
      />
      <circle
        cx={actor.x}
        cy={actor.y - (focused ? 22 : 16)}
        r={focused ? 14 : 10}
        className="fill-slate-700 dark:fill-zinc-200"
      />
      <text
        x={actor.x}
        y={actor.y + (focused ? 17 : 12)}
        textAnchor="middle"
        className={focused ? "fill-slate-900 text-[18px] font-bold dark:fill-zinc-100" : "fill-slate-800 text-[12px] font-bold dark:fill-zinc-200"}
      >
        {actor.label}
      </text>
      {actor.detail && (
        <text
          x={actor.x}
          y={actor.y + (focused ? 42 : 31)}
          textAnchor="middle"
          className={focused ? "fill-slate-500 text-[12px] dark:fill-zinc-400" : "fill-slate-400 text-[9px] dark:fill-zinc-500"}
        >
          {actor.detail}
        </text>
      )}
    </motion.g>
  );
}

function MovingPacket({
  from,
  to,
  tone,
  reducedMotion,
  delay,
}: {
  from: WorkflowActor;
  to: WorkflowActor;
  tone: string;
  reducedMotion: boolean;
  delay: number;
}) {
  const playful = tone === "playful";

  if (reducedMotion) {
    return (
      <g>
        <circle cx={to.x} cy={to.y} r={playful ? 11 : 8} className="fill-amber-400" />
        {playful && (
          <>
            <circle cx={to.x - 3} cy={to.y - 2} r={1.2} fill="white" />
            <circle cx={to.x + 3} cy={to.y - 2} r={1.2} fill="white" />
          </>
        )}
      </g>
    );
  }

  return (
    <motion.g
      initial={{ x: from.x, y: from.y, opacity: 0 }}
      animate={{ x: to.x, y: to.y, opacity: [0, 1, 1, 0.85] }}
      transition={{ duration: 1.15, delay, repeat: Infinity, repeatDelay: 0.55, ease: "easeInOut" }}
    >
      <circle cx={0} cy={0} r={playful ? 12 : 9} className="fill-amber-400" />
      {playful && (
        <>
          <circle cx={-4} cy={-2} r={1.5} fill="white" />
          <circle cx={4} cy={-2} r={1.5} fill="white" />
          <path d="M -4 4 Q 0 8 4 4" stroke="white" strokeWidth="1.5" fill="none" strokeLinecap="round" />
        </>
      )}
    </motion.g>
  );
}

function FocusedStateCanvas({
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

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-slate-50 shadow-inner dark:border-zinc-800 dark:bg-zinc-950">
      <svg viewBox="0 0 800 390" className="h-auto w-full" role="img" aria-label={`${spec.title}: ${step.title}`}>
        <text x="36" y="42" className="fill-slate-400 text-[10px] font-bold tracking-wider dark:fill-zinc-500">
          FOCUSED STATE
        </text>
        <text x="36" y="73" className="fill-slate-900 text-[19px] font-bold dark:fill-zinc-100">
          {step.title}
        </text>
        <text x="36" y="98" className="fill-slate-500 text-[11px] dark:fill-zinc-400">
          {step.summary}
        </text>

        {spec.actors.map((actor) => {
          const focused = actor.id === step.focusActorId;
          const focus = actorMap[step.focusActorId];

          return (
            <g key={actor.id}>
              {!focused && focus && (
                <line
                  x1={focus.x}
                  y1={focus.y}
                  x2={actor.x}
                  y2={actor.y}
                  strokeDasharray="4 7"
                  className="stroke-slate-200 dark:stroke-zinc-800"
                  strokeWidth="1.5"
                />
              )}
              <FocusedActor actor={actor} focused={focused} />
            </g>
          );
        })}

        {(step.transitions ?? []).map((transition, index) => {
          const from = actorMap[transition.from];
          const to = actorMap[transition.to];
          if (!from || !to) return null;
          const textX = (from.x + to.x) / 2;
          const textY = (from.y + to.y) / 2 - 10;
          const toneClass = transitionTone(transition.kind);

          return (
            <g key={`${activeStep}-${transition.from}-${transition.to}-${index}`} className={toneClass}>
              <motion.line
                x1={from.x}
                y1={from.y}
                x2={to.x}
                y2={to.y}
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                initial={reducedMotion ? undefined : { pathLength: 0, opacity: 0.3 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{ duration: reducedMotion ? 0 : 0.45, delay: index * 0.18 }}
              />
              <text x={textX} y={textY} textAnchor="middle" fill="currentColor" className="text-[9px] font-bold">
                {transition.label}
              </text>
              <MovingPacket
                from={from}
                to={to}
                tone={tone}
                reducedMotion={reducedMotion}
                delay={index * 0.28}
              />
            </g>
          );
        })}

        {tone === "playful" && step.playfulHint && (
          <text x="36" y="365" className="fill-slate-400 text-[9px] dark:fill-zinc-500">
            {step.playfulHint}
          </text>
        )}
      </svg>
    </div>
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
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
        <div>
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
            {spec.waterfallLabel ?? "Step detail · relative waterfall"}
          </div>
          <div className="mt-1 text-sm font-bold text-slate-900 dark:text-zinc-100">
            {step.title}
          </div>
        </div>
        <div className="text-[11px] text-slate-400 dark:text-zinc-500">상대 실행 순서 · 정밀 벤치마크가 아님</div>
      </div>

      <div className="grid grid-cols-[minmax(92px,150px)_1fr] items-center gap-x-3 gap-y-2">
        <div />
        <div className="grid grid-cols-5 text-[9px] text-slate-400 dark:text-zinc-500">
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
              <div className="truncate text-[11px] font-medium text-slate-600 dark:text-zinc-300" title={span.label}>
                {span.label}
              </div>
              <div className="relative h-7 overflow-hidden rounded-md border border-slate-200 bg-slate-100 dark:border-zinc-800 dark:bg-zinc-950">
                <motion.div
                  className={`absolute inset-y-0 rounded-md ${spanTone[span.tone ?? "primary"]}`}
                  style={{ left: `${start * 100}%`, width: `${width}%`, transformOrigin: "left center" }}
                  initial={reducedMotion ? undefined : { scaleX: 0, opacity: 0.5 }}
                  animate={{ scaleX: 1, opacity: 1 }}
                  transition={{ duration: reducedMotion ? 0 : 0.35, delay: index * 0.06 }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
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

    if (!isPlaying || reducedMotion || totalSteps <= 1) {
      return;
    }

    timerRef.current = setInterval(() => {
      setActiveStep((previous) => (previous >= totalSteps - 1 ? 0 : previous + 1));
    }, spec.autoplayMs ?? 3600);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, reducedMotion, spec.autoplayMs, totalSteps]);

  if (totalSteps === 0) {
    return (
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-400">
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

      <div className="px-2 text-center text-sm font-medium text-slate-700 dark:text-zinc-300">
        {spec.steps[safeStep].summary}
      </div>

      <FocusedStateCanvas spec={spec} activeStep={safeStep} />
      <StepWaterfall spec={spec} activeStep={safeStep} />
    </div>
  );
}
