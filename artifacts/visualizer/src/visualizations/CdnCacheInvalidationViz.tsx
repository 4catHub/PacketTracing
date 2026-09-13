import { useCallback, useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import {
  AlertCircle,
  Clock,
  Globe,
  HardDrive,
  Layers,
  Lock,
  Pause,
  Play,
  RefreshCw,
  RotateCcw,
  Server,
  ShieldCheck,
  Trash2,
  Zap,
} from "lucide-react";

type Tone = "blue" | "emerald" | "violet" | "rose" | "cyan";

interface Metric {
  label: string;
  value: string;
  status?: "active" | "warning" | "danger" | "neutral";
}

interface CdnStage {
  id: string;
  title: string;
  badge: string;
  summary: string;
  tone: Tone;
  duration: number;
  clientState: {
    badge: string;
    description: string;
  };
  edgeState: {
    status: "MISS" | "HIT" | "STALE" | "PURGED" | "IMMUTABLE";
    tag: string;
    ttlText: string;
    ttlPercent: number;
  };
  originState: {
    status: string;
    traffic: string;
    version: string;
  };
  rtt: {
    clientToEdge: string;
    edgeToOrigin: string;
    total: string;
  };
  metrics: Metric[];
  requestHeaders: string;
  responseHeaders: string;
  directiveExplainer: {
    directive: string;
    purpose: string;
  };
}

const STAGES: CdnStage[] = [
  {
    id: "cache-miss",
    title: "1. 캐시 미스와 오리진 적재 (Cache Miss & Origin Fill)",
    badge: "CACHE MISS",
    summary:
      "브라우저와 엣지 POP에 캐시가 없어(X-Cache: MISS), 태평양을 건너 오리진 서버까지 왕복(185ms)하여 응답을 받고 엣지 캐시에 적재합니다.",
    tone: "blue",
    duration: 4500,
    clientState: {
      badge: "NO CACHE",
      description: "로컬 캐시 없음 → 엣지 요청",
    },
    edgeState: {
      status: "MISS",
      tag: "Populating v1.0",
      ttlText: "s-maxage=300s (New)",
      ttlPercent: 100,
    },
    originState: {
      status: "FETCH & COMPUTE",
      traffic: "100% Traffic",
      version: "v1.0 (Hash: 8f92a)",
    },
    rtt: {
      clientToEdge: "8 ms",
      edgeToOrigin: "177 ms",
      total: "185 ms",
    },
    metrics: [
      { label: "Edge 상태", value: "MISS (Populating)", status: "warning" },
      { label: "전체 지연(RTT)", value: "185 ms (Origin)", status: "warning" },
      { label: "오리진 부하", value: "100% (Fetch)", status: "danger" },
      { label: "캐시 정책", value: "s-maxage=300, swr=60", status: "active" },
    ],
    requestHeaders: [
      "GET /assets/app.js HTTP/1.1",
      "Host: cdn.example.com",
      "User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)",
      "Accept: */*",
    ].join("\n"),
    responseHeaders: [
      "HTTP/1.1 200 OK",
      "Content-Type: application/javascript; charset=utf-8",
      "Content-Length: 42,890",
      "Cache-Control: public, max-age=60, s-maxage=300, stale-while-revalidate=60",
      'ETag: W/"8f92a-app-v1"',
      "Age: 0",
      "X-Cache: MISS from cdn-pop-icn",
    ].join("\n"),
    directiveExplainer: {
      directive: "s-maxage=300, max-age=60",
      purpose:
        "브라우저에는 60초, CDN 공유 엣지에는 300초 동안 캐싱하도록 수명을 차등화합니다.",
    },
  },
  {
    id: "cache-hit",
    title: "2. 엣지 캐시 히트와 오리진 차단 (Edge Cache Hit)",
    badge: "CACHE HIT",
    summary:
      "동일 지역 사용자의 요청을 가장 가까운 엣지 POP의 SSD 캐시에서 8ms 만에 즉시 반환하며, 오리진 서버에는 트래픽이 0% 전달됩니다.",
    tone: "emerald",
    duration: 4000,
    clientState: {
      badge: "CACHED",
      description: "8ms 초저지연 수신 완료",
    },
    edgeState: {
      status: "HIT",
      tag: "Cached v1.0",
      ttlText: "TTL: 255s 남음 (Fresh)",
      ttlPercent: 85,
    },
    originState: {
      status: "SHIELDED (IDLE)",
      traffic: "0% (Bypassed)",
      version: "v1.0 (Protected)",
    },
    rtt: {
      clientToEdge: "8 ms (Hit)",
      edgeToOrigin: "Bypassed",
      total: "8 ms (초저지연)",
    },
    metrics: [
      { label: "Edge 상태", value: "HIT (Edge SSD)", status: "active" },
      { label: "전체 지연(RTT)", value: "8 ms (Edge POP)", status: "active" },
      { label: "오리진 차단율", value: "100% Shielded", status: "active" },
      { label: "캐시 수명(Age)", value: "Age: 45s / 300s", status: "active" },
    ],
    requestHeaders: [
      "GET /assets/app.js HTTP/1.1",
      "Host: cdn.example.com",
      "Accept-Encoding: gzip, br",
    ].join("\n"),
    responseHeaders: [
      "HTTP/1.1 200 OK",
      "Content-Type: application/javascript; charset=utf-8",
      "Cache-Control: public, max-age=60, s-maxage=300, stale-while-revalidate=60",
      'ETag: W/"8f92a-app-v1"',
      "Age: 45",
      "X-Cache: HIT from cdn-pop-icn",
    ].join("\n"),
    directiveExplainer: {
      directive: "X-Cache: HIT, Age: 45",
      purpose:
        "엣지 캐시 적재 후 45초가 경과했음을 알리며, 원본 서버 요청 없이 엣지 로컬에서 즉시 반환됩니다.",
    },
  },
  {
    id: "stale-while-revalidate",
    title: "3. Stale-While-Revalidate 비동기 갱신",
    badge: "STALE & REVALIDATE",
    summary:
      "TTL(300s)이 만료되었으나 stale 허용(60s) 범위 내이므로 사용자에게는 8ms 만에 구버전을 즉시 전달하고, 백그라운드 비동기로 오리진과 ETag 검증을 거쳐 캐시를 v2.0으로 갱신합니다.",
    tone: "violet",
    duration: 4800,
    clientState: {
      badge: "INSTANT SERVED",
      description: "구버전(Stale) 8ms 즉시 렌더",
    },
    edgeState: {
      status: "STALE",
      tag: "Revalidate → v2.0",
      ttlText: "Stale window (+60s)",
      ttlPercent: 20,
    },
    originState: {
      status: "ASYNC REVALIDATE",
      traffic: "1 Async Request",
      version: "v2.0 (Hash: b412c)",
    },
    rtt: {
      clientToEdge: "8 ms (Stale)",
      edgeToOrigin: "177 ms (bg)",
      total: "8 ms (체감 지연)",
    },
    metrics: [
      { label: "사용자 응답", value: "8 ms (Stale Hit)", status: "active" },
      { label: "비동기 검증", value: "If-None-Match", status: "active" },
      { label: "캐시 스탬피드", value: "방어 완료 (Throttled)", status: "active" },
      { label: "갱신 결과", value: "v2.0 교체 완료", status: "active" },
    ],
    requestHeaders: [
      "// [Client Request]",
      "GET /assets/app.js HTTP/1.1",
      "",
      "// [Edge → Origin Background Revalidation]",
      "GET /assets/app.js HTTP/1.1",
      'If-None-Match: W/"8f92a-app-v1"',
    ].join("\n"),
    responseHeaders: [
      "// [Client Response (Instant Stale)]",
      "HTTP/1.1 200 OK",
      "X-Cache: STALE from cdn-pop-icn",
      "Age: 320",
      "",
      "// [Origin Response to Edge (Background)]",
      "HTTP/1.1 200 OK (or 304 Not Modified)",
      'ETag: W/"b412c-app-v2"',
      "Cache-Control: public, s-maxage=300, stale-while-revalidate=60",
    ].join("\n"),
    directiveExplainer: {
      directive: "stale-while-revalidate=60",
      purpose:
        "캐시가 만료되어도 60초간은 낡은 데이터를 즉시 반환해 사용자 체감 지연을 0으로 유지하고 백그라운드에서 최신화합니다.",
    },
  },
  {
    id: "instant-purge",
    title: "4. 긴급 캐시 무효화 (Instant Purge API)",
    badge: "PURGE API",
    summary:
      "긴급 핫픽스 배포 시 CI/CD나 운영자가 CDN Invalidation API를 호출하여 전 세계 수백 개 엣지 POP의 특정 URL/태그 캐시를 수백 ms 내에 강제 삭제(Purge)합니다.",
    tone: "rose",
    duration: 4500,
    clientState: {
      badge: "NEED FETCH",
      description: "무효화 감지 → 다음 요청 시 미스",
    },
    edgeState: {
      status: "PURGED",
      tag: "Cache Evicted / Expired",
      ttlText: "Purged via API (0s)",
      ttlPercent: 0,
    },
    originState: {
      status: "PURGE BROADCAST",
      traffic: "API Webhook Call",
      version: "v2.1 (Hotfix)",
    },
    rtt: {
      clientToEdge: "대기 (Idle)",
      edgeToOrigin: "< 150 ms",
      total: "< 150 ms (전파)",
    },
    metrics: [
      { label: "무효화 방식", value: "Path & Cache-Tag", status: "danger" },
      { label: "전 세계 전파", value: "< 150 ms 전파", status: "active" },
      { label: "다음 요청", value: "Forced Edge Miss", status: "warning" },
      { label: "오리진 리스크", value: "와일드카드 남용 금지", status: "warning" },
    ],
    requestHeaders: [
      "POST /v1/zones/zone_123/purge_cache HTTP/1.1",
      "Host: api.cloudflare.com",
      "Authorization: Bearer cdn_api_token_***",
      "Content-Type: application/json",
      "",
      JSON.stringify(
        {
          files: ["https://cdn.example.com/assets/app.js"],
          tags: ["release-v2.1", "core-scripts"],
        },
        null,
        2,
      ),
    ].join("\n"),
    responseHeaders: [
      "HTTP/1.1 200 OK",
      "Content-Type: application/json",
      "",
      JSON.stringify(
        {
          success: true,
          purged_edge_nodes: 310,
          elapsed_time_ms: 124,
          invalidation_id: "inv_9a4f21c",
        },
        null,
        2,
      ),
    ].join("\n"),
    directiveExplainer: {
      directive: "Cache-Tags / Surrogate-Keys",
      purpose:
        "와일드카드(/*) 전체 삭제 대신 태그 단위로 정밀하게 무효화해야 오리진 서버의 캐시 스탬피드 폭주를 예방할 수 있습니다.",
    },
  },
  {
    id: "cache-busting",
    title: "5. Cache Busting과 불변 정적 자원 (Immutable Assets)",
    badge: "CACHE BUSTING",
    summary:
      "빌드 번들러가 파일명에 내용 해시(app.8f3a9.js)를 부여하고 1년 유효 기간(immutable)을 지정합니다. 새 배포 시 새 URL이 생성되므로 Purge API 없이도 100% 안전한 영구 캐싱을 누립니다.",
    tone: "cyan",
    duration: 4200,
    clientState: {
      badge: "DISK HIT (0ms)",
      description: "디스크 캐시 즉시 로드",
    },
    edgeState: {
      status: "IMMUTABLE",
      tag: "app.8f3a9.js (1y)",
      ttlText: "max-age=1년 (Immutable)",
      ttlPercent: 100,
    },
    originState: {
      status: "SHIELDED (0 LOAD)",
      traffic: "0% Static Load",
      version: "v2.0 (Hash: 8f3a9)",
    },
    rtt: {
      clientToEdge: "0 ms (Local)",
      edgeToOrigin: "Bypassed",
      total: "0 ms (완벽한 성능)",
    },
    metrics: [
      { label: "브라우저 지연", value: "0 ms (from disk)", status: "active" },
      { label: "캐시 수명", value: "1년 (31536000s)", status: "active" },
      { label: "불변 지시어", value: "immutable (재검증 생략)", status: "active" },
      { label: "배포 원칙", value: "HTML(no-cache) 분리", status: "active" },
    ],
    requestHeaders: [
      "GET /assets/app.8f3a9.js HTTP/1.1",
      "Host: cdn.example.com",
      "// 브라우저가 If-None-Match 조건부 요청조차 보내지 않고 디스크에서 즉시 로드",
    ].join("\n"),
    responseHeaders: [
      "HTTP/1.1 200 OK (from disk cache)",
      "Cache-Control: public, max-age=31536000, immutable",
      "Content-Type: application/javascript",
      'ETag: "hash-8f3a9"',
      "X-Cache: HIT from cdn-pop-icn",
    ].join("\n"),
    directiveExplainer: {
      directive: "max-age=31536000, immutable",
      purpose:
        "파일 내용이 결코 변경되지 않음을 브라우저에 보장하여 사용자가 새로고침해도 재검증 네트워크 요청을 완전히 차단합니다.",
    },
  },
];

const TONES: Record<
  Tone,
  {
    accent: string;
    soft: string;
    border: string;
    text: string;
    dot: string;
    badgeBg: string;
  }
> = {
  blue: {
    accent: "#2563eb",
    soft: "bg-blue-50 dark:bg-blue-950/20",
    border: "border-blue-200/70 dark:border-blue-900/50",
    text: "text-blue-700 dark:text-blue-300",
    dot: "bg-blue-500",
    badgeBg: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300",
  },
  emerald: {
    accent: "#059669",
    soft: "bg-emerald-50 dark:bg-emerald-950/20",
    border: "border-emerald-200/70 dark:border-emerald-900/50",
    text: "text-emerald-700 dark:text-emerald-300",
    dot: "bg-emerald-500",
    badgeBg:
      "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300",
  },
  violet: {
    accent: "#7c3aed",
    soft: "bg-violet-50 dark:bg-violet-950/20",
    border: "border-violet-200/70 dark:border-violet-900/50",
    text: "text-violet-700 dark:text-violet-300",
    dot: "bg-violet-500",
    badgeBg:
      "bg-violet-100 text-violet-800 dark:bg-violet-900/40 dark:text-violet-300",
  },
  rose: {
    accent: "#e11d48",
    soft: "bg-rose-50 dark:bg-rose-950/20",
    border: "border-rose-200/70 dark:border-rose-900/50",
    text: "text-rose-700 dark:text-rose-300",
    dot: "bg-rose-500",
    badgeBg: "bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300",
  },
  cyan: {
    accent: "#0891b2",
    soft: "bg-cyan-50 dark:bg-cyan-950/20",
    border: "border-cyan-200/70 dark:border-cyan-900/50",
    text: "text-cyan-700 dark:text-cyan-300",
    dot: "bg-cyan-500",
    badgeBg: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900/40 dark:text-cyan-300",
  },
};

export default function CdnCacheInvalidationViz() {
  const [activeStep, setActiveStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [activeInspectorTab, setActiveInspectorTab] = useState<
    "headers" | "explainer"
  >("headers");
  const reduceMotion = useReducedMotion();

  const stage = STAGES[activeStep];
  const tone = TONES[stage.tone];
  const progress = ((activeStep + 1) / STAGES.length) * 100;

  useEffect(() => {
    if (!isPlaying || reduceMotion) return;
    const timer = window.setTimeout(() => {
      setActiveStep((current) =>
        current === STAGES.length - 1 ? 0 : current + 1,
      );
    }, stage.duration);
    return () => window.clearTimeout(timer);
  }, [activeStep, isPlaying, reduceMotion, stage.duration]);

  const selectStep = useCallback((index: number) => {
    setIsPlaying(false);
    setActiveStep(index);
  }, []);

  const reset = useCallback(() => {
    setIsPlaying(false);
    setActiveStep(0);
  }, []);

  const packetTransition = reduceMotion
    ? { duration: 0 }
    : { duration: 1.4, repeat: Infinity, ease: "easeInOut" as const };

  return (
    <div className="space-y-5" data-testid="cdn-cache-invalidation-viz">
      {/* Playback Control Bar */}
      <div className="flex items-center gap-1.5 rounded-lg border border-border/70 bg-muted/30 p-1.5">
        <button
          onClick={reset}
          className="rounded-md border border-border/80 bg-card p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          aria-label="처음 단계로 초기화"
          title="초기화"
          data-testid="button-cdn-reset"
        >
          <RotateCcw size={14} />
        </button>
        <button
          onClick={() => setIsPlaying((playing) => !playing)}
          className="rounded-md bg-primary p-1.5 text-primary-foreground transition-opacity hover:opacity-90"
          aria-label={isPlaying && !reduceMotion ? "일시정지" : "재생"}
          title={isPlaying && !reduceMotion ? "일시정지" : "재생"}
          data-testid="button-cdn-play-pause"
        >
          {isPlaying && !reduceMotion ? <Pause size={14} /> : <Play size={14} />}
        </button>
        <div className="ml-auto flex min-w-[130px] items-center gap-2">
          <span className="whitespace-nowrap text-xs font-mono font-semibold text-muted-foreground">
            {activeStep + 1} / {STAGES.length}
          </span>
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
            <motion.div
              className="h-full rounded-full bg-primary"
              animate={{ width: `${progress}%` }}
              transition={{ duration: reduceMotion ? 0 : 0.35 }}
            />
          </div>
        </div>
      </div>

      {/* SVG Visualization Canvas */}
      <section
        className="overflow-hidden rounded-2xl border border-border/70 bg-card shadow-sm"
        aria-label="CDN 및 캐시 무효화 아키텍처 흐름"
      >
        <div className="flex items-center justify-between border-b border-border/60 px-4 py-3 sm:px-5">
          <div className="flex items-center gap-2">
            <Layers size={16} className={tone.text} />
            <span className="text-sm font-semibold text-foreground">
              CDN & Cache Lifecycle Topology
            </span>
          </div>
          <span
            className={`rounded-full border px-2.5 py-0.5 text-xs font-mono font-bold ${tone.soft} ${tone.border} ${tone.text}`}
          >
            {stage.badge}
          </span>
        </div>

        <div className="overflow-x-auto p-3 sm:p-4">
          <svg
            viewBox="0 0 840 315"
            className="w-full min-w-[760px] select-none font-sans"
          >
            <defs>
              <linearGradient
                id="cdn-grid-accent"
                x1="0"
                y1="0"
                x2="840"
                y2="315"
                gradientUnits="userSpaceOnUse"
              >
                <stop offset="0%" stopColor={tone.accent} stopOpacity="0.03" />
                <stop offset="100%" stopColor={tone.accent} stopOpacity="0.08" />
              </linearGradient>
              <filter
                id="node-shadow"
                x="-10%"
                y="-10%"
                width="120%"
                height="120%"
              >
                <feDropShadow
                  dx="0"
                  dy="4"
                  stdDeviation="5"
                  floodOpacity="0.07"
                />
              </filter>
              <marker
                id="arrow-head"
                markerWidth="7"
                markerHeight="7"
                refX="6"
                refY="3.5"
                orient="auto"
              >
                <polygon
                  points="0 1, 6 3.5, 0 6"
                  className="fill-slate-400 dark:fill-slate-500"
                />
              </marker>
            </defs>

            {/* Canvas Background */}
            <rect
              x="0"
              y="0"
              width="840"
              height="315"
              rx="12"
              fill="url(#cdn-grid-accent)"
            />

            {/* ======================================================== */}
            {/* NETWORK LINKS (DUAL LANE: REQUEST & RESPONSE)            */}
            {/* ======================================================== */}
            {/* Link 1: Client (x=225) <---> Edge (x=315) */}
            <g
              className={activeStep === 4 ? "opacity-35" : "opacity-100"}
            >
              {/* Upper Lane: Request (Client -> Edge) */}
              <text
                x="270"
                y="127"
                textAnchor="middle"
                className="fill-slate-400 text-[8px] font-mono select-none dark:fill-slate-500"
              >
                Request →
              </text>
              <line
                x1="225"
                y1="136"
                x2="307"
                y2="136"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeDasharray="4 4"
                markerEnd="url(#arrow-head)"
                className="text-border"
              />
              {/* Lower Lane: Response (Edge -> Client) */}
              <line
                x1="315"
                y1="174"
                x2="233"
                y2="174"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeDasharray="4 4"
                markerEnd="url(#arrow-head)"
                className="text-border"
              />
              <text
                x="270"
                y="188"
                textAnchor="middle"
                className="fill-slate-400 text-[8px] font-mono select-none dark:fill-slate-500"
              >
                ← Response
              </text>
              {/* Central Latency Badge (W: 72px) */}
              <rect
                x="234"
                y="145"
                width="72"
                height="20"
                rx="5"
                className="fill-card stroke-border"
                strokeWidth="1"
              />
              <text
                x="270"
                y="159"
                textAnchor="middle"
                className="fill-foreground text-[9px] font-mono font-bold"
              >
                {stage.rtt.clientToEdge}
              </text>
            </g>

            {/* Link 2: Edge (x=525) <---> Origin (x=615) */}
            <g
              className={
                activeStep === 1 || activeStep === 4 ? "opacity-25" : "opacity-100"
              }
            >
              {/* Upper Lane: Request (Edge -> Origin) */}
              <text
                x="570"
                y="127"
                textAnchor="middle"
                className="fill-slate-400 text-[8px] font-mono select-none dark:fill-slate-500"
              >
                Origin Fetch →
              </text>
              <line
                x1="525"
                y1="136"
                x2="607"
                y2="136"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeDasharray="4 4"
                markerEnd="url(#arrow-head)"
                className="text-border"
              />
              {/* Lower Lane: Response (Origin -> Edge) */}
              <line
                x1="615"
                y1="174"
                x2="533"
                y2="174"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeDasharray="4 4"
                markerEnd="url(#arrow-head)"
                className="text-border"
              />
              <text
                x="570"
                y="188"
                textAnchor="middle"
                className="fill-slate-400 text-[8px] font-mono select-none dark:fill-slate-500"
              >
                ← Origin Ack
              </text>
              {/* Central Latency Badge (W: 72px) */}
              <rect
                x="534"
                y="145"
                width="72"
                height="20"
                rx="5"
                className="fill-card stroke-border"
                strokeWidth="1"
              />
              <text
                x="570"
                y="159"
                textAnchor="middle"
                className="fill-foreground text-[9px] font-mono font-bold"
              >
                {stage.rtt.edgeToOrigin}
              </text>
            </g>

            {/* ======================================================== */}
            {/* NODE 1: CLIENT / BROWSER                                  */}
            {/* ======================================================== */}
            <g filter="url(#node-shadow)">
              <rect
                x="35"
                y="45"
                width="190"
                height="245"
                rx="14"
                className="fill-card stroke-border"
                strokeWidth={activeStep === 4 ? "2" : "1.5"}
                stroke={activeStep === 4 ? tone.accent : undefined}
              />
              {/* Browser Header Bar */}
              <rect
                x="35"
                y="45"
                width="190"
                height="34"
                rx="14"
                className="fill-muted/50"
              />
              <rect x="35" y="65" width="190" height="14" className="fill-muted/50" />
              <circle cx="52" cy="62" r="3.5" fill="#f87171" />
              <circle cx="63" cy="62" r="3.5" fill="#fbbf24" />
              <circle cx="74" cy="62" r="3.5" fill="#34d399" />
              <text
                x="92"
                y="65"
                className="fill-foreground text-[11px] font-bold"
              >
                Client Browser
              </text>

              {/* Browser URL bar */}
              <rect
                x="47"
                y="88"
                width="171"
                height="22"
                rx="5"
                className="fill-muted/30 stroke-border"
                strokeWidth="1"
              />
              <Globe
                x="54"
                y="93"
                size={12}
                className="text-muted-foreground"
              />
              <text
                x="72"
                y="103"
                className="fill-muted-foreground text-[9px] font-mono"
              >
                {activeStep === 4
                  ? "/assets/app.8f3a9.js"
                  : "/assets/app.js"}
              </text>

              {/* Browser Private Cache Box */}
              <rect
                x="47"
                y="120"
                width="171"
                height="80"
                rx="8"
                className="fill-card stroke-border"
                strokeWidth="1"
              />
              <g transform="translate(56, 130)">
                <HardDrive size={13} className="text-muted-foreground" />
                <text
                  x="18"
                  y="11"
                  className="fill-muted-foreground text-[10px] font-medium"
                >
                  Private Browser Cache
                </text>
              </g>

              {/* Status pill inside browser cache */}
              <rect
                x="57"
                y="156"
                width="151"
                height="28"
                rx="6"
                className={
                  activeStep === 4
                    ? "fill-cyan-50 stroke-cyan-200 dark:fill-cyan-950/40 dark:stroke-cyan-800"
                    : activeStep === 0
                      ? "fill-slate-50 stroke-slate-200 dark:fill-slate-900 dark:stroke-slate-800"
                      : "fill-emerald-50 stroke-emerald-200 dark:fill-emerald-950/40 dark:stroke-emerald-800"
                }
                strokeWidth="1"
              />
              <text
                x="132"
                y="173"
                textAnchor="middle"
                className={
                  activeStep === 4
                    ? "fill-cyan-700 text-[10px] font-mono font-bold dark:fill-cyan-300"
                    : activeStep === 0
                      ? "fill-slate-500 text-[10px] font-mono font-semibold dark:fill-slate-400"
                      : "fill-emerald-700 text-[10px] font-mono font-bold dark:fill-emerald-300"
                }
              >
                {stage.clientState.badge}
              </text>

              {/* Subtitle description */}
              <text
                x="132"
                y="226"
                textAnchor="middle"
                className="fill-muted-foreground text-[9px] font-sans"
              >
                {stage.clientState.description}
              </text>

              <text
                x="132"
                y="256"
                textAnchor="middle"
                className="fill-slate-400 text-[9px] font-mono dark:fill-slate-500"
              >
                Local Device • 0ms
              </text>
            </g>

            {/* ======================================================== */}
            {/* NODE 2: EDGE POP (CDN PROXY)                             */}
            {/* ======================================================== */}
            <g filter="url(#node-shadow)">
              <rect
                x="315"
                y="45"
                width="210"
                height="245"
                rx="14"
                className="fill-card stroke-border"
                strokeWidth={
                  activeStep === 1 || activeStep === 2 || activeStep === 3
                    ? "2.5"
                    : "1.5"
                }
                stroke={
                  activeStep === 1 || activeStep === 2 || activeStep === 3
                    ? tone.accent
                    : undefined
                }
              />
              {/* Edge POP Header (Full Width Clean Title) */}
              <rect
                x="315"
                y="45"
                width="210"
                height="42"
                rx="14"
                className="fill-muted/50"
              />
              <rect x="315" y="70" width="210" height="17" className="fill-muted/50" />
              <Globe
                x="324"
                y="57"
                size={16}
                className={tone.text}
              />
              <text
                x="348"
                y="64"
                className="fill-foreground text-[12px] font-bold"
              >
                Edge POP (CDN Anycast)
              </text>
              <text
                x="348"
                y="78"
                className="fill-muted-foreground text-[9px] font-mono"
              >
                Seoul Node • ~8ms Local RTT
              </text>

              {/* Edge Cache Engine Section */}
              <rect
                x="322"
                y="96"
                width="196"
                height="98"
                rx="8"
                className="fill-muted/20 stroke-border"
                strokeWidth="1"
              />
              <g transform="translate(332, 107)">
                <Server size={13} className="text-muted-foreground" />
                <text
                  x="18"
                  y="11"
                  className="fill-muted-foreground text-[9.5px] font-semibold"
                >
                  Shared Cache Store (NVMe SSD)
                </text>
              </g>

              {/* Cache Entry Slot */}
              <rect
                x="332"
                y="124"
                width="176"
                height="32"
                rx="6"
                className="fill-card stroke-border"
                strokeWidth="1"
              />
              <text
                x="342"
                y="138"
                className="fill-foreground text-[9.5px] font-mono font-bold"
              >
                KEY: /assets/app.js
              </text>
              <text
                x="342"
                y="149"
                className={`text-[9px] font-mono font-semibold ${
                  stage.edgeState.status === "PURGED"
                    ? "fill-rose-600 dark:fill-rose-400"
                    : stage.edgeState.status === "STALE"
                      ? "fill-violet-600 dark:fill-violet-400"
                      : stage.edgeState.status === "HIT"
                        ? "fill-emerald-600 dark:fill-emerald-400"
                        : "fill-muted-foreground"
                }`}
              >
                TAG: {stage.edgeState.tag}
              </text>

              {/* TTL Meter Bar */}
              <g transform="translate(332, 163)">
                <text
                  x="0"
                  y="9"
                  className="fill-muted-foreground text-[8.5px] font-mono"
                >
                  {stage.edgeState.ttlText}
                </text>
                <rect
                  x="0"
                  y="13"
                  width="176"
                  height="5"
                  rx="2.5"
                  className="fill-muted"
                />
                <rect
                  x="0"
                  y="13"
                  width={Math.max(
                    0,
                    Math.min(176, (176 * stage.edgeState.ttlPercent) / 100),
                  )}
                  height="5"
                  rx="2.5"
                  fill={tone.accent}
                />
              </g>

              {/* Invalidation & Purge Indicator */}
              <rect
                x="322"
                y="204"
                width="196"
                height="34"
                rx="6"
                className="fill-card stroke-border"
                strokeWidth="1"
              />
              <g transform="translate(332, 214)">
                {stage.edgeState.status === "PURGED" ? (
                  <Trash2 size={13} className="text-rose-500" />
                ) : stage.edgeState.status === "STALE" ? (
                  <RefreshCw size={13} className="text-violet-500" />
                ) : stage.edgeState.status === "IMMUTABLE" ? (
                  <Lock size={13} className="text-cyan-500" />
                ) : (
                  <Zap size={13} className={tone.text} />
                )}
                <text
                  x="20"
                  y="11"
                  className="fill-foreground text-[9px] font-medium"
                >
                  {stage.edgeState.status === "PURGED"
                    ? "Purge API: Cache Evicted"
                    : stage.edgeState.status === "STALE"
                      ? "SWR: Async Background Sync"
                      : stage.edgeState.status === "IMMUTABLE"
                        ? "Immutable: Zero Revalidation"
                        : "Origin Shielding Active"}
                </text>
              </g>

              <text
                x="420"
                y="264"
                textAnchor="middle"
                className="fill-slate-400 text-[9px] font-mono dark:fill-slate-500"
              >
                Edge Proxy Tier • Anycast VIP
              </text>
            </g>

            {/* ======================================================== */}
            {/* NODE 3: ORIGIN SERVER (CENTRAL DATACENTER)               */}
            {/* ======================================================== */}
            <g filter="url(#node-shadow)">
              <rect
                x="615"
                y="45"
                width="190"
                height="245"
                rx="14"
                className="fill-card stroke-border"
                strokeWidth={activeStep === 0 || activeStep === 3 ? "2" : "1.5"}
                stroke={
                  activeStep === 0 || activeStep === 3 ? tone.accent : undefined
                }
              />
              {/* Origin Header */}
              <rect
                x="615"
                y="45"
                width="190"
                height="42"
                rx="14"
                className="fill-muted/50"
              />
              <rect x="615" y="70" width="190" height="17" className="fill-muted/50" />
              <Server
                x="624"
                y="57"
                size={15}
                className="text-muted-foreground"
              />
              <text
                x="646"
                y="64"
                className="fill-foreground text-[11.5px] font-bold"
              >
                Origin Server (AWS/S3)
              </text>
              <text
                x="646"
                y="78"
                className="fill-muted-foreground text-[9px] font-mono"
              >
                Central Datacenter • ~180ms RTT
              </text>

              {/* Origin Status Pill */}
              <rect
                x="622"
                y="96"
                width="171"
                height="26"
                rx="6"
                className={
                  activeStep === 1 || activeStep === 4
                    ? "fill-emerald-50 stroke-emerald-200 dark:fill-emerald-950/40 dark:stroke-emerald-800"
                    : activeStep === 3
                      ? "fill-rose-50 stroke-rose-200 dark:fill-rose-950/40 dark:stroke-rose-800"
                      : "fill-blue-50 stroke-blue-200 dark:fill-blue-950/40 dark:stroke-blue-800"
                }
                strokeWidth="1"
              />
              <text
                x="707"
                y="113"
                textAnchor="middle"
                className={
                  activeStep === 1 || activeStep === 4
                    ? "fill-emerald-700 text-[9.5px] font-mono font-bold dark:fill-emerald-300"
                    : activeStep === 3
                      ? "fill-rose-700 text-[9.5px] font-mono font-bold dark:fill-rose-300"
                      : "fill-blue-700 text-[9.5px] font-mono font-bold dark:fill-blue-300"
                }
              >
                {stage.originState.status}
              </text>

              {/* Version & Storage Detail */}
              <rect
                x="622"
                y="130"
                width="171"
                height="66"
                rx="8"
                className="fill-muted/20 stroke-border"
                strokeWidth="1"
              />
              <text
                x="632"
                y="146"
                className="fill-muted-foreground text-[9.5px] font-mono font-semibold"
              >
                Active Source Version:
              </text>
              <text
                x="632"
                y="161"
                className="fill-foreground text-[10px] font-mono font-bold"
              >
                {stage.originState.version}
              </text>
              <text
                x="632"
                y="178"
                className="fill-muted-foreground text-[9px] font-mono"
              >
                Traffic: {stage.originState.traffic}
              </text>

              {/* Shielding / Region slot */}
              <rect
                x="622"
                y="204"
                width="171"
                height="34"
                rx="6"
                className="fill-card stroke-border"
                strokeWidth="1"
              />
              {activeStep === 1 || activeStep === 4 ? (
                <g transform="translate(632, 214)">
                  <ShieldCheck size={14} className="text-emerald-500" />
                  <text
                    x="20"
                    y="11"
                    className="fill-emerald-600 text-[9.5px] font-mono font-bold dark:fill-emerald-400"
                  >
                    Origin 100% Shielded
                  </text>
                </g>
              ) : (
                <g transform="translate(632, 214)">
                  <Globe size={14} className="text-muted-foreground" />
                  <text
                    x="20"
                    y="11"
                    className="fill-muted-foreground text-[9px] font-sans"
                  >
                    US-East Region (Ocean RTT)
                  </text>
                </g>
              )}

              <text
                x="707"
                y="264"
                textAnchor="middle"
                className="fill-slate-400 text-[9px] font-mono dark:fill-slate-500"
              >
                Primary Source of Truth
              </text>
            </g>

            {/* ======================================================== */}
            {/* ANIMATED PACKETS BASED ON STEP                           */}
            {/* ======================================================== */}
            {/* STEP 0: MISS -> Client -> Edge -> Origin -> Edge -> Client */}
            {activeStep === 0 && (
              <>
                {/* Client to Edge (Upper Lane Y: 136) */}
                <motion.circle
                  key="p0-req1"
                  r="5"
                  fill="#2563eb"
                  initial={{ cx: 225, cy: 136, opacity: 0 }}
                  animate={{ cx: [225, 315], cy: 136, opacity: [0, 1, 1] }}
                  transition={packetTransition}
                />
                {/* Edge to Origin (Upper Lane Y: 136) */}
                <motion.circle
                  key="p0-req2"
                  r="5"
                  fill="#d97706"
                  initial={{ cx: 525, cy: 136, opacity: 0 }}
                  animate={{ cx: [525, 615], cy: 136, opacity: [0, 1, 1] }}
                  transition={{ ...packetTransition, delay: 0.35 }}
                />
                {/* Origin Return (Lower Lane Y: 174) */}
                <motion.circle
                  key="p0-res1"
                  r="5.5"
                  fill="#059669"
                  initial={{ cx: 615, cy: 174, opacity: 0 }}
                  animate={{ cx: [615, 525], cy: 174, opacity: [0, 1, 1] }}
                  transition={{ ...packetTransition, delay: 0.7 }}
                />
                {/* Edge Return to Client (Lower Lane Y: 174) */}
                <motion.circle
                  key="p0-res2"
                  r="5.5"
                  fill="#2563eb"
                  initial={{ cx: 315, cy: 174, opacity: 0 }}
                  animate={{ cx: [315, 225], cy: 174, opacity: [0, 1, 1] }}
                  transition={{ ...packetTransition, delay: 1.05 }}
                />
              </>
            )}

            {/* STEP 1: HIT -> Client -> Edge -> Client (Instant 8ms return) */}
            {activeStep === 1 && (
              <>
                <motion.circle
                  key="p1-req"
                  r="5"
                  fill="#059669"
                  initial={{ cx: 225, cy: 136, opacity: 0 }}
                  animate={{ cx: [225, 315], cy: 136, opacity: [0, 1, 1] }}
                  transition={{ duration: 1.1, repeat: Infinity, ease: "easeOut" }}
                />
                <motion.circle
                  key="p1-res"
                  r="6"
                  fill="#059669"
                  initial={{ cx: 315, cy: 174, opacity: 0 }}
                  animate={{ cx: [315, 225], cy: 174, opacity: [0, 1, 1] }}
                  transition={{
                    duration: 1.1,
                    repeat: Infinity,
                    delay: 0.25,
                    ease: "easeOut",
                  }}
                />
              </>
            )}

            {/* STEP 2: STALE-WHILE-REVALIDATE */}
            {activeStep === 2 && (
              <>
                {/* Client gets instant stale return on lower lane */}
                <motion.circle
                  key="p2-instant"
                  r="5.5"
                  fill="#7c3aed"
                  initial={{ cx: 315, cy: 174, opacity: 0 }}
                  animate={{ cx: [315, 225], cy: 174, opacity: [0, 1, 1] }}
                  transition={{ duration: 0.9, repeat: Infinity }}
                />
                {/* Background Revalidate Ping to Origin on upper lane */}
                <motion.circle
                  key="p2-bg-ping"
                  r="4.5"
                  fill="#d97706"
                  stroke="#ffffff"
                  strokeWidth="1"
                  initial={{ cx: 525, cy: 136, opacity: 0 }}
                  animate={{ cx: [525, 615], cy: 136, opacity: [0, 1, 1] }}
                  transition={{ duration: 1.3, repeat: Infinity, delay: 0.2 }}
                />
                {/* Background 200/304 return updating Edge on lower lane */}
                <motion.circle
                  key="p2-bg-ack"
                  r="5"
                  fill="#7c3aed"
                  initial={{ cx: 615, cy: 174, opacity: 0 }}
                  animate={{ cx: [615, 525], cy: 174, opacity: [0, 1, 1] }}
                  transition={{ duration: 1.3, repeat: Infinity, delay: 0.65 }}
                />
              </>
            )}

            {/* STEP 3: PURGE API */}
            {activeStep === 3 && (
              <>
                {/* Origin / CI broadcast wave to Edge on middle lane */}
                <motion.circle
                  key="p3-purge-broadcast"
                  r="7"
                  fill="#e11d48"
                  initial={{ cx: 615, cy: 155, opacity: 0 }}
                  animate={{
                    cx: [615, 525],
                    cy: 155,
                    opacity: [0, 1, 0.9],
                    scale: [0.8, 1.25, 1],
                  }}
                  transition={{ duration: 1.1, repeat: Infinity }}
                />
                {/* Shockwave pulse over Edge POP */}
                <motion.circle
                  key="p3-pulse"
                  cx="420"
                  cy="167"
                  r="28"
                  fill="none"
                  stroke="#e11d48"
                  strokeWidth="2"
                  initial={{ scale: 0.6, opacity: 0.8 }}
                  animate={{ scale: 2.1, opacity: 0 }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                />
              </>
            )}

            {/* STEP 4: IMMUTABLE CACHE BUSTING */}
            {activeStep === 4 && (
              <>
                {/* Intercepted inside Client Browser Disk Cache (0ms) */}
                <motion.circle
                  key="p4-disk-hit"
                  cx="130"
                  cy="168"
                  r="12"
                  fill="none"
                  stroke="#0891b2"
                  strokeWidth="2.5"
                  initial={{ scale: 0.8, opacity: 0.9 }}
                  animate={{ scale: 1.35, opacity: 0 }}
                  transition={{ duration: 1.2, repeat: Infinity }}
                />
              </>
            )}
          </svg>
        </div>
      </section>

      {/* Detail State & Metric Summary */}
      <div className="space-y-4" aria-live="polite">
        <section
          className={`rounded-2xl border p-4 sm:p-5 ${tone.soft} ${tone.border}`}
          aria-label="현재 단계 상태 및 핵심 지표"
        >
          <div className="flex items-start gap-3">
            <span
              className={`mt-0.5 rounded-lg bg-card p-2 shadow-sm ${tone.text}`}
            >
              {activeStep === 3 ? (
                <Trash2 size={18} />
              ) : activeStep === 2 ? (
                <RefreshCw size={18} />
              ) : activeStep === 4 ? (
                <Lock size={18} />
              ) : activeStep === 1 ? (
                <ShieldCheck size={18} />
              ) : (
                <AlertCircle size={18} />
              )}
            </span>
            <div className="min-w-0 space-y-1">
              <div
                className={`text-xs font-mono font-bold tracking-wide ${tone.text}`}
              >
                STAGE {String(activeStep + 1).padStart(2, "0")} / 05
              </div>
              <h3 className="text-base font-bold text-foreground">
                {stage.title}
              </h3>
              <p className="text-xs leading-relaxed text-muted-foreground sm:text-sm">
                {stage.summary}
              </p>
            </div>
          </div>

          {/* Metric Pills */}
          <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {stage.metrics.map((metric) => {
              const metricTone =
                metric.status === "danger"
                  ? "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/20 dark:text-rose-300"
                  : metric.status === "warning"
                    ? "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/50 dark:bg-amber-950/20 dark:text-amber-300"
                    : metric.status === "active"
                      ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/20 dark:text-emerald-300"
                      : "border-border/70 bg-card text-foreground";
              return (
                <div
                  key={metric.label}
                  className={`min-w-0 rounded-xl border p-3 ${metricTone}`}
                >
                  <div className="mb-1 text-xs text-muted-foreground">
                    {metric.label}
                  </div>
                  <div className="truncate font-mono text-xs font-bold sm:text-sm">
                    {metric.value}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Protocol & Headers Inspector */}
        <section
          className="overflow-hidden rounded-2xl border border-border/70 bg-card"
          aria-label="HTTP 프로토콜 및 헤더 인스펙터"
        >
          <div className="flex items-center justify-between border-b border-border/60 px-4 py-2.5">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveInspectorTab("headers")}
                className={`rounded-md px-2.5 py-1 text-xs font-semibold transition-colors ${
                  activeInspectorTab === "headers"
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                HTTP Headers
              </button>
              <button
                onClick={() => setActiveInspectorTab("explainer")}
                className={`rounded-md px-2.5 py-1 text-xs font-semibold transition-colors ${
                  activeInspectorTab === "explainer"
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Cache-Control 분석
              </button>
            </div>
            <span className="rounded-md bg-muted px-2 py-0.5 font-mono text-[11px] text-muted-foreground">
              HTTP/1.1 Wire Protocol
            </span>
          </div>

          {activeInspectorTab === "headers" ? (
            <div className="grid grid-cols-1 divide-y divide-border/60 font-mono text-xs sm:grid-cols-2 sm:divide-x sm:divide-y-0">
              <div className="p-3.5 sm:p-4">
                <div className="mb-1.5 text-[11px] font-bold text-muted-foreground">
                  ► REQUEST HEADERS
                </div>
                <pre className="whitespace-pre-wrap break-words leading-5 text-foreground">
                  {stage.requestHeaders}
                </pre>
              </div>
              <div className="p-3.5 sm:p-4">
                <div className="mb-1.5 text-[11px] font-bold text-muted-foreground">
                  ◄ RESPONSE HEADERS
                </div>
                <pre className="whitespace-pre-wrap break-words leading-5 text-foreground">
                  {stage.responseHeaders}
                </pre>
              </div>
            </div>
          ) : (
            <div className="p-4 space-y-3">
              <div className="rounded-xl border border-border/70 bg-muted/20 p-3.5">
                <div className="text-xs font-bold text-muted-foreground mb-1">
                  핵심 지시어 (Directive)
                </div>
                <code className="text-sm font-mono font-bold text-primary">
                  {stage.directiveExplainer.directive}
                </code>
              </div>
              <div className="text-xs sm:text-sm leading-relaxed text-foreground">
                <strong>동작 원리: </strong>
                {stage.directiveExplainer.purpose}
              </div>
            </div>
          )}
        </section>
      </div>

      {/* 5-Step Stage Navigation Bar */}
      <nav
        className="grid grid-cols-5 gap-1.5"
        aria-label="CDN 및 캐시 무효화 수명 주기 단계 선택"
      >
        {STAGES.map((item, index) => {
          const itemTone = TONES[item.tone];
          const active = index === activeStep;
          return (
            <button
              key={item.id}
              onClick={() => selectStep(index)}
              className={`group rounded-xl border px-2 py-2 text-left transition-colors sm:px-3 ${
                active
                  ? `${itemTone.soft} ${itemTone.border}`
                  : "border-border/70 bg-card hover:bg-muted/60"
              }`}
              aria-current={active ? "step" : undefined}
              aria-label={`${index + 1}단계: ${item.title}`}
            >
              <span
                className={`mb-1 block h-1.5 rounded-full ${
                  active ? itemTone.dot : "bg-muted"
                }`}
              />
              <span
                className={`block truncate font-mono text-[10px] font-bold sm:text-xs ${
                  active ? itemTone.text : "text-muted-foreground"
                }`}
              >
                {item.badge}
              </span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
