import { useId, useState } from "react";
import {
  Activity, ArrowDownUp, Boxes, Cable, Database, Film, Globe2, HardDrive,
  Layers3, ListOrdered, MonitorSmartphone, Network, Search, Server, ShieldCheck, Workflow,
} from "lucide-react";
import { infrastructureStages } from "@/data/content/workflows/web-infrastructure-evolution";
import {
  columnCenters, flowKinds, getInfrastructureMap, infrastructureLinkPath,
  infrastructureNodes, linkId, nodeHeight, rowHeight, type NodeId,
} from "./web-infrastructure-map";

const nodeIcons = {
  client: MonitorSmartphone, dns: Globe2, web: Server, waf: ShieldCheck, cdn: Globe2,
  lb: Network, gateway: Cable, app: Server, appB: Server, media: Boxes,
  db: Database, cache: Layers3, replica: Database, mediaDb: Database,
  broker: ListOrdered, worker: Film, storage: HardDrive, control: Activity,
  policy: ShieldCheck, regionBEdge: Network, regionBApp: Boxes, regionBReplica: Database,
  search: Search, stream: Workflow, warehouse: Database,
} satisfies Record<NodeId, typeof Server>;

const nodeShapes: Partial<Record<NodeId, string>> = {
  client: "rounded-full",
  dns: "rounded-full",
  cdn: "rounded-full",
  lb: "rounded-xl border-x-[3px]",
  waf: "rounded-t-2xl rounded-b-lg border-t-[3px]",
  policy: "rounded-t-2xl rounded-b-lg border-t-[3px]",
  db: "rounded-[18%/14%] border-b-[3px]",
  replica: "rounded-[18%/14%] border-b-[3px]",
  mediaDb: "rounded-[18%/14%] border-b-[3px]",
  regionBReplica: "rounded-[18%/14%] border-b-[3px]",
  warehouse: "rounded-[18%/14%] border-b-[3px]",
  cache: "rounded-md border-y-[3px]",
  broker: "rounded-md border-x-[3px]",
};

const fields = [
  ["state", "현재 상태"],
  ["solution", "해결 방법"],
  ["benefit", "기대 효과"],
  ["tradeoff", "트레이드오프"],
  ["signal", "다음 확장 판단 지표"],
] as const;

const stageMaps = infrastructureStages.map((_, index) => getInfrastructureMap(index + 1));
const stageNumber = (index: number) => String(index + 1).padStart(2, "0");
const selectedStyle = "border-sky-600 bg-sky-50 text-sky-950 dark:bg-sky-950/65 dark:text-sky-100";
const idleStyle = "border-border bg-card hover:border-muted-foreground/60";

export default function WebInfrastructureEvolutionViz() {
  const markerPrefix = useId();
  const [stageIndex, setStageIndex] = useState(0);
  const [pathIndex, setPathIndex] = useState(0);
  const [selectedNode, setSelectedNode] = useState<NodeId | null>(null);
  const stage = infrastructureStages[stageIndex];
  const map = stageMaps[stageIndex];
  const previous = stageMaps[stageIndex - 1];
  const path = map.paths[pathIndex];
  const activeLinks = new Set(path.links.map(linkId));
  const activeNodes = new Set(path.links.flatMap(([from, to]) => [from, to]));
  const rows = [...new Set(map.nodes.map(([, , row]) => row))].sort((a, b) => a - b);
  const isGlobal = stageIndex >= 9;
  const positions = new Map(map.nodes.map(([id, col, row]) => [
    id, [col, 46 + rows.indexOf(row) * rowHeight + (isGlobal && row >= 9 ? 24 : 0)] as const,
  ]));
  const height = Math.max(...Array.from(positions.values(), ([, y]) => y)) + 46;
  const nodeLabel = (id: NodeId) => map.nodes.find(([node]) => node === id)?.[3] ?? infrastructureNodes[id][0];
  const previousNodes = new Map(previous?.nodes.map(([id, , , label]) => [id, label ?? infrastructureNodes[id][0]]));
  const nodeChange = (id: NodeId) => previous ? (!previousNodes.has(id) ? "추가" : previousNodes.get(id) !== nodeLabel(id) ? "변경" : "") : "";
  const removed = previous?.nodes.filter(([id]) => !positions.has(id)) ?? [];
  const currentSelection = map.nodes.find(([id]) => id === selectedNode);

  const boundary = (label: string, start: NodeId, end: NodeId, fullWidth = false) => {
    const top = positions.get(start)![1] - 42;
    const bottom = positions.get(end)![1] + 36;
    return (
      <div aria-hidden="true" className={`pointer-events-none absolute rounded-xl border border-dashed border-muted-foreground/35 bg-muted/30 ${fullWidth ? "inset-x-[3%]" : "inset-x-[33%]"}`} style={{ top, height: bottom - top }}>
        <span className="absolute -top-2.5 left-2 rounded bg-card px-1.5 text-[10px] font-semibold tracking-wide text-muted-foreground">
          {label}
        </span>
      </div>
    );
  };

  return (
    <div className="space-y-5" data-testid="infrastructure-workflow">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Infrastructure evolution</p>
        <h2 className="mt-1 text-lg font-bold sm:text-xl">인프라 성장 지도</h2>
        <p className="mt-1 text-sm text-muted-foreground">가상 미디어 서비스의 예시 경로. 실제 도입 순서는 병목에 따라 달라짐.</p>
      </div>

      <nav aria-label="인프라 성장 단계" className="grid grid-cols-2 gap-1.5 sm:grid-cols-4 lg:grid-cols-6">
        {infrastructureStages.map((item, index) => (
          <button
            key={item.title}
            type="button"
            aria-current={stageIndex === index ? "step" : undefined}
            onClick={() => {
              setStageIndex(index);
              setPathIndex(0);
              setSelectedNode(null);
            }}
            className={`flex min-h-11 items-center gap-2 rounded-lg border px-2.5 py-1.5 text-left text-xs font-semibold transition-colors ${stageIndex === index ? selectedStyle : idleStyle}`}
          >
            <span className="shrink-0 font-mono text-[11px] tabular-nums opacity-75">{stageNumber(index)}</span>
            {item.title}
          </button>
        ))}
      </nav>

      <section aria-label="현재 아키텍처" className="rounded-2xl border border-border bg-background p-2.5 sm:p-4">
        <div className="space-y-3 px-1 pb-3 sm:px-2">
          <div aria-live="polite">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded bg-muted px-2 py-0.5 font-mono text-[11px] font-bold text-muted-foreground">STAGE {stageNumber(stageIndex)}</span>
              <h3 className="text-base font-bold sm:text-lg">{stage.title}</h3>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">{stage.change}</p>
          </div>

          <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="요청 및 데이터 경로">
            {map.paths.map((item, index) => (
              <button
                key={item.label}
                type="button"
                aria-pressed={pathIndex === index}
                onClick={() => setPathIndex(index)}
                className={`min-h-9 rounded-full border px-2.5 text-[11px] font-semibold sm:text-xs ${pathIndex === index ? selectedStyle : idleStyle}`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap gap-x-3 gap-y-1.5 border-y border-border px-1 py-2 text-[11px] text-muted-foreground sm:px-2" aria-label="선과 변경 상태 범례">
          {Object.entries(flowKinds).map(([kind, { label, color, dash }]) => (
            <span className="inline-flex items-center gap-1.5" key={kind}>
              <svg width="25" height="9" aria-hidden="true"><line x1="0" x2="25" y1="4.5" y2="4.5" stroke={color} strokeWidth="2" strokeDasharray={dash} /></svg>
              {label}
            </span>
          ))}
          <span className="font-semibold text-emerald-700 dark:text-emerald-300">+ 추가</span>
          <span className="font-semibold text-amber-700 dark:text-amber-300">↻ 변경</span>
          <span>− 제거</span>
        </div>

        <div className="relative" style={{ height }} data-testid="infrastructure-map" aria-label={`${stage.title} 구성요소`}>
          {stageIndex === 0 && boundary("단일 VM", "web", "db")}
          {stageIndex === 1 && boundary("애플리케이션 VM", "web", "app")}
          {stageIndex >= 2 && !isGlobal && boundary("애플리케이션 계층", "appB", "app", true)}
          {isGlobal && boundary("리전 A · 쓰기 소유", "waf", stageIndex === 10 ? "stream" : "worker", true)}
          {isGlobal && boundary("리전 B · 읽기 제공", "regionBEdge", "regionBApp", true)}

          <svg className="pointer-events-none absolute inset-0 size-full overflow-visible" viewBox={`0 0 1000 ${height}`} preserveAspectRatio="none" aria-hidden="true">
            <defs>
              {Object.entries(flowKinds).map(([kind, { color }]) => (
                <marker key={kind} id={`${markerPrefix}-${kind}`} viewBox="0 0 8 8" refX="7" refY="4" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
                  <path d="M 0 0 L 8 4 L 0 8 z" fill={color} />
                </marker>
              ))}
            </defs>
            {[...map.links].sort((a, b) => Number(activeLinks.has(linkId(a))) - Number(activeLinks.has(linkId(b)))).map((link) => {
              const [from, to, , kind = "sync", rail] = link;
              const active = activeLinks.has(linkId(link));
              const { color, dash } = flowKinds[kind];
              const marker = `url(#${markerPrefix}-${kind})`;
              return (
                <path
                  key={linkId(link)}
                  d={infrastructureLinkPath(positions.get(from)!, positions.get(to)!, rail)}
                  fill="none"
                  stroke={color}
                  strokeWidth={active ? 2.2 : 1.5}
                  strokeDasharray={dash}
                  opacity={active ? 1 : 0.37}
                  vectorEffect="non-scaling-stroke"
                  markerEnd={marker}
                  markerStart={kind === "sync" ? marker : undefined}
                  className="motion-safe:transition-opacity"
                />
              );
            })}
          </svg>

          {map.nodes.map(([id]) => {
            const [col, top] = positions.get(id)!;
            const Icon = nodeIcons[id];
            const change = nodeChange(id);
            const active = activeNodes.has(id);
            const selected = selectedNode === id;
            return (
              <button
                key={id}
                type="button"
                data-node={id}
                aria-pressed={selected}
                aria-label={`${nodeLabel(id)}${change ? ` · ${change}` : ""}`}
                onClick={() => setSelectedNode(id)}
                className={`absolute flex w-[25.6%] -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center gap-0.5 border bg-card px-0.5 text-center font-semibold leading-tight motion-safe:transition-colors sm:flex-row sm:gap-2 sm:px-2 ${nodeShapes[id] ?? "rounded-lg"} ${selected ? "border-sky-600 ring-2 ring-sky-500/60" : active ? "border-sky-600" : "border-border hover:border-muted-foreground/60"}`}
                style={{ left: `${columnCenters[col] / 10}%`, top, height: nodeHeight }}
              >
                <Icon aria-hidden="true" className={`size-4 shrink-0 sm:size-5 ${active ? "text-sky-700 dark:text-sky-300" : "text-muted-foreground"}`} />
                <span className="text-[10px] sm:text-xs">{nodeLabel(id)}</span>
                {change && (
                  <span className={`absolute -right-1 -top-2 rounded border bg-card px-1 text-[9px] leading-4 ${change === "추가" ? "border-emerald-500/70 text-emerald-700 dark:text-emerald-300" : "border-amber-500/70 text-amber-700 dark:text-amber-300"}`}>
                    {change === "추가" ? "+" : "↻"} {change}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {removed.length > 0 && (
          <p className="mx-1 mb-3 rounded-lg border border-dashed border-border px-3 py-2 text-xs text-muted-foreground">
            − 직전 단계에서 제거 · {removed.map(([id, , , label]) => label ?? infrastructureNodes[id][0]).join(", ")}
          </p>
        )}

        <div className="grid gap-2.5 lg:grid-cols-[3fr_2fr]">
          <section className="order-2 min-w-0 rounded-xl border border-border bg-card p-3 lg:order-1" aria-label="선택 경로 실행 추적">
            <h4 className="flex items-center gap-2 text-sm font-bold"><ArrowDownUp className="size-4 text-muted-foreground" aria-hidden="true" />{path.label} · 실행 추적</h4>
            <ol className="mt-2 space-y-1.5 text-xs">
              {path.links.map((link, index) => {
                const [from, to, label, kind = "sync"] = link;
                return (
                  <li key={linkId(link)} className="grid grid-cols-[1.25rem_1fr] items-start gap-1.5">
                    <span className="rounded bg-muted text-center font-mono leading-5 text-muted-foreground">{index + 1}</span>
                    <span className="leading-5">
                      <span className="font-semibold">{nodeLabel(from)} {kind === "sync" ? "↔" : "→"} {nodeLabel(to)}</span>
                      <span className="text-muted-foreground"> · {label}</span>
                    </span>
                  </li>
                );
              })}
            </ol>
            <p className="mt-2 border-t border-border pt-2 text-xs leading-relaxed text-muted-foreground">{path.result}</p>
          </section>

          <section className="order-1 min-w-0 rounded-xl border border-border bg-card p-3 lg:order-2" aria-live="polite" aria-label="구성요소 상세">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">구성요소 상세</p>
            {currentSelection ? (
              <>
                <h4 className="mt-1 text-sm font-bold">{nodeLabel(currentSelection[0])}</h4>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{currentSelection[4] ?? infrastructureNodes[currentSelection[0]][1]}</p>
              </>
            ) : (
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">지도에서 도형을 선택하면 역할과 동작을 확인할 수 있음.</p>
            )}
          </section>
        </div>
      </section>

      <section aria-label="단계별 상세 설명" className="rounded-xl border border-border bg-card p-3 sm:p-4">
        <h3 className="mb-3 text-sm font-bold">Stage {stageNumber(stageIndex)} · 병목과 설계 판단</h3>
        <dl className="grid gap-3 sm:grid-cols-2">
          {fields.map(([field, label]) => (
            <div key={field} className="border-l-2 border-border pl-2.5">
              <dt className="text-xs font-bold">{label}</dt>
              <dd className="mt-0.5 text-sm leading-relaxed text-muted-foreground">{stage[field]}</dd>
            </div>
          ))}
        </dl>
      </section>
    </div>
  );
}
