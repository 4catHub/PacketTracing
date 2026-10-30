import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { useReducedMotion } from "framer-motion";
import type { WorkflowTopologyCanvasProps } from "./WorkflowFocusedViz";
import RedisCasePanel from "./RedisSecurity2026CasePanels";

export type RedisCaseId = "23479" | "25243" | "25588" | "25589" | "23631";
type Mode = "vulnerable" | "patched";
type ActorId = "client" | "access" | "core" | "feature" | "memory" | "result";
type Box = { x: number; y: number; w: number; h: number };
type Layout = { width: number; height: number; boxes: Record<ActorId, Box> };
type Route = { from: ActorId; to: ActorId; d: string; end: readonly [number, number] };

const blue = "#2563eb";
const violet = "#7c3aed";
const amber = "#d97706";
const danger = "#e11d48";
const safe = "#059669";
const gray = "#64748b";

const desktop: Layout = {
  width: 1000, height: 672,
  boxes: {
    client: { x: 20, y: 53, w: 214, h: 257 },
    access: { x: 267, y: 53, w: 214, h: 257 },
    core: { x: 514, y: 53, w: 214, h: 257 },
    feature: { x: 761, y: 53, w: 218, h: 257 },
    memory: { x: 20, y: 382, w: 460, h: 245 },
    result: { x: 520, y: 382, w: 459, h: 245 },
  },
};
const narrow: Layout = {
  width: 460, height: 1480,
  boxes: {
    client: { x: 28, y: 51, w: 404, h: 196 },
    access: { x: 28, y: 277, w: 404, h: 196 },
    core: { x: 28, y: 503, w: 404, h: 196 },
    feature: { x: 28, y: 729, w: 404, h: 196 },
    memory: { x: 28, y: 955, w: 404, h: 235 },
    result: { x: 28, y: 1220, w: 404, h: 210 },
  },
};

function routes(layout: Layout, compact: boolean): Route[] {
  const b = layout.boxes;
  const ids: ActorId[] = ["client", "access", "core", "feature", "memory", "result"];
  if (compact) {
    return ids.slice(0, -1).map((from, i) => {
      const to = ids[i + 1], start = b[from], end = b[to], x = start.x + start.w / 2;
      return { from, to, d: "M " + x + " " + (start.y + start.h + 3) + " V " + (end.y - 3),
        end: [x, end.y - 3] as const };
    });
  }
  const row = (from: ActorId, to: ActorId): Route => {
    const start = b[from], end = b[to], y = start.y + 166;
    return { from, to, d: "M " + (start.x + start.w + 2) + " " + y + " H " + (end.x - 3),
      end: [end.x - 3, y] };
  };
  return [
    row("client", "access"), row("access", "core"), row("core", "feature"),
    { from: "feature", to: "memory", d: "M 870 314 V 349 H 250 V 379", end: [250, 379] },
    { from: "memory", to: "result", d: "M 482 503 H 517", end: [517, 503] },
  ];
}

function Label({ x, y, children, color = "muted", size = 11, anchor = "start" }: {
  x: number; y: number; children: ReactNode; color?: "muted" | "normal" | "blue" | "warning" | "danger" | "safe";
  size?: number; anchor?: "start" | "middle";
}) {
  const tint = color === "blue" ? blue : color === "warning" ? amber :
    color === "danger" ? danger : color === "safe" ? safe : undefined;
  return <text x={x} y={y} textAnchor={anchor} fontSize={size} fontWeight={color === "normal" ? 700 : 600}
    fill={tint} className={tint ? undefined : color === "normal" ? "fill-foreground" : "fill-muted-foreground"}>
    {children}
  </text>;
}

function Frame({ box, eyebrow, title, active, accent, children }: {
  box: Box; eyebrow: string; title: string; active: boolean; accent: string; children: ReactNode;
}) {
  return (
    <g>
      {active && <rect x={box.x - 4} y={box.y - 4} width={box.w + 8} height={box.h + 8} rx={15}
        fill="none" stroke={accent} strokeWidth={1.6} strokeDasharray="5 4" />}
      <rect x={box.x} y={box.y} width={box.w} height={box.h} rx={12}
        className="fill-card" stroke={active ? accent : "#94a3b8"} strokeOpacity={active ? 1 : .56}
        strokeWidth={active ? 2.4 : 1.25} />
      <rect x={box.x} y={box.y + 14} width={5} height={box.h - 28} rx={2.5}
        fill={active ? accent : "#94a3b8"} opacity={active ? 1 : .55} />
      <Label x={box.x + 17} y={box.y + 24} size={10}>{eyebrow}</Label>
      <Label x={box.x + 17} y={box.y + 47} color="normal" size={16}>{title}</Label>
      <path d={"M " + (box.x + 12) + " " + (box.y + 58) + " H " + (box.x + box.w - 12)}
        className="stroke-border" strokeWidth={1} />
      {children}
    </g>
  );
}

function FeatureDrawing({ box, selected, phase, active, compact, mode, patched }: {
  box: Box; selected: RedisCaseId; phase: number | null; active: boolean; compact: boolean;
  mode: Mode; patched: boolean;
}) {
  const x = box.x + 17, y = box.y + 77, w = box.w - 34;
  const issue = mode === "vulnerable" && phase !== null && phase >= 2 && phase <= 4;
  const color = patched ? safe : issue ? danger : amber;
  const name = selected === "23479" ? "차단 대기열 · 축출" : selected === "25243" ? "RESTORE 기본 복원" :
    selected === "25588" ? "RedisTimeSeries 복원" :
    selected === "25589" ? "RedisBloom 복원" : "Lua · 복제 동기화";
  return (
    <Frame box={box} eyebrow="04 / VULNERABLE SUBSYSTEM" title={name} active={active} accent={patched ? safe : amber}>
      <rect x={x} y={y} width={w} height={compact ? 74 : 122} rx={8}
        className="fill-background stroke-border" />
      {selected === "23479" && <>
        {[0, 1, 2].map(i => (
          <g key={i}>
            <rect x={x + 13 + i * ((w - 26) / 3)} y={y + 23} width={(w - 48) / 3} height={38} rx={5}
              fill={i === 2 && issue ? danger : gray} fillOpacity={.15}
              stroke={i === 2 && issue ? danger : gray} strokeDasharray={i === 2 && issue ? "4 3" : undefined} />
            <Label x={x + 18 + i * ((w - 26) / 3)} y={y + 46} size={10}>
              {i === 0 ? "WAIT" : i === 1 ? "RETRY" : "EVICT"}
            </Label>
          </g>
        ))}
        {!compact && <Label x={x + 16} y={y + 94} color={issue ? "danger" : "muted"} size={11}>
          {issue ? "축출 후 오류 반환 누락" : "blocked client 재실행"}
        </Label>}
      </>}
      {(selected === "25243" || selected === "25588") && <>
        <path d={"M " + (x + 22) + " " + (y + 16) + " H " + (x + 65) + " L " +
          (x + 78) + " " + (y + 29) + " V " + (y + 63) + " H " + (x + 22) + " Z"}
          fill={color} fillOpacity={.1} stroke={color} strokeWidth={1.5} />
        <path d={"M " + (x + 65) + " " + (y + 16) + " V " + (y + 29) + " H " + (x + 78)}
          stroke={color} strokeWidth={1.5} fill="none" />
        <Label x={x + 31} y={y + 43} size={10} color={issue ? "danger" : "normal"}>DATA</Label>
        <path d={"M " + (x + 85) + " " + (y + 44) + " h 19 l -5 -5 m 5 5 l -5 5"}
          stroke={color} strokeWidth={2} fill="none" />
        {selected === "25588" ? <>
          <path d={"M " + (x + 111) + " " + (y + 62) + " V " + (y + 24) +
            " M " + (x + 111) + " " + (y + 62) + " H " + (x + w - 11)}
            stroke={gray} strokeWidth={1.3} fill="none" />
          <path d={"M " + (x + 115) + " " + (y + 51) + " l 13 -14 l 13 7 l 13 -17 l 14 9"}
            stroke={color} strokeWidth={2} fill="none" />
        </> : <rect x={x + 115} y={y + 25} width={w - 129} height={40}
          rx={5} fill={color} fillOpacity={.1} stroke={color} />}
        {!compact && <Label x={x + 14} y={y + 94} size={11}>직렬화 데이터 → 복원 처리</Label>}
      </>}
      {selected === "25589" && <>
        {Array.from({ length: 20 }, (_, i) => {
          const cx = x + 17 + (i % 10) * ((w - 36) / 10), cy = y + 24 + Math.floor(i / 10) * 25;
          const lit = [1, 3, 4, 8, 11, 14, 17].includes(i);
          return <rect key={i} x={cx} y={cy} width={11} height={14} rx={2}
            fill={lit ? color : gray} fillOpacity={lit ? .5 : .1} stroke={lit ? color : gray} />;
        })}
        {!compact && <Label x={x + 14} y={y + 94} color={issue ? "danger" : "muted"} size={11}>
          Bloom 자료구조 역직렬화
        </Label>}
      </>}
      {selected === "23631" && <>
        {[0, 1].map(i => {
          const sx = x + 9 + i * (w / 2);
          return <g key={i}>
            <rect x={sx} y={y + 18} width={w / 2 - 19} height={47} rx={5}
              fill={color} fillOpacity={.1} stroke={i === 1 && issue ? danger : gray} strokeWidth={1.5} />
            <Label x={sx + 10} y={y + 37} size={10} color="normal">{i === 0 ? "MASTER" : "REPLICA"}</Label>
            <Label x={sx + 10} y={y + 52} size={10}>{i === 0 ? "SYNC" : "LUA"}</Label>
          </g>;
        })}
        <path d={"M " + (x + w / 2 - 7) + " " + (y + 43) + " h 13 l -5 -5 m 5 5 l -5 5"}
          fill="none" stroke={color} strokeWidth={1.6} />
        {!compact && <Label x={x + 8} y={y + 94} color={issue ? "danger" : "muted"} size={11}>
          replica-read-only = no
        </Label>}
      </>}
      <Label x={x + 3} y={box.y + box.h - 18} color={patched ? "safe" : issue ? "danger" : "muted"} size={10}>
        {patched ? "✓ 업데이트로 취약 경로 수정" : issue ? "! 취약 상태 처리 중" : "현재 CVE의 내부 처리 구조"}
      </Label>
    </Frame>
  );
}

export default function RedisSecurity2026Scene({ spec, stepIndex, playing, selected, mode }: WorkflowTopologyCanvasProps & {
  selected: RedisCaseId; mode: Mode;
}) {
  const [compact, setCompact] = useState(false);
  const reducedMotion = useReducedMotion() ?? false;
  const svgRef = useRef<SVGSVGElement>(null);
  const id = useId().replace(/:/g, "");
  const layout = compact ? narrow : desktop;
  const box = layout.boxes;
  const active = (actor: ActorId) => stepIndex !== null &&
    spec.steps[stepIndex].activeActorIds.includes(actor);
  const patched = mode === "patched" && stepIndex !== null && stepIndex >= 1;

  useEffect(() => {
    const media = window.matchMedia("(max-width: 640px)");
    const update = () => setCompact(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);
  useEffect(() => {
    if (playing) svgRef.current?.unpauseAnimations();
    else svgRef.current?.pauseAnimations();
  }, [playing, stepIndex, compact, reducedMotion]);

  return (
    <div className="bg-background p-1 sm:p-2">
      <svg ref={svgRef} viewBox={"0 0 " + layout.width + " " + layout.height}
        className="block w-full" role="img"
        aria-label={"CVE-2026-" + selected + (mode === "patched" ? " 패치 후 검증" : " 취약 경로") + ": 인증된 사용자, 접근 통제, Redis 명령 처리, 취약 서브시스템, 메모리 상태 및 결과. " +
          (stepIndex === null ? "전체 구조" : spec.steps[stepIndex].title)}>
        <defs>
          <marker id={"redis-idle-" + id} viewBox="0 0 10 10" refX="9" refY="5"
            markerWidth="8" markerHeight="8" orient="auto" markerUnits="userSpaceOnUse">
            <path d="M 0 0 L 10 5 L 0 10 Z" fill="#94a3b8" />
          </marker>
          <marker id={"redis-current-" + id} viewBox="0 0 10 10" refX="9" refY="5"
            markerWidth="9" markerHeight="9" orient="auto" markerUnits="userSpaceOnUse">
            <path d="M 0 0 L 10 5 L 0 10 Z" fill={patched ? safe : mode === "patched" ? violet : danger} />
          </marker>
        </defs>
        <Label x={compact ? 28 : 20} y={28} size={12}>REDIS SECURITY ADVISORY · CVE-2026-{selected}</Label>
        {routes(layout, compact).map((route, index) => {
          const highlighted = mode === "patched"
            ? (stepIndex === 0 && index === 2) ||
              (stepIndex === 1 && (index === 2 || index === 3)) ||
              (stepIndex === 2 && (index === 3 || index === 4))
            : stepIndex === index;
          const color = highlighted ? (patched ? safe : mode === "patched" ? violet : danger) : "#94a3b8";
          return (
            <g key={route.from + route.to} data-flow={route.from + "-" + route.to}>
              <path d={route.d} fill="none" stroke={color} strokeWidth={highlighted ? 3.3 : 1.7}
                strokeDasharray={highlighted ? undefined : "5 5"} opacity={highlighted ? 1 : .75}
                markerEnd={"url(#redis-" + (highlighted ? "current-" : "idle-") + id + ")"} />
              {highlighted && <g transform={reducedMotion ? "translate(" + route.end[0] + " " + route.end[1] + ")" : undefined}>
                {!reducedMotion && <animateMotion path={route.d} dur="2.1s"
                  begin={String(mode === "patched" ? Math.max(0, index - 2) * .3 : 0) + "s"} repeatCount="indefinite" />}
                <rect x={-7} y={-6} width={14} height={12} rx={3} fill={color} stroke="white" strokeWidth={1} />
              </g>}
            </g>
          );
        })}
        <RedisCasePanel stage="client" box={box.client} selected={selected}
          mode={mode} phase={stepIndex} active={active("client")} compact={compact} />
        <RedisCasePanel stage="access" box={box.access} selected={selected}
          mode={mode} phase={stepIndex} active={active("access")} compact={compact} />
        <RedisCasePanel stage="core" box={box.core} selected={selected}
          mode={mode} phase={stepIndex} active={active("core")} compact={compact} />
        <FeatureDrawing box={box.feature} selected={selected} active={active("feature")}
          phase={stepIndex} compact={compact} mode={mode} patched={patched} />
        <RedisCasePanel stage="memory" box={box.memory} selected={selected}
          mode={mode} phase={stepIndex} active={active("memory")} compact={compact} />
        <RedisCasePanel stage="result" box={box.result} selected={selected}
          mode={mode} phase={stepIndex} active={active("result")} compact={compact} />
      </svg>
      <div className="flex flex-wrap gap-3 border-t border-border px-3 py-2 text-[10px] text-muted-foreground"
        aria-label="Redis 공격 흐름 범례">
        <span>각 CVE의 입력·권한·명령 처리·메모리 오류가 다른 도형으로 표시됩니다</span>
        <span>공통 경계: Redis 인증·접근 권한</span>
        <span>빨간 실선: 위험 전이 · 초록 실선: 수정 후 경로</span>
        <span>개념 시각화 · 공격 페이로드 없음</span>
      </div>
    </div>
  );
}
