import { useEffect, useMemo, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Copy, Database, KeyRound, Pause, Play, Server, ShieldCheck } from "lucide-react";

type ShardId = "A" | "B" | "C";
type StageId = "map" | "route" | "replicate" | "lag" | "copy" | "cutover" | "failover";
type Token = { value: number; shard: ShardId; label: string };

const tokens: Token[] = [
  { value: 12, shard: "A", label: "profile:12" }, { value: 48, shard: "B", label: "order:48" },
  { value: 61, shard: "B", label: "order:61" }, { value: 81, shard: "C", label: "profile:81" },
];
const stages: Array<{ id: StageId; title: string; summary: string; epoch: string; note: string }> = [
  { id: "map", title: "논리 파티션 맵", summary: "키 범위는 A·B·C에 한 번씩만 소유됩니다. 각 Shard는 내부적으로 복제됩니다.", epoch: "epoch 17", note: "RF 2 · primary 1" },
  { id: "route", title: "키로 라우팅", summary: "Router는 partition key와 shard map epoch를 함께 확인해 한 Primary로 보냅니다.", epoch: "epoch 17", note: "key 61 → B primary" },
  { id: "replicate", title: "Primary → Replica", summary: "Primary의 커밋 로그가 Replica로 복제됩니다. 읽기 확장과 장애 복구의 기반입니다.", epoch: "epoch 17", note: "WAL 9,042 applied" },
  { id: "lag", title: "복제 지연", summary: "Replica 읽기는 처리량을 늘리지만, 최신 쓰기보다 뒤처질 수 있습니다.", epoch: "epoch 17", note: "replica: LSN 9,038" },
  { id: "copy", title: "Online rebalancing", summary: "B의 51–66 범위를 C에 복사하고 WAL을 따라잡습니다. 이 구간의 authoritative owner는 아직 B입니다.", epoch: "epoch 17", note: "snapshot + WAL catch-up" },
  { id: "cutover", title: "소유권 전환", summary: "동기화가 끝난 뒤 Router가 epoch 18을 사용합니다. 51–66의 단일 Primary는 C로 바뀝니다.", epoch: "epoch 18", note: "B 34–50 · C 51–99" },
  { id: "failover", title: "Replica 승격", summary: "B Primary 장애 후 최신 Replica만 epoch 19에서 승격됩니다. 이전 Primary는 fencing됩니다.", epoch: "epoch 19", note: "B replica → primary" },
];
const colors: Record<ShardId, { solid: string; soft: string; border: string }> = {
  A: { solid: "bg-sky-500", soft: "bg-sky-500/10 dark:bg-sky-950/25", border: "border-sky-500/45" },
  B: { solid: "bg-violet-500", soft: "bg-violet-500/10 dark:bg-violet-950/25", border: "border-violet-500/45" },
  C: { solid: "bg-emerald-500", soft: "bg-emerald-500/10 dark:bg-emerald-950/25", border: "border-emerald-500/45" },
};
function ownerOf(stage: StageId, token: Token): ShardId { return (stage === "cutover" || stage === "failover") && token.value === 61 ? "C" : token.shard; }
function keyspace(stage: StageId) {
  if (stage === "copy") return [
    { label: "A · 0–33", shard: "A" as const, width: "34%", values: [12] }, { label: "B · 34–50", shard: "B" as const, width: "17%", values: [48] },
    { label: "51–66 · B → C", shard: "B" as const, width: "16%", values: [61], moving: true }, { label: "C · 67–99", shard: "C" as const, width: "33%", values: [81] },
  ];
  if (stage === "cutover" || stage === "failover") return [
    { label: "A · 0–33", shard: "A" as const, width: "34%", values: [12] }, { label: "B · 34–50", shard: "B" as const, width: "17%", values: [48] }, { label: "C · 51–99", shard: "C" as const, width: "49%", values: [61, 81] },
  ];
  return [
    { label: "A · 0–33", shard: "A" as const, width: "34%", values: [12] }, { label: "B · 34–66", shard: "B" as const, width: "33%", values: [48, 61] }, { label: "C · 67–99", shard: "C" as const, width: "33%", values: [81] },
  ];
}
function ActiveTransition({ stage, selected }: { stage: StageId; selected: Token }) {
  const reducedMotion = useReducedMotion();
  const owner = ownerOf(stage, selected);
  const operationTone: Record<StageId, { line: string; label: string; target: string }> = {
    map: { line: "border-sky-500", label: "text-sky-700 dark:text-sky-300", target: "border-sky-500/55" },
    route: { line: "border-sky-500", label: "text-sky-700 dark:text-sky-300", target: "border-sky-500/55" },
    replicate: { line: "border-emerald-500", label: "text-emerald-700 dark:text-emerald-300", target: "border-emerald-500/55" },
    lag: { line: "border-amber-500", label: "text-amber-700 dark:text-amber-300", target: "border-amber-500/65" },
    copy: { line: "border-cyan-500", label: "text-cyan-700 dark:text-cyan-300", target: "border-cyan-500/65" },
    cutover: { line: "border-violet-500", label: "text-violet-700 dark:text-violet-300", target: "border-violet-500/65" },
    failover: { line: "border-rose-500", label: "text-rose-700 dark:text-rose-300", target: "border-emerald-500/70" },
  };
  const tone = operationTone[stage];
  const items: Record<StageId, [string, string, string]> = {
    map: [`KEY #${selected.value}`, `RANGE ${selected.shard === "A" ? "0–33" : selected.shard === "B" ? "34–66" : "67–99"}`, `OWNER ${owner}`],
    route: [`KEY #${selected.value}`, "ROUTER · E17", `${owner} PRIMARY`],
    replicate: [`${owner} PRIMARY · v42`, "WAL · LSN 9042", `${owner} REPLICA · v42`],
    lag: [`${owner} PRIMARY · v42`, "LAG · 4 LSN", `${owner} REPLICA · v38`],
    copy: ["B · OWNER 51–66", "COPYING · 72%", "C · JOINING 51–66"],
    cutover: ["B · DRAINED", "CUTOVER · E18", "C · OWNER 51–66"],
    failover: ["OLD PRIMARY · FENCED", "TERM 19", "REPLICA · PROMOTED"],
  };
  return <motion.div key={stage} initial={reducedMotion ? false : { y: 5 }} animate={{ y: 0 }} className="mt-4 grid grid-cols-[1fr_auto_1fr] items-center gap-2 rounded-xl border border-slate-300 bg-slate-100/80 p-3 dark:border-slate-700 dark:bg-slate-900/80">
    <div className={`rounded-lg border bg-white px-2 py-2 text-center font-mono text-[10px] font-bold text-slate-900 dark:bg-slate-950 dark:text-slate-100 ${colors[stage === "copy" || stage === "cutover" ? "B" : owner].border}`}>{items[stage][0]}</div>
    <div className={`min-w-20 border-t-2 text-center font-mono text-[9px] font-bold ${tone.line} ${tone.label} ${stage === "lag" || stage === "copy" ? "border-dashed" : ""}`}><span className="relative -top-3 bg-slate-100 px-1 dark:bg-slate-900">{items[stage][1]}</span></div>
    <div className={`rounded-lg border bg-white px-2 py-2 text-center font-mono text-[10px] font-bold text-slate-900 dark:bg-slate-950 dark:text-slate-100 ${stage === "failover" ? "border-double border-4" : ""} ${tone.target}`}>{items[stage][2]}</div>
  </motion.div>;
}
function ShardCard({ shard, stage, selected }: { shard: ShardId; stage: StageId; selected: Token }) {
  const isCopySource = stage === "copy" && shard === "B";
  const isCopyTarget = stage === "copy" && shard === "C";
  const failed = stage === "failover" && shard === "B";
  const ownsSelected = ownerOf(stage, selected) === shard;
  const range = stage === "copy" && shard === "B" ? "34–50 · 51–66 draining" : stage === "copy" && shard === "C" ? "67–99 · 51–66 joining" : (stage === "cutover" || stage === "failover") && shard === "B" ? "34–50" : (stage === "cutover" || stage === "failover") && shard === "C" ? "51–99" : shard === "A" ? "0–33" : shard === "B" ? "34–66" : "67–99";
  return <article className={`rounded-2xl border p-4 transition-colors ${colors[shard].border} ${ownsSelected ? `${colors[shard].soft} ring-1 ring-current/20` : "border-slate-200 bg-white/70 dark:border-slate-800 dark:bg-slate-950/30"}`}>
    <div className="flex items-start justify-between gap-3"><div><p className="text-[11px] font-bold tracking-[0.16em] text-slate-500">SHARD {shard}</p><p className="mt-1 font-mono text-xs text-slate-600 dark:text-slate-300">range {range}</p></div><span className={`rounded-full border px-2 py-1 text-[10px] font-bold ${failed ? "border-double border-violet-600 bg-violet-500/15 text-violet-700 dark:border-violet-300 dark:text-violet-200" : isCopySource ? "border-dashed border-amber-500 bg-amber-500/15 text-amber-700 dark:text-amber-200" : isCopyTarget ? "border-cyan-500 bg-cyan-500/10 text-cyan-700 dark:text-cyan-200" : "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-200"}`}>{failed ? "PROMOTED" : isCopySource ? "DRAINING" : isCopyTarget ? "JOINING" : "ACTIVE"}</span></div>
    <div className="mt-4 space-y-2 text-xs"><div className="flex items-center justify-between rounded-lg bg-slate-950/[0.04] px-2.5 py-2 dark:bg-white/[0.06]"><span className="flex items-center gap-1.5"><Server className="h-3.5 w-3.5" /> {failed ? "B replica" : `${shard} primary`}</span><span className="text-slate-500">{failed ? "epoch 19" : stage === "replicate" && ownsSelected ? "v42 · send WAL" : stage === "lag" && ownsSelected ? "v42 · latest" : "writer"}</span></div><div className={`flex items-center justify-between rounded-lg px-2.5 py-2 ${failed ? "border border-dashed border-slate-500 bg-transparent" : "bg-slate-950/[0.04] dark:bg-white/[0.06]"}`}><span className="flex items-center gap-1.5"><Copy className="h-3.5 w-3.5" /> {failed ? "B old primary" : `${shard} replica`}</span><span className="text-slate-500">{failed ? "FENCED" : stage === "replicate" && ownsSelected ? "v42 · applied" : stage === "lag" && ownsSelected ? "v38 · STALE" : "standby"}</span></div></div>
  </article>;
}
function RecordCopies({ stage, selected }: { stage: StageId; selected: Token }) {
  const owner = ownerOf(stage, selected);
  const migrating = stage === "copy" || stage === "cutover";
  const failed = stage === "failover";
  const stale = stage === "lag" && owner === "B";
  const source = migrating && selected.value === 61 ? "B" : owner;
  return <div className="rounded-xl border border-slate-300 p-3 dark:border-slate-700">
    <div className="flex items-center justify-between"><p className="text-[10px] font-bold tracking-[0.12em] text-slate-500">RECORD COPIES</p><span className="font-mono text-[10px] text-slate-500">#{selected.value}</span></div>
    <div className="mt-2 grid grid-cols-2 gap-2 text-[10px]">
      <div className={`rounded-lg border px-2 py-2 ${failed ? "border-double border-4 border-emerald-500/70" : `${colors[owner].border} ${colors[owner].soft}`}`}><p className="font-bold text-slate-800 dark:text-slate-100">{failed ? "PROMOTED" : "PRIMARY"}</p><p className="mt-1 font-mono text-slate-600 dark:text-slate-300">{owner} · v42</p></div>
      <div className={`rounded-lg border px-2 py-2 ${stale ? "border-dashed border-amber-500 bg-amber-500/10" : migrating ? "border-dashed border-cyan-500 bg-cyan-500/10" : `${colors[owner].border} bg-white dark:bg-slate-950`}`}><p className="font-bold text-slate-800 dark:text-slate-100">{stale ? "REPLICA · STALE" : migrating ? "COPY / REPLICA" : "REPLICA"}</p><p className="mt-1 font-mono text-slate-600 dark:text-slate-300">{migrating ? `${source} → C` : `${owner} · ${stale ? "v38" : "v42"}`}</p></div>
    </div>
  </div>;
}
export default function DbReplicationShardingViz() {
  const [stageIndex, setStageIndex] = useState(0); const [selectedValue, setSelectedValue] = useState(61); const [playing, setPlaying] = useState(true); const reducedMotion = useReducedMotion();
  const stage = stages[stageIndex]; const selected = useMemo(() => tokens.find((token) => token.value === selectedValue) ?? tokens[2], [selectedValue]);
  useEffect(() => { if (!playing) return; const timer = window.setTimeout(() => setStageIndex((index) => (index + 1) % stages.length), 3200); return () => window.clearTimeout(timer); }, [playing, stageIndex]);
  const hasMigration = stage.id === "copy" || stage.id === "cutover"; const isFailover = stage.id === "failover";
  return <section className="not-prose overflow-hidden rounded-3xl border border-slate-300 bg-slate-50 p-4 shadow-sm dark:border-slate-700 dark:bg-slate-950 sm:p-6">
    <header className="flex flex-col gap-4 border-b border-slate-300/80 pb-5 dark:border-slate-700 sm:flex-row sm:items-start sm:justify-between"><div><div className="flex items-center gap-2 text-slate-600 dark:text-slate-300"><Database className="h-4 w-4" /><span className="text-xs font-bold tracking-[0.14em]">DATA PLACEMENT MAP</span></div><h2 className="mt-2 text-xl font-bold tracking-tight text-slate-950 dark:text-white">복제 그룹 안의 데이터, Shard 사이의 소유권</h2><p className="mt-1 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-300">{stage.summary}</p></div><div className="flex items-center gap-2 self-start rounded-full border border-slate-300 bg-white/80 py-1 pl-3 pr-1 dark:border-slate-700 dark:bg-slate-950/80"><span className="font-mono text-[9px] font-bold tracking-[0.12em] text-slate-500">AUTO · LOOP</span><button type="button" aria-label={playing ? "일시정지" : "재생"} onClick={() => setPlaying((value) => !value)} className="rounded-full bg-slate-950 p-2 text-white hover:bg-slate-700 dark:bg-white dark:text-slate-950">{playing ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}</button></div></header>
    <div className="mt-5 flex flex-wrap items-center gap-2" aria-label="예시 partition key 선택"><span className="mr-1 text-xs font-semibold text-slate-500">관찰할 key</span>{tokens.map((token) => <button key={token.value} type="button" onClick={() => setSelectedValue(token.value)} className={`rounded-full border px-3 py-1.5 font-mono text-xs transition ${selected.value === token.value ? `${colors[ownerOf(stage.id, token)].soft} ${colors[ownerOf(stage.id, token)].border} text-slate-950 dark:text-white` : "border-slate-200 bg-white/60 text-slate-600 hover:border-slate-400 dark:border-slate-700 dark:bg-slate-900/50 dark:text-slate-300"}`}>{token.value}</button>)}</div>
    <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1.55fr)_minmax(250px,.8fr)]"><div className="min-w-0"><div className="rounded-2xl border border-slate-300 bg-white/80 p-4 dark:border-slate-700 dark:bg-slate-950/45"><div className="mb-3 flex items-center justify-between gap-3"><span className="text-xs font-bold tracking-[0.12em] text-slate-500">KEYSPACE · HASH 0–99</span><span className="rounded-full bg-slate-950 px-2 py-1 font-mono text-[10px] font-bold text-white dark:bg-white dark:text-slate-950">{stage.epoch}</span></div><div className="flex min-h-28 overflow-hidden rounded-xl border border-slate-300 dark:border-slate-700">{keyspace(stage.id).map((segment) => <div key={segment.label} style={{ width: segment.width }} className={`relative flex min-w-0 flex-col justify-between border-r border-slate-300 p-3 last:border-r-0 dark:border-slate-700 ${colors[segment.shard].soft} ${segment.values.includes(selected.value) ? "ring-2 ring-inset ring-slate-950 dark:ring-white" : ""}`}><span className="truncate text-[11px] font-bold text-slate-700 dark:text-slate-200">{segment.label}</span><div className="flex flex-wrap gap-1">{segment.values.map((value) => <span key={value} className={`rounded-md px-1.5 py-1 font-mono text-[10px] font-bold ${colors[segment.shard].solid} text-white`}>#{value}</span>)}</div>{segment.moving && !reducedMotion && <motion.span className="absolute bottom-1 right-1 h-1.5 w-1.5 rounded-full bg-cyan-500 shadow" animate={{ x: [0, 16, 0], opacity: [.5, 1, .5] }} transition={{ duration: 1.4, repeat: Infinity }} />}</div>)}</div><ActiveTransition stage={stage.id} selected={selected} /><div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-slate-500"><span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-slate-950 dark:bg-slate-200" />logical partition</span><span className="flex items-center gap-1"><span className="h-2 w-2 border border-slate-700 bg-white dark:border-slate-300 dark:bg-slate-950" />single writer / range</span>{hasMigration && <span className="flex items-center gap-1 text-cyan-700 dark:text-cyan-300"><Copy className="h-3 w-3" />copy before cutover</span>}</div></div><div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">{(["A", "B", "C"] as ShardId[]).map((shard) => <ShardCard key={shard} shard={shard} stage={stage.id} selected={selected} />)}</div></div>
      <aside className="rounded-2xl border border-slate-300 bg-white/80 p-4 dark:border-slate-700 dark:bg-slate-950/45"><div className="flex items-center gap-2 text-slate-500"><KeyRound className="h-4 w-4" /><span className="text-xs font-bold tracking-[0.12em]">RECORD INSPECTOR</span></div><p className="mt-4 font-mono text-lg font-bold text-slate-950 dark:text-white">#{selected.value} · {selected.label}</p><div className="mt-4 space-y-3 text-sm"><div className="rounded-xl bg-slate-950/[0.045] p-3 dark:bg-white/[0.06]"><p className="text-[10px] font-bold tracking-[0.12em] text-slate-500">AUTHORITATIVE OWNER</p><p className="mt-1 font-semibold text-slate-900 dark:text-white">Shard {ownerOf(stage.id, selected)} Primary <span className="font-mono text-xs text-slate-500">· {stage.epoch}</span></p></div><div className="rounded-xl bg-slate-950/[0.045] p-3 dark:bg-white/[0.06]"><p className="text-[10px] font-bold tracking-[0.12em] text-slate-500">REPLICA FRESHNESS</p><p className="mt-1 font-semibold text-slate-900 dark:text-white">{stage.id === "lag" && ownerOf(stage.id, selected) === "B" ? "LSN 9,038 · primary보다 4 뒤" : "WAL applied · read standby"}</p></div><RecordCopies stage={stage.id} selected={selected} /><div className={`rounded-xl border p-3 text-slate-800 dark:text-slate-100 ${isFailover ? "border-double border-4 border-slate-900 dark:border-white" : hasMigration ? "border-dashed border-slate-500" : "border-slate-300 bg-slate-100 dark:border-slate-700 dark:bg-slate-900"}`}><p className="flex items-center gap-1.5 text-[10px] font-bold tracking-[0.12em]"><ShieldCheck className="h-3.5 w-3.5" />INVARIANT</p><p className="mt-1 text-xs leading-5">{isFailover ? "새 epoch만 쓰기를 허용해 split brain을 막습니다." : hasMigration ? "복사본은 생겨도 cutover 전 writer는 하나입니다." : "각 범위는 정확히 하나의 Primary가 씁니다."}</p></div></div><div className="mt-5 border-t border-slate-300 pt-4 dark:border-slate-700"><p className="text-[10px] font-bold tracking-[0.12em] text-slate-500">CURRENT BEAT</p><p className="mt-1 font-semibold text-slate-950 dark:text-white">{stage.title}</p><p className="mt-1 text-xs leading-5 text-slate-500">{stage.note}</p></div></aside></div>
    <footer className="mt-5 flex flex-col gap-2 border-t border-slate-300 pt-4 dark:border-slate-700 sm:flex-row sm:items-center sm:justify-between"><p className="text-xs font-medium text-slate-600 dark:text-slate-300"><span className="mr-2 text-slate-400">{String(stageIndex + 1).padStart(2, "0")} / {String(stages.length).padStart(2, "0")}</span>{stage.title}</p><div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800 sm:w-48" role="progressbar" aria-label="시각화 진행률" aria-valuemin={1} aria-valuemax={stages.length} aria-valuenow={stageIndex + 1}><motion.div className="h-full rounded-full bg-slate-950 dark:bg-white" animate={{ width: `${((stageIndex + 1) / stages.length) * 100}%` }} transition={{ duration: reducedMotion ? 0 : .28 }} /></div></footer>
  </section>;
}
