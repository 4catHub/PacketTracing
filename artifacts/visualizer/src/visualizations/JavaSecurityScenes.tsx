import { useId, type ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";
import {
  Braces,
  Cpu,
  FileCode2,
  Globe,
  KeyRound,
  PackageCheck,
  Server,
  ShieldCheck,
} from "lucide-react";
import type { WorkflowTopologyCanvasProps } from "./WorkflowFocusedViz";
import type { JavaSpec, Kind } from "./JavaSecurityNov2026Viz";

type Owner = "source" | "app" | "core" | "target" | "ops";
type Point = readonly [number, number];
export const javaScenePositions: Record<Kind, Record<Owner, Point>> = {
  xml: {
    source: [90, 55],
    app: [330, 55],
    core: [220, 250],
    target: [330, 425],
    ops: [90, 450],
  },
  heap: {
    source: [90, 55],
    app: [330, 55],
    core: [105, 245],
    target: [325, 275],
    ops: [90, 450],
  },
  jgss: {
    source: [105, 155],
    app: [105, 280],
    core: [305, 275],
    target: [305, 430],
    ops: [90, 460],
  },
  tls: {
    source: [90, 60],
    app: [350, 60],
    core: [220, 275],
    target: [345, 435],
    ops: [90, 455],
  },
  compiler: {
    source: [90, 55],
    app: [330, 55],
    core: [220, 240],
    target: [330, 435],
    ops: [90, 455],
  },
  library: {
    source: [90, 55],
    app: [330, 55],
    core: [110, 245],
    target: [330, 290],
    ops: [90, 455],
  },
};

type Shape =
  | "document"
  | "server"
  | "package"
  | "resource"
  | "ticket"
  | "monitor"
  | "record";
function Device({
  x,
  y,
  label,
  detail,
  shape,
  tone,
  children,
}: {
  x: number;
  y: number;
  label: string;
  detail: string;
  shape: Shape;
  tone: string;
  children?: ReactNode;
}) {
  return (
    <g transform={`translate(${x} ${y})`} className={tone}>
      {shape === "document" ? (
        <path
          d="M-75-36H50L75-12V36H-75Z M50-36V-12H75"
          className="fill-card"
          stroke="currentColor"
          strokeWidth="1.6"
        />
      ) : shape === "package" ? (
        <path
          d="M-75-25L0-39L75-25V35H-75Z M-75-25H75 M0-39V-13"
          className="fill-card"
          stroke="currentColor"
          strokeWidth="1.6"
        />
      ) : shape === "resource" ? (
        <>
          <rect
            x="-75"
            y="-30"
            width="150"
            height="58"
            rx="20"
            className="fill-card"
            stroke="currentColor"
            strokeWidth="1.6"
          />
          <Globe x="-64" y="-18" size="18" />
        </>
      ) : shape === "ticket" ? (
        <path
          d="M-75-35H75V-12Q57 0 75 12V35H-75V12Q-57 0-75-12Z"
          className="fill-card"
          stroke="currentColor"
          strokeWidth="1.6"
        />
      ) : shape === "monitor" ? (
        <>
          <rect
            x="-75"
            y="-40"
            width="150"
            height="72"
            rx="6"
            className="fill-card"
            stroke="currentColor"
            strokeWidth="1.6"
          />
          <path d="M0 32V43M-27 43H27" stroke="currentColor" strokeWidth="2" />
        </>
      ) : shape === "record" ? (
        <>
          <rect
            x="-73"
            y="-39"
            width="150"
            height="72"
            rx="4"
            className="fill-muted"
            stroke="currentColor"
          />
          <rect
            x="-79"
            y="-32"
            width="150"
            height="72"
            rx="4"
            className="fill-card"
            stroke="currentColor"
            strokeWidth="1.6"
          />
        </>
      ) : (
        <>
          <rect
            x="-75"
            y="-36"
            width="150"
            height="72"
            rx="6"
            className="fill-card"
            stroke="currentColor"
            strokeWidth="1.6"
          />
          <path d="M-63-23H63M-63-17H33" stroke="currentColor" opacity=".7" />
          <circle cx="61" cy="-20" r="2" fill="currentColor" />
        </>
      )}
      <text
        x={shape === "resource" ? 8 : 0}
        y="2"
        textAnchor="middle"
        fontSize="14"
        fontWeight="750"
        className="fill-foreground"
      >
        {label}
      </text>
      <text y="24" textAnchor="middle" fontSize="12.5" fill="currentColor">
        {detail}
      </text>
      {children}
    </g>
  );
}

const sceneNames: Record<Kind, string> = {
  xml: "문서 트리 → XInclude 로더 → 자원 요청",
  heap: "CPU 최적화 → 출력 버퍼 → 인접 힙",
  jgss: "클라이언트 샌드박스와 JGSS 접근 경계",
  tls: "통신 상대 ↔ Java TLS 채널과 보호 레코드",
  compiler: "컴파일 처리 경로와 프로세스 실행 상태",
  library: "공용 API 모듈과 데이터 접근·서비스 상태",
};

interface Route {
  from: Owner;
  to: Owner;
  path: string;
  label: Point;
}
const sceneRoutes: Record<Kind, Route[]> = {
  xml: [
    { from: "source", to: "app", path: "M165 55H255", label: [210, 40] },
    { from: "app", to: "core", path: "M330 91V160", label: [330, 131] },
    { from: "core", to: "target", path: "M330 350V390", label: [330, 375] },
    { from: "ops", to: "core", path: "M90 411V350", label: [90, 380] },
  ],
  heap: [
    { from: "source", to: "app", path: "M165 55H255", label: [210, 40] },
    { from: "app", to: "core", path: "M330 91V130H105V183", label: [215, 121] },
    { from: "core", to: "target", path: "M181 245H222", label: [203, 222] },
    { from: "ops", to: "core", path: "M90 416V318", label: [91, 374] },
  ],
  jgss: [
    { from: "source", to: "app", path: "M105 191V244", label: [105, 221] },
    { from: "app", to: "core", path: "M180 280H230", label: [205, 239] },
    { from: "core", to: "target", path: "M305 321V391", label: [305, 373] },
    {
      from: "ops",
      to: "core",
      path: "M166 460H205V313H230",
      label: [187, 422],
    },
  ],
  tls: [
    { from: "source", to: "app", path: "M165 52H275", label: [220, 33] },
    { from: "app", to: "source", path: "M275 84H165", label: [220, 106] },
    { from: "app", to: "core", path: "M350 96V235H325", label: [351, 218] },
    {
      from: "core",
      to: "target",
      path: "M275 330V363H345V394",
      label: [330, 380],
    },
    { from: "ops", to: "core", path: "M90 419V275H115", label: [89, 373] },
  ],
  compiler: [
    { from: "source", to: "app", path: "M165 55H255", label: [210, 40] },
    { from: "app", to: "core", path: "M330 91V157", label: [330, 131] },
    { from: "core", to: "target", path: "M330 335V394", label: [330, 374] },
    { from: "ops", to: "core", path: "M90 417V335", label: [90, 382] },
  ],
  library: [
    { from: "source", to: "app", path: "M165 55H255", label: [210, 40] },
    {
      from: "app",
      to: "core",
      path: "M330 91V126H215V201H204",
      label: [219, 118],
    },
    {
      from: "core",
      to: "target",
      path: "M204 263H232V291H252",
      label: [245, 230],
    },
    { from: "ops", to: "core", path: "M90 417V320", label: [90, 376] },
  ],
};

export default function JavaSecurityScene({
  spec: raw,
  stepIndex,
  playing,
  selectFrame,
}: WorkflowTopologyCanvasProps) {
  const spec = raw as JavaSpec;
  const v = spec.vulnerability;
  const step = stepIndex === null ? undefined : spec.steps[stepIndex];
  const phase = step?.phase;
  const isAttack = spec.mode === "attack";
  const affected = isAttack && (phase === "boundary" || phase === "result");
  const resolved =
    !isAttack &&
    (phase === "install" || phase === "restart" || phase === "verify");
  const mitigated = !isAttack && phase === "mitigate";
  const reduced = useReducedMotion();
  const marker = `java-scene-${useId().replace(/:/g, "")}`;
  const positions = javaScenePositions[v.kind];
  const color = isAttack
    ? "text-rose-700 dark:text-rose-300"
    : "text-emerald-700 dark:text-emerald-300";
  const tone = (owner: Owner) =>
    step?.activeActorIds.includes(owner) ? color : "text-muted-foreground";
  const stateColor = resolved
    ? "text-emerald-700 dark:text-emerald-300"
    : affected
      ? "text-rose-700 dark:text-rose-300"
      : "text-muted-foreground";
  const label = (owner: Owner) =>
    spec.actors.find((a) => a.id === owner)!.label;
  const node = (owner: Owner, shape: Shape, detail: string) => (
    <Device
      x={positions[owner][0]}
      y={positions[owner][1]}
      label={label(owner)}
      detail={detail}
      shape={shape}
      tone={tone(owner)}
    />
  );
  const commonInput = (
    <>
      {node(
        "source",
        v.kind === "tls"
          ? "monitor"
          : v.kind === "jgss"
            ? "ticket"
            : "document",
        v.kind === "jgss"
          ? "인터넷에서 온 코드"
          : v.kind === "tls"
            ? "네트워크 통신 상대"
            : "외부 입력",
      )}
      {node(
        "app",
        "server",
        v.kind === "jgss" ? "샌드박스 의존 배포" : "컴포넌트 API 사용",
      )}
    </>
  );
  const ops = node(
    "ops",
    "package",
    resolved ? "수정 런타임 사용" : "조사 · 완화 · 교체",
  );
  const note = (text: string, y = 501) => (
    <text
      x="220"
      y={y}
      textAnchor="middle"
      fontSize="12.5"
      className="fill-muted-foreground"
    >
      {text}
    </text>
  );
  const unknown = v.kind !== "xml" && v.kind !== "heap";

  return (
    <div
      className="border-t border-border bg-background"
      data-testid={`java-scene-${v.kind}`}
    >
      <div
        className="flex flex-wrap items-center gap-1.5 p-3"
        role="group"
        aria-label="Java 취약점 단계 선택"
      >
        <button
          type="button"
          onClick={() => selectFrame(null)}
          aria-pressed={stepIndex === null}
          className="min-h-9 rounded-md border border-border px-3 text-xs font-semibold hover:bg-muted aria-pressed:border-primary aria-pressed:text-primary"
        >
          전체
        </button>
        {spec.steps.map((s, i) => (
          <button
            key={s.phase}
            type="button"
            title={s.title}
            aria-label={`${i + 1}단계 · ${s.title}`}
            aria-pressed={stepIndex === i}
            onClick={() => selectFrame(i)}
            className="min-h-9 min-w-9 rounded-md border border-border px-2 text-xs font-semibold hover:bg-muted aria-pressed:border-primary aria-pressed:text-primary"
          >
            {i + 1}
          </button>
        ))}
      </div>
      <p className="px-3 pb-2 text-xs font-semibold text-muted-foreground">
        {sceneNames[v.kind]}
      </p>
      <svg
        viewBox="0 0 440 520"
        role="img"
        aria-label={`${v.component} · ${sceneNames[v.kind]}. ${step ? `${step.title}. ${step.summary}` : "전체 구성요소와 입력·접근·업데이트 경로"}`}
        className="mx-auto block w-full max-w-[560px]"
      >
        <defs>
          <marker
            id={marker}
            viewBox="0 0 10 10"
            refX="9"
            refY="5"
            markerWidth="8"
            markerHeight="8"
            orient="auto"
          >
            <path d="M0 0L10 5L0 10Z" fill="context-stroke" />
          </marker>
        </defs>

        {v.kind === "jgss" && (
          <>
            <rect
              x="20"
              y="80"
              width="400"
              height="275"
              rx="15"
              className="fill-muted text-border"
              stroke="currentColor"
            />
            <text
              x="35"
              y="103"
              fontSize="13"
              fontWeight="700"
              className="fill-foreground"
            >
              Java 클라이언트 배포
            </text>
            <rect
              x="28"
              y="113"
              width="165"
              height="216"
              rx="8"
              className="fill-card text-muted-foreground"
              stroke="currentColor"
              strokeDasharray="5 4"
            />
            <text
              x="205"
              y="170"
              textAnchor="middle"
              fontSize="12"
              className="fill-muted-foreground"
              transform="rotate(-90 205 170)"
            >
              샌드박스 경계
            </text>
          </>
        )}
        {v.kind === "tls" && (
          <g className={tone("app")}>
            <rect
              x="22"
              y="124"
              width="396"
              height="62"
              rx="30"
              className="fill-muted"
              stroke="currentColor"
              strokeWidth="1.5"
            />
            <KeyRound x="36" y="142" size="23" />
            {[0, 1, 2].map((i) => (
              <g key={i}>
                <rect
                  x={75 + i * 107}
                  y="138"
                  width="96"
                  height="34"
                  rx="4"
                  className="fill-card"
                  stroke="currentColor"
                />
                <text
                  x={123 + i * 107}
                  y="160"
                  textAnchor="middle"
                  fontSize="13"
                  className="fill-foreground"
                >
                  {["인증", "암호화", "무결성"][i]}
                </text>
              </g>
            ))}
            <text
              x="220"
              y="204"
              textAnchor="middle"
              fontSize="12.5"
              className="fill-muted-foreground"
            >
              TLS 채널의 역할 · 특정 우회 패킷을 뜻하지 않음
            </text>
          </g>
        )}

        {sceneRoutes[v.kind].map((r, i) => {
          const transition = step?.transitions?.find(
            (t) => t.from === r.from && t.to === r.to,
          );
          const blocked =
            v.kind === "xml" &&
            r.from === "core" &&
            r.to === "target" &&
            resolved;
          return (
            <g
              key={i}
              className={transition ? color : "text-muted-foreground/60"}
            >
              <path
                d={r.path}
                fill="none"
                stroke="currentColor"
                strokeWidth={transition ? 2.4 : 1.3}
                strokeDasharray={transition ? undefined : "4 4"}
                markerEnd={blocked ? undefined : `url(#${marker})`}
              />
              {blocked && (
                <g className="text-emerald-700 dark:text-emerald-300">
                  <circle
                    cx="330"
                    cy="370"
                    r="10"
                    className="fill-card"
                    stroke="currentColor"
                    strokeWidth="2"
                  />
                  <path
                    d="M323 377L337 363"
                    stroke="currentColor"
                    strokeWidth="2"
                  />
                  <text
                    x="220"
                    y="375"
                    textAnchor="middle"
                    fontSize="12.5"
                    fontWeight="700"
                    fill="currentColor"
                  >
                    외부 요청 거부
                  </text>
                </g>
              )}
              {!blocked &&
                (transition ||
                  (v.kind === "tls" &&
                    r.from === "app" &&
                    r.to === "source")) && (
                  <text
                    x={r.label[0]}
                    y={r.label[1]}
                    textAnchor="middle"
                    fontSize="12.5"
                    fontWeight="700"
                    fill="currentColor"
                    className="stroke-background"
                    strokeWidth="5"
                    paintOrder="stroke"
                  >
                    {transition?.label ?? "TLS 응답 · 배경 경로"}
                  </text>
                )}
              {transition && !blocked && playing && !reduced && (
                <motion.circle
                  key={`${stepIndex}-${i}`}
                  r="3"
                  fill="currentColor"
                  initial={{ offsetDistance: "0%" }}
                  animate={{ offsetDistance: ["0%", "100%"] }}
                  transition={{
                    duration: 1.4,
                    repeat: Infinity,
                    repeatDelay: 1,
                  }}
                  style={{ offsetPath: `path('${r.path}')` }}
                />
              )}
            </g>
          );
        })}

        {commonInput}

        {v.kind === "xml" && (
          <>
            <g className={tone("core")}>
              <rect
                x="20"
                y="160"
                width="400"
                height="190"
                rx="12"
                className="fill-card"
                stroke="currentColor"
                strokeWidth="1.8"
              />
              <text
                x="38"
                y="184"
                fontSize="15"
                fontWeight="750"
                className="fill-foreground"
              >
                XML 문서 트리 · libxml2
              </text>
              <path
                d="M44 207V270H78M44 226H78"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              />
              <FileCode2 x="79" y="209" size="25" />
              <text x="117" y="226" fontSize="14" className="fill-foreground">
                원본 문서 · NONET
              </text>
              <rect
                x="78"
                y="247"
                width="320"
                height="64"
                rx="7"
                className="fill-muted"
                stroke="currentColor"
              />
              <text
                x="238"
                y="272"
                textAnchor="middle"
                fontSize="14"
                fontWeight="700"
                className="fill-foreground"
              >
                XInclude → 커스텀 로더
              </text>
              <text
                x="238"
                y="294"
                textAnchor="middle"
                fontSize="13"
                className={
                  resolved
                    ? "fill-emerald-700 dark:fill-emerald-300"
                    : affected
                      ? "fill-rose-700 dark:fill-rose-300"
                      : "fill-muted-foreground"
                }
              >
                {resolved
                  ? "parseFlags 상속 → 정책 유지"
                  : affected
                    ? "parseFlags 누락 → 정책 단절"
                    : "옵션은 하위 처리에도 필요"}
              </text>
              <text
                x="220"
                y="333"
                textAnchor="middle"
                fontSize="13"
                className="fill-muted-foreground"
              >
                {resolved
                  ? "네트워크 요청 거부 → 정의된 fallback"
                  : "xmlXIncludeProcess / ProcessTree"}
              </text>
            </g>
            {node(
              "target",
              "resource",
              resolved ? "외부 요청 거부" : "외부·내부 자원",
            )}
            {ops}
            {note("문서 옵션 → 하위 파서 → 네트워크 정책", 507)}
          </>
        )}

        {v.kind === "heap" && (
          <>
            <g className={tone("core")}>
              <path
                d="M42 184H169V306H42Z"
                className="fill-card"
                stroke="currentColor"
                strokeWidth="2"
              />
              {[0, 1, 2, 3].map((i) => (
                <path
                  key={i}
                  d={`M${58 + i * 29} 176V184 M${58 + i * 29} 306V314 M34 ${200 + i * 29}H42 M169 ${200 + i * 29}H177`}
                  stroke="currentColor"
                  strokeWidth="2"
                />
              ))}
              <Cpu x="87" y="203" size="37" />
              <text
                x="105"
                y="258"
                textAnchor="middle"
                fontSize="15"
                fontWeight="750"
                className="fill-foreground"
              >
                AVX-512
              </text>
              <text
                x="105"
                y="282"
                textAnchor="middle"
                fontSize="13"
                className="fill-muted-foreground"
              >
                Base64 intrinsic
              </text>
            </g>
            <g className={tone("target")}>
              <text
                x="325"
                y="166"
                textAnchor="middle"
                fontSize="15"
                fontWeight="750"
                className="fill-foreground"
              >
                JVM 힙 메모리
              </text>
              {Array.from({ length: 6 }, (_, i) => (
                <g key={i}>
                  <rect
                    x="228"
                    y={180 + i * 30}
                    width="185"
                    height="27"
                    rx="3"
                    className={i < 4 ? "fill-muted" : "fill-card"}
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeDasharray={i >= 4 ? "4 3" : undefined}
                  />
                  <text
                    x="320"
                    y={199 + i * 30}
                    textAnchor="middle"
                    fontSize="13"
                    className={
                      affected && i >= 4
                        ? "fill-rose-700 dark:fill-rose-300"
                        : "fill-foreground"
                    }
                  >
                    {i < 4
                      ? `출력 버퍼 ${i + 1}`
                      : affected
                        ? "! 인접 힙까지 쓰기"
                        : "인접 힙 · 출력 범위 밖"}
                  </text>
                </g>
              ))}
              <path
                d="M221 298H419"
                className={stateColor}
                stroke="currentColor"
                strokeWidth="3"
              />
              <text
                x="325"
                y="388"
                textAnchor="middle"
                fontSize="13"
                className={stateColor + " fill-current"}
              >
                {resolved
                  ? "수정 런타임 · 경계 보존"
                  : affected
                    ? "저장 마스크 오류 → 힙 손상"
                    : "출력 영역의 경계를 지켜야 함"}
              </text>
            </g>
            {ops}
            <g className={stateColor}>
              <rect
                x="205"
                y="425"
                width="215"
                height="52"
                rx="6"
                className="fill-card"
                stroke="currentColor"
              />
              <text
                x="312"
                y="447"
                textAnchor="middle"
                fontSize="13.5"
                fontWeight="700"
                fill="currentColor"
              >
                {mitigated
                  ? "Base64 가속 임시 비활성화"
                  : resolved
                    ? "새 빌드·정상 디코딩 확인"
                    : "충돌 · 정보 노출 · 조건부 RCE"}
              </text>
              <text
                x="312"
                y="468"
                textAnchor="middle"
                fontSize="12"
                className="fill-muted-foreground"
              >
                JVM · CPU · 입력 조건 함께 확인
              </text>
            </g>
            {note("메모리 칸은 경계 설명용 · 실제 exploit 오프셋 아님", 508)}
          </>
        )}

        {v.kind === "jgss" && (
          <>
            <g className={tone("core")}>
              <path
                d="M231 210H379V282Q374 315 305 333Q236 315 231 282Z"
                className="fill-card"
                stroke="currentColor"
                strokeWidth="1.8"
              />
              <ShieldCheck x="286" y="223" size="36" />
              <text
                x="305"
                y="281"
                textAnchor="middle"
                fontSize="16"
                fontWeight="750"
                className="fill-foreground"
              >
                JGSS API
              </text>
              <text
                x="305"
                y="305"
                textAnchor="middle"
                fontSize="12.5"
                fill="currentColor"
              >
                보안 컨텍스트
              </text>
              <text
                x="305"
                y="138"
                textAnchor="middle"
                fontSize="13"
                className="fill-foreground"
              >
                샌드박스에 의존하는 배포
              </text>
              <rect
                x="234"
                y="155"
                width="142"
                height="29"
                rx="4"
                className="fill-muted"
                stroke="currentColor"
                strokeDasharray="4 3"
              />
              <text
                x="305"
                y="175"
                textAnchor="middle"
                fontSize="12.5"
                className={stateColor + " fill-current"}
              >
                {resolved ? "수정 런타임 적용" : "경계 위반 방식 미공개"}
              </text>
            </g>
            {node(
              "target",
              "record",
              phase === "result" ? "무단 조회 · 변경 영향" : "JGSS 접근 데이터",
            )}
            {ops}
            {note("일반 서버의 SSO 전체에 적용되는 것은 아님", 511)}
          </>
        )}

        {v.kind === "tls" && (
          <>
            <g className={tone("core")}>
              <rect
                x="115"
                y="235"
                width="210"
                height="95"
                rx="12"
                className="fill-card"
                stroke="currentColor"
                strokeWidth="1.8"
              />
              <KeyRound x="135" y="251" size="28" />
              <text
                x="240"
                y="268"
                textAnchor="middle"
                fontSize="16"
                fontWeight="750"
                className="fill-foreground"
              >
                JSSE · TLS
              </text>
              <text
                x="220"
                y="295"
                textAnchor="middle"
                fontSize="13"
                fill="currentColor"
              >
                TLS 프레임워크 · 레코드 처리
              </text>
              <text
                x="220"
                y="316"
                textAnchor="middle"
                fontSize="12.5"
                className={stateColor + " fill-current"}
              >
                {resolved
                  ? "수정 빌드 · 연결 회귀 확인"
                  : "구체적 메시지·결함 함수 미공개"}
              </text>
            </g>
            {node(
              "target",
              "record",
              phase === "result" ? "무단 조회 · 변경 가능" : "기밀성 · 무결성",
            )}
            {ops}
            {note("API 입력 경로와 비신뢰 코드 배포 모두 대조", 510)}
          </>
        )}

        {v.kind === "compiler" && (
          <>
            <g className={tone("core")}>
              <rect
                x="20"
                y="157"
                width="400"
                height="178"
                rx="12"
                className="fill-card"
                stroke="currentColor"
                strokeWidth="1.8"
              />
              <text
                x="220"
                y="182"
                textAnchor="middle"
                fontSize="15"
                fontWeight="750"
                className="fill-foreground"
              >
                Compiler · 처리 경로의 역할
              </text>
              <path
                d="M41 202H129L147 240L129 278H41Z M156 202H260L278 240L260 278H156Z M287 202H394V278H287Z"
                className="fill-muted"
                stroke="currentColor"
              />
              <FileCode2 x="73" y="212" size="23" />
              <Cpu x="204" y="212" size="23" />
              <Braces x="328" y="212" size="23" />
              <text
                x="88"
                y="260"
                textAnchor="middle"
                fontSize="13"
                className="fill-foreground"
              >
                입력 표현
              </text>
              <text
                x="216"
                y="260"
                textAnchor="middle"
                fontSize="13"
                className="fill-foreground"
              >
                컴파일 처리
              </text>
              <text
                x="341"
                y="260"
                textAnchor="middle"
                fontSize="13"
                className="fill-foreground"
              >
                실행 코드
              </text>
              <text
                x="220"
                y="310"
                textAnchor="middle"
                fontSize="13"
                className={stateColor + " fill-current"}
              >
                {resolved
                  ? "수정 Compiler · 실행 결과 회귀 확인"
                  : "? 결함 단계·트리거는 특정하지 않음"}
              </text>
            </g>
            {node(
              "target",
              "monitor",
              affected ? "hang · 반복 crash 가능" : "프로세스 상태",
            )}
            <g className={stateColor}>
              <path
                d={
                  affected
                    ? "M270 480H390"
                    : "M270 480H299L306 469L315 489L324 480H390"
                }
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              />
            </g>
            {ops}
            {note("가용성 High · 일부 데이터 영향도 존재", 512)}
          </>
        )}

        {v.kind === "library" && (
          <>
            <g className={tone("core")}>
              {[0, 1, 2].map((i) => (
                <g key={i}>
                  <path
                    d={`M${28 + i * 5} ${185 + i * 41}H${185 + i * 5}Q${204 + i * 5} ${202 + i * 41} ${185 + i * 5} ${219 + i * 41}H${28 + i * 5}Z`}
                    className="fill-card"
                    stroke="currentColor"
                    strokeWidth="1.7"
                  />
                  <path
                    d={`M${42 + i * 5} ${185 + i * 41}V${219 + i * 41}`}
                    stroke="currentColor"
                  />
                  <text
                    x={112 + i * 5}
                    y={207 + i * 41}
                    textAnchor="middle"
                    fontSize="13.5"
                    className="fill-foreground"
                  >
                    {
                      ["Java Libraries", "공용 API 모듈", "세부 메서드 미공개"][
                        i
                      ]
                    }
                  </text>
                </g>
              ))}
              <text
                x="110"
                y="167"
                textAnchor="middle"
                fontSize="15"
                fontWeight="750"
                className="fill-foreground"
              >
                Libraries
              </text>
            </g>
            <g className={tone("target")}>
              <rect
                x="252"
                y="242"
                width="164"
                height="100"
                rx="9"
                className="fill-card"
                stroke="currentColor"
                strokeWidth="1.8"
              />
              <Braces x="316" y="251" size="25" />
              <text
                x="334"
                y="296"
                textAnchor="middle"
                fontSize="14"
                fontWeight="700"
                className="fill-foreground"
              >
                일부 접근 데이터
              </text>
              <text
                x="334"
                y="320"
                textAnchor="middle"
                fontSize="12.5"
                className={stateColor + " fill-current"}
              >
                {resolved
                  ? "수정 배포 · 결과 검증"
                  : "조회 · 갱신 · 삽입 · 삭제"}
              </text>
              <path
                d="M334 342V366H256M334 366H415"
                stroke="currentColor"
                fill="none"
                strokeDasharray="4 3"
              />
              <text
                x="335"
                y="387"
                textAnchor="middle"
                fontSize="13"
                className={stateColor + " fill-current"}
              >
                {affected
                  ? "동시에 서비스 전체 DoS 가능"
                  : "서비스 상태도 별도로 관측"}
              </text>
            </g>
            {ops}
            <g className={stateColor}>
              <rect
                x="224"
                y="420"
                width="191"
                height="58"
                rx="6"
                className="fill-card"
                stroke="currentColor"
              />
              <Server x="238" y="435" size="26" />
              <text
                x="339"
                y="445"
                textAnchor="middle"
                fontSize="14"
                fontWeight="700"
                fill="currentColor"
              >
                {affected ? "응답 중단 가능" : "서비스 가용성"}
              </text>
              <text
                x="339"
                y="466"
                textAnchor="middle"
                fontSize="12"
                className="fill-muted-foreground"
              >
                반환 결과 · 오류율 · 지연
              </text>
            </g>
            {note("구체적 메서드·역직렬화 결함은 확정하지 않음", 511)}
          </>
        )}
      </svg>
      <div className="flex items-start gap-2 border-t border-border px-3 py-2 text-xs leading-relaxed text-muted-foreground">
        {resolved ? (
          <PackageCheck size={15} className="mt-0.5 shrink-0" />
        ) : unknown ? (
          <ShieldCheck size={15} className="mt-0.5 shrink-0" />
        ) : (
          <FileCode2 size={15} className="mt-0.5 shrink-0" />
        )}
        <p>
          {resolved
            ? "수정 배포와 확인 절차의 설명 장면입니다. 이 화면에서 실제 JVM 패치나 공격 시험을 수행하지 않습니다."
            : unknown
              ? "점선과 물음표는 세부 결함 미공개를 뜻합니다. 도형은 각 구성요소의 역할·적용 조건·공지된 영향을 구분합니다."
              : v.kind === "xml"
                ? "NVD 원인과 연결된 업스트림 패치에 근거한 옵션 전달 모형입니다."
                : "연구진의 원인 분석에 근거한 CPU·메모리 경계 모형입니다. 바이트 크기와 exploit 오프셋은 단순화했습니다."}
        </p>
      </div>
    </div>
  );
}
