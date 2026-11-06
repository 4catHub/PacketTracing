import { useEffect, useId, useState } from "react";
import { useReducedMotion } from "framer-motion";
import { AppWindow, Globe, Monitor, Network, Server } from "lucide-react";
import WorkflowFocusedViz, { type WorkflowTopologyCanvasProps } from "./WorkflowFocusedViz";
import type {
  WorkflowTopologyLink,
  WorkflowVisualizationSpec,
  WorkflowVisualizationStep,
  WorkflowWaterfallSpan,
} from "./workflow-visualization";

const actors = [
  { id: "publisher", label: "배포 운영", detail: "Level Infinite", icon: Server, accent: "blue", x: 14, y: 23, compactX: 23, compactY: 13 },
  { id: "cdn", label: "공식 CDN", detail: "런처 JavaScript", icon: Network, accent: "blue", x: 50, y: 23, compactX: 77, compactY: 13 },
  { id: "launcher", label: "PC 런처", detail: "브라우저 · 브리지", icon: AppWindow, accent: "violet", x: 86, y: 23, compactX: 77, compactY: 50 },
  { id: "external", label: "외부 서버", detail: "도메인 · 번들", icon: Globe, accent: "rose", x: 50, y: 77, compactX: 23, compactY: 50 },
  { id: "pc", label: "사용자 PC", detail: "로컬 실행 · 계정", icon: Monitor, accent: "violet", x: 86, y: 77, compactX: 77, compactY: 87 },
] as const;

type ActorId = typeof actors[number]["id"];
type Step = WorkflowVisualizationStep & { short: string };

const links: WorkflowTopologyLink[] = [
  { from: "publisher", to: "cdn" },
  { from: "cdn", to: "launcher" },
  { from: "launcher", to: "external" },
  { from: "launcher", to: "pc" },
];

function span(
  actorId: ActorId, label: string, start: number, end: number,
  tone: WorkflowWaterfallSpan["tone"], kind: WorkflowWaterfallSpan["kind"] = "work",
): WorkflowWaterfallSpan {
  return { actorId, label, start, end, tone, kind };
}

const attackSteps: Step[] = [
  {
    short: "도메인",
    title: "외부 도메인 선점",
    summary: "9월 27일 10:59(KST), 일부 게임 서비스에서 쓰던 외부 도메인이 제3자에게 넘어갔습니다.",
    activeActorIds: ["external"],
    spans: [span("external", "외부 도메인 선점", 0.1, 0.9, "danger")],
  },
  {
    short: "변조",
    title: "공식 CDN 스크립트 4개 변조",
    summary: "같은 날 15:41~15:42(KST), 공식 스크립트에 외부 로더를 불러오는 코드가 추가됐습니다. CDN 파일을 어떻게 수정했는지는 공개 조사에서 밝혀지지 않았습니다.",
    activeActorIds: ["cdn"],
    spans: [span("cdn", "스크립트 4개 변조", 0.1, 0.9, "danger")],
  },
  {
    short: "로딩",
    title: "공식 런처가 변조된 JavaScript 로딩",
    summary: "사용자가 평소처럼 런처를 열면, 내장 브라우저가 공식 CDN에서 받은 스크립트를 실행합니다.",
    activeActorIds: ["cdn", "launcher"],
    transitions: [{ from: "cdn", to: "launcher", label: "변조 JavaScript 전달" }],
    spans: [
      span("cdn", "변조 스크립트 응답", 0.05, 0.5, "danger", "network"),
      span("launcher", "내장 브라우저 로딩", 0.5, 0.95, "warning"),
    ],
  },
  {
    short: "다운로드",
    title: "외부 로더가 추가 번들을 다운로드",
    summary: "독립 분석에 따르면 일부 실행에서 외부 로더가 JavaScript 브리지에 다운로드를 요청했고, 외부 서버에서 K2F가 담긴 번들이 내려왔습니다.",
    activeActorIds: ["launcher", "external"],
    transitions: [
      { from: "launcher", to: "external", label: "외부 로더 호출" },
      { from: "external", to: "launcher", label: "조건부 번들 전달" },
    ],
    spans: [
      span("launcher", "외부 로더 요청", 0.05, 0.32, "warning", "network"),
      span("external", "로더·번들 응답", 0.32, 0.72, "danger", "network"),
      span("launcher", "브리지로 번들 저장", 0.72, 0.96, "warning"),
    ],
  },
  {
    short: "실행",
    title: "K2F가 사용자 권한으로 실행",
    summary: "실행이 확인된 PC에서는 원격 명령과 파일 접근이 가능해졌습니다. 에이전트가 초기화됐다는 기록과 실제 정보 유출의 증거는 별개입니다.",
    activeActorIds: ["launcher", "pc"],
    transitions: [{ from: "launcher", to: "pc", label: "K2F Lua 에이전트 실행" }],
    spans: [
      span("launcher", "Lua 에이전트 로딩", 0.05, 0.42, "danger"),
      span("pc", "사용자 권한 실행", 0.42, 0.96, "danger"),
    ],
  },
];

const responseSteps: Step[] = [
  {
    short: "파일 교체",
    title: "운영사가 변조 파일 3개 교체",
    summary: "11월 4일 02:04~02:23(KST), 운영사가 변조된 스크립트 4개 중 3개를 정상 파일로 교체했습니다.",
    activeActorIds: ["publisher", "cdn"],
    transitions: [{ from: "publisher", to: "cdn", label: "정상 파일 3개 반영" }],
    spans: [
      span("publisher", "정상본 준비·교체", 0.05, 0.55, "success"),
      span("cdn", "3개 파일 갱신", 0.55, 0.96, "success"),
    ],
  },
  {
    short: "캐시 갱신",
    title: "나머지 1개는 CDN 캐시 갱신",
    summary: "11월 4일 12:09(KST), 운영사가 마지막 스크립트의 CDN 캐시 갱신을 완료했다고 밝혔습니다. 관련 노드에 정상 파일이 순차 반영됐습니다.",
    activeActorIds: ["publisher", "cdn", "launcher"],
    transitions: [
      { from: "publisher", to: "cdn", label: "남은 1개 캐시 갱신" },
      { from: "cdn", to: "launcher", label: "정상 스크립트 제공" },
    ],
    spans: [
      span("publisher", "캐시 갱신 요청", 0.05, 0.3, "success", "network"),
      span("cdn", "엣지 노드 순차 반영", 0.3, 0.7, "success"),
      span("launcher", "정상 파일 수신", 0.7, 0.96, "success", "network"),
    ],
  },
  {
    short: "PC 점검",
    title: "사용자 PC의 악성 프로그램을 별도 점검",
    summary: "11월 5일 08:00(KST)부터 공식 PC 클라이언트에 검사·제거 기능을 제공했습니다. 런처 없이 확인하는 수동 점검 방법도 공개했습니다.",
    activeActorIds: ["launcher", "pc"],
    transitions: [{ from: "launcher", to: "pc", label: "이 사건의 악성코드 검사·제거" }],
    spans: [
      span("launcher", "검사 기능 시작", 0.05, 0.42, "success"),
      span("pc", "탐지 시 동의 후 제거", 0.42, 0.96, "success"),
    ],
  },
  {
    short: "계정 보호",
    title: "노출 가능성이 있는 자격증명 교체",
    summary: "감염되지 않은 기기나 점검을 마친 PC에서 비밀번호를 변경하고, 기존 API 키와 토큰을 폐기·재발급합니다. 외부 계정 이상이나 금전 피해는 공식 고객센터에 접수합니다.",
    activeActorIds: ["pc"],
    spans: [
      span("pc", "비밀번호 변경", 0.05, 0.46, "success"),
      span("pc", "키·토큰 교체", 0.46, 0.96, "success"),
    ],
  },
];

const baseSpec = {
  actors: [...actors],
  topologyLinks: links,
  subjectRisk: "critical",
  motionTone: "restrained",
  overviewMs: 3400,
  autoplayMs: 6200,
  waterfallLabel: "현재 단계의 실행 순서 · 상대적 구간",
} satisfies Omit<WorkflowVisualizationSpec, "title" | "steps">;

const workflows = {
  attack: {
    ...baseSpec,
    title: "공식 런처에서 사용자 PC까지",
    overviewSummary: "런처는 공식 CDN에서 코드를 읽습니다. 변조된 코드가 외부 서버를 호출하면 추가 코드가 사용자 PC까지 도달할 수 있습니다.",
    steps: attackSteps,
  },
  response: {
    ...baseSpec,
    title: "공식 배포 복구와 사용자 보호",
    overviewSummary: "배포 운영은 CDN의 정상 파일을 복구합니다. 사용자 PC에는 별도의 검사·제거와 계정 보호가 필요합니다.",
    steps: responseSteps,
  },
};

type Mode = keyof typeof workflows;
const modeLabels: Record<Mode, string> = { attack: "공격 경로", response: "대응 경로" };

function NikkeTopology({ spec, stepIndex, playing, selectFrame }: WorkflowTopologyCanvasProps) {
  const [compact, setCompact] = useState(false);
  const reducedMotion = useReducedMotion();
  const markerId = useId();
  const step = stepIndex === null ? null : spec.steps[stepIndex];
  const response = spec === workflows.response;
  const steps = response ? responseSteps : attackSteps;
  const width = compact ? 360 : 900;
  const height = compact ? 430 : 360;
  const halfWidth = compact ? 74 : 101;
  const halfHeight = 36;
  const accent = response ? "#059669" : "#e11d48";
  const centers = new Map(actors.map((actor) => [actor.id, {
    x: (compact ? actor.compactX : actor.x) * width / 100,
    y: (compact ? actor.compactY : actor.y) * height / 100,
  }]));

  useEffect(() => {
    const media = window.matchMedia("(max-width: 640px)");
    const sync = () => setCompact(media.matches);
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

  function route(from: string, to: string, lane = 0) {
    const a = centers.get(from as ActorId)!;
    const b = centers.get(to as ActorId)!;
    const y = (a.y + b.y) / 2;
    const x = (a.x + b.x) / 2;
    if (a.x === b.x) {
      const direction = Math.sign(b.y - a.y);
      return { d: `M ${x} ${a.y + direction * halfHeight} V ${b.y - direction * halfHeight}`, x, y };
    }
    const direction = Math.sign(b.x - a.x);
    const startX = a.x + direction * halfWidth;
    const endX = b.x - direction * halfWidth;
    if (a.y === b.y) {
      return { d: `M ${startX} ${y + lane} H ${endX}`, x, y: y + lane };
    }
    return {
      d: `M ${startX} ${a.y + lane} H ${x + lane} V ${b.y + lane} H ${endX}`,
      x: x + lane,
      y,
    };
  }

  return (
    <div className="bg-background">
      <div className="flex flex-wrap gap-1.5 border-b border-border px-4 py-3" role="group" aria-label="단계 선택">
        {[{ short: "전체" }, ...steps].map(({ short }, i) => (
          <button type="button" key={short} aria-pressed={stepIndex === (i === 0 ? null : i - 1)}
            onClick={() => selectFrame(i === 0 ? null : i - 1)}
            className="min-h-8 rounded-md border border-border bg-card px-2.5 text-[11px] font-semibold text-foreground hover:bg-muted aria-pressed:border-primary aria-pressed:bg-primary aria-pressed:text-primary-foreground">
            {i === 0 ? short : `${i} ${short}`}
          </button>
        ))}
      </div>
      <svg viewBox={`0 0 ${width} ${height}`} className="block w-full" role="img"
        aria-label={`NIKKE 도형 워크플로우 · ${step?.title ?? "전체 구조"}`}>
        <defs>
          <marker id={markerId} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" orient="auto" markerUnits="userSpaceOnUse">
            <path d="M 0 0 L 10 5 L 0 10 Z" fill={accent} />
          </marker>
        </defs>
        {links.map(({ from, to }) => (
          <path key={`${from}-${to}`} d={route(from, to).d} fill="none"
            className="stroke-muted-foreground/60" strokeWidth="1.5" strokeDasharray="5 5" />
        ))}
        {actors.map(({ id, label, detail, icon: Icon }) => {
          const { x, y } = centers.get(id)!;
          const active = step?.activeActorIds.includes(id) ?? false;
          return (
            <g key={id} data-actor={id} data-active={active} transform={`translate(${x} ${y})`}>
              <rect x={-halfWidth} y={-halfHeight} width={2 * halfWidth} height={2 * halfHeight} rx="12"
                className={active ? "fill-card" : "fill-card stroke-border"} stroke={active ? accent : undefined} strokeWidth={active ? 2.5 : 1.5} />
              {active && <rect x={-halfWidth - 4} y={-halfHeight - 4} width={2 * halfWidth + 8} height={2 * halfHeight + 8}
                rx="16" fill="none" stroke={accent} strokeDasharray="4 4" />}
              <Icon x={-halfWidth + 12} y={-12} width="23" height="23" className="text-foreground" aria-hidden="true" />
              <text x={-halfWidth + 43} y="-4" className="fill-foreground" fontSize={compact ? 18 : 17} fontWeight="750">{label}</text>
              <text x={-halfWidth + 43} y="16" className="fill-muted-foreground" fontSize={compact ? 13 : 12}>{detail}</text>
            </g>
          );
        })}
        {step?.transitions?.map(({ from, to }, i) => {
          const externalTransfer = from === "external" || to === "external";
          const edge = route(from, to, externalTransfer ? (i === 0 ? -14 : 14) : 0);
          return (
            <g key={`${stepIndex}-${from}-${to}`}>
              <path d={edge.d} fill="none" stroke={accent} strokeWidth="2.75" markerEnd={`url(#${markerId})`} />
              {playing && !reducedMotion && (
                <circle r="3.5" className="fill-foreground">
                  <animateMotion dur="2.8s" begin={`${i * 0.35}s`} repeatCount="indefinite" path={edge.d} />
                </circle>
              )}
              <circle cx={edge.x} cy={edge.y} r="9" className="fill-card" stroke={accent} strokeWidth="1.5" />
              <text x={edge.x} y={edge.y + 3.5} textAnchor="middle" className="fill-foreground" fontSize="10" fontWeight="750">{i + 1}</text>
            </g>
          );
        })}
      </svg>
      <div className="flex min-h-24 items-center border-t border-border px-4 py-2 text-xs text-muted-foreground sm:min-h-20">
        {step?.transitions?.length ? (
          <ol className="space-y-1.5">
            {step.transitions.map(({ from, to, label }, i) => (
              <li className="flex items-start gap-2" key={`${from}-${to}`}>
                <span className="grid size-4 shrink-0 place-items-center rounded-full border border-border font-mono text-[10px] text-foreground">{i + 1}</span>
                <span><strong className="text-foreground">{actors.find((actor) => actor.id === from)?.label} → {actors.find((actor) => actor.id === to)?.label}</strong> · {label}</span>
              </li>
            ))}
          </ol>
        ) : step ? (
          <p><strong className="text-foreground">현재 작업</strong> · {step.title}</p>
        ) : (
          <p>점선은 전체 연결을, 실선 화살표는 현재 단계의 전달 방향을 나타냅니다. 번호는 아래 설명의 순서와 같습니다.</p>
        )}
      </div>
    </div>
  );
}

export default function NikkeSupplyChainViz() {
  const [mode, setMode] = useState<Mode>("attack");

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2" role="group" aria-label="NIKKE 워크플로우 선택">
        {(["attack", "response"] as const).map((value) => (
          <button type="button" key={value} aria-pressed={mode === value} onClick={() => setMode(value)}
            className="rounded-lg border border-border bg-card px-3 py-2 text-xs font-semibold text-foreground hover:bg-muted aria-pressed:border-primary aria-pressed:bg-primary aria-pressed:text-primary-foreground">
            {modeLabels[value]}
          </button>
        ))}
      </div>
      <WorkflowFocusedViz key={mode} spec={workflows[mode]} TopologyCanvas={NikkeTopology} />
    </div>
  );
}
