import { useId, useState } from "react";
import WorkflowFocusedViz, { type WorkflowTopologyCanvasProps } from "./WorkflowFocusedViz";
import type {
  WorkflowVisualizationSpec,
  WorkflowVisualizationStep,
  WorkflowWaterfallSpan,
} from "./workflow-visualization";

const actors = [
  { id: "waiter", label: "A · 대기 스레드", detail: "체인 잠금 보유", x: 24, y: 14, accent: "blue" },
  { id: "requeuer", label: "B · 재큐잉 스레드", detail: "대리 요청자", x: 76, y: 14, accent: "violet" },
  { id: "kernel", label: "커널", detail: "잠금·PI 체인 관리", x: 50, y: 51.25, accent: "amber" },
  { id: "stack", label: "A의 커널 스택", detail: "대기 객체 저장 위치", x: 24, y: 88.5, accent: "cyan" },
  { id: "owner", label: "C · 대상 잠금 소유자", detail: "대상 PI 잠금 보유", x: 76, y: 88.5, accent: "emerald" },
] as const;

type ActorId = (typeof actors)[number]["id"];
type Mode = "vulnerable" | "patched";
type Tone = "normal" | "warning" | "danger" | "safe";

interface GhostLockStep extends WorkflowVisualizationStep {
  states: Partial<Record<ActorId, string>>;
  pointer?: "live" | "dangling" | "cleared";
  tone?: Tone;
}

type GhostLockSpec = WorkflowVisualizationSpec & { steps: GhostLockStep[] };

const span = (
  actorId: ActorId,
  label: string,
  start: number,
  end: number,
  status: WorkflowWaterfallSpan["status"] = "default",
  kind: WorkflowWaterfallSpan["kind"] = "work",
): WorkflowWaterfallSpan => ({
  actorId, label, start, end, status, kind,
  tone: status === "error" ? "danger" : status === "success" ? "success" : status === "warning" ? "warning" : "primary",
});

const sharedSteps: GhostLockStep[] = [
  {
    title: "A가 원본 futex에서 대기",
    summary: "체인 잠금을 가진 A가 재큐잉을 기다립니다. 대기 객체가 A의 커널 스택에 생성됩니다.",
    activeActorIds: ["waiter", "kernel", "stack"],
    states: { waiter: "원본 futex에서 대기", kernel: "원본 큐에 A 등록", stack: "대기 객체 생성" },
    transitions: [
      { from: "waiter", to: "kernel", label: "대기 호출" },
      { from: "kernel", to: "stack", label: "객체 생성", kind: "state" },
    ],
    spans: [
      span("waiter", "원본 futex에서 대기", .02, .98, "default", "wait"),
      span("kernel", "원본 큐에 등록", .18, .54),
      span("stack", "대기 객체 생성", .18, .55),
    ],
  },
  {
    title: "C가 A의 잠금을 기다림",
    summary: "C는 대상 PI 잠금을 가진 채 A의 체인 잠금을 기다립니다. 이 의존성이 다음 단계에서 닫힌 고리를 만듭니다.",
    activeActorIds: ["owner", "kernel", "waiter"],
    states: { waiter: "체인 잠금 유지", owner: "A의 잠금을 기다림", kernel: "C가 A에 의존", stack: "대기 객체 유지" },
    transitions: [
      { from: "owner", to: "kernel", label: "체인 잠금 요청" },
      { from: "kernel", to: "waiter", label: "A가 잠금 소유", kind: "state" },
    ],
    spans: [
      span("waiter", "체인 잠금 보유 중", .02, .98),
      span("kernel", "C의 대기 등록", .2, .51),
      span("owner", "A의 잠금 대기", .32, .98, "default", "wait"),
    ],
  },
  {
    title: "B가 재큐잉하자 교착 감지",
    summary: "B가 A의 대기를 대상 PI futex로 옮기려 합니다. A가 C를, C가 A를 기다리는 순환을 커널이 감지합니다.",
    activeActorIds: ["requeuer", "kernel", "owner", "waiter", "stack"],
    states: { waiter: "C의 잠금 대기 시도", requeuer: "current = B", kernel: "A → C → A · -EDEADLK", stack: "waiter->task = A", owner: "A의 잠금을 기다림" },
    pointer: "live",
    tone: "warning",
    transitions: [
      { from: "requeuer", to: "kernel", label: "대리 재큐잉" },
      { from: "waiter", to: "kernel", label: "A의 대기 관계", kind: "state" },
      { from: "kernel", to: "owner", label: "PI 체인 탐색", kind: "state" },
    ],
    spans: [
      span("owner", "A의 잠금 대기 중", .02, .98, "default", "wait"),
      span("requeuer", "A를 대신해 재큐잉", .05, .36),
      span("waiter", "대상 잠금 대기 시도", .32, .7, "warning", "wait"),
      span("kernel", "PI 순환 감지", .52, .98, "warning"),
    ],
  },
];

const vulnerableSteps: GhostLockStep[] = [
  ...sharedSteps,
  {
    title: "롤백이 잘못된 B를 정리",
    summary: "커널은 B의 pi_lock을 잡고 A의 대기 객체를 트리에서 뺀 뒤 B의 pi_blocked_on을 초기화합니다. A의 참조는 남습니다.",
    activeActorIds: ["kernel", "requeuer", "waiter", "stack"],
    states: { waiter: "참조가 남음", requeuer: "B의 상태를 초기화", kernel: "remove_waiter()", stack: "트리에서 제거", owner: "A의 잠금을 기다림" },
    pointer: "live",
    tone: "danger",
    transitions: [
      { from: "kernel", to: "requeuer", label: "잘못된 정리 대상", kind: "state" },
      { from: "kernel", to: "stack", label: "대기 객체 제거", kind: "state" },
    ],
    spans: [
      span("kernel", "B의 잠금으로 트리 제거", .05, .56, "error"),
      span("requeuer", "B의 대기 상태 초기화", .38, .7, "error"),
      span("waiter", "A의 참조 잔존", .68, .98, "warning"),
    ],
  },
  {
    title: "A가 복귀하고 참조만 남음",
    summary: "A가 사용자 공간으로 돌아가며 대기 객체의 수명이 끝납니다. A의 pi_blocked_on은 여전히 이전 스택 주소를 가리킵니다.",
    activeActorIds: ["waiter", "kernel", "stack"],
    states: { waiter: "사용자 공간 복귀", kernel: "대기 호출 반환", stack: "대기 객체 수명 종료" },
    pointer: "dangling",
    tone: "danger",
    transitions: [{ from: "kernel", to: "waiter", label: "대기 호출 종료", kind: "response" }],
    spans: [
      span("waiter", "사용자 공간으로 복귀", .05, .43),
      span("stack", "스택 프레임 수명 종료", .27, .62),
      span("waiter", "유효하지 않은 주소가 남음", .62, .98, "error"),
    ],
  },
  {
    title: "후속 PI 탐색에서 스택 UAF",
    summary: "다시 A의 PI 체인을 탐색하면 커널이 남은 주소를 역참조합니다. 재사용된 스택을 읽으면서 시스템 정지 또는 조건부 권한 상승으로 이어질 수 있습니다.",
    activeActorIds: ["kernel", "waiter", "stack"],
    states: { waiter: "유효하지 않은 참조", kernel: "오래된 주소에 접근", stack: "스택 슬롯 재사용 가능" },
    pointer: "dangling",
    tone: "danger",
    transitions: [
      { from: "kernel", to: "waiter", label: "후속 PI 탐색", kind: "state" },
      { from: "kernel", to: "stack", label: "수명 종료 후 접근", kind: "state" },
    ],
    spans: [
      span("kernel", "A의 PI 체인 재탐색", .03, .36),
      span("waiter", "남은 참조를 읽음", .35, .67, "warning"),
      span("stack", "수명 종료된 객체에 접근", .66, .98, "error"),
    ],
  },
];

const patchedSteps: GhostLockStep[] = [
  ...sharedSteps,
  {
    title: "롤백이 실제 대기자 A를 정리",
    summary: "A의 pi_lock 아래 대기 객체를 트리에서 제거하고 A의 pi_blocked_on을 비웁니다. 필요한 PI 재조정에도 A를 전달합니다.",
    activeActorIds: ["kernel", "requeuer", "waiter", "stack"],
    states: { waiter: "pi_blocked_on = NULL", requeuer: "current = B", kernel: "waiter->task 기준", stack: "트리에서 제거", owner: "A의 잠금을 기다림" },
    pointer: "cleared",
    tone: "safe",
    transitions: [
      { from: "kernel", to: "waiter", label: "A의 잠금·상태 정리", kind: "state" },
      { from: "kernel", to: "stack", label: "대기 객체 제거", kind: "state" },
    ],
    spans: [
      span("kernel", "A의 pi_lock을 잡음", .04, .35, "success"),
      span("stack", "트리에서 대기 객체 제거", .33, .59, "success"),
      span("waiter", "A의 대기 참조 초기화", .59, .98, "success"),
    ],
  },
  {
    title: "복귀 후에도 오래된 참조가 없음",
    summary: "A의 대기 객체는 수명이 끝나지만, 참조는 이미 NULL입니다. 후속 PI 탐색이 이전 스택 주소를 따라가는 경로가 끊깁니다.",
    activeActorIds: ["kernel", "waiter", "stack"],
    states: { waiter: "pi_blocked_on = NULL", kernel: "오래된 주소 접근 차단", stack: "대기 객체 수명 종료" },
    pointer: "cleared",
    tone: "safe",
    transitions: [{ from: "kernel", to: "waiter", label: "A의 PI 상태 확인", kind: "state" }],
    spans: [
      span("waiter", "대기 호출 종료", .05, .4, "success"),
      span("stack", "스택 프레임 수명 종료", .26, .62),
      span("kernel", "후속 탐색에서 참조 없음", .61, .98, "success"),
    ],
  },
  {
    title: "후속 수정 · 큐 등록 전 오류 분기",
    summary: "별도 조기 오류 경로입니다. 대기 객체가 큐에 등록되지 않았다면 remove_waiter()를 건너뛰어 초기 수정의 NULL 역참조를 막습니다.",
    activeActorIds: ["requeuer", "kernel", "stack"],
    states: { waiter: "재큐잉 대상", requeuer: "대리 요청 중 오류", kernel: "remove_waiter() 생략", stack: "큐 미등록 · task 미설정", owner: "별도 오류 분기" },
    tone: "safe",
    transitions: [{ from: "requeuer", to: "kernel", label: "등록 전 오류", kind: "event" }],
    spans: [
      span("requeuer", "대리 잠금 요청", .03, .31),
      span("stack", "대기 객체 미등록", .3, .62, "warning"),
      span("kernel", "미등록 확인 후 제거 생략", .6, .98, "success"),
    ],
  },
];

const topologyLinks = [
  { from: "waiter", to: "kernel", label: "대기와 PI 상태" },
  { from: "requeuer", to: "kernel", label: "대리 재큐잉" },
  { from: "kernel", to: "stack", label: "대기 객체 수명" },
  { from: "kernel", to: "owner", label: "대상 PI 잠금" },
];

const baseSpec = {
  actors: [...actors],
  topologyLinks,
  overviewSummary: "A는 실제 대기자, B는 A 대신 재큐잉을 요청하는 스레드, C는 대상 잠금 소유자입니다. A의 커널 스택에 있는 대기 객체의 수명을 따라갑니다.",
  waterfallLabel: "단계별 실행 순서 · 막대 구간은 설명용",
  subjectRisk: "critical",
  motionTone: "restrained",
  autoplayMs: 5200,
  overviewMs: 3000,
} satisfies Omit<GhostLockSpec, "title" | "steps">;

const scenarios: Record<Mode, GhostLockSpec> = {
  vulnerable: { ...baseSpec, title: "취약 경로 · 대리 롤백에서 스택 UAF까지", steps: vulnerableSteps },
  patched: { ...baseSpec, title: "수정 경로 · 실제 대기자 정리와 조기 오류 처리", steps: patchedSteps },
};

const colors: Record<Tone, string> = {
  normal: "text-blue-700 dark:text-blue-300",
  warning: "text-amber-700 dark:text-amber-300",
  danger: "text-rose-700 dark:text-rose-300",
  safe: "text-emerald-700 dark:text-emerald-300",
};

const routes = [
  { from: "waiter", to: "kernel", points: [[96, 74], [138, 136]], label: [87, 112] },
  { from: "requeuer", to: "kernel", points: [[304, 74], [262, 136]], label: [313, 112] },
  { from: "kernel", to: "stack", points: [[138, 194], [96, 257]], label: [87, 231] },
  { from: "kernel", to: "owner", points: [[262, 194], [304, 257]], label: [313, 231] },
];

const pointerLabels = {
  live: ["A의 대기 참조", "유지"],
  dangling: ["수명 끝난 주소", "참조가 남음"],
  cleared: ["A의 대기 참조", "해제"],
};

function GhostLockScene({ spec, stepIndex, selectFrame }: WorkflowTopologyCanvasProps) {
  const step = stepIndex === null ? undefined : (spec as GhostLockSpec).steps[stepIndex];
  const markerId = `ghostlock-arrow-${useId().replace(/:/g, "")}`;
  const tone = step?.tone ?? "normal";
  const pointer = step?.pointer;
  const pointerTone = pointer === "cleared" ? "safe" : pointer === "dangling" ? "danger" : "warning";

  return (
    <div className="border-t border-border bg-background">
      <svg
        viewBox="0 0 400 322"
        className="mx-auto block w-full max-w-[660px]"
        role="img"
        aria-label={step
          ? `${step.title}. ${actors.map(actor => `${actor.label}: ${step.states[actor.id] ?? actor.detail}`).join(". ")}${pointer ? `. ${pointerLabels[pointer].join(" ")}` : ""}`
          : "A 대기 스레드와 B 재큐잉 스레드가 커널과 연결됩니다. 커널은 A의 스택에 있는 대기 객체와 C가 보유한 PI 잠금을 다룹니다."}
      >
        <defs>
          <marker id={markerId} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="10" markerHeight="10" markerUnits="userSpaceOnUse" orient="auto">
            <path d="M 0 0 L 10 5 L 0 10 Z" fill="context-stroke" />
          </marker>
        </defs>

        {routes.map(({ from, to, points, label }) => {
          const transition = step?.transitions?.find(edge =>
            (edge.from === from && edge.to === to) || (edge.from === to && edge.to === from));
          const path = transition?.from === to ? [...points].reverse() : points;
          return (
            <g key={from + to} className={transition ? colors[tone] : "text-muted-foreground/55"}>
              <polyline
                points={path.map(point => point.join(",")).join(" ")}
                fill="none"
                stroke="currentColor"
                strokeWidth={transition ? 2.3 : 1.3}
                strokeDasharray={transition ? undefined : "3 4"}
                markerEnd={transition ? `url(#${markerId})` : undefined}
              />
              {transition && (
                <text x={label[0]} y={label[1]} textAnchor="middle" fontSize="12.5" fontWeight="700" fill="currentColor"
                  className="stroke-background" strokeWidth="5" strokeLinejoin="round" paintOrder="stroke">
                  {transition.label}
                </text>
              )}
            </g>
          );
        })}

        {pointer && (
          <g className={colors[pointerTone]}>
            <path d={pointer === "cleared" ? "M 24 45 H 11 V 133 M 11 198 V 285 H 24" : "M 24 45 H 11 V 285 H 24"}
              fill="none" stroke="currentColor" strokeWidth="2.3"
              strokeDasharray={pointer === "live" ? undefined : "5 4"}
              markerEnd={pointer === "cleared" ? undefined : `url(#${markerId})`} />
            <text x="19" y="160" fontSize="13.5" fontWeight="700" fill="currentColor">
              {pointerLabels[pointer][0]}
              <tspan x="19" dy="17">{pointerLabels[pointer][1]}</tspan>
            </text>
          </g>
        )}

        {actors.map(actor => {
          const active = step?.activeActorIds.includes(actor.id);
          const x = actor.x * 4;
          const y = Math.round(actor.y * 3.22);
          const width = actor.id === "kernel" ? 176 : 144;
          const label = actor.id === "kernel" ? "커널 · futex / rtmutex" : actor.label;
          const state = step?.states[actor.id] ?? actor.detail;
          return (
            <g key={actor.id} className={active ? colors[tone] : "text-border"}>
              <rect x={x - width / 2} y={y - 29} width={width} height="58" rx={actor.id === "kernel" ? 7 : 13}
                className="fill-card" stroke="currentColor" strokeWidth={active ? 2.4 : 1.2} />
              <text x={x} y={y - 5} textAnchor="middle" fontSize="14.5" fontWeight="800" className="fill-foreground">
                {label}
              </text>
              <text x={x} y={y + 15} textAnchor="middle" fontSize="12.4" fontWeight={active ? 700 : 500}
                className={active ? "fill-current" : "fill-muted-foreground"}>
                {state}
              </text>
            </g>
          );
        })}
      </svg>

      <div className="flex flex-wrap gap-1.5 border-t border-border p-3" role="group" aria-label="GhostLock 단계 선택">
        <button type="button" onClick={() => selectFrame(null)} aria-pressed={stepIndex === null}
          className="min-h-8 rounded-md border border-border px-2 text-xs font-semibold hover:bg-muted aria-pressed:border-primary aria-pressed:text-primary">
          전체
        </button>
        {spec.steps.map(({ title }, index) => (
          <button type="button" key={title} onClick={() => selectFrame(index)} title={title}
            aria-label={`${index + 1}단계 · ${title}`} aria-pressed={stepIndex === index}
            className="min-h-8 min-w-8 rounded-md border border-border px-2 text-xs font-semibold hover:bg-muted aria-pressed:border-primary aria-pressed:text-primary">
            {index + 1}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function GhostLockViz() {
  const [mode, setMode] = useState<Mode>("vulnerable");

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2" role="group" aria-label="GhostLock 경로 선택">
        {(["vulnerable", "patched"] as const).map(value => (
          <button key={value} type="button" aria-pressed={mode === value} onClick={() => setMode(value)}
            className="rounded-lg border border-border bg-card px-3 py-2 text-xs font-semibold text-muted-foreground hover:text-foreground aria-pressed:border-primary aria-pressed:bg-primary aria-pressed:text-primary-foreground">
            {value === "vulnerable" ? "취약 경로" : "패치 및 후속 수정"}
          </button>
        ))}
      </div>
      <WorkflowFocusedViz key={mode} spec={scenarios[mode]} TopologyCanvas={GhostLockScene} />
    </div>
  );
}
