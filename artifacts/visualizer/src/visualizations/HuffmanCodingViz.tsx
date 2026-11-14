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
        style={{ width: "100%", minWidth: width }}
      >
        {edges.map((e, i) => (
          <g key={i}>
            <line
              x1={e.x1}
              y1={e.y1 + 17}
              x2={e.x2}
              y2={e.y2 - 17}
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
              fontSize="11"
            >
              {e.bit}
            </text>
          </g>
        ))}
        {points.map(({ n, x, y }) => (
          <g key={n.id} transform={`translate(${x},${y})`}>
            <circle
              r="21"
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
              y="-1"
              className="fill-foreground"
              fontWeight="bold"
              fontSize="12"
            >
              {n.symbol ?? "Σ"}
            </text>
            <text
              textAnchor="middle"
              y="13"
              className="fill-muted-foreground"
              fontSize="10"
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
  return (
    <div className="space-y-4" data-testid="huffman-viz">
      <div
        className="grid grid-cols-2 gap-2 sm:grid-cols-4"
        role="group"
        aria-label="예제 선택"
      >
        {presets.map((p) => (
          <button
            key={p.label}
            aria-pressed={input === p.value}
            onClick={() => choose(p.value)}
            className={`rounded-xl border p-3 text-left ${input === p.value ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card"}`}
          >
            <span className="block text-xs font-bold">{p.label}</span>
            <span className="font-mono text-[10px] opacity-75">
              {p.value || "입력 없음"}
            </span>
          </button>
        ))}
      </div>
      <div className="rounded-xl border border-border bg-card p-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <button
            onClick={() => setPlaying(!playing)}
            className="flex items-center gap-1 rounded-md bg-primary px-3 py-2 text-xs text-primary-foreground"
          >
            {playing ? <Pause size={13} /> : <Play size={13} />}{" "}
            {playing ? "일시정지" : "계속 재생"}
          </button>
          <label className="text-xs text-muted-foreground">
            재생 속도{" "}
            <input
              aria-label="재생 속도"
              type="range"
              value={speed}
              min="0"
              max="100"
              onChange={(e) => setSpeed(+e.target.value)}
              className="accent-primary"
            />
          </label>
        </div>
        <label className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
          단계 {index + 1} / {steps.length}
          <input
            aria-label="단계 탐색"
            type="range"
            min="0"
            max={steps.length - 1}
            value={index}
            onChange={(e) => {
              setPlaying(false);
              setIndex(+e.target.value);
            }}
            className="min-w-0 flex-1 accent-primary"
          />
        </label>
      </div>
      <section className="rounded-xl border border-border bg-card p-4">
        <div className="flex flex-wrap justify-between gap-2">
          <strong className="text-sm">{step.phase}</strong>
          <span className="text-xs text-muted-foreground">
            입력 {input.length}자 · 기호 {symbols.length}종
          </span>
        </div>
        <p
          className="mt-2 min-h-10 text-sm"
          aria-live={playing ? "off" : "polite"}
        >
          {step.message}
        </p>
        <div className="mt-3 flex flex-wrap gap-1">
          {[...input].map((c, i) => (
            <span
              key={i}
              className={`flex h-8 w-8 items-center justify-center rounded border font-mono text-sm ${step.cursor === i ? "border-amber-500 bg-amber-500/15" : "border-border bg-muted"}`}
            >
              {c}
            </span>
          ))}
          {!input && (
            <span className="text-xs text-muted-foreground">입력 없음</span>
          )}
        </div>
      </section>
      <div className="grid gap-4 lg:grid-cols-12">
        <div className="space-y-4 lg:col-span-8 min-w-0">
          <section className="rounded-xl border border-border bg-card p-4">
            <h3 className="text-sm font-bold">문자 빈도</h3>
            <div className="mt-3 flex flex-wrap gap-2">
              {symbols.map((c) => (
                <div
                  key={c}
                  className="min-w-14 rounded-lg border border-border p-2 text-center"
                >
                  <strong className="font-mono">{c}</strong>
                  <div className="text-xs text-muted-foreground">
                    {step.counts[c] || 0} / {model.frequencies[c]}
                  </div>
                  <div className="mt-1 h-1.5 rounded bg-muted">
                    <div
                      className="h-full rounded bg-primary"
                      style={{
                        width: `${(100 * (step.counts[c] || 0)) / model.frequencies[c]}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </section>
          <section className="rounded-xl border border-border bg-card p-4">
            <div className="flex flex-wrap justify-between gap-2">
              <h3 className="text-sm font-bold">우선순위 큐 · 병합된 트리</h3>
              <span className="text-[10px] text-muted-foreground">
                논리적 우선순위 순서
              </span>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {step.queue.map((n) => (
                <span
                  key={n.id}
                  className={`rounded-lg border px-3 py-2 font-mono text-xs ${step.active.includes(n.id) ? "border-amber-500 bg-amber-500/10" : "border-border bg-muted/30"}`}
                >
                  {n.symbol ?? `Σ${n.minSymbol}`} : {n.weight}
                </span>
              ))}
              {!step.queue.length && (
                <span className="text-xs text-muted-foreground">
                  큐 대기 중
                </span>
              )}
            </div>
            {step.selected.length === 2 && (
              <motion.div
                key={`${step.phase}-${step.selected[0].id}`}
                initial={{ opacity: reduced ? 1 : 0, y: reduced ? 0 : -8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: reduced ? 0 : 0.3 }}
                className="mt-3 rounded-lg border border-amber-500/40 bg-amber-500/5 p-3"
                aria-label="병합 연산"
              >
                <p className="text-xs font-semibold">병합 연산</p>
                <div className="mt-2 flex flex-wrap items-center gap-2 font-mono text-sm">
                  {step.selected.map((n, i) => (
                    <span
                      key={n.id}
                      className="rounded border border-amber-500/60 px-2 py-1"
                    >
                      {i === 0 ? "왼쪽" : "오른쪽"} ·{" "}
                      {n.symbol ?? `Σ${n.minSymbol}`} : {n.weight}
                    </span>
                  ))}
                  <span aria-hidden="true">→</span>
                  <strong>
                    {step.phase === "부모 생성" && step.tree
                      ? `합계 ${step.tree.weight}`
                      : "부모 생성 대기"}
                  </strong>
                </div>
              </motion.div>
            )}
            <div className="mt-4 rounded-lg border border-border bg-background p-3">
              {roots.length ? (
                <Tree roots={roots} active={step.active} path={step.path} />
              ) : (
                <p className="py-8 text-center text-xs text-muted-foreground">
                  {input
                    ? "빈도 집계 후 리프 노드를 생성합니다."
                    : "빈 입력에는 트리가 없습니다."}
                </p>
              )}
            </div>
            <p className="mt-2 text-[11px] text-muted-foreground">
              {symbols.length === 1
                ? "단일 기호는 교육용 규칙으로 코드 0을 배정"
                : "왼쪽 0 · 오른쪽 1 · 숫자는 해당 서브트리의 빈도 합계"}
            </p>
          </section>
          <section className="rounded-xl border border-border bg-card p-4">
            <h3 className="text-sm font-bold">인코딩과 복원</h3>
            <p className="mt-2 text-xs text-muted-foreground">
              생성된 본문 · {step.bits.length}비트
            </p>
            <div className="mt-1 break-all rounded-lg bg-muted p-3 font-mono text-sm">
              {step.bits
                ? [...step.bits].map((b, i) => (
                    <span
                      key={i}
                      className={
                        i === step.bitCursor
                          ? "rounded bg-amber-500 text-black"
                          : ""
                      }
                    >
                      {b}
                    </span>
                  ))
                : "—"}
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              복원된 문자열 · {step.decoded.length}자
            </p>
            <div className="mt-1 break-all rounded-lg bg-muted p-3 font-mono text-sm">
              {step.decoded || "—"}
            </div>
            {step.phase === "복원 완료" && (
              <p className="mt-2 text-xs font-bold text-emerald-600">
                {step.decoded === input ? "원문과 복원 결과 일치" : "복원 오류"}
              </p>
            )}
          </section>
        </div>
        <div className="space-y-4 lg:col-span-4 min-w-0">
          <section className="rounded-xl border border-border bg-card p-4">
            <h3 className="text-sm font-bold">코드표</h3>
            <table className="mt-3 w-full text-left text-xs">
              <thead>
                <tr className="border-b border-border text-muted-foreground">
                  <th>기호</th>
                  <th>빈도</th>
                  <th>코드</th>
                  <th>비트</th>
                </tr>
              </thead>
              <tbody>
                {symbols.map((c) => (
                  <tr key={c} className="border-b border-border/50">
                    <td className="py-2 font-bold">{c}</td>
                    <td>{model.frequencies[c]}</td>
                    <td className="font-mono">{step.codes[c] ?? "—"}</td>
                    <td>
                      {step.codes[c]
                        ? model.frequencies[c] * step.codes[c].length
                        : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="mt-2 text-[11px] text-muted-foreground">
              동률: 빈도 → 최소 문자 → 생성 순서
            </p>
          </section>
          <section className="overflow-hidden rounded-xl border border-border bg-card">
            <h3 className="border-b border-border p-3 text-sm font-bold">
              핵심 의사코드
            </h3>
            <div className="overflow-x-auto py-2 font-mono text-[10px] leading-6">
              {CODE.map((line, i) => (
                <div
                  key={line}
                  className={`min-w-[265px] whitespace-pre border-l-2 px-3 ${step.line === i + 1 ? "border-amber-500 bg-amber-500/10 font-bold" : "border-transparent text-muted-foreground"}`}
                >
                  {i + 1} {line}
                </div>
              ))}
            </div>
          </section>
          <section className="rounded-xl border border-border bg-card p-4">
            <h3 className="text-sm font-bold">본문 크기 비교</h3>
            <div className="mt-3 space-y-2 text-xs">
              {[
                ["UTF-8 원문", `${input.length * 8}비트`],
                [
                  "고정 길이",
                  fixed === null ? "단일·빈 입력은 별도" : `${fixed}비트`,
                ],
                ["허프만 본문", `${model.bits.length}비트`],
              ].map(([a, b]) => (
                <div
                  key={a}
                  className="flex justify-between gap-2 border-b border-border pb-2"
                >
                  <span>{a}</span>
                  <strong>{b}</strong>
                </div>
              ))}
            </div>
            <p className="mt-3 text-[11px] leading-relaxed text-muted-foreground">
              코드북·패딩을 제외한 논리적 본문 비교. 바이트 저장 시 허프만
              본문은 최소 {Math.ceil(model.bits.length / 8)}바이트.
            </p>
          </section>
        </div>
      </div>
      <section className="rounded-xl border border-border bg-card p-4">
        <h3 className="text-sm font-bold">실제 형식에서의 위치</h3>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          <div className="rounded-lg border border-border p-3 text-xs leading-relaxed">
            <strong>DEFLATE · gzip · PNG</strong>
            <p className="mt-1 text-muted-foreground">
              입력 → LZ77 리터럴·길이/거리 → 허프만 부호화. 블록은 비압축 또는
              고정·동적 코드를 선택할 수 있습니다.
            </p>
          </div>
          <div className="rounded-lg border border-border p-3 text-xs leading-relaxed">
            <strong>베이스라인 JPEG</strong>
            <p className="mt-1 text-muted-foreground">
              DCT → 양자화 → 계수 기호화 → 허프만 부호화. 허프만 단계는
              무손실이며 양자화의 손실과 구분합니다.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
