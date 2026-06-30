import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Pause, ChevronLeft, ChevronRight, RotateCcw, Link2, Send, ArrowRightLeft } from "lucide-react";

const STEPS = [
  {
    title: "1. 연결 수립 (Connection Open)",
    pollingDesc: "매번 새로운 HTTP GET 요청을 보내고 응답을 받으며 단발성 연결을 맺습니다.",
    sseDesc: "최초에 HTTP GET 요청(EventSource)을 보내 서버와 지속성(Persistent) 단방향 스트림 연결을 맺습니다.",
    wsDesc: "HTTP 101 Switching Protocols 핸드셰이크를 통해 TCP 상시 양방향 소켓 통신 채널을 맺습니다.",
    activeNodes: { polling: [0, 1], sse: [2, 3], ws: [4, 5] },
  },
  {
    title: "2. 클라이언트 데이터 전송 (Client Write)",
    pollingDesc: "클라이언트가 새로운 데이터를 전송할 때마다 새로운 HTTP POST/PUT 요청을 수립해 전송합니다.",
    sseDesc: "SSE는 수신 전용 스트림이므로, 클라이언트가 데이터를 전송하려면 별도의 일반 HTTP 요청을 쏘아야 합니다.",
    wsDesc: "기존에 수립된 소켓 연결 위로 프레임(Frame) 규격의 가벼운 이진/텍스트 패킷을 직접 즉시 전송합니다.",
    activeNodes: { polling: [0, 1], sse: [2, 3], ws: [4, 5] },
  },
  {
    title: "3. 서버 데이터 푸시 (Server Push / Real-time)",
    pollingDesc: "서버는 클라이언트가 다시 물어볼(Polling) 때까지 새 데이터를 쥐고 있다가, 요청이 오면 그제서야 응답으로 돌려줍니다. (실시간 지연 발생)",
    sseDesc: "서버에서 새로운 이벤트가 발생하면, 열려 있는 HTTP 스트림을 통해 클라이언트로 데이터를 실시간 즉시 푸시합니다.",
    wsDesc: "서버가 이벤트 발생 즉시 열려 있는 양방향 통신 관을 통해 클라이언트로 데이터를 즉시 전송합니다.",
    activeNodes: { polling: [1, 0], sse: [3, 2], ws: [5, 4] },
  },
  {
    title: "4. 연결 종료 및 관리 (Cleanup / Connection Lifecycle)",
    pollingDesc: "응답을 받자마자 바로 HTTP 연결을 끊습니다. 다음 데이터 확인 시 다시 연결을 맺는 오버헤드가 발생합니다.",
    sseDesc: "연결 유지를 위해 주기적으로 가벼운 Keep-Alive 핑을 주고받으며 스트림을 계속 유지합니다. 끊기면 자동 재연결합니다.",
    wsDesc: "명시적으로 Close 프레임을 보내 연결을 끊기 전까지는 하나의 커넥션을 계속 유지하며 무정전 통신을 합니다.",
    activeNodes: { polling: [0, 1], sse: [2, 3], ws: [4, 5] },
  },
];

const POLLING_NODES = [
  { id: 0, label: "Client (Browser)", icon: "👤" },
  { id: 1, label: "Polling Server", icon: "🖥️", sub: "HTTP 1.1" },
];

const SSE_NODES = [
  { id: 2, label: "Client (EventSource)", icon: "👤" },
  { id: 3, label: "SSE Server", icon: "🖥️", sub: "Event-Stream" },
];

const WS_NODES = [
  { id: 4, label: "Client (Socket)", icon: "👤" },
  { id: 5, label: "WS Server", icon: "🖥️", sub: "WS Protocol" },
];

const COMPARISON = [
  { feature: "통신 방향성", polling: "단방향 (요청 후 응답)", sse: "단방향 (서버 ➔ 클라이언트)", ws: "양방향 (상시 송수신)" },
  { feature: "프로토콜", polling: "HTTP/1.1 or HTTP/2", sse: "HTTP (text/event-stream)", ws: "ws:// 또는 wss:// (별도 프로토콜)" },
  { feature: "헤더 오버헤드", polling: "매 요청마다 쿠키/헤더 포함 (매우 큼)", sse: "초기 연결 시에만 헤더 전송 (매우 작음)", ws: "프레임 구조로 헤더 크기 2~10 바이트 (최소화)" },
  { feature: "연결 유지 방식", polling: "단발성 연결 소멸 반복", sse: "지속성 연결 (Persistent)", ws: "지속성 연결 (Persistent)" },
  { feature: "자동 재연결", polling: "N/A (주기적 재요청)", sse: "브라우저 기본 내장 (자동 복구)", ws: "직접 구현 필요 (JS 핸들러)" },
  { feature: "적합한 서비스", polling: "어드민 대시보드, 빈도 낮은 모니터링", sse: "알림 피드, 실시간 스포츠 중계, 뉴스 피드", ws: "실시간 채팅, 웹게임, 주식 HTS, 협업 보드" },
];

type Status = "idle" | "active" | "done" | "dim";

function getStatus(nodeId: number, activeStep: number, type: "polling" | "sse" | "ws"): Status {
  if (activeStep < 0) return "idle";
  const cur = STEPS[activeStep];
  const activeList = cur.activeNodes[type];
  if (activeList.includes(nodeId)) return "active";

  for (let i = 0; i < activeStep; i++) {
    if (STEPS[i].activeNodes[type].includes(nodeId)) return "done";
  }
  return "dim";
}

const NODE_BASE = "flex flex-col items-center gap-1 p-2 rounded-xl border-2 text-center transition-all duration-300 w-[95px] shrink-0 bg-card";
const STATUS_STYLES: Record<Status, string> = {
  idle: "border-border",
  active: "border-blue-400 ring-2 ring-blue-400 ring-offset-1 dark:ring-offset-background shadow-lg shadow-blue-500/20",
  done: "border-emerald-400 bg-emerald-50/50 dark:bg-emerald-950/20",
  dim: "border-border opacity-20",
};

export default function RealtimeProtocolsViz() {
  const [activeStep, setActiveStep] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const total = STEPS.length;
  const isComplete = activeStep >= total - 1;

  useEffect(() => {
    if (!isPlaying) return;
    if (isComplete) {
      setIsPlaying(false);
      return;
    }
    const t = setTimeout(() => setActiveStep((p) => p + 1), 2200);
    return () => clearTimeout(t);
  }, [isPlaying, activeStep, isComplete]);

  const handleReset = useCallback(() => {
    setIsPlaying(false);
    setActiveStep(-1);
  }, []);

  const handlePlay = useCallback(() => {
    if (isComplete) {
      handleReset();
      setTimeout(() => setIsPlaying(true), 50);
    } else {
      setIsPlaying((p) => !p);
    }
  }, [isComplete, handleReset]);

  const handleNext = useCallback(() => {
    setIsPlaying(false);
    if (activeStep < total - 1) setActiveStep((p) => p + 1);
  }, [activeStep, total]);

  const handlePrev = useCallback(() => {
    setIsPlaying(false);
    if (activeStep >= 0) setActiveStep((p) => p - 1);
  }, [activeStep]);

  const progress = ((activeStep + 1) / total) * 100;

  // 화살표 활성화 검사
  const getArrowStyle = (type: "polling" | "sse" | "ws") => {
    if (activeStep < 0) return { line: "bg-border/50", head: "border-t-border/50" };
    const cur = STEPS[activeStep];
    const nodes = cur.activeNodes[type];
    const isForward = nodes[0] < nodes[1];

    // 현재 단계에서 활성화된 라인
    const active = true; 
    const line = active ? "bg-blue-500" : "bg-emerald-400";
    const head = isForward
      ? active ? "border-t-blue-500 rotate-180" : "border-t-emerald-400 rotate-180"
      : active ? "border-t-blue-500" : "border-t-emerald-400";

    return { line, head };
  };

  const polArrow = getArrowStyle("polling");
  const sseArrow = getArrowStyle("sse");
  const wsArrow = getArrowStyle("ws");

  return (
    <div className="space-y-5">
      {/* Controls */}
      <div className="flex items-center gap-2 flex-wrap">
        <button
          onClick={handleReset}
          className="p-2 rounded-lg border border-card-border bg-card hover:bg-muted text-muted-foreground transition-colors"
          data-testid="button-reset"
        >
          <RotateCcw size={15} />
        </button>
        <button
          onClick={handlePrev}
          disabled={activeStep < 0}
          className="p-2 rounded-lg border border-card-border bg-card hover:bg-muted text-muted-foreground disabled:opacity-40 transition-colors"
          data-testid="button-prev"
        >
          <ChevronLeft size={15} />
        </button>
        <button
          onClick={handlePlay}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:opacity-90 text-sm font-medium transition-opacity"
          data-testid="button-play-pause"
        >
          {isPlaying ? <Pause size={14} /> : <Play size={14} />}
          {isComplete ? "다시 보기" : isPlaying ? "일시정지" : activeStep < 0 ? "비교 시작" : "계속"}
        </button>
        <button
          onClick={handleNext}
          disabled={isComplete}
          className="p-2 rounded-lg border border-card-border bg-card hover:bg-muted text-muted-foreground disabled:opacity-40 transition-colors"
          data-testid="button-next"
        >
          <ChevronRight size={15} />
        </button>
        <div className="flex-1 space-y-1">
          <div className="text-xs text-muted-foreground">
            {activeStep >= 0 ? `단계 ${activeStep + 1} / ${total} — ${STEPS[activeStep].title}` : `총 ${total}단계`}
          </div>
          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-primary rounded-full"
              animate={{ width: `${Math.max(0, progress)}%` }}
              transition={{ duration: 0.4 }}
            />
          </div>
        </div>
      </div>

      {/* 3-Column Visualization Panel */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pb-2 overflow-x-auto">
        {/* Polling Column */}
        <div className="border border-border rounded-xl p-3 bg-muted/5 flex flex-col items-center gap-4 min-w-[150px]">
          <div className="flex items-center gap-1 px-2.5 py-1 bg-amber-100 text-amber-800 dark:bg-amber-950/30 dark:text-amber-400 rounded-full text-[10px] font-bold">
            <Link2 size={10} />
            Polling (단발성)
          </div>
          <div className="flex flex-col items-center">
            {/* Client Node */}
            <motion.div className={`${NODE_BASE} ${STATUS_STYLES[getStatus(0, activeStep, "polling")]}`}>
              <span className="text-lg">{POLLING_NODES[0].icon}</span>
              <span className="text-[9px] font-bold leading-tight">{POLLING_NODES[0].label}</span>
            </motion.div>

            {/* Vertical Flow Line */}
            <div className="relative flex flex-col items-center h-10 my-1">
              <div className={`w-0.5 flex-1 transition-colors duration-300 ${polArrow.line}`} />
              <div className={`w-0 h-0 border-l-[4px] border-r-[4px] border-t-[6px] border-transparent transition-transform duration-300 ${polArrow.head}`} />
            </div>

            {/* Server Node */}
            <motion.div className={`${NODE_BASE} ${STATUS_STYLES[getStatus(1, activeStep, "polling")]}`}>
              <span className="text-lg">{POLLING_NODES[1].icon}</span>
              <span className="text-[9px] font-bold leading-tight">{POLLING_NODES[1].label}</span>
              <span className="text-[7px] text-muted-foreground">{POLLING_NODES[1].sub}</span>
            </motion.div>
          </div>
          <AnimatePresence mode="wait">
            {activeStep >= 0 && (
              <motion.div key={activeStep} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="text-[10px] text-muted-foreground text-center leading-relaxed bg-muted/40 p-2 rounded-lg flex-1">
                {STEPS[activeStep].pollingDesc}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* SSE Column */}
        <div className="border border-border rounded-xl p-3 bg-muted/5 flex flex-col items-center gap-4 min-w-[150px]">
          <div className="flex items-center gap-1 px-2.5 py-1 bg-blue-100 text-blue-800 dark:bg-blue-950/30 dark:text-blue-400 rounded-full text-[10px] font-bold">
            <Send size={10} />
            SSE (단방향 푸시)
          </div>
          <div className="flex flex-col items-center">
            {/* Client Node */}
            <motion.div className={`${NODE_BASE} ${STATUS_STYLES[getStatus(2, activeStep, "sse")]}`}>
              <span className="text-lg">{SSE_NODES[0].icon}</span>
              <span className="text-[9px] font-bold leading-tight">{SSE_NODES[0].label}</span>
            </motion.div>

            {/* Vertical Flow Line */}
            <div className="relative flex flex-col items-center h-10 my-1">
              <div className={`w-0.5 flex-1 transition-colors duration-300 ${sseArrow.line}`} />
              <div className={`w-0 h-0 border-l-[4px] border-r-[4px] border-t-[6px] border-transparent transition-transform duration-300 ${sseArrow.head}`} />
            </div>

            {/* Server Node */}
            <motion.div className={`${NODE_BASE} ${STATUS_STYLES[getStatus(3, activeStep, "sse")]}`}>
              <span className="text-lg">{SSE_NODES[1].icon}</span>
              <span className="text-[9px] font-bold leading-tight">{SSE_NODES[1].label}</span>
              <span className="text-[7px] text-muted-foreground">{SSE_NODES[1].sub}</span>
            </motion.div>
          </div>
          <AnimatePresence mode="wait">
            {activeStep >= 0 && (
              <motion.div key={activeStep} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="text-[10px] text-muted-foreground text-center leading-relaxed bg-muted/40 p-2 rounded-lg flex-1">
                {STEPS[activeStep].sseDesc}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* WebSocket Column */}
        <div className="border border-border rounded-xl p-3 bg-muted/5 flex flex-col items-center gap-4 min-w-[150px]">
          <div className="flex items-center gap-1 px-2.5 py-1 bg-violet-100 text-violet-800 dark:bg-violet-950/30 dark:text-violet-400 rounded-full text-[10px] font-bold">
            <ArrowRightLeft size={10} />
            WebSocket (양방향)
          </div>
          <div className="flex flex-col items-center">
            {/* Client Node */}
            <motion.div className={`${NODE_BASE} ${STATUS_STYLES[getStatus(4, activeStep, "ws")]}`}>
              <span className="text-lg">{WS_NODES[0].icon}</span>
              <span className="text-[9px] font-bold leading-tight">{WS_NODES[0].label}</span>
            </motion.div>

            {/* Vertical Flow Line */}
            <div className="relative flex flex-col items-center h-10 my-1">
              <div className={`w-0.5 flex-1 transition-colors duration-300 ${wsArrow.line}`} />
              <div className={`w-0 h-0 border-l-[4px] border-r-[4px] border-t-[6px] border-transparent transition-transform duration-300 ${wsArrow.head}`} />
            </div>

            {/* Server Node */}
            <motion.div className={`${NODE_BASE} ${STATUS_STYLES[getStatus(5, activeStep, "ws")]}`}>
              <span className="text-lg">{WS_NODES[1].icon}</span>
              <span className="text-[9px] font-bold leading-tight">{WS_NODES[1].label}</span>
              <span className="text-[7px] text-muted-foreground">{WS_NODES[1].sub}</span>
            </motion.div>
          </div>
          <AnimatePresence mode="wait">
            {activeStep >= 0 && (
              <motion.div key={activeStep} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="text-[10px] text-muted-foreground text-center leading-relaxed bg-muted/40 p-2 rounded-lg flex-1">
                {STEPS[activeStep].wsDesc}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Comparison table */}
      <div className="overflow-x-auto">
        <table className="w-full text-[11px] border-collapse">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left py-2 px-3 text-muted-foreground font-medium uppercase tracking-wide">항목</th>
              <th className="text-center py-2 px-3 text-amber-600 dark:text-amber-400 font-semibold">Polling</th>
              <th className="text-center py-2 px-3 text-blue-600 dark:text-blue-400 font-semibold">SSE</th>
              <th className="text-center py-2 px-3 text-violet-600 dark:text-violet-400 font-semibold">WebSocket</th>
            </tr>
          </thead>
          <tbody>
            {COMPARISON.map((row, i) => (
              <tr key={row.feature} className={`border-b border-border/50 ${i % 2 === 0 ? "bg-muted/20" : ""}`}>
                <td className="py-2.5 px-3 font-semibold text-foreground">{row.feature}</td>
                <td className="py-2.5 px-3 text-center text-muted-foreground leading-relaxed">{row.polling}</td>
                <td className="py-2.5 px-3 text-center text-muted-foreground leading-relaxed">{row.sse}</td>
                <td className="py-2.5 px-3 text-center text-muted-foreground leading-relaxed">{row.ws}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
