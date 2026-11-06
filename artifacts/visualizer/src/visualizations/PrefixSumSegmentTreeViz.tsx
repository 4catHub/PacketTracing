import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";
import {
  createSteps,
  INPUT,
  interval,
  NODES,
  RANGE,
  UPDATE,
  type Mode,
} from "./range-sum-model";

const MODES: { id: Mode; label: string }[] = [
  { id: "build", label: "자료구조 만들기" },
  { id: "query", label: "구간 합 조회" },
  { id: "update", label: "값 하나 변경" },
];

const CARD =
  "min-w-0 space-y-3 rounded-xl border border-border bg-background p-2.5 sm:p-3";
const CONTROL =
  "inline-flex min-h-9 items-center gap-1 rounded-md border border-border px-2 text-xs font-medium hover:bg-muted focus-visible:outline-2 focus-visible:outline-primary disabled:opacity-40";

const CELL_STYLES = {
  idle: "border-border bg-muted/30 text-foreground",
  active: "border-amber-500 bg-amber-500/15 text-amber-800 dark:text-amber-200",
  done: "border-emerald-500 bg-emerald-500/15 text-emerald-800 dark:text-emerald-200",
  range: "border-primary/60 bg-primary/10 text-foreground",
};

const TREE_STYLES = {
  idle: "fill-muted stroke-border",
  active: "fill-amber-500/15 stroke-amber-500",
  done: "fill-emerald-500/15 stroke-emerald-500",
  skipped: "fill-background stroke-muted-foreground [stroke-dasharray:3_3]",
};

type Step = ReturnType<typeof createSteps>[number];

function ValueStrip({
  symbol,
  values,
  tone,
}: {
  symbol: string;
  values: (number | null)[];
  tone: (index: number) => keyof typeof CELL_STYLES;
}) {
  return (
    <ol
      className="grid list-none gap-0.5 sm:gap-1"
      style={{
        gridTemplateColumns: `repeat(${values.length}, minmax(0, 1fr))`,
      }}
    >
      {values.map((value, index) => (
        <li key={index} className="min-w-0 text-center font-mono">
          <span className="block whitespace-nowrap text-[9px] text-muted-foreground sm:text-xs">
            {symbol}[{index}]
          </span>
          <span
            className={`mt-1 grid h-8 place-items-center rounded border text-sm font-bold motion-safe:transition-colors sm:h-10 ${CELL_STYLES[tone(index)]}`}
          >
            {value ?? "·"}
          </span>
        </li>
      ))}
    </ol>
  );
}

const TREE_LAYOUT = NODES.map((node) => ({
  ...node,
  x: ((node.left + node.right + 1) * 480) / (2 * INPUT.length),
  y: 24 + node.depth * 60,
}));

function SegmentTree({ step }: { step: Step }) {
  return (
    <svg
      role="img"
      aria-label="세그먼트 트리의 구간과 저장된 합"
      viewBox="0 0 480 228"
      className="mx-auto block w-full max-w-xl font-mono"
    >
      {TREE_LAYOUT.slice(1).map((node) => {
        const parent = TREE_LAYOUT.find(
          ({ id }) => id === Math.floor(node.id / 2),
        )!;
        const focused =
          (step.decision === "split" && step.activeNodes.includes(parent.id)) ||
          (step.changedNodes.includes(node.id) &&
            step.changedNodes.includes(parent.id));
        return (
          <line
            key={node.id}
            x1={parent.x}
            y1={parent.y + 21}
            x2={node.x}
            y2={node.y - 21}
            className={
              focused ? "stroke-amber-500" : "stroke-muted-foreground/45"
            }
            strokeWidth={focused ? 2.5 : 1.5}
          />
        );
      })}
      {TREE_LAYOUT.map(({ id, left, right, x, y }) => {
        const active = step.activeNodes.includes(id);
        const tone =
          active && step.decision !== "skip"
            ? "active"
            : step.skipped.includes(id)
              ? "skipped"
              : step.taken.includes(id) || step.changedNodes.includes(id)
                ? "done"
                : "idle";
        const value = step.tree[id];
        const label = left === right ? `[${left}]` : `[${left},${right}]`;
        const width = left === right ? 54 : 68;
        return (
          <g
            key={id}
            transform={`translate(${x} ${y})`}
            data-node={label}
            data-tone={tone}
          >
            <rect
              x={-width / 2}
              y={-21}
              width={width}
              height={42}
              rx={6}
              strokeWidth={active ? 3 : tone === "idle" ? 1.5 : 2}
              className={`motion-safe:transition-colors ${TREE_STYLES[tone]}`}
            />
            <text
              y={-3}
              textAnchor="middle"
              fontSize={19}
              className="fill-muted-foreground"
            >
              {label}
            </text>
            <text
              y={16}
              textAnchor="middle"
              fontSize={22}
              fontWeight={700}
              className="fill-foreground"
            >
              {value ?? "·"}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

export default function PrefixSumSegmentTreeViz() {
  const [mode, setMode] = useState<Mode>("query");
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(true);
  const steps = useMemo(() => createSteps(mode), [mode]);
  const step = steps[index];
  const last = index === steps.length - 1;

  useEffect(() => {
    if (!playing) return;
    const timer = window.setTimeout(
      () => setIndex(last ? 0 : index + 1),
      last ? 3400 : 1850,
    );
    return () => window.clearTimeout(timer);
  }, [index, last, mode, playing]);

  function move(offset: number) {
    setPlaying(false);
    setIndex((current) =>
      Math.min(steps.length - 1, Math.max(0, current + offset)),
    );
  }

  const rangeLabel = interval(RANGE.left, RANGE.right);
  const prefixTarget = mode === "build" ? step.activePrefix[0] : undefined;
  const task =
    mode === "query"
      ? `${rangeLabel} 합 조회`
      : mode === "update"
        ? `A[${UPDATE.index}] ${INPUT[UPDATE.index]} → ${UPDATE.value}`
        : `원소 ${INPUT.length}개로 시작`;

  return (
    <div className="space-y-3" data-testid="range-sum-visualizer">
      <div
        role="group"
        aria-label="실행할 작업"
        className="flex flex-wrap gap-1.5"
      >
        {MODES.map(({ id, label }) => (
          <button
            key={id}
            type="button"
            aria-pressed={mode === id}
            onClick={() => {
              setIndex(0);
              setMode(id);
            }}
            className={`min-h-10 rounded-lg border px-2.5 text-xs font-semibold focus-visible:outline-2 focus-visible:outline-primary sm:px-3 sm:text-sm ${mode === id ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background text-muted-foreground hover:bg-muted"}`}
          >
            {label}
          </button>
        ))}
      </div>

      <section className={CARD} aria-label="재생과 현재 단계">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div
            className="flex flex-wrap gap-1"
            role="group"
            aria-label="단계 재생"
          >
            <button
              type="button"
              className={CONTROL}
              onClick={() => setPlaying((value) => !value)}
            >
              {playing ? (
                <Pause size={14} aria-hidden />
              ) : (
                <Play size={14} aria-hidden />
              )}
              {playing ? "일시정지" : "계속 재생"}
            </button>
            <button
              type="button"
              className={CONTROL}
              aria-label="이전 단계"
              onClick={() => move(-1)}
              disabled={index === 0}
            >
              <ChevronLeft size={16} aria-hidden />
            </button>
            <button
              type="button"
              className={CONTROL}
              aria-label="다음 단계"
              onClick={() => move(1)}
              disabled={last}
            >
              <ChevronRight size={16} aria-hidden />
            </button>
          </div>
          <span
            className="font-mono text-xs tabular-nums text-muted-foreground"
            data-testid="range-sum-step-count"
          >
            {index + 1} / {steps.length}
          </span>
        </div>
        <div
          role="progressbar"
          aria-valuemin={0}
          aria-valuenow={index + 1}
          aria-valuemax={steps.length}
          aria-label="시각화 진행률"
          className="h-1 overflow-hidden rounded-full bg-muted"
        >
          <div
            className="h-full rounded-full bg-primary"
            style={{ width: `${((index + 1) / steps.length) * 100}%` }}
          />
        </div>
        <div
          className="min-h-20 space-y-1 sm:min-h-14"
          aria-live={playing ? "off" : "polite"}
          aria-atomic="true"
        >
          <p className="text-sm font-semibold text-foreground">{step.title}</p>
          <p className="break-words text-xs leading-relaxed text-muted-foreground sm:text-sm">
            {step.detail}
          </p>
        </div>
      </section>

      <section className={CARD} aria-label="원본 배열">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-sm font-semibold">원본 배열 A</h3>
          <span className="rounded-md bg-muted px-2 py-1 font-mono text-xs">
            {task}
          </span>
        </div>
        <ValueStrip
          symbol="A"
          values={step.input}
          tone={(i) => {
            if (mode === "query" && RANGE.left <= i && i <= RANGE.right)
              return "range";
            if (prefixTarget === i + 1) return "range";
            if (mode === "update" && i === UPDATE.index) return "active";
            return "idle";
          }}
        />
      </section>

      <div className="grid gap-3 lg:grid-cols-2">
        <section className={CARD} aria-label="누적합">
          <h3 className="text-sm font-semibold">누적합 P</h3>
          <p className="text-xs text-muted-foreground">
            P[i]는 앞에서 i개 원소의 합
          </p>
          <ValueStrip
            symbol="P"
            values={step.prefix}
            tone={(i) => {
              if (step.activePrefix.includes(i)) return "active";
              if (prefixTarget === i + 1) return "range";
              if (
                step.changedPrefix.includes(i) ||
                (mode === "query" &&
                  step.prefixResult !== undefined &&
                  (i === RANGE.left || i === RANGE.right + 1))
              )
                return "done";
              return "idle";
            }}
          />
          {mode !== "build" && (
            <p
              className="rounded-md bg-muted/50 px-2 py-1.5 font-mono text-xs leading-relaxed"
              data-testid="prefix-summary"
            >
              {mode === "update" && (
                <span className="block">
                  갱신한 칸 {step.changedPrefix.length}개
                </span>
              )}
              {(mode === "query" || last) && (
                <span className="block">
                  P[{RANGE.right + 1}] − P[{RANGE.left}] ={" "}
                  <strong>{step.prefixResult ?? "—"}</strong>
                </span>
              )}
            </p>
          )}
        </section>

        <section className={CARD} aria-label="세그먼트 트리">
          <h3 className="text-sm font-semibold">세그먼트 트리</h3>
          <p className="text-xs text-muted-foreground">
            각 노드의 위는 구간, 아래는 그 구간의 합
          </p>
          <SegmentTree step={step} />
          {mode !== "build" && (
            <p
              className="rounded-md bg-muted/50 px-2 py-1.5 font-mono text-xs leading-relaxed"
              data-testid="tree-summary"
            >
              {mode === "update" && (
                <span className="block">
                  갱신한 노드 {step.changedNodes.length}개
                </span>
              )}
              {(mode === "query" || last) && (
                <span className="block">
                  {last ? "구간 합" : "지금까지 더한 합"} ={" "}
                  <strong>{step.treeResult ?? "—"}</strong>
                </span>
              )}
            </p>
          )}
        </section>
      </div>

      <div
        className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-muted-foreground"
        aria-label="강조 표시 범례"
      >
        <span>
          <i
            aria-hidden
            className="mr-1.5 inline-block size-2.5 rounded-sm border border-amber-500 bg-amber-500/15"
          />
          현재 단계
        </span>
        {mode !== "build" && (
          <span>
            <i
              aria-hidden
              className="mr-1.5 inline-block size-2.5 rounded-sm border border-emerald-500 bg-emerald-500/15"
            />
            {mode === "update" ? "갱신 완료" : "합에 사용"}
          </span>
        )}
        {mode === "query" && (
          <span>
            <i
              aria-hidden
              className="mr-1.5 inline-block size-2.5 rounded-sm border border-dashed border-muted-foreground"
            />
            범위 밖
          </span>
        )}
        {mode === "build" && (
          <span>
            <i
              aria-hidden
              className="mr-1.5 inline-block size-2.5 rounded-sm border border-primary/60 bg-primary/10"
            />
            계산에 사용하는 값
          </span>
        )}
      </div>
    </div>
  );
}
