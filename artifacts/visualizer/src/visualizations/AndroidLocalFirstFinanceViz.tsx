import { useEffect, useMemo, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import {
  Database,
  KeyRound,
  Pause,
  Play,
  RefreshCw,
  RotateCcw,
  Server,
  ShieldCheck,
  Smartphone,
} from "lucide-react";

type NodeId =
  | "ui"
  | "repository"
  | "datastore"
  | "keystore"
  | "room"
  | "bff"
  | "finance";

type FlowStep = {
  title: string;
  summary: string;
  activeNodes: NodeId[];
  from: { x: number; y: number };
  to: { x: number; y: number };
  payload: string;
  network: boolean;
  roomCount: number;
  lastSyncedAt: string;
  analysisStage: 0 | 1 | 2 | 3 | 4;
};

const STEPS: FlowStep[] = [
  {
    title: "앱 실행 · 로컬 우선 읽기",
    summary:
      "Compose는 네트워크를 기다리지 않고 Room의 계좌·거래·구독 상태를 즉시 표시합니다.",
    activeNodes: ["room", "repository", "ui"],
    from: { x: 468, y: 310 },
    to: { x: 150, y: 92 },
    payload: "Local snapshot",
    network: false,
    roomCount: 1200,
    lastSyncedAt: "2026-09-21 13:00",
    analysisStage: 4,
  },
  {
    title: "사용자가 수동 동기화 요청",
    summary:
      "새로고침을 눌렀을 때만 Repository가 DataStore의 lastSyncedAt을 읽어 증분 조회 범위를 계산합니다.",
    activeNodes: ["ui", "repository", "datastore"],
    from: { x: 150, y: 92 },
    to: { x: 112, y: 310 },
    payload: "since = lastSyncedAt",
    network: false,
    roomCount: 1200,
    lastSyncedAt: "2026-09-21 13:00",
    analysisStage: 4,
  },
  {
    title: "인증 재료 준비",
    summary:
      "민감한 인증 재료는 Room 평문 컬럼이 아니라 Keystore가 보호하는 키를 이용해 복호화·사용합니다.",
    activeNodes: ["repository", "keystore"],
    from: { x: 270, y: 155 },
    to: { x: 268, y: 310 },
    payload: "Protected auth material",
    network: false,
    roomCount: 1200,
    lastSyncedAt: "2026-09-21 13:00",
    analysisStage: 4,
  },
  {
    title: "Stateless BFF 호출",
    summary:
      "Android는 동기화 범위와 사용자 승인 토큰만 전달합니다. BFF는 거래를 영구 저장하지 않는 보안 경계입니다.",
    activeNodes: ["repository", "bff"],
    from: { x: 300, y: 155 },
    to: { x: 720, y: 155 },
    payload: "GET /transactions?since=...",
    network: true,
    roomCount: 1200,
    lastSyncedAt: "2026-09-21 13:00",
    analysisStage: 4,
  },
  {
    title: "금융 API 증분 조회",
    summary:
      "BFF가 서버 측 client_secret 등 앱에 포함하면 안 되는 비밀을 사용해 마지막 동기화 이후 거래만 조회합니다.",
    activeNodes: ["bff", "finance"],
    from: { x: 720, y: 155 },
    to: { x: 840, y: 310 },
    payload: "New transactions × 18",
    network: true,
    roomCount: 1200,
    lastSyncedAt: "2026-09-21 13:00",
    analysisStage: 4,
  },
  {
    title: "원본 거래를 Room에 추가",
    summary:
      "응답 거래는 먼저 FinancialTransaction 원본으로 저장합니다. 서버가 아니라 로컬 DB가 장기 보관 책임을 가집니다.",
    activeNodes: ["bff", "repository", "room"],
    from: { x: 720, y: 155 },
    to: { x: 468, y: 310 },
    payload: "+18 FinancialTransaction",
    network: true,
    roomCount: 1218,
    lastSyncedAt: "2026-09-21 13:00",
    analysisStage: 1,
  },
  {
    title: "정규화 · 구독 탐지 · 사용자 확정",
    summary:
      "Raw 거래를 정규화하고 SubscriptionCandidate를 계산한 뒤, 사용자 확인 결과만 최종 Subscription으로 관리합니다.",
    activeNodes: ["room", "repository"],
    from: { x: 468, y: 310 },
    to: { x: 468, y: 420 },
    payload: "Re-run analysis",
    network: false,
    roomCount: 1218,
    lastSyncedAt: "2026-09-21 13:00",
    analysisStage: 4,
  },
  {
    title: "동기화 완료 · 다시 로컬 상태 제공",
    summary:
      "모든 저장과 분석이 성공한 뒤 lastSyncedAt을 갱신합니다. 이후 앱 실행은 다시 Room만 읽어도 됩니다.",
    activeNodes: ["datastore", "room", "repository", "ui"],
    from: { x: 112, y: 310 },
    to: { x: 150, y: 92 },
    payload: "Updated local state",
    network: false,
    roomCount: 1218,
    lastSyncedAt: "2026-09-22 09:30",
    analysisStage: 4,
  },
];

const ANALYSIS = [
  "FinancialTransaction",
  "MerchantTransaction",
  "SubscriptionCandidate",
  "사용자 확인",
  "Subscription",
];

const nodeStyles: Record<NodeId, { label: string; subtitle: string; x: number; y: number; w: number; h: number }> = {
  ui: {
    label: "Compose UI",
    subtitle: "화면은 Room 상태를 관찰",
    x: 62,
    y: 56,
    w: 176,
    h: 72,
  },
  repository: {
    label: "Repository / Domain",
    subtitle: "읽기·동기화·분석 조정",
    x: 180,
    y: 132,
    w: 184,
    h: 70,
  },
  datastore: {
    label: "DataStore",
    subtitle: "lastSyncedAt · 설정",
    x: 34,
    y: 276,
    w: 156,
    h: 68,
  },
  keystore: {
    label: "Keystore",
    subtitle: "암호화 키 보호",
    x: 204,
    y: 276,
    w: 156,
    h: 68,
  },
  room: {
    label: "Room",
    subtitle: "Account · Transaction · Subscription",
    x: 382,
    y: 270,
    w: 188,
    h: 80,
  },
  bff: {
    label: "Stateless NestJS BFF",
    subtitle: "비밀키 보관 · 중계 · 저장 없음",
    x: 642,
    y: 120,
    w: 178,
    h: 76,
  },
  finance: {
    label: "금융 API",
    subtitle: "계좌 · 거래 원천",
    x: 770,
    y: 276,
    w: 150,
    h: 68,
  },
};

export default function AndroidLocalFirstFinanceViz() {
  const [activeStep, setActiveStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reduceMotion = useReducedMotion();
  const step = STEPS[activeStep];

  useEffect(() => {
    if (!isPlaying) return;

    timerRef.current = setTimeout(() => {
      setActiveStep((current) => (current + 1) % STEPS.length);
    }, reduceMotion ? 3600 : 2800);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [activeStep, isPlaying, reduceMotion]);

  const progress = ((activeStep + 1) / STEPS.length) * 100;

  const reset = () => {
    setActiveStep(0);
    setIsPlaying(false);
  };

  return (
    <div className="w-full space-y-4" data-testid="android-local-first-finance-viz">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card px-3 py-2.5">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={reset}
            className="rounded-md p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            aria-label="처음 단계로 초기화"
          >
            <RotateCcw className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => setIsPlaying((value) => !value)}
            className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground transition-opacity hover:opacity-90"
          >
            {isPlaying ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
            {isPlaying ? "일시정지" : "재생"}
          </button>
        </div>

        <div className="min-w-[190px] flex-1 sm:max-w-md">
          <div className="mb-1.5 flex items-center justify-between text-[11px] font-semibold text-muted-foreground">
            <span>STEP {activeStep + 1} / {STEPS.length}</span>
            <span>{step.network ? "NETWORK SYNC" : "LOCAL PATH"}</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-muted">
            <motion.div
              className="h-full rounded-full bg-primary"
              animate={{ width: `${progress}%` }}
              transition={{ duration: reduceMotion ? 0 : 0.25 }}
            />
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
        <div className="border-b border-border bg-muted/20 px-4 py-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-sm font-bold text-foreground">{step.title}</p>
              <p className="mt-1 max-w-3xl text-xs leading-relaxed text-muted-foreground">
                {step.summary}
              </p>
            </div>
            <span
              className={`rounded-full border px-2.5 py-1 text-[10px] font-bold tracking-wide ${
                step.network
                  ? "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300"
                  : "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
              }`}
            >
              {step.network ? "REMOTE CONNECTION ACTIVE" : "OFFLINE-CAPABLE"}
            </span>
          </div>
        </div>

        <div className="p-2 sm:p-5">
          <svg
            viewBox="0 0 960 500"
            role="img"
            aria-label="Android 로컬 우선 금융 앱의 Room, DataStore, Keystore, Stateless BFF와 금융 API 동기화 구조"
            className="block w-full select-none"
          >
            <defs>
              <marker id="local-first-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto">
                <path d="M 0 1 L 9 5 L 0 9 z" className="fill-muted-foreground" />
              </marker>
              <filter id="local-first-shadow" x="-20%" y="-30%" width="140%" height="160%">
                <feDropShadow dx="0" dy="3" stdDeviation="4" floodColor="#0f172a" floodOpacity="0.14" />
              </filter>
            </defs>

            <rect x="18" y="18" width="580" height="458" rx="24" className="fill-muted/20 stroke-border" strokeWidth="1.5" />
            <text x="42" y="45" className="fill-foreground" fontSize="13" fontWeight="800">
              Android App · 설치 공간 = 사용자 데이터 경계
            </text>

            <rect x="620" y="18" width="322" height="458" rx="24" className="fill-muted/10 stroke-border" strokeWidth="1.5" strokeDasharray="6 5" />
            <text x="644" y="45" className="fill-foreground" fontSize="13" fontWeight="800">
              Remote boundary · 필요할 때만 연결
            </text>

            <StaticEdges />

            {(Object.keys(nodeStyles) as NodeId[]).map((id) => (
              <ArchitectureNode
                key={id}
                id={id}
                active={step.activeNodes.includes(id)}
                roomCount={step.roomCount}
              />
            ))}

            <AnalysisPipeline activeStage={step.analysisStage} />

            <motion.g
              key={`${activeStep}-packet`}
              initial={{ x: step.from.x, y: step.from.y, opacity: 0 }}
              animate={{
                x: [step.from.x, step.to.x],
                y: [step.from.y, step.to.y],
                opacity: [0, 1, 1],
              }}
              transition={{ duration: reduceMotion ? 0 : 1.05, ease: "easeInOut" }}
            >
              <rect
                x="-64"
                y="-17"
                width="128"
                height="34"
                rx="17"
                className={step.network ? "fill-amber-500" : "fill-primary"}
                filter="url(#local-first-shadow)"
              />
              <text x="0" y="4" textAnchor="middle" fill="white" fontSize="9.5" fontWeight="800">
                {step.payload}
              </text>
            </motion.g>

            <g transform="translate(34 385)">
              <rect width="326" height="72" rx="14" className="fill-card stroke-border" />
              <text x="16" y="23" className="fill-muted-foreground" fontSize="10" fontWeight="700">
                LOCAL SYNC STATE
              </text>
              <text x="16" y="45" className="fill-foreground" fontSize="12" fontWeight="800">
                lastSyncedAt
              </text>
              <text x="310" y="45" textAnchor="end" className="fill-foreground" fontSize="12" fontFamily="monospace">
                {step.lastSyncedAt}
              </text>
              <text x="16" y="62" className="fill-muted-foreground" fontSize="10">
                서버 사용자 DB 없음 · 거래 원본은 기기 Room에 유지
              </text>
            </g>

            <g transform="translate(650 385)">
              <rect width="262" height="72" rx="14" className="fill-card stroke-border" />
              <ShieldCheck x="14" y="14" width="18" height="18" className="text-emerald-500" />
              <text x="42" y="27" className="fill-foreground" fontSize="11" fontWeight="800">
                Secret boundary
              </text>
              <text x="14" y="48" className="fill-muted-foreground" fontSize="9.5">
                client_secret → BFF only
              </text>
              <text x="14" y="63" className="fill-muted-foreground" fontSize="9.5">
                token material → Keystore-backed protection
              </text>
            </g>
          </svg>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StateCard
          label="읽기 기준"
          value="Room"
          detail="앱 실행 시 네트워크가 아니라 로컬 DB를 먼저 읽음"
        />
        <StateCard
          label="서버 역할"
          value="Stateless BFF"
          detail="비밀키와 외부 API 중계만 담당, 거래 영구 저장 없음"
        />
        <StateCard
          label="분석 원칙"
          value="Raw ≠ Subscription"
          detail="거래 원본을 보존하고 파생 구독은 언제든 재계산"
        />
      </div>
    </div>
  );
}

function StaticEdges() {
  const paths = [
    "M 150 128 C 160 142 188 150 210 158",
    "M 270 202 C 238 235 164 260 112 276",
    "M 286 202 L 282 276",
    "M 350 184 C 392 215 438 238 468 270",
    "M 364 158 C 452 130 558 130 642 158",
    "M 820 158 C 848 188 857 236 845 276",
    "M 770 178 C 698 232 624 270 570 302",
    "M 468 350 L 468 372",
  ];

  return (
    <g fill="none" className="stroke-muted-foreground/35" strokeWidth="2" strokeDasharray="5 6" markerEnd="url(#local-first-arrow)">
      {paths.map((path) => (
        <path key={path} d={path} />
      ))}
    </g>
  );
}

function ArchitectureNode({
  id,
  active,
  roomCount,
}: {
  id: NodeId;
  active: boolean;
  roomCount: number;
}) {
  const node = nodeStyles[id];
  const icon = useMemo(() => {
    const props = { width: 17, height: 17 };
    if (id === "ui") return <Smartphone {...props} />;
    if (id === "room" || id === "datastore") return <Database {...props} />;
    if (id === "keystore") return <KeyRound {...props} />;
    if (id === "bff") return <Server {...props} />;
    if (id === "finance") return <RefreshCw {...props} />;
    return <ShieldCheck {...props} />;
  }, [id]);

  return (
    <motion.g animate={{ opacity: active ? 1 : 0.46 }} transition={{ duration: 0.25 }}>
      <rect
        x={node.x}
        y={node.y}
        width={node.w}
        height={node.h}
        rx="14"
        className="fill-card"
        stroke={active ? "hsl(var(--primary))" : "hsl(var(--border))"}
        strokeWidth={active ? 2.5 : 1.2}
      />
      {active && (
        <rect
          x={node.x}
          y={node.y}
          width={node.w}
          height={node.h}
          rx="14"
          fill="hsl(var(--primary))"
          opacity="0.07"
        />
      )}
      <foreignObject x={node.x + 12} y={node.y + 12} width="22" height="22">
        <div className={active ? "text-primary" : "text-muted-foreground"}>{icon}</div>
      </foreignObject>
      <text x={node.x + 42} y={node.y + 27} className="fill-foreground" fontSize="11.5" fontWeight="800">
        {node.label}
      </text>
      <text x={node.x + 14} y={node.y + 50} className="fill-muted-foreground" fontSize="9.4">
        {node.subtitle}
      </text>
      {id === "room" && (
        <text x={node.x + 14} y={node.y + 67} className="fill-primary" fontSize="9.5" fontWeight="800">
          Transaction rows: {roomCount.toLocaleString()}
        </text>
      )}
    </motion.g>
  );
}

function AnalysisPipeline({ activeStage }: { activeStage: number }) {
  return (
    <g transform="translate(382 372)">
      <text x="0" y="-10" className="fill-muted-foreground" fontSize="9.5" fontWeight="700">
        DERIVED DATA PIPELINE
      </text>
      {ANALYSIS.map((label, index) => {
        const x = index * 108;
        const active = index <= activeStage;
        return (
          <g key={label}>
            {index > 0 && (
              <path
                d={`M ${x - 20} 22 L ${x - 5} 22`}
                className={active ? "stroke-primary" : "stroke-border"}
                strokeWidth="2"
                markerEnd="url(#local-first-arrow)"
              />
            )}
            <rect
              x={x}
              y="0"
              width="88"
              height="44"
              rx="10"
              className={active ? "fill-primary/10 stroke-primary" : "fill-muted/30 stroke-border"}
              strokeWidth={active ? 1.6 : 1}
            />
            <text
              x={x + 44}
              y="18"
              textAnchor="middle"
              className={active ? "fill-foreground" : "fill-muted-foreground"}
              fontSize="8.3"
              fontWeight="800"
            >
              {label.length > 15 ? label.slice(0, 15) : label}
            </text>
            {label.length > 15 && (
              <text x={x + 44} y="31" textAnchor="middle" className="fill-muted-foreground" fontSize="7.7">
                {label.slice(15)}
              </text>
            )}
          </g>
        );
      })}
    </g>
  );
}

function StateCard({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm font-bold text-foreground">{value}</p>
      <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{detail}</p>
    </div>
  );
}
