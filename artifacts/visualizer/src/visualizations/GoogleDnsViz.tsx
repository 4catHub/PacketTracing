import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  ArrowDown,
  ArrowRight,
  Check,
  CircleDot,
  FileCode2,
  Globe2,
  Laptop,
  Layers3,
  MonitorUp,
  Network,
  Paintbrush,
  Pause,
  Play,
  Server,
  ShieldCheck,
} from "lucide-react";

type PhaseId = "dns" | "connect" | "document" | "render";

interface Phase {
  id: PhaseId;
  number: string;
  eyebrow: string;
  title: string;
  summary: string;
  duration: string;
}

const phases: Phase[] = [
  {
    id: "dns",
    number: "01",
    eyebrow: "NAME RESOLUTION",
    title: "이름 찾기",
    summary: "캐시를 확인하고 도메인을 서버 IP로 바꿉니다.",
    duration: "캐시 hit < 1ms · miss 시 가변",
  },
  {
    id: "connect",
    number: "02",
    eyebrow: "CONNECTION",
    title: "연결 만들기",
    summary: "TCP 연결 위에 TLS 보안 채널을 수립합니다.",
    duration: "TCP 1 RTT · TLS 1 RTT",
  },
  {
    id: "document",
    number: "03",
    eyebrow: "DOCUMENT DELIVERY",
    title: "문서 받기",
    summary: "HTTP 요청을 보내고 첫 HTML 문서를 받습니다.",
    duration: "서버 처리 + 네트워크",
  },
  {
    id: "render",
    number: "04",
    eyebrow: "BROWSER PIPELINE",
    title: "화면 만들기",
    summary: "문서를 화면에 보이는 픽셀로 변환합니다.",
    duration: "DOM → 첫 화면 표시",
  },
];

const phaseTone: Record<PhaseId, { dot: string; text: string; border: string; soft: string; solid: string }> = {
  dns: {
    dot: "bg-blue-500",
    text: "text-blue-700 dark:text-blue-300",
    border: "border-blue-300 dark:border-blue-700",
    soft: "bg-blue-50 dark:bg-blue-950/35",
    solid: "bg-blue-500 dark:bg-blue-400",
  },
  connect: {
    dot: "bg-violet-500",
    text: "text-violet-700 dark:text-violet-300",
    border: "border-violet-300 dark:border-violet-700",
    soft: "bg-violet-50 dark:bg-violet-950/35",
    solid: "bg-violet-500 dark:bg-violet-400",
  },
  document: {
    dot: "bg-cyan-500",
    text: "text-cyan-700 dark:text-cyan-300",
    border: "border-cyan-300 dark:border-cyan-700",
    soft: "bg-cyan-50 dark:bg-cyan-950/35",
    solid: "bg-cyan-500 dark:bg-cyan-400",
  },
  render: {
    dot: "bg-emerald-500",
    text: "text-emerald-700 dark:text-emerald-300",
    border: "border-emerald-300 dark:border-emerald-700",
    soft: "bg-emerald-50 dark:bg-emerald-950/35",
    solid: "bg-emerald-500 dark:bg-emerald-400",
  },
};

const phaseDelayMs = 5600;

function StageRail({ activeIndex, onSelect }: { activeIndex: number; onSelect: (index: number) => void }) {
  return (
    <nav aria-label="브라우저 로딩 단계" className="grid grid-cols-2 gap-2 lg:grid-cols-4">
      {phases.map((phase, index) => {
        const active = index === activeIndex;
        const tone = phaseTone[phase.id];

        return (
          <button
            key={phase.id}
            type="button"
            aria-current={active ? "step" : undefined}
            onClick={() => onSelect(index)}
            className={`relative min-w-0 rounded-xl border px-3 py-3 text-left transition-colors ${
              active ? `${tone.border} ${tone.soft}` : "border-border bg-card hover:bg-muted/45"
            }`}
          >
            <div className="flex items-center gap-2">
              <span className={`h-2 w-2 shrink-0 rounded-full ${active ? tone.dot : "bg-border"}`} />
              <span className={`text-[9px] font-bold tracking-[0.14em] ${active ? tone.text : "text-muted-foreground"}`}>
                {phase.number} · {phase.eyebrow}
              </span>
            </div>
            <div className="mt-1.5 text-sm font-bold text-foreground">{phase.title}</div>
            <div className="mt-0.5 truncate text-[10px] text-muted-foreground">{phase.duration}</div>
            {active && (
              <motion.span
                layoutId="active-stage"
                className={`absolute inset-x-3 bottom-0 h-0.5 rounded-full ${tone.solid}`}
              />
            )}
          </button>
        );
      })}
    </nav>
  );
}

function SceneHeader({ phase }: { phase: Phase }) {
  const tone = phaseTone[phase.id];

  return (
    <div className="flex flex-col gap-2 border-b border-border px-4 py-4 sm:flex-row sm:items-end sm:justify-between sm:px-5">
      <div>
        <div className={`text-[10px] font-bold tracking-[0.18em] ${tone.text}`}>
          PHASE {phase.number} · {phase.eyebrow}
        </div>
        <h3 className="mt-1 text-base font-bold text-foreground">{phase.title}</h3>
        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{phase.summary}</p>
      </div>
      <span className={`w-fit rounded-full border px-2.5 py-1 text-[10px] font-semibold ${tone.border} ${tone.soft} ${tone.text}`}>
        {phase.duration}
      </span>
    </div>
  );
}

function FlowConnector({
  label,
  direction = "right",
  tone = "blue",
}: {
  label: string;
  direction?: "right" | "left";
  tone?: "blue" | "violet" | "cyan" | "emerald";
}) {
  const line = {
    blue: "bg-blue-400 dark:bg-blue-500",
    violet: "bg-violet-400 dark:bg-violet-500",
    cyan: "bg-cyan-400 dark:bg-cyan-500",
    emerald: "bg-emerald-400 dark:bg-emerald-500",
  }[tone];
  const text = {
    blue: "text-blue-700 dark:text-blue-300",
    violet: "text-violet-700 dark:text-violet-300",
    cyan: "text-cyan-700 dark:text-cyan-300",
    emerald: "text-emerald-700 dark:text-emerald-300",
  }[tone];

  return (
    <div className="flex min-w-0 flex-1 flex-col items-center justify-center gap-1 px-1" aria-label={label}>
      <span className={`text-center text-[9px] font-semibold ${text}`}>{label}</span>
      <div className={`relative h-0.5 w-full min-w-8 ${line}`}>
        <ArrowRight
          size={13}
          aria-hidden="true"
          className={`absolute -top-[6px] ${direction === "right" ? "-right-1" : "-left-1 rotate-180"} ${text}`}
        />
      </div>
    </div>
  );
}

function DnsScene() {
  const reducedMotion = useReducedMotion() ?? false;
  const lookupTargets = [
    { label: "ROOT", detail: ".com 위치", delay: 0.12 },
    { label: ".COM TLD", detail: "google.com NS", delay: 0.28 },
    { label: "AUTH NS", detail: "IP + TTL", delay: 0.44 },
  ];

  return (
    <div className="grid min-h-[390px] gap-4 p-4 sm:p-5 lg:grid-cols-[0.82fr_1.18fr]">
      <section className="rounded-xl border border-border bg-card p-4">
        <div className="flex items-center justify-between gap-2">
          <div>
            <div className="text-[9px] font-bold tracking-[0.16em] text-muted-foreground">LOCAL LOOKUP</div>
            <div className="mt-1 text-sm font-bold text-foreground">가까운 곳부터 확인</div>
          </div>
          <Laptop size={20} className="text-blue-600 dark:text-blue-300" aria-hidden="true" />
        </div>

        <div className="mt-4 space-y-2">
          {["Browser DNS cache", "OS DNS cache", "/etc/hosts"].map((label, index) => (
            <motion.div
              key={label}
              initial={reducedMotion ? false : { opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: reducedMotion ? 0 : 0.25, delay: reducedMotion ? 0 : index * 0.12 }}
              className="flex items-center gap-3 rounded-lg border border-border bg-muted/35 px-3 py-2.5"
            >
              <span className="flex h-6 w-6 items-center justify-center rounded-md border border-border bg-card font-mono text-[10px] font-bold text-muted-foreground">
                {index + 1}
              </span>
              <span className="flex-1 text-xs font-semibold text-foreground">{label}</span>
              <span className="rounded bg-amber-500/10 px-1.5 py-0.5 text-[9px] font-bold text-amber-700 dark:text-amber-300">MISS</span>
            </motion.div>
          ))}
        </div>

        <div className="mt-4 flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2.5 dark:border-blue-900 dark:bg-blue-950/30">
          <ArrowRight size={15} className="shrink-0 text-blue-600 dark:text-blue-300" aria-hidden="true" />
          <span className="text-[11px] font-semibold text-blue-800 dark:text-blue-200">로컬에 없으므로 재귀 Resolver에 위임</span>
        </div>
      </section>

      <section className="rounded-xl border border-border bg-card p-4">
        <div className="flex items-center justify-between gap-2">
          <div>
            <div className="text-[9px] font-bold tracking-[0.16em] text-muted-foreground">HIERARCHICAL LOOKUP</div>
            <div className="mt-1 text-sm font-bold text-foreground">Resolver가 권한을 따라 조회</div>
          </div>
          <Network size={20} className="text-blue-600 dark:text-blue-300" aria-hidden="true" />
        </div>

        <div className="mt-5 flex items-stretch gap-1 sm:gap-2">
          <motion.div
            initial={reducedMotion ? false : { opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex min-w-[76px] flex-col items-center justify-center rounded-xl border-2 border-blue-300 bg-blue-50 px-2 py-4 text-center dark:border-blue-700 dark:bg-blue-950/35"
          >
            <Globe2 size={21} className="text-blue-600 dark:text-blue-300" aria-hidden="true" />
            <span className="mt-2 text-[10px] font-bold text-foreground">RECURSIVE</span>
            <span className="text-[9px] text-muted-foreground">Resolver</span>
          </motion.div>

          <FlowConnector label="google.com?" />

          <div className="flex min-w-[104px] flex-1 flex-col gap-2">
            {lookupTargets.map((target) => (
              <motion.div
                key={target.label}
                initial={reducedMotion ? false : { opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: reducedMotion ? 0 : 0.28, delay: reducedMotion ? 0 : target.delay }}
                className="flex items-center gap-2 rounded-lg border border-border bg-muted/30 px-3 py-2"
              >
                <Server size={14} className="shrink-0 text-muted-foreground" aria-hidden="true" />
                <div className="min-w-0">
                  <div className="text-[10px] font-bold text-foreground">{target.label}</div>
                  <div className="truncate text-[9px] text-muted-foreground">{target.detail}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        <motion.div
          initial={reducedMotion ? false : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: reducedMotion ? 0 : 0.3, delay: reducedMotion ? 0 : 0.7 }}
          className="mt-4 flex items-center justify-between gap-3 rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-2.5 dark:border-emerald-800 dark:bg-emerald-950/30"
        >
          <div className="flex items-center gap-2">
            <Check size={14} className="text-emerald-700 dark:text-emerald-300" aria-hidden="true" />
            <span className="text-[10px] font-bold text-emerald-800 dark:text-emerald-200">브라우저로 반환</span>
          </div>
          <code className="text-[10px] font-bold text-emerald-800 dark:text-emerald-200">IP + TTL</code>
        </motion.div>
      </section>
    </div>
  );
}

interface SequenceMessage {
  label: string;
  detail: string;
  direction: "request" | "response";
  group: "TCP" | "TLS";
}

const connectionMessages: SequenceMessage[] = [
  { label: "SYN", detail: "연결 요청", direction: "request", group: "TCP" },
  { label: "SYN-ACK", detail: "요청 수락", direction: "response", group: "TCP" },
  { label: "ACK", detail: "연결 확정", direction: "request", group: "TCP" },
  { label: "ClientHello + KeyShare", detail: "암호군과 키 재료", direction: "request", group: "TLS" },
  { label: "ServerHello + Certificate", detail: "서버 인증과 키 합의", direction: "response", group: "TLS" },
];

function ConnectionScene() {
  const reducedMotion = useReducedMotion() ?? false;

  return (
    <div className="min-h-[390px] p-4 sm:p-5">
      <div className="grid grid-cols-[76px_minmax(0,1fr)_76px] items-center gap-2 sm:grid-cols-[120px_minmax(0,1fr)_120px]">
        <div className="flex flex-col items-center rounded-xl border border-border bg-card px-2 py-3 text-center">
          <Laptop size={20} className="text-violet-600 dark:text-violet-300" aria-hidden="true" />
          <span className="mt-1 text-[10px] font-bold text-foreground">BROWSER</span>
        </div>
        <div className="text-center text-[9px] font-bold tracking-[0.16em] text-muted-foreground">ORDERED MESSAGE FLOW</div>
        <div className="flex flex-col items-center rounded-xl border border-border bg-card px-2 py-3 text-center">
          <Server size={20} className="text-violet-600 dark:text-violet-300" aria-hidden="true" />
          <span className="mt-1 text-[10px] font-bold text-foreground">WEB SERVER</span>
        </div>

        {connectionMessages.map((message, index) => {
          const response = message.direction === "response";
          const isTlsStart = index === 3;

          return (
            <div key={message.label} className="contents">
              <div className={`text-right text-[9px] font-bold ${isTlsStart ? "mt-3" : ""}`}>
                {!response && <span className="text-violet-700 dark:text-violet-300">{message.group}</span>}
              </div>
              <div className={`relative py-2 ${isTlsStart ? "mt-3 border-t border-dashed border-border pt-5" : ""}`}>
                {isTlsStart && (
                  <span className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 rounded-full border border-border bg-card px-2 py-0.5 text-[8px] font-bold text-muted-foreground">
                    TCP 연결 위에서 TLS 시작
                  </span>
                )}
                <div className="mb-1 flex items-baseline justify-between gap-2">
                  <span className={`text-[10px] font-bold text-foreground ${response ? "order-2" : ""}`}>{message.label}</span>
                  <span className="text-[9px] text-muted-foreground">{message.detail}</span>
                </div>
                <div className="relative h-1 bg-border">
                  <motion.span
                    initial={reducedMotion ? false : { left: response ? "100%" : "0%", opacity: 0 }}
                    animate={{ left: response ? "0%" : "100%", opacity: 1 }}
                    transition={{ duration: reducedMotion ? 0 : 0.8, delay: reducedMotion ? 0 : index * 0.2 }}
                    className="absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-violet-200 bg-violet-600 dark:border-violet-900 dark:bg-violet-300"
                  />
                  <ArrowRight
                    size={13}
                    aria-hidden="true"
                    className={`absolute -top-[6px] text-violet-600 dark:text-violet-300 ${response ? "-left-1 rotate-180" : "-right-1"}`}
                  />
                </div>
              </div>
              <div className={`text-[9px] font-bold ${isTlsStart ? "mt-3" : ""}`}>
                {response && <span className="text-violet-700 dark:text-violet-300">{message.group}</span>}
              </div>
            </div>
          );
        })}
      </div>

      <motion.div
        initial={reducedMotion ? false : { opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: reducedMotion ? 0 : 0.3, delay: reducedMotion ? 0 : 1.2 }}
        className="mx-auto mt-5 flex max-w-md items-center justify-center gap-2 rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-3 text-center dark:border-emerald-800 dark:bg-emerald-950/30"
      >
        <ShieldCheck size={18} className="text-emerald-700 dark:text-emerald-300" aria-hidden="true" />
        <span className="text-xs font-bold text-emerald-800 dark:text-emerald-200">암호화된 HTTP 채널 준비 완료</span>
      </motion.div>
    </div>
  );
}

function DocumentScene() {
  const reducedMotion = useReducedMotion() ?? false;

  return (
    <div className="flex min-h-[390px] flex-col justify-center p-4 sm:p-6">
      <div className="grid items-center gap-3 md:grid-cols-[1fr_auto_1fr_auto_1fr]">
        <motion.section
          initial={reducedMotion ? false : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl border border-cyan-300 bg-cyan-50 p-4 dark:border-cyan-800 dark:bg-cyan-950/30"
        >
          <div className="flex items-center gap-2 text-cyan-700 dark:text-cyan-300">
            <MonitorUp size={18} aria-hidden="true" />
            <span className="text-[10px] font-bold tracking-[0.14em]">BROWSER REQUEST</span>
          </div>
          <code className="mt-4 block rounded-lg border border-cyan-200 bg-card px-3 py-3 text-xs font-bold text-foreground dark:border-cyan-900">GET /index.html</code>
          <p className="mt-2 text-[10px] leading-relaxed text-muted-foreground">HTTP/2 frame을 TLS record에 담아 전송</p>
        </motion.section>

        <div className="hidden w-14 md:block"><FlowConnector label="request" tone="cyan" /></div>
        <ArrowDown className="mx-auto text-cyan-600 md:hidden" size={18} aria-hidden="true" />

        <motion.section
          initial={reducedMotion ? false : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: reducedMotion ? 0 : 0.25 }}
          className="rounded-xl border border-border bg-card p-4"
        >
          <div className="flex items-center gap-2">
            <Server size={18} className="text-cyan-600 dark:text-cyan-300" aria-hidden="true" />
            <span className="text-[10px] font-bold tracking-[0.14em] text-muted-foreground">SERVER WORK</span>
          </div>
          <div className="mt-4 space-y-2">
            {["요청 라우팅", "HTML 생성 또는 조회", "응답 직렬화"].map((label, index) => (
              <div key={label} className="flex items-center gap-2 text-[11px] text-foreground">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-muted font-mono text-[9px] font-bold text-muted-foreground">{index + 1}</span>
                {label}
              </div>
            ))}
          </div>
        </motion.section>

        <div className="hidden w-14 md:block"><FlowConnector label="response" direction="left" tone="cyan" /></div>
        <ArrowDown className="mx-auto text-cyan-600 md:hidden" size={18} aria-hidden="true" />

        <motion.section
          initial={reducedMotion ? false : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: reducedMotion ? 0 : 0.5 }}
          className="rounded-xl border border-emerald-300 bg-emerald-50 p-4 dark:border-emerald-800 dark:bg-emerald-950/30"
        >
          <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300">
            <FileCode2 size={18} aria-hidden="true" />
            <span className="text-[10px] font-bold tracking-[0.14em]">FIRST DOCUMENT</span>
          </div>
          <code className="mt-4 block rounded-lg border border-emerald-200 bg-card px-3 py-3 text-xs font-bold text-foreground dark:border-emerald-900">200 OK · text/html</code>
          <p className="mt-2 text-[10px] leading-relaxed text-muted-foreground">HTML과 CSS·JS·이미지 리소스 참조가 브라우저에 도착</p>
        </motion.section>
      </div>

      <div className="mt-6 rounded-xl border border-dashed border-border bg-muted/25 px-4 py-3 text-center text-[10px] leading-relaxed text-muted-foreground">
        HTML 내부의 추가 리소스 참조는 후속 요청을 만들 수 있습니다. 여기서는 첫 문서가 렌더 엔진으로 넘어가는 경계를 보여 줍니다.
      </div>
    </div>
  );
}

function RenderScene() {
  const reducedMotion = useReducedMotion() ?? false;
  const renderStages = [
    { label: "Render Tree", detail: "보이는 노드 결합", icon: Layers3 },
    { label: "Layout", detail: "크기와 위치 계산", icon: CircleDot },
    { label: "Paint", detail: "픽셀 명령 생성", icon: Paintbrush },
    { label: "Composite", detail: "레이어 합성", icon: MonitorUp },
  ];

  return (
    <div className="min-h-[390px] p-4 sm:p-5">
      <div className="grid gap-3 sm:grid-cols-[1fr_auto_1fr]">
        <motion.section
          initial={reducedMotion ? false : { opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          className="rounded-xl border border-border bg-card p-4"
        >
          <div className="flex items-center justify-between gap-2">
            <div>
              <div className="text-[9px] font-bold tracking-[0.14em] text-muted-foreground">HTML PARSER</div>
              <div className="mt-1 text-sm font-bold text-foreground">DOM</div>
            </div>
            <FileCode2 size={20} className="text-blue-600 dark:text-blue-300" aria-hidden="true" />
          </div>
          <div className="mt-4 space-y-1.5 font-mono text-[10px] text-muted-foreground">
            <div className="rounded bg-muted/60 px-2 py-1">html</div>
            <div className="ml-3 rounded bg-muted/60 px-2 py-1">body</div>
            <div className="ml-6 rounded bg-blue-500/10 px-2 py-1 text-blue-700 dark:text-blue-300">main</div>
          </div>
        </motion.section>

        <div className="flex items-center justify-center text-emerald-600 dark:text-emerald-300">
          <span className="rounded-full border border-emerald-300 bg-emerald-50 px-2 py-1 text-[9px] font-bold dark:border-emerald-800 dark:bg-emerald-950/30">MERGE</span>
        </div>

        <motion.section
          initial={reducedMotion ? false : { opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          className="rounded-xl border border-border bg-card p-4"
        >
          <div className="flex items-center justify-between gap-2">
            <div>
              <div className="text-[9px] font-bold tracking-[0.14em] text-muted-foreground">CSS PARSER</div>
              <div className="mt-1 text-sm font-bold text-foreground">CSSOM</div>
            </div>
            <Paintbrush size={20} className="text-violet-600 dark:text-violet-300" aria-hidden="true" />
          </div>
          <div className="mt-4 space-y-1.5 font-mono text-[10px] text-muted-foreground">
            <div className="rounded bg-muted/60 px-2 py-1">display: block</div>
            <div className="rounded bg-muted/60 px-2 py-1">font-size: 16px</div>
            <div className="rounded bg-violet-500/10 px-2 py-1 text-violet-700 dark:text-violet-300">color: foreground</div>
          </div>
        </motion.section>
      </div>

      <div className="my-3 flex justify-center"><ArrowDown size={18} className="text-emerald-600 dark:text-emerald-300" aria-hidden="true" /></div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {renderStages.map((stage, index) => {
          const Icon = stage.icon;
          const final = index === renderStages.length - 1;

          return (
            <motion.div
              key={stage.label}
              initial={reducedMotion ? false : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: reducedMotion ? 0 : 0.18 + index * 0.14 }}
              className={`relative rounded-xl border p-3 ${
                final ? "border-emerald-300 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950/30" : "border-border bg-card"
              }`}
            >
              <Icon size={17} className={final ? "text-emerald-700 dark:text-emerald-300" : "text-muted-foreground"} aria-hidden="true" />
              <div className="mt-2 text-[11px] font-bold text-foreground">{stage.label}</div>
              <div className="mt-0.5 text-[9px] text-muted-foreground">{stage.detail}</div>
              {index < renderStages.length - 1 && (
                <ArrowRight size={14} className="absolute -right-3 top-1/2 z-10 hidden -translate-y-1/2 text-muted-foreground sm:block" aria-hidden="true" />
              )}
            </motion.div>
          );
        })}
      </div>

      <motion.div
        initial={reducedMotion ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: reducedMotion ? 0 : 0.85 }}
        className="mt-4 flex items-center justify-center gap-2 text-center"
      >
        <Check size={15} className="text-emerald-600 dark:text-emerald-300" aria-hidden="true" />
        <span className="text-xs font-bold text-foreground">사용자에게 첫 화면 표시</span>
      </motion.div>
    </div>
  );
}

function JourneyTimeline({ activeIndex }: { activeIndex: number }) {
  return (
    <section className="rounded-xl border border-border bg-card p-4" aria-label="전체 페이지 로딩 여정">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <div className="text-[9px] font-bold tracking-[0.16em] text-muted-foreground">END-TO-END JOURNEY</div>
          <div className="mt-1 text-xs font-bold text-foreground">URL 입력부터 첫 화면까지</div>
        </div>
        <span className="text-[9px] text-muted-foreground">개념적 순서 · 실제 소요 시간은 환경에 따라 달라짐</span>
      </div>

      <div className="mt-4 grid grid-cols-4 gap-1">
        {phases.map((phase, index) => {
          const tone = phaseTone[phase.id];
          const active = index === activeIndex;
          const visited = index < activeIndex;

          return (
            <div key={phase.id} className="min-w-0">
              <div className={`h-2 rounded-full ${active || visited ? tone.solid : "bg-muted"}`} />
              <div className="mt-2 flex items-start gap-1.5">
                <span className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[8px] font-bold ${
                  active
                    ? `${tone.soft} ${tone.text} ring-1 ring-current`
                    : visited
                      ? "bg-muted text-foreground"
                      : "bg-muted text-muted-foreground"
                }`}>
                  {visited ? <Check size={9} aria-hidden="true" /> : index + 1}
                </span>
                <div className="min-w-0">
                  <div className={`truncate text-[9px] font-bold sm:text-[10px] ${active ? tone.text : "text-foreground"}`}>{phase.title}</div>
                  <div className="mt-0.5 hidden truncate text-[8px] text-muted-foreground sm:block">{phase.duration}</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function ActiveScene({ phase }: { phase: PhaseId }) {
  switch (phase) {
    case "dns":
      return <DnsScene />;
    case "connect":
      return <ConnectionScene />;
    case "document":
      return <DocumentScene />;
    case "render":
      return <RenderScene />;
  }
}

export default function GoogleDnsViz() {
  const reducedMotion = useReducedMotion() ?? false;
  const [activeIndex, setActiveIndex] = useState(0);
  const [playing, setPlaying] = useState(true);
  const activePhase = phases[activeIndex];

  useEffect(() => {
    if (!playing) return;

    const timer = window.setTimeout(() => {
      setActiveIndex((current) => (current + 1) % phases.length);
    }, phaseDelayMs);

    return () => window.clearTimeout(timer);
  }, [activeIndex, playing]);

  const selectPhase = (index: number) => {
    setActiveIndex(index);
    setPlaying(false);
  };

  return (
    <div className="flex w-full flex-col gap-3">
      <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-3 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="text-[10px] font-bold tracking-[0.17em] text-muted-foreground">BROWSER LOAD JOURNEY</div>
            <div className="mt-0.5 truncate text-sm font-bold text-foreground">주소 입력이 화면으로 바뀌는 네 번의 전환</div>
          </div>
          <button
            type="button"
            onClick={() => setPlaying((current) => !current)}
            aria-label={playing ? "자동 재생 일시정지" : "자동 재생 시작"}
            title={playing ? "일시정지" : "재생"}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border bg-card text-primary transition-colors hover:bg-muted"
          >
            {playing ? <Pause size={16} aria-hidden="true" /> : <Play size={16} aria-hidden="true" />}
          </button>
        </div>
        <StageRail activeIndex={activeIndex} onSelect={selectPhase} />
      </div>

      <section className="overflow-hidden rounded-2xl border border-border bg-muted/20 shadow-sm">
        <SceneHeader phase={activePhase} />
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={activePhase.id}
            initial={reducedMotion ? false : { opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={reducedMotion ? undefined : { opacity: 0, x: -12 }}
            transition={{ duration: reducedMotion ? 0 : 0.24 }}
          >
            <ActiveScene phase={activePhase.id} />
          </motion.div>
        </AnimatePresence>
      </section>

      <JourneyTimeline activeIndex={activeIndex} />
    </div>
  );
}
