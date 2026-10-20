import { useEffect, useId, useMemo, useRef, useState, type ComponentType } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Pause, Play } from "lucide-react";
import {
  clampWorkflowSpan,
  resolveWorkflowMotionTone,
  validateWorkflowSpec,
  type WorkflowAccent,
  type WorkflowActor,
  type WorkflowSpanKind,
  type WorkflowTransition,
  type WorkflowTransitionKind,
  type WorkflowVisualizationSpec,
  type WorkflowWaterfallSpan,
} from "./workflow-visualization";

const accentStroke: Record<WorkflowAccent, string> = {
  blue: "#3b82f6",
  cyan: "#06b6d4",
  violet: "#8b5cf6",
  emerald: "#10b981",
  amber: "#f59e0b",
  rose: "#f43f5e",
};

const spanTone: Record<NonNullable<WorkflowWaterfallSpan["tone"]>, string> = {
  primary: "bg-blue-500 dark:bg-blue-400",
  secondary: "bg-violet-500 dark:bg-violet-400",
  success: "bg-emerald-500 dark:bg-emerald-400",
  warning: "bg-amber-500 dark:bg-amber-400",
  danger: "bg-rose-500 dark:bg-rose-400",
};

const transitionColor: Record<WorkflowTransitionKind, string> = {
  request: "#3b82f6",
  response: "#10b981",
  event: "#8b5cf6",
  state: "#f59e0b",
};

const packetGlyph: Record<WorkflowTransitionKind, string> = {
  request: "Q",
  response: "R",
  event: "E",
  state: "Δ",
};

const spanKindLabel: Record<WorkflowSpanKind, string> = {
  work: "실행",
  network: "호출",
  wait: "대기",
};

const spanStatusLabel = {
  success: "성공",
  warning: "주의",
  error: "오류",
} as const;

const accentOf = (actor: WorkflowActor): WorkflowAccent => actor.accent ?? "blue";

interface ControlsProps {
  frame: number;
  totalSteps: number;
  playing: boolean;
  reducedMotion: boolean;
  onToggle: () => void;
}

function Controls({
  frame,
  totalSteps,
  playing,
  reducedMotion,
  onToggle,
}: ControlsProps) {
  const progress = totalSteps === 0 ? 0 : (frame / totalSteps) * 100;
  const frameLabel = frame === 0 ? "전체" : `${frame}/${totalSteps}`;

  return (
    <div className="flex h-11 items-center gap-3 rounded-xl border border-border bg-card px-3 shadow-sm">
      <div className="flex items-center gap-0.5">
        <button
          type="button"
          onClick={onToggle}
          title={playing ? "일시정지" : "재생"}
          aria-label={playing ? "일시정지" : "재생"}
          className="rounded-md p-1.5 text-primary transition-colors hover:bg-muted"
        >
          {playing ? <Pause size={17} fill="currentColor" aria-hidden="true" /> : <Play size={17} fill="currentColor" aria-hidden="true" />}
        </button>
      </div>

      <div
        className="relative h-1.5 flex-1 overflow-hidden rounded-full bg-muted"
        role="progressbar"
        aria-label="워크플로우 진행률"
        aria-valuemin={0}
        aria-valuemax={totalSteps}
        aria-valuenow={frame}
      >
        <motion.div
          className="absolute inset-y-0 left-0 rounded-full bg-primary"
          animate={{ width: `${progress}%` }}
          transition={{ duration: reducedMotion ? 0 : 0.22 }}
        />
      </div>
      <span className="min-w-[46px] text-right text-[11px] font-semibold text-muted-foreground">
        {frameLabel}
      </span>
    </div>
  );
}

function PacketMarker({ transition, color }: { transition: WorkflowTransition; color: string }) {
  const kind = transition.kind ?? "request";
  const glyph = (transition.payload ?? packetGlyph[kind]).slice(0, 3);

  if (kind === "event") {
    return (
      <g>
        <rect x="-9" y="-9" width="18" height="18" rx="3" fill={color} transform="rotate(45)" />
        <text y="3" textAnchor="middle" fill="white" fontSize="8" fontWeight="800">{glyph}</text>
      </g>
    );
  }

  if (kind === "state") {
    return (
      <g>
        <rect x="-12" y="-8" width="24" height="16" rx="4" fill={color} />
        <text y="3" textAnchor="middle" fill="white" fontSize="8" fontWeight="800">{glyph}</text>
      </g>
    );
  }

  return (
    <g>
      <circle r="10" fill={color} />
      <circle r="7.5" fill="none" stroke="white" strokeOpacity=".55" />
      <text y="3" textAnchor="middle" fill="white" fontSize="8" fontWeight="800">{glyph}</text>
    </g>
  );
}

export interface WorkflowTopologyCanvasProps {
  spec: WorkflowVisualizationSpec;
  stepIndex: number | null;
  playing: boolean;
}

function TopologyScene({
  spec,
  stepIndex,
  playing,
  Canvas,
}: WorkflowTopologyCanvasProps & {
  Canvas?: ComponentType<WorkflowTopologyCanvasProps>;
}) {
  const reducedMotion = useReducedMotion() ?? false;
  const markerId = `workflow-arrow-${useId().replace(/:/g, "")}`;
  const step = stepIndex === null ? null : spec.steps[stepIndex];
  const overview = step === null;
  const activeActorIds = new Set(step?.activeActorIds ?? []);
  const actorMap = useMemo(
    () => Object.fromEntries(spec.actors.map((actor) => [actor.id, actor])),
    [spec.actors],
  );
  const tone = resolveWorkflowMotionTone(spec);
  const [compact, setCompact] = useState(false);
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (playing) svgRef.current?.unpauseAnimations();
    else svgRef.current?.pauseAnimations();
  }, [playing, stepIndex]);

  useEffect(() => {
    const media = window.matchMedia("(max-width: 640px)");
    const sync = () => setCompact(media.matches);
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

  const width = compact ? 460 : 1000;
  const height = compact ? 500 : 430;
  const point = (actor: WorkflowActor) => compact
    ? {
        x: 34 + ((actor.compactX ?? actor.x) / 100) * (width - 68),
        y: 24 + ((actor.compactY ?? actor.y) / 100) * (height - 48),
      }
    : { x: (actor.x / 100) * width, y: (actor.y / 100) * height };

  return (
    <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
      <div className="border-b border-border px-4 py-3">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
              Packet topology · Focused state
            </div>
            <h3 className="mt-1 text-sm font-bold text-foreground">{spec.title}</h3>
          </div>
          <span className="rounded-full border border-border bg-muted/60 px-2.5 py-1 text-[10px] font-semibold text-muted-foreground">
            {overview ? "전체 구조" : `${(stepIndex ?? 0) + 1}단계`}
          </span>
        </div>
        <div className="mt-2 text-xs font-semibold text-foreground">
          {overview ? "전체 토폴로지 살펴보기" : step.title}
        </div>
        <p className="mt-1 min-h-20 text-xs leading-relaxed text-muted-foreground sm:min-h-12">
          {overview
            ? spec.overviewSummary ?? "전체 참여자와 기본 연결을 먼저 확인합니다. 재생하면 같은 구조 안에서 현재 경로만 단계별로 강조됩니다."
            : step.summary}
        </p>
      </div>

      {Canvas ? <Canvas spec={spec} stepIndex={stepIndex} playing={playing} /> : <div className="relative bg-background">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${width} ${height}`}
          className="block min-h-[330px] w-full"
          role="img"
          aria-label={overview ? `${spec.title} 전체 토폴로지` : `${spec.title}: ${step.title}`}
        >
          <defs>
            <marker id={markerId} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="10" markerHeight="10" markerUnits="userSpaceOnUse" orient="auto-start-reverse">
              <path d="M 0 0 L 10 5 L 0 10 z" fill="context-stroke" />
            </marker>
          </defs>

          {(spec.topologyLinks ?? []).map((link, index) => {
            const from = actorMap[link.from];
            const to = actorMap[link.to];
            const start = point(from);
            const end = point(to);
            const labelX = (start.x + end.x) / 2;
            const labelY = (start.y + end.y) / 2 - 7;

            return (
              <g key={`base-${index}-${link.from}-${link.to}`}>
                <line
                  x1={start.x}
                  y1={start.y}
                  x2={end.x}
                  y2={end.y}
                  className="stroke-border"
                  strokeWidth={overview ? 3 : 2.5}
                  strokeDasharray="5 7"
                  opacity={overview ? 1 : 0.72}
                />
                {link.label && (
                  <text x={labelX} y={labelY} textAnchor="middle" className="fill-muted-foreground text-[9px] font-medium">
                    {link.label}
                  </text>
                )}
              </g>
            );
          })}

          {spec.actors.map((actor) => {
            const actorPoint = point(actor);
            const active = activeActorIds.has(actor.id);
            const opacity = overview || active ? 1 : 0.42;
            const radius = active ? 47 : overview ? 39 : 35;
            const stroke = overview || active ? accentStroke[accentOf(actor)] : undefined;

            return (
              <g key={actor.id} opacity={opacity}>
                <circle
                  cx={actorPoint.x}
                  cy={actorPoint.y}
                  r={radius}
                  className="fill-card stroke-border"
                  stroke={stroke}
                  strokeWidth={active ? 4 : overview ? 2.5 : 2}
                />
                {active && (
                  <motion.circle
                    cx={actorPoint.x}
                    cy={actorPoint.y}
                    r={56}
                    fill="none"
                    stroke={accentStroke[accentOf(actor)]}
                    strokeWidth="2"
                    initial={false}
                    animate={reducedMotion || !playing ? { r: 56, opacity: 0.2 } : { r: [53, 61, 53], opacity: [0.32, 0.08, 0.32] }}
                    transition={{ duration: reducedMotion || !playing ? 0 : 2, repeat: reducedMotion || !playing ? 0 : Infinity }}
                  />
                )}
                <text x={actorPoint.x} y={actorPoint.y - 3} textAnchor="middle" className="fill-foreground text-[16px] font-bold">
                  {actor.label}
                </text>
                <text x={actorPoint.x} y={actorPoint.y + 16} textAnchor="middle" className="fill-muted-foreground text-[11px]">
                  {actor.detail ?? ""}
                </text>
              </g>
            );
          })}

          {(step?.transitions ?? []).map((transition, index, transitions) => {
            const from = actorMap[transition.from];
            const to = actorMap[transition.to];
            const startActor = point(from);
            const endActor = point(to);
            const kind = transition.kind ?? "request";
            const color = transitionColor[kind];
            const dx = endActor.x - startActor.x;
            const dy = endActor.y - startActor.y;
            const length = Math.max(Math.hypot(dx, dy), 1);
            const unitX = dx / length;
            const unitY = dy / length;
            const startX = startActor.x + unitX * 51;
            const startY = startActor.y + unitY * 51;
            const endX = endActor.x - unitX * 51;
            const endY = endActor.y - unitY * 51;
            const samePair = transitions.filter((candidate) =>
              (candidate.from === transition.from && candidate.to === transition.to)
              || (candidate.from === transition.to && candidate.to === transition.from),
            );
            const pairIndex = samePair.indexOf(transition);
            const lane = (pairIndex - (samePair.length - 1) / 2) * 62;
            const normalX = -unitY;
            const normalY = unitX;
            const controlX = (startX + endX) / 2 + normalX * lane;
            const controlY = (startY + endY) / 2 + normalY * lane;
            const path = `M ${startX} ${startY} Q ${controlX} ${controlY} ${endX} ${endY}`;
            const labelX = 0.25 * startX + 0.5 * controlX + 0.25 * endX;
            const labelY = 0.25 * startY + 0.5 * controlY + 0.25 * endY + (transition.labelOffsetY ?? -14);

            return (
              <g key={`${stepIndex}-${index}-${transition.from}-${transition.to}`}>
                <path
                  d={path}
                  fill="none"
                  stroke={color}
                  strokeWidth="5"
                  strokeLinecap="round"
                  markerEnd={`url(#${markerId})`}
                />
                <rect x={labelX - 67} y={labelY - 15} width="134" height="22" rx="7" className="fill-background stroke-border" />
                <text x={labelX} y={labelY} textAnchor="middle" className="fill-foreground text-[10px] font-semibold">
                  {index + 1}. {transition.label}
                </text>
                <g transform={reducedMotion ? `translate(${endX} ${endY})` : undefined}>
                  {!reducedMotion && (
                    <animateMotion dur="1.35s" begin={`${index * 0.24}s`} repeatCount="indefinite" path={path} />
                  )}
                  <PacketMarker transition={transition} color={color} />
                </g>
              </g>
            );
          })}

          {!overview && tone === "playful" && step.playfulHint && (
            <text x={width / 2} y={height - 18} textAnchor="middle" className="fill-muted-foreground text-[10px]">
              {step.playfulHint}
            </text>
          )}
        </svg>
      </div>}
      {spec.steps.some((candidate) => candidate.message) && (
        <div className="border-t border-border bg-card p-4">
          <div className="mb-2 text-[11px] font-semibold text-muted-foreground">
            {step?.message?.label ?? "메시지 미리보기 · 단계와 함께 갱신됩니다"}
          </div>
          <pre className="h-[40rem] overflow-auto whitespace-pre-wrap break-all rounded-lg border border-border bg-background p-3 text-[11px] leading-relaxed text-foreground" tabIndex={0} aria-label="현재 단계 메시지">
            <code>{step?.message?.code ?? "전체 구조를 확인한 뒤 연결 준비부터 요청 처리까지 메시지를 순서대로 따라갑니다."}</code>
          </pre>
        </div>
      )}
    </section>
  );
}

function TraceLegend() {
  return (
    <div className="hidden flex-wrap items-center gap-2 text-[9px] text-muted-foreground sm:flex" aria-label="트레이스 범례">
      <span className="inline-flex items-center gap-1"><span className="h-2 w-4 rounded-sm bg-blue-500" />실행</span>
      <span className="inline-flex items-center gap-1"><span className="h-2 w-4 rounded-sm border-2 border-violet-500" />호출</span>
      <span className="inline-flex items-center gap-1"><span className="h-2 w-4 rounded-sm bg-amber-400 opacity-55" />대기</span>
      <span className="inline-flex items-center gap-1"><span className="h-2 w-4 rounded-sm bg-rose-500 ring-2 ring-rose-300" />병목</span>
    </div>
  );
}

function TopologyOverviewTrace({ spec }: { spec: WorkflowVisualizationSpec }) {
  return (
    <section className="min-h-[250px] rounded-2xl border border-border bg-card p-4 shadow-sm">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">Trace waterfall</div>
          <div className="mt-1 text-sm font-bold text-foreground">단계별 실행 추적 준비</div>
        </div>
        <TraceLegend />
      </div>
      <div className="mt-4 rounded-xl border border-dashed border-border bg-muted/25 px-4 py-5 text-center text-xs leading-relaxed text-muted-foreground">
        지금은 전체 구조를 확인하는 장면입니다. 다음 단계부터 활성 경로와 함께 작업의 시작·종료·중첩·대기·병목이 동기화됩니다.
        <span className="mt-1 block font-medium text-foreground">{spec.steps.length}개 단계 · {spec.actors.length}개 참여자</span>
      </div>
    </section>
  );
}

function spanDepth(span: WorkflowWaterfallSpan, spanById: Map<string, WorkflowWaterfallSpan>): number {
  let depth = 0;
  let current = span;
  const visited = new Set<string>();

  while (current.parentId && !visited.has(current.parentId) && depth < 2) {
    visited.add(current.parentId);
    const parent = spanById.get(current.parentId);
    if (!parent) break;
    depth += 1;
    current = parent;
  }

  return depth;
}

function Waterfall({ spec, stepIndex }: { spec: WorkflowVisualizationSpec; stepIndex: number }) {
  const reducedMotion = useReducedMotion() ?? false;
  const step = spec.steps[stepIndex];
  const actorMap = useMemo(
    () => new Map(spec.actors.map((actor) => [actor.id, actor])),
    [spec.actors],
  );
  const spanById = useMemo(
    () => new Map(step.spans.flatMap((span) => (span.id ? [[span.id, span] as const] : []))),
    [step.spans],
  );

  return (
    <section className="min-h-[250px] rounded-2xl border border-border bg-card p-4 shadow-sm">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
        <div>
          <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
            {spec.waterfallLabel ?? "Trace waterfall · relative execution"}
          </div>
          <div className="mt-1 text-sm font-bold text-foreground">{step.title}</div>
          <div className="mt-1 text-[10px] text-muted-foreground">상대적 실행 순서 · 정밀 벤치마크 아님</div>
        </div>
        <TraceLegend />
      </div>

      <div className="grid grid-cols-[minmax(90px,118px)_minmax(0,1fr)_32px] items-center gap-x-2 gap-y-2 sm:grid-cols-[minmax(150px,220px)_minmax(0,1fr)_46px] sm:gap-x-3">
        <div className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">서비스 / 작업</div>
        <div className="grid grid-cols-5 text-[9px] text-muted-foreground">
          <span>0</span><span>25</span><span>50</span><span>75</span><span className="text-right">100</span>
        </div>
        <div className="text-right text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">비중</div>

        {step.spans.map((span, index) => {
          const start = clampWorkflowSpan(span.start);
          const end = Math.max(start, clampWorkflowSpan(span.end));
          const duration = Math.round((end - start) * 100);
          const width = Math.max((end - start) * 100, 2);
          const owner = span.actorId ? actorMap.get(span.actorId) : undefined;
          const kind = span.kind ?? "work";
          const depth = spanDepth(span, spanById);
          const statusClass = span.status === "error"
            ? "ring-2 ring-rose-400"
            : span.status === "warning"
              ? "ring-2 ring-amber-300"
              : span.bottleneck
                ? "ring-2 ring-rose-300 ring-offset-1 ring-offset-background"
                : "";
          const kindClass = kind === "network" ? "border-2 border-white/75 dark:border-slate-950/45" : "";
          const barStyle = {
            left: `${start * 100}%`,
            width: `${width}%`,
            transformOrigin: "left center",
            backgroundImage: kind === "wait"
              ? "repeating-linear-gradient(135deg, transparent 0, transparent 5px, rgba(255,255,255,.38) 5px, rgba(255,255,255,.38) 9px)"
              : undefined,
          };
          const detail = [
            owner?.label,
            spanKindLabel[kind],
            `시작 ${Math.round(start * 100)}`,
            `종료 ${Math.round(end * 100)}`,
            `비중 ${duration}%`,
            span.detail,
          ].filter(Boolean).join(" · ");

          return (
            <div key={`${stepIndex}-${span.id ?? span.label}-${index}`} className="contents">
              <div className="min-w-0" style={{ paddingLeft: `${depth * 12}px` }} title={detail}>
                <div className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-wider text-muted-foreground">
                  {depth > 0 && <span aria-hidden="true">↳</span>}
                  {owner && <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: accentStroke[accentOf(owner)] }} />}
                  <span className="truncate">{owner?.label ?? "WORKFLOW"}</span>
                  {span.status && span.status !== "default" && (
                    <span className="rounded bg-muted px-1 text-[8px] text-foreground">{spanStatusLabel[span.status]}</span>
                  )}
                  {span.bottleneck && <span className="rounded bg-rose-500/10 px-1 text-[8px] text-rose-600 dark:text-rose-400">병목</span>}
                </div>
                <div className="truncate text-[11px] font-medium text-foreground">{span.label}</div>
              </div>

              <div className="relative h-8 overflow-visible rounded-md border border-border bg-muted">
                <motion.div
                  className={`absolute inset-y-1 flex items-center overflow-hidden rounded px-1.5 text-[9px] font-bold text-white shadow-sm ${spanTone[span.tone ?? "primary"]} ${kindClass} ${statusClass}`}
                  style={barStyle}
                  initial={reducedMotion ? false : { opacity: 0.65 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: reducedMotion ? 0 : 0.32, delay: index * 0.05 }}
                  title={detail}
                >
                  {width >= 18 && <span className="truncate">{spanKindLabel[kind]}</span>}
                </motion.div>
              </div>

              <div className={`text-right font-mono text-[10px] font-semibold ${span.bottleneck ? "text-rose-600 dark:text-rose-400" : "text-muted-foreground"}`}>
                {duration}%
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function SpecError({ spec, issues }: { spec: WorkflowVisualizationSpec; issues: ReturnType<typeof validateWorkflowSpec> }) {
  return (
    <section className="rounded-xl border border-rose-300 bg-rose-50 p-5 text-rose-900 dark:border-rose-900 dark:bg-rose-950/25 dark:text-rose-200" role="alert">
      <h3 className="text-sm font-bold">{spec.title || "워크플로우"} 설정을 표시할 수 없습니다.</h3>
      <ul className="mt-2 list-disc space-y-1 pl-5 text-xs">
        {issues.map((issue) => <li key={`${issue.path}-${issue.message}`}><code>{issue.path}</code>: {issue.message}</li>)}
      </ul>
    </section>
  );
}

export default function WorkflowFocusedViz({ spec, TopologyCanvas }: {
  spec: WorkflowVisualizationSpec;
  TopologyCanvas?: ComponentType<WorkflowTopologyCanvasProps>;
}) {
  const reducedMotion = useReducedMotion() ?? false;
  const issues = useMemo(() => validateWorkflowSpec(spec), [spec]);
  const totalSteps = spec.steps.length;
  const [frame, setFrame] = useState(0);
  const [playing, setPlaying] = useState(true);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (timer.current) clearTimeout(timer.current);
    if (!playing || totalSteps === 0 || issues.length > 0) return;

    const delay = frame === 0
      ? spec.overviewMs ?? Math.min(spec.autoplayMs ?? 3600, 2800)
      : spec.autoplayMs ?? 3600;
    timer.current = setTimeout(
      () => setFrame((current) => (current >= totalSteps ? 0 : current + 1)),
      delay,
    );

    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [frame, issues.length, playing, reducedMotion, spec.autoplayMs, spec.overviewMs, totalSteps]);

  if (issues.length > 0) return <SpecError spec={spec} issues={issues} />;

  const safeFrame = Math.min(frame, totalSteps);
  const stepIndex = safeFrame === 0 ? null : safeFrame - 1;

  return (
    <div className="flex w-full flex-col gap-3">
      <Controls
        frame={safeFrame}
        totalSteps={totalSteps}
        playing={playing}
        reducedMotion={reducedMotion}
        onToggle={() => setPlaying((value) => !value)}
      />
      <TopologyScene spec={spec} stepIndex={stepIndex} playing={playing} Canvas={TopologyCanvas} />
      {stepIndex === null ? <TopologyOverviewTrace spec={spec} /> : <Waterfall spec={spec} stepIndex={stepIndex} />}
    </div>
  );
}
