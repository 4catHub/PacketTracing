import { useEffect, useId, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import type { WorkflowTopologyCanvasProps } from "./WorkflowFocusedViz";
import { generationState, type TranslationExample } from "./translation-model";

type Actor =
  | "input"
  | "tokenizer"
  | "embedding"
  | "encoder"
  | "decoder"
  | "output";
type Point = readonly [number, number];
const wide: Record<Actor, Point> = {
  input: [20, 28],
  tokenizer: [330, 28],
  embedding: [640, 28],
  encoder: [640, 330],
  decoder: [330, 330],
  output: [20, 330],
};
const narrow: Record<Actor, Point> = {
  input: [12, 28],
  tokenizer: [322, 28],
  embedding: [322, 330],
  encoder: [12, 330],
  decoder: [12, 632],
  output: [322, 632],
};
const pipeline: Actor[] = [
  "input",
  "tokenizer",
  "embedding",
  "encoder",
  "decoder",
  "output",
];
const stacked: Record<Actor, Point> = {
  input: [10, 28],
  tokenizer: [10, 286],
  embedding: [10, 544],
  encoder: [10, 802],
  decoder: [10, 1060],
  output: [10, 1318],
};
const labels = {
  input: "01 · 원문",
  tokenizer: "02 · 토큰 조각",
  embedding: "03 · 숫자 표현",
  encoder: "04 · 원문 문맥",
  decoder: "05 · 다음 토큰 생성",
  output: "06 · 문장 복원",
};
const text = "fill-foreground";
const muted = "fill-muted-foreground";

function Caption({
  x = 0,
  y = 0,
  children,
  small = false,
  faint = false,
}: {
  x?: number;
  y?: number;
  children: React.ReactNode;
  small?: boolean;
  faint?: boolean;
}) {
  return (
    <text
      x={x}
      y={y}
      fontSize={small ? 12 : 15}
      fontWeight={small ? 500 : 650}
      className={faint ? muted : text}
    >
      {children}
    </text>
  );
}
function Token({
  x,
  y,
  label,
  active = false,
  done = false,
  width = 66,
}: {
  x: number;
  y: number;
  label: string;
  active?: boolean;
  done?: boolean;
  width?: number;
}) {
  return (
    <g transform={`translate(${x},${y})`}>
      <rect
        width={width}
        height={29}
        rx={6}
        className={
          active
            ? "fill-primary/10 stroke-primary"
            : done
              ? "fill-muted stroke-foreground/30"
              : "fill-card stroke-border"
        }
        strokeWidth={active ? 2 : 1}
      />
      <text
        x={width / 2}
        y={19}
        textAnchor="middle"
        fontSize={13}
        fontWeight={active ? 750 : 550}
        className={active ? "fill-primary" : text}
      >
        {label}
      </text>
    </g>
  );
}
function Paper({
  sentence,
  ready = true,
}: {
  sentence: string;
  ready?: boolean;
}) {
  return (
    <g transform="translate(20,56)">
      <path
        d="M0 0 H204 L226 22 V124 H0 Z"
        className="fill-background stroke-border"
        strokeWidth={1.5}
      />
      <path d="M204 0 V22 H226" className="fill-muted stroke-border" />
      <Caption x={14} y={43}>
        {sentence}
      </Caption>
      {[65, 80, 95].map((y, i) => (
        <path
          key={y}
          d={`M14 ${y} H${i === 2 ? 125 : 195}`}
          className="stroke-border"
          strokeWidth={3}
        />
      ))}
      <Caption x={14} y={113} small faint>
        {ready ? "텍스트" : "생성 완료 후 표시"}
      </Caption>
    </g>
  );
}
export default function TranslationScene({
  spec,
  stepIndex,
  playing,
  selectFrame,
  example,
}: WorkflowTopologyCanvasProps & { example: TranslationExample }) {
  const reduced = useReducedMotion() ?? false;
  const [layout, setLayout] = useState<"wide" | "narrow" | "stacked">("wide");
  const arrow = `translation-${useId().replace(/:/g, "")}`;
  const canvasRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const sync = () => {
      const width = canvas.clientWidth;
      setLayout(width <= 480 ? "stacked" : width <= 780 ? "narrow" : "wide");
    };
    sync();
    const observer = new ResizeObserver(sync);
    observer.observe(canvas);
    return () => observer.disconnect();
  }, []);
  const positions =
    layout === "stacked" ? stacked : layout === "narrow" ? narrow : wide;
  const step = stepIndex === null ? null : spec.steps[stepIndex];
  const state = generationState(example, stepIndex);
  const current = state.currentToken;
  const focus = current === null ? [] : example.focus[current];
  const decoding = current !== null || state.ended;
  const prefix = example.targetTokens
    .slice(0, current ?? state.generated)
    .join(" · ");
  const selectedToken = state.ended
    ? "<EOS>"
    : example.targetTokens[current ?? 0];
  const shownSource = stepIndex === null || stepIndex >= 1;
  const shownVectors = stepIndex === null || stepIndex >= 2;
  const shownContext = stepIndex === null || stepIndex >= 3;

  function link(from: Actor, to: Actor) {
    const [ax, ay] = positions[from],
      [bx, by] = positions[to];
    if (ay === by)
      return ax < bx
        ? `M${ax + 270} ${ay + 110} H${bx}`
        : `M${ax} ${ay + 110} H${bx + 270}`;
    return `M${ax + 135} ${ay + 220} V${by}`;
  }
  return (
    <div
      ref={canvasRef}
      className="bg-background p-2 sm:p-3"
      data-testid="translation-scene"
    >
      <div className="mb-2 flex flex-wrap items-center justify-between gap-1 px-1 text-[11px] text-muted-foreground">
        <span>Encoder–Decoder Transformer · 추론</span>
        <span>조각·ID·행렬·확률·참조 강도는 모두 예시</span>
      </div>
      <svg
        viewBox={`0 0 ${layout === "stacked" ? 290 : layout === "narrow" ? 604 : 930} ${layout === "stacked" ? 1555 : layout === "narrow" ? 870 : 570}`}
        className="block w-full"
        role="group"
        aria-label={`${example.label} 번역 작업대. 단계 버튼으로 연산을 선택할 수 있습니다.`}
      >
        <defs>
          <marker
            id={arrow}
            viewBox="0 0 10 10"
            refX="9"
            refY="5"
            markerWidth="7"
            markerHeight="7"
            orient="auto-start-reverse"
          >
            <path d="M0 0 L10 5 L0 10Z" fill="currentColor" />
          </marker>
        </defs>
        {pipeline.slice(0, -1).map((actor, i) => {
          const to = pipeline[i + 1];
          const active = step?.transitions?.some(
            (t) => t.from === actor && t.to === to,
          );
          const d = link(actor, to);
          const [ax, ay] = positions[actor],
            [bx, by] = positions[to];
          const horizontal = ay === by;
          const payload = {
            input: "문장",
            tokenizer: "ID",
            embedding: "벡터",
            encoder: "문맥",
            decoder: "토큰",
          }[actor as Exclude<Actor, "output">];
          return (
            <g
              key={actor}
              className={active ? "text-primary" : "text-muted-foreground/40"}
            >
              <text
                x={horizontal ? (ax + bx + 270) / 2 : ax + 150}
                y={horizontal ? ay + 96 : (ay + by + 220) / 2}
                textAnchor={horizontal ? "middle" : "start"}
                fontSize={11}
                className="fill-muted-foreground"
              >
                {payload}
              </text>
              <path
                d={d}
                fill="none"
                stroke="currentColor"
                strokeWidth={active ? 2.5 : 1.5}
                strokeDasharray={active ? undefined : "4 4"}
                markerEnd={`url(#${arrow})`}
              />
              {active && playing && !reduced && (
                <motion.path
                  key={`${stepIndex}-${actor}`}
                  d={d}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={5}
                  strokeDasharray="7 2000"
                  initial={{ strokeDashoffset: 35 }}
                  animate={{ strokeDashoffset: -330 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                />
              )}
            </g>
          );
        })}
        {pipeline.map((actor) => {
          const [x, y] = positions[actor];
          const active = step?.activeActorIds.includes(actor);
          return (
            <g key={actor} transform={`translate(${x},${y})`}>
              <rect
                width={270}
                height={220}
                rx={14}
                className={
                  active
                    ? "fill-card stroke-primary"
                    : "fill-card stroke-border"
                }
                strokeWidth={active ? 2.5 : 1.5}
              />
              <Caption x={16} y={26}>
                {labels[actor]}
              </Caption>
              <path d="M16 39 H254" className="stroke-border" />
              {actor === "input" && (
                <>
                  <Paper sentence={example.source} />
                  <Caption x={20} y={201} small faint>
                    {example.label} · 목표 언어 지정
                  </Caption>
                </>
              )}
              {actor === "tokenizer" && (
                <>
                  <path
                    d="M20 73 H250 M20 111 H250"
                    className="stroke-border"
                    strokeDasharray="3 4"
                  />
                  {example.sourceTokens.map((token, i) => (
                    <motion.g
                      key={`${example.direction}-${i}`}
                      initial={false}
                      animate={{
                        opacity: shownSource ? 1 : 0.25,
                        y: active && playing && !reduced ? [0, -4, 0] : 0,
                      }}
                      transition={{ duration: 0.5, delay: i * 0.08 }}
                    >
                      <Token
                        x={20 + (i % 3) * 78}
                        y={56 + Math.floor(i / 3) * 58}
                        label={token}
                        active={active}
                        width={70}
                      />
                      <Caption
                        x={28 + (i % 3) * 78}
                        y={100 + Math.floor(i / 3) * 58}
                        small
                        faint
                      >
                        #{[41, 17, 208, 31, 526, 9][i]}
                      </Caption>
                    </motion.g>
                  ))}
                  <Caption x={20} y={186} small>
                    분할 → 어휘 ID 조회
                  </Caption>
                  <Caption x={20} y={205} small faint>
                    실제 토크나이저의 분할과 다름
                  </Caption>
                </>
              )}
              {actor === "embedding" && (
                <>
                  <g opacity={shownVectors ? 1 : 0.25}>
                    {example.sourceTokens.map((token, r) => (
                      <g key={r}>
                        <Caption x={16} y={65 + r * 19} small faint>
                          {token}
                        </Caption>
                        {Array.from({ length: 7 }, (_, c) => (
                          <rect
                            key={c}
                            x={75 + c * 23}
                            y={52 + r * 19}
                            width={18}
                            height={14}
                            rx={2}
                            className="fill-primary"
                            opacity={0.12 + ((r * 5 + c * 3) % 9) * 0.085}
                          />
                        ))}
                      </g>
                    ))}
                  </g>
                  <Caption x={20} y={185} small>
                    ID → [0.2, −0.4, …] + 위치
                  </Caption>
                  <Caption x={20} y={205} small faint>
                    각 행은 원문 한 토큰 · 값은 예시
                  </Caption>
                </>
              )}
              {actor === "encoder" && (
                <>
                  <g opacity={shownContext ? 1 : 0.25}>
                    {example.sourceTokens.map((token, r) => (
                      <g key={r}>
                        <Caption x={16} y={76 + r * 18} small faint>
                          {token}
                        </Caption>
                        {example.sourceTokens.map((_, c) => (
                          <rect
                            key={c}
                            x={83 + c * 23}
                            y={63 + r * 18}
                            width={19}
                            height={14}
                            rx={2}
                            className="fill-primary"
                            opacity={
                              0.12 + (c === r || (r + c) % 3 === 0 ? 0.55 : 0.1)
                            }
                          />
                        ))}
                      </g>
                    ))}
                    <Caption x={82} y={56} small faint>
                      각 원문 위치를 서로 참조
                    </Caption>
                  </g>
                  <Caption x={20} y={187} small>
                    Self-Attention → 문맥 벡터들
                  </Caption>
                  <Caption x={20} y={206} small faint>
                    행렬: 원문 간 참조 개념 · 실측 아님
                  </Caption>
                </>
              )}
              {actor === "decoder" && (
                <>
                  <Caption x={16} y={59} small faint>
                    원문 참조 · Cross-Attention
                  </Caption>
                  {example.sourceTokens.map((token, i) => (
                    <g key={i}>
                      <rect
                        x={16 + i * (238 / example.sourceTokens.length)}
                        y={67}
                        width={238 / example.sourceTokens.length - 4}
                        height={26}
                        rx={3}
                        className={
                          decoding && focus.includes(i)
                            ? "fill-primary/20 stroke-primary"
                            : "fill-muted stroke-border"
                        }
                        strokeWidth={focus.includes(i) ? 2 : 1}
                      />
                      <text
                        x={
                          16 +
                          (i + 0.5) * (238 / example.sourceTokens.length) -
                          2
                        }
                        y={85}
                        textAnchor="middle"
                        fontSize={11}
                        className={text}
                        fontWeight={focus.includes(i) ? 800 : 400}
                      >
                        {token}
                      </text>
                    </g>
                  ))}
                  <Caption x={16} y={111} small>
                    접두사: {prefix || "<BOS>"}
                  </Caption>
                  <g opacity={decoding ? 1 : 0.25}>
                    {[
                      { token: selectedToken, p: 70 },
                      {
                        token:
                          current === null
                            ? "…"
                            : example.alternatives[current],
                        p: 20,
                      },
                      { token: "기타", p: 10 },
                    ].map((v, i) => (
                      <g key={i}>
                        <Caption x={16} y={133 + i * 20} small>
                          {v.token}
                        </Caption>
                        <rect
                          x={92}
                          y={122 + i * 20}
                          width={(100 * v.p) / 100}
                          height={13}
                          rx={3}
                          className={
                            i === 0
                              ? "fill-primary"
                              : "fill-muted-foreground/30"
                          }
                        />
                        <Caption x={199} y={133 + i * 20} small faint>
                          {v.p}%
                        </Caption>
                      </g>
                    ))}
                  </g>
                  <path
                    d="M247 120 V188 H35 L29 182 M35 188 L29 194"
                    fill="none"
                    className="stroke-primary"
                    strokeWidth={1.5}
                  />
                  <Caption x={44} y={205} small faint>
                    {state.ended
                      ? "<EOS> → 생성 종료"
                      : "선택 → 접두사에 추가 → 반복"}
                  </Caption>
                </>
              )}
              {actor === "output" && (
                <>
                  <Paper
                    sentence={
                      state.delivered
                        ? example.target
                        : state.generated
                          ? example.direction === "ko-en"
                            ? example.targetTokens
                                .slice(0, state.generated)
                                .join(" ")
                                .replace(" .", ".")
                            : example.targetTokens
                                .slice(0, state.generated)
                                .join("·")
                          : "번역문을 기다리는 중…"
                    }
                    ready={state.delivered}
                  />
                  <Caption x={20} y={201} small faint>
                    {state.delivered
                      ? "특수 토큰 제거 · 텍스트 반환"
                      : state.generated
                        ? "생성 중인 조각 미리보기"
                        : "종료 후 토큰 → 문자열 복원"}
                  </Caption>
                </>
              )}
            </g>
          );
        })}
      </svg>
      <div className="mt-3 flex flex-wrap gap-1.5" aria-label="번역 단계 선택">
        <button
          type="button"
          onClick={() => selectFrame(null)}
          aria-pressed={stepIndex === null}
          className={`rounded-md border px-2 py-1.5 text-xs ${stepIndex === null ? "border-primary text-primary" : "border-border text-muted-foreground"}`}
        >
          전체
        </button>
        {spec.steps.map((s, i) => (
          <button
            key={s.title}
            type="button"
            onClick={() => selectFrame(i)}
            aria-pressed={stepIndex === i}
            className={`rounded-md border px-2 py-1.5 text-xs ${stepIndex === i ? "border-primary bg-primary/10 font-semibold text-primary" : "border-border text-muted-foreground hover:bg-muted"}`}
          >
            {i + 1} ·{" "}
            {i < 4
              ? ["입력", "분할", "벡터", "문맥"][i]
              : i < 4 + example.targetTokens.length
                ? example.targetTokens[i - 4]
                : i === 4 + example.targetTokens.length
                  ? "EOS"
                  : "복원"}
          </button>
        ))}
      </div>
    </div>
  );
}
