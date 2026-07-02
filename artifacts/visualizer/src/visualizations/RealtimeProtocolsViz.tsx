import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Pause, RotateCcw, ChevronLeft, ChevronRight } from "lucide-react";

const STEPS = [
  {
    title: "1. 연결 수립 (Connection Handshake)",
    pollingDesc: "매번 HTTP GET 단발성 요청을 보냅니다. 지속적인 연결 상태를 유지하지 않으며 즉시 연결을 끊습니다.",
    sseDesc: "HTTP GET 요청(text/event-stream)을 서버에 보내어 스트림 커넥션을 오픈한 채 끈질기게 유지합니다.",
    wsDesc: "HTTP Upgrade 핸드셰이크를 주고받아 양방향 TCP 전이중 소켓 채널을 영구 개방합니다. (핸드셰이크 중에는 중앙 단일 HTTP Upgrade 선을 타고 이동)",
    pollingPayload: "GET /updates HTTP/1.1\nHost: example.com\nUser-Agent: Mozilla/5.0...",
    ssePayload: "GET /stream HTTP/1.1\nAccept: text/event-stream\nCache-Control: no-cache",
    wsPayload: "GET /chat HTTP/1.1\nUpgrade: websocket\nConnection: Upgrade\nSec-WebSocket-Key: dGhlIHNhbXBs...",
  },
  {
    title: "2. 데이터 송신 (Client Transmit)",
    pollingDesc: "클라이언트가 데이터를 쓸 때마다 새로운 HTTP POST 연결을 열어야 하므로 TCP 3-way handshake 및 HTTP 헤더 오버헤드가 매번 발생합니다.",
    sseDesc: "SSE는 수신 전용 스트림이므로, 클라이언트가 데이터를 보낼 때는 이 스트림을 쓰지 못하고 일반 HTTP POST 요청을 별도로 쏘아야 합니다.",
    wsDesc: "이미 뚫려 있는 웹소켓 터널 중 [상위 송신 선(Tx)]을 통해 헤더가 2~10 바이트 수준으로 극도로 가벼운 바이너리/텍스트 프레임 패킷을 딜레이 없이 다이렉트로 전송합니다.",
    pollingPayload: "POST /messages HTTP/1.1\nHost: example.com\n[Header 800 Bytes]\n\n{ \"text\": \"hello\" }",
    ssePayload: "POST /send-msg HTTP/1.1 (일반 HTTP)\n\n{ \"text\": \"hello\" }",
    wsPayload: "WS Frame (Opcode: Text, Masked)\nPayload: \"hello\" (헤더 단 6바이트)",
  },
  {
    title: "3. 실시간 데이터 푸시 (Server Push)",
    pollingDesc: "서버가 새 데이터를 획득해도 클라이언트가 다시 물어볼(Polling) 때까지 전송하지 못합니다. 클라이언트의 3초 주기 요청이 올 때 응답에 얹어 반환되므로 지연(Latency)이 발생합니다.",
    sseDesc: "서버에서 새로운 정보가 발생하면, 열려 있는 연결 통로로 'data: ...' 포맷을 사용해 실시간으로 즉시 밀어넣습니다 (Server Push).",
    wsDesc: "서버가 언제든지 독립적으로 클라이언트로 가벼운 소켓 프레임을 쏘아 보냅니다. [하위 수신 선(Rx)]을 타고 클라이언트로 즉각 전송됩니다.",
    pollingPayload: "HTTP/1.1 200 OK\n[Header 500 Bytes]\n\n{ \"data\": \"new_event_data\" }",
    ssePayload: "event: update\ndata: { \"data\": \"new_event_data\" }\n\n (텍스트 스트림)",
    wsPayload: "WS Frame (Opcode: Text, Unmasked)\nPayload: \"new_event_data\" (헤더 단 2바이트)",
  },
];

const COMPARISON = [
  { feature: "통신 유형", polling: "단방향 (클라이언트 요청 시에만 응답)", sse: "단방향 (서버 ➔ 클라이언트 푸시 전용)", ws: "양방향 (상시 자유로운 양방향 통신)" },
  { feature: "연결 생명주기", polling: "요청/응답 사이클 후 즉시 닫힘", sse: "HTTP 연결 반영구 유지 (자동 재연결)", ws: "웹소켓 소켓 연결 영구 유지 (수동 복구)" },
  { feature: "헤더 오버헤드", polling: "매 요청마다 쿠키/헤더 전송 (800B+)", sse: "최초 1회만 헤더 전송 후 텍스트 스트림", ws: "초기 1회 이후 2~10 바이트 프레임 통신" },
  { feature: "연결 유지 방식", polling: "단발성 연결 소멸 반복", sse: "지속성 연결 (Persistent)", ws: "지속성 연결 (Persistent)" },
  { feature: "적합한 서비스", polling: "어드민 대시보드, 빈도 낮은 모니터링", sse: "알림 피드, 실시간 스포츠 중계, 뉴스 피드", ws: "실시간 채팅, 웹게임, 주식 HTS, 협업 보드" },
];

export default function RealtimeProtocolsViz() {
  const [activeStep, setActiveStep] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const total = STEPS.length;
  const isComplete = activeStep >= total - 1;

  useEffect(() => {
    if (!isPlaying) return;
    
    const t = setTimeout(() => {
      if (activeStep < total - 1) {
        setActiveStep((p) => p + 1);
      } else {
        setIsPlaying(false);
      }
    }, 2500);
    return () => clearTimeout(t);
  }, [isPlaying, activeStep, total]);

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
  const stepData = activeStep >= 0 ? STEPS[activeStep] : null;

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex items-center gap-3 flex-wrap">
        <button
          onClick={handleReset}
          className="p-2.5 rounded-lg border border-card-border bg-card hover:bg-muted transition-colors text-muted-foreground"
          data-testid="button-reset"
        >
          <RotateCcw size={16} />
        </button>
        <button
          onClick={handlePrev}
          disabled={activeStep < 0}
          className="p-2.5 rounded-lg border border-card-border bg-card hover:bg-muted text-muted-foreground disabled:opacity-40 transition-colors"
          data-testid="button-prev"
        >
          <ChevronLeft size={16} />
        </button>
        <button
          onClick={handlePlay}
          className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary text-primary-foreground hover:opacity-90 text-sm font-medium transition-opacity"
          data-testid="button-play-pause"
        >
          {isPlaying ? <Pause size={15} /> : <Play size={15} />}
          {isComplete ? "다시 보기" : isPlaying ? "일시정지" : activeStep < 0 ? "비교 시작" : "계속"}
        </button>
        <button
          onClick={handleNext}
          disabled={isComplete}
          className="p-2.5 rounded-lg border border-card-border bg-card hover:bg-muted text-muted-foreground disabled:opacity-40 transition-colors"
          data-testid="button-next"
        >
          <ChevronRight size={16} />
        </button>
        <div className="flex-1 space-y-1">
          <div className="text-xs sm:text-sm text-muted-foreground font-semibold">
            {activeStep >= 0 ? `단계 ${activeStep + 1} / ${total} — ${STEPS[activeStep].title}` : `총 ${total}단계`}
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-primary rounded-full"
              animate={{ width: `${Math.max(0, progress)}%` }}
              transition={{ duration: 0.4 }}
            />
          </div>
        </div>
      </div>

      {/* 3-Column Dynamic Interactive Diagram */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

        {/* Polling Column */}
        <div className="border border-border rounded-2xl p-4 bg-muted/5 flex flex-col justify-between min-h-[440px]">
          <div>
            <div className="flex justify-between items-center mb-3">
              <span className="text-sm font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
                🔄 Polling (HTTP 단발성 루프)
              </span>
            </div>

            {/* 100% SVG Diagram Box */}
            <div className="relative border border-border/60 rounded-xl bg-card overflow-hidden">
              <svg viewBox="0 0 320 140" className="w-full h-auto block select-none">
                <defs>
                  <filter id="glow-amber" x="-20%" y="-20%" width="140%" height="140%">
                    <feDropShadow dx="0" dy="1" stdDeviation="3" floodColor="#f59e0b" floodOpacity="0.4" />
                  </filter>
                  <filter id="glow-rose" x="-20%" y="-20%" width="140%" height="140%">
                    <feDropShadow dx="0" dy="1" stdDeviation="3" floodColor="#f43f5e" floodOpacity="0.4" />
                  </filter>
                  <filter id="glow-emerald" x="-20%" y="-20%" width="140%" height="140%">
                    <feDropShadow dx="0" dy="1" stdDeviation="3" floodColor="#10b981" floodOpacity="0.4" />
                  </filter>
                </defs>

                {/* Connection line */}
                <line x1={62} y1={70} x2={258} y2={70} stroke="#d1d5db" strokeWidth="1.5" strokeDasharray="3 3" className="dark:stroke-slate-700" />
                
                {/* Flow Packet animations based on steps */}
                {activeStep === 0 && (
                  <motion.circle key={`poll-p0-${activeStep}`} r="5" fill="#f59e0b" filter="url(#glow-amber)" initial={{ cx: 62 }} animate={{ cx: 258 }} transition={{ duration: 1.2, repeat: Infinity }} cy={70} />
                )}
                {activeStep === 1 && (
                  <motion.circle key={`poll-p1-${activeStep}`} r="5" fill="#f43f5e" filter="url(#glow-rose)" initial={{ cx: 62 }} animate={{ cx: 258 }} transition={{ duration: 1.2, repeat: Infinity }} cy={70} />
                )}
                {activeStep === 2 && (
                  <motion.circle key={`poll-p2-${activeStep}`} r="5" fill="#10b981" filter="url(#glow-emerald)" initial={{ cx: 258 }} animate={{ cx: 62 }} transition={{ duration: 1.2, repeat: Infinity }} cy={70} />
                )}

                {/* Node labels */}
                {activeStep === 1 && (
                  <text x={160} y={45} textAnchor="middle" fill="#f43f5e" fontSize="8" fontWeight="bold" className="bg-card">새 HTTP 요청 생성</text>
                )}
                {activeStep === 2 && (
                  <text x={160} y={98} textAnchor="middle" fill="#10b981" fontSize="8" fontWeight="bold" className="bg-card">임시 응답 후 즉시 종료</text>
                )}

                {/* Client Node */}
                <g transform="translate(40, 70)">
                  <rect x="-22" y="-22" width="44" height="44" rx="8" fill="var(--card, #ffffff)" stroke="#cbd5e1" strokeWidth="1.5" className="dark:stroke-slate-700" />
                  <text x="0" y="2" textAnchor="middle" fontSize="18">📱</text>
                  <text x="0" y="16" textAnchor="middle" fontSize="8" fontWeight="bold" className="fill-foreground">Client</text>
                </g>

                {/* Server Node */}
                <g transform="translate(280, 70)">
                  <rect x="-22" y="-22" width="44" height="44" rx="8" fill="var(--card, #ffffff)" stroke="#f59e0b" strokeWidth="1.5" />
                  <text x="0" y="2" textAnchor="middle" fontSize="18">🖥️</text>
                  <text x="0" y="16" textAnchor="middle" fontSize="8" fontWeight="bold" className="fill-foreground">Server</text>
                </g>
              </svg>
            </div>

            {/* Code Payload box */}
            <div className="mt-4">
              <span className="text-xs font-semibold text-muted-foreground block mb-1">
                실제 전송 데이터 (HTTP Payload)
              </span>
              <pre className="p-3 bg-muted rounded-xl text-xs font-mono text-foreground leading-relaxed overflow-x-auto h-[120px] border border-border/60">
                {stepData ? stepData.pollingPayload : '// 비교를 시작해 주세요.'}
              </pre>
            </div>
          </div>
        </div>

        {/* SSE Column */}
        <div className="border border-border rounded-2xl p-4 bg-muted/5 flex flex-col justify-between min-h-[440px]">
          <div>
            <div className="flex justify-between items-center mb-3">
              <span className="text-sm font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                🌊 SSE (서버 단방향 스트림)
              </span>
            </div>

            {/* 100% SVG Diagram Box */}
            <div className="relative border border-border/60 rounded-xl bg-card overflow-hidden">
              <svg viewBox="0 0 320 140" className="w-full h-auto block select-none">
                <defs>
                  <filter id="glow-blue" x="-20%" y="-20%" width="140%" height="140%">
                    <feDropShadow dx="0" dy="1" stdDeviation="3" floodColor="#3b82f6" floodOpacity="0.4" />
                  </filter>
                </defs>

                {/* Established connection line */}
                <line x1={62} y1={70} x2={258} y2={70} stroke={activeStep >= 0 ? "#3b82f6" : "#d1d5db"} strokeWidth={activeStep >= 0 ? "2" : "1.5"} strokeDasharray={activeStep >= 0 ? "0" : "3 3"} className="transition-all duration-300 dark:stroke-slate-700" />

                {/* Flow Packet animations based on steps */}
                {activeStep === 0 && (
                  <motion.circle key={`sse-p0-${activeStep}`} r="5" fill="#3b82f6" filter="url(#glow-blue)" initial={{ cx: 62 }} animate={{ cx: 258 }} transition={{ duration: 1.2, repeat: Infinity }} cy={70} />
                )}
                {activeStep === 1 && (
                  // SSE stream cannot send data directly, so it opens a separate parallel HTTP post line
                  <g key={`sse-p1-group-${activeStep}`}>
                    <line x1={62} y1={42} x2={258} y2={42} stroke="#f43f5e" strokeWidth="1" strokeDasharray="3 3" />
                    <motion.circle key={`sse-p1-${activeStep}`} r="4" fill="#f43f5e" filter="url(#glow-rose)" initial={{ cx: 62 }} animate={{ cx: 258 }} transition={{ duration: 1.2, repeat: Infinity }} cy={42} />
                  </g>
                )}
                {activeStep === 2 && (
                  <motion.circle key={`sse-p2-${activeStep}`} r="5" fill="#10b981" filter="url(#glow-emerald)" initial={{ cx: 258 }} animate={{ cx: 62 }} transition={{ duration: 1.2, repeat: Infinity }} cy={70} />
                )}

                {activeStep === 1 && (
                  <text x={160} y={32} textAnchor="middle" fill="#f43f5e" fontSize="8" fontWeight="bold">별도 HTTP POST 전송</text>
                )}
                {activeStep === 2 && (
                  <text x={160} y={98} textAnchor="middle" fill="#3b82f6" fontSize="8" fontWeight="bold">스트림 개방 유지 Server Push</text>
                )}

                {/* Client Node */}
                <g transform="translate(40, 70)">
                  <rect x="-22" y="-22" width="44" height="44" rx="8" fill="var(--card, #ffffff)" stroke="#cbd5e1" strokeWidth="1.5" className="dark:stroke-slate-700" />
                  <text x="0" y="2" textAnchor="middle" fontSize="18">📱</text>
                  <text x="0" y="16" textAnchor="middle" fontSize="8" fontWeight="bold" className="fill-foreground">Client</text>
                </g>

                {/* Server Node */}
                <g transform="translate(280, 70)">
                  <rect x="-22" y="-22" width="44" height="44" rx="8" fill="var(--card, #ffffff)" stroke="#3b82f6" strokeWidth="1.5" />
                  <text x="0" y="2" textAnchor="middle" fontSize="18">🖥️</text>
                  <text x="0" y="16" textAnchor="middle" fontSize="8" fontWeight="bold" className="fill-foreground">Server</text>
                </g>
              </svg>
            </div>

            {/* Code Payload box */}
            <div className="mt-4">
              <span className="text-xs font-semibold text-muted-foreground block mb-1">
                실제 전송 데이터 (Event Stream)
              </span>
              <pre className="p-3 bg-muted rounded-xl text-xs font-mono text-foreground leading-relaxed overflow-x-auto h-[120px] border border-border/60">
                {stepData ? stepData.ssePayload : '// 비교를 시작해 주세요.'}
              </pre>
            </div>
          </div>
        </div>

        {/* WebSocket Column */}
        <div className="border border-border rounded-2xl p-4 bg-muted/5 flex flex-col justify-between min-h-[440px]">
          <div>
            <div className="flex justify-between items-center mb-3">
              <span className="text-sm font-bold text-violet-600 dark:text-violet-400 uppercase tracking-wider">
                ⚡ WebSocket (양방향 소켓 소통)
              </span>
            </div>

            {/* 100% SVG Diagram Box */}
            <div className="relative border border-border/60 rounded-xl bg-card overflow-hidden">
              <svg viewBox="0 0 320 140" className="w-full h-auto block select-none">
                <defs>
                  <filter id="glow-violet" x="-20%" y="-20%" width="140%" height="140%">
                    <feDropShadow dx="0" dy="1" stdDeviation="3" floodColor="#8b5cf6" floodOpacity="0.4" />
                  </filter>
                </defs>

                {/* Dynamic Line Rendering based on Handshake status */}
                {activeStep === 0 || activeStep < 0 ? (
                  // Step 1: Handshake uses single center dashed line
                  <line x1={62} y1={70} x2={258} y2={70} stroke="#d1d5db" strokeWidth="1.5" strokeDasharray="3 3" className="dark:stroke-slate-700" />
                ) : (
                  // Step 2 & 3: Double persistent lines (Upper Tx, Lower Rx)
                  <g key={`ws-lines-${activeStep}`}>
                    <line x1={62} y1={52} x2={258} y2={52} stroke="#a78bfa" strokeWidth="2" className="dark:stroke-slate-700" />
                    <line x1={62} y1={88} x2={258} y2={88} stroke="#10b981" strokeWidth="2" className="dark:stroke-slate-700" />
                  </g>
                )}

                {/* Flow Packet animations: dynamically mapping lines to cy coordinates */}
                {activeStep === 0 && (
                  // Step 1: Packet travels along the single center dashed line
                  <motion.circle key={`ws-p0-${activeStep}`} r="5" fill="#8b5cf6" filter="url(#glow-violet)" initial={{ cx: 62 }} animate={{ cx: 258 }} transition={{ duration: 1.2, repeat: Infinity }} cy={70} />
                )}
                {activeStep === 1 && (
                  // Step 2: Client send (Tx) uses upper solid line (52)
                  <motion.circle key={`ws-p1-${activeStep}`} r="5" fill="#a78bfa" filter="url(#glow-violet)" initial={{ cx: 62 }} animate={{ cx: 258 }} transition={{ duration: 1.0, repeat: Infinity }} cy={52} />
                )}
                {activeStep === 2 && (
                  // Step 3: Server push (Rx) uses lower solid line (88)
                  <motion.circle key={`ws-p2-${activeStep}`} r="5" fill="#10b981" filter="url(#glow-emerald)" initial={{ cx: 258 }} animate={{ cx: 62 }} transition={{ duration: 1.0, repeat: Infinity }} cy={88} />
                )}

                {activeStep === 0 && (
                  <text x={160} y={48} textAnchor="middle" fill="#8b5cf6" fontSize="8" fontWeight="bold">101 Upgrade 핸드셰이크 요청</text>
                )}
                {activeStep === 1 && (
                  <text x={160} y={38} textAnchor="middle" fill="#8b5cf6" fontSize="8" fontWeight="bold">상위 송신선(Tx)으로 고속 송신</text>
                )}
                {activeStep === 2 && (
                  <text x={160} y={108} textAnchor="middle" fill="#10b981" fontSize="8" fontWeight="bold">하위 수신선(Rx)으로 즉각 수신</text>
                )}

                {/* Client Node */}
                <g transform="translate(40, 70)">
                  <rect x="-22" y="-22" width="44" height="44" rx="8" fill="var(--card, #ffffff)" stroke="#cbd5e1" strokeWidth="1.5" className="dark:stroke-slate-700" />
                  <text x="0" y="2" textAnchor="middle" fontSize="18">📱</text>
                  <text x="0" y="16" textAnchor="middle" fontSize="8" fontWeight="bold" className="fill-foreground">Client</text>
                </g>

                {/* Server Node */}
                <g transform="translate(280, 70)">
                  <rect x="-22" y="-22" width="44" height="44" rx="8" fill="var(--card, #ffffff)" stroke="#8b5cf6" strokeWidth="1.5" />
                  <text x="0" y="2" textAnchor="middle" fontSize="18">🖥️</text>
                  <text x="0" y="16" textAnchor="middle" fontSize="8" fontWeight="bold" className="fill-foreground">Server</text>
                </g>
              </svg>
            </div>

            {/* Code Payload box */}
            <div className="mt-4">
              <span className="text-xs font-semibold text-muted-foreground block mb-1">
                실제 전송 데이터 (Websocket Frame)
              </span>
              <pre className="p-3 bg-muted rounded-xl text-xs font-mono text-foreground leading-relaxed overflow-x-auto h-[120px] border border-border/60">
                {stepData ? stepData.wsPayload : '// 비교를 시작해 주세요.'}
              </pre>
            </div>
          </div>
        </div>

      </div>

      {/* Traversal Info Description Box - 디자인 가이드라인 정렬 통일 */}
      <AnimatePresence mode="wait">
        {stepData && (
          <motion.div
            key={activeStep}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="p-5 rounded-2xl border border-blue-200 dark:border-blue-900/60 bg-blue-50/30 dark:bg-blue-950/10 shadow-sm text-sm sm:text-base text-muted-foreground leading-relaxed space-y-3"
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-1.5">
                <span className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider block">Polling 처리</span>
                <p className="leading-relaxed text-sm sm:text-base text-foreground">{stepData.pollingDesc}</p>
              </div>
              <div className="space-y-1.5">
                <span className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider block">SSE 처리</span>
                <p className="leading-relaxed text-sm sm:text-base text-foreground">{stepData.sseDesc}</p>
              </div>
              <div className="space-y-1.5">
                <span className="text-xs font-bold text-violet-600 dark:text-violet-400 uppercase tracking-wider block">WebSocket 처리</span>
                <p className="leading-relaxed text-sm sm:text-base text-foreground">{stepData.wsDesc}</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Comparison table */}
      <div className="overflow-x-auto">
        <table className="w-full text-xs sm:text-sm border-collapse">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left py-3 px-3 text-muted-foreground font-semibold uppercase tracking-wider text-xs">비교 항목</th>
              <th className="text-center py-3 px-3 text-amber-600 dark:text-amber-400 font-bold">Polling</th>
              <th className="text-center py-3 px-3 text-blue-600 dark:text-blue-400 font-bold">SSE</th>
              <th className="text-center py-3 px-3 text-violet-600 dark:text-violet-400 font-bold">WebSocket</th>
            </tr>
          </thead>
          <tbody>
            {COMPARISON.map((row, i) => (
              <tr key={row.feature} className={`border-b border-border/40 ${i % 2 === 0 ? "bg-muted/10" : ""}`}>
                <td className="py-3 px-3 font-semibold text-foreground text-xs sm:text-sm">{row.feature}</td>
                <td className="py-3 px-3 text-center text-muted-foreground text-xs sm:text-sm leading-relaxed">{row.polling}</td>
                <td className="py-3 px-3 text-center text-muted-foreground text-xs sm:text-sm leading-relaxed">{row.sse}</td>
                <td className="py-3 px-3 text-center text-muted-foreground text-xs sm:text-sm leading-relaxed">{row.ws}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
