import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, CircleAlert, Clock3, Database, PanelTop, Server, ShieldCheck } from "lucide-react";
import { oauthLoginPhases } from "@/data/content/workflows/oauth-flow";
import type { WorkflowTopologyCanvasProps } from "./WorkflowFocusedViz";
import { oauthStages, type OauthActorId, type OauthOperation } from "./oauth-flow-model";

const actors = {
  browser: { icon: PanelTop, short: "브라우저", color: "text-blue-700 dark:text-blue-300" },
  provider: { icon: ShieldCheck, short: "인가 서버", color: "text-violet-700 dark:text-violet-300" },
  app: { icon: Server, short: "앱 서버", color: "text-emerald-700 dark:text-emerald-300" },
  profile: { icon: Database, short: "UserInfo", color: "text-amber-700 dark:text-amber-300" },
};

function ActorGlyph({ id }: { id: OauthActorId }) {
  const { icon: Icon, color } = actors[id];
  return <Icon className={`size-4 shrink-0 ${color}`} aria-hidden="true" />;
}

function Topology({ spec, stepIndex }: Pick<WorkflowTopologyCanvasProps, "spec" | "stepIndex">) {
  const step = stepIndex === null ? undefined : spec.steps[stepIndex];
  return (
    <div className="rounded-xl border border-border bg-card p-2.5">
      <h4 className="text-xs font-bold text-foreground">참여자와 연결</h4>
      <div role="group" aria-label="OAuth 로그인 참여자" className="relative mt-2 grid grid-cols-[minmax(0,1fr)_minmax(1.75rem,0.55fr)_minmax(0,1fr)] grid-rows-[1fr_1.75rem_1fr]">
        <svg aria-hidden="true" viewBox="0 0 100 100" preserveAspectRatio="none" className="pointer-events-none absolute inset-0 size-full">
          {spec.topologyLinks?.map(({ from, to }) => {
            const source = spec.actors.find((actor) => actor.id === from)!;
            const target = spec.actors.find((actor) => actor.id === to)!;
            const front = from === "browser";
            const active = step?.transitions?.some((link) => (
              (link.from === from && link.to === to) || (link.from === to && link.to === from)
            ));
            return (
              <line
                key={`${from}-${to}`}
                x1={source.x} y1={source.y} x2={target.x} y2={target.y}
                vectorEffect="non-scaling-stroke" strokeWidth={active ? 2.5 : 1.5}
                strokeDasharray={front ? "4 3" : undefined}
                className={active ? "stroke-primary" : "stroke-muted-foreground/55"}
              />
            );
          })}
        </svg>
        {spec.actors.map((actor) => {
          const active = step?.activeActorIds.includes(actor.id);
          return (
            <div
              key={actor.id}
              data-actor={actor.id}
              className={`relative flex min-h-[62px] min-w-0 flex-col items-center justify-center rounded-lg border bg-card px-1 py-1.5 text-center ${active ? "border-primary ring-1 ring-primary/45" : "border-border"}`}
              style={{ gridColumn: actor.x < 50 ? 1 : 3, gridRow: actor.y < 50 ? 1 : 3 }}
            >
              <div className="flex flex-wrap items-center justify-center gap-x-1.5 gap-y-0.5">
                <ActorGlyph id={actor.id as OauthActorId} />
                <span className="text-xs font-bold leading-tight text-foreground">{actor.label}</span>
              </div>
              <span className="mt-1 text-[10px] leading-tight text-muted-foreground">{actor.detail}</span>
            </div>
          );
        })}
      </div>
      <div aria-label="통신 경로 범례" className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-muted-foreground">
        <span className="inline-flex items-center gap-1"><span className="w-3.5 border-t-2 border-dashed border-current" />브라우저 경유</span>
        <span className="inline-flex items-center gap-1"><span className="w-3.5 border-t-2 border-current" />서버 간 직접 통신</span>
      </div>
    </div>
  );
}

function ActorEndpoint({ id }: { id: OauthActorId }) {
  return (
    <span className="flex h-full min-h-10 flex-col items-center justify-center gap-1 rounded-md border border-border bg-card p-1 text-center text-[11px] font-semibold leading-tight text-foreground">
      <ActorGlyph id={id} />
      {actors[id].short}
    </span>
  );
}

function Operation({ operation, order, animate }: { operation: OauthOperation; order: number; animate: boolean }) {
  if ("owner" in operation) {
    const Icon = operation.kind === "wait" ? Clock3 : ShieldCheck;
    return (
      <div className="grid grid-cols-[3.6rem_minmax(0,1fr)] gap-2 rounded-lg border border-border bg-background p-1.5">
        <ActorEndpoint id={operation.owner} />
        <div className="flex min-w-0 flex-col justify-center py-0.5">
          <span className="flex items-center gap-1 text-xs font-bold text-foreground"><Icon className="size-3.5 shrink-0" aria-hidden="true" />{operation.label}</span>
          <span className="break-keep text-[11px] leading-relaxed text-muted-foreground">{operation.detail}</span>
          {operation.failure && (
            <span className="mt-1 flex items-start gap-1 break-keep text-[11px] font-medium leading-snug text-rose-700 dark:text-rose-300">
              <CircleAlert className="size-3 shrink-0" aria-hidden="true" />{operation.failure}
            </span>
          )}
        </div>
      </div>
    );
  }

  const front = operation.from === "browser" || operation.to === "browser";
  const color = front ? "text-blue-700 dark:text-blue-300" : "text-violet-700 dark:text-violet-300";
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,0.65fr)_minmax(0,1fr)] items-center gap-x-1.5 gap-y-0.5 rounded-lg border border-border bg-background p-1.5 text-center sm:grid-cols-[3.6rem_minmax(0,1fr)_3.6rem]">
      <div className="col-start-1 row-start-1 h-full sm:row-span-3"><ActorEndpoint id={operation.from} /></div>
      <div className={`col-span-3 row-start-2 mt-1 font-mono text-xs font-bold leading-tight sm:col-span-1 sm:col-start-2 sm:row-start-1 sm:mt-0 ${color}`}>{operation.label}</div>
      <div className={`relative col-start-2 row-start-1 flex h-3.5 items-center sm:row-start-2 ${color}`} aria-hidden="true">
        <span className={`w-full border-t-2 border-current ${front ? "border-dashed" : ""}`} />
        <ArrowRight className="-ml-2 size-3.5 shrink-0" />
        {animate && (
          <motion.span
            className="absolute size-1.5 rounded-sm bg-current"
            initial={{ left: "0%", opacity: 0 }}
            animate={{ left: ["0%", "calc(100% - 0.75rem)"], opacity: [0, 1, 1, 0] }}
            transition={{ delay: order * 0.8, duration: 0.75, opacity: { delay: order * 0.8, duration: 0.75, times: [0, 0.2, 0.8, 1] } }}
          />
        )}
      </div>
      <div className="col-span-3 row-start-3 break-keep text-[11px] leading-tight text-muted-foreground sm:col-span-1 sm:col-start-2">{operation.payload}</div>
      <div className="col-start-3 row-start-1 h-full sm:row-span-3"><ActorEndpoint id={operation.to} /></div>
    </div>
  );
}

export default function OauthFlowScene({ spec, stepIndex, playing, selectFrame }: WorkflowTopologyCanvasProps) {
  const reduceMotion = useReducedMotion();
  const stage = stepIndex === null ? undefined : oauthStages[stepIndex];
  return (
    <div className="space-y-3 bg-background p-3 sm:p-4">
      <nav aria-label="OAuth 로그인 단계 선택" className="grid grid-cols-3 gap-1.5 sm:grid-cols-5 lg:grid-cols-9">
        {[{ label: "전체" }, ...oauthLoginPhases].map(({ label }, index) => {
          const selected = index === (stepIndex ?? -1) + 1;
          return (
            <button
              key={label}
              type="button"
              aria-current={selected ? "step" : undefined}
              onClick={() => selectFrame(index === 0 ? null : index - 1)}
              className={`min-h-9 min-w-0 rounded-lg border bg-card px-1 py-1 text-[11px] font-semibold leading-tight focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${selected ? "border-primary text-primary ring-1 ring-primary/40" : "border-border text-foreground hover:bg-muted"}`}
            >
              {index > 0 && <span className="mr-1 font-mono">{index}</span>}{label}
            </button>
          );
        })}
      </nav>

      <div className="grid gap-2.5 md:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <Topology spec={spec} stepIndex={stepIndex} />
        <section className="flex min-h-[255px] flex-col rounded-xl border border-border bg-card p-2.5">
          <h4 className="text-xs font-bold text-foreground">{stage ? "현재 단계의 처리 순서" : "인가 코드에서 서비스 세션까지"}</h4>
          {stage ? (
            <ol className="mt-2 grid flex-1 content-center gap-1.5">
              {stage.operations.map((operation, order) => (
                <li key={`${stepIndex}-${order}`}><Operation operation={operation} order={order} animate={playing && !reduceMotion} /></li>
              ))}
            </ol>
          ) : (
            <ol className="mt-2 grid flex-1 content-center gap-1.5">
              {[
                ["인가 코드", "인가 서버 → 브라우저 → 앱 서버"],
                ["ID Token · Access Token", "인가 서버 → 앱 서버"],
                ["서비스 세션 쿠키", "앱 서버 → 브라우저"],
              ].map(([label, path]) => (
                <li key={label} className="rounded-lg border border-border bg-background px-2.5 py-2">
                  <div className="text-[11px] font-bold text-foreground">{label}</div>
                  <div className="text-[10px] text-muted-foreground">{path}</div>
                </li>
              ))}
            </ol>
          )}
        </section>
      </div>
      <details className="rounded-lg border border-border bg-card">
        <summary className="cursor-pointer px-3 py-2 text-xs font-semibold text-foreground">현재 단계 메시지 예시</summary>
        <pre tabIndex={0} className="max-h-52 min-h-24 overflow-auto whitespace-pre-wrap break-words border-t border-border bg-background p-3 text-[11px] leading-relaxed text-foreground">{stage?.example ?? "단계를 선택하면 요청, 응답 또는 서버에 저장하는 값의 예시가 표시됩니다."}</pre>
      </details>
    </div>
  );
}
