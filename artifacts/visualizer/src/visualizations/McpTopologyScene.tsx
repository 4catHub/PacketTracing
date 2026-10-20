import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { useReducedMotion } from "framer-motion";
import type { WorkflowTopologyCanvasProps } from "./WorkflowFocusedViz";
import type { WorkflowTransitionKind } from "./workflow-visualization";

type Point = readonly [number, number];
type Box = { x: number; y: number; w: number; h: number };
type Connection = { from: string; to: string; points: readonly Point[]; label: Point; caption: string };

// Every connection terminates at a component boundary, including components inside Host.
const desktop = {
  width: 1000, height: 650,
  host: { x: 180, y: 170, w: 400, h: 320 },
  control: { x: 210, y: 250, w: 170, h: 88 },
  client: { x: 390, y: 365, w: 165, h: 100 },
  model: { x: 210, y: 35, w: 170, h: 108 },
  server: { x: 720, y: 255, w: 230, h: 220 },
  api: { x: 725, y: 555, w: 220, h: 80 },
  user: [80, 290] as Point,
  connections: [
    { from: "user", to: "host", points: [[114, 290], [210, 290]], label: [150, 360], caption: "사용자 대화" },
    { from: "host", to: "model", points: [[380, 294], [450, 294], [450, 90], [380, 90]], label: [450, 233], caption: "모델 API" },
    { from: "host", to: "client", points: [[295, 338], [295, 415], [390, 415]], label: [290, 390], caption: "앱 내부 호출" },
    { from: "client", to: "server", points: [[555, 415], [720, 415]], label: [637, 390], caption: "MCP · JSON-RPC" },
    { from: "server", to: "api", points: [[835, 475], [835, 555]], label: [725, 520], caption: "외부 HTTP API" },
  ] satisfies Connection[],
};

const narrow = {
  width: 460, height: 900,
  host: { x: 30, y: 190, w: 400, h: 325 },
  control: { x: 60, y: 270, w: 160, h: 88 },
  client: { x: 245, y: 390, w: 160, h: 100 },
  model: { x: 250, y: 35, w: 180, h: 108 },
  server: { x: 245, y: 610, w: 185, h: 220 },
  api: { x: 30, y: 785, w: 180, h: 80 },
  user: [90, 90] as Point,
  connections: [
    { from: "user", to: "host", points: [[62, 90], [15, 90], [15, 314], [60, 314]], label: [100, 174], caption: "사용자 대화" },
    { from: "host", to: "model", points: [[220, 314], [445, 314], [445, 90], [430, 90]], label: [330, 174], caption: "모델 API" },
    { from: "host", to: "client", points: [[140, 358], [140, 440], [245, 440]], label: [135, 410], caption: "앱 내부 호출" },
    { from: "client", to: "server", points: [[325, 490], [325, 610]], label: [225, 562], caption: "MCP · JSON-RPC" },
    { from: "server", to: "api", points: [[245, 730], [120, 730], [120, 785]], label: [120, 702], caption: "외부 HTTP API" },
  ] satisfies Connection[],
};

const colors: Record<WorkflowTransitionKind, string> = {
  request: "#3b82f6", response: "#10b981", event: "#8b5cf6", state: "#d97706",
};

function Label({ x, y, children, muted = false, small = false }: {
  x: number; y: number; children: ReactNode; muted?: boolean; small?: boolean;
}) {
  return <text x={x} y={y} className={muted ? "fill-muted-foreground" : "fill-foreground"} fontSize={small ? 12 : 16} fontWeight={small ? 500 : 700}>{children}</text>;
}

function Outline({ box, active, children, actorId }: {
  box: Box; active: boolean; children: ReactNode; actorId: string;
}) {
  return (
    <g data-actor-id={actorId}>
      {active && <rect x={box.x - 5} y={box.y - 5} width={box.w + 10} height={box.h + 10} rx={15} fill="none" className="stroke-primary" strokeWidth={1} strokeDasharray="4 4" />}
      <rect x={box.x} y={box.y} width={box.w} height={box.h} rx={10} className="fill-card" style={{ stroke: active ? "hsl(var(--primary))" : "hsl(var(--border))" }} strokeWidth={active ? 2.5 : 1.5} />
      {children}
    </g>
  );
}

function Module({ box, label, active }: { box: Box; label: string; active: boolean }) {
  return (
    <g>
      <rect x={box.x} y={box.y} width={box.w} height={box.h} rx={5} className="fill-background" style={{ stroke: active ? "hsl(var(--primary))" : "hsl(var(--border))" }} strokeWidth={active ? 2 : 1} />
      {active && <rect x={box.x} y={box.y + 5} width={3} height={box.h - 10} rx={1.5} className="fill-primary" />}
      <Label x={box.x + 10} y={box.y + box.h / 2 + 4} small>{label}</Label>
    </g>
  );
}

export default function McpTopologyScene({ spec, stepIndex, playing }: WorkflowTopologyCanvasProps) {
  const [compact, setCompact] = useState(() => window.matchMedia("(max-width: 640px)").matches);
  const reducedMotion = useReducedMotion() ?? false;
  const svgRef = useRef<SVGSVGElement>(null);
  const markerId = `mcp-arrow-${useId().replace(/:/g, "")}`;
  const layout = compact ? narrow : desktop;
  const step = stepIndex === null ? null : spec.steps[stepIndex];
  const frame = stepIndex === null ? 0 : stepIndex + 1;
  const active = (id: string) => step?.activeActorIds.includes(id) ?? false;
  const { host, control, client, model, server, api, user } = layout;

  useEffect(() => {
    const media = window.matchMedia("(max-width: 640px)");
    const update = () => setCompact(media.matches);
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    if (playing) svgRef.current?.unpauseAnimations();
    else svgRef.current?.pauseAnimations();
  }, [playing, stepIndex, compact, reducedMotion]);

  return (
    <div className="bg-background p-1 sm:p-2">
      <svg ref={svgRef} viewBox={`0 0 ${layout.width} ${layout.height}`} className="block w-full" role="img" aria-label={`MCP 구성도: Host 내부 대화 제어와 Client, LLM 칩, 도구를 포함한 Server, 외부 날씨 API. ${step?.title ?? "전체 구조"}`}>
        <defs>
          <marker id={markerId} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="9" markerHeight="9" markerUnits="userSpaceOnUse" orient="auto-start-reverse">
            <path d="M 0 0 L 10 5 L 0 10 z" fill="context-stroke" />
          </marker>
        </defs>

        {/* Host is the application boundary; both orchestration and Client live inside. */}
        <g data-container="host">
          <rect x={host.x} y={host.y} width={host.w} height={host.h} rx={14} className="fill-muted" style={{ stroke: active("host") || active("client") ? "hsl(var(--primary))" : "hsl(var(--border))" }} strokeWidth={1.5} />
          <path d={`M ${host.x} ${host.y + 48} H ${host.x + host.w}`} className="stroke-border" />
          {[0, 1, 2].map(index => <rect key={index} x={host.x + 16 + index * 11} y={host.y + 18} width={5} height={5} rx={1} className="fill-muted-foreground" />)}
          <Label x={host.x + 60} y={host.y + 29}>AI Host</Label>
          <Label x={host.x + host.w - 105} y={host.y + 29} small muted>애플리케이션</Label>
        </g>

        {/* Structural paths stay visible on every frame. */}
        {layout.connections.map(connection => (
          <g key={`${connection.from}-${connection.to}`}>
            <path d={connection.points.map(([x, y], index) => `${index ? "L" : "M"} ${x} ${y}`).join(" ")} fill="none" className="stroke-muted-foreground" strokeOpacity={0.4} strokeWidth={1.5} strokeDasharray="5 5" />
            <text x={connection.label[0]} y={connection.label[1]} textAnchor="middle" className="fill-muted-foreground" fontSize={11}>{connection.caption}</text>
          </g>
        ))}

        {/* A person, rather than a generic circular infrastructure node. */}
        <g data-actor-id="user" transform={`translate(${user[0]} ${user[1]})`}>
          {active("user") && <rect x={-43} y={-47} width={86} height={110} rx={18} fill="none" className="stroke-primary" strokeDasharray="4 4" />}
          <circle cy={-23} r={15} className="fill-card" style={{ stroke: active("user") ? "hsl(var(--primary))" : "hsl(var(--muted-foreground))" }} strokeWidth={2} />
          <path d="M -28 24 V 12 C -28 -12 28 -12 28 12 V 24 Z" className="fill-card" style={{ stroke: active("user") ? "hsl(var(--primary))" : "hsl(var(--muted-foreground))" }} strokeWidth={2} />
          <text y={48} textAnchor="middle" className="fill-foreground" fontSize={15} fontWeight={700}>사용자</text>
        </g>

        <Outline box={control} active={active("host")} actorId="host">
          <Label x={control.x + 12} y={control.y + 23}>대화 · 실행 제어</Label>
          <Module box={{ x: control.x + 10, y: control.y + 37, w: control.w - 20, h: 19 }} label="대화 맥락" active={active("host") && frame !== 9} />
          <Module box={{ x: control.x + 10, y: control.y + 61, w: control.w - 20, h: 19 }} label="실행 정책 확인" active={frame === 9} />
        </Outline>

        <Outline box={client} active={active("client")} actorId="client">
          <Label x={client.x + 12} y={client.y + 23}>MCP Client</Label>
          <Module box={{ x: client.x + 10, y: client.y + 36, w: client.w - 20, h: 23 }} label="연결 · 버전 관리" active={frame >= 1 && frame <= 4} />
          <Module box={{ x: client.x + 10, y: client.y + 66, w: client.w - 20, h: 23 }} label="JSON-RPC 송수신" active={active("client") && frame >= 5} />
        </Outline>

        {/* Model: chip package, pins, and a small inference graph. */}
        <g data-actor-id="model">
          {[0, 1, 2, 3].map(index => (
            <g key={index} className="stroke-muted-foreground" strokeWidth={2}>
              <path d={`M ${model.x + 24 + index * 35} ${model.y - 8} v 8 M ${model.x + 24 + index * 35} ${model.y + model.h} v 8`} />
            </g>
          ))}
          <rect x={model.x} y={model.y} width={model.w} height={model.h} rx={4} className="fill-card" style={{ stroke: active("model") ? "hsl(var(--primary))" : "hsl(var(--border))" }} strokeWidth={active("model") ? 2.5 : 1.5} />
          <rect x={model.x + 6} y={model.y + 6} width={model.w - 12} height={model.h - 12} rx={2} fill="none" className="stroke-border" />
          <Label x={model.x + 16} y={model.y + 30}>LLM</Label>
          <Label x={model.x + 16} y={model.y + 51} small muted>도구 선택 · 답변 생성</Label>
          <g transform={`translate(${model.x + 23} ${model.y + 76})`} style={{ stroke: active("model") ? "hsl(var(--primary))" : "hsl(var(--muted-foreground))" }} strokeWidth={1.5}>
            <path d="M 0 0 L 38 -9 L 78 0 L 118 -9 M 0 0 L 38 9 L 78 0 L 118 9 M 38 -9 L 78 0 L 38 9" fill="none" />
            {[[0, 0], [38, -9], [38, 9], [78, 0], [118, -9], [118, 9]].map(([x, y]) => <rect key={`${x}-${y}`} x={x - 3} y={y - 3} width={6} height={6} rx={1} className="fill-card" />)}
          </g>
        </g>

        {/* Server chassis contains the dispatcher and the actual weather tool. */}
        <g data-container="server">
          <path d={`M ${server.x + 9} ${server.y - 8} H ${server.x + server.w + 8} V ${server.y + server.h - 8} L ${server.x + server.w} ${server.y + server.h}`} className="fill-muted stroke-border" strokeWidth={1.5} />
          <Outline box={server} active={active("server")} actorId="server">
            <Label x={server.x + 14} y={server.y + 28}>MCP Server</Label>
            <path d={`M ${server.x} ${server.y + 43} H ${server.x + server.w}`} className="stroke-border" />
            <Module box={{ x: server.x + 14, y: server.y + 58, w: server.w - 28, h: 30 }} label="입力 검증 · 라우팅" active={frame === 10} />
            <rect x={server.x + 14} y={server.y + 107} width={server.w - 28} height={72} rx={7} className="fill-background" style={{ stroke: frame >= 11 && frame <= 13 || frame === 6 ? "hsl(var(--primary))" : "hsl(var(--border))" }} strokeWidth={frame >= 11 && frame <= 13 || frame === 6 ? 2 : 1} />
            <path d={`M ${server.x + 26} ${server.y + 124} h 12 l 5 6 h 12`} fill="none" className="stroke-muted-foreground" strokeWidth={1.5} />
            <Label x={server.x + 26} y={server.y + 150} small>get_weather</Label>
            <Label x={server.x + 26} y={server.y + 168} small muted>city → 날씨 결과</Label>
            <Label x={server.x + 14} y={server.y + 202} small muted>도구 등록 · 실행</Label>
            {[0, 1, 2].map(index => <rect key={index} x={server.x + server.w - 40 + index * 9} y={server.y + 195} width={4} height={8} rx={1} className={active("server") ? "fill-primary" : "fill-muted-foreground"} />)}
          </Outline>
        </g>

        {/* An external HTTP service, distinct from a database/storage cylinder. */}
        <g data-actor-id="api">
          <path d={`M ${api.x + 15} ${api.y} V ${api.y - 11} H ${api.x + 80} L ${api.x + 91} ${api.y} Z`} className="fill-muted stroke-border" strokeWidth={1.5} />
          <rect x={api.x} y={api.y} width={api.w} height={api.h} rx={5} className="fill-card" style={{ stroke: active("api") ? "hsl(var(--primary))" : "hsl(var(--border))" }} strokeWidth={active("api") ? 2.5 : 1.5} />
          <Label x={api.x + 14} y={api.y + 27}>외부 날씨 API</Label>
          <Label x={api.x + 14} y={api.y + 48} small muted>HTTP 서비스</Label>
          <path d={`M ${api.x + 14} ${api.y + 62} h ${api.w - 28}`} className="stroke-border" />
        </g>

        {/* Fixed orthogonal routes; only the message direction and active path change. */}
        {(step?.transitions ?? []).map((transition, index) => {
          const connection = layout.connections.find(candidate => candidate.from === transition.from && candidate.to === transition.to || candidate.from === transition.to && candidate.to === transition.from);
          if (!connection) return null;
          const points = connection.from === transition.from ? connection.points : [...connection.points].reverse();
          const d = points.map(([x, y], pointIndex) => `${pointIndex ? "L" : "M"} ${x} ${y}`).join(" ");
          const kind = transition.kind ?? "request";
          const end = points[points.length - 1];
          return (
            <g key={`${frame}-${index}`} data-transition={`${transition.from}-${transition.to}`}>
              <path d={d} fill="none" stroke={colors[kind]} strokeWidth={3} strokeLinejoin="round" markerEnd={`url(#${markerId})`} strokeDasharray={kind === "event" ? "7 4" : undefined} />
              <g transform={`translate(${connection.label[0]} ${connection.label[1] - 5})`}>
                <rect x={-85} y={-13} width={170} height={36} rx={6} className="fill-card" stroke={colors[kind]} strokeWidth={1} />
                <text textAnchor="middle" className="fill-foreground" fontSize={11} fontWeight={700}>{index + 1}. {transition.label}</text>
                <text y={15} textAnchor="middle" className="fill-muted-foreground" fontSize={10}>{connection.caption}</text>
              </g>
              <g transform={reducedMotion ? `translate(${end[0]} ${end[1]})` : undefined}>
                {!reducedMotion && <animateMotion dur="1.8s" begin={`${index * 0.3}s`} repeatCount="indefinite" path={d} />}
                <path d="M -10 -7 H 5 L 10 -2 V 7 H -10 Z" fill={colors[kind]} stroke="white" strokeWidth={1} />
                <path d="M 5 -7 V -2 H 10" fill="none" stroke="white" strokeWidth={1} />
              </g>
            </g>
          );
        })}
      </svg>
      <div className="flex flex-wrap gap-x-4 gap-y-1 border-t border-border px-3 py-2 text-[10px] text-muted-foreground" aria-label="도형과 연결 범례">
        <span>큰 사각형: 앱·서버 경계</span>
        <span>내부 블록: 담당 모듈</span>
        <span>점선: 연결 구조 · 화살표: 현재 메시지</span>
      </div>
    </div>
  );
}
