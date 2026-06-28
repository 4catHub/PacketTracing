import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Pause, ChevronLeft, ChevronRight, RotateCcw, Clock } from "lucide-react";

const STEPS = [
  { title: "OS 캐시 & /etc/hosts 확인", timing: "< 1ms", nodes: [0, 1], desc: "브라우저 DNS 캐시 미스 후, OS의 DNS 캐시와 /etc/hosts 파일을 조회합니다." },
  { title: "재귀 DNS Resolver 질의", timing: "~10–20ms", nodes: [1, 2], desc: "OS가 ISP의 재귀 DNS Resolver에 google.com 주소를 요청합니다." },
  { title: "Root Nameserver 질의", timing: "~20–40ms", nodes: [2, 3], desc: "Resolver가 Root NS에 .com 담당 TLD Nameserver 주소를 요청합니다." },
  { title: ".com TLD Nameserver 질의", timing: "~30–50ms", nodes: [3, 4], desc: "Root NS가 .com TLD NS 주소를 반환, Resolver가 .com NS에 질의합니다." },
  { title: "Authoritative NS 질의 → IP 반환", timing: "~40–60ms", nodes: [4, 5], desc: "TLD NS가 google.com 권한 NS 주소를 반환, 최종 IP 주소를 획득합니다." },
  { title: "IP 수신 완료", timing: "~0ms", nodes: [5, 0], desc: "IP 주소가 Auth NS → Resolver → OS → Browser 순서로 전달됩니다." },
  { title: "TCP 3-way Handshake", timing: "1 RTT", nodes: [0, 6], desc: "SYN → SYN-ACK → ACK 3단계로 신뢰할 수 있는 TCP 연결을 수립합니다." },
  { title: "TLS 1.3 Handshake", timing: "1 RTT", nodes: [6, 7], desc: "암호화 키 교환 후 안전한 HTTPS 채널을 구성합니다 (1-RTT)." },
  { title: "HTTP/2 GET 요청 전송", timing: "~1–5ms", nodes: [7, 8], desc: "브라우저가 GET www.google.com 요청을 암호화된 채널로 전송합니다." },
  { title: "서버 응답 (HTML + 리소스)", timing: "~20–100ms", nodes: [8, 0], desc: "서버가 HTML, CSS, JS, 이미지 등 모든 리소스를 응답합니다." },
  { title: "HTML 파싱 & 페이지 렌더링", timing: "~50–500ms", nodes: [0, 9], desc: "DOM Tree → CSSOM → Render Tree → Layout → Paint 순서로 화면을 그립니다." },
];

const NODES = [
  { id: 0, icon: "🌐", label: "Browser" },
  { id: 1, icon: "💻", label: "OS / hosts" },
  { id: 2, icon: "🔄", label: "DNS Resolver" },
  { id: 3, icon: "🌍", label: "Root NS" },
  { id: 4, icon: "📋", label: "TLD NS" },
  { id: 5, icon: "🔑", label: "Auth NS" },
  { id: 6, icon: "🤝", label: "TCP" },
  { id: 7, icon: "🔒", label: "TLS 1.3" },
  { id: 8, icon: "🖥️", label: "Web Server" },
  { id: 9, icon: "🎨", label: "Render" },
];

type Status = "idle" | "active" | "done" | "dim";

function nodeStatus(id: number, active: number): Status {
  if (active < 0) return "idle";
  if (STEPS[active]?.nodes.includes(id)) return "active";
  for (let i = 0; i < active; i++) if (STEPS[i].nodes.includes(id)) return "done";
  return "dim";
}

function edgeStatus(edge: number, active: number): Status {
  if (active < 0) return "idle";
  if (active === edge) return "active";
  if (active > edge) return "done";
  return "dim";
}

const NODE_BASE = "flex flex-col items-center gap-1 p-2 rounded-xl border-2 text-center transition-all duration-300 w-[72px] shrink-0";
const NODE_STATUS: Record<Status, string> = {
  idle: "border-border bg-card",
  active: "border-blue-400 bg-blue-50 dark:bg-blue-900/20 ring-2 ring-blue-400 ring-offset-1 dark:ring-offset-background shadow-lg shadow-blue-500/20",
  done: "border-emerald-400 bg-emerald-50 dark:bg-emerald-900/20",
  dim: "border-border bg-card opacity-20",
};

function ArchNode({ id, active }: { id: number; active: number }) {
  const def = NODES.find(n => n.id === id)!;
  const s = nodeStatus(id, active);
  return (
    <motion.div
      animate={s === "active" ? { scale: [1, 1.06, 1] } : { scale: 1 }}
      transition={s === "active" ? { repeat: Infinity, duration: 1.2, ease: "easeInOut" } : {}}
      className={`${NODE_BASE} ${NODE_STATUS[s]}`}
    >
      <span className="text-xl leading-none">{def.icon}</span>
      <span className="text-[10px] font-bold leading-tight">{def.label}</span>
    </motion.div>
  );
}

function ArrowH({ edge, active }: { edge: number; active: number }) {
  const s = edgeStatus(edge, active);
  const started = active >= 0;
  const line = s === "active" ? "bg-blue-500" : s === "done" ? "bg-emerald-400" : started ? "bg-border/25" : "bg-border/50";
  const head = s === "active" ? "border-l-blue-500" : s === "done" ? "border-l-emerald-400" : started ? "border-l-border/25" : "border-l-border/50";
  const badge = s === "active" ? "bg-blue-500 text-white shadow" : s === "done" ? "bg-emerald-500 text-white" : "bg-muted text-muted-foreground/50";
  return (
    <div className="relative flex items-center w-10 shrink-0 mx-0.5">
      <div className={`h-0.5 flex-1 transition-colors duration-300 ${line}`} />
      <div className={`w-0 h-0 border-t-[4px] border-b-[4px] border-l-[6px] border-transparent transition-colors duration-300 ${head}`} />
      <div className={`absolute -top-[18px] left-1/2 -translate-x-1/2 w-5 h-5 rounded-full text-[9px] font-bold flex items-center justify-center transition-all duration-300 ${badge}`}>
        {edge + 1}
      </div>
    </div>
  );
}

function ArrowV({ edge, active }: { edge: number; active: number }) {
  const s = edgeStatus(edge, active);
  const started = active >= 0;
  const line = s === "active" ? "bg-blue-500" : s === "done" ? "bg-emerald-400" : started ? "bg-border/25" : "bg-border/50";
  const head = s === "active" ? "border-t-blue-500" : s === "done" ? "border-t-emerald-400" : started ? "border-t-border/25" : "border-t-border/50";
  const badge = s === "active" ? "bg-blue-500 text-white shadow" : s === "done" ? "bg-emerald-500 text-white" : "bg-muted text-muted-foreground/50";
  return (
    <div className="relative flex flex-col items-center h-8 shrink-0 my-0.5">
      <div className={`w-0.5 flex-1 transition-colors duration-300 ${line}`} />
      <div className={`w-0 h-0 border-l-[4px] border-r-[4px] border-t-[6px] border-transparent transition-colors duration-300 ${head}`} />
      <div className={`absolute -right-6 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full text-[9px] font-bold flex items-center justify-center transition-all duration-300 ${badge}`}>
        {edge + 1}
      </div>
    </div>
  );
}

function ReturnArrow({ edge, active, label }: { edge: number; active: number; label: string }) {
  const s = edgeStatus(edge, active);
  const started = active >= 0;
  return (
    <div className={`relative flex items-center gap-2 rounded-lg border border-dashed px-3 py-1.5 mt-2 transition-all duration-300 ${
      s === "active" ? "border-blue-400 bg-blue-50/60 dark:bg-blue-900/10" :
      s === "done" ? "border-emerald-400/60 bg-emerald-50/30 dark:bg-emerald-900/5" :
      started ? "border-border/15 opacity-25" : "border-border/40"
    }`}>
      <div className={`w-5 h-5 rounded-full text-[9px] font-bold flex items-center justify-center shrink-0 transition-colors duration-300 ${
        s === "active" ? "bg-blue-500 text-white" : s === "done" ? "bg-emerald-500 text-white" : "bg-muted text-muted-foreground/50"
      }`}>{edge + 1}</div>
      <span className={`text-xs font-medium transition-colors duration-300 ${
        s === "active" ? "text-blue-700 dark:text-blue-300" : s === "done" ? "text-emerald-700 dark:text-emerald-300" : "text-muted-foreground/40"
      }`}>{label}</span>
    </div>
  );
}

export default function GoogleDnsViz() {
  const [activeStep, setActiveStep] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const total = STEPS.length;
  const isComplete = activeStep >= total - 1;

  useEffect(() => {
    if (!isPlaying) return;
    if (isComplete) { setIsPlaying(false); return; }
    const t = setTimeout(() => setActiveStep(p => p + 1), 1800);
    return () => clearTimeout(t);
  }, [isPlaying, activeStep, isComplete]);

  const handlePlay = useCallback(() => {
    if (isComplete) { setActiveStep(-1); setTimeout(() => setIsPlaying(true), 50); }
    else setIsPlaying(p => !p);
  }, [isComplete]);

  const handleNext = useCallback(() => { setIsPlaying(false); if (activeStep < total - 1) setActiveStep(p => p + 1); }, [activeStep, total]);
  const handlePrev = useCallback(() => { setIsPlaying(false); if (activeStep >= 0) setActiveStep(p => p - 1); }, [activeStep]);
  const handleReset = useCallback(() => { setIsPlaying(false); setActiveStep(-1); }, []);

  const progress = ((activeStep + 1) / total) * 100;

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex items-center gap-2 flex-wrap">
        <button onClick={handleReset} className="p-2 rounded-lg border border-card-border bg-card hover:bg-muted text-muted-foreground" data-testid="button-reset"><RotateCcw size={15} /></button>
        <button onClick={handlePrev} disabled={activeStep < 0} className="p-2 rounded-lg border border-card-border bg-card hover:bg-muted text-muted-foreground disabled:opacity-40" data-testid="button-prev"><ChevronLeft size={15} /></button>
        <button onClick={handlePlay} className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:opacity-90 text-sm font-medium" data-testid="button-play-pause">
          {isPlaying ? <Pause size={14} /> : <Play size={14} />}
          {isComplete ? "다시 보기" : isPlaying ? "일시정지" : activeStep < 0 ? "시작" : "계속"}
        </button>
        <button onClick={handleNext} disabled={isComplete} className="p-2 rounded-lg border border-card-border bg-card hover:bg-muted text-muted-foreground disabled:opacity-40" data-testid="button-next"><ChevronRight size={15} /></button>
        <div className="flex-1 space-y-1">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>단계 {Math.max(0, activeStep + 1)} / {total}</span>
            {activeStep >= 0 && <span className="flex items-center gap-1"><Clock size={10} />{STEPS[activeStep].timing}</span>}
          </div>
          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
            <motion.div className="h-full bg-primary rounded-full" animate={{ width: `${Math.max(0, progress)}%` }} transition={{ duration: 0.4 }} />
          </div>
        </div>
      </div>

      {/* Architecture Diagram */}
      <div className="space-y-3 overflow-x-auto pb-2">

        {/* Zone 1: DNS Resolution */}
        <div className="rounded-xl border border-border bg-muted/10 p-4 min-w-[500px]">
          <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">🔍 DNS 조회</div>
          <div className="flex items-start gap-0">
            {/* Horizontal chain: Browser → OS → Resolver → (right-angle into vertical NS chain) */}
            <div className="flex items-center gap-0">
              <ArchNode id={0} active={activeStep} />
              <ArrowH edge={0} active={activeStep} />
              <ArchNode id={1} active={activeStep} />
              <ArrowH edge={1} active={activeStep} />
              <ArchNode id={2} active={activeStep} />
              <ArrowH edge={2} active={activeStep} />
            </div>
            {/* Vertical NS chain */}
            <div className="flex flex-col items-center">
              <ArchNode id={3} active={activeStep} />
              <ArrowV edge={3} active={activeStep} />
              <ArchNode id={4} active={activeStep} />
              <ArrowV edge={4} active={activeStep} />
              <ArchNode id={5} active={activeStep} />
            </div>
          </div>
          <ReturnArrow edge={5} active={activeStep} label="← IP 주소 반환 (Auth NS → Resolver → OS → Browser)" />
        </div>

        {/* Zone 2: TCP/HTTP */}
        <div className="rounded-xl border border-border bg-muted/10 p-4 min-w-[500px]">
          <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">🌐 연결 & HTTP</div>
          <div className="flex items-center gap-0">
            <ArchNode id={0} active={activeStep} />
            <ArrowH edge={6} active={activeStep} />
            <ArchNode id={6} active={activeStep} />
            <ArrowH edge={7} active={activeStep} />
            <ArchNode id={7} active={activeStep} />
            <ArrowH edge={8} active={activeStep} />
            <ArchNode id={8} active={activeStep} />
          </div>
          <ReturnArrow edge={9} active={activeStep} label="← 서버 응답 (HTML + CSS + JS + 리소스)" />
          <div className="flex items-center gap-0 mt-3">
            <ArchNode id={0} active={activeStep} />
            <ArrowH edge={10} active={activeStep} />
            <ArchNode id={9} active={activeStep} />
          </div>
        </div>
      </div>

      {/* Step callout */}
      <AnimatePresence mode="wait">
        {activeStep >= 0 && activeStep < total && (
          <motion.div key={activeStep} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
            className="p-4 rounded-xl border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-blue-500 text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">{activeStep + 1}</div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-sm text-foreground">{STEPS[activeStep].title}</div>
                <div className="text-xs text-muted-foreground mt-0.5">{STEPS[activeStep].desc}</div>
              </div>
              <span className="text-xs text-muted-foreground flex items-center gap-1 shrink-0 mt-0.5"><Clock size={10} />{STEPS[activeStep].timing}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {isComplete && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl text-center">
          <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">
            🎉 전체 과정 완료! 이 모든 단계가 브라우저에서 수백 밀리초 안에 일어납니다.
          </p>
        </motion.div>
      )}
    </div>
  );
}
