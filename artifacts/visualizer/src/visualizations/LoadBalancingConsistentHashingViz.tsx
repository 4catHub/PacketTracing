import { motion, useReducedMotion } from "framer-motion";
import {
  CircleDot,
  Gauge,
  Network,
  Pause,
  Play,
  Repeat2,
  RotateCcw,
} from "lucide-react";
import { useEffect, useState } from "react";

type Scene = "scheduling" | "hash-ring";
type ServerId = "A" | "B" | "C" | "D";
type SchedulingPolicy = "round-robin" | "least-connections";

interface ServerToken {
  id: ServerId;
  angle: number;
  color: string;
  textClass: string;
  borderClass: string;
  surfaceClass: string;
  chipClass: string;
}

const SERVER_TOKENS: Record<ServerId, ServerToken> = {
  A: {
    id: "A",
    angle: 30,
    color: "#0284c7",
    textClass: "text-sky-700 dark:text-sky-300",
    borderClass: "border-sky-500/40",
    surfaceClass: "bg-sky-500/5",
    chipClass: "border-sky-500/30 bg-sky-500/10 text-sky-700 dark:text-sky-300",
  },
  B: {
    id: "B",
    angle: 150,
    color: "#059669",
    textClass: "text-emerald-700 dark:text-emerald-300",
    borderClass: "border-emerald-500/40",
    surfaceClass: "bg-emerald-500/5",
    chipClass:
      "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  },
  C: {
    id: "C",
    angle: 270,
    color: "#7c3aed",
    textClass: "text-violet-700 dark:text-violet-300",
    borderClass: "border-violet-500/40",
    surfaceClass: "bg-violet-500/5",
    chipClass:
      "border-violet-500/30 bg-violet-500/10 text-violet-700 dark:text-violet-300",
  },
  D: {
    id: "D",
    angle: 215,
    color: "#d97706",
    textClass: "text-amber-700 dark:text-amber-300",
    borderClass: "border-amber-500/40",
    surfaceClass: "bg-amber-500/5",
    chipClass: "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300",
  },
};

const BASE_SERVERS = [SERVER_TOKENS.A, SERVER_TOKENS.B, SERVER_TOKENS.C];
const EXPANDED_SERVERS = [
  SERVER_TOKENS.A,
  SERVER_TOKENS.B,
  SERVER_TOKENS.D,
  SERVER_TOKENS.C,
];

const INITIAL_CONNECTIONS = [4, 1, 2];
const ROUND_ROBIN_ASSIGNMENTS = [0, 1, 2, 0];
const LEAST_CONNECTION_ASSIGNMENTS = [1, 1, 2, 1];

const CONNECTIONS = [
  { id: "C1", payload: "WS /live/alpha" },
  { id: "C2", payload: "WS /live/beta" },
  { id: "C3", payload: "WS /live/gamma" },
  { id: "C4", payload: "WS /live/delta" },
];

const HASH_KEYS = [
  { id: "K1", angle: 10 },
  { id: "K2", angle: 90 },
  { id: "K3", angle: 174 },
  { id: "K4", angle: 201 },
  { id: "K5", angle: 242 },
  { id: "K6", angle: 315 },
];

const HASH_BEATS = [
  {
    eyebrow: "RING V1",
    title: "세 서버가 키 공간을 나누어 소유",
    description: "키 위치에서 시계 방향으로 처음 만나는 서버가 현재 소유자입니다.",
  },
  {
    eyebrow: "MEMBERSHIP CHANGE",
    title: "Server D가 215°에 JOINING",
    description:
      "새 소유 구간만 표시하고, 데이터 복사가 끝날 때까지 Ring v1이 요청을 처리합니다.",
  },
  {
    eyebrow: "RING V2",
    title: "K3·K4만 C에서 D로 재분배",
    description: "대상 구간의 복사가 완료되어 소유권을 전환하고 나머지 키는 그대로 둡니다.",
  },
];

function getConnectionCounts(assignments: number[], step: number) {
  const counts = [...INITIAL_CONNECTIONS];
  assignments.slice(0, step).forEach((serverIndex) => {
    counts[serverIndex] += 1;
  });
  return counts;
}

function polarPoint(angle: number, radius: number) {
  const radians = ((angle - 90) * Math.PI) / 180;
  return {
    x: 210 + radius * Math.cos(radians),
    y: 210 + radius * Math.sin(radians),
  };
}

function describeArc(startAngle: number, endAngle: number, radius: number) {
  const normalizedEnd = endAngle <= startAngle ? endAngle + 360 : endAngle;
  const start = polarPoint(startAngle, radius);
  const end = polarPoint(normalizedEnd, radius);
  const largeArcFlag = normalizedEnd - startAngle > 180 ? 1 : 0;
  return `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${end.x} ${end.y}`;
}

function getOwner(angle: number, servers: ServerToken[]) {
  const sorted = [...servers].sort((left, right) => left.angle - right.angle);
  return sorted.find((server) => server.angle >= angle) ?? sorted[0];
}

function RoutingLane({
  policy,
  step,
  reduceMotion,
}: {
  policy: SchedulingPolicy;
  step: number;
  reduceMotion: boolean;
}) {
  const isRoundRobin = policy === "round-robin";
  const assignments = isRoundRobin
    ? ROUND_ROBIN_ASSIGNMENTS
    : LEAST_CONNECTION_ASSIGNMENTS;
  const counts = getConnectionCounts(assignments, step);
  const selectedIndex = step > 0 ? assignments[step - 1] : null;
  const selectedX = selectedIndex === null ? 180 : [58, 180, 302][selectedIndex];
  const policyColor = isRoundRobin ? "#2563eb" : "#059669";
  const markerId = isRoundRobin ? "rr-arrow" : "lc-arrow";
  const title = isRoundRobin ? "Round Robin" : "Least Connections";
  const formula = isRoundRobin
    ? "next = (pointer + 1) % 3"
    : "target = argmin(active_connections)";
  const selectedServerId = ["A", "B", "C"][selectedIndex ?? 0] as ServerId;
  const decision =
    step === 0
      ? isRoundRobin
        ? "pointer = A"
        : "min = B · 1 active"
      : `picked = ${selectedServerId}`;

  return (
    <section className="overflow-hidden rounded-xl border border-border/70 bg-card">
      <div className="flex items-start justify-between gap-3 border-b border-border/60 px-3.5 py-3">
        <div>
          <div className="flex items-center gap-2">
            {isRoundRobin ? (
              <Network
                size={15}
                className="text-blue-600 dark:text-blue-400"
                aria-hidden="true"
              />
            ) : (
              <Gauge
                size={15}
                className="text-emerald-600 dark:text-emerald-400"
                aria-hidden="true"
              />
            )}
            <h4 className="text-xs font-bold text-foreground sm:text-sm">{title}</h4>
          </div>
          <code className="mt-1 block text-[9px] text-muted-foreground sm:text-[10px]">
            {formula}
          </code>
        </div>
        <span
          className={`shrink-0 rounded-full border px-2 py-1 font-mono text-[9px] font-semibold ${
            isRoundRobin
              ? "border-blue-500/25 bg-blue-500/10 text-blue-700 dark:text-blue-300"
              : "border-emerald-500/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
          }`}
        >
          {decision}
        </span>
      </div>

      <div className="overflow-x-auto">
        <svg
          viewBox="0 0 360 232"
          className="mx-auto h-auto min-w-[330px] max-w-[430px] select-none"
          role="img"
          aria-label={`${title} 정책의 로드 밸런서와 서버 A, B, C 연결 상태`}
        >
          <defs>
            <marker
              id={markerId}
              viewBox="0 0 10 10"
              refX="8"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 0 L 10 5 L 0 10 z" fill={policyColor} />
            </marker>
          </defs>

          {[58, 180, 302].map((x, index) => (
            <line
              key={`base-edge-${index}`}
              x1="180"
              y1="82"
              x2={x}
              y2="147"
              className="stroke-border"
              strokeWidth="2"
            />
          ))}

          {selectedIndex !== null && (
            <motion.line
              key={`${policy}-edge-${step}`}
              x1="180"
              y1="82"
              x2={selectedX}
              y2="147"
              stroke={policyColor}
              strokeWidth="3"
              markerEnd={`url(#${markerId})`}
              initial={reduceMotion ? false : { pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: reduceMotion ? 0 : 0.35 }}
            />
          )}

          <rect
            x="105"
            y="20"
            width="150"
            height="62"
            rx="12"
            className="fill-muted/60 stroke-border"
            strokeWidth="1.5"
          />
          <text
            x="180"
            y="43"
            textAnchor="middle"
            className="fill-foreground text-[12px] font-bold"
          >
            Load Balancer
          </text>
          <text
            x="180"
            y="62"
            textAnchor="middle"
            className="fill-muted-foreground text-[10px] font-mono"
          >
            {isRoundRobin ? "read pointer" : "read counters"}
          </text>

          {selectedIndex !== null && (
            <motion.g
              key={`${policy}-packet-${step}`}
              initial={reduceMotion ? false : { x: 0, y: 0, opacity: 0 }}
              animate={{ x: selectedX - 180, y: 45, opacity: 1 }}
              transition={{ duration: reduceMotion ? 0 : 0.45, ease: "easeOut" }}
            >
              <circle cx="180" cy="98" r="13" fill={policyColor} />
              <text
                x="180"
                y="98.5"
                textAnchor="middle"
                dominantBaseline="middle"
                className="fill-white text-[8px] font-bold"
              >
                {CONNECTIONS[step - 1].id}
              </text>
            </motion.g>
          )}

          {BASE_SERVERS.map((server, index) => {
            const x = [7, 129, 251][index];
            const selected = selectedIndex === index;
            const received = assignments
              .slice(0, step)
              .filter((assignment) => assignment === index).length;
            return (
              <g key={server.id}>
                <rect
                  x={x}
                  y="150"
                  width="102"
                  height="67"
                  rx="10"
                  className="fill-card"
                  stroke={selected ? policyColor : "hsl(var(--border))"}
                  strokeWidth={selected ? "3" : "1.5"}
                />
                <text x={x + 12} y="174" className="fill-foreground text-[11px] font-bold">
                  Server {server.id}
                </text>
                {selected && (
                  <text
                    x={x + 90}
                    y="174"
                    textAnchor="end"
                    fill={policyColor}
                    className="text-[8px] font-bold"
                  >
                    선택
                  </text>
                )}
                <text x={x + 12} y="197" className="fill-muted-foreground text-[9px]">
                  active
                </text>
                <text
                  x={x + 90}
                  y="198"
                  textAnchor="end"
                  fill={server.color}
                  className="text-[16px] font-black"
                >
                  {counts[index]}
                </text>
                <text
                  x={x + 12}
                  y="211"
                  className="fill-muted-foreground text-[7px] font-mono"
                >
                  base {INITIAL_CONNECTIONS[index]} · +{received}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </section>
  );
}

function SchedulingScene({ step, reduceMotion }: { step: number; reduceMotion: boolean }) {
  const currentConnection = step > 0 ? CONNECTIONS[step - 1] : null;
  const rrCounts = getConnectionCounts(ROUND_ROBIN_ASSIGNMENTS, step);
  const lcCounts = getConnectionCounts(LEAST_CONNECTION_ASSIGNMENTS, step);
  const rrSelected = step > 0 ? ROUND_ROBIN_ASSIGNMENTS[step - 1] : null;
  const lcSelected = step > 0 ? LEAST_CONNECTION_ASSIGNMENTS[step - 1] : null;
  const rrSpread = Math.max(...rrCounts) - Math.min(...rrCounts);
  const lcSpread = Math.max(...lcCounts) - Math.min(...lcCounts);

  return (
    <div className="space-y-4">
      <div className="flex flex-col justify-between gap-2 rounded-xl border border-border/70 bg-muted/25 px-3.5 py-3 sm:flex-row sm:items-center">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            Shared input
          </p>
          <p className="mt-1 text-xs font-semibold text-foreground sm:text-sm">
            {currentConnection
              ? `${currentConnection.id} · ${currentConnection.payload}`
              : "초기 활성 연결 · A 4 / B 1 / C 2"}
          </p>
        </div>
        <span className="w-fit rounded-full border border-border bg-card px-2.5 py-1 font-mono text-[10px] text-muted-foreground">
          {currentConnection ? "new connection" : "same baseline"}
        </span>
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        <RoutingLane policy="round-robin" step={step} reduceMotion={reduceMotion} />
        <RoutingLane policy="least-connections" step={step} reduceMotion={reduceMotion} />
      </div>

      <motion.div
        key={`scheduling-outcome-${step}`}
        initial={reduceMotion ? false : { opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-xl border border-border/70 bg-card px-3.5 py-3 text-xs leading-relaxed text-muted-foreground"
        aria-live="polite"
      >
        {step === 0 ? (
          <>
            두 정책 모두 같은 서버 상태에서 시작합니다. Round Robin은 포인터만 읽고,
            Least Connections는 활성 연결 카운터를 읽습니다.
          </>
        ) : (
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="font-mono font-bold text-foreground">{currentConnection?.id}</span>
            <span>
              RR →{" "}
              <strong className="text-blue-700 dark:text-blue-300">
                Server {["A", "B", "C"][rrSelected ?? 0]}
              </strong>
            </span>
            <span aria-hidden="true">·</span>
            <span>
              LC →{" "}
              <strong className="text-emerald-700 dark:text-emerald-300">
                Server {["A", "B", "C"][lcSelected ?? 0]}
              </strong>
            </span>
            {step === CONNECTIONS.length && (
              <span className="ml-auto font-mono text-[10px]">
                spread RR {rrSpread} / LC {lcSpread}
              </span>
            )}
          </div>
        )}
      </motion.div>
    </div>
  );
}

function HashRing({ step, reduceMotion }: { step: number; reduceMotion: boolean }) {
  const activeServers = step === 2 ? EXPANDED_SERVERS : BASE_SERVERS;
  const visibleServers = step === 0 ? BASE_SERVERS : EXPANDED_SERVERS;
  const ownershipArcs =
    step === 2
      ? [
          { start: 270, end: 30, server: SERVER_TOKENS.A },
          { start: 30, end: 150, server: SERVER_TOKENS.B },
          { start: 150, end: 215, server: SERVER_TOKENS.D },
          { start: 215, end: 270, server: SERVER_TOKENS.C },
        ]
      : [
          { start: 270, end: 30, server: SERVER_TOKENS.A },
          { start: 30, end: 150, server: SERVER_TOKENS.B },
          { start: 150, end: 270, server: SERVER_TOKENS.C },
        ];
  const keyStates = HASH_KEYS.map((key) => {
    const oldOwner = getOwner(key.angle, BASE_SERVERS);
    const newOwner = getOwner(key.angle, EXPANDED_SERVERS);
    return {
      ...key,
      oldOwner,
      newOwner,
      currentOwner: getOwner(key.angle, activeServers),
      moved: oldOwner.id !== newOwner.id,
    };
  });
  const migrationStart = polarPoint(SERVER_TOKENS.C.angle, 162);
  const migrationEnd = polarPoint(SERVER_TOKENS.D.angle, 162);
  const migrationDistance = Math.hypot(
    migrationEnd.x - migrationStart.x,
    migrationEnd.y - migrationStart.y,
  );
  const migrationArrowEnd = {
    x:
      migrationEnd.x -
      ((migrationEnd.x - migrationStart.x) / migrationDistance) * 29,
    y:
      migrationEnd.y -
      ((migrationEnd.y - migrationStart.y) / migrationDistance) * 29,
  };

  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-xl border border-border/70 bg-muted/20 p-2 sm:p-4">
        <svg
          viewBox="0 0 420 420"
          className="mx-auto h-auto w-full max-w-[560px] select-none"
          role="img"
          aria-label="Consistent Hashing 링에서 Server D 추가 전후의 키 소유권"
        >
          <defs>
            <marker
              id="migration-arrow"
              viewBox="0 0 10 10"
              refX="8"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 0 L 10 5 L 0 10 z" fill={SERVER_TOKENS.D.color} />
            </marker>
          </defs>

          <circle
            cx="210"
            cy="210"
            r="125"
            fill="none"
            className="stroke-border"
            strokeWidth="13"
          />
          {ownershipArcs.map((arc) => (
            <motion.path
              key={`${step}-${arc.server.id}-${arc.start}`}
              d={describeArc(arc.start, arc.end, 125)}
              fill="none"
              stroke={arc.server.color}
              strokeWidth="10"
              strokeLinecap="round"
              initial={reduceMotion ? false : { pathLength: 0.55, opacity: 0.55 }}
              animate={{ pathLength: 1, opacity: 0.9 }}
              transition={{ duration: reduceMotion ? 0 : 0.4 }}
            />
          ))}

          {step === 1 && (
            <motion.path
              d={describeArc(150, 215, 125)}
              fill="none"
              stroke={SERVER_TOKENS.D.color}
              strokeWidth="16"
              strokeDasharray="5 7"
              strokeLinecap="round"
              initial={reduceMotion ? false : { opacity: 0 }}
              animate={{ opacity: 0.95 }}
            />
          )}

          <circle
            cx="210"
            cy="210"
            r="82"
            className="fill-card stroke-border"
            strokeWidth="1.5"
          />
          <text
            x="210"
            y="190"
            textAnchor="middle"
            className="fill-muted-foreground text-[10px] font-bold tracking-[0.16em]"
          >
            {step === 0 ? "RING V1" : step === 1 ? "D JOINING" : "RING V2"}
          </text>
          <text
            x="210"
            y="214"
            textAnchor="middle"
            className="fill-foreground text-[12px] font-bold"
          >
            ↻ 시계 방향 탐색
          </text>
          <text
            x="210"
            y="237"
            textAnchor="middle"
            className="fill-muted-foreground text-[10px] font-mono"
          >
            {step === 0
              ? "3 servers · 6 keys"
              : step === 1
                ? "copy range only"
                : "2 moved · 4 unchanged"}
          </text>

          {keyStates.map((key) => {
            const point = polarPoint(key.angle, 125);
            const affected = step === 1 && key.moved;
            return (
              <g key={key.id}>
                {affected && (
                  <circle
                    cx={point.x}
                    cy={point.y}
                    r="16"
                    fill="none"
                    stroke={SERVER_TOKENS.D.color}
                    strokeWidth="2"
                    strokeDasharray="3 3"
                  />
                )}
                <motion.circle
                  cx={point.x}
                  cy={point.y}
                  r="11"
                  stroke="hsl(var(--card))"
                  strokeWidth="2.5"
                  animate={{ fill: key.currentOwner.color }}
                  transition={{ duration: reduceMotion ? 0 : 0.3 }}
                />
                <text
                  x={point.x}
                  y={point.y + 0.5}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className="pointer-events-none fill-white text-[8px] font-black"
                >
                  {key.id}
                </text>
              </g>
            );
          })}

          {step === 2 && (
            <g>
              <line
                x1={migrationStart.x}
                y1={migrationStart.y}
                x2={migrationArrowEnd.x}
                y2={migrationArrowEnd.y}
                stroke={SERVER_TOKENS.D.color}
                strokeWidth="3"
                strokeDasharray="6 4"
                markerEnd="url(#migration-arrow)"
              />
              {[0, 1].map((index) => (
                <motion.circle
                  key={`migration-packet-${index}`}
                  r="5"
                  fill={SERVER_TOKENS.D.color}
                  initial={
                    reduceMotion
                      ? false
                      : { cx: migrationStart.x, cy: migrationStart.y }
                  }
                  animate={{ cx: migrationArrowEnd.x, cy: migrationArrowEnd.y }}
                  transition={{
                    duration: reduceMotion ? 0 : 0.75,
                    delay: reduceMotion ? 0 : index * 0.14,
                    ease: "easeOut",
                  }}
                />
              ))}
              <text
                x={(migrationStart.x + migrationArrowEnd.x) / 2 - 4}
                y={(migrationStart.y + migrationArrowEnd.y) / 2 - 10}
                textAnchor="middle"
                fill={SERVER_TOKENS.D.color}
                className="text-[9px] font-bold"
              >
                C → D · K3/K4
              </text>
            </g>
          )}

          {visibleServers.map((server) => {
            const point = polarPoint(server.angle, 162);
            const joining = server.id === "D" && step === 1;
            return (
              <motion.g
                key={server.id}
                initial={
                  server.id === "D" && !reduceMotion
                    ? { opacity: 0, scale: 0.7 }
                    : false
                }
                animate={{ opacity: 1, scale: 1 }}
                style={{ transformOrigin: `${point.x}px ${point.y}px` }}
              >
                <circle
                  cx={point.x}
                  cy={point.y}
                  r="25"
                  className="fill-card"
                  stroke={server.color}
                  strokeWidth="3"
                  strokeDasharray={joining ? "5 4" : undefined}
                />
                <text
                  x={point.x}
                  y={point.y - 4}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill={server.color}
                  className="text-[14px] font-black"
                >
                  {server.id}
                </text>
                <text
                  x={point.x}
                  y={point.y + 11}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className="fill-muted-foreground text-[8px] font-mono"
                >
                  {joining ? "JOIN" : `${server.angle}°`}
                </text>
              </motion.g>
            );
          })}
        </svg>
      </div>

      <OwnershipBuckets step={step} keyStates={keyStates} />
    </div>
  );
}

function OwnershipBuckets({
  step,
  keyStates,
}: {
  step: number;
  keyStates: Array<{
    id: string;
    angle: number;
    oldOwner: ServerToken;
    newOwner: ServerToken;
    currentOwner: ServerToken;
    moved: boolean;
  }>;
}) {
  const visibleServerIds: ServerId[] =
    step === 0 ? ["A", "B", "C"] : ["A", "B", "C", "D"];

  return (
    <section className="space-y-2" aria-label="서버별 키 소유권">
      <div className="flex items-center justify-between gap-3">
        <h4 className="text-xs font-semibold text-foreground">소유권 상태</h4>
        <span className="font-mono text-[10px] text-muted-foreground">
          {step === 0
            ? "ring_version=1"
            : step === 1
              ? "D.status=JOINING"
              : "ring_version=2"}
        </span>
      </div>
      <div
        className={`grid gap-2 ${
          step === 0 ? "grid-cols-3" : "grid-cols-2 sm:grid-cols-4"
        }`}
      >
        {visibleServerIds.map((serverId) => {
          const server = SERVER_TOKENS[serverId];
          const ownedKeys = keyStates.filter((key) => key.currentOwner.id === serverId);
          const joining = serverId === "D" && step === 1;
          return (
            <div
              key={serverId}
              className={`min-w-0 rounded-lg border px-2.5 py-2.5 ${server.borderClass} ${server.surfaceClass}`}
            >
              <div className="flex items-center justify-between gap-1">
                <span className={`text-[11px] font-bold ${server.textClass}`}>
                  Server {serverId}
                </span>
                <span className="text-[8px] font-semibold text-muted-foreground">
                  {joining ? "JOINING" : `${ownedKeys.length} keys`}
                </span>
              </div>
              <div className="mt-2 flex min-h-6 flex-wrap gap-1">
                {ownedKeys.map((key) => {
                  const affected = step === 1 && key.moved;
                  return (
                    <span
                      key={key.id}
                      className={`rounded border px-1.5 py-0.5 font-mono text-[9px] ${
                        affected ? SERVER_TOKENS.D.chipClass : server.chipClass
                      } ${affected ? "border-dashed" : ""}`}
                    >
                      {key.id}
                      {affected ? " → D" : ""}
                    </span>
                  );
                })}
                {joining && <span className="text-[9px] text-muted-foreground">복사 대기</span>}
              </div>
            </div>
          );
        })}
      </div>
      <p className="rounded-lg border border-border/60 bg-card px-3 py-2.5 text-[11px] leading-relaxed text-muted-foreground">
        {step === 0
          ? "키의 해시 좌표는 고정되어 있고 시계 방향의 첫 서버가 소유합니다."
          : step === 1
            ? "영향 범위는 150° < h(key) ≤ 215°입니다. K3·K4는 아직 C가 제공하며 D로 복사될 예정입니다."
            : "K3·K4의 소유권만 D로 전환되었습니다. K1·K2·K5·K6은 위치와 소유자가 모두 유지됩니다."}
      </p>
    </section>
  );
}

export default function LoadBalancingConsistentHashingViz() {
  const [scene, setScene] = useState<Scene>("scheduling");
  const [step, setStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const prefersReducedMotion = useReducedMotion();
  const reduceMotion = Boolean(prefersReducedMotion);
  const maxStep =
    scene === "scheduling" ? CONNECTIONS.length : HASH_BEATS.length - 1;
  const autoplayDelay = scene === "scheduling" ? 2200 : 2800;

  useEffect(() => {
    if (reduceMotion) {
      setIsPlaying(false);
    }
  }, [reduceMotion]);

  useEffect(() => {
    if (!isPlaying) return;

    const timer = window.setTimeout(() => {
      setStep((current) => (current === maxStep ? 0 : current + 1));
    }, autoplayDelay);

    return () => window.clearTimeout(timer);
  }, [autoplayDelay, isPlaying, maxStep, scene, step]);

  const changeScene = (nextScene: Scene) => {
    setScene(nextScene);
    setStep(0);
    setIsPlaying(!reduceMotion);
  };

  const resetPlayback = () => {
    setStep(0);
    setIsPlaying(false);
  };

  const togglePlayback = () => {
    setIsPlaying((playing) => !playing);
  };

  const schedulingCopy =
    step === 0
      ? {
          eyebrow: "SAME BASELINE",
          title: "같은 클러스터, 다른 선택 기준",
          description: "초기 활성 연결 A 4, B 1, C 2에서 두 정책을 동시에 비교합니다.",
        }
      : {
          eyebrow: `CONNECTION ${step} / ${CONNECTIONS.length}`,
          title: `${CONNECTIONS[step - 1].id}을 두 정책에 동시에 입력`,
          description: "선택 경로와 갱신된 활성 연결 수를 좌우 패널에서 비교합니다.",
        };
  const activeCopy = scene === "scheduling" ? schedulingCopy : HASH_BEATS[step];

  return (
    <div className="w-full space-y-5">
      <div
        className="grid grid-cols-2 gap-1 rounded-xl border border-border/70 bg-muted/40 p-1"
        role="tablist"
        aria-label="시각화 장면 선택"
      >
        <button
          type="button"
          role="tab"
          aria-selected={scene === "scheduling"}
          onClick={() => changeScene("scheduling")}
          className={`flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-[11px] font-semibold transition-colors sm:text-xs ${
            scene === "scheduling"
              ? "bg-card text-foreground shadow-sm ring-1 ring-border"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Network
            size={14}
            className={scene === "scheduling" ? "text-primary" : ""}
            aria-hidden="true"
          />
          요청 분산 비교
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={scene === "hash-ring"}
          onClick={() => changeScene("hash-ring")}
          className={`flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-[11px] font-semibold transition-colors sm:text-xs ${
            scene === "hash-ring"
              ? "bg-card text-foreground shadow-sm ring-1 ring-border"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <CircleDot
            size={14}
            className={scene === "hash-ring" ? "text-primary" : ""}
            aria-hidden="true"
          />
          해시 링 재분배
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-border/70 bg-muted/30 p-1.5">
        <button
          type="button"
          onClick={resetPlayback}
          className="rounded-md border border-border/80 bg-card p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          aria-label="처음 단계로 초기화"
          title="초기화"
        >
          <RotateCcw size={14} aria-hidden="true" />
        </button>
        <button
          type="button"
          onClick={togglePlayback}
          className="rounded-md bg-primary p-1.5 text-primary-foreground transition-opacity hover:opacity-90"
          aria-label={isPlaying ? "일시정지" : "재생"}
          title={isPlaying ? "일시정지" : "재생"}
        >
          {isPlaying ? <Pause size={14} aria-hidden="true" /> : <Play size={14} aria-hidden="true" />}
        </button>
        <span className="ml-1 inline-flex items-center gap-1 text-[10px] font-semibold text-muted-foreground">
          <Repeat2 size={12} aria-hidden="true" />
          자동 반복
        </span>
        <div className="ml-auto flex min-w-[132px] items-center gap-2">
          <span className="whitespace-nowrap font-mono text-[10px] font-semibold text-muted-foreground">
            {step + 1} / {maxStep + 1}
          </span>
          <div className="flex flex-1 items-center gap-1" aria-label={`진행 단계 ${step + 1}/${maxStep + 1}`}>
            {Array.from({ length: maxStep + 1 }, (_, index) => (
              <span
                key={index}
                className={`h-1.5 rounded-full transition-all ${
                  index === step
                    ? "w-4 bg-primary"
                    : "w-1.5 bg-muted-foreground/25"
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
        <div aria-live="polite">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-primary">
            {activeCopy.eyebrow}
          </p>
          <h3 className="mt-1 text-sm font-bold text-foreground sm:text-base">
            {activeCopy.title}
          </h3>
          <p className="mt-1 max-w-3xl text-xs leading-relaxed text-muted-foreground">
            {activeCopy.description}
          </p>
        </div>
      </div>

      {scene === "scheduling" ? (
        <SchedulingScene step={step} reduceMotion={reduceMotion} />
      ) : (
        <HashRing step={step} reduceMotion={reduceMotion} />
      )}

    </div>
  );
}
