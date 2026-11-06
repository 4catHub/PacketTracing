import { useId, useState } from "react";
import { useReducedMotion } from "framer-motion";
import {
  ArrowRight,
  CircleCheck,
  Database,
  Globe,
  Monitor,
  Server,
  Shield,
} from "lucide-react";
import WorkflowFocusedViz, {
  type WorkflowTopologyCanvasProps,
} from "./WorkflowFocusedViz";
import {
  chatPhases,
  chatWorkflow,
  type ChatMode,
} from "./websocket-chat-model";
import type { WorkflowActor } from "./workflow-visualization";

const SPECS = {
  normal: chatWorkflow("normal"),
  defense: chatWorkflow("defense"),
};

const MODES: { id: ChatMode; label: string }[] = [
  { id: "normal", label: "정상 흐름" },
  { id: "defense", label: "위협과 방어" },
];

const ICONS = {
  foreign: Globe,
  sender: Monitor,
  server: Server,
  receiver: Monitor,
  db: Database,
};
const PANEL = "min-w-0 rounded-xl border border-border bg-card p-2.5 sm:p-3";
const BUTTON =
  "min-h-9 rounded-lg border px-2 py-1 text-xs font-semibold leading-tight focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary";

function activePath(from: WorkflowActor, to: WorkflowActor, paired: boolean) {
  const x = Math.sign(to.x - from.x);
  const y = Math.sign(to.y - from.y);
  const lane = paired ? 3 : 0;
  return {
    x1: from.x + 12 * x - lane * y,
    y1: from.y + 10 * y + lane * x,
    x2: to.x - 12 * x - lane * y,
    y2: to.y - 10 * y + lane * x,
  };
}

function ChatTopology({
  spec,
  stepIndex,
  playing,
}: WorkflowTopologyCanvasProps) {
  const markerId = useId();
  const reduceMotion = useReducedMotion();
  const step = stepIndex === null ? undefined : spec.steps[stepIndex];
  const transitions = step?.transitions ?? [];
  const actorById = new Map(spec.actors.map((actor) => [actor.id, actor]));
  return (
    <div
      className="relative h-60 sm:h-64"
      role="group"
      aria-label="채팅 참여자와 연결"
    >
      <svg
        aria-hidden="true"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        className="pointer-events-none absolute inset-0 size-full overflow-visible"
      >
        <defs>
          <marker
            id={markerId}
            viewBox="0 0 10 10"
            refX={9}
            refY={5}
            markerWidth={4}
            markerHeight={4}
            orient="auto"
          >
            <path d="M 0 0 L 10 5 L 0 10 z" fill="context-stroke" />
          </marker>
        </defs>
        {spec.topologyLinks?.map(({ from, to }) => (
          <line
            key={from}
            x1={actorById.get(from)!.x}
            y1={actorById.get(from)!.y}
            x2={actorById.get(to)!.x}
            y2={actorById.get(to)!.y}
            className="stroke-muted-foreground/55"
            strokeDasharray={from === "foreign" ? "3 3" : undefined}
            strokeWidth={1.25}
            vectorEffect="non-scaling-stroke"
          />
        ))}
        {transitions.map((transition, index) => {
          const paired = transitions.some(
            (other) =>
              other.from === transition.to && other.to === transition.from,
          );
          const path = activePath(
            actorById.get(transition.from)!,
            actorById.get(transition.to)!,
            paired,
          );
          const style =
            transition.kind === "response"
              ? "stroke-emerald-600 dark:stroke-emerald-400"
              : "stroke-primary";
          return (
            <g
              key={`${stepIndex}-${index}-${transition.from}-${transition.to}`}
              data-path={`${transition.from}:${transition.to}`}
            >
              <line
                {...path}
                vectorEffect="non-scaling-stroke"
                strokeWidth={2}
                className={style}
                markerEnd={`url(#${markerId})`}
              />
              {playing && !reduceMotion && (
                <circle r={0.85} className="fill-primary" opacity={0}>
                  <animateMotion
                    begin={`${0.2 + index * 0.45}s`}
                    dur="0.8s"
                    path={`M ${path.x1} ${path.y1} L ${path.x2} ${path.y2}`}
                  />
                  <animate
                    attributeName="opacity"
                    begin={`${0.2 + index * 0.45}s`}
                    dur="0.8s"
                    values="0;1;1;0"
                  />
                </circle>
              )}
            </g>
          );
        })}
      </svg>
      {spec.actors.map((actor) => {
        const Icon = ICONS[actor.id as keyof typeof ICONS];
        const active = step?.activeActorIds.includes(actor.id);
        return (
          <div
            key={actor.id}
            data-actor={actor.id}
            data-active={active ? "true" : undefined}
            className={`absolute z-10 flex h-[20%] -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center gap-0.5 rounded-lg border bg-background px-0.5 text-center sm:w-[24%] sm:flex-row sm:gap-2 ${actor.id === "foreign" ? "w-[38%]" : "w-[24%]"} ${active ? "border-primary ring-1 ring-primary/50" : "border-border"}`}
            style={{ left: `${actor.x}%`, top: `${actor.y}%` }}
          >
            <Icon
              aria-hidden="true"
              className={`size-3 shrink-0 sm:size-4 ${active ? "text-primary" : "text-muted-foreground"}`}
            />
            <div className="min-w-0 leading-none">
              <div className="text-[10px] font-bold text-foreground sm:text-xs">
                {actor.label}
              </div>
              <div className="mt-0.5 text-[9px] text-muted-foreground sm:text-[10px]">
                {actor.detail}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function ChatScene(props: WorkflowTopologyCanvasProps) {
  const { spec, stepIndex, selectFrame } = props;
  const mode = spec === SPECS.defense ? "defense" : "normal";
  const scenario = stepIndex === null ? undefined : chatPhases[stepIndex][mode];
  const actorById = new Map(
    spec.actors.map((actor) => [actor.id, actor.label]),
  );
  return (
    <div
      className="space-y-2.5 bg-background p-2.5 sm:p-3"
      data-testid="websocket-chat-scene"
    >
      <nav
        aria-label="채팅 단계 선택"
        className="grid grid-cols-3 gap-1.5 sm:grid-cols-5 lg:grid-cols-9"
      >
        {["전체", ...chatPhases.map(({ label }) => label)].map(
          (label, index) => {
            const selected = index === (stepIndex ?? -1) + 1;
            return (
              <button
                key={label}
                type="button"
                aria-current={selected ? "step" : undefined}
                onClick={() => selectFrame(index === 0 ? null : index - 1)}
                className={`${BUTTON} whitespace-nowrap bg-card max-sm:px-1 max-sm:text-[11px] ${selected ? "border-primary text-primary ring-1 ring-primary/35" : "border-border text-foreground hover:bg-muted"}`}
              >
                {index > 0 && <span className="mr-1 font-mono">{index}</span>}
                {label}
              </button>
            );
          },
        )}
      </nav>

      <div className="grid gap-2.5 md:grid-cols-[minmax(0,1.08fr)_minmax(0,0.92fr)]">
        <section className={PANEL} aria-label="참여자 토폴로지">
          <h4 className="text-xs font-bold">참여자와 연결</h4>
          <ChatTopology {...props} />
          <p className="text-[11px] leading-relaxed text-muted-foreground">
            외부 페이지의 점선은 다른 출처에서 연결을 시도하는 경로입니다.
          </p>
        </section>

        <section className={PANEL} aria-label="단계별 메시지와 처리">
          <h4 className="text-xs font-bold">
            {scenario ? "이 단계에서 일어나는 일" : "채팅방 메시지의 왕복"}
          </h4>
          {scenario ? (
            <ol className="mt-2 grid min-h-52 content-start gap-1.5">
              {scenario.actions.map((action, index) => {
                const internal = "owner" in action;
                const Icon =
                  internal && action.status === "warning"
                    ? Shield
                    : internal && action.status === "success"
                      ? CircleCheck
                      : null;
                return (
                  <li
                    key={index}
                    className="flex min-h-10 items-start gap-2 rounded-lg border border-border bg-background px-2 py-1.5"
                  >
                    <span className="mt-0.5 rounded bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
                      {index + 1}
                    </span>
                    <div className="min-w-0">
                      <span className="flex flex-wrap items-center gap-x-1 text-[10px] font-medium text-muted-foreground">
                        {actorById.get(internal ? action.owner : action.from)}
                        {!internal && (
                          <>
                            <ArrowRight aria-label="에서" className="size-3" />
                            {actorById.get(action.to)}
                          </>
                        )}
                        {Icon && (
                          <Icon
                            aria-hidden="true"
                            className="size-3 text-primary"
                          />
                        )}
                      </span>
                      <span className="block break-words text-xs font-semibold leading-relaxed">
                        {action.label}
                      </span>
                    </div>
                  </li>
                );
              })}
            </ol>
          ) : (
            <ul className="mt-2 grid min-h-52 content-start gap-2 text-xs leading-relaxed text-muted-foreground">
              <li className="rounded-lg border border-border bg-background p-2">
                <strong className="text-foreground">송신자 → 서버</strong> ·
                연결을 열고 방 입장과 전송을 요청합니다.
              </li>
              <li className="rounded-lg border border-border bg-background p-2">
                <strong className="text-foreground">서버 ↔ DB</strong> · 방
                권한을 확인하고 메시지를 기록합니다.
              </li>
              <li className="rounded-lg border border-border bg-background p-2">
                <strong className="text-foreground">서버 → 수신자</strong> ·
                권한이 있는 연결로 메시지를 전달합니다.
              </li>
            </ul>
          )}
        </section>
      </div>

      <details className="rounded-lg border border-border bg-card">
        <summary className="cursor-pointer px-3 py-2 text-xs font-semibold">
          {mode === "defense"
            ? "현재 단계의 방어 로직 예시"
            : "현재 단계의 메시지 예시"}
        </summary>
        <pre
          tabIndex={0}
          className="h-28 overflow-auto whitespace-pre-wrap break-words border-t border-border bg-background p-3 text-xs leading-relaxed"
        >
          <code>
            {scenario?.example ??
              "단계를 선택하면 해당 요청, 응답 또는 검사 로직을 확인할 수 있습니다."}
          </code>
        </pre>
      </details>
    </div>
  );
}

export default function WebsocketChatSecurityViz() {
  const [mode, setMode] = useState<ChatMode>("normal");
  return (
    <div className="space-y-2.5">
      <div
        role="group"
        aria-label="채팅 시나리오"
        className="flex flex-wrap gap-2"
      >
        {MODES.map(({ id, label }) => (
          <button
            key={id}
            type="button"
            aria-pressed={id === mode}
            onClick={() => setMode(id)}
            className={`${BUTTON} ${id === mode ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card text-foreground hover:bg-muted"}`}
          >
            {label}
          </button>
        ))}
      </div>
      <WorkflowFocusedViz spec={SPECS[mode]} TopologyCanvas={ChatScene} />
    </div>
  );
}
