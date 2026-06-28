import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Play, Pause, ChevronLeft, ChevronRight, RotateCcw, CheckCircle, Clock } from "lucide-react";

interface Step {
  id: number;
  actor: string;
  actorColor: string;
  nodeIdx: number;
  title: string;
  timing: string;
}

const STEPS: Step[] = [
  { id: 0, actor: "Browser", actorColor: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300", nodeIdx: 0, title: "Browser DNS 캐시 확인", timing: "< 1ms" },
  { id: 1, actor: "OS", actorColor: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300", nodeIdx: 1, title: "OS 캐시 & /etc/hosts 확인", timing: "~1ms" },
  { id: 2, actor: "DNS Resolver", actorColor: "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300", nodeIdx: 2, title: "재귀 DNS Resolver 질의", timing: "~10–20ms" },
  { id: 3, actor: "Root NS", actorColor: "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300", nodeIdx: 3, title: "Root Nameserver 질의", timing: "~20–40ms" },
  { id: 4, actor: "TLD NS", actorColor: "bg-fuchsia-100 text-fuchsia-700 dark:bg-fuchsia-900/40 dark:text-fuchsia-300", nodeIdx: 4, title: ".com TLD Nameserver 질의", timing: "~30–50ms" },
  { id: 5, actor: "Auth NS", actorColor: "bg-pink-100 text-pink-700 dark:bg-pink-900/40 dark:text-pink-300", nodeIdx: 5, title: "Authoritative NS → IP 반환", timing: "~40–60ms" },
  { id: 6, actor: "Browser", actorColor: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300", nodeIdx: 0, title: "IP 수신 완료", timing: "~0ms" },
  { id: 7, actor: "Network", actorColor: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-300", nodeIdx: 6, title: "TCP 3-way Handshake", timing: "1 RTT" },
  { id: 8, actor: "Network", actorColor: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-300", nodeIdx: 6, title: "TLS 1.3 Handshake", timing: "1 RTT" },
  { id: 9, actor: "Browser", actorColor: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300", nodeIdx: 0, title: "HTTP/2 GET 요청 전송", timing: "~1–5ms" },
  { id: 10, actor: "Server", actorColor: "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300", nodeIdx: 7, title: "서버 응답 (HTML + 리소스)", timing: "~20–100ms" },
  { id: 11, actor: "Browser", actorColor: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300", nodeIdx: 0, title: "HTML 파싱 & 페이지 렌더링", timing: "~50–500ms" },
];

// Flow diagram nodes
const FLOW_NODES = [
  { label: "Browser", color: "bg-blue-500", icon: "🌐" },
  { label: "OS / hosts", color: "bg-indigo-500", icon: "💻" },
  { label: "DNS Resolver", color: "bg-violet-500", icon: "🔄" },
  { label: "Root NS", color: "bg-purple-500", icon: "🌍" },
  { label: "TLD NS (.com)", color: "bg-fuchsia-500", icon: "📋" },
  { label: "Auth NS", color: "bg-pink-500", icon: "🔑" },
  { label: "Network (TCP/TLS)", color: "bg-cyan-500", icon: "🔗" },
  { label: "Web Server", color: "bg-orange-500", icon: "🖥️" },
];

export default function GoogleDnsViz() {
  const [activeStep, setActiveStep] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(false);

  const isComplete = activeStep >= STEPS.length - 1;

  useEffect(() => {
    if (!isPlaying) return;
    if (isComplete) { setIsPlaying(false); return; }
    const timer = setTimeout(() => setActiveStep((prev) => prev + 1), 1800);
    return () => clearTimeout(timer);
  }, [isPlaying, activeStep, isComplete]);

  const handlePlay = useCallback(() => {
    if (isComplete) { setActiveStep(-1); setIsPlaying(true); }
    else setIsPlaying((p) => !p);
  }, [isComplete]);

  const handleNext = useCallback(() => {
    setIsPlaying(false);
    if (activeStep < STEPS.length - 1) setActiveStep((p) => p + 1);
  }, [activeStep]);

  const handlePrev = useCallback(() => {
    setIsPlaying(false);
    if (activeStep > -1) setActiveStep((p) => p - 1);
  }, [activeStep]);

  const handleReset = useCallback(() => { setIsPlaying(false); setActiveStep(-1); }, []);

  const activeNodeIdx = activeStep >= 0 ? STEPS[activeStep].nodeIdx : -1;
  const progress = ((activeStep + 1) / STEPS.length) * 100;

  return (
    <div className="space-y-5">
      {/* Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex items-center gap-2">
          <button onClick={handleReset} className="p-2 rounded-lg border border-card-border bg-card hover:bg-muted transition-colors text-muted-foreground" data-testid="button-reset" title="처음으로">
            <RotateCcw size={16} />
          </button>
          <button onClick={handlePrev} disabled={activeStep < 0} className="p-2 rounded-lg border border-card-border bg-card hover:bg-muted transition-colors text-muted-foreground disabled:opacity-40 disabled:cursor-not-allowed" data-testid="button-prev">
            <ChevronLeft size={16} />
          </button>
          <button onClick={handlePlay} className="flex items-center gap-2 px-5 py-2 rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition-opacity text-sm font-medium" data-testid="button-play-pause">
            {isPlaying ? <Pause size={15} /> : <Play size={15} />}
            {isComplete ? "다시 보기" : isPlaying ? "일시정지" : activeStep < 0 ? "시작" : "계속"}
          </button>
          <button onClick={handleNext} disabled={isComplete} className="p-2 rounded-lg border border-card-border bg-card hover:bg-muted transition-colors text-muted-foreground disabled:opacity-40 disabled:cursor-not-allowed" data-testid="button-next">
            <ChevronRight size={16} />
          </button>
        </div>
        <div className="flex-1 space-y-1">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>단계 {Math.max(0, activeStep + 1)} / {STEPS.length}</span>
            {activeStep >= 0 && (
              <span className="flex items-center gap-1">
                <Clock size={11} />
                {STEPS[activeStep].timing}
              </span>
            )}
          </div>
          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
            <motion.div className="h-full bg-primary rounded-full" animate={{ width: `${Math.max(0, progress)}%` }} transition={{ duration: 0.4 }} />
          </div>
        </div>
      </div>

      {/* Main content: flow diagram + step list */}
      <div className="grid lg:grid-cols-[200px_1fr] gap-5">
        {/* Actor flow diagram */}
        <div className="hidden lg:flex flex-col gap-0 items-center">
          {FLOW_NODES.map((node, i) => {
            const isActive = i === activeNodeIdx;
            const hasBeenActive = activeStep >= 0 && STEPS.slice(0, activeStep + 1).some(s => s.nodeIdx === i);
            return (
              <div key={node.label} className="flex flex-col items-center w-full">
                <div className={`w-full py-2 px-3 rounded-lg text-xs font-medium flex items-center gap-2 transition-all duration-300 ${
                  isActive
                    ? "bg-primary text-primary-foreground shadow-md scale-[1.02]"
                    : hasBeenActive
                    ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                    : "bg-muted text-muted-foreground"
                }`}>
                  <span>{node.icon}</span>
                  <span className="truncate">{node.label}</span>
                </div>
                {i < FLOW_NODES.length - 1 && (
                  <div className={`w-0.5 h-3 transition-colors duration-300 ${
                    hasBeenActive && activeStep >= 0 && STEPS.slice(0, activeStep + 1).some(s => s.nodeIdx === i)
                      ? "bg-emerald-400"
                      : "bg-muted/40"
                  }`} />
                )}
              </div>
            );
          })}
        </div>

        {/* Step list */}
        <div className="space-y-1.5 overflow-y-auto max-h-[480px] pr-1">
          {STEPS.map((step, i) => {
            const isActive = i === activeStep;
            const isDone = i < activeStep;

            return (
              <div
                key={step.id}
                className={`rounded-xl border transition-colors cursor-pointer px-3 py-2.5 ${
                  isActive
                    ? "border-primary/50 bg-primary/5"
                    : isDone
                    ? "border-card-border bg-card opacity-60"
                    : "border-card-border bg-card"
                }`}
                onClick={() => { setIsPlaying(false); setActiveStep(i); }}
                data-testid={`step-${step.id}`}
              >
                <div className="flex items-center gap-3">
                  <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                    isDone
                      ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400"
                      : isActive
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  }`}>
                    {isDone ? <CheckCircle size={13} /> : i + 1}
                  </div>
                  <div className="flex items-center gap-2 flex-wrap flex-1 min-w-0">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${step.actorColor}`}>
                      {step.actor}
                    </span>
                    <span className={`text-sm font-medium truncate ${
                      isActive ? "text-primary" : isDone ? "text-foreground" : "text-muted-foreground"
                    }`}>
                      {step.title}
                    </span>
                    <span className="text-xs text-muted-foreground ml-auto flex-shrink-0 flex items-center gap-0.5">
                      <Clock size={10} />{step.timing}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {isComplete && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl text-center"
        >
          <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">
            전체 과정 완료! 이 모든 단계가 브라우저에서 수백 밀리초 안에 일어납니다.
          </p>
        </motion.div>
      )}
    </div>
  );
}
