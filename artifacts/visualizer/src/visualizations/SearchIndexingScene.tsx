import React, { useEffect, useId, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";
import type { WorkflowTopologyCanvasProps } from "./WorkflowFocusedViz";

// The same world remains visible. A beat animates the data, rather than replacing actors.
type Point = readonly [number, number];
type Actor = "web" | "crawler" | "processor" | "index" | "search" | "user";
const wide: Record<Actor, Point> = {
  web: [35, 60],
  crawler: [365, 60],
  processor: [695, 60],
  index: [695, 365],
  search: [365, 365],
  user: [35, 365],
};
const narrow: Record<Actor, Point> = {
  web: [15, 55],
  crawler: [280, 55],
  processor: [280, 345],
  index: [280, 635],
  search: [15, 635],
  user: [15, 345],
};
const names: Record<Actor, string> = {
  web: "웹사이트",
  crawler: "수집기",
  processor: "문서 분석기",
  index: "검색 색인",
  search: "검색 작업대",
  user: "사용자 화면",
};
const titles = [
  "URL을 대기열에 넣기",
  "접근 규칙을 통과하기",
  "요청하고 문서를 가져오기",
  "본문만 추출하기",
  "문장을 단어로 분리하기",
  "단어별 서랍에 문서 ID 저장",
  "새 색인을 검색에 공개",
  "검색어 입력·전송",
  "단어 목록에서 교집합 찾기",
  "후보 문서의 순위 정하기",
  "제목·URL·스니펫 조립",
  "완성된 결과를 화면에 표시",
];
const notes: Record<number, string> = {
  1: "접근 제한 → 수집 보류",
  2: "429 · 일시 오류 → 재시도 대기",
  3: "noindex → 제외 · 중복 → 대표 URL 선택",
  5: "색인 실패 → 재처리 대기열",
  8: "교집합 없음 → 빈 결과",
  9: "시간 초과 → 오류·부분 결과 표시",
  11: "변경·삭제 → 재수집과 색인 갱신",
};
const clamp = (v: number) => Math.max(0, Math.min(1, v));
const ease = (v: number) => {
  const p = clamp(v);
  return p * p * (3 - 2 * p);
};
const phase = (p: number, start: number, end: number) =>
  ease((p - start) / (end - start));

function useActionProgress(
  step: number | null,
  playing: boolean,
  reduced: boolean,
) {
  const [snapshot, setSnapshot] = useState({ step, progress: 0 });
  const elapsed = useRef(0);
  useEffect(() => {
    elapsed.current = 0;
    setSnapshot({ step, progress: reduced ? 1 : 0 });
  }, [step, reduced]);
  useEffect(() => {
    if (!playing || reduced || step === null) return;
    let frame = 0,
      previous: number | null = null;
    const tick = (now: number) => {
      if (previous !== null) elapsed.current += now - previous;
      previous = now;
      const p = clamp(elapsed.current / 4300);
      setSnapshot({ step, progress: p });
      if (p < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [step, playing, reduced]);
  return reduced ? 1 : snapshot.step === step ? snapshot.progress : 0;
}

function Label({
  x,
  y,
  children,
  small = false,
  muted = false,
  active = false,
}: {
  x: number;
  y: number;
  children: React.ReactNode;
  small?: boolean;
  muted?: boolean;
  active?: boolean;
}) {
  return (
    <text
      x={x}
      y={y}
      fontSize={small ? 12 : 15}
      fontWeight={small ? 500 : 700}
      className={
        active
          ? "fill-primary"
          : muted
            ? "fill-muted-foreground"
            : "fill-foreground"
      }
    >
      {children}
    </text>
  );
}
function Sheet({
  x = 0,
  y = 0,
  label = "D1",
  active = false,
  width = 50,
  opacity = 1,
}: {
  x?: number;
  y?: number;
  label?: string;
  active?: boolean;
  width?: number;
  opacity?: number;
}) {
  return (
    <g
      transform={`translate(${x} ${y})`}
      opacity={opacity}
      data-shape="document"
    >
      <path
        d={`M0 0 H${width - 12} L${width} 12 V66 H0 Z`}
        className={`fill-card ${active ? "stroke-primary" : "stroke-muted-foreground"}`}
        strokeWidth="1.5"
      />
      <path
        d={`M${width - 12} 0 V12 H${width}`}
        fill="none"
        className="stroke-border"
      />
      <text
        x="7"
        y="27"
        fontSize="12"
        fontWeight="700"
        className={active ? "fill-primary" : "fill-foreground"}
      >
        {label}
      </text>
      {[37, 45, 53].map((v) => (
        <path
          key={v}
          d={`M7 ${v} H${width - 8}`}
          className="stroke-border"
          strokeWidth="2"
        />
      ))}
    </g>
  );
}
function Chip({
  x,
  y,
  text,
  active = false,
  opacity = 1,
}: {
  x: number;
  y: number;
  text: string;
  active?: boolean;
  opacity?: number;
}) {
  return (
    <g transform={`translate(${x} ${y})`} opacity={opacity}>
      <rect
        width="55"
        height="25"
        rx="5"
        className={
          active
            ? "fill-primary/10 stroke-primary"
            : "fill-background stroke-border"
        }
      />
      <text
        x="27.5"
        y="17"
        textAnchor="middle"
        fontSize="12"
        className={active ? "fill-primary" : "fill-foreground"}
      >
        {text}
      </text>
    </g>
  );
}
function FrameTitle({ name, active }: { name: string; active: boolean }) {
  return (
    <>
      <Label x={0} y={-16} active={active}>
        {name}
      </Label>
      {active && (
        <path d="M0 -8 H70" className="stroke-primary" strokeWidth="3" />
      )}
    </>
  );
}

function Website({ step, p }: { step: number | null; p: number }) {
  return (
    <g data-model="browser">
      <rect
        width="235"
        height="170"
        rx="9"
        className="fill-card stroke-border"
        strokeWidth="1.5"
      />
      <path d="M0 29 H235" className="stroke-border" />
      {[13, 24, 35].map((x) => (
        <circle
          key={x}
          cx={x}
          cy="14"
          r="2.5"
          className="fill-muted-foreground"
        />
      ))}
      <rect
        x="49"
        y="7"
        width="174"
        height="15"
        rx="4"
        className="fill-muted"
      />
      <Label x={58} y={18} small muted>
        example.com/guide/cache
      </Label>
      <rect
        x="12"
        y="42"
        width="58"
        height="113"
        rx="4"
        className="fill-muted"
      />
      <Label x={20} y={62} small muted>
        링크
      </Label>
      {[77, 96, 115].map((y, i) => (
        <g key={y} opacity={step === 0 ? 1 - phase(p, 0.05, 0.55) * 0.5 : 1}>
          <path d={`M20 ${y} H59`} className="stroke-primary" strokeWidth="2" />
          <text
            x="20"
            y={y + 12}
            fontSize="10"
            className="fill-muted-foreground"
          >
            D{i + 1}
          </text>
        </g>
      ))}
      <Label x={82} y={61} small>
        ス프링 캐시
      </Label>
      <Label x={82} y={80} small>
        적용 가이드
      </Label>
      {[96, 110, 124, 138].map((y) => (
        <path
          key={y}
          d={`M83 ${y} H219`}
          className="stroke-border"
          strokeWidth="3"
        />
      ))}
      {step === 2 && (
        <g opacity={1 - phase(p, 0.25, 0.6)}>
          <rect
            x="76"
            y="40"
            width="148"
            height="113"
            rx="4"
            className="fill-muted"
          />
          <Label x={89} y={100} small>
            HTTP 요청 수신
          </Label>
        </g>
      )}
    </g>
  );
}
function Crawler({ step, p }: { step: number | null; p: number }) {
  const queueP = step === 0 ? phase(p, 0.15, 0.8) : 1;
  return (
    <g data-model="queue-and-gate">
      <path
        d="M0 50 V161 Q0 172 12 172 H226 Q238 172 238 160 V50"
        className="fill-muted stroke-border"
        strokeWidth="2"
      />
      <Label x={10} y={35} small muted>
        URL 수집 대기열
      </Label>
      {[0, 1, 2].map((i) => (
        <g
          key={i}
          transform={`translate(${12 + i * 74} ${step === 0 ? -28 * (1 - phase(queueP, i * 0.18, 0.6 + i * 0.18)) : 0})`}
          opacity={step === 0 ? phase(queueP, i * 0.16, 0.4 + i * 0.16) : 1}
        >
          <rect
            y="60"
            width="65"
            height="43"
            rx="4"
            className="fill-card stroke-border"
          />
          <Label x={7} y={79} small>{`URL ${i + 1}`}</Label>
          <path d="M7 90 H55" className="stroke-primary" />
        </g>
      ))}
      <path
        d="M12 115 H224"
        className="stroke-muted-foreground"
        strokeWidth="3"
      />
      {[23, 61, 99, 137, 175, 213].map((x) => (
        <circle
          key={x}
          cx={x}
          cy="120"
          r="4"
          className="fill-card stroke-border"
        />
      ))}
      <path d="M32 146 H184" className="stroke-border" strokeWidth="2" />
      <g
        transform={`translate(192 133) rotate(${step === 1 ? -65 * phase(p, 0.35, 0.8) : -65})`}
      >
        <rect width="34" height="7" rx="2" className="fill-primary" />
      </g>
      <Label x={14} y={157} small active={step === 1}>
        {step === 1 && p < 0.5 ? "robots.txt 확인" : "접근 허용 · 일정 확인"}
      </Label>
      {step === 2 && (
        <Sheet
          x={70 + 80 * (1 - phase(p, 0.55, 0.95))}
          y={49 - 30 * (1 - phase(p, 0.55, 0.95))}
          label="HTML"
          active
          opacity={phase(p, 0.8, 0.95)}
          width={70}
        />
      )}
    </g>
  );
}
function Processor({ step, p }: { step: number | null; p: number }) {
  const analyzed = step !== null && step >= 4;
  return (
    <g data-model="document-processor">
      <path
        d="M7 3 H221 L235 17 V168 H7 Z"
        className="fill-card stroke-border"
        strokeWidth="1.5"
      />
      <path
        d="M221 3 V17 H235 M7 35 H235"
        className="stroke-border"
        fill="none"
      />
      <Label x={18} y={25} small muted>
        문서 추출 · 분석 파이프라인
      </Label>
      {!analyzed && (
        <>
          <Sheet
            x={25}
            y={50}
            width={68}
            active={step === 3}
            opacity={
              step === 3
                ? phase(p, 0.4, 0.55)
                : step !== null && step < 3
                  ? 0.18
                  : 1
            }
          />
          <rect
            x="109"
            y="48"
            width="109"
            height="83"
            rx="4"
            className="fill-muted"
          />
          <Label x={118} y={70} small>
            제목 · 본문
          </Label>
          {[84, 96, 108].map((y) => (
            <path
              key={y}
              d={`M119 ${y} H208`}
              className="stroke-border"
              strokeWidth="3"
            />
          ))}
        </>
      )}
      {step === 3 && (
        <path
          d={`M17 ${47 + 79 * phase(p, 0.45, 0.9)} H222`}
          className="stroke-primary"
          strokeWidth="3"
          opacity={phase(p, 0.4, 0.5) * (1 - phase(p, 0.9, 1))}
        />
      )}
      {analyzed && (
        <>
          <Label x={20} y={59} small>
            스프링 캐시 적용 가이드
          </Label>
          <path d="M22 71 H217" className="stroke-border" />
          {["스프링", "캐시", "적용", "가이드"].map((text, i) => (
            <Chip
              key={text}
              x={20 + (i % 2) * 110}
              y={
                84 +
                Math.floor(i / 2) * 36 +
                (step === 4
                  ? (1 - phase(p, i * 0.13, 0.45 + i * 0.13)) * -18
                  : 0)
              }
              text={text}
              active={step === 4 || step === 5}
              opacity={step === 4 ? phase(p, i * 0.13, 0.45 + i * 0.13) : 1}
            />
          ))}
        </>
      )}
      <path
        d="M-3 151 H14 M228 151 H246"
        className="stroke-muted-foreground"
        strokeWidth="4"
      />
    </g>
  );
}
function IndexCabinet({ step, p }: { step: number | null; p: number }) {
  const stored = step !== null && step >= 5;
  const rows = [
    ["스프링", ["D1", "D2", "D3"]],
    ["캐시", ["D1", "D2"]],
    ["로그인", ["D3"]],
  ] as const;
  return (
    <g data-model="inverted-index-cabinet">
      <path
        d="M6 10 L20 0 H235 V168 L221 178 H6 Z"
        className="fill-muted stroke-border"
        strokeWidth="1.5"
      />
      <path
        d="M221 10 L235 0 M221 10 V178"
        fill="none"
        className="stroke-border"
      />
      {rows.map(([term, docs], i) => {
        const write =
          step === 5 ? phase(p, 0.15 + i * 0.18, 0.5 + i * 0.18) : 1;
        const read = step === 8 && i < 2 ? 13 * phase(p, 0, 0.45) : 0;
        return (
          <g
            key={term}
            transform={`translate(${-read} ${i * 48})`}
            data-index-term={term}
          >
            <rect
              x="15"
              y="21"
              width="198"
              height="40"
              rx="4"
              className={
                step === 8 && i < 2
                  ? "fill-card stroke-primary"
                  : "fill-card stroke-border"
              }
            />
            <Label x={22} y={46} small active={step === 8 && i < 2}>
              {term}
            </Label>
            <path d="M79 27 V55" className="stroke-border" />
            {stored &&
              docs.map((d, j) => (
                <g
                  key={d}
                  opacity={write}
                  transform={`translate(${(1 - write) * 25} 0)`}
                >
                  <rect
                    x={87 + j * 37}
                    y="30"
                    width="31"
                    height="21"
                    rx="3"
                    className="fill-primary/10"
                  />
                  <Label x={92 + j * 37} y={45} small active>
                    {d}
                  </Label>
                </g>
              ))}
          </g>
        );
      })}
      <circle
        cx="19"
        cy="165"
        r="3"
        className={
          step !== null && step >= 6 && (step !== 6 || p > 0.6)
            ? "fill-primary"
            : "fill-muted-foreground"
        }
      />
      <Label x={29} y={169} small active={step === 6}>
        {step !== null && step >= 6 && (step !== 6 || p > 0.6)
          ? "검색 가능"
          : "반영 대기"}
      </Label>
      <rect
        x="6"
        y="188"
        width="229"
        height="27"
        rx="4"
        className="fill-card stroke-border"
      />
      <Label x={14} y={206} small muted>
        제목·URL·본문 별도 보관
      </Label>
      {step === 6 && (
        <path
          d="M10 162 H214"
          className="stroke-primary"
          strokeWidth="2"
          opacity={1 - phase(p, 0.5, 1)}
        />
      )}
    </g>
  );
}
function SearchBench({ step, p }: { step: number | null; p: number }) {
  return (
    <g data-model="search-and-ranking">
      <path
        d="M15 4 H217 V37 L148 83 V105 H86 V83 L15 37 Z"
        className="fill-muted stroke-border"
        strokeWidth="1.5"
      />
      <circle
        cx="116"
        cy="30"
        r="15"
        fill="none"
        className="stroke-primary"
        strokeWidth="2"
      />
      <path d="M128 42 L141 55" className="stroke-primary" strokeWidth="3" />
      <Label x={20} y={130} small muted>
        {step === 8
          ? "AND · 목록의 교집합"
          : step === 9
            ? "관련성 기준 정렬 · 예시"
            : "후보 선택 · 순위 · 결과 구성"}
      </Label>
      {step === 7 &&
        ["스프링", "캐시"].map((text, i) => (
          <Chip
            key={text}
            x={45 + i * 75}
            y={60}
            text={text}
            active
            opacity={phase(p, 0.78 + i * 0.05, 0.93 + i * 0.05)}
          />
        ))}
      {step === 8 && (
        <>
          <Chip
            x={1}
            y={47}
            text="D1·D2"
            active
            opacity={phase(p, 0.3, 0.65)}
          />
          <Chip
            x={177}
            y={47}
            text="D1·D2"
            active
            opacity={phase(p, 0.3, 0.65)}
          />
          <g opacity={phase(p, 0.65, 0.95)}>
            <Label x={87} y={100} small active>
              D1 · D2
            </Label>
          </g>
        </>
      )}
      {step === 9 &&
        [0, 1].map((i) => (
          <g
            key={i}
            transform={`translate(${i === 0 ? 127 - 107 * phase(p, 0.1, 0.8) : 20 + 107 * phase(p, 0.1, 0.8)} ${146 + (i === 1 ? 45 * Math.sin(Math.PI * phase(p, 0.1, 0.8)) : 0)})`}
          >
            <rect
              width="92"
              height="36"
              rx="4"
              className="fill-card stroke-primary"
            />
            <Label x={9} y={23} small active>
              {p > 0.75 ? `${i + 1}위 · D${i + 1}` : `후보 D${i + 1}`}
            </Label>
          </g>
        ))}
      {step === 10 && (
        <g>
          <rect
            x="9"
            y="146"
            width="222"
            height="32"
            rx="4"
            className="fill-card stroke-border"
          />
          {["제목", "URL", "요약"].map((text, i) => (
            <Chip
              key={text}
              x={17 + i * 72}
              y={149 - (1 - phase(p, i * 0.18, 0.5 + i * 0.18)) * 35}
              text={text}
              active
              opacity={phase(p, i * 0.18, 0.5 + i * 0.18)}
            />
          ))}
        </g>
      )}
      {(step === null || step < 8 || step === 11) && (
        <>
          <Sheet x={28} y={142} width={42} />
          <Sheet x={90} y={142} label="D2" width={42} />
          <path d="M14 178 H226" className="stroke-border" />
        </>
      )}
    </g>
  );
}
function ResultScreen({ step, p }: { step: number | null; p: number }) {
  const results = step === 11;
  return (
    <g data-model="search-results-browser">
      <rect
        x="6"
        width="222"
        height="158"
        rx="7"
        className="fill-card stroke-border"
        strokeWidth="2"
      />
      <path
        d="M-2 166 H236 L225 177 H8 Z"
        className="fill-muted stroke-border"
      />
      <rect
        x="19"
        y="13"
        width="196"
        height="26"
        rx="13"
        className="fill-background stroke-border"
      />
      <circle cx="32" cy="25" r="5" fill="none" className="stroke-primary" />
      <path d="M36 29 L40 33" className="stroke-primary" />
      <Label x={47} y={31} small>
        {step === 7
          ? "스프링 캐시".slice(0, Math.ceil(6 * phase(p, 0, 0.55)))
          : step !== null && step > 7
            ? "스프링 캐시"
            : "검색어 입력"}
      </Label>
      {results ? (
        [0, 1].map((i) => (
          <g
            key={i}
            opacity={phase(p, 0.45 + i * 0.12, 0.8 + i * 0.12)}
            transform={`translate(0 ${(1 - phase(p, 0.45 + i * 0.12, 0.8 + i * 0.12)) * 15})`}
          >
            <Label
              x={19}
              y={61 + i * 52}
              small
              active
            >{`${i + 1}. 스프링 캐시 ${i ? "장애 분석" : "적용 가이드"}`}</Label>
            <text
              x="19"
              y={76 + i * 52}
              fontSize="10"
              className="fill-muted-foreground"
            >
              example.com/{i ? "troubleshooting" : "guide"}
            </text>
            <path
              d={`M19 ${85 + i * 52} H205`}
              className="stroke-border"
              strokeWidth="3"
            />
          </g>
        ))
      ) : (
        <>
          <path
            d="M19 59 H207 M19 76 H185 M19 93 H196"
            className="stroke-border"
            strokeWidth="3"
          />
          <Label x={21} y={137} small muted>
            {step !== null && step >= 7
              ? "검색 결과 대기"
              : "문서 수집과 독립적인 검색"}
          </Label>
        </>
      )}
    </g>
  );
}

// Export a pure frame so every action's start/final state can be verified without timers.
export function SearchSceneFrame({
  step,
  progress,
  compact = false,
  markerId = "search-scene-arrow",
}: {
  step: number | null;
  progress: number;
  compact?: boolean;
  markerId?: string;
}) {
  const p = clamp(progress),
    pos = compact ? narrow : wide;
  const active: Actor[][] = [
    ["web", "crawler"],
    ["crawler", "web"],
    ["crawler", "web"],
    ["crawler", "processor"],
    ["processor"],
    ["processor", "index"],
    ["index"],
    ["user", "search"],
    ["index", "search"],
    ["search"],
    ["index", "search"],
    ["search", "user"],
  ];
  const routes: [Actor, Actor][] = [
    ["web", "crawler"],
    ["crawler", "processor"],
    ["processor", "index"],
    ["index", "search"],
    ["search", "user"],
  ];
  const paths = routes.map(([from, to]) => {
    const a = pos[from],
      b = pos[to];
    const sameRow = a[1] === b[1];
    const d = sameRow
      ? a[0] < b[0]
        ? `M${a[0] + 240} ${a[1] + 84} H${b[0] - 10}`
        : `M${a[0] - 8} ${a[1] + 84} H${b[0] + 242}`
      : a[1] < b[1]
        ? `M${a[0] + 120} ${a[1] + 182} V${b[1] - 35}`
        : `M${a[0] + 120} ${a[1] - 35} V${b[1] + 182}`;
    return { from, to, d };
  });
  const models: Record<Actor, React.ReactNode> = {
    web: <Website step={step} p={p} />,
    crawler: <Crawler step={step} p={p} />,
    processor: <Processor step={step} p={p} />,
    index: <IndexCabinet step={step} p={p} />,
    search: <SearchBench step={step} p={p} />,
    user: <ResultScreen step={step} p={p} />,
  };
  const transfer = (
    from: Actor,
    to: Actor,
    t: number,
    label: string,
    sheet = false,
  ) => {
    const a = pos[from],
      b = pos[to],
      v = ease(t);
    return (
      <g
        transform={`translate(${a[0] + 94 + (b[0] - a[0]) * v} ${a[1] + 55 + (b[1] - a[1]) * v})`}
        opacity={t > 0 && t < 1 ? 1 : 0}
        data-action="transfer"
      >
        {sheet ? (
          <Sheet label={label} active width={58} />
        ) : (
          <Chip x={0} y={0} text={label} active />
        )}
      </g>
    );
  };
  return (
    <svg
      viewBox={compact ? "0 0 540 890" : "0 0 970 615"}
      className="block w-full"
      role="img"
      aria-label={`검색엔진 모형: ${step === null ? "전체 구성" : titles[step]}`}
      data-scene-step={step ?? "overview"}
      data-scene-progress={p.toFixed(2)}
    >
      <defs>
        <marker
          id={markerId}
          markerWidth="8"
          markerHeight="8"
          refX="7"
          refY="4"
          orient="auto"
        >
          <path d="M0 0 L8 4 L0 8 Z" className="fill-muted-foreground" />
        </marker>
      </defs>
      {paths.map(({ from, to, d }) => (
        <path
          key={from + to}
          d={d}
          fill="none"
          className="stroke-muted-foreground"
          strokeOpacity=".35"
          strokeWidth="1.5"
          strokeDasharray="4 5"
          markerEnd={`url(#${markerId})`}
        />
      ))}
      {(Object.keys(pos) as Actor[]).map((id) => (
        <g
          key={id}
          transform={`translate(${pos[id][0]} ${pos[id][1]})`}
          data-actor-id={id}
        >
          <FrameTitle
            name={names[id]}
            active={step !== null && active[step].includes(id)}
          />
          {models[id]}
        </g>
      ))}
      {step === 0 && transfer("web", "crawler", phase(p, 0.02, 0.6), "URL")}
      {step === 2 && (
        <>
          {transfer("crawler", "web", phase(p, 0, 0.3), "GET")}
          {transfer("web", "crawler", phase(p, 0.35, 0.85), "HTML", true)}
        </>
      )}
      {step === 3 &&
        transfer("crawler", "processor", phase(p, 0, 0.45), "D1", true)}
      {step === 5 && transfer("processor", "index", phase(p, 0.03, 0.55), "D1")}
      {step === 7 && transfer("user", "search", phase(p, 0.5, 0.95), "검색어")}
      {step === 8 && transfer("index", "search", phase(p, 0.25, 0.8), "D1·D2")}
      {step === 10 &&
        transfer("index", "search", phase(p, 0, 0.5), "본문", true)}
      {step === 11 &&
        transfer("search", "user", phase(p, 0, 0.5), "결과", true)}
    </svg>
  );
}

export default function SearchIndexingScene({
  stepIndex,
  playing,
  selectFrame,
}: WorkflowTopologyCanvasProps) {
  const reduced = useReducedMotion() ?? false;
  const [compact, setCompact] = useState(false);
  const id = useId().replace(/:/g, "");
  const progress = useActionProgress(stepIndex, playing, reduced);
  useEffect(() => {
    const media = window.matchMedia("(max-width: 640px)");
    const sync = () => setCompact(media.matches);
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);
  return (
    <div className="bg-background p-3 sm:p-5">
      <div className="mb-4 flex flex-wrap items-center gap-2 text-xs">
        <span className="rounded-full bg-muted px-3 py-1 font-semibold">
          {stepIndex === null
            ? "전체 모형"
            : stepIndex < 7
              ? "수집 · 색인"
              : "검색 · 결과"}
        </span>
        <span className="text-muted-foreground">
          {stepIndex === null
            ? "문서 D1 · D2 · D3의 수집과 검색"
            : titles[stepIndex]}
        </span>
      </div>
      <SearchSceneFrame
        step={stepIndex}
        progress={progress}
        compact={compact}
        markerId={`search-scene-${id}`}
      />
      <div
        className="mt-3 flex min-h-10 items-center border-t border-border pt-3 text-xs text-muted-foreground"
        aria-live="polite"
      >
        {stepIndex === null
          ? "스프링 캐시 검색 · 학습용 고정 데이터"
          : (notes[stepIndex] ??
            "이동하는 문서와 저장되는 단어·문서 ID를 따라가세요.")}
      </div>
      <p className="mt-3 text-xs text-muted-foreground">
        장면 선택 · 상단 재생 버튼으로 동작 확인
      </p>
      <div className="mt-2 flex flex-wrap gap-1" aria-label="장면 선택">
        <button
          className="rounded border border-border px-2 py-1 text-xs hover:bg-muted"
          onClick={() => selectFrame(null)}
          aria-pressed={stepIndex === null}
        >
          전체
        </button>
        {titles.map((title, i) => (
          <button
            key={title}
            title={title}
            aria-label={`${i + 1}단계 ${title}`}
            aria-pressed={stepIndex === i}
            onClick={() => selectFrame(i)}
            className={`h-8 w-8 rounded border text-xs ${stepIndex === i ? "border-primary bg-primary text-primary-foreground" : "border-border hover:bg-muted"}`}
          >
            {i + 1}
          </button>
        ))}
      </div>
    </div>
  );
}
