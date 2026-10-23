import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { useReducedMotion } from "framer-motion";
import type { WorkflowTopologyCanvasProps } from "./WorkflowFocusedViz";

type Variant = "oom" | "uaf";
type Rect = { x: number; y: number; w: number; h: number };
type Stage = "request" | "web" | "php" | "heap" | "detail" | "result";
type Layout = { width: number; height: number; regions: Record<Stage, Rect> };
type Connection = { from: Stage; to: Stage; d: string; beat: number; end: readonly [number, number] };

const palette = {
  request: "#2563eb",
  work: "#7c3aed",
  warning: "#d97706",
  danger: "#e11d48",
  safe: "#059669",
};

const desktop: Layout = {
  width: 1000, height: 730,
  regions: {
    request: { x: 22, y: 54, w: 220, h: 264 },
    web: { x: 270, y: 54, w: 220, h: 264 },
    php: { x: 518, y: 54, w: 220, h: 264 },
    heap: { x: 766, y: 54, w: 212, h: 264 },
    detail: { x: 22, y: 383, w: 610, h: 301 },
    result: { x: 656, y: 383, w: 322, h: 301 },
  },
};

const mobile: Layout = {
  width: 460, height: 1655,
  regions: {
    request: { x: 30, y: 54, w: 400, h: 215 },
    web: { x: 30, y: 305, w: 400, h: 215 },
    php: { x: 30, y: 556, w: 400, h: 215 },
    heap: { x: 30, y: 807, w: 400, h: 215 },
    detail: { x: 30, y: 1066, w: 400, h: 285 },
    result: { x: 30, y: 1397, w: 400, h: 215 },
  },
};

function Frame({ box, title, kicker, accent, active, children }: {
  box: Rect; title: string; kicker: string; accent: string; active: boolean; children: ReactNode;
}) {
  return (
    <g>
      {active && <rect x={box.x - 4} y={box.y - 4} width={box.w + 8} height={box.h + 8} rx={15}
        fill="none" stroke={accent} strokeWidth={1.5} strokeDasharray="5 5" />}
      <rect x={box.x} y={box.y} width={box.w} height={box.h} rx={12}
        className="fill-card" style={{ stroke: active ? accent : "hsl(var(--border))" }} strokeWidth={active ? 2.3 : 1.2} />
      <rect x={box.x} y={box.y} width={5} height={box.h} rx={2} fill={active ? accent : "#94a3b8"} opacity={active ? 1 : 0.45} />
      <text x={box.x + 18} y={box.y + 24} fontSize={10} fontWeight={700}
        className="fill-muted-foreground" letterSpacing="1.2">{kicker}</text>
      <text x={box.x + 18} y={box.y + 47} fontSize={16} fontWeight={800} className="fill-foreground">{title}</text>
      <path d={"M " + (box.x + 12) + " " + (box.y + 58) + " H " + (box.x + box.w - 12)}
        stroke="currentColor" className="text-border" strokeWidth={1} />
      {children}
    </g>
  );
}

function Caption({ x, y, children, accent }: { x: number; y: number; children: ReactNode; accent?: string }) {
  return <text x={x} y={y} fontSize={11} fontWeight={600}
    style={accent ? { fill: accent } : undefined}
    className={accent ? undefined : "fill-muted-foreground"}>{children}</text>;
}

function RequestDrawing({ box, active }: { box: Rect; active: boolean }) {
  const x = box.x + 17, y = box.y + 77, w = box.w - 34;
  const small = box.h < 240;
  return (
    <g>
      <rect x={x} y={y} width={w} height={small ? 103 : 123} rx={8} className="fill-background stroke-border" strokeWidth={1.3} />
      <rect x={x} y={y} width={w} height={25} rx={7} className="fill-muted" />
      {[0, 1, 2].map(i => <circle key={i} cx={x + 12 + 12 * i} cy={y + 13} r={3} fill="#94a3b8" />)}
      <text x={x + 11} y={y + 45} fontSize={12} fontWeight={800} className="fill-foreground">POST / HTTP/1.1</text>
      <text x={x + 11} y={y + 66} fontSize={11} className="fill-muted-foreground">Host: target.example</text>
      <path d={"M " + (x + 11) + " " + (y + 77) + " H " + (x + w - 11)} className="stroke-border" />
      <rect x={x + 10} y={y + (small ? 78 : 88)} width={w - 20} height={small ? 19 : 24} rx={5}
        fill={active ? "#e11d48" : "#94a3b8"} fillOpacity={active ? 0.12 : 0.12}
        stroke={active ? palette.danger : "#94a3b8"} strokeDasharray="4 3" />
      <text x={x + 19} y={y + (small ? 92 : 104)} fontSize={11} fontWeight={700}
        style={{ fill: active ? palette.danger : "currentColor" }} className={active ? undefined : "fill-muted-foreground"}>! 조작된 요청 데이터</text>
      <Caption x={x + 3} y={box.y + box.h - 17}>인증 이전 · 요청 입력 지점</Caption>
    </g>
  );
}

function ServerDrawing({ box, active }: { box: Rect; active: boolean }) {
  const x = box.x + 18, y = box.y + 80, w = box.w - 36;
  const small = box.h < 240;
  return (
    <g>
      <rect x={x} y={y} width={w} height={small ? 85 : 117} rx={9} className="fill-muted stroke-border" strokeWidth={1} />
      {[0, 1].map(i => (
        <g key={i}>
          <rect x={x + 11} y={y + (small ? 8 : 12) + i * (small ? 41 : 48)} width={w - 22} height={small ? 30 : 37} rx={5}
            className="fill-card stroke-border" strokeWidth={1.1} />
          {[0, 1, 2].map(j => <circle key={j} cx={x + 23 + j * 12} cy={y + (small ? 23 : 30) + i * (small ? 41 : 48)} r={3}
            fill={active ? "#2563eb" : "#94a3b8"} />)}
          <path d={"M " + (x + 84) + " " + (y + (small ? 23 : 30) + i * (small ? 41 : 48)) + " h " + (w - 112)}
            className="stroke-muted-foreground" strokeWidth={2} strokeLinecap="round" />
        </g>
      ))}
      <Caption x={x + 3} y={box.y + box.h - 33}>요청 수신 → PHP 전달</Caption>
      <Caption x={x + 3} y={box.y + box.h - 17}>Apache / PHP-FPM 등</Caption>
    </g>
  );
}

function PhpDrawing({ box, active, beat }: { box: Rect; active: boolean; beat: number | null }) {
  const cx = box.x + box.w / 2, cy = box.y + (box.h < 240 ? 119 : 133);
  const highlighted = beat !== null && beat >= 1 && beat <= 4;
  return (
    <g>
      {[0, 1, 2, 3].map(i => (
        <g key={i} className="stroke-muted-foreground" strokeWidth={2}>
          <path d={"M " + (cx - 47 + i * 30) + " " + (cy - 43) + " v -10 M " + (cx - 47 + i * 30) + " " + (cy + 43) + " v 10"} />
        </g>
      ))}
      <rect x={cx - 66} y={cy - 43} width={132} height={86} rx={7}
        className="fill-background" stroke={highlighted ? palette.work : "#94a3b8"} strokeWidth={highlighted ? 2.5 : 1.2} />
      <rect x={cx - 54} y={cy - 31} width={108} height={62} rx={4} className="fill-muted" />
      <text x={cx} y={cy + 4} textAnchor="middle" fontSize={28} fontStyle="italic" fontWeight={800}
        fill={active || highlighted ? palette.work : "#64748b"}>php</text>
      <rect x={box.x + 19} y={box.y + box.h - 52} width={box.w - 38} height={26} rx={5}
        className="fill-muted stroke-border" />
      <text x={box.x + box.w / 2} y={box.y + box.h - 34} textAnchor="middle"
        fontSize={11} fontWeight={700} className="fill-foreground">
        {beat === 2 ? "메모리 관리 경로" : beat === 3 ? "잘못된 메모리 참조" : beat === 5 ? "수정된 처리 경로" : "파싱 → 할당 → 정리"}
      </text>
    </g>
  );
}

function HeapDrawing({ box, variant, beat }: { box: Rect; variant: Variant; beat: number | null }) {
  const cols = 4, startX = box.x + 22, startY = box.y + 82;
  const small = box.h < 240;
  const cellW = (box.w - 56) / cols;
  const fault = beat !== null && beat >= 2 && beat < 5;
  const patched = beat === 5;
  return (
    <g>
      <Caption x={startX} y={startY - 6}>REQUEST HEAP · 메모리 블록</Caption>
      {Array.from({ length: 12 }, (_, i) => {
        const col = i % cols, row = Math.floor(i / cols);
        const damaged = fault && (i === 6 || (i === 7 && beat >= 3));
        const filled = i < 6 || (variant === "uaf" && i === 9);
        return (
          <g key={i}>
            <rect x={startX + col * (cellW + 3)} y={startY + 4 + row * (small ? 28 : 36)}
              width={cellW - 3} height={small ? 25 : 30} rx={4}
              fill={damaged ? palette.danger : patched ? palette.safe : filled ? "#64748b" : "#94a3b8"}
              fillOpacity={damaged ? .19 : patched ? .16 : filled ? .18 : .08}
              stroke={damaged ? palette.danger : patched ? palette.safe : "#94a3b8"}
              strokeWidth={damaged ? 2.1 : 1} strokeDasharray={damaged && variant === "uaf" ? "4 3" : undefined} />
            {damaged && <path d={"M " + (startX + col * (cellW + 3) + 9) + " " + (startY + row * (small ? 28 : 36) + 10) + " l 17 14 m 0 -14 l -17 14"}
              fill="none" stroke={palette.danger} strokeWidth={2} />}
          </g>
        );
      })}
      <Caption x={startX} y={box.y + box.h - (small ? 30 : 45)}
        accent={fault ? palette.danger : patched ? palette.safe : undefined}>
        {patched ? "✓ 안전한 메모리 정리" : fault ? variant === "oom" ? "! 부분 초기화 상태" : "! 해제된 메모리 참조" : "정상 메모리 상태"}
      </Caption>
      <Caption x={startX} y={box.y + box.h - (small ? 13 : 19)}>실제 주소·페이로드 미표시</Caption>
    </g>
  );
}

function MemoryDetail({ box, variant, beat, compact }: {
  box: Rect; variant: Variant; beat: number | null; compact: boolean;
}) {
  const anomaly = beat !== null && beat >= 2 && beat <= 4;
  const broken = beat !== null && beat >= 3 && beat <= 4;
  const patched = beat === 5;
  const titles = variant === "oom"
    ? ["1 · 메모리 할당", "2 · 초기화 중단", "3 · 정리 경로"]
    : ["1 · 이전 요청", "2 · 메모리 해제", "3 · 후속 요청"];
  const captions = variant === "oom"
    ? ["요청 구조 확보", "일부 필드만 준비", "유효하지 않은 상태"]
    : ["내부 참조 생성", "메모리 수명 종료", "오래된 참조 접근"];
  const innerX = box.x + 17, gap = compact ? 7 : 13;
  const cellW = (box.w - 34 - gap * 2) / 3;
  const baseY = box.y + 92;
  return (
    <Frame box={box} title={variant === "oom" ? "OOM · 메모리 상태 확대" : "UAF · 요청 사이의 메모리 상태"}
      kicker="FAILURE MECHANISM · MEMORY" accent={patched ? palette.safe : palette.danger}
      active={beat === 2 || beat === 3 || beat === 5}>
      <g>
        {titles.map((title, i) => {
          const x = innerX + i * (cellW + gap);
          const fault = anomaly && i >= 1;
          const severe = broken && i === 2;
          const color = patched ? palette.safe : severe ? palette.danger : fault ? palette.warning : "#94a3b8";
          return (
            <g key={title}>
              <rect x={x} y={baseY} width={cellW} height={compact ? 123 : 139} rx={9}
                className="fill-background" stroke={color} strokeWidth={fault || patched ? 2 : 1} />
              <rect x={x + 9} y={baseY + 10} width={cellW - 18} height={20} rx={4} fill={color} fillOpacity={.12} />
              <text x={x + cellW / 2} y={baseY + 24} fontSize={compact ? 10 : 12} fontWeight={700}
                textAnchor="middle" className="fill-foreground">{title}</text>
              {[0, 1, 2].map((slot) => {
                const warn = !patched && anomaly && i >= 1 && slot === 2;
                return (
                  <rect key={slot} x={x + 14 + slot * ((cellW - 31) / 3)}
                    y={baseY + 49} width={(cellW - 45) / 3} height={32} rx={3}
                    fill={warn ? palette.danger : patched ? palette.safe : "#64748b"}
                    fillOpacity={warn ? .35 : patched ? .23 : slot === 2 ? .08 : .22}
                    stroke={warn ? palette.danger : patched ? palette.safe : "#94a3b8"}
                    strokeDasharray={warn && variant === "uaf" ? "3 2" : undefined} />
                );
              })}
              {i === 2 && broken && <path d={"M " + (x + 20) + " " + (baseY + 87) + " L " + (x + cellW - 20) + " " + (baseY + 87)}
                stroke={palette.danger} strokeWidth={3} strokeLinecap="round" />}
              <text x={x + cellW / 2} y={baseY + (compact ? 109 : 120)} fontSize={compact ? 9 : 11}
                textAnchor="middle" className="fill-muted-foreground">{patched ? "패치 후 정상 처리" : captions[i]}</text>
            </g>
          );
        })}
        {variant === "uaf" && (
          <g>
            <path d={"M " + (innerX + cellW * .5) + " " + (baseY + (compact ? 123 : 139)) + " V " + (baseY + (compact ? 134 : 149)) +
              " H " + (innerX + gap * 2 + cellW * 2.5) + " V " + (baseY + (compact ? 123 : 139))}
              fill="none" stroke={patched ? palette.safe : anomaly ? palette.danger : "#94a3b8"}
              strokeWidth={2} strokeDasharray="6 4" />
            <text x={box.x + box.w / 2} y={baseY + (compact ? 151 : 167)} textAnchor="middle" fontSize={compact ? 10 : 12}
              fontWeight={700} fill={patched ? palette.safe : anomaly ? palette.danger : "#64748b"}>
              {patched ? "참조 초기화 · 안전" : "전역 참조 → 해제된 메모리"}
            </text>
          </g>
        )}
        <text x={box.x + 20} y={box.y + box.h - 23} fontSize={compact ? 11 : 12}
          fontWeight={700} fill={patched ? palette.safe : anomaly ? palette.danger : "#64748b"}>
          {patched ? "✓ 패치 적용: 잘못된 상태 전이 차단"
            : variant === "oom" ? anomaly ? "✕ 할당 실패 후 비정상 정리 경로" : "할당 → 초기화 → 정리 순서"
            : anomaly ? "✕ 이전 요청의 참조가 다음 요청까지 남음" : "요청별 참조·메모리 수명 관리"}
        </text>
      </g>
    </Frame>
  );
}

function Outcome({ box, beat, compact }: { box: Rect; beat: number | null; compact: boolean }) {
  const warning = beat === 4, patched = beat === 5;
  const x = box.x + 18, y = box.y + 84, w = box.w - 36;
  const text = patched ? "PATCH APPLIED" : warning ? "POTENTIAL IMPACT" : "RISK / RESPONSE";
  return (
    <Frame box={box} title="영향 · 업데이트" kicker="OUTCOME / MITIGATION"
      active={warning || patched} accent={patched ? palette.safe : palette.danger}>
      <g>
        <rect x={x} y={y} width={w} height={compact ? 70 : 122} rx={9}
          className="fill-background stroke-border" />
        <rect x={x} y={y} width={w} height={25} rx={8} className="fill-muted" />
        <circle cx={x + 12} cy={y + 13} r={3} fill={patched ? palette.safe : "#e11d48"} />
        <text x={x + 24} y={y + 17} fontSize={10} fontWeight={700} className="fill-muted-foreground">{text}</text>
        <path d={"M " + (x + 15) + " " + (y + 42) + " l 8 7 l -8 7"} fill="none"
          stroke={patched ? palette.safe : warning ? palette.danger : "#64748b"} strokeWidth={2} />
        <text x={x + 32} y={y + 52} fontSize={compact ? 12 : 14} fontWeight={800}
          fill={patched ? palette.safe : warning ? palette.danger : "#64748b"}>
          {patched ? "메모리 경로 안전화" : warning ? "RCE 가능성 · 조건부" : "메모리 손상 → 실행 위험"}
        </text>
        {!compact && (
          <>
            <Caption x={x + 15} y={y + 79}>모든 요청이 코드 실행으로 이어지지는 않음</Caption>
            <Caption x={x + 15} y={y + 102}>실제 악용 명령 대신 상태만 표시</Caption>
          </>
        )}
        <rect x={x} y={y + (compact ? 83 : 138)} width={w} height={compact ? 39 : 45} rx={8}
          fill={patched ? palette.safe : "#64748b"} fillOpacity={patched ? .13 : .08}
          stroke={patched ? palette.safe : "#94a3b8"} strokeWidth={1.2} />
        <path d={"M " + (x + 17) + " " + (y + (compact ? 98 : 152)) + " l 6 -7 l 6 7 l -6 7 z"}
          fill={patched ? palette.safe : "#94a3b8"} />
        <text x={x + 42} y={y + (compact ? 108 : 164)} fontSize={compact ? 11 : 12}
          fontWeight={700} className="fill-foreground">
          {patched ? "PHP 업데이트 · 재시작 · 검증" : "필수 조치: PHP 보안 패치"}
        </text>
        {!compact && <Caption x={x + 4} y={box.y + box.h - 18}>WAF나 설정 변경만으로 완전 대응 불가</Caption>}
      </g>
    </Frame>
  );
}

function connections(layout: Layout, compact: boolean): Connection[] {
  const r = layout.regions;
  if (compact) {
    const vertical = (a: Stage, b: Stage, beat: number): Connection => {
      const start = r[a], end = r[b], x = start.x + start.w / 2;
      return { from: a, to: b, beat, d: "M " + x + " " + (start.y + start.h + 4) + " V " + (end.y - 4), end: [x, end.y - 4] };
    };
    return [
      vertical("request", "web", 0), vertical("web", "php", 1),
      vertical("php", "heap", 2), vertical("heap", "detail", 3),
      vertical("detail", "result", 4),
    ];
  }
  const horizontal = (a: Stage, b: Stage, beat: number): Connection => {
    const start = r[a], end = r[b], y = start.y + 145;
    return { from: a, to: b, beat, d: "M " + (start.x + start.w + 4) + " " + y + " H " + (end.x - 4), end: [end.x - 4, y] };
  };
  return [
    horizontal("request", "web", 0), horizontal("web", "php", 1),
    horizontal("php", "heap", 2),
    { from: "heap", to: "detail", beat: 3, d: "M 872 323 V 358 H 336 V 379", end: [336, 379] },
    { from: "detail", to: "result", beat: 4, d: "M 636 536 H 652", end: [652, 536] },
  ];
}

function Scene({ spec, stepIndex, playing, variant }: WorkflowTopologyCanvasProps & { variant: Variant }) {
  const [compact, setCompact] = useState(false);
  const reducedMotion = useReducedMotion() ?? false;
  const svgRef = useRef<SVGSVGElement>(null);
  const id = useId().replace(/:/g, "");
  const layout = compact ? mobile : desktop;
  const r = layout.regions;
  const beat = stepIndex;
  const patch = beat === 5;
  const active = (stage: Stage): boolean => {
    if (beat === null) return false;
    if (patch) return stage === "php" || stage === "heap" || stage === "detail" || stage === "result";
    return (
      (beat === 0 && (stage === "request" || stage === "web")) ||
      (beat === 1 && (stage === "web" || stage === "php")) ||
      (beat === 2 && (stage === "php" || stage === "heap" || stage === "detail")) ||
      (beat === 3 && (stage === "heap" || stage === "detail")) ||
      (beat === 4 && (stage === "detail" || stage === "result"))
    );
  };
  useEffect(() => {
    const media = window.matchMedia("(max-width: 640px)");
    const sync = () => setCompact(media.matches);
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);
  useEffect(() => {
    if (playing) svgRef.current?.unpauseAnimations();
    else svgRef.current?.pauseAnimations();
  }, [playing, stepIndex, compact, reducedMotion]);

  return (
    <div className="bg-background p-1 sm:p-2">
      <svg ref={svgRef} viewBox={"0 0 " + layout.width + " " + layout.height}
        className="block w-full" role="img"
        aria-label={"PHP2Shell " + (variant === "oom" ? "메모리 부족 처리 오류" : "해제 후 사용") +
          " 도형 시각화. " + (beat === null ? "전체 시스템 구조" : spec.steps[beat].title) +
          ". 요청서, 웹 서버 랙, PHP 처리 칩, 힙 메모리 블록, 취약점 확대와 패치 결과를 단계별로 표시합니다."}>
        <defs>
          <marker id={"php-flow-" + id} viewBox="0 0 10 10" refX="9" refY="5"
            markerWidth="8" markerHeight="8" orient="auto" markerUnits="userSpaceOnUse">
            <path d="M 0 0 L 10 5 L 0 10 Z" fill="#64748b" />
          </marker>
          <marker id={"php-active-" + id} viewBox="0 0 10 10" refX="9" refY="5"
            markerWidth="9" markerHeight="9" orient="auto" markerUnits="userSpaceOnUse">
            <path d="M 0 0 L 10 5 L 0 10 Z" fill={patch ? palette.safe : palette.danger} />
          </marker>
        </defs>
        <text x={compact ? 30 : 22} y={29} fontSize={12} fontWeight={800}
          className="fill-muted-foreground" letterSpacing="1.4">
          {"PHP2SHELL / " + (variant === "oom" ? "OUT-OF-MEMORY" : "USE-AFTER-FREE")}
        </text>
        {connections(layout, compact).map((wire) => {
          const selected = beat === wire.beat || (patch && wire.to === "result");
          const color = patch && selected ? palette.safe : selected ? palette.danger : "#94a3b8";
          return (
            <g key={wire.from + wire.to} data-flow={wire.from + "-" + wire.to}>
              <path d={wire.d} fill="none" stroke={color} strokeWidth={selected ? 3.4 : 1.7}
                strokeDasharray={selected ? undefined : "5 5"}
                markerEnd={"url(#" + (selected ? "php-active-" : "php-flow-") + id + ")"} opacity={selected ? 1 : .7} />
              {selected && (
                <g transform={reducedMotion ? "translate(" + wire.end[0] + " " + wire.end[1] + ")" : undefined}>
                  {!reducedMotion && <animateMotion key={String(beat)} path={wire.d} dur="2.2s" repeatCount="indefinite" />}
                  <rect x={-8} y={-6} width={16} height={12} rx={3} fill={color} stroke="white" strokeWidth={1} />
                </g>
              )}
            </g>
          );
        })}
        <Frame box={r.request} title="① 조작된 HTTP 요청" kicker="EXTERNAL REQUEST" active={active("request")} accent={palette.danger}>
          <RequestDrawing box={r.request} active={active("request")} />
        </Frame>
        <Frame box={r.web} title="② 웹 서버" kicker="HTTP HANDOFF" active={active("web")} accent={palette.request}>
          <ServerDrawing box={r.web} active={active("web")} />
        </Frame>
        <Frame box={r.php} title="③ PHP 런타임" kicker="REQUEST PARSER" active={active("php")} accent={palette.work}>
          <PhpDrawing box={r.php} active={active("php")} beat={beat} />
        </Frame>
        <Frame box={r.heap} title="④ 요청 메모리" kicker="HEAP / LIFETIME" active={active("heap")} accent={patch ? palette.safe : palette.warning}>
          <HeapDrawing box={r.heap} variant={variant} beat={beat} />
        </Frame>
        <MemoryDetail box={r.detail} variant={variant} beat={beat} compact={compact} />
        <Outcome box={r.result} beat={beat} compact={compact} />
      </svg>
      <div className="flex flex-wrap gap-x-4 gap-y-1 border-t border-border px-3 py-2 text-[11px] text-muted-foreground"
        aria-label="시각화 범례">
        <span>요청서: 외부 입력</span>
        <span>서버 랙·PHP 칩: 처리 주체</span>
        <span>메모리 셀: 할당·해제 상태</span>
        <span>빨간 실선: 현재 위험 전이 · 초록: 패치된 경로</span>
        <span>상대적 동작 설명이며 실제 공격 페이로드가 아닙니다</span>
      </div>
    </div>
  );
}

export function Php2ShellOomScene(props: WorkflowTopologyCanvasProps) {
  return <Scene {...props} variant="oom" />;
}

export function Php2ShellUafScene(props: WorkflowTopologyCanvasProps) {
  return <Scene {...props} variant="uaf" />;
}
