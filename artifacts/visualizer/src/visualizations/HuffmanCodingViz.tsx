import { useEffect, useMemo, useState } from "react";
import { Pause, Play } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { buildHuffman, type HuffmanNode } from "./huffman-model";
import { CODE, makeSteps } from "./huffman-steps";

const presets = [
  { label: "기본 예제", value: "ABRACADABRA" },
  { label: "균등 빈도", value: "ABCDABCD" },
  { label: "단일 문자", value: "AAAAAA" },
  { label: "빈 입력", value: "" },
];
function Tree({
  roots,
  active,
  path,
}: {
  roots: HuffmanNode[];
  active: number[];
  path: number[];
}) {
  const reduced = useReducedMotion();
  let next = 0,
    maxDepth = 0;
  const points: { n: HuffmanNode; x: number; y: number }[] = [];
  const edges: {
    x1: number;
    y1: number;
    x2: number;
    y2: number;
    bit: string;
    on: boolean;
  }[] = [];
  function place(n: HuffmanNode, depth: number): number {
    maxDepth = Math.max(maxDepth, depth);
    let x: number;
    if (!n.left && !n.right) {
      x = 50 + next * 78;
      next++;
    } else {
      const a = n.left ? place(n.left, depth + 1) : 0;
      const b = n.right ? place(n.right, depth + 1) : a;
      x = (a + b) / 2;
    }
    if (roots.length === 1 && n.symbol !== undefined && depth === 0) x = 180;
    const y = 32 + depth * 76;
    points.push({ n, x, y });
    for (const [child, bit] of [
      [n.left, "0"],
      [n.right, "1"],
    ] as const) {
      if (child) {
        const p = points.find((p) => p.n.id === child.id)!;
        edges.push({
          x1: x,
          y1: y,
          x2: p.x,
          y2: p.y,
          bit,
          on: path.includes(n.id) && path.includes(child.id),
        });
      }
    }
    return x;
  }
  roots.forEach((n, i) => {
    if (i) next += 0.35;
    place(n, 0);
  });
  const width = Math.max(360, Math.ceil(next * 78 + 35)),
    height = Math.max(100, 72 + maxDepth * 76);
  return (
    <div className="overflow-x-auto">
      <motion.svg
        key={roots.map((n) => n.id).join(",")}
        initial={{ opacity: reduced ? 1 : 0.55 }}
        animate={{ opacity: 1 }}
        transition={{ duration: reduced ? 0 : 0.35 }}
        role="img"
        aria-label="허프만 트리와 병합된 서브트리"
        viewBox={`0 0 ${width} ${height}`}
        className="mx-auto block"
        style={{ width: "100%", minWidth: width, maxWidth: 680, height: 350 }}
      >
        {edges.map((e, i) => (
          <g key={i}>
            <line
              x1={e.x1}
              y1={e.y1 + 25}
              x2={e.x2}
              y2={e.y2 - 25}
              stroke={e.on ? "#2563eb" : "#94a3b8"}
              strokeWidth={e.on ? 3 : 1.5}
            />
            <rect
              x={(e.x1 + e.x2) / 2 - 8}
              y={(e.y1 + e.y2) / 2 - 9}
              width="16"
              height="18"
              rx="4"
              className="fill-card"
            />
            <text
              x={(e.x1 + e.x2) / 2}
              y={(e.y1 + e.y2) / 2 + 4}
              textAnchor="middle"
              className="fill-foreground"
              fontSize="14"
            >
              {e.bit}
            </text>
          </g>
        ))}
        {points.map(({ n, x, y }) => (
          <g key={n.id} transform={`translate(${x},${y})`}>
            <circle
              r="25"
              className={
                active.includes(n.id)
                  ? "fill-amber-500/20 stroke-amber-500"
                  : path.includes(n.id)
                    ? "fill-blue-500/20 stroke-blue-500"
                    : "fill-card stroke-slate-400 dark:stroke-slate-600"
              }
              strokeWidth="2"
            />
            <text
              textAnchor="middle"
              y="-2"
              className="fill-foreground"
              fontWeight="bold"
              fontSize="16"
            >
              {n.symbol ?? "Σ"}
            </text>
            <text
              textAnchor="middle"
              y="14"
              className="fill-muted-foreground"
              fontSize="13"
            >
              {n.weight}
            </text>
          </g>
        ))}
      </motion.svg>
    </div>
  );
}
export default function HuffmanCodingViz() {
  const reduced = useReducedMotion();
  const [input, setInput] = useState(presets[0].value),
    [index, setIndex] = useState(0),
    [playing, setPlaying] = useState(true),
    [speed, setSpeed] = useState(45);
  const steps = useMemo(() => makeSteps(input), [input]),
    model = useMemo(() => buildHuffman(input), [input]);
  const step = steps[index],
    final = index === steps.length - 1,
    delay = 2200 - speed * 16;
  useEffect(() => {
    if (!playing || steps.length < 2) return;
    const timer = window.setTimeout(
      () => setIndex((i) => (i + 1) % steps.length),
      final ? Math.max(delay, 2800) : delay,
    );
    return () => window.clearTimeout(timer);
  }, [playing, index, steps.length, delay, final]);
  const choose = (value: string) => {
    setInput(value);
    setIndex(0);
    setPlaying(true);
  };
  const beforeTree = [
    "시작",
    "빈도 집계",
    "큐 초기화",
    "두 노드 선택",
    "큐에서 추출",
    "부모 생성",
    "재삽입",
  ].includes(step.phase);
  const roots =
    step.phase === "부모 생성" && step.tree
      ? [...step.queue, step.tree]
      : beforeTree
        ? [...step.queue, ...step.selected]
        : step.tree
          ? [step.tree]
          : [];
  const symbols = Object.keys(model.frequencies).sort(),
    fixed =
      symbols.length > 1
        ? input.length * Math.ceil(Math.log2(symbols.length))
        : null;
  const stages = [
    { label: "빈도 집계", phases: ["시작", "빈도 집계"] },
    {
      label: "트리 병합",
      phases: [
        "큐 초기화",
        "두 노드 선택",
        "큐에서 추출",
        "부모 생성",
        "재삽입",
        "트리 완성",
      ],
    },
    { label: "코드 생성", phases: ["코드 생성"] },
    { label: "인코딩", phases: ["인코딩"] },
    {
      label: "디코딩",
      phases: ["디코딩 준비", "디코딩", "리프 도착", "복원 완료"],
    },
  ];
  const currentStage = stages.findIndex((stage) =>
    stage.phases.includes(step.phase),
  );
  const seek = (next: number) => {
    setPlaying(false);
    setIndex(next);
  };
  const focusSymbol = step.cursor >= 0 ? input[step.cursor] : undefined;
  const panel = "rounded-2xl border border-border bg-card";
  return (
    <div
      className="space-y-5 text-sm leading-relaxed"
      data-testid="huffman-viz"
    >
      <div
        className="grid grid-cols-2 gap-2 sm:grid-cols-4"
        role="group"
        aria-label="예제 선택"
      >
        {presets.map((p) => (
          <button
            type="button"
            key={p.label}
            aria-pressed={input === p.value}
            onClick={() => choose(p.value)}
            className={`rounded-xl border px-4 py-3 text-left transition-colors ${input === p.value ? "border-primary bg-primary/10 text-foreground ring-1 ring-primary" : "border-border bg-card text-muted-foreground hover:bg-muted"}`}
          >
            <span className="block text-sm font-semibold">{p.label}</span>
            <span className="mt-1 block font-mono text-xs">
              {p.value || "입력 없음"}
            </span>
          </button>
        ))}
      </div>
      <section
        className={`${panel} overflow-hidden`}
        aria-label="허프만 학습 장면"
      >
        <nav
          className="grid grid-cols-5 border-b border-border"
          aria-label="과정 바로가기"
        >
          {stages.map((stage, i) => {
            const first = steps.findIndex((s) =>
              stage.phases.includes(s.phase),
            );
            return (
              <button
                type="button"
                key={stage.label}
                disabled={first < 0}
                onClick={() => seek(first)}
                aria-current={currentStage === i ? "step" : undefined}
                className={`min-w-0 border-b-2 px-1 py-3 text-center disabled:opacity-35 sm:px-3 ${currentStage === i ? "border-primary bg-primary/5 font-semibold text-primary" : "border-transparent text-muted-foreground hover:bg-muted"}`}
              >
                <span className="block text-xs tabular-nums opacity-70">
                  0{i + 1}
                </span>
                <span className="mt-0.5 block text-xs sm:text-sm">
                  {stage.label}
                </span>
              </button>
            );
          })}
        </nav>
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3 sm:px-5">
          <div className="flex items-center gap-3">
            <button
              type="button"
              disabled={steps.length < 2}
              onClick={() => setPlaying(!playing)}
              className="flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground disabled:opacity-40"
            >
              {playing && steps.length > 1 ? (
                <Pause size={15} />
              ) : (
                <Play size={15} />
              )}{" "}
              {playing && steps.length > 1 ? "일시정지" : "계속 재생"}
            </button>
            <span className="text-xs tabular-nums text-muted-foreground">
              {index + 1} / {steps.length} 단계
            </span>
          </div>
          <label className="flex items-center gap-2 text-xs text-muted-foreground">
            재생 속도
            <input
              aria-label="재생 속도"
              type="range"
              min="0"
              max="100"
              value={speed}
              onChange={(e) => setSpeed(+e.target.value)}
              className="w-24 accent-primary"
            />
          </label>
          <input
            aria-label="단계 탐색"
            type="range"
            min="0"
            max={steps.length - 1}
            value={index}
            onChange={(e) => seek(+e.target.value)}
            className="block h-1.5 w-full accent-primary"
          />
        </div>
        <div className="grid lg:grid-cols-[minmax(0,1.7fr)_minmax(260px,1fr)]">
          <div className="min-w-0 border-b border-border lg:border-b-0 lg:border-r">
            <div className="flex items-center justify-between gap-3 px-4 pt-5 sm:px-5">
              <h3 className="text-base font-semibold">
                {beforeTree ? "빈도에서 트리로" : "허프만 트리"}
              </h3>
              <span className="text-xs text-muted-foreground">
                왼쪽 0 · 오른쪽 1
              </span>
            </div>
            <div
              className="flex min-h-[90px] flex-wrap items-center gap-2 px-4 py-3 sm:px-5"
              aria-label="문자 빈도"
            >
              {symbols.map((c) => (
                <div
                  key={c}
                  className={`flex items-center gap-2 rounded-lg border px-3 py-1.5 ${c === focusSymbol ? "border-amber-500 bg-amber-500/10" : "border-border bg-muted/40"}`}
                >
                  <span className="font-mono text-base font-semibold">{c}</span>
                  <span className="text-sm tabular-nums text-muted-foreground">
                    × {step.counts[c] || 0}
                  </span>
                </div>
              ))}
              {!input && (
                <span className="text-muted-foreground">
                  집계할 문자가 없습니다.
                </span>
              )}
            </div>
            <div
              className="flex h-[360px] items-center overflow-hidden bg-background px-3 sm:h-[430px] sm:px-5"
              data-testid="huffman-tree-scene"
            >
              {roots.length ? (
                <div className="w-full min-w-0">
                  <Tree roots={roots} active={step.active} path={step.path} />
                </div>
              ) : (
                <div className="w-full px-4 text-center">
                  <span className="mb-3 block font-mono text-4xl font-semibold text-muted-foreground/40">
                    {input ? "Σ" : "∅"}
                  </span>
                  <p className="font-medium">
                    {input
                      ? "문자 빈도를 세고 있습니다"
                      : "빈 입력에는 트리가 없습니다"}
                  </p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {input
                      ? "집계가 끝나면 리프 노드를 큐에 등록합니다."
                      : "다른 예제를 선택해 압축 과정을 확인하세요."}
                  </p>
                </div>
              )}
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-1 border-t border-border px-4 py-3 text-xs text-muted-foreground sm:px-5">
              <span>기호: 리프 노드</span>
              <span>Σ: 빈도 합계</span>
              <span className="text-amber-700 dark:text-amber-300">
                선택: 주황 테두리
              </span>
              <span className="text-primary">탐색: 파란 경로</span>
            </div>
          </div>
          <aside
            className="min-w-0 space-y-5 p-4 sm:p-5"
            aria-label="현재 연산과 코드표"
          >
            <div className="min-h-[124px]">
              <p className="text-xs font-semibold tracking-wide text-primary">
                현재 연산
              </p>
              <h3 className="mt-1 text-xl font-semibold tracking-tight">
                {step.phase}
              </h3>
              <p
                className="mt-2 min-h-[52px] text-sm leading-7 text-muted-foreground"
                aria-live={playing ? "off" : "polite"}
              >
                {step.message}
              </p>
            </div>
            <div
              className="min-h-[105px] rounded-xl border border-border bg-background p-3"
              aria-label="우선순위 큐"
            >
              <p className="mb-2 text-xs font-semibold text-muted-foreground">
                큐 · 빈도 오름차순
              </p>
              <div className="flex flex-wrap gap-1.5">
                {step.queue.map((n) => (
                  <span
                    key={n.id}
                    className={`rounded-md border px-2 py-1 text-sm ${step.active.includes(n.id) ? "border-amber-500 bg-amber-500/10" : "border-border"}`}
                  >
                    <span className="font-mono font-semibold">
                      {n.symbol ?? "Σ"}
                    </span>
                    <span className="ml-1.5 tabular-nums">{n.weight}</span>
                  </span>
                ))}
                {!step.queue.length && (
                  <span className="text-sm text-muted-foreground">
                    {input ? "등록 대기" : "비어 있음"}
                  </span>
                )}
              </div>
            </div>
            <div className="min-h-[64px]" aria-label="병합 연산">
              {step.selected.length === 2 ? (
                <motion.div
                  key={`${step.phase}-${step.selected[0].id}`}
                  initial={{ opacity: reduced ? 1 : 0.4 }}
                  animate={{ opacity: 1 }}
                  className="rounded-lg border border-amber-500/40 bg-amber-500/5 px-3 py-2"
                >
                  <p className="text-xs text-muted-foreground">
                    선택한 두 빈도의 합
                  </p>
                  <p className="mt-1 font-mono text-lg font-semibold">
                    {step.selected[0].weight} + {step.selected[1].weight} →{" "}
                    {step.phase === "부모 생성" && step.tree
                      ? step.tree.weight
                      : "대기"}
                  </p>
                </motion.div>
              ) : (
                <p className="text-xs leading-6 text-muted-foreground">
                  {symbols.length === 1
                    ? "단일 기호는 코드 0을 사용합니다."
                    : "동률이면 최소 문자, 생성 순서로 선택합니다."}
                </p>
              )}
            </div>
            <div>
              <h3 className="mb-2 text-sm font-semibold">코드표</h3>
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-border text-xs text-muted-foreground">
                    <th className="pb-2 font-medium">기호</th>
                    <th className="pb-2 font-medium">빈도</th>
                    <th className="pb-2 font-medium">코드</th>
                    <th className="pb-2 text-right font-medium">비트</th>
                  </tr>
                </thead>
                <tbody>
                  {symbols.map((c) => (
                    <tr
                      key={c}
                      className={`border-b border-border/50 ${c === focusSymbol ? "bg-amber-500/10" : ""}`}
                    >
                      <td className="py-2 font-mono font-semibold">{c}</td>
                      <td className="tabular-nums">{model.frequencies[c]}</td>
                      <td className="font-mono tracking-wide">
                        {step.codes[c] ?? "—"}
                      </td>
                      <td className="text-right tabular-nums">
                        {step.codes[c]
                          ? model.frequencies[c] * step.codes[c].length
                          : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </aside>
        </div>
      </section>
      <section className={`${panel} p-4 sm:p-5`} aria-label="인코딩과 복원">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h3 className="text-base font-semibold">
            문자에서 비트로, 다시 문자로
          </h3>
          {step.phase === "복원 완료" && (
            <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
              복원 일치
            </span>
          )}
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          {[
            { title: "01 원문", value: input, kind: "input" },
            {
              title: `02 압축 본문 · ${step.bits.length}비트`,
              value: step.bits,
              kind: "bits",
            },
            {
              title: `03 복원 · ${step.decoded.length}자`,
              value: step.decoded,
              kind: "output",
            },
          ].map((item) => (
            <div
              key={item.kind}
              className="min-w-0 rounded-xl border border-border bg-background p-3"
            >
              <p className="mb-3 text-xs font-medium text-muted-foreground">
                {item.title}
              </p>
              <div className="min-h-[64px] break-all font-mono text-base leading-8 tracking-wide">
                {item.value ? (
                  [...item.value].map((c, i) => (
                    <span
                      key={i}
                      className={
                        (item.kind === "input" && step.cursor === i) ||
                        (item.kind === "bits" && step.bitCursor === i)
                          ? "rounded bg-amber-500/25 px-0.5 font-bold"
                          : ""
                      }
                    >
                      {c}
                    </span>
                  ))
                ) : (
                  <span className="text-muted-foreground">—</span>
                )}
              </div>
            </div>
          ))}
        </div>
        <p className="mt-3 text-xs leading-6 text-muted-foreground">
          비트열에는 문자 사이 구분자가 없습니다. 트리의 리프에 도착할 때 한
          글자가 복원됩니다.
        </p>
      </section>
      <div className="grid gap-4 md:grid-cols-2">
        <section className={`${panel} p-4 sm:p-5`}>
          <h3 className="text-base font-semibold">본문 크기 비교</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            코드북과 패딩을 제외한 논리적 비트 수
          </p>
          <div className="mt-4 space-y-3">
            {[
              { label: "UTF-8 원문", value: input.length * 8 },
              { label: "고정 길이 코드", value: fixed },
              { label: "허프만 코드", value: model.bits.length },
            ].map((row, i) => (
              <div key={row.label}>
                <div className="mb-1.5 flex justify-between gap-2 text-sm">
                  <span>{row.label}</span>
                  <strong className="tabular-nums">
                    {row.value === null ? "별도 처리" : `${row.value}비트`}
                  </strong>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-muted">
                  <div
                    className={`h-full rounded-full ${i === 2 ? "bg-primary" : "bg-muted-foreground/35"}`}
                    style={{
                      width: `${input.length && row.value !== null ? (100 * row.value) / (input.length * 8) : 0}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
          <p className="mt-4 text-xs leading-6 text-muted-foreground">
            허프만 본문 저장에 최소 {Math.ceil(model.bits.length / 8)}바이트
            필요. 실제 파일에는 트리·코드북과 길이 정보 등이 추가됩니다.
          </p>
        </section>
        <section className={`${panel} p-4 sm:p-5`}>
          <h3 className="text-base font-semibold">실제 압축에서의 역할</h3>
          <div className="mt-3 space-y-4 text-sm">
            <div>
              <strong className="font-semibold">DEFLATE · gzip · PNG</strong>
              <p className="mt-1 leading-6 text-muted-foreground">
                LZ77로 반복 구간을 표현한 뒤, 리터럴·길이·거리 기호를 허프만
                코드로 부호화합니다.
              </p>
            </div>
            <div className="border-t border-border pt-3">
              <strong className="font-semibold">베이스라인 JPEG</strong>
              <p className="mt-1 leading-6 text-muted-foreground">
                양자화한 계수의 기호를 부호화합니다. 허프만 단계는 무손실이며
                양자화의 손실과 구분합니다.
              </p>
            </div>
          </div>
        </section>
      </div>
      <details className={`${panel} overflow-hidden`}>
        <summary className="cursor-pointer px-4 py-4 text-sm font-semibold sm:px-5">
          핵심 의사코드 보기{" "}
          <span className="ml-2 font-normal text-muted-foreground">
            현재 {step.line ? `${step.line}행` : "대기"}
          </span>
        </summary>
        <div className="overflow-x-auto border-t border-border py-3 font-mono text-xs leading-7 sm:text-sm">
          {CODE.map((line, i) => (
            <div
              key={line}
              className={`flex min-w-[480px] border-l-2 px-4 ${step.line === i + 1 ? "border-primary bg-primary/10 font-semibold" : "border-transparent text-muted-foreground"}`}
            >
              <span className="mr-4 w-5 shrink-0 text-right opacity-60">
                {i + 1}
              </span>
              <code className="whitespace-pre">{line}</code>
            </div>
          ))}
        </div>
      </details>
    </div>
  );
}
