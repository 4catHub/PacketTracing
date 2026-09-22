import { useEffect, useMemo, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import {
  AlertTriangle,
  CheckCircle2,
  Database,
  KeyRound,
  Pause,
  Play,
  RefreshCw,
  RotateCcw,
  Server,
  ShieldCheck,
  Smartphone,
  UserCheck,
} from "lucide-react";

type NodeId =
  | "app"
  | "bff"
  | "provider"
  | "connection"
  | "raw"
  | "normalized"
  | "candidate"
  | "subscription";

type EdgeId =
  | "app-bff"
  | "bff-provider"
  | "provider-raw"
  | "raw-normalized"
  | "normalized-candidate"
  | "candidate-subscription"
  | "subscription-app"
  | "provider-connection";

type Step = {
  title: string;
  summary: string;
  focus: string;
  activeNodes: NodeId[];
  activeEdges: EdgeId[];
  payload: string;
  mode: "local" | "remote" | "analysis" | "failure";
  transactionCount: number;
  cursor: string;
  authState: "CONNECTED" | "SYNCING" | "REAUTH_REQUIRED";
  candidateCount: number;
  subscriptionCount: number;
  priceState: string;
};

const STEPS: Step[] = [
  {
    title: "금융 연결 시작",
    summary:
      "사용자가 계좌 연결을 시작하면 앱은 BFF를 통해 금융 제공자의 인증·동의 흐름으로 진입합니다.",
    focus: "앱에 client_secret을 두지 않고 원격 연결의 보안 경계를 BFF에 둡니다.",
    activeNodes: ["app", "bff", "provider", "connection"],
    activeEdges: ["app-bff", "bff-provider", "provider-connection"],
    payload: "Authorization + PKCE",
    mode: "remote",
    transactionCount: 0,
    cursor: "—",
    authState: "SYNCING",
    candidateCount: 0,
    subscriptionCount: 0,
    priceState: "분석 전",
  },
  {
    title: "연결 자격과 동기화 상태 확립",
    summary:
      "금융 연결이 성립되면 provider connection ID, sync cursor, 인증 상태를 FinancialConnection으로 관리합니다.",
    focus:
      "동기화 상태는 앱 전체의 단일 timestamp가 아니라 금융 연결별로 분리합니다.",
    activeNodes: ["connection", "app", "bff"],
    activeEdges: ["app-bff", "provider-connection"],
    payload: "connectionId + cursor",
    mode: "local",
    transactionCount: 0,
    cursor: "cursor_000",
    authState: "CONNECTED",
    candidateCount: 0,
    subscriptionCount: 0,
    priceState: "분석 전",
  },
  {
    title: "초기 거래 원본 수집",
    summary:
      "필요한 과거 거래를 페이지 단위로 받아 원본 FinancialTransaction으로 저장합니다.",
    focus:
      "구독 결과보다 거래 원본을 먼저 보존해야 이후 알고리즘 변경과 가격 변동 재분석이 가능합니다.",
    activeNodes: ["provider", "raw", "connection"],
    activeEdges: ["bff-provider", "provider-raw", "provider-connection"],
    payload: "added × 1,200",
    mode: "remote",
    transactionCount: 1200,
    cursor: "cursor_1200",
    authState: "CONNECTED",
    candidateCount: 0,
    subscriptionCount: 0,
    priceState: "분석 전",
  },
  {
    title: "가맹점 정규화",
    summary:
      "원본 거래의 merchant description을 정규화해 같은 사업자의 거래를 동일 merchant key로 묶습니다.",
    focus:
      "표기 흔들림을 제거해야 Netflix, NETFLIX.COM, Netflix.com 같은 거래가 하나의 반복 결제 시퀀스로 연결됩니다.",
    activeNodes: ["raw", "normalized"],
    activeEdges: ["raw-normalized"],
    payload: "merchantKey = netflix",
    mode: "analysis",
    transactionCount: 1200,
    cursor: "cursor_1200",
    authState: "CONNECTED",
    candidateCount: 0,
    subscriptionCount: 0,
    priceState: "분석 전",
  },
  {
    title: "구독 후보 탐지",
    summary:
      "결제 간격, 금액 허용 오차, 최근 결제일을 기준으로 반복 결제를 찾아 SubscriptionCandidate를 생성합니다.",
    focus:
      "탐지 결과는 확정 데이터가 아니므로 confidence와 근거를 가진 후보 상태로 먼저 둡니다.",
    activeNodes: ["normalized", "candidate"],
    activeEdges: ["normalized-candidate"],
    payload: "monthly · ₩17,000 · 0.94",
    mode: "analysis",
    transactionCount: 1200,
    cursor: "cursor_1200",
    authState: "CONNECTED",
    candidateCount: 14,
    subscriptionCount: 0,
    priceState: "후보 계산",
  },
  {
    title: "사용자 확인과 보정값 저장",
    summary:
      "사용자는 후보를 구독으로 확정하거나 무시하고, 직접 추가·이름 변경 같은 판단을 별도 UserOverride로 남깁니다.",
    focus:
      "분석 결과가 다시 계산돼도 사용자의 확정·무시 판단은 덮어쓰지 않아야 합니다.",
    activeNodes: ["candidate", "subscription", "app"],
    activeEdges: ["candidate-subscription", "subscription-app"],
    payload: "CONFIRM + UserOverride",
    mode: "local",
    transactionCount: 1200,
    cursor: "cursor_1200",
    authState: "CONNECTED",
    candidateCount: 14,
    subscriptionCount: 8,
    priceState: "기준가 ₩17,000",
  },
  {
    title: "구독 모아보기",
    summary:
      "평상시 앱 실행에서는 네트워크를 기다리지 않고 Room의 Subscription projection을 읽어 현재 구독을 즉시 보여줍니다.",
    focus:
      "금융기관 연결 상태와 상관없이 마지막으로 확인된 구독 화면은 계속 사용할 수 있습니다.",
    activeNodes: ["subscription", "app"],
    activeEdges: ["subscription-app"],
    payload: "8 subscriptions · ₩86,900/mo",
    mode: "local",
    transactionCount: 1200,
    cursor: "cursor_1200",
    authState: "CONNECTED",
    candidateCount: 14,
    subscriptionCount: 8,
    priceState: "기준가 ₩17,000",
  },
  {
    title: "수동 증분 동기화",
    summary:
      "새로고침 시 연결별 cursor로 added·modified·removed 패치를 받고, 모든 페이지가 성공한 뒤에만 cursor를 전진시킵니다.",
    focus:
      "중간 페이지 실패에서 cursor를 먼저 갱신하면 거래 누락이 생길 수 있으므로 패치와 cursor 커밋 순서가 중요합니다.",
    activeNodes: ["app", "bff", "provider", "connection", "raw"],
    activeEdges: ["app-bff", "bff-provider", "provider-raw", "provider-connection"],
    payload: "+18 · ~2 · -1",
    mode: "remote",
    transactionCount: 1217,
    cursor: "cursor_1219",
    authState: "SYNCING",
    candidateCount: 14,
    subscriptionCount: 8,
    priceState: "변경 감지 대기",
  },
  {
    title: "변경분 재분석과 가격 변동 감지",
    summary:
      "변경된 거래가 영향을 주는 가맹점만 다시 분석해 가격 인상, 결제 주기 변화, 해지 가능성을 갱신합니다.",
    focus:
      "원본과 파생 데이터를 분리했기 때문에 전체 금융 데이터를 다시 내려받지 않고도 분석 결과를 재생성할 수 있습니다.",
    activeNodes: ["raw", "normalized", "candidate", "subscription"],
    activeEdges: [
      "raw-normalized",
      "normalized-candidate",
      "candidate-subscription",
    ],
    payload: "₩17,000 → ₩18,500",
    mode: "analysis",
    transactionCount: 1217,
    cursor: "cursor_1219",
    authState: "CONNECTED",
    candidateCount: 14,
    subscriptionCount: 8,
    priceState: "+₩1,500 인상",
  },
  {
    title: "실패와 재인증",
    summary:
      "인증 만료나 금융 API 장애가 발생해도 기존 구독 화면은 유지하고 연결 상태만 재인증 필요로 바꿉니다.",
    focus:
      "원격 장애가 로컬 구독 조회까지 막지 않도록 실패 경로를 서비스 설계에 포함합니다.",
    activeNodes: ["app", "connection", "subscription"],
    activeEdges: ["subscription-app"],
    payload: "REAUTH_REQUIRED",
    mode: "failure",
    transactionCount: 1217,
    cursor: "cursor_1219",
    authState: "REAUTH_REQUIRED",
    candidateCount: 14,
    subscriptionCount: 8,
    priceState: "+₩1,500 인상",
  },
];

const NODES: Record<
  NodeId,
  {
    label: string;
    detail: string;
    x: number;
    y: number;
    w: number;
    h: number;
    zone: "device" | "remote";
  }
> = {
  app: {
    label: "Subscription App",
    detail: "Compose UI · Use Cases",
    x: 54,
    y: 72,
    w: 178,
    h: 70,
    zone: "device",
  },
  connection: {
    label: "FinancialConnection",
    detail: "connectionId · cursor · auth",
    x: 54,
    y: 186,
    w: 178,
    h: 76,
    zone: "device",
  },
  raw: {
    label: "FinancialTransaction",
    detail: "원본 거래 · external ID",
    x: 288,
    y: 72,
    w: 176,
    h: 70,
    zone: "device",
  },
  normalized: {
    label: "MerchantTransaction",
    detail: "정규화된 merchant key",
    x: 288,
    y: 186,
    w: 176,
    h: 70,
    zone: "device",
  },
  candidate: {
    label: "SubscriptionCandidate",
    detail: "cycle · amount · confidence",
    x: 288,
    y: 300,
    w: 176,
    h: 76,
    zone: "device",
  },
  subscription: {
    label: "Subscription",
    detail: "확정 상태 + UserOverride",
    x: 54,
    y: 300,
    w: 178,
    h: 76,
    zone: "device",
  },
  bff: {
    label: "Stateless BFF",
    detail: "secret · token exchange · proxy",
    x: 566,
    y: 104,
    w: 164,
    h: 74,
    zone: "remote",
  },
  provider: {
    label: "Financial Provider",
    detail: "OAuth · account · transactions",
    x: 768,
    y: 104,
    w: 164,
    h: 74,
    zone: "remote",
  },
};

const EDGES: Record<EdgeId, { from: NodeId; to: NodeId; label: string }> = {
  "app-bff": { from: "app", to: "bff", label: "secure request" },
  "bff-provider": { from: "bff", to: "provider", label: "provider API" },
  "provider-raw": { from: "provider", to: "raw", label: "transaction delta" },
  "raw-normalized": { from: "raw", to: "normalized", label: "normalize" },
  "normalized-candidate": {
    from: "normalized",
    to: "candidate",
    label: "detect recurring",
  },
  "candidate-subscription": {
    from: "candidate",
    to: "subscription",
    label: "confirm / override",
  },
  "subscription-app": { from: "subscription", to: "app", label: "projection" },
  "provider-connection": {
    from: "provider",
    to: "connection",
    label: "cursor / auth state",
  },
};

export default function AndroidLocalFirstFinanceViz() {
  const [activeStep, setActiveStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const timerRef = useRef<ReturnType<typeof window.setTimeout> | null>(null);
  const reduceMotion = useReducedMotion();
  const step = STEPS[activeStep];

  useEffect(() => {
    if (!isPlaying) return;

    timerRef.current = window.setTimeout(() => {
      setActiveStep((current) => (current + 1) % STEPS.length);
    }, reduceMotion ? 4200 : 3200);

    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
    };
  }, [activeStep, isPlaying, reduceMotion]);

  const progress = ((activeStep + 1) / STEPS.length) * 100;

  const handleReset = () => {
    if (timerRef.current) window.clearTimeout(timerRef.current);
    setActiveStep(0);
    setIsPlaying(false);
  };

  return (
    <div className="w-full space-y-4" data-testid="android-local-first-finance-viz">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card px-3 py-2.5">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleReset}
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
            {isPlaying ? (
              <Pause className="h-3.5 w-3.5" />
            ) : (
              <Play className="h-3.5 w-3.5" />
            )}
            {isPlaying ? "일시정지" : "재생"}
          </button>
        </div>

        <div className="min-w-[210px] flex-1 sm:max-w-md">
          <div className="mb-1.5 flex items-center justify-between text-[11px] font-semibold text-muted-foreground">
            <span>
              STEP {activeStep + 1} / {STEPS.length}
            </span>
            <span>{modeLabel(step.mode)}</span>
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

      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        <div className="border-b border-border bg-muted/20 px-4 py-3">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="max-w-3xl">
              <p className="text-sm font-bold text-foreground">{step.title}</p>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                {step.summary}
              </p>
            </div>
            <ModeBadge mode={step.mode} />
          </div>
        </div>

        <div className="p-2 sm:p-5">
          <svg
            viewBox="0 0 960 450"
            role="img"
            aria-label="구독 모아보기 서비스의 금융 연결, 거래 동기화, 정규화, 구독 탐지와 사용자 확인 흐름"
            className="block w-full select-none"
          >
            <defs>
              <marker
                id="subscription-flow-arrow"
                viewBox="0 0 10 10"
                refX="8"
                refY="5"
                markerWidth="6"
                markerHeight="6"
                orient="auto"
              >
                <path d="M 0 1 L 9 5 L 0 9 z" className="fill-muted-foreground" />
              </marker>
              <filter
                id="subscription-payload-shadow"
                x="-30%"
                y="-50%"
                width="160%"
                height="200%"
              >
                <feDropShadow
                  dx="0"
                  dy="3"
                  stdDeviation="4"
                  floodColor="#0f172a"
                  floodOpacity="0.14"
                />
              </filter>
            </defs>

            <rect
              x="20"
              y="20"
              width="474"
              height="410"
              rx="24"
              className="fill-muted/15 stroke-border"
              strokeWidth="1.4"
            />
            <text
              x="42"
              y="49"
              className="fill-foreground"
              fontSize="13"
              fontWeight="800"
            >
              Android · Local source of truth
            </text>
            <text
              x="42"
              y="65"
              className="fill-muted-foreground"
              fontSize="9.5"
            >
              금융 원본과 구독 상태는 기기에 남고, 평상시 화면은 이 경계만 읽습니다.
            </text>

            <rect
              x="530"
              y="20"
              width="410"
              height="410"
              rx="24"
              className="fill-muted/10 stroke-border"
              strokeWidth="1.4"
              strokeDasharray="6 5"
            />
            <text
              x="552"
              y="49"
              className="fill-foreground"
              fontSize="13"
              fontWeight="800"
            >
              Remote · Connect / Sync only
            </text>
            <text
              x="552"
              y="65"
              className="fill-muted-foreground"
              fontSize="9.5"
            >
              BFF는 secret과 provider 통신을 담당하고 거래·구독 원본은 영구 저장하지 않습니다.
            </text>

            {(Object.keys(EDGES) as EdgeId[]).map((edgeId) => (
              <FlowEdge
                key={edgeId}
                edgeId={edgeId}
                active={step.activeEdges.includes(edgeId)}
                payload={step.payload}
                animate={!reduceMotion}
              />
            ))}

            {(Object.keys(NODES) as NodeId[]).map((nodeId) => (
              <ServiceNode
                key={nodeId}
                nodeId={nodeId}
                active={step.activeNodes.includes(nodeId)}
                authState={step.authState}
                cursor={step.cursor}
                transactionCount={step.transactionCount}
                candidateCount={step.candidateCount}
                subscriptionCount={step.subscriptionCount}
                priceState={step.priceState}
              />
            ))}
          </svg>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-4 sm:p-5">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 rounded-lg bg-primary/10 p-2 text-primary">
            <CheckCircle2 className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Why this step matters
            </p>
            <p className="mt-1 text-sm font-semibold leading-relaxed text-foreground">
              {step.focus}
            </p>
            <p className="mt-2 text-xs text-muted-foreground">
              현재 전달 데이터: <span className="font-mono font-semibold text-foreground">{step.payload}</span>
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-4">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          <StatusMetric label="Transactions" value={step.transactionCount.toLocaleString()} />
          <StatusMetric label="Sync cursor" value={step.cursor} mono />
          <StatusMetric label="Auth state" value={step.authState} />
          <StatusMetric label="Candidates" value={String(step.candidateCount)} />
          <StatusMetric label="Subscriptions" value={String(step.subscriptionCount)} />
        </div>
        <div className="mt-3 border-t border-border/60 pt-3 text-xs text-muted-foreground">
          가격 상태: <span className="font-semibold text-foreground">{step.priceState}</span>
        </div>
      </div>
    </div>
  );
}

function FlowEdge({
  edgeId,
  active,
  payload,
  animate,
}: {
  edgeId: EdgeId;
  active: boolean;
  payload: string;
  animate: boolean;
}) {
  const edge = EDGES[edgeId];
  const from = NODES[edge.from];
  const to = NODES[edge.to];
  const start = edgePoint(from, to);
  const end = edgePoint(to, from);
  const midX = (start.x + end.x) / 2;
  const midY = (start.y + end.y) / 2;
  const path = edgePath(edgeId, start, end);

  return (
    <g>
      <path
        d={path}
        fill="none"
        stroke={active ? "hsl(var(--primary))" : "hsl(var(--muted-foreground))"}
        strokeOpacity={active ? 0.9 : 0.22}
        strokeWidth={active ? 2.5 : 1.5}
        strokeDasharray={active ? undefined : "5 7"}
        markerEnd="url(#subscription-flow-arrow)"
      />
      {active && (
        <>
          <rect
            x={midX - 48}
            y={midY - 11}
            width="96"
            height="22"
            rx="11"
            className="fill-card stroke-border"
          />
          <text
            x={midX}
            y={midY + 3}
            textAnchor="middle"
            className="fill-muted-foreground"
            fontSize="7.8"
            fontWeight="700"
          >
            {edge.label}
          </text>
          <motion.circle
            key={`${edgeId}-${payload}`}
            r="7"
            fill="hsl(var(--primary))"
            filter="url(#subscription-payload-shadow)"
            initial={{ cx: start.x, cy: start.y, opacity: 0 }}
            animate={{
              cx: animate ? [start.x, end.x] : midX,
              cy: animate ? [start.y, end.y] : midY,
              opacity: animate ? [0, 1, 1, 0] : 1,
            }}
            transition={{
              duration: animate ? 1.8 : 0,
              ease: "easeInOut",
            }}
          />
        </>
      )}
    </g>
  );
}

function ServiceNode({
  nodeId,
  active,
  authState,
  cursor,
  transactionCount,
  candidateCount,
  subscriptionCount,
  priceState,
}: {
  nodeId: NodeId;
  active: boolean;
  authState: Step["authState"];
  cursor: string;
  transactionCount: number;
  candidateCount: number;
  subscriptionCount: number;
  priceState: string;
}) {
  const node = NODES[nodeId];
  const icon = useMemo(() => nodeIcon(nodeId), [nodeId]);
  const metric = nodeMetric({
    nodeId,
    authState,
    cursor,
    transactionCount,
    candidateCount,
    subscriptionCount,
    priceState,
  });

  return (
    <motion.g animate={{ opacity: active ? 1 : 0.48 }} transition={{ duration: 0.22 }}>
      <rect
        x={node.x}
        y={node.y}
        width={node.w}
        height={node.h}
        rx="14"
        className="fill-card"
        stroke={active ? "hsl(var(--primary))" : "hsl(var(--border))"}
        strokeWidth={active ? 2.4 : 1.2}
      />
      {active && (
        <rect
          x={node.x}
          y={node.y}
          width={node.w}
          height={node.h}
          rx="14"
          fill="hsl(var(--primary))"
          opacity="0.06"
        />
      )}
      <foreignObject x={node.x + 12} y={node.y + 11} width="22" height="22">
        <div className={active ? "text-primary" : "text-muted-foreground"}>
          {icon}
        </div>
      </foreignObject>
      <text
        x={node.x + 42}
        y={node.y + 26}
        className="fill-foreground"
        fontSize="11"
        fontWeight="800"
      >
        {node.label}
      </text>
      <text
        x={node.x + 14}
        y={node.y + 46}
        className="fill-muted-foreground"
        fontSize="8.8"
      >
        {node.detail}
      </text>
      <text
        x={node.x + 14}
        y={node.y + node.h - 11}
        className={active ? "fill-primary" : "fill-muted-foreground"}
        fontSize="8.5"
        fontWeight="800"
      >
        {metric}
      </text>
    </motion.g>
  );
}

function StatusMetric({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="min-w-0">
      <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p
        className={`mt-1 truncate text-sm font-semibold text-foreground ${
          mono ? "font-mono text-xs" : ""
        }`}
        title={value}
      >
        {value}
      </p>
    </div>
  );
}

function ModeBadge({ mode }: { mode: Step["mode"] }) {
  const config = {
    local: {
      label: "LOCAL READ / USER STATE",
      cls: "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
    },
    remote: {
      label: "REMOTE CONNECT / SYNC",
      cls: "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300",
    },
    analysis: {
      label: "LOCAL ANALYSIS",
      cls: "border-violet-500/30 bg-violet-500/10 text-violet-700 dark:text-violet-300",
    },
    failure: {
      label: "FAILURE / REAUTH",
      cls: "border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-300",
    },
  }[mode];

  return (
    <span className={`rounded-full border px-2.5 py-1 text-[10px] font-bold tracking-wide ${config.cls}`}>
      {config.label}
    </span>
  );
}

function modeLabel(mode: Step["mode"]) {
  if (mode === "local") return "LOCAL";
  if (mode === "remote") return "REMOTE";
  if (mode === "analysis") return "ANALYSIS";
  return "FAILURE";
}

function nodeIcon(nodeId: NodeId) {
  const props = { width: 17, height: 17 };
  if (nodeId === "app") return <Smartphone {...props} />;
  if (nodeId === "bff") return <Server {...props} />;
  if (nodeId === "provider") return <ShieldCheck {...props} />;
  if (nodeId === "connection") return <KeyRound {...props} />;
  if (nodeId === "subscription") return <UserCheck {...props} />;
  if (nodeId === "candidate") return <RefreshCw {...props} />;
  if (nodeId === "raw" || nodeId === "normalized") return <Database {...props} />;
  return <AlertTriangle {...props} />;
}

function nodeMetric({
  nodeId,
  authState,
  cursor,
  transactionCount,
  candidateCount,
  subscriptionCount,
  priceState,
}: {
  nodeId: NodeId;
  authState: Step["authState"];
  cursor: string;
  transactionCount: number;
  candidateCount: number;
  subscriptionCount: number;
  priceState: string;
}) {
  if (nodeId === "connection") return `${authState} · ${cursor}`;
  if (nodeId === "raw") return `${transactionCount.toLocaleString()} rows`;
  if (nodeId === "candidate") return `${candidateCount} candidates`;
  if (nodeId === "subscription")
    return `${subscriptionCount} subscriptions · ${priceState}`;
  if (nodeId === "bff") return "no transaction persistence";
  if (nodeId === "provider") return "added · modified · removed";
  if (nodeId === "normalized") return "merchant-key grouped";
  return "Room projection";
}

function edgePoint(
  from: (typeof NODES)[NodeId],
  to: (typeof NODES)[NodeId],
) {
  const fromCenter = { x: from.x + from.w / 2, y: from.y + from.h / 2 };
  const toCenter = { x: to.x + to.w / 2, y: to.y + to.h / 2 };
  const dx = toCenter.x - fromCenter.x;
  const dy = toCenter.y - fromCenter.y;

  if (Math.abs(dx) >= Math.abs(dy)) {
    return {
      x: dx >= 0 ? from.x + from.w : from.x,
      y: fromCenter.y,
    };
  }

  return {
    x: fromCenter.x,
    y: dy >= 0 ? from.y + from.h : from.y,
  };
}

function edgePath(
  edgeId: EdgeId,
  start: { x: number; y: number },
  end: { x: number; y: number },
) {
  if (edgeId === "provider-raw") {
    return `M ${start.x} ${start.y} C 670 250, 570 106, ${end.x} ${end.y}`;
  }

  if (edgeId === "provider-connection") {
    return `M ${start.x} ${start.y} C 650 390, 380 400, ${end.x} ${end.y}`;
  }

  if (edgeId === "subscription-app") {
    return `M ${start.x} ${start.y} C 20 250, 20 140, ${end.x} ${end.y}`;
  }

  const midX = (start.x + end.x) / 2;
  const midY = (start.y + end.y) / 2;

  if (Math.abs(start.x - end.x) > Math.abs(start.y - end.y)) {
    return `M ${start.x} ${start.y} C ${midX} ${start.y}, ${midX} ${end.y}, ${end.x} ${end.y}`;
  }

  return `M ${start.x} ${start.y} C ${start.x} ${midY}, ${end.x} ${midY}, ${end.x} ${end.y}`;
}
