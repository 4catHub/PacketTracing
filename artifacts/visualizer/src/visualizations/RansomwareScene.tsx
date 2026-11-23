import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Activity, Bug, Check, CirclePause, Globe2, Lock, ShieldCheck, TriangleAlert } from "lucide-react";

export type RansomwareFrame =
  | "overview" | "spread" | "encrypt" | "ransom" | "kill-switch"
  | "isolate" | "collect" | "rebuild" | "restore" | "reconnect";

type Mode = "attack" | "recovery";
type Actor = "source" | "target" | "peer" | "files" | "switch"
  | "host" | "network" | "evidence" | "clean" | "backup";
type Tone = "neutral" | "danger" | "warning" | "safe";
type Point = [number, number];

const colors: Record<Tone, string> = {
  neutral: "text-muted-foreground",
  danger: "text-rose-700 dark:text-rose-300",
  warning: "text-amber-700 dark:text-amber-300",
  safe: "text-emerald-700 dark:text-emerald-300",
};

type Route = {
  active: RansomwareFrame;
  label: string;
  desktop: string;
  mobile: string;
  labelDesktop: Point;
  labelMobile: Point;
  tone: Tone;
  copies?: boolean;
};

const attackRoutes: Route[] = [
  { active: "spread", label: "SMBv1", desktop: "M 234 89 H 366", mobile: "M 158 67 H 202",
    labelDesktop: [300, 72], labelMobile: [180, 55], tone: "danger" },
  { active: "encrypt", label: "전파 시도", desktop: "M 534 89 H 666", mobile: "M 211 108 H 170 V 193 H 88 V 205",
    labelDesktop: [600, 72], labelMobile: [108, 183], tone: "warning" },
  { active: "encrypt", label: "파일 암호화", desktop: "M 450 193 V 236", mobile: "M 272 166 V 205",
    labelDesktop: [504, 216], labelMobile: [316, 188], tone: "danger" },
  { active: "kill-switch", label: "도메인 응답", desktop: "M 234 270 H 300 V 117 H 366", mobile: "M 152 426 H 191 V 96 H 202",
    labelDesktop: [300, 258], labelMobile: [232, 375], tone: "safe" },
];

const recoveryRoutes: Route[] = [
  { active: "collect", label: "증거 사본", desktop: "M 150 193 V 236", mobile: "M 88 166 V 205",
    labelDesktop: [195, 216], labelMobile: [130, 188], tone: "warning", copies: true },
  { active: "restore", label: "백업 데이터", desktop: "M 687 283 H 534", mobile: "M 272 385 V 351",
    labelDesktop: [610, 267], labelMobile: [225, 371], tone: "safe", copies: true },
  { active: "reconnect", label: "순차 재연결", desktop: "M 450 240 V 210 H 750 V 192", mobile: "M 272 205 V 167",
    labelDesktop: [600, 198], labelMobile: [225, 188], tone: "safe" },
];

const actorPositions: Record<Actor, { desktop: Point; mobile: Point }> = {
  source: { desktop: [150, 48], mobile: [88, 26] },
  target: { desktop: [450, 48], mobile: [272, 26] },
  peer: { desktop: [750, 48], mobile: [88, 210] },
  files: { desktop: [450, 246], mobile: [272, 210] },
  switch: { desktop: [150, 246], mobile: [88, 390] },
  host: { desktop: [150, 48], mobile: [88, 26] },
  network: { desktop: [750, 48], mobile: [272, 26] },
  evidence: { desktop: [150, 246], mobile: [88, 210] },
  clean: { desktop: [450, 246], mobile: [272, 210] },
  backup: { desktop: [750, 246], mobile: [272, 390] },
};

const frameDescriptions: Record<RansomwareFrame, string> = {
  overview: "기기와 파일, 네트워크 연결의 전체 배치입니다.",
  spread: "PC A의 감염이 네트워크를 거쳐 미패치 PC B로 옮겨갑니다.",
  encrypt: "PC B 아래 문서에 잠금이 생기고, 다른 경로로 PC C에 전파를 시도합니다.",
  ransom: "PC B 모니터에 몸값 요구 창이 뜨고 파일 잠금이 유지됩니다.",
  "kill-switch": "도메인이 응답해 해당 변종의 후속 실행을 멈춥니다. 기존 파일은 잠겨 있습니다.",
  isolate: "PC와 운영망 사이 케이블을 분리합니다.",
  collect: "감염 PC의 로그와 파일 사본을 증거 보관함에 복사합니다. 네트워크 격리는 유지됩니다.",
  rebuild: "별도의 복구 환경에서 운영체제를 재설치하고 패치를 검증합니다.",
  restore: "정상 백업의 복사본이 복구 환경으로 들어가 열 수 있는 파일이 됩니다.",
  reconnect: "복구 환경을 검증한 뒤 운영망으로 연결합니다. 감염 PC의 격리는 유지됩니다.",
};

function Monitor({ children, compact }: { children: ReactNode; compact: boolean }) {
  const width = compact ? 140 : 164;
  return (
    <>
      <rect x={-width / 2} y="0" width={width} height="80" rx="9" className="fill-card" stroke="currentColor" strokeWidth="2" />
      <rect x={-width / 2 + 7} y="7" width={width - 14} height="62" rx="4" className="fill-muted stroke-border" />
      <path d="M 0 80 V 90 M -22 91 H 22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      {children}
    </>
  );
}

function FileShape({ locked = false }: { locked?: boolean }) {
  return (
    <>
      <path d="M -16 -24 H 5 L 16 -13 V 24 H -16 Z M 5 -24 V -13 H 16" className="fill-card" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      {locked
        ? <Lock x="-9" y="-6" width="18" height="18" strokeWidth="1.8" />
        : <path d="M -8 -5 H 6 M -8 2 H 8 M -8 9 H 5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />}
    </>
  );
}

function Reveal({ moving, delay = 0, children }: { moving: boolean; delay?: number; children: ReactNode }) {
  return moving
    ? <motion.g initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.24, delay }}>{children}</motion.g>
    : <g>{children}</g>;
}

function TravelingPayload({ path, copies }: { path: string; copies?: boolean }) {
  const animationId = `ransomware-payload-${useId().replace(/[^\w-]/g, "")}`;
  const animation = useRef<SVGAnimateMotionElement>(null);

  useEffect(() => {
    animation.current?.beginElement();
  }, [path]);

  return (
    <g aria-hidden="true" opacity="0">
      <animateMotion ref={animation} id={animationId} path={path} begin="indefinite" dur="1.35s" />
      <animate attributeName="opacity" begin={`${animationId}.begin`} dur="1.35s"
        values="0;1;1;0" keyTimes="0;0.12;0.88;1" />
      {copies
        ? <path d="M -6 -8 H 2 L 6 -4 V 8 H -6 Z M -3 0 H 3 M -3 4 H 3" className="fill-card stroke-current" strokeWidth="1.5" />
        : <rect x="-5" y="-4" width="10" height="8" rx="2" className="fill-current" />}
    </g>
  );
}

function RouteLabel({ position: [x, y], children }: { position: Point; children: string }) {
  return (
    <text x={x} y={y} textAnchor="middle" fontSize="13" fontWeight="700" paintOrder="stroke"
      strokeWidth="5" strokeLinejoin="round" className="fill-current stroke-background">
      {children}
    </text>
  );
}

export default function RansomwareScene({
  mode, frame, playing, activeActorIds,
}: {
  mode: Mode;
  frame: RansomwareFrame;
  playing: boolean;
  activeActorIds: readonly string[];
}) {
  const [compact, setCompact] = useState(false);
  const reduced = useReducedMotion();
  const markerId = `ransomware-arrow-${useId().replace(/[^\w-]/g, "")}`;
  const moving = playing && !reduced;
  const showAll = frame === "overview";

  useEffect(() => {
    const query = window.matchMedia("(max-width: 640px)");
    const sync = () => setCompact(query.matches);
    sync();
    query.addEventListener("change", sync);
    return () => query.removeEventListener("change", sync);
  }, []);

  const layout = compact ? "mobile" : "desktop";
  const routes = mode === "attack" ? attackRoutes : recoveryRoutes;
  const locked = frame === "encrypt" || frame === "ransom" || frame === "kill-switch";
  const stopped = frame === "kill-switch";
  const infected = !showAll && !stopped;
  const isolated = mode === "recovery" && !showAll;
  const collected = isolated && frame !== "isolate";
  const rebuilt = frame === "rebuild" || frame === "restore" || frame === "reconnect";
  const restored = frame === "restore" || frame === "reconnect";
  const reconnected = frame === "reconnect";
  const targetState = stopped ? "후속 실행 중단" : infected ? "웜 감염" : "Windows · 미패치";
  const hostState = isolated ? "운영망과 분리됨" : "감염 확인";
  const cleanState = reconnected ? "서비스 운영 중" : restored ? "파일 복원 완료" : rebuilt ? "패치 검증 완료" : "별도 복구 환경";
  const cable = compact ? { start: 158, end: 202, mid: 180, y: 67 } : { start: 234, end: 666, mid: 450, y: 89 };
  const lockStage = moving && frame === "encrypt";

  function actor(id: Actor, label: string, status: string, tone: Tone, shape: ReactNode) {
    const [x, y] = actorPositions[id][layout];
    const emphasized = showAll || activeActorIds.includes(id) || (id === "files" && locked) || (id === "host" && isolated);
    return (
      <g transform={`translate(${x} ${y})`} data-actor={id} data-state={status}
        opacity={emphasized ? 1 : 0.7} className={colors[tone]}>
        {shape}
        <text x="0" y="112" textAnchor="middle" className="fill-foreground" fontSize="16" fontWeight="750">{label}</text>
        <text x="0" y="132" textAnchor="middle" className="fill-current" fontSize="13" fontWeight="600">{status}</text>
      </g>
    );
  }

  return (
    <svg viewBox={compact ? "0 0 360 544" : "0 0 900 400"} className="block w-full border-t border-border bg-background"
      role="img" aria-label={frameDescriptions[frame]} data-testid="ransomware-scene" data-frame={frame}>
      <defs>
        <marker id={markerId} viewBox="0 0 10 10" refX="8" refY="5" markerWidth="9" markerHeight="9" markerUnits="userSpaceOnUse" orient="auto">
          <path d="M 0 0 L 10 5 L 0 10 Z" fill="context-stroke" />
        </marker>
      </defs>

      {routes.map((route) => (
        <path key={route.label} d={route[layout]} className="stroke-muted-foreground/35" strokeWidth="1.5" strokeDasharray="4 5" fill="none" />
      ))}
      {mode === "recovery" && (
        <g className={isolated ? colors.warning : colors.neutral} data-cable={isolated ? "disconnected" : "connected"}
          opacity={showAll || frame === "isolate" ? 1 : 0.72}>
          {isolated ? (
            <>
              <path d={`M ${cable.start} ${cable.y} H ${cable.mid - 13} M ${cable.mid + 13} ${cable.y} H ${cable.end}`}
                stroke="currentColor" strokeWidth="2" fill="none" />
              <g transform={`translate(${cable.mid} ${cable.y})`}>
                <motion.path d="M -13 -5 H -8 V 5 H -13 Z" fill="currentColor"
                  initial={moving && frame === "isolate" ? { x: 6 } : false} animate={{ x: 0 }} transition={{ duration: 0.32 }} />
                <motion.path d="M 13 -5 H 8 V 5 H 13 Z" fill="currentColor"
                  initial={moving && frame === "isolate" ? { x: -6 } : false} animate={{ x: 0 }} transition={{ duration: 0.32 }} />
                <path d="M -3 -3 L 3 3 M 3 -3 L -3 3" stroke="currentColor" strokeWidth="1.6" />
              </g>
              <RouteLabel position={[cable.mid, cable.y - 13]}>{compact ? "분리" : "케이블 분리 · 운영망 격리"}</RouteLabel>
            </>
          ) : (
            <path d={`M ${cable.start} ${cable.y} H ${cable.end}`} stroke="currentColor" strokeWidth="2" strokeDasharray="5 5" fill="none" />
          )}
        </g>
      )}

      {routes.filter((route) => route.active === frame).map((route) => (
        <g key={route.label} className={colors[route.tone]} data-active-route={route.label}>
          <path d={route[layout]} fill="none" stroke="currentColor" strokeWidth="2.5" markerEnd={`url(#${markerId})`} />
          {moving && <TravelingPayload path={route[layout]} copies={route.copies} />}
          <RouteLabel position={compact ? route.labelMobile : route.labelDesktop}>{route.label}</RouteLabel>
        </g>
      ))}

      {mode === "attack" ? (
        <>
          {actor("source", "감염 PC A", "웜 실행 중", "danger", <Monitor compact={compact}><Bug x="-14" y="22" width="28" height="28" /></Monitor>)}
          {actor("target", "PC B", targetState, stopped ? "safe" : infected ? "danger" : "warning", (
            <Monitor compact={compact}>
              {frame === "ransom" ? (
                <Reveal key="note" moving={moving} delay={0.25}>
                  <rect x="-56" y="13" width="112" height="49" rx="5" className="fill-card" stroke="currentColor" strokeWidth="1.4" />
                  <path d="M -56 26 H 56" stroke="currentColor" />
                  <circle cx="-48" cy="20" r="1.8" fill="currentColor" />
                  <text x="0" y="42" textAnchor="middle" fontSize="13" fontWeight="750" className="fill-current">몸값 요구</text>
                  <text x="0" y="55" textAnchor="middle" fontSize="10" className="fill-foreground">파일 접근 불가</text>
                </Reveal>
              ) : stopped ? (
                <Reveal key="stopped" moving={moving} delay={1.05}><CirclePause x="-16" y="20" width="32" height="32" /></Reveal>
              ) : infected ? (
                <Reveal key="infected" moving={moving && frame === "spread"} delay={0.95}><Bug x="-14" y="22" width="28" height="28" /></Reveal>
              ) : (
                <TriangleAlert x="-14" y="22" width="28" height="28" />
              )}
            </Monitor>
          ))}
          {actor("peer", "다른 PC C", frame === "encrypt" ? "전파 시도 수신" : "후속 전파 대상", frame === "encrypt" ? "warning" : "neutral",
            <Monitor compact={compact}>{frame === "encrypt" && <TriangleAlert x="-13" y="23" width="26" height="26" />}</Monitor>)}
          {actor("files", "PC B의 파일", locked ? "암호화로 열 수 없음" : "열 수 있는 문서", locked ? "danger" : "neutral", (
            <>
              <path d="M -67 25 H -26 L -16 36 H 67 V 90 H -67 Z" className="fill-muted" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
              {[-40, 0, 40].map((x, index) => (
                <g key={x} transform={`translate(${x} 53)`}>
                  {lockStage && (
                    <motion.g initial={{ opacity: 1 }} animate={{ opacity: 0 }} transition={{ duration: 0.2, delay: 0.3 + index * 0.24 }}>
                      <FileShape />
                    </motion.g>
                  )}
                  <Reveal key={frame} moving={lockStage} delay={0.3 + index * 0.24}><FileShape locked={locked} /></Reveal>
                </g>
              ))}
            </>
          ))}
          {actor("switch", "킬 스위치", stopped ? "등록 도메인이 응답" : "도메인 확인", stopped ? "safe" : "neutral", (
            <>
              <Globe2 x="-30" y="9" width="60" height="60" strokeWidth="1.35" />
              {stopped && <Check x="25" y="51" width="22" height="22" strokeWidth="3" />}
              <path d="M -48 84 H 48" stroke="currentColor" strokeWidth="1.25" strokeDasharray="3 4" />
            </>
          ))}
        </>
      ) : (
        <>
          {actor("host", "감염 PC", hostState, "danger", <Monitor compact={compact}><Bug x="-14" y="22" width="28" height="28" /></Monitor>)}
          {actor("network", "운영망", reconnected ? "서비스 재개 · 감시" : isolated ? "감염 PC 차단" : "업무 네트워크", isolated ? "safe" : "neutral", (
            <>
              <path d="M 0 37 V 48 M -42 65 V 48 H 42 V 65 M 0 48 V 65" fill="none" stroke="currentColor" strokeWidth="1.5" />
              <rect x="-37" y="8" width="74" height="29" rx="6" className="fill-card" stroke="currentColor" strokeWidth="1.7" />
              {reconnected ? <Activity x="-26" y="11" width="52" height="23" /> : <path d="M -23 22 H -12 M -4 22 H 7 M 15 22 H 24" stroke="currentColor" strokeWidth="2" />}
              {[-42, 0, 42].map(x => <rect key={x} x={x - 13} y="65" width="26" height="18" rx="3" className="fill-card" stroke="currentColor" strokeWidth="1.5" />)}
            </>
          ))}
          {actor("evidence", "증거 보관함", collected ? "로그·파일 사본 보존" : "수집 준비", collected ? "warning" : "neutral", (
            <>
              <path d="M -61 36 H 61 L 51 91 H -51 Z" className="fill-muted" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
              {collected && [-23, 22].map((x, i) => (
                <g key={x} transform={`translate(${x} 45)`}>
                  <Reveal moving={moving && frame === "collect"} delay={0.75 + i * 0.22}><FileShape locked={i === 1} /></Reveal>
                </g>
              ))}
              <path d="M -57 73 H 57 M -13 84 H 13" stroke="currentColor" strokeWidth="1.6" />
            </>
          ))}
          {actor("clean", "복구 환경", cleanState, rebuilt ? "safe" : "neutral", (
            <Monitor compact={compact}>
              {rebuilt && (
                <Reveal key={frame} moving={moving} delay={frame === "restore" ? 0.9 : 0.28}>
                  {restored ? (
                    <>
                      <g transform="translate(-19 38) scale(0.64)"><FileShape /></g>
                      <Check x="9" y="25" width="25" height="25" strokeWidth="2.5" />
                    </>
                  ) : (
                    <>
                      <text x="0" y="32" textAnchor="middle" fontSize="12" fontWeight="700" className="fill-current">OS 재설치</text>
                      <Reveal moving={moving} delay={0.64}>
                        <Check x="-34" y="43" width="13" height="13" />
                        <text x="-17" y="54" fontSize="12" className="fill-current">패치 적용</text>
                      </Reveal>
                    </>
                  )}
                </Reveal>
              )}
            </Monitor>
          ))}
          {actor("backup", "정상 백업", restored ? "무결성 검사 통과" : "격리된 저장소", restored ? "safe" : "neutral", (
            <>
              <path d="M -54 23 V 68 C -54 91 54 91 54 68 V 23" className="fill-card" stroke="currentColor" strokeWidth="1.7" />
              <ellipse cy="23" rx="54" ry="15" className="fill-muted" stroke="currentColor" strokeWidth="1.7" />
              <path d="M -54 46 C -54 68 54 68 54 46" fill="none" stroke="currentColor" strokeWidth="1.7" />
              {restored && <ShieldCheck x="48" y="53" width="26" height="26" className="fill-card" />}
            </>
          ))}
        </>
      )}
    </svg>
  );
}
