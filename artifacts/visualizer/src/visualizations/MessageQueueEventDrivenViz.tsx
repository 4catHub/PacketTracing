import { useCallback, useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import {
  AlertTriangle,
  Layers3,
  Pause,
  Play,
  RotateCcw,
  Send,
  UsersRound,
} from "lucide-react";

type Tone = "blue" | "violet" | "emerald" | "amber" | "rose";

interface Stage {
  id: string;
  title: string;
  label: string;
  summary: string;
  tone: Tone;
  duration: number;
  payload: string;
  metrics: Array<{
    label: string;
    value: string;
    status?: "active" | "warning" | "danger";
  }>;
}

const STAGES: Stage[] = [
  {
    id: "publish",
    title: "이벤트 발행",
    label: "PUBLISH",
    summary:
      "주문 Producer는 Consumer의 응답을 기다리지 않고 이벤트를 Broker에 기록합니다.",
    tone: "blue",
    duration: 3200,
    payload: [
      'topic: "orders"',
      'key: "order_1042"',
      'event: "order.created"',
      'traceId: "tr_8f2a"',
      "amount: 42_000",
    ].join("\n"),
    metrics: [
      { label: "Ack", value: "leader committed", status: "active" },
      { label: "Delivery", value: "at-least-once" },
      { label: "Latency", value: "3 ms" },
      { label: "Consumers", value: "decoupled" },
    ],
  },
  {
    id: "partition",
    title: "파티션 분배",
    label: "PARTITION",
    summary:
      "Broker는 key 해시로 파티션을 선택합니다. 같은 주문 key의 순서는 같은 파티션 안에서 유지됩니다.",
    tone: "violet",
    duration: 3600,
    payload: [
      'topic: "orders"',
      "key hash: 0x7A → partition 1",
      "offset: 42",
      "ordering: key-scoped",
      "replicas: 3",
    ].join("\n"),
    metrics: [
      { label: "Partitions", value: "3 active", status: "active" },
      { label: "Selected", value: "P1 / offset 42" },
      { label: "Ordering", value: "per key" },
      { label: "Replica", value: "ISR: 3" },
    ],
  },
  {
    id: "consume",
    title: "Consumer Group 처리",
    label: "CONSUME",
    summary:
      "세 Consumer가 파티션을 하나씩 분담하고, 성공한 처리 위치를 offset으로 커밋합니다.",
    tone: "emerald",
    duration: 3600,
    payload: [
      'group: "fulfillment-v2"',
      "assigned: P0 → C1, P1 → C2, P2 → C3",
      'processing: "reserve inventory"',
      "commit: offset 42",
    ].join("\n"),
    metrics: [
      { label: "Group", value: "3 / 3 assigned", status: "active" },
      { label: "Lag", value: "0 events" },
      { label: "Commit", value: "offset 42", status: "active" },
      { label: "Scale limit", value: "3 consumers" },
    ],
  },
  {
    id: "retry",
    title: "재시도 예약",
    label: "RETRY",
    summary:
      "외부 결제 API의 일시 실패는 retry 토픽으로 분리해 backoff 후 다시 처리합니다.",
    tone: "amber",
    duration: 4200,
    payload: [
      'event: "payment.authorize"',
      'error: "upstream timeout"',
      "attempt: 2 / 3",
      "retryAt: +15s",
      "policy: exponential backoff",
    ].join("\n"),
    metrics: [
      { label: "Attempt", value: "2 / 3", status: "warning" },
      { label: "Retry delay", value: "15 seconds" },
      { label: "Main lag", value: "unblocked", status: "active" },
      { label: "Idempotency", value: "eventId required" },
    ],
  },
  {
    id: "dlq",
    title: "DLQ 격리",
    label: "DEAD LETTER",
    summary:
      "재시도 한도를 넘긴 이벤트는 DLQ에 격리합니다. 정상 파티션은 멈추지 않고 운영자가 원인을 분석·재처리합니다.",
    tone: "rose",
    duration: 4400,
    payload: [
      'eventId: "evt_0f91"',
      'reason: "schema validation failed"',
      "attempts: 3",
      'queue: "orders.dlq"',
      'action: "inspect → fix → replay"',
    ].join("\n"),
    metrics: [
      { label: "Main flow", value: "healthy", status: "active" },
      { label: "DLQ depth", value: "1 event", status: "danger" },
      { label: "Payload", value: "retained" },
      { label: "Action", value: "manual replay" },
    ],
  },
];

const TONES: Record<
  Tone,
  { accent: string; soft: string; border: string; text: string; dot: string }
> = {
  blue: {
    accent: "#2563eb",
    soft: "bg-blue-50 dark:bg-blue-950/20",
    border: "border-blue-200/70 dark:border-blue-900/50",
    text: "text-blue-700 dark:text-blue-300",
    dot: "bg-blue-500",
  },
  violet: {
    accent: "#7c3aed",
    soft: "bg-violet-50 dark:bg-violet-950/20",
    border: "border-violet-200/70 dark:border-violet-900/50",
    text: "text-violet-700 dark:text-violet-300",
    dot: "bg-violet-500",
  },
  emerald: {
    accent: "#059669",
    soft: "bg-emerald-50 dark:bg-emerald-950/20",
    border: "border-emerald-200/70 dark:border-emerald-900/50",
    text: "text-emerald-700 dark:text-emerald-300",
    dot: "bg-emerald-500",
  },
  amber: {
    accent: "#d97706",
    soft: "bg-amber-50 dark:bg-amber-950/20",
    border: "border-amber-200/70 dark:border-amber-900/50",
    text: "text-amber-700 dark:text-amber-300",
    dot: "bg-amber-500",
  },
  rose: {
    accent: "#e11d48",
    soft: "bg-rose-50 dark:bg-rose-950/20",
    border: "border-rose-200/70 dark:border-rose-900/50",
    text: "text-rose-700 dark:text-rose-300",
    dot: "bg-rose-500",
  },
};

function Packet({
  step,
  reduceMotion,
}: {
  step: number;
  reduceMotion: boolean | null;
}) {
  const transition = reduceMotion
    ? { duration: 0 }
    : { duration: 1.25, repeat: Infinity, ease: "easeInOut" as const };

  if (step === 0) {
    return (
      <motion.circle
        key="mq-publish"
        r="7"
        fill="#2563eb"
        initial={{ cx: 184, cy: 198, opacity: 0 }}
        animate={{
          cx: [184, 199, 214],
          cy: [198, 188, 174],
          opacity: [0, 1, 1],
        }}
        transition={transition}
      />
    );
  }
  if (step === 1) {
    return (
      <>
        {[0, 1, 2].map((partition) => (
          <motion.circle
            key={`mq-partition-${partition}`}
            r="5.5"
            fill="#7c3aed"
            initial={{ cx: 219, cy: 111, opacity: 0 }}
            animate={{ cx: 252, cy: 154 + partition * 42, opacity: [0, 1, 1] }}
            transition={{ ...transition, delay: partition * 0.2 }}
          />
        ))}
      </>
    );
  }
  if (step === 2) {
    return (
      <>
        {[0, 1, 2].map((consumer) => (
          <motion.circle
            key={`mq-consume-${consumer}`}
            r="5.5"
            fill="#059669"
            initial={{ cx: 500, cy: 154 + consumer * 42, opacity: 0 }}
            animate={{ cx: 548, cy: 156 + consumer * 48, opacity: [0, 1, 1] }}
            transition={{ ...transition, delay: consumer * 0.18 }}
          />
        ))}
      </>
    );
  }
  if (step === 3) {
    return (
      <motion.circle
        key="mq-retry"
        r="7"
        fill="#d97706"
        initial={{ cx: 633, cy: 223, opacity: 0 }}
        animate={{
          cx: [633, 602, 522, 431, 379],
          cy: [223, 265, 302, 315, 310],
          opacity: [0, 1, 1, 1],
        }}
        transition={transition}
      />
    );
  }
  return (
    <motion.circle
      key="mq-dlq"
      r="7"
      fill="#e11d48"
      initial={{ cx: 480, cy: 336, opacity: 0 }}
      animate={{ cx: [480, 503, 526], cy: [336, 336, 336], opacity: [0, 1, 1] }}
      transition={transition}
    />
  );
}

export default function MessageQueueEventDrivenViz() {
  const [activeStep, setActiveStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const reduceMotion = useReducedMotion();
  const stage = STAGES[activeStep];
  const tone = TONES[stage.tone];
  const progress = ((activeStep + 1) / STAGES.length) * 100;

  useEffect(() => {
    if (!isPlaying || reduceMotion) return;
    const timer = window.setTimeout(
      () =>
        setActiveStep((current) =>
          current === STAGES.length - 1 ? 0 : current + 1,
        ),
      stage.duration,
    );
    return () => window.clearTimeout(timer);
  }, [activeStep, isPlaying, reduceMotion, stage.duration]);

  const selectStep = useCallback((index: number) => {
    setIsPlaying(false);
    setActiveStep(index);
  }, []);
  const reset = useCallback(() => {
    setIsPlaying(false);
    setActiveStep(0);
  }, []);
  const producerActive = activeStep === 0;
  const brokerActive = activeStep === 1;
  const consumerActive = activeStep === 2 || activeStep === 3;
  const retryActive = activeStep === 3;
  const dlqActive = activeStep === 4;

  return (
    <div className="space-y-5" data-testid="message-queue-event-driven-viz">
      <div className="flex items-center gap-1.5 rounded-lg border border-border/70 bg-muted/30 p-1.5">
        <button
          onClick={reset}
          className="rounded-md border border-border/80 bg-card p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          aria-label="처음 단계로 초기화"
          title="초기화"
          data-testid="button-mq-reset"
        >
          <RotateCcw size={14} />
        </button>
        <button
          onClick={() => setIsPlaying((playing) => !playing)}
          className="rounded-md bg-primary p-1.5 text-primary-foreground transition-opacity hover:opacity-90"
          aria-label={isPlaying && !reduceMotion ? "일시정지" : "재생"}
          title={isPlaying && !reduceMotion ? "일시정지" : "재생"}
          data-testid="button-mq-play-pause"
        >
          {isPlaying && !reduceMotion ? (
            <Pause size={14} />
          ) : (
            <Play size={14} />
          )}
        </button>
        <div className="ml-auto flex min-w-[120px] items-center gap-2">
          <span className="whitespace-nowrap text-xs font-mono font-semibold text-muted-foreground">
            {activeStep + 1} / {STAGES.length}
          </span>
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
            <motion.div
              className="h-full rounded-full bg-primary"
              animate={{ width: `${progress}%` }}
              transition={{ duration: reduceMotion ? 0 : 0.35 }}
            />
          </div>
        </div>
      </div>

      <section
        className="overflow-hidden rounded-2xl border border-border/70 bg-card"
        aria-label="이벤트 처리 흐름"
      >
        <div className="flex items-center justify-between border-b border-border/60 px-4 py-3 sm:px-5">
          <div className="flex items-center gap-2">
            <Layers3 size={16} className={tone.text} />
            <span className="text-sm font-semibold text-foreground">
              Event Lifecycle
            </span>
          </div>
          <span
            className={`rounded-full border px-2 py-0.5 text-xs font-mono font-bold ${tone.soft} ${tone.border} ${tone.text}`}
          >
            {stage.label}
          </span>
        </div>
        <div className="overflow-x-auto p-3 sm:p-4">
          <svg
            viewBox="0 0 760 430"
            className="block min-w-[720px] w-full select-none"
            role="img"
            aria-label={`${stage.title} 시각화`}
          >
            <defs>
              <pattern
                id="mq-grid"
                width="24"
                height="24"
                patternUnits="userSpaceOnUse"
              >
                <path
                  d="M 24 0 L 0 0 0 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="0.7"
                  className="text-slate-200/70 dark:text-slate-800/60"
                />
              </pattern>
              <filter
                id="mq-shadow"
                x="-20%"
                y="-20%"
                width="140%"
                height="140%"
              >
                <feDropShadow
                  dx="0"
                  dy="2"
                  stdDeviation="2"
                  floodColor="#0f172a"
                  floodOpacity="0.12"
                />
              </filter>
            </defs>
            <rect
              width="760"
              height="430"
              rx="16"
              className="fill-slate-50 dark:fill-slate-950"
            />
            <rect width="760" height="430" rx="16" fill="url(#mq-grid)" />
            <text
              x="32"
              y="42"
              className="fill-slate-400 text-[11px] font-mono font-bold uppercase tracking-[0.16em] dark:fill-slate-500"
            >
              async event flow
            </text>

            <path
              d="M 184 198 C 195 198 204 187 214 174"
              fill="none"
              stroke={producerActive ? tone.accent : "#94a3b8"}
              strokeWidth="2.5"
              strokeDasharray={producerActive ? "0" : "5 5"}
            />
            {[0, 1, 2].map((partition) => (
              <path
                key={`broker-consumer-line-${partition}`}
                d={`M 500 ${154 + partition * 42} C 518 ${150 + partition * 51} 532 ${156 + partition * 48} 548 ${156 + partition * 48}`}
                fill="none"
                stroke={consumerActive ? tone.accent : "#94a3b8"}
                strokeWidth="2.5"
                strokeDasharray={consumerActive ? "0" : "5 5"}
              />
            ))}
            <path
              d="M 633 223 L 602 265 L 522 302 L 431 315 L 379 310"
              fill="none"
              stroke={retryActive ? tone.accent : "#94a3b8"}
              strokeWidth="2.5"
              strokeDasharray={retryActive ? "0" : "5 5"}
            />
            <path
              d="M 480 336 L 503 336 L 526 336"
              fill="none"
              stroke={dlqActive ? tone.accent : "#94a3b8"}
              strokeWidth="2.5"
              strokeDasharray={dlqActive ? "0" : "5 5"}
            />

            <g filter="url(#mq-shadow)">
              <rect
                x="24"
                y="154"
                width="160"
                height="88"
                rx="14"
                className="fill-card stroke-border"
                strokeWidth={producerActive ? "3" : "1.5"}
                stroke={producerActive ? tone.accent : undefined}
              />
              <circle
                cx="50"
                cy="181"
                r="13"
                fill="#dbeafe"
                className="dark:fill-blue-950"
              />
              <path
                d="M 44 181h12M 50 175v12"
                stroke="#2563eb"
                strokeWidth="2"
                strokeLinecap="round"
              />
              <text
                x="70"
                y="180"
                className="fill-foreground text-[11px] font-bold"
              >
                Order Service
              </text>
              <text
                x="70"
                y="198"
                className="fill-slate-500 text-[10px] font-mono dark:fill-slate-400"
              >
                Producer
              </text>
              <text
                x="42"
                y="227"
                className="fill-blue-600 text-[10px] font-mono font-bold dark:fill-blue-400"
              >
                order.created
              </text>
            </g>

            <g filter="url(#mq-shadow)">
              <rect
                x="214"
                y="76"
                width="286"
                height="210"
                rx="16"
                className="fill-card stroke-border"
                strokeWidth={brokerActive ? "3" : "1.5"}
                stroke={brokerActive ? tone.accent : undefined}
              />
              <rect
                x="232"
                y="96"
                width="250"
                height="30"
                rx="7"
                className="fill-violet-50 stroke-violet-200 dark:fill-violet-950/40 dark:stroke-violet-900"
              />
              <text
                x="246"
                y="116"
                className="fill-violet-700 text-[11px] font-mono font-bold dark:fill-violet-300"
              >
                orders topic
              </text>
              <text
                x="468"
                y="116"
                textAnchor="end"
                className="fill-violet-500 text-[10px] font-mono dark:fill-violet-400"
              >
                replicas ×3
              </text>
              {[0, 1, 2].map((partition) => {
                const y = 138 + partition * 42;
                const selected = brokerActive && partition === 1;
                return (
                  <g key={`partition-${partition}`}>
                    <rect
                      x="232"
                      y={y}
                      width="250"
                      height="32"
                      rx="7"
                      fill={selected ? "#ede9fe" : "#f8fafc"}
                      className={
                        selected
                          ? "dark:fill-violet-950/70"
                          : "dark:fill-slate-900"
                      }
                      stroke={selected ? tone.accent : "#cbd5e1"}
                      strokeWidth={selected ? "2" : "1"}
                    />
                    <text
                      x="246"
                      y={y + 20}
                      className="fill-slate-600 text-[10px] font-mono font-bold dark:fill-slate-300"
                    >
                      P{partition}
                    </text>
                    <text
                      x="288"
                      y={y + 20}
                      className="fill-slate-500 text-[10px] font-mono dark:fill-slate-400"
                    >
                      offset{" "}
                      {partition === 1 ? "42" : partition === 0 ? "58" : "17"}
                    </text>
                    <text
                      x="468"
                      y={y + 20}
                      textAnchor="end"
                      className="fill-slate-400 text-[10px] font-mono dark:fill-slate-500"
                    >
                      {selected ? "order_1042" : "ready"}
                    </text>
                  </g>
                );
              })}
              <text
                x="236"
                y="274"
                className="fill-slate-500 text-[10px] font-mono dark:fill-slate-400"
              >
                persist before delivery
              </text>
            </g>

            <g filter="url(#mq-shadow)">
              <rect
                x="530"
                y="76"
                width="206"
                height="210"
                rx="16"
                className="fill-card stroke-border"
                strokeWidth={consumerActive ? "3" : "1.5"}
                stroke={consumerActive ? tone.accent : undefined}
              />
              <text
                x="548"
                y="104"
                className="fill-foreground text-[11px] font-bold"
              >
                Consumer Group
              </text>
              <text
                x="548"
                y="121"
                className="fill-slate-500 text-[10px] font-mono dark:fill-slate-400"
              >
                1 partition per member
              </text>
              {[0, 1, 2].map((consumer) => {
                const y = 136 + consumer * 48;
                const assigned = activeStep >= 2;
                return (
                  <g key={`consumer-${consumer}`}>
                    <rect
                      x="548"
                      y={y}
                      width="170"
                      height="39"
                      rx="8"
                      fill={assigned ? "#ecfdf5" : "#f8fafc"}
                      className={
                        assigned
                          ? "dark:fill-emerald-950/40"
                          : "dark:fill-slate-900"
                      }
                      stroke={assigned ? "#34d399" : "#cbd5e1"}
                      strokeWidth="1"
                    />
                    <text
                      x="562"
                      y={y + 17}
                      className="fill-slate-700 text-[10px] font-mono font-bold dark:fill-slate-200"
                    >
                      C{consumer + 1}
                    </text>
                    <text
                      x="612"
                      y={y + 17}
                      className="fill-slate-500 text-[10px] font-mono dark:fill-slate-400"
                    >
                      P{consumer}
                    </text>
                    <text
                      x="562"
                      y={y + 31}
                      className={
                        activeStep === 3 && consumer === 1
                          ? "fill-amber-600 text-[10px] font-mono dark:fill-amber-400"
                          : assigned
                            ? "fill-emerald-600 text-[10px] font-mono dark:fill-emerald-400"
                            : "fill-slate-400 text-[10px] font-mono dark:fill-slate-500"
                      }
                    >
                      {activeStep === 3 && consumer === 1
                        ? "retry queued"
                        : assigned
                          ? "offset committed"
                          : "waiting"}
                    </text>
                  </g>
                );
              })}
            </g>

            <g filter="url(#mq-shadow)">
              <rect
                x="278"
                y="310"
                width="202"
                height="52"
                rx="12"
                className="fill-card stroke-border"
                strokeWidth={retryActive ? "3" : "1.5"}
                stroke={retryActive ? tone.accent : undefined}
              />
              <text
                x="296"
                y="331"
                className="fill-foreground text-[11px] font-bold"
              >
                retry.orders
              </text>
              <text
                x="296"
                y="348"
                className="fill-amber-600 text-[10px] font-mono dark:fill-amber-400"
              >
                backoff 15s · 2/3
              </text>
            </g>
            <g filter="url(#mq-shadow)">
              <rect
                x="526"
                y="310"
                width="210"
                height="52"
                rx="12"
                className="fill-card stroke-border"
                strokeWidth={dlqActive ? "3" : "1.5"}
                stroke={dlqActive ? tone.accent : undefined}
              />
              <text
                x="544"
                y="331"
                className="fill-foreground text-[11px] font-bold"
              >
                orders.dlq
              </text>
              <text
                x="544"
                y="348"
                className="fill-rose-600 text-[10px] font-mono dark:fill-rose-400"
              >
                inspect → replay
              </text>
            </g>
            <Packet step={activeStep} reduceMotion={reduceMotion} />
            <g>
              <rect
                x="42"
                y="382"
                width="676"
                height="26"
                rx="8"
                className="fill-card stroke-border"
              />
              <circle cx="58" cy="395" r="4" fill={tone.accent} />
              <text
                x="70"
                y="399"
                className="fill-slate-600 text-[10px] font-mono dark:fill-slate-300"
              >
                {stage.label}
              </text>
              <text
                x="164"
                y="399"
                className="fill-slate-500 text-[10px] font-sans dark:fill-slate-400"
              >
                {stage.title}
              </text>
            </g>
          </svg>
        </div>
      </section>

      <div className="space-y-4" aria-live="polite">
        <section
          className={`rounded-2xl border p-4 sm:p-5 ${tone.soft} ${tone.border}`}
          aria-label="현재 단계 상태"
        >
          <div className="flex items-start gap-3">
            <span
              className={`mt-0.5 rounded-lg bg-card p-2 shadow-sm ${tone.text}`}
            >
              {activeStep === 4 ? (
                <AlertTriangle size={18} />
              ) : activeStep === 2 ? (
                <UsersRound size={18} />
              ) : (
                <Send size={18} />
              )}
            </span>
            <div className="min-w-0 space-y-1">
              <div
                className={`text-xs font-mono font-bold tracking-wide ${tone.text}`}
              >
                STEP {String(activeStep + 1).padStart(2, "0")}
              </div>
              <h3 className="text-base font-bold text-foreground">
                {stage.title}
              </h3>
              <p className="text-xs leading-relaxed text-muted-foreground sm:text-sm">
                {stage.summary}
              </p>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {stage.metrics.map((metric) => {
              const metricTone =
                metric.status === "danger"
                  ? "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/20 dark:text-rose-300"
                  : metric.status === "warning"
                    ? "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/50 dark:bg-amber-950/20 dark:text-amber-300"
                    : metric.status === "active"
                      ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/20 dark:text-emerald-300"
                      : "border-border/70 bg-card text-foreground";
              return (
                <div
                  key={metric.label}
                  className={`min-w-0 rounded-xl border p-3 ${metricTone}`}
                >
                  <div className="mb-1 text-xs text-muted-foreground">
                    {metric.label}
                  </div>
                  <div className="truncate font-mono text-xs font-bold sm:text-sm">
                    {metric.value}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section
          className="overflow-hidden rounded-2xl border border-border/70 bg-card"
          aria-label="이벤트 변화 데이터"
        >
          <div className="flex items-center justify-between border-b border-border/60 px-4 py-3">
            <span className="text-sm font-semibold text-foreground">
              Event Inspector
            </span>
            <span className="rounded-md bg-muted px-2 py-0.5 font-mono text-xs text-muted-foreground">
              envelope
            </span>
          </div>
          <pre className="whitespace-pre-wrap break-words p-4 font-mono text-xs leading-6 text-foreground sm:text-sm">
            {stage.payload}
          </pre>
        </section>
      </div>

      <nav
        className="grid grid-cols-5 gap-1.5"
        aria-label="이벤트 수명 주기 단계"
      >
        {STAGES.map((item, index) => {
          const itemTone = TONES[item.tone];
          const active = index === activeStep;
          return (
            <button
              key={item.id}
              onClick={() => selectStep(index)}
              className={`group rounded-xl border px-2 py-2 text-left transition-colors sm:px-3 ${active ? `${itemTone.soft} ${itemTone.border}` : "border-border/70 bg-card hover:bg-muted/60"}`}
              aria-current={active ? "step" : undefined}
              aria-label={`${index + 1}단계: ${item.title}`}
            >
              <span
                className={`mb-1 block h-1.5 rounded-full ${active ? itemTone.dot : "bg-muted"}`}
              />
              <span
                className={`block truncate font-mono text-[10px] font-bold sm:text-xs ${active ? itemTone.text : "text-muted-foreground"}`}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
