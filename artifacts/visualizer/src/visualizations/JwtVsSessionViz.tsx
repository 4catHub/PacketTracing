import { useEffect, useId, useMemo, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { AlertTriangle, Check, GitCompareArrows, Pause, Play, ShieldCheck, X } from "lucide-react";

type ScenarioId = "pure" | "revocation";
type Tone = "blue" | "green" | "amber" | "rose" | "slate";
type Message = { beat: number; from: number; to: number; y: number; label: string; tone: Tone; state?: boolean };
type Frame = { title: string; summary: string; session: readonly string[]; jwt: readonly string[]; sessionOutcome: string; jwtOutcome: string; difference: string };
type Scenario = { label: string; description: string; badge: string; frames: Frame[]; jwtMessages: Message[] };

const palette: Record<Tone, { stroke: string; text: string; fill: string }> = {
  blue: { stroke: "#3b82f6", text: "#1d4ed8", fill: "#dbeafe" },
  green: { stroke: "#10b981", text: "#047857", fill: "#d1fae5" },
  amber: { stroke: "#f59e0b", text: "#b45309", fill: "#fef3c7" },
  rose: { stroke: "#f43f5e", text: "#be123c", fill: "#ffe4e6" },
  slate: { stroke: "#64748b", text: "#475569", fill: "#f1f5f9" },
};
const sessionLanes = ["CLIENT", "AUTH SERVER", "SESSION STORE", "RESOURCE"];
const jwtLanes = ["CLIENT", "AUTH SERVER", "AUTH STATE", "RESOURCE"];

const sessionMessages: Message[] = [
  { beat: 0, from: 0, to: 1, y: 100, label: "ID / PW", tone: "blue" },
  { beat: 1, from: 1, to: 2, y: 128, label: "create session", tone: "amber", state: true },
  { beat: 1, from: 1, to: 0, y: 152, label: "Set-Cookie: sid", tone: "green" },
  { beat: 2, from: 0, to: 3, y: 184, label: "Cookie: sid", tone: "blue" },
  { beat: 2, from: 3, to: 2, y: 208, label: "lookup sid", tone: "amber" },
  { beat: 2, from: 2, to: 3, y: 232, label: "valid session", tone: "green" },
  { beat: 2, from: 3, to: 0, y: 256, label: "200 OK", tone: "green" },
  { beat: 3, from: 0, to: 1, y: 296, label: "logout", tone: "blue" },
  { beat: 3, from: 1, to: 2, y: 320, label: "delete session", tone: "rose", state: true },
  { beat: 4, from: 0, to: 3, y: 352, label: "stale sid", tone: "amber" },
  { beat: 4, from: 3, to: 2, y: 376, label: "lookup sid", tone: "amber" },
  { beat: 4, from: 2, to: 3, y: 400, label: "missing", tone: "rose" },
  { beat: 4, from: 3, to: 0, y: 424, label: "401 denied", tone: "rose" },
];

const shared = [
  { title: "로그인 요청", summary: "같은 자격 증명을 인증 서버에 보냅니다. 아직 어느 쪽도 로그인 상태를 만들지 않았습니다.", session: ["SIGNED OUT", "READY", "EMPTY", "ANON"], sessionOutcome: "세션: 상태 생성 전" },
  { title: "자격 증명 발급", summary: "세션은 서버 저장소에 레코드를 만들고, JWT는 서명된 토큰을 클라이언트에 전달합니다.", session: ["SID RECEIVED", "ISSUED", "ACTIVE", "IDLE"], sessionOutcome: "세션: 서버 장부에 로그인 상태" },
  { title: "보호된 API 요청", summary: "Session은 Resource가 저장소를 조회합니다. JWT는 Resource가 서명을 직접 검증합니다.", session: ["COOKIE: SID", "IDLE", "LOOKUP", "ALLOWED"], sessionOutcome: "세션: 요청마다 저장소 조회" },
  { title: "로그아웃", summary: "세션은 서버 레코드를 삭제합니다. JWT의 결과는 서버가 추가 상태를 관리하는지에 따라 달라집니다.", session: ["COOKIE CLEARED", "SIGNED OUT", "DELETED", "IDLE"], sessionOutcome: "세션: 서버에서 즉시 무효화" },
  { title: "로그아웃 뒤 재요청", summary: "탈취되었을 수 있는 이전 자격 증명으로 다시 API를 호출해, 실제 통제 범위를 확인합니다.", session: ["STALE SID", "IDLE", "MISSING", "DENIED"], sessionOutcome: "세션: 레코드가 없어 즉시 401" },
] as const;

function frames(jwtStates: string[][], jwtOutcomes: string[], differences: string[]): Frame[] {
  return shared.map((frame, index) => ({ ...frame, jwt: jwtStates[index], jwtOutcome: jwtOutcomes[index], difference: differences[index] }));
}

const scenarios: Record<ScenarioId, Scenario> = {
  pure: {
    label: "기본 JWT",
    description: "서명·만료만 검증하는 무상태 JWT입니다. 로그아웃은 브라우저의 토큰을 지우지만, 이미 복사된 토큰을 서버가 회수하지는 못합니다.",
    badge: "STATELESS · SIGNATURE ONLY",
    frames: frames(
      [["SIGNED OUT", "READY", "NO SERVER STATE", "ANON"], ["JWT RECEIVED", "SIGNED", "NO SERVER STATE", "IDLE"], ["BEARER JWT", "IDLE", "NO SERVER STATE", "SIG VALID"], ["TOKEN CLEARED", "SIGNED OUT", "NO SERVER STATE", "IDLE"], ["STOLEN JWT", "IDLE", "NO SERVER STATE", "ALLOWED UNTIL EXP"]],
      ["JWT: 상태를 저장하지 않음", "JWT: 서명된 토큰을 클라이언트가 보관", "JWT: Resource가 서명을 자체 검증", "JWT: 클라이언트 삭제만으로는 회수 불가", "JWT: 유효한 탈취 토큰은 만료까지 통과"],
      ["둘 다 아직 인증 상태가 없습니다.", "상태의 위치가 갈립니다: 서버 레코드 vs 클라이언트 토큰.", "Session에는 원격 조회가, JWT에는 로컬 서명 검증이 있습니다.", "Session은 삭제가 곧 회수지만, 기본 JWT는 서버 측 회수 지점이 없습니다.", "즉시 차단이 중요하면 JWT에도 별도의 상태 저장소가 필요합니다."],
    ),
    jwtMessages: [
      { beat: 0, from: 0, to: 1, y: 100, label: "ID / PW", tone: "blue" }, { beat: 1, from: 1, to: 0, y: 152, label: "signed JWT", tone: "green" },
      { beat: 2, from: 0, to: 3, y: 184, label: "Bearer JWT", tone: "blue" }, { beat: 2, from: 3, to: 0, y: 256, label: "verify signature · 200", tone: "green" },
      { beat: 3, from: 0, to: 1, y: 296, label: "logout", tone: "blue" }, { beat: 3, from: 1, to: 0, y: 320, label: "clear browser token", tone: "slate" },
      { beat: 4, from: 0, to: 3, y: 352, label: "stolen JWT", tone: "amber" }, { beat: 4, from: 3, to: 0, y: 424, label: "signature valid · 200", tone: "amber" },
    ],
  },
  revocation: {
    label: "JWT + 차단 목록",
    description: "로그아웃 시 JWT ID를 만료 전까지 차단 등록하는 하이브리드 전략입니다. 조기 차단을 얻는 대신 요청 경로에 상태 조회가 다시 들어옵니다.",
    badge: "HYBRID · REVOCATION LOOKUP",
    frames: frames(
      [["SIGNED OUT", "READY", "EMPTY", "ANON"], ["JWT RECEIVED", "SIGNED", "EMPTY", "IDLE"], ["BEARER JWT", "IDLE", "NOT LISTED", "SIG VALID"], ["TOKEN CLEARED", "REVOKED", "JTI BLOCKED", "IDLE"], ["STOLEN JWT", "IDLE", "BLOCKED", "DENIED"]],
      ["JWT: 차단 목록은 비어 있음", "JWT: 서명된 토큰을 클라이언트가 보관", "JWT: 서명 뒤 차단 목록 미등록 확인", "JWT: jti를 만료 시점까지 차단 등록", "JWT: 차단 목록 조회로 즉시 401"],
      ["둘 다 아직 인증 상태가 없습니다.", "Session은 세션 ID, JWT는 서명 토큰을 발급합니다.", "두 경로 모두 상태 조회가 있지만, JWT의 조회는 조기 무효화가 필요할 때만 추가됩니다.", "JWT 차단 목록은 무상태성 일부를 비용으로 즉시 회수권을 제공합니다.", "두 방식 모두 재요청을 차단하지만, 저장하는 데이터와 운영 비용이 다릅니다."],
    ),
    jwtMessages: [
      { beat: 0, from: 0, to: 1, y: 100, label: "ID / PW", tone: "blue" }, { beat: 1, from: 1, to: 0, y: 152, label: "signed JWT", tone: "green" },
      { beat: 2, from: 0, to: 3, y: 184, label: "Bearer JWT", tone: "blue" }, { beat: 2, from: 3, to: 2, y: 208, label: "check jti", tone: "amber" }, { beat: 2, from: 2, to: 3, y: 232, label: "not listed", tone: "green" }, { beat: 2, from: 3, to: 0, y: 256, label: "200 OK", tone: "green" },
      { beat: 3, from: 0, to: 1, y: 296, label: "logout", tone: "blue" }, { beat: 3, from: 1, to: 2, y: 320, label: "block jti until exp", tone: "rose", state: true },
      { beat: 4, from: 0, to: 3, y: 352, label: "stolen JWT", tone: "amber" }, { beat: 4, from: 3, to: 2, y: 376, label: "check jti", tone: "amber" }, { beat: 4, from: 2, to: 3, y: 400, label: "blocked", tone: "rose" }, { beat: 4, from: 3, to: 0, y: 424, label: "401 denied", tone: "rose" },
    ],
  },
};

function positions(count: number, width = 960) { return Array.from({ length: count }, (_, index) => 68 + (index * (width - 136)) / (count - 1)); }
function stateTone(state: string): Tone {
  if (/DENIED|DELETED|MISSING|BLOCKED|REVOKED/.test(state)) return "rose";
  if (/STOLEN|UNTIL EXP/.test(state)) return "amber";
  if (/ACTIVE|RECEIVED|ISSUED|^SIGNED$|LOOKUP|VALID|ALLOWED|NOT LISTED/.test(state)) return "green";
  return "slate";
}

function StateChip({ x, state }: { x: number; state: string }) {
  const color = palette[stateTone(state)];
  return <g><rect x={x - 55} y="38" width="110" height="31" rx="15.5" fill={color.fill} stroke={color.stroke} strokeWidth={stateTone(state) === "rose" ? 2 : 1.25} strokeDasharray={state === "NO SERVER STATE" ? "4 3" : undefined} /><text x={x} y="58.5" textAnchor="middle" fontSize="10" fontWeight="700" fill={color.text}>{state}</text></g>;
}

function SequencePanel({ title, subtitle, lanes, states, messages, activeBeat, session, badge }: { title: string; subtitle: string; lanes: string[]; states: readonly string[]; messages: Message[]; activeBeat: number; session: boolean; badge: string }) {
  const reducedMotion = useReducedMotion() ?? false;
  const markerId = useId().replace(/:/g, "");
  const xs = useMemo(() => positions(lanes.length), [lanes.length]);
  const currentMessages = messages.filter((message) => message.beat === activeBeat);
  const border = session ? "border-l-violet-500" : "border-l-amber-500";
  const badgeStyle = session ? "border-violet-500/40 bg-violet-500/10 text-violet-800 dark:text-violet-200" : "border-amber-500/50 bg-amber-500/10 text-amber-800 dark:text-amber-200";
  return <article className={`min-w-0 rounded-2xl border border-slate-300 border-l-4 bg-white p-4 dark:border-slate-700 dark:bg-slate-950 ${border}`}>
    <header className="mb-3 flex flex-col items-start gap-2 sm:flex-row sm:justify-between sm:gap-3"><div><h3 className="text-sm font-bold text-slate-950 dark:text-white">{title}</h3><p className="mt-0.5 text-[11px] leading-4 text-slate-500 dark:text-slate-400">{subtitle} · shared beat {String(activeBeat + 1).padStart(2, "0")}</p></div><span className={`shrink-0 rounded-full border px-2.5 py-1 font-mono text-[9px] font-bold tracking-[0.08em] ${badgeStyle}`}>{badge}</span></header>
    <div className="overflow-x-auto pb-1"><svg viewBox="0 0 960 456" className="min-w-[760px] w-full" role="img" aria-label={`${title} 인증 메시지 시퀀스`}><defs>{Object.entries(palette).map(([tone, color]) => <marker key={tone} id={`${markerId}-${tone}`} markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8 z" fill={color.stroke} /></marker>)}</defs>
      {lanes.map((lane, index) => <g key={lane}><text x={xs[index]} y="20" textAnchor="middle" fontSize="12" fontWeight="800" fill="#475569">{lane}</text><line x1={xs[index]} x2={xs[index]} y1="75" y2="440" stroke="#cbd5e1" strokeWidth="1" strokeDasharray="3 5" /></g>)}
      {states.map((state, index) => <StateChip key={`${lanes[index]}-${state}`} x={xs[index]} state={state} />)}
      {messages.filter((message) => message.beat <= activeBeat).map((message, index) => { const color = palette[message.tone]; const current = message.beat === activeBeat; const center = (xs[message.from] + xs[message.to]) / 2; const width = Math.max(62, message.label.length * 6.6 + 18); return <g key={`${message.beat}-${message.label}-${index}`} opacity={current ? 1 : 0.28}><line x1={xs[message.from]} y1={message.y} x2={xs[message.to]} y2={message.y} stroke={color.stroke} strokeWidth={current ? 2.2 : 1.15} strokeDasharray={message.state ? "6 3" : message.tone === "amber" ? "4 3" : undefined} markerEnd={`url(#${markerId}-${message.tone})`} /><rect x={center - width / 2} y={message.y - 19} width={width} height="22" rx="11" fill={color.fill} stroke={color.stroke} strokeWidth=".8" /><text x={center} y={message.y - 4} textAnchor="middle" fontSize="10.5" fontWeight="700" fill={color.text}>{message.label}</text></g>; })}
      {!reducedMotion && currentMessages.map((message, index) => <motion.circle key={`pulse-${message.beat}-${index}`} r="6.5" fill={palette[message.tone].stroke} initial={{ cx: xs[message.from], cy: message.y, opacity: 0 }} animate={{ cx: [xs[message.from], xs[message.to]], opacity: [0, 1, 0] }} transition={{ duration: 0.82, repeat: Infinity, repeatDelay: 0.4 }} />)}
    </svg></div>
  </article>;
}

export default function JwtVsSessionViz() {
  const reducedMotion = useReducedMotion() ?? false;
  const [scenarioId, setScenarioId] = useState<ScenarioId>("pure");
  const [beat, setBeat] = useState(0);
  const [playing, setPlaying] = useState(true);
  const scenario = scenarios[scenarioId];
  const frame = scenario.frames[beat];
  useEffect(() => { if (!playing) return; const timer = window.setTimeout(() => setBeat((current) => (current + 1) % scenario.frames.length), 3400); return () => window.clearTimeout(timer); }, [beat, playing, scenario.frames.length]);
  const chooseScenario = (next: ScenarioId) => { setScenarioId(next); setBeat(0); setPlaying(true); };
  const labels = ["LOGIN", "ISSUE", "AUTHORIZE", "LOGOUT", "REPLAY"];
  return <section className="w-full text-slate-800 dark:text-slate-100">
    <header className="flex flex-col gap-4 border-b border-slate-300 pb-5 dark:border-slate-700 sm:flex-row sm:items-start sm:justify-between"><div><div className="flex items-center gap-2 text-slate-600 dark:text-slate-300"><GitCompareArrows className="h-4 w-4" /><span className="text-xs font-bold tracking-[0.14em]">ALIGNED AUTH SEQUENCE</span></div><h2 className="mt-2 text-xl font-bold tracking-tight text-slate-950 dark:text-white">같은 로그아웃, 다른 서버 통제력</h2><p className="mt-1 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-300">{frame.summary}</p></div><div className="flex items-center gap-2 self-start rounded-full border border-slate-300 bg-white py-1 pl-3 pr-1 dark:border-slate-700 dark:bg-slate-950"><span className="font-mono text-[9px] font-bold tracking-[0.12em] text-slate-500">AUTO · LOOP</span><button type="button" aria-label={playing ? "일시정지" : "재생"} onClick={() => setPlaying((value) => !value)} className="rounded-full bg-slate-950 p-2 text-white dark:bg-white dark:text-slate-950">{playing ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}</button></div></header>
    <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div className="inline-flex self-start rounded-xl border border-slate-300 bg-white p-1 dark:border-slate-700 dark:bg-slate-950" aria-label="JWT 무효화 전략 선택">{(Object.keys(scenarios) as ScenarioId[]).map((id) => <button key={id} type="button" onClick={() => chooseScenario(id)} className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-colors ${scenarioId === id ? "bg-slate-950 text-white dark:bg-white dark:text-slate-950" : "text-slate-500 hover:text-slate-950 dark:hover:text-white"}`}>{scenarios[id].label}</button>)}</div><p className="max-w-xl text-xs leading-5 text-slate-600 dark:text-slate-300">{scenario.description}</p></div>
    <div className="mt-4 grid grid-cols-5 gap-1 rounded-xl border border-slate-300 bg-white p-2 dark:border-slate-700 dark:bg-slate-950" aria-label="공유 시간축">{labels.map((label, index) => <div key={label} className={`rounded-md border px-1.5 py-2 text-center font-mono text-[9px] font-bold tracking-[0.04em] ${index === beat ? "border-slate-950 bg-slate-950 text-white dark:border-white dark:bg-white dark:text-slate-950" : index < beat ? "border-slate-200 bg-slate-100 text-slate-500 dark:border-slate-800 dark:bg-slate-900" : "border-dashed border-slate-300 text-slate-500 dark:border-slate-700"}`}>{label}</div>)}</div>
    <div className="mt-5 space-y-4"><SequencePanel title="Session" subtitle="서버가 세션 ID 레코드를 소유" lanes={sessionLanes} states={frame.session} messages={sessionMessages} activeBeat={beat} session badge="STATEFUL · LOOKUP" /><div className="flex items-center gap-3 px-1" aria-hidden="true"><div className="h-px flex-1 bg-slate-300 dark:bg-slate-700" /><span className="font-mono text-[9px] font-bold tracking-[0.15em] text-slate-500">SAME TIME · DIFFERENT STATE LOCATION</span><div className="h-px flex-1 bg-slate-300 dark:bg-slate-700" /></div><SequencePanel title="JWT" subtitle="서명 토큰을 클라이언트가 보관" lanes={jwtLanes} states={frame.jwt} messages={scenario.jwtMessages} activeBeat={beat} session={false} badge={scenario.badge} /></div>
    <div className="mt-4 grid gap-3 border-t border-slate-300 pt-4 dark:border-slate-700 md:grid-cols-[1fr_1fr_1.2fr]"><div className="rounded-xl border border-l-4 border-l-violet-500 border-slate-300 bg-white px-3 py-2.5 text-xs font-semibold text-slate-800 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"><span className="mr-2 font-mono text-[9px] tracking-[0.12em] text-violet-700 dark:text-violet-300">SESSION</span>{frame.sessionOutcome}</div><div className="rounded-xl border border-l-4 border-l-amber-500 border-slate-300 bg-white px-3 py-2.5 text-xs font-semibold text-slate-800 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"><span className="mr-2 font-mono text-[9px] tracking-[0.12em] text-amber-700 dark:text-amber-300">JWT</span>{beat === 4 && scenarioId === "pure" ? <AlertTriangle className="mr-1 inline h-3.5 w-3.5 text-amber-500" /> : beat === 4 ? <ShieldCheck className="mr-1 inline h-3.5 w-3.5 text-emerald-500" /> : null}{frame.jwtOutcome}</div><div className="rounded-xl border border-dashed border-slate-500 bg-white px-3 py-2.5 text-xs font-semibold text-slate-800 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"><span className="mr-2 font-mono text-[9px] tracking-[0.12em] text-slate-500">KEY DIFFERENCE</span>{beat === 4 && scenarioId === "pure" ? <X className="mr-1 inline h-3.5 w-3.5 text-rose-500" /> : beat === 4 ? <Check className="mr-1 inline h-3.5 w-3.5 text-emerald-500" /> : null}{frame.difference}</div></div>
    <footer className="mt-4 flex items-center justify-between text-xs font-medium text-slate-600 dark:text-slate-300"><span><span className="mr-2 text-slate-400">{String(beat + 1).padStart(2, "0")} / {String(scenario.frames.length).padStart(2, "0")}</span>{frame.title}</span><div className="h-1.5 w-32 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800" role="progressbar" aria-label="인증 비교 진행률" aria-valuemin={1} aria-valuemax={scenario.frames.length} aria-valuenow={beat + 1}><motion.div className="h-full rounded-full bg-slate-950 dark:bg-white" animate={{ width: `${((beat + 1) / scenario.frames.length) * 100}%` }} transition={{ duration: reducedMotion ? 0 : 0.25 }} /></div></footer>
  </section>;
}
