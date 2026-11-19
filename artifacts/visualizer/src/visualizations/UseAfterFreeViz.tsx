import { useId } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { ArchiveX, Clock3, FileScan, KeyRound, MemoryStick, OctagonAlert } from "lucide-react";
import WorkflowFocusedViz, { type WorkflowTopologyCanvasProps } from "./WorkflowFocusedViz";
import type { WorkflowVisualizationSpec, WorkflowVisualizationStep } from "./workflow-visualization";

type LinkState = "idle" | "active" | "error" | "released";

type SceneState = {
  owner: string;
  callback: string;
  heap: string;
  links: [LinkState, LinkState];
  heapState: "empty" | "allocated" | "released" | "invalid";
  reportVisible: boolean;
};

const overview: SceneState = {
  owner: "수명 관리",
  callback: "참조를 보관",
  heap: "객체가 놓이는 곳",
  links: ["idle", "idle"],
  heapState: "empty",
  reportVisible: false,
};

const frames: (WorkflowVisualizationStep & { shortTitle: string; scene: SceneState })[] = [
  {
    title: "소유자가 힙에 객체를 할당",
    shortTitle: "할당",
    summary: "소유자는 힙에 세션 객체를 만들고 그 객체의 수명을 관리합니다.",
    activeActorIds: ["owner", "heap"],
    transitions: [{ from: "owner", to: "heap", label: "객체 할당", kind: "state" }],
    spans: [
      { actorId: "owner", label: "할당 요청", start: 0, end: 0.44 },
      { actorId: "heap", label: "객체 생성", start: 0.44, end: 1, status: "success", tone: "success" },
    ],
    scene: { owner: "객체 소유 중", callback: "참조 없음", heap: "세션 객체 · 유효", links: ["active", "idle"], heapState: "allocated", reportVisible: false },
  },
  {
    title: "지연 작업이 참조를 보관",
    shortTitle: "참조 보관",
    summary: "콜백은 나중에 사용할 참조만 보관합니다. 이 참조는 세션 객체의 수명을 연장하지 않습니다.",
    activeActorIds: ["callback", "heap"],
    transitions: [{ from: "callback", to: "heap", label: "같은 객체를 가리킴", kind: "state" }],
    spans: [
      { actorId: "callback", label: "참조 저장", start: 0, end: 0.5 },
      { actorId: "callback", label: "콜백 실행 대기", start: 0.5, end: 1, kind: "wait" },
    ],
    scene: { owner: "객체 소유 중", callback: "유효한 참조", heap: "세션 객체 · 유효", links: ["idle", "active"], heapState: "allocated", reportVisible: false },
  },
  {
    title: "소유자가 객체의 수명을 끝냄",
    shortTitle: "해제",
    summary: "종료 처리에서 객체가 해제됩니다. 아직 대기 중인 콜백에 남은 참조는 이 시점부터 무효입니다.",
    activeActorIds: ["owner", "heap", "callback"],
    transitions: [{ from: "owner", to: "heap", label: "객체 해제", kind: "state" }],
    spans: [
      { actorId: "owner", label: "종료 처리", start: 0, end: 0.4 },
      { actorId: "heap", label: "객체 수명 종료", start: 0.4, end: 0.83, status: "warning", tone: "warning" },
      { actorId: "callback", label: "콜백 대기", start: 0.17, end: 1, kind: "wait" },
    ],
    scene: { owner: "소유권 종료", callback: "댕글링 참조", heap: "해제됨 · 수명 종료", links: ["released", "error"], heapState: "released", reportVisible: false },
  },
  {
    title: "콜백이 수명이 끝난 객체에 접근",
    shortTitle: "잘못된 접근",
    summary: "지연 작업이 이전 참조로 세션을 읽으려는 순간 UAF가 발생합니다. 실제 실행 결과는 환경에 따라 달라집니다.",
    activeActorIds: ["callback", "heap"],
    transitions: [{ from: "callback", to: "heap", label: "해제 후 읽기 시도", kind: "request" }],
    spans: [
      { actorId: "callback", label: "콜백 실행", start: 0, end: 0.45 },
      { actorId: "callback", label: "잘못된 읽기", start: 0.45, end: 1, status: "error", tone: "danger" },
    ],
    scene: { owner: "소유권 종료", callback: "무효 참조 사용", heap: "수명이 끝난 영역", links: ["idle", "error"], heapState: "invalid", reportVisible: false },
  },
  {
    title: "검사 빌드에서 AddressSanitizer가 보고",
    shortTitle: "진단",
    summary: "오류 보고서의 접근·해제·할당 스택을 연결하면, 수명이 어느 경로에서 먼저 끝났는지 확인할 수 있습니다.",
    activeActorIds: ["callback", "heap", "diagnostic"],
    transitions: [{ from: "heap", to: "diagnostic", label: "잘못된 접근 감지", kind: "event" }],
    spans: [
      { actorId: "callback", label: "잘못된 읽기", start: 0, end: 0.4, status: "error", tone: "danger" },
      { actorId: "diagnostic", label: "오류 보고 생성", start: 0.4, end: 1, status: "success", tone: "success" },
    ],
    scene: { owner: "소유권 종료", callback: "무효 참조 사용", heap: "수명이 끝난 영역", links: ["idle", "error"], heapState: "invalid", reportVisible: true },
  },
];

const spec: WorkflowVisualizationSpec = {
  title: "객체의 수명과 참조의 상태",
  actors: [
    { id: "owner", label: "소유자", x: 25, y: 20, accent: "blue" },
    { id: "callback", label: "지연 작업", x: 75, y: 20, accent: "violet" },
    { id: "heap", label: "힙 슬롯", x: 50, y: 55, accent: "amber" },
    { id: "diagnostic", label: "검사 도구", x: 50, y: 88, accent: "rose" },
  ],
  topologyLinks: [
    { from: "owner", to: "heap" },
    { from: "callback", to: "heap" },
    { from: "heap", to: "diagnostic" },
  ],
  steps: frames,
  overviewSummary: "소유자와 지연 작업이 같은 힙 슬롯을 참조합니다. 객체를 해제한 뒤에 남은 참조가 어떻게 바뀌는지 살펴보세요.",
  waterfallLabel: "현재 단계의 실행 순서",
  subjectRisk: "sensitive",
  motionTone: "restrained",
  overviewMs: 3600,
  autoplayMs: 4600,
};

const linkTone = {
  idle: "text-muted-foreground/45",
  active: "text-sky-700 dark:text-sky-300",
  released: "text-amber-700 dark:text-amber-300",
  error: "text-rose-700 dark:text-rose-300",
};

const memoryTone = {
  empty: "border-dashed border-border text-muted-foreground",
  allocated: "border-sky-500/60 text-sky-800 dark:text-sky-200",
  released: "border-dashed border-amber-500/75 text-amber-800 dark:text-amber-200",
  invalid: "border-dashed border-rose-500/75 text-rose-800 dark:text-rose-200",
};

function MemoryScene({ stepIndex, playing, selectFrame }: WorkflowTopologyCanvasProps) {
  const scene = stepIndex === null ? overview : frames[stepIndex].scene;
  const activeActors = stepIndex === null ? [] : frames[stepIndex].activeActorIds;
  const attempt = stepIndex === 3;
  const released = scene.heapState === "released";
  const reducedMotion = useReducedMotion() ?? false;
  const markerId = `uaf-arrow-${useId().replace(/:/g, "")}`;
  const MemoryIcon = scene.heapState === "invalid" ? OctagonAlert : released ? ArchiveX : MemoryStick;

  return (
    <div className="bg-background">
      <div className="mx-auto max-w-2xl px-2.5 py-4 sm:px-6 sm:py-5" role="group" aria-label="힙 메모리와 참조 상태">
        <div className="grid grid-cols-2 gap-2 sm:gap-4">
          <div data-actor="owner" className={`min-w-0 rounded-lg border bg-card p-2.5 sm:p-3 ${activeActors.includes("owner") ? "border-sky-500/70" : "border-border"}`}>
            <KeyRound size={23} className="mb-2 text-sky-700 dark:text-sky-300" aria-hidden="true" />
            <h4 className="text-sm font-semibold">소유자</h4>
            <p className="mt-1 text-xs text-muted-foreground">{scene.owner}</p>
          </div>
          <div data-actor="callback" className={`min-w-0 rounded-lg border bg-card p-2.5 sm:p-3 ${activeActors.includes("callback") ? "border-violet-500/70" : "border-border"}`}>
            <Clock3 size={23} className="mb-2 text-violet-700 dark:text-violet-300" aria-hidden="true" />
            <h4 className="text-sm font-semibold">지연 작업</h4>
            <p className={`mt-1 text-xs ${scene.links[1] === "error" ? linkTone.error : "text-muted-foreground"}`}>{scene.callback}</p>
          </div>
        </div>

        <svg className="block h-12 w-full" viewBox="0 0 400 48" preserveAspectRatio="none" aria-hidden="true">
          <defs>
            <marker id={markerId} viewBox="0 0 8 8" refX="6" refY="4" markerWidth="6" markerHeight="6" orient="auto">
              <path d="M 0 0 L 7 4 L 0 8" fill="none" stroke="context-stroke" />
            </marker>
          </defs>
          {scene.links.map((state, i) => {
            const path = i === 0 ? "M 100 1 V 16 Q 100 25 113 25 H 158 Q 172 25 172 36 V 46" : "M 300 1 V 16 Q 300 25 287 25 H 242 Q 228 25 228 36 V 46";
            const isActive = state === "active" || state === "released" || (attempt && i === 1);
            return (
              <g key={i} className={linkTone[state]}>
                <path d={path} vectorEffect="non-scaling-stroke" stroke="currentColor" fill="none" strokeWidth={isActive ? 2.5 : 1.5}
                  strokeDasharray={state === "idle" || state === "error" ? "4 4" : undefined} markerEnd={`url(#${markerId})`} />
                {playing && isActive && !reducedMotion && (
                  <motion.path key={stepIndex} d={path} vectorEffect="non-scaling-stroke" stroke="currentColor" fill="none"
                    strokeWidth={4} initial={{ pathLength: 0, opacity: 0.8 }} animate={{ pathLength: 1, opacity: 0 }}
                    transition={{ duration: 0.75, ease: "easeOut" }} />
                )}
              </g>
            );
          })}
        </svg>

        <div data-actor="heap" data-state={scene.heapState} className="mx-auto max-w-sm rounded-xl border border-border bg-card p-2.5 sm:p-3">
          <h4 className="mb-2 text-center text-sm font-semibold">힙 슬롯</h4>
          <div className="grid grid-cols-[1fr_4fr_1fr] gap-1.5">
            <div aria-hidden="true" className="rounded border border-border bg-muted" />
            <div className={`flex min-h-14 items-center justify-center gap-2 rounded border px-1.5 py-2 text-xs font-semibold sm:text-sm ${memoryTone[scene.heapState]}`}>
              <MemoryIcon size={20} className="shrink-0" aria-hidden="true" />
              {scene.heap}
            </div>
            <div aria-hidden="true" className="rounded border border-border bg-muted" />
          </div>
        </div>

        <div aria-hidden="true" className={`relative mx-auto h-5 w-px border-l border-dashed ${scene.reportVisible ? "border-rose-500 after:absolute after:bottom-0 after:-left-[3px] after:size-1.5 after:rotate-45 after:border-r after:border-b after:border-rose-500" : "border-border"}`} />
        <div data-actor="diagnostic" className={`flex min-h-20 items-center gap-2.5 rounded-lg border bg-card px-2.5 py-2 sm:min-h-[4.5rem] sm:px-3 ${scene.reportVisible ? "border-rose-500/70" : "border-border"}`}>
          <FileScan size={24} className={`shrink-0 ${scene.reportVisible ? linkTone.error : "text-muted-foreground"}`} aria-hidden="true" />
          <div className="min-w-0 text-xs leading-relaxed">
            <h4 className="text-sm font-semibold">AddressSanitizer</h4>
            <p className="text-muted-foreground">
              {scene.reportVisible ? <><code className={`break-words ${linkTone.error}`}>heap-use-after-free</code> · 접근 / 해제 / 할당</> : "검사 빌드의 진단 보고서"}
            </p>
          </div>
        </div>
      </div>

      <div role="group" aria-label="메모리 수명 단계 선택" className="flex flex-wrap gap-1.5 border-t border-border px-2.5 py-3 sm:px-4">
        {[null, ...frames.map((_, index) => index)].map((index) => (
          <button type="button" key={index ?? "overview"} aria-pressed={stepIndex === index} onClick={() => selectFrame(index)}
            className="rounded-md border border-border px-2 py-1.5 text-xs font-semibold text-muted-foreground hover:bg-muted aria-pressed:border-primary aria-pressed:bg-primary aria-pressed:text-primary-foreground">
            {index === null ? "전체" : frames[index].shortTitle}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function UseAfterFreeViz() {
  return <WorkflowFocusedViz spec={spec} TopologyCanvas={MemoryScene} />;
}
