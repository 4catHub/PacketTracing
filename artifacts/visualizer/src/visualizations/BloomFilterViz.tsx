import { useEffect, useId, useMemo, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowDown,
  Check,
  Code2,
  Database,
  Hash,
  Layers3,
  Pause,
  Play,
  Search,
  X,
} from "lucide-react";
import {
  BIT_COUNT,
  BLOOM_CODE,
  HASH_COUNT,
  PRODUCTS,
  SCENARIOS,
  generateBloomSteps,
  hashValue,
  positions,
  type BloomMode,
  type BloomStep,
} from "./bloom-filter-model";

const MODES = Object.keys(SCENARIOS) as BloomMode[];
const VERDICT = {
  pending: "판정 전",
  added: "삽입 완료",
  absent: "확실히 없음",
  maybe: "존재 가능",
};
const PHASE = {
  initial: "초기 상태",
  hash: "해시 계산",
  write: "비트 설정",
  check: "비트 검사",
  verdict: "필터 판정",
  cache: "캐시 조회",
  database: "DB 확인",
  response: "최종 응답",
};

function RedisContext({ step, mode }: { step: BloomStep; mode: BloomMode }) {
  const insert = mode === "insert";
  const pastVerdict = step.verdict !== "pending";
  const resolved = step.database === "found" || step.database === "not-found";
  const filterStatus = insert
    ? pastVerdict
      ? "반영 완료"
      : "비트 설정 중"
    : pastVerdict
      ? step.verdict === "absent"
        ? "0 · 미등록"
        : "1 · 존재 가능"
      : "판정 대기";
  const response =
    step.phase !== "response"
      ? "대기"
      : step.database === "found"
        ? "200 · 상품 반환"
        : "404 · 상품 없음";
  const rows = insert
    ? [
        {
          title: "Redis · BF.ADD",
          text: filterStatus,
          active: step.phase !== "initial",
          icon: Layers3,
        },
        {
          title: "상품 본문",
          text: "필터에 저장하지 않음",
          active: false,
          icon: Database,
        },
      ]
    : [
        {
          title: "Redis · BF.EXISTS",
          text: filterStatus,
          active: ["hash", "check", "verdict"].includes(step.phase),
          icon: Search,
        },
        {
          title: "Redis · GET 상품 캐시",
          text:
            step.database === "skipped"
              ? "생략"
              : step.cacheMiss
                ? "MISS · 이 예제의 가정"
                : "대기",
          active: step.phase === "cache",
          icon: Layers3,
        },
        {
          title: "DB · SELECT 상품",
          text:
            step.database === "skipped"
              ? "조회 생략"
              : resolved
                ? step.database === "found"
                  ? "실제 상품 있음"
                  : "상품 없음 · 오탐 확인"
                : "대기",
          active: step.phase === "database",
          icon: Database,
        },
        {
          title: "애플리케이션 응답",
          text: response,
          active: step.phase === "response",
          icon: step.database === "found" ? Check : ArrowDown,
        },
      ];
  return (
    <section
      className="rounded-xl border border-border bg-card p-4"
      aria-label="Redis 상품 조회 적용"
    >
      <div className="mb-3 flex items-center gap-2 text-sm font-semibold">
        <Database size={16} className="text-red-600 dark:text-red-400" />
        Redis 상품 조회 예제
      </div>
      <ol className="space-y-2">
        {rows.map(({ title, text, active, icon: Icon }, i) => (
          <li
            key={title}
            className={`flex items-center gap-3 rounded-lg border p-2.5 ${active ? "border-primary bg-primary/5" : "border-border"}`}
            aria-current={active ? "step" : undefined}
          >
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted">
              <Icon size={15} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-semibold">
                {String(i + 1).padStart(2, "0")} · {title}
              </p>
              <p
                className={`mt-0.5 text-xs ${active ? "font-semibold text-foreground" : "text-muted-foreground"}`}
              >
                {text}
              </p>
            </div>
          </li>
        ))}
      </ol>
      <p className="mt-3 text-[11px] leading-relaxed text-muted-foreground">
        {insert
          ? "삽입 모드는 필터의 비트 변화만 추적. DB와의 반영 순서는 아래 운영 조건 참고."
          : "전체 상품 ID가 반영된 최신·정상 필터 가정. 캐시 HIT 시에는 DB 조회 없이 반환 가능."}
      </p>
    </section>
  );
}

export default function BloomFilterViz() {
  const [mode, setMode] = useState<BloomMode>("insert");
  const [stepIndex, setStepIndex] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [speed, setSpeed] = useState(45);
  const reduced = useReducedMotion();
  const markerId = useId();
  const steps = useMemo(() => generateBloomSteps(mode), [mode]);
  const step = steps[stepIndex];
  const scenario = SCENARIOS[mode];
  const indexes = positions(scenario.item);
  const bit = step.lane === null ? null : indexes[step.lane];
  const final = stepIndex === steps.length - 1;
  const duration = 2300 - speed * 17;

  useEffect(() => {
    if (!playing) return;
    const timer = window.setTimeout(
      () => setStepIndex((i) => (i + 1) % steps.length),
      final ? Math.max(duration, 2800) : duration,
    );
    return () => window.clearTimeout(timer);
  }, [playing, duration, final, stepIndex, steps.length, mode]);

  function selectMode(next: BloomMode) {
    setMode(next);
    setStepIndex(0);
    setPlaying(true);
  }

  return (
    <div className="space-y-4" data-testid="bloom-filter-viz">
      <div
        className="grid grid-cols-2 gap-2 sm:grid-cols-4"
        role="group"
        aria-label="블룸 필터 시나리오"
      >
        {MODES.map((item) => (
          <button
            type="button"
            key={item}
            onClick={() => selectMode(item)}
            aria-pressed={mode === item}
            className={`rounded-xl border px-3 py-2.5 text-left transition-colors ${mode === item ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card text-muted-foreground hover:bg-muted"}`}
          >
            <span className="block text-xs font-bold">
              {SCENARIOS[item].label}
            </span>
            <span className="mt-1 block font-mono text-[10px] opacity-80">
              {SCENARIOS[item].item}
            </span>
          </button>
        ))}
      </div>

      <div className="rounded-xl border border-border bg-card px-3 py-2.5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPlaying((value) => !value)}
              className="flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground"
            >
              {playing ? <Pause size={12} /> : <Play size={12} />}
              {playing ? "일시정지" : "계속 재생"}
            </button>
            <span className="text-[11px] text-muted-foreground">자동 반복</span>
          </div>
          <label className="flex items-center gap-2 text-[11px] text-muted-foreground">
            재생 속도
            <input
              aria-label="재생 속도"
              type="range"
              min="0"
              max="100"
              value={speed}
              onChange={(event) => setSpeed(Number(event.target.value))}
              className="w-24 accent-primary"
            />
          </label>
        </div>
        <label className="mt-3 flex items-center gap-3 text-[11px] text-muted-foreground">
          <span className="shrink-0 tabular-nums">
            단계 {stepIndex + 1} / {steps.length}
          </span>
          <input
            aria-label="단계 탐색"
            type="range"
            min="0"
            max={steps.length - 1}
            value={stepIndex}
            onChange={(event) => {
              setPlaying(false);
              setStepIndex(Number(event.target.value));
            }}
            className="h-1 w-full min-w-0 accent-primary"
          />
        </label>
      </div>

      <div className="grid gap-4 lg:grid-cols-12">
        <section
          className="min-w-0 overflow-hidden rounded-2xl border border-border bg-card lg:col-span-7"
          aria-label="해시와 비트 배열"
        >
          <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-3">
            <span className="flex items-center gap-2 text-sm font-semibold">
              <Hash size={16} />
              {mode === "insert" ? "비트 설정" : "비트 검사"}
            </span>
            <span className="font-mono text-[11px] text-muted-foreground">
              m = {BIT_COUNT} · k = {HASH_COUNT}
            </span>
          </div>
          <div className="p-4">
            <div className="mx-auto w-fit rounded-xl border-2 border-primary/50 bg-background px-5 py-2 text-center">
              <span className="block text-[10px] text-muted-foreground">
                {mode === "insert" ? "ADD · 입력 ID" : "EXISTS · 조회 ID"}
              </span>
              <span className="font-mono text-base font-bold">
                {scenario.item}
              </span>
            </div>
            <svg
              viewBox="0 0 600 45"
              className="h-10 w-full"
              aria-hidden="true"
            >
              <defs>
                <marker
                  id={markerId}
                  markerWidth="6"
                  markerHeight="6"
                  refX="5"
                  refY="3"
                  orient="auto"
                >
                  <path d="M0,0 L6,3 L0,6" fill="currentColor" />
                </marker>
              </defs>
              {indexes.map((_, i) => (
                <g
                  key={i}
                  className={
                    step.lane === i
                      ? "text-primary"
                      : "text-muted-foreground/30"
                  }
                >
                  <path
                    d={`M300 0 V14 H${100 + i * 200} V39`}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={step.lane === i ? 2.5 : 1.5}
                    markerEnd={`url(#${markerId})`}
                  />
                  {step.phase === "hash" && step.lane === i && !reduced && (
                    <motion.circle
                      key={`${mode}-${stepIndex}`}
                      r="4"
                      fill="currentColor"
                      initial={{ cx: 300, cy: 0 }}
                      animate={{
                        cx: [300, 300, 100 + i * 200, 100 + i * 200],
                        cy: [0, 14, 14, 36],
                      }}
                      transition={{ duration: 0.45 }}
                    />
                  )}
                </g>
              ))}
            </svg>
            <div className="grid grid-cols-3 gap-2">
              {indexes.map((index, i) => (
                <div
                  key={i}
                  className={`min-w-0 rounded-lg border-2 px-1.5 py-2 text-center ${step.lane === i ? "border-primary bg-primary/5" : "border-border bg-background"}`}
                >
                  <p className="font-mono text-xs font-bold">h{i + 1}</p>
                  <p className="mt-1 break-all font-mono text-[9px] text-muted-foreground">
                    {hashValue(scenario.item, i)} % 24
                  </p>
                  <p className="mt-1 flex items-center justify-center gap-1 font-mono text-xs">
                    <ArrowDown size={11} />
                    index <strong>{index}</strong>
                  </p>
                </div>
              ))}
            </div>
            <div className="my-3 flex items-center justify-center gap-2 text-[10px] text-muted-foreground">
              <ArrowDown size={13} />
              {mode === "insert"
                ? "해당 위치를 1로 설정"
                : "같은 위치의 비트를 검사"}
            </div>
            <div
              className="grid grid-cols-8 gap-1.5"
              role="group"
              aria-label="24비트 배열"
            >
              {step.bits.map((value, index) => {
                const active = bit === index;
                const checked = step.checked.includes(index);
                const lanes = indexes.flatMap((position, lane) =>
                  position === index ? [`h${lane + 1}`] : [],
                );
                return (
                  <div key={index} className="min-w-0 text-center">
                    <span className="block font-mono text-[10px] text-muted-foreground">
                      {index}
                    </span>
                    <motion.div
                      animate={{
                        scale:
                          active && step.phase === "write" && !reduced
                            ? [1, 1.08, 1]
                            : 1,
                      }}
                      transition={{ duration: reduced ? 0 : 0.3 }}
                      className={`relative mt-1 flex h-10 items-center justify-center rounded-md border-2 font-mono text-base font-bold ${active ? (value ? "border-amber-500 bg-amber-500/10 text-amber-800 dark:text-amber-200" : "border-rose-500 bg-rose-500/10 text-rose-700 dark:text-rose-300") : checked ? "border-primary bg-primary/10 text-foreground" : value ? "border-border bg-muted text-foreground" : "border-border bg-background text-muted-foreground"}`}
                      aria-label={`인덱스 ${index}: ${value}${active ? ", 현재 위치" : ""}`}
                    >
                      {value}
                      {active && (
                        <span className="absolute -right-1 -top-1 rounded-sm bg-foreground px-0.5 text-[7px] leading-3 text-background">
                          현재
                        </span>
                      )}
                    </motion.div>
                    <span
                      className={`mt-1 block h-3 font-mono text-[8px] ${lanes.length ? "font-bold text-primary" : "text-transparent"}`}
                    >
                      {lanes.join("·") || "—"}
                    </span>
                  </div>
                );
              })}
            </div>
            <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1 border-t border-border pt-3 text-[10px] text-muted-foreground">
              <span>■ 1: 설정됨</span>
              <span>□ 0: 비어 있음</span>
              <span className="text-amber-700 dark:text-amber-300">
                현재: 검사·설정 위치
              </span>
              <span className="text-primary">테두리: 처리 완료</span>
            </div>
            <div className="mt-3 rounded-lg border border-border bg-background p-3 text-[11px]">
              <p className="font-semibold">필터에 반영한 ID · 설명용 목록</p>
              <p className="mt-1 break-words font-mono text-muted-foreground">
                {[
                  ...PRODUCTS,
                  ...(step.verdict === "added" ? [scenario.item] : []),
                ]
                  .map((id) => id.replace("product:", "#"))
                  .join(" · ")}
              </p>
              <p className="mt-1 text-muted-foreground">
                실제 블룸 필터는 이 원문 목록을 보관하지 않음
              </p>
            </div>
          </div>
        </section>

        <div className="min-w-0 space-y-4 lg:col-span-5">
          <section
            className="rounded-xl border border-border bg-card p-4"
            aria-label="현재 연산 상태"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-semibold">{PHASE[step.phase]}</span>
              <span
                className={`rounded-md border px-2 py-1 text-xs font-bold ${step.verdict === "absent" ? "border-rose-500/40 text-rose-700 dark:text-rose-300" : step.verdict === "maybe" ? "border-amber-500/40 text-amber-700 dark:text-amber-300" : "border-border text-foreground"}`}
              >
                {step.verdict === "pending" ? "판정 전" : VERDICT[step.verdict]}
              </span>
            </div>
            <p
              className="mt-3 min-h-[65px] text-sm leading-relaxed"
              aria-live={playing ? "off" : "polite"}
            >
              {step.message}
            </p>
            <div className="mt-3 grid grid-cols-3 gap-2 border-t border-border pt-3 text-center">
              {[
                ["현재 index", bit ?? "—"],
                ["읽기·설정", `${step.checked.length} / 3`],
                ["1인 비트", `${step.bits.filter(Boolean).length} / 24`],
              ].map(([label, value]) => (
                <div key={label} className="rounded-lg bg-muted p-2">
                  <p className="text-[9px] text-muted-foreground">{label}</p>
                  <p className="mt-1 font-mono text-sm font-bold">{value}</p>
                </div>
              ))}
            </div>
          </section>

          <section
            className="overflow-hidden rounded-xl border border-border bg-card"
            aria-label="블룸 필터 핵심 코드"
          >
            <div className="flex items-center gap-2 border-b border-border px-4 py-2.5 text-xs font-semibold">
              <Code2 size={14} />
              핵심 의사코드{" "}
              <span className="ml-auto text-[10px] font-normal text-muted-foreground">
                {step.codeLine ? `L${step.codeLine}` : "외부 처리"}
              </span>
            </div>
            <div className="overflow-x-auto py-2 font-mono text-[10px] leading-6">
              {BLOOM_CODE.map((line, i) => (
                <div
                  key={line}
                  aria-current={step.codeLine === i + 1 ? "step" : undefined}
                  className={`flex min-w-[275px] border-l-2 px-3 ${step.codeLine === i + 1 ? "border-amber-500 bg-amber-500/10 font-semibold text-foreground" : "border-transparent text-muted-foreground"}`}
                >
                  <span className="mr-3 w-3 shrink-0 select-none opacity-60">
                    {i + 1}
                  </span>
                  <code className="whitespace-pre">{line}</code>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>

      <div className="grid items-start gap-4 sm:grid-cols-2">
        <RedisContext step={step} mode={mode} />
        <section
          className="rounded-xl border border-border bg-card p-4"
          aria-label="해시 충돌 근거"
        >
          <h3 className="text-sm font-semibold">
            {mode === "false-positive"
              ? "왜 506이 존재 가능일까?"
              : mode === "insert"
                ? "같은 비트는 덮어써도 1"
                : "비교 기준은 실제 상품 집합"}
          </h3>
          <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
            {scenario.summary}
          </p>
          <div className="mt-3 space-y-2">
            {indexes.map((index, lane) => {
              const owners = PRODUCTS.filter((item) =>
                positions(item).includes(index),
              ).map((item) => item.replace("product:", "#"));
              return (
                <div
                  key={lane}
                  className={`flex items-center justify-between gap-2 rounded-lg border p-2 text-[11px] ${step.lane === lane ? "border-primary" : "border-border"}`}
                >
                  <span className="shrink-0 font-mono font-bold">
                    h{lane + 1} → [{index}]
                  </span>
                  <span className="text-right text-muted-foreground">
                    {owners.length
                      ? `${owners.join("·")}이 설정`
                      : "초기 필터에서 0"}
                  </span>
                </div>
              );
            })}
          </div>
          <p className="mt-3 flex items-start gap-1.5 text-[11px] leading-relaxed text-muted-foreground">
            {mode === "false-positive" ? (
              <X size={13} className="mt-0.5 shrink-0" />
            ) : (
              <Check size={13} className="mt-0.5 shrink-0" />
            )}
            {mode === "false-positive"
              ? "506은 반영한 ID 목록에 없음. 모두 1인 이유는 202와 101의 비트 공유."
              : "각 시나리오는 상품 101·202·303만 반영된 상태에서 시작."}
          </p>
        </section>
      </div>
      <p className="text-[11px] leading-relaxed text-muted-foreground">
        교육용 24비트·3해시 모델. 실제 Redis의 해시·메모리 배치를 재현하지 않음.
        단계 막대를 움직이면 일시정지하고 해당 상태를 확인할 수 있음.
      </p>
    </div>
  );
}
