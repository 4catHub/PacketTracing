import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Check, Pause, Play, RotateCcw, SkipBack, SkipForward } from "lucide-react";

type SceneId = "overview" | "normal" | "rising" | "limit" | "rejected" | "recovery" | "retry";
type SceneTone = "slate" | "blue" | "amber" | "rose" | "emerald";

interface Scene {
  id: SceneId;
  eyebrow: string;
  title: string;
  summary: string;
  tone: SceneTone;
  traffic: number;
  used: number;
  tokens: number;
  queue: number;
  admitted: number;
  speech: string;
  sfx?: string;
  requestStatus: string;
  backendStatus: string;
}

const SCENES: Scene[] = [
  {
    id: "overview",
    eyebrow: "TONIGHT'S DOOR POLICY",
    title: "클럽 입구가 API 트래픽을 관리합니다",
    summary: "손님은 요청, 경비원은 Rate Limiter, 입장 팔찌는 사용할 수 있는 Token입니다.",
    tone: "slate",
    traffic: 0,
    used: 0,
    tokens: 10,
    queue: 3,
    admitted: 0,
    speech: "Doors open!",
    requestStatus: "Request #11 · 아직 대기 중",
    backendStatus: "Backend · 여유",
  },
  {
    id: "normal",
    eyebrow: "01 · NORMAL TRAFFIC",
    title: "한산한 입구, 요청이 차례로 통과합니다",
    summary: "경비원이 요청마다 팔찌 하나를 소비하고 허용된 손님만 클럽 안으로 보냅니다.",
    tone: "blue",
    traffic: 3,
    used: 3,
    tokens: 7,
    queue: 3,
    admitted: 3,
    speech: "Ticket, please!",
    sfx: "DING!",
    requestStatus: "Request #11 · 줄에서 접근 중",
    backendStatus: "Backend · 편안하게 처리 중",
  },
  {
    id: "rising",
    eyebrow: "02 · TRAFFIC RISING",
    title: "줄이 길어지고 입장 속도가 빨라집니다",
    summary: "현재 트래픽은 정책 한도 아래지만, 저장된 토큰은 빠르게 줄어들고 있습니다.",
    tone: "amber",
    traffic: 9,
    used: 9,
    tokens: 1,
    queue: 6,
    admitted: 7,
    speech: "One at a time!",
    sfx: "TAP TAP!",
    requestStatus: "Request #11 · 입구 바로 앞",
    backendStatus: "Backend · 바쁘지만 정상",
  },
  {
    id: "limit",
    eyebrow: "03 · LIMIT REACHED",
    title: "10/10, 경비원이 즉시 입구를 닫습니다",
    summary: "이미 허용된 요청은 계속 처리되지만 새로운 요청은 더 이상 통과할 수 없습니다.",
    tone: "rose",
    traffic: 14,
    used: 10,
    tokens: 0,
    queue: 7,
    admitted: 10,
    speech: "Whoa! That's enough requests!",
    sfx: "WHOOSH!",
    requestStatus: "Request #11 · 토큰 확인 중",
    backendStatus: "Backend · 기존 요청만 처리",
  },
  {
    id: "rejected",
    eyebrow: "04 · HTTP 429",
    title: "빨간 후드 요청이 입구에서 반송됩니다",
    summary: "토큰이 없으므로 Gateway가 429와 Retry-After를 직접 반환합니다. Backend 호출은 없습니다.",
    tone: "rose",
    traffic: 14,
    used: 10,
    tokens: 0,
    queue: 7,
    admitted: 10,
    speech: "No token — try again soon!",
    sfx: "BONK!  429!",
    requestStatus: "Request #11 · 429 · Retry-After 3s",
    backendStatus: "Backend · 호출 없음 · 보호됨",
  },
  {
    id: "recovery",
    eyebrow: "05 · TOKEN REFILL",
    title: "팔찌가 다시 채워지는 동안 기다립니다",
    summary: "Refill clock이 고정된 속도로 토큰을 복구합니다. 거절은 영구적이지 않습니다.",
    tone: "blue",
    traffic: 2,
    used: 0,
    tokens: 4,
    queue: 3,
    admitted: 10,
    speech: "Tokens are coming back.",
    sfx: "TICK… TICK…",
    requestStatus: "Request #11 · 차분히 재시도 대기",
    backendStatus: "Backend · 부하 회복",
  },
  {
    id: "retry",
    eyebrow: "06 · RETRY SUCCESS",
    title: "같은 요청이 재시도 후 정상 입장합니다",
    summary: "새 토큰 하나를 소비한 Request #11이 200 OK를 받고 Backend로 전달됩니다.",
    tone: "emerald",
    traffic: 3,
    used: 1,
    tokens: 3,
    queue: 2,
    admitted: 11,
    speech: "You're good. Come in!",
    sfx: "200 OK!",
    requestStatus: "Request #11 · 허용 · 200 OK",
    backendStatus: "Backend · 제어된 요청 처리",
  },
];

const toneStyle: Record<SceneTone, { text: string; border: string; soft: string; solid: string; hex: string }> = {
  slate: { text: "text-muted-foreground", border: "border-border", soft: "bg-muted/50", solid: "bg-slate-500 dark:bg-slate-400", hex: "#64748b" },
  blue: { text: "text-blue-700 dark:text-blue-300", border: "border-blue-300 dark:border-blue-800", soft: "bg-blue-50 dark:bg-blue-950/30", solid: "bg-blue-500 dark:bg-blue-400", hex: "#3b82f6" },
  amber: { text: "text-amber-700 dark:text-amber-300", border: "border-amber-300 dark:border-amber-800", soft: "bg-amber-50 dark:bg-amber-950/30", solid: "bg-amber-500 dark:bg-amber-400", hex: "#f59e0b" },
  rose: { text: "text-rose-700 dark:text-rose-300", border: "border-rose-300 dark:border-rose-800", soft: "bg-rose-50 dark:bg-rose-950/30", solid: "bg-rose-500 dark:bg-rose-400", hex: "#f43f5e" },
  emerald: { text: "text-emerald-700 dark:text-emerald-300", border: "border-emerald-300 dark:border-emerald-800", soft: "bg-emerald-50 dark:bg-emerald-950/30", solid: "bg-emerald-500 dark:bg-emerald-400", hex: "#10b981" },
};

const customerColors = ["#3b82f6", "#f59e0b", "#8b5cf6", "#10b981", "#06b6d4", "#ec4899"];

function useCompactScene() {
  const [compact, setCompact] = useState(false);
  useEffect(() => {
    const media = window.matchMedia("(max-width: 640px)");
    const sync = () => setCompact(media.matches);
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);
  return compact;
}

function PlaybackBar({ frame, playing, onReset, onPrevious, onToggle, onNext }: { frame: number; playing: boolean; onReset: () => void; onPrevious: () => void; onToggle: () => void; onNext: () => void }) {
  const total = SCENES.length - 1;
  return (
    <div className="flex h-11 min-w-0 items-center gap-3 overflow-hidden rounded-xl border border-border bg-card px-3 shadow-sm">
      <div className="flex items-center gap-0.5">
        <button type="button" onClick={onReset} aria-label="전체 장면으로 초기화" title="전체 장면으로 초기화" className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"><RotateCcw size={15} aria-hidden="true" /></button>
        <button type="button" onClick={onPrevious} disabled={frame === 0} aria-label="이전 장면" title="이전 장면" className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-30"><SkipBack size={15} aria-hidden="true" /></button>
        <button type="button" onClick={onToggle} aria-label={playing ? "일시정지" : "재생"} title={playing ? "일시정지" : "재생"} className="rounded-md p-1.5 text-primary transition-colors hover:bg-primary/10">{playing ? <Pause size={17} fill="currentColor" aria-hidden="true" /> : <Play size={17} fill="currentColor" aria-hidden="true" />}</button>
        <button type="button" onClick={onNext} disabled={frame === total} aria-label="다음 장면" title="다음 장면" className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-30"><SkipForward size={15} aria-hidden="true" /></button>
      </div>
      <div className="relative h-1.5 flex-1 overflow-hidden rounded-full bg-muted" role="progressbar" aria-label="클럽 입장 흐름 진행률" aria-valuemin={0} aria-valuemax={total} aria-valuenow={frame}>
        <motion.div className="absolute inset-y-0 left-0 rounded-full bg-primary" animate={{ width: `${frame === 0 ? 0 : (frame / total) * 100}%` }} transition={{ duration: 0.2 }} />
      </div>
      <span className="min-w-[46px] text-right text-[11px] font-semibold text-muted-foreground">{frame === 0 ? "전체" : `${frame}/${total}`}</span>
    </div>
  );
}

function SpeechBubble({ x, y, width, text, tone }: { x: number; y: number; width: number; text: string; tone: SceneTone }) {
  const color = toneStyle[tone].hex;
  return (
    <g>
      <rect x={x} y={y} width={width} height="42" rx="15" className="fill-card" stroke={color} strokeWidth="2.5" />
      <path d={`M ${x + 28} ${y + 40} l -9 15 l 23 -13`} className="fill-card" stroke={color} strokeWidth="2.5" strokeLinejoin="round" />
      <rect x={x + 18} y={y + 37} width="28" height="8" className="fill-card" />
      <text x={x + width / 2} y={y + 26} textAnchor="middle" fill={color} fontSize="10" fontWeight="800">{text}</text>
    </g>
  );
}

function ComicCustomer({ id, x, y, color, hoodie = false, pose = "walk", label, reducedMotion, opacity = 1, scale = 1 }: { id: string; x: number; y: number; color: string; hoodie?: boolean; pose?: "walk" | "watch" | "excited" | "bounce" | "wait" | "dance"; label?: string; reducedMotion: boolean; opacity?: number; scale?: number }) {
  const arm = pose === "excited" || pose === "dance" ? { left: "M -9 8 L -21 -7", right: "M 9 8 L 21 -8" }
    : pose === "bounce" ? { left: "M -8 8 L -24 4", right: "M 8 8 L 24 3" }
      : pose === "watch" ? { left: "M -8 8 L 3 13", right: "M 8 8 L 1 14" }
        : { left: "M -8 8 L -17 20", right: "M 8 8 L 17 19" };
  const leg = pose === "wait" ? { left: "M -5 28 L -16 31", right: "M 5 28 L 15 31" }
    : pose === "dance" ? { left: "M -5 28 L -14 39", right: "M 5 28 L 16 34" }
      : { left: "M -5 28 L -10 41", right: "M 5 28 L 11 41" };
  return (
    <motion.g
      key={id}
      data-character-id={id}
      initial={false}
      animate={{ x, y, opacity, scale, rotate: pose === "bounce" ? -16 : 0 }}
      transition={{ duration: reducedMotion ? 0 : 0.65, type: "spring", stiffness: 105, damping: 17 }}
      style={{ transformOrigin: "0px 20px" }}
    >
      {label && <><rect x="-34" y="-42" width="68" height="18" rx="6" className="fill-card stroke-border" /><text y="-29" textAnchor="middle" className="fill-foreground text-[8px] font-bold">{label}</text></>}
      {hoodie && <circle cy="-4" r="15" fill={color} opacity=".95" />}
      <circle cy="-7" r="10" fill="#f5cfa9" className="stroke-slate-700 dark:stroke-slate-300" strokeWidth="1.5" />
      <path d="M -9 -10 Q 0 -20 9 -10" fill={hoodie ? color : "#334155"} />
      <circle cx="-3.5" cy="-7" r="1.1" className="fill-slate-800" /><circle cx="3.5" cy="-7" r="1.1" className="fill-slate-800" />
      <path d={pose === "bounce" ? "M -4 -1 Q 0 -5 4 -1" : "M -4 -2 Q 0 2 4 -2"} fill="none" className="stroke-slate-700" strokeWidth="1.2" strokeLinecap="round" />
      <path d="M -12 4 Q 0 -2 12 4 L 10 28 L -10 28 Z" fill={color} />
      {hoodie && <><path d="M -6 4 Q 0 9 6 4" fill="none" stroke="white" strokeOpacity=".55" strokeWidth="1.5" /><line x1="-3" y1="8" x2="-3" y2="15" stroke="white" strokeOpacity=".7" /><line x1="3" y1="8" x2="3" y2="15" stroke="white" strokeOpacity=".7" /></>}
      <path d={arm.left} fill="none" stroke={color} strokeWidth="5" strokeLinecap="round" /><path d={arm.right} fill="none" stroke={color} strokeWidth="5" strokeLinecap="round" />
      <path d={leg.left} fill="none" className="stroke-slate-600 dark:stroke-slate-300" strokeWidth="4" strokeLinecap="round" /><path d={leg.right} fill="none" className="stroke-slate-600 dark:stroke-slate-300" strokeWidth="4" strokeLinecap="round" />
      {pose === "watch" && <circle cx="2" cy="13" r="3.5" className="fill-card stroke-amber-500" strokeWidth="1.5" />}
      {(hoodie || pose === "walk") && <><rect x="11" y="16" width="13" height="9" rx="2" className="fill-card" stroke={color} strokeWidth="1.5" /><text x="17.5" y="22.5" textAnchor="middle" fill={color} fontSize="4.5" fontWeight="800">API</text></>}
    </motion.g>
  );
}

function Bouncer({ x, y, scene, compact }: { x: number; y: number; scene: Scene; compact: boolean }) {
  const barrier = scene.id === "limit" || scene.id === "rejected";
  const busy = scene.id === "rising" || barrier;
  const armSpan = compact ? 62 : 72;
  return (
    <g transform={`translate(${x} ${y})`}>
      <circle cy="-22" r="14" fill="#d8a47f" className="stroke-slate-800 dark:stroke-slate-200" strokeWidth="2" />
      <path d="M -13 -25 Q 0 -38 13 -25" className="fill-slate-800 dark:fill-slate-200" />
      <rect x="-20" y="-6" width="40" height="49" rx="12" className="fill-slate-800 dark:fill-slate-200" />
      <path d="M -8 -5 L 0 6 L 8 -5" fill="none" className="stroke-card" strokeWidth="3" />
      <circle cy="16" r="4" fill={barrier ? "#f43f5e" : "#10b981"} />
      {barrier ? <><line x1={-armSpan} y1="4" x2="-18" y2="9" className="stroke-slate-800 dark:stroke-slate-200" strokeWidth="10" strokeLinecap="round" /><line x1="18" y1="9" x2={armSpan} y2="4" className="stroke-slate-800 dark:stroke-slate-200" strokeWidth="10" strokeLinecap="round" /></> : <><line x1="-18" y1="5" x2="-30" y2="29" className="stroke-slate-800 dark:stroke-slate-200" strokeWidth="9" strokeLinecap="round" /><line x1="18" y1="5" x2="30" y2="29" className="stroke-slate-800 dark:stroke-slate-200" strokeWidth="9" strokeLinecap="round" /></>}
      <line x1="-8" y1="42" x2="-12" y2="66" className="stroke-slate-700 dark:stroke-slate-300" strokeWidth="7" strokeLinecap="round" /><line x1="8" y1="42" x2="12" y2="66" className="stroke-slate-700 dark:stroke-slate-300" strokeWidth="7" strokeLinecap="round" />
      {busy && <><path d="M 21 -30 Q 31 -20 22 -13 Q 14 -21 21 -30" fill="#38bdf8" /><path d="M 31 -19 Q 38 -12 32 -6 Q 25 -12 31 -19" fill="#38bdf8" opacity=".7" /></>}
    </g>
  );
}

function Bartender({ x, y, nervous }: { x: number; y: number; nervous: boolean }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <circle cy="-17" r="10" fill="#efc39f" className="stroke-slate-700 dark:stroke-slate-300" strokeWidth="1.5" />
      <path d="M -10 -19 Q 0 -30 10 -19" className="fill-slate-700 dark:fill-slate-300" />
      <path d="M -14 -3 L 14 -3 L 11 34 L -11 34 Z" className="fill-violet-500 dark:fill-violet-400" />
      <path d="M -8 2 L 0 11 L 8 2 L 9 28 L -9 28 Z" className="fill-card" />
      <circle cx="-3" cy="-17" r="1" className="fill-slate-800" /><circle cx="3" cy="-17" r="1" className="fill-slate-800" />
      <path d={nervous ? "M -4 -10 Q 0 -14 4 -10" : "M -4 -11 Q 0 -7 4 -11"} fill="none" className="stroke-slate-700" strokeWidth="1.2" />
      {nervous && <path d="M 13 -25 Q 21 -17 14 -11 Q 8 -18 13 -25" fill="#38bdf8" />}
    </g>
  );
}

function TokenDispenser({ x, y, tokens, compact, refill }: { x: number; y: number; tokens: number; compact: boolean; refill: boolean }) {
  const width = compact ? 166 : 134;
  return (
    <g transform={`translate(${x} ${y})`}>
      <rect width={width} height="92" rx="14" className="fill-card stroke-border" strokeWidth="2" />
      <text x={width / 2} y="19" textAnchor="middle" className="fill-muted-foreground text-[8px] font-bold tracking-wider">REQUEST TOKENS</text>
      <text x={width / 2} y="36" textAnchor="middle" className="fill-foreground text-[10px] font-black">{tokens} / 10 AVAILABLE</text>
      {Array.from({ length: 10 }, (_, index) => {
        const col = index % 5;
        const row = Math.floor(index / 5);
        const filled = index < tokens;
        return <rect key={index} x={14 + col * ((width - 28) / 5)} y={50 + row * 20} width="16" height="8" rx="4" fill="none" stroke={filled ? "#3b82f6" : "#94a3b8"} strokeWidth="3" opacity={filled ? 1 : 0.25} />;
      })}
      {refill && <motion.text x={width - 8} y="-10" textAnchor="end" fill="#3b82f6" fontSize="9" fontWeight="900" animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1.1, repeat: Infinity }}>+2 / sec</motion.text>}
    </g>
  );
}

function CounterBoard({ x, y, scene, compact }: { x: number; y: number; scene: Scene; compact: boolean }) {
  const width = compact ? 260 : 212;
  const limitReached = scene.used >= 10;
  return (
    <g transform={`translate(${x} ${y})`}>
      <rect width={width} height="74" rx="14" className="fill-slate-900 dark:fill-slate-950 stroke-slate-700" strokeWidth="2" />
      <text x="16" y="19" fill="#94a3b8" fontSize="8" fontWeight="800" letterSpacing="1.5">DOOR POLICY · 10 REQ / SEC</text>
      <text x="16" y="43" fill={limitReached ? "#fb7185" : scene.used >= 8 ? "#fbbf24" : "#60a5fa"} fontSize="20" fontWeight="900">{scene.used} / 10</text>
      <text x={width - 14} y="41" textAnchor="end" fill="#cbd5e1" fontSize="8" fontWeight="700">TRAFFIC {scene.traffic} req/s</text>
      <rect x="16" y="56" width={width - 32} height="6" rx="3" fill="#334155" />
      <rect x="16" y="56" width={(width - 32) * Math.min(scene.used / 10, 1)} height="6" rx="3" fill={limitReached ? "#f43f5e" : scene.used >= 8 ? "#f59e0b" : "#3b82f6"} />
    </g>
  );
}

function regularPositions(scene: Scene, compact: boolean) {
  const visible = scene.queue;
  if (compact) {
    const points = [{ x: 110, y: 212 }, { x: 190, y: 212 }, { x: 270, y: 212 }, { x: 350, y: 212 }, { x: 430, y: 212 }, { x: 510, y: 212 }];
    return points.map((point, index) => ({ ...point, visible: index < Math.min(visible, 6), pose: index === 2 && scene.id === "rising" ? "watch" as const : index === 4 && scene.id === "rising" ? "excited" as const : "walk" as const }));
  }
  const points = [{ x: 468, y: 350 }, { x: 407, y: 350 }, { x: 346, y: 350 }, { x: 285, y: 350 }, { x: 224, y: 350 }, { x: 163, y: 350 }];
  return points.map((point, index) => ({ ...point, visible: index < Math.min(visible, 6), pose: index === 2 && scene.id === "rising" ? "watch" as const : index === 4 && scene.id === "rising" ? "excited" as const : "walk" as const }));
}

function redHoodState(scene: Scene, compact: boolean) {
  const desktop: Record<SceneId, { x: number; y: number; pose: "walk" | "bounce" | "wait" | "dance"; opacity: number }> = {
    overview: { x: 110, y: 355, pose: "walk", opacity: 1 },
    normal: { x: 175, y: 355, pose: "walk", opacity: 1 },
    rising: { x: 430, y: 355, pose: "walk", opacity: 1 },
    limit: { x: 515, y: 355, pose: "walk", opacity: 1 },
    rejected: { x: 405, y: 304, pose: "bounce", opacity: 1 },
    recovery: { x: 330, y: 384, pose: "wait", opacity: 1 },
    retry: { x: 746, y: 344, pose: "dance", opacity: 1 },
  };
  const mobile: Record<SceneId, { x: number; y: number; pose: "walk" | "bounce" | "wait" | "dance"; opacity: number }> = {
    overview: { x: 80, y: 212, pose: "walk", opacity: 1 },
    normal: { x: 145, y: 212, pose: "walk", opacity: 1 },
    rising: { x: 500, y: 212, pose: "walk", opacity: 1 },
    limit: { x: 350, y: 326, pose: "walk", opacity: 1 },
    rejected: { x: 250, y: 270, pose: "bounce", opacity: 1 },
    recovery: { x: 210, y: 230, pose: "wait", opacity: 1 },
    retry: { x: 350, y: 710, pose: "dance", opacity: 1 },
  };
  return (compact ? mobile : desktop)[scene.id];
}

function BackendThought({ compact }: { compact: boolean }) {
  const x = compact ? 412 : 812;
  const y = compact ? 570 : 156;
  return (
    <motion.g initial={false} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.28 }} style={{ transformOrigin: `${x}px ${y}px` }}>
      <circle cx={x - 36} cy={y + 80} r="6" className="fill-card stroke-rose-400" /><circle cx={x - 19} cy={y + 61} r="9" className="fill-card stroke-rose-400" />
      <rect x={x} y={y} width={compact ? 205 : 155} height="70" rx="20" className="fill-card stroke-rose-400" strokeWidth="2" />
      <text x={x + (compact ? 102 : 77)} y={y + 19} textAnchor="middle" fill="#f43f5e" fontSize="8" fontWeight="900">WITHOUT THE BOUNCER…</text>
      <text x={x + (compact ? 102 : 77)} y={y + 43} textAnchor="middle" className="fill-foreground" fontSize="10" fontWeight="800">PANIC! · OVERHEAT!</text>
      <text x={x + (compact ? 102 : 77)} y={y + 59} textAnchor="middle" fill="#f43f5e" fontSize="12" fontWeight="900">SERVER DOWN</text>
    </motion.g>
  );
}

function DesktopEnvironment({ scene, reducedMotion }: { scene: Scene; reducedMotion: boolean }) {
  const positions = regularPositions(scene, false);
  const red = redHoodState(scene, false);
  const blocked = scene.id === "limit" || scene.id === "rejected";
  const nervous = scene.id === "rising" || scene.id === "limit";
  return (
    <svg viewBox="0 0 1000 520" className="hidden w-full sm:block" role="img" aria-label={`나이트클럽으로 표현한 API Gateway Rate Limiting: ${scene.title}`}>
      <rect width="1000" height="520" className="fill-background" />
      <rect x="0" y="420" width="1000" height="100" className="fill-muted/45" />
      <path d="M 0 420 H 1000" className="stroke-border" strokeWidth="3" />
      <path d="M 50 472 H 480 M 720 472 H 950" className="stroke-border" strokeWidth="2" strokeDasharray="22 16" />

      <rect x="622" y="54" width="354" height="366" rx="24" className="fill-muted/35 stroke-border" strokeWidth="2" />
      <rect x="570" y="138" width="104" height="282" rx="12" className="fill-slate-900 dark:fill-slate-950 stroke-slate-700" strokeWidth="3" />
      <rect x="593" y="198" width="58" height="222" rx="8" className="fill-slate-800 stroke-slate-600" strokeWidth="2" />
      <circle cx="640" cy="307" r="3" fill="#fbbf24" />
      <rect x="556" y="78" width="132" height="48" rx="14" className="fill-slate-900 dark:fill-slate-950 stroke-violet-500" strokeWidth="2" />
      <text x="622" y="98" textAnchor="middle" fill="#a78bfa" fontSize="8" fontWeight="800" letterSpacing="2">API GATEWAY</text>
      <text x="622" y="116" textAnchor="middle" fill="white" fontSize="15" fontWeight="900">THE THROTTLE</text>

      <path d="M 25 420 L 525 420" className="stroke-slate-400 dark:stroke-slate-700" strokeWidth="2" />
      <line x1="432" y1="374" x2="432" y2="420" className="stroke-rose-500" strokeWidth="6" /><line x1="522" y1="374" x2="522" y2="420" className="stroke-rose-500" strokeWidth="6" /><path d="M 432 382 Q 477 399 522 382" fill="none" className="stroke-rose-500" strokeWidth="5" />

      <CounterBoard x={24} y={24} scene={scene} compact={false} />
      <TokenDispenser x={405} y={88} tokens={scene.tokens} compact={false} refill={scene.id === "recovery"} />
      <Bouncer x={535} y={325} scene={scene} compact={false} />
      <SpeechBubble x={310} y={208} width={230} text={scene.speech} tone={scene.tone} />

      <rect x="694" y="360" width="248" height="60" rx="12" className="fill-card stroke-border" strokeWidth="2" />
      <line x1="718" y1="344" x2="718" y2="370" className="stroke-blue-500" strokeWidth="5" /><line x1="744" y1="336" x2="744" y2="370" className="stroke-emerald-500" strokeWidth="5" /><line x1="770" y1="348" x2="770" y2="370" className="stroke-violet-500" strokeWidth="5" />
      <text x="818" y="396" textAnchor="middle" className="fill-muted-foreground text-[8px] font-bold tracking-wider">BACKEND API · CLUB STAFF</text>
      <Bartender x={810} y={323} nervous={nervous} /><Bartender x={900} y={323} nervous={nervous} />

      {Array.from({ length: Math.min(scene.admitted, 5) }, (_, index) => <ComicCustomer key={`inside-${index}`} id={`inside-${index}`} x={700 + index * 52} y={238 + (index % 2) * 38} color={customerColors[index % customerColors.length]} pose="dance" reducedMotion={reducedMotion} scale={0.82} />)}
      {positions.map((position, index) => <ComicCustomer key={`queue-${index}`} id={`queue-${index}`} x={position.x} y={position.y} color={customerColors[index]} pose={position.pose} reducedMotion={reducedMotion} opacity={position.visible ? 1 : 0} />)}
      <ComicCustomer id="red-hoodie" x={red.x} y={red.y} color="#ef4444" hoodie pose={red.pose} label={scene.id === "retry" ? "200 OK" : scene.id === "rejected" ? "429 · Request #11" : "Request #11"} reducedMotion={reducedMotion} opacity={red.opacity} scale={scene.id === "retry" ? 0.9 : 1} />

      {blocked && <><line x1="568" y1="222" x2="568" y2="414" stroke="#f43f5e" strokeWidth="7" strokeDasharray="12 8" /><rect x="535" y="148" width="160" height="32" rx="9" fill="#f43f5e" /><text x="615" y="169" textAnchor="middle" fill="white" fontSize="10" fontWeight="900">RATE LIMIT REACHED</text></>}
      {scene.id === "rejected" && <><path d="M 445 273 l 18 -8 l -7 18 l 19 4 l -18 9 l 7 18 l -19 -5 l -7 18 l -7 -19 l -19 6 l 8 -19 l -18 -8 l 19 -4 l -7 -18 l 18 8 Z" fill="#fbbf24" opacity=".85" /><text x="398" y="242" fill="#f43f5e" fontSize="23" fontWeight="1000" transform="rotate(-9 398 242)">BONK!</text><path d="M 366 285 h -42 M 374 302 h -62 M 382 319 h -39" className="stroke-rose-400" strokeWidth="4" strokeLinecap="round" /></>}
      {scene.id === "limit" && <BackendThought compact={false} />}
      {scene.sfx && scene.id !== "rejected" && <motion.text key={scene.id} x="270" y="92" fill={toneStyle[scene.tone].hex} fontSize="22" fontWeight="1000" transform="rotate(-6 270 92)" initial={false} animate={{ opacity: 1, scale: 1 }}>{scene.sfx}</motion.text>}
      <text x="26" y="505" className="fill-muted-foreground text-[8px] font-bold tracking-wider">CLIENT SIDEWALK</text><text x="622" y="505" textAnchor="middle" className="fill-muted-foreground text-[8px] font-bold tracking-wider">FRONT DOOR</text><text x="972" y="505" textAnchor="end" className="fill-muted-foreground text-[8px] font-bold tracking-wider">CLUB INTERIOR · BACKEND</text>
    </svg>
  );
}

function CompactEnvironment({ scene, reducedMotion }: { scene: Scene; reducedMotion: boolean }) {
  const positions = regularPositions(scene, true);
  const red = redHoodState(scene, true);
  const blocked = scene.id === "limit" || scene.id === "rejected";
  const nervous = scene.id === "rising" || scene.id === "limit";
  return (
    <svg viewBox="0 0 700 840" className="block w-full sm:hidden" role="img" aria-label={`나이트클럽으로 표현한 API Gateway Rate Limiting: ${scene.title}`}>
      <rect width="700" height="840" className="fill-background" />
      <CounterBoard x={24} y={22} scene={scene} compact />
      <TokenDispenser x={510} y={20} tokens={scene.tokens} compact refill={scene.id === "recovery"} />
      <text x="28" y="135" className="fill-muted-foreground text-[9px] font-bold tracking-wider">CLIENT SIDEWALK · REQUEST QUEUE</text>
      <line x1="24" y1="282" x2="676" y2="282" className="stroke-border" strokeWidth="3" />
      {positions.map((position, index) => <ComicCustomer key={`queue-${index}`} id={`queue-${index}`} x={position.x} y={position.y} color={customerColors[index]} pose={position.pose} reducedMotion={reducedMotion} opacity={position.visible ? 1 : 0} scale={0.88} />)}

      <rect x="58" y="338" width="584" height="220" rx="26" className="fill-muted/30 stroke-border" strokeWidth="2" />
      <rect x="292" y="318" width="116" height="240" rx="13" className="fill-slate-900 dark:fill-slate-950 stroke-slate-700" strokeWidth="3" />
      <rect x="318" y="390" width="64" height="168" rx="8" className="fill-slate-800 stroke-slate-600" />
      <rect x="274" y="300" width="152" height="43" rx="13" className="fill-slate-900 dark:fill-slate-950 stroke-violet-500" strokeWidth="2" /><text x="350" y="317" textAnchor="middle" fill="#a78bfa" fontSize="7" fontWeight="800" letterSpacing="1.5">API GATEWAY</text><text x="350" y="333" textAnchor="middle" fill="white" fontSize="12" fontWeight="900">THE THROTTLE</text>
      <Bouncer x={220} y={445} scene={scene} compact />
      <SpeechBubble x={410} y={386} width={212} text={scene.speech} tone={scene.tone} />
      {blocked && <><line x1="275" y1="318" x2="425" y2="318" stroke="#f43f5e" strokeWidth="7" strokeDasharray="12 8" /><rect x="270" y="274" width="160" height="30" rx="9" fill="#f43f5e" /><text x="350" y="294" textAnchor="middle" fill="white" fontSize="10" fontWeight="900">RATE LIMIT REACHED</text></>}

      <rect x="58" y="612" width="584" height="196" rx="26" className="fill-muted/35 stroke-border" strokeWidth="2" />
      <text x="82" y="642" className="fill-muted-foreground text-[9px] font-bold tracking-wider">CLUB INTERIOR · PROTECTED BACKEND API</text>
      <rect x="92" y="747" width="516" height="42" rx="10" className="fill-card stroke-border" /><Bartender x={500} y={725} nervous={nervous} /><Bartender x={570} y={725} nervous={nervous} />
      {Array.from({ length: Math.min(scene.admitted, 4) }, (_, index) => <ComicCustomer key={`inside-${index}`} id={`inside-${index}`} x={110 + index * 74} y={710 + (index % 2) * 28} color={customerColors[index]} pose="dance" reducedMotion={reducedMotion} scale={0.8} />)}
      <ComicCustomer id="red-hoodie" x={red.x} y={red.y} color="#ef4444" hoodie pose={red.pose} label={scene.id === "retry" ? "200 OK" : scene.id === "rejected" ? "429 · Request #11" : "Request #11"} reducedMotion={reducedMotion} opacity={red.opacity} scale={scene.id === "retry" ? 0.9 : 1} />
      {scene.id === "rejected" && <><path d="M 298 254 l 18 -8 l -7 18 l 19 4 l -18 9 l 7 18 l -19 -5 l -7 18 l -7 -19 l -19 6 l 8 -19 l -18 -8 l 19 -4 l -7 -18 l 18 8 Z" fill="#fbbf24" /><text x="330" y="250" fill="#f43f5e" fontSize="22" fontWeight="1000">BONK!</text></>}
      {scene.id === "limit" && <BackendThought compact />}
      {scene.sfx && scene.id !== "rejected" && <motion.text key={scene.id} x="450" y="150" fill={toneStyle[scene.tone].hex} fontSize="20" fontWeight="1000" transform="rotate(-5 450 150)" initial={false} animate={{ opacity: 1, scale: 1 }}>{scene.sfx}</motion.text>}
    </svg>
  );
}

function StoryTrace({ activeIndex, scene }: { activeIndex: number; scene: Scene }) {
  const steps = SCENES.slice(1);
  return (
    <div className="border-t border-border bg-card px-4 py-4 sm:px-5">
      <div className="grid grid-cols-3 gap-1.5 sm:grid-cols-6" aria-label="Request #11 실행 추적">
        {steps.map((step, index) => {
          const stepIndex = index + 1;
          const active = activeIndex === stepIndex;
          const passed = activeIndex > stepIndex;
          return (
            <div key={step.id} className={`min-w-0 rounded-lg border px-2 py-2 transition-colors ${active ? `${toneStyle[step.tone].border} ${toneStyle[step.tone].soft}` : passed ? "border-border bg-muted/40" : "border-dashed border-border bg-card"}`}>
              <div className="flex items-center gap-1.5">
                <span className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[8px] font-black ${active ? `${toneStyle[step.tone].solid} text-white` : passed ? "bg-muted text-muted-foreground" : "border border-border text-muted-foreground"}`}>{passed ? <Check size={9} aria-hidden="true" /> : index + 1}</span>
                <span className={`truncate text-[8px] font-bold tracking-wide ${active ? toneStyle[step.tone].text : "text-muted-foreground"}`}>{step.id.toUpperCase()}</span>
              </div>
              <div className="mt-1 truncate text-[9px] font-semibold text-foreground">{step.title}</div>
            </div>
          );
        })}
      </div>
      <div className="mt-3 grid gap-2 text-[10px] sm:grid-cols-2">
        <div className={`rounded-lg border px-3 py-2 font-semibold ${toneStyle[scene.tone].border} ${toneStyle[scene.tone].soft} ${toneStyle[scene.tone].text}`}>{scene.requestStatus}</div>
        <div className={`rounded-lg border border-border px-3 py-2 font-semibold ${scene.id === "rejected" ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300" : "bg-muted/35 text-foreground"}`}>{scene.backendStatus}</div>
      </div>
    </div>
  );
}

function ComicStage({ scene, activeIndex }: { scene: Scene; activeIndex: number }) {
  const compact = useCompactScene();
  const reducedMotion = useReducedMotion() ?? false;
  return (
    <section className="min-w-0 overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
      <div className="flex flex-col gap-2 border-b border-border px-4 py-4 sm:flex-row sm:items-end sm:justify-between sm:px-5">
        <div>
          <div className={`text-[10px] font-black tracking-[0.18em] ${toneStyle[scene.tone].text}`}>{scene.eyebrow}</div>
          <h3 className="mt-1 text-base font-bold text-foreground">{scene.title}</h3>
          <p className="mt-1 max-w-2xl text-xs leading-relaxed text-muted-foreground">{scene.summary}</p>
        </div>
        <span className={`w-fit rounded-full border px-2.5 py-1 font-mono text-[10px] font-bold ${toneStyle[scene.tone].border} ${toneStyle[scene.tone].soft} ${toneStyle[scene.tone].text}`}>TOKENS {scene.tokens}/10</span>
      </div>
      <div className="relative bg-muted/15">
        {compact ? <CompactEnvironment scene={scene} reducedMotion={reducedMotion} /> : <DesktopEnvironment scene={scene} reducedMotion={reducedMotion} />}
      </div>
      <StoryTrace activeIndex={activeIndex} scene={scene} />
    </section>
  );
}

export default function ApiGatewayViz() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [playing, setPlaying] = useState(true);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scene = SCENES[activeIndex];

  useEffect(() => {
    if (timer.current) clearTimeout(timer.current);
    if (!playing) return;
    timer.current = setTimeout(() => setActiveIndex((current) => current >= SCENES.length - 1 ? 0 : current + 1), activeIndex === 0 ? 2800 : 4000);
    return () => { if (timer.current) clearTimeout(timer.current); };
  }, [activeIndex, playing]);

  return (
    <div className="flex w-full min-w-0 max-w-full flex-col gap-3 overflow-hidden py-1 font-sans">
      <PlaybackBar
        frame={activeIndex}
        playing={playing}
        onReset={() => { setActiveIndex(0); setPlaying(false); }}
        onPrevious={() => { setActiveIndex((current) => Math.max(0, current - 1)); setPlaying(false); }}
        onToggle={() => setPlaying((current) => !current)}
        onNext={() => { setActiveIndex((current) => Math.min(SCENES.length - 1, current + 1)); setPlaying(false); }}
      />
      <ComicStage scene={scene} activeIndex={activeIndex} />
    </div>
  );
}
