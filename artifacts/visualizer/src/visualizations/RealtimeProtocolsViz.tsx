import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Pause, RotateCcw, ChevronLeft, ChevronRight } from "lucide-react";
import { contentData } from "@/data/content";

// content.ts에서 'realtime-protocols' 데이터 로드 및 steps 추출
const slugData = contentData.find((d) => d.slug === "realtime-protocols");
const SYSTEM_STEPS = slugData?.steps || [];

const PROTOCOL_STEPS = [
  {
    title: "1. 연결 수립 (Connection Handshake)",
    pollingDesc: "매번 HTTP GET 단발성 요청을 보냅니다. 지속적인 연결 상태를 유지하지 않으며 응답 수신 후 즉시 연결을 끊습니다.",
    sseDesc: "HTTP GET 요청(text/event-stream)을 서버에 보내어 단방향 스트림 커넥션을 오픈한 채 끈질기게 유지합니다.",
    wsDesc: "HTTP Upgrade 핸드셰이크를 주고받아 양방향 TCP 전이중 소켓 채널을 영구 개방합니다. (핸드셰이크 중에는 중앙 단일 HTTP Upgrade 선을 타고 이동)",
    pollingPayload: "GET /updates HTTP/1.1\nHost: example.com\nUser-Agent: Mozilla/5.0...",
    ssePayload: "GET /stream HTTP/1.1\nAccept: text/event-stream\nCache-Control: no-cache",
    wsPayload: "GET /chat HTTP/1.1\nUpgrade: websocket\nConnection: Upgrade\nSec-WebSocket-Key: dGhlIHNhbXBs...",
  },
  {
    title: "2. 데이터 송신 (Client Transmit)",
    pollingDesc: "클라이언트가 데이터를 보낼 때마다 새로운 HTTP POST 연결을 열어야 하므로 TCP Handshake 및 HTTP 헤더 오버헤드가 매번 발생합니다.",
    sseDesc: "SSE는 수신 전용 스트림이므로, 클라이언트가 데이터를 보낼 때는 이 스트림을 쓰지 못하고 일반 HTTP POST 요청을 별도로 보내야 합니다.",
    wsDesc: "이미 뚫려 있는 웹소켓 터널 중 [좌측 송신선(Tx)]을 통해 헤더가 2~10 바이트 수준으로 극도로 가벼운 프레임 패킷을 딜레이 없이 다이렉트로 전송합니다.",
    pollingPayload: "POST /messages HTTP/1.1\nHost: example.com\n[Header 800 Bytes]\n\n{ \"text\": \"hello\" }",
    ssePayload: "POST /send-msg HTTP/1.1 (일반 HTTP)\n\n{ \"text\": \"hello\" }",
    wsPayload: "WS Frame (Opcode: Text, Masked)\nPayload: \"hello\" (헤더 단 6바이트)",
  },
  {
    title: "3. 실시간 데이터 푸시 (Server Push)",
    pollingDesc: "서버가 새 데이터를 획득해도 클라이언트가 다시 물어볼(Polling) 때까지 전송하지 못합니다. 클라이언트의 다음 요청 주기가 올 때 응답에 얹어 반환되므로 지연이 발생합니다.",
    sseDesc: "서버에서 새로운 정보가 발생하면, 열려 있는 연결 통로로 'data: ...' 포맷을 사용해 실시간으로 즉시 밀어넣습니다 (Server Push).",
    wsDesc: "서버가 언제든지 독립적으로 클라이언트로 가벼운 소켓 프레임을 쏘아 보냅니다. [우측 수신선(Rx)]을 타고 클라이언트로 즉각 전송됩니다.",
    pollingPayload: "HTTP/1.1 200 OK\n[Header 500 Bytes]\n\n{ \"data\": \"new_event_data\" }",
    ssePayload: "event: update\ndata: { \"data\": \"new_event_data\" }\n\n (텍스트 스트림)",
    wsPayload: "WS Frame (Opcode: Text, Unmasked)\nPayload: \"new_event_data\" (헤더 단 2바이트)",
  },
  {
    title: "4. 연결 오버헤드 (Connection Overhead)",
    pollingDesc: "매번 새로운 연결을 맺고 끊으며 대량의 쿠키와 HTTP 헤더를 매 요청마다 전송하므로 네트워크 및 서버 자원 낭비가 매우 큽니다.",
    sseDesc: "최초 1회 연결 시에만 HTTP 헤더를 전송하고, 이후에는 텍스트 스트림 상에서 매우 작은 포맷 데이터만 전달하므로 오버헤드가 작습니다.",
    wsDesc: "최초 핸드셰이크 이후에는 추가적인 HTTP 헤더 없이 2~10 바이트 크기의 극도로 가벼운 프레임 헤더만 사용하므로 오버헤드가 거의 없습니다.",
    pollingPayload: "GET /updates HTTP/1.1 [Header: 850 Bytes]\nPOST /messages HTTP/1.1 [Header: 820 Bytes]\n(매 전송마다 대량의 헤더 오버헤드 누적)",
    ssePayload: "GET /stream HTTP/1.1 [최초 1회 이후 추가 헤더 없음]\n\ndata: { ... } [오버헤드 없음]",
    wsPayload: "WS Frame Header [2 Bytes]\nPayload: \"hello\"\n(1회 수립 후 단 2~10바이트 오버헤드)",
  },
];



export default function RealtimeProtocolsViz() {
  const [activeStep, setActiveStep] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(true);
  
  const total = PROTOCOL_STEPS.length;
  const isComplete = activeStep >= total - 1;

  // 마지막 단계 지연 틱(Dwell) 보장 후 자동 순환 구조 유지
  useEffect(() => {
    if (!isPlaying) return;
    
    const t = setTimeout(() => {
      if (activeStep < total - 1) {
        setActiveStep((p) => p + 1);
      } else {
        // 마지막 단계에서 2.5초 대기 후 자동으로 초기 단계(-1)로 순환
        setActiveStep(-1);
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
    if (activeStep < total - 1) {
      setActiveStep((p) => p + 1);
    } else {
      setActiveStep(-1);
    }
  }, [activeStep, total]);

  const handlePrev = useCallback(() => {
    setIsPlaying(false);
    if (activeStep >= 0) setActiveStep((p) => p - 1);
  }, [activeStep]);

  const progress = ((activeStep + 1) / total) * 100;
  const stepData = activeStep >= 0 ? PROTOCOL_STEPS[activeStep] : null;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Controls */}
      <div className="flex items-center gap-2 flex-wrap bg-slate-50/50 dark:bg-slate-900/30 p-2 rounded-xl border border-border/60 text-xs">
        <button
          onClick={handleReset}
          className="p-1.5 rounded-lg border border-card-border bg-card hover:bg-muted transition-colors text-muted-foreground"
          data-testid="button-reset"
          title="초기화"
        >
          <RotateCcw size={13} />
        </button>
        <button
          onClick={handlePrev}
          disabled={activeStep < 0}
          className="p-1.5 rounded-lg border border-card-border bg-card hover:bg-muted text-muted-foreground disabled:opacity-40 transition-colors"
          data-testid="button-prev"
          title="이전 단계"
        >
          <ChevronLeft size={13} />
        </button>
        <button
          onClick={handlePlay}
          className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground hover:opacity-90 text-xs font-semibold transition-opacity"
          data-testid="button-play-pause"
        >
          {isPlaying ? <Pause size={12} /> : <Play size={12} />}
          <span>{isPlaying ? "일시정지" : "재생"}</span>
        </button>
        <button
          onClick={handleNext}
          className="p-1.5 rounded-lg border border-card-border bg-card hover:bg-muted text-muted-foreground transition-colors"
          data-testid="button-next"
          title="다음 단계"
        >
          <ChevronRight size={13} />
        </button>

        <div className="flex-1 min-w-[150px] flex items-center gap-2">
          <div className="text-[11px] text-muted-foreground font-semibold whitespace-nowrap">
            {activeStep >= 0 ? `${activeStep + 1} / ${total}` : "대기"}
          </div>
          <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-primary rounded-full"
              animate={{ width: `${Math.max(0, progress)}%` }}
              transition={{ duration: 0.4 }}
            />
          </div>
        </div>
      </div>

      {/* 1. 3개 프로토콜 아키텍처 비주얼라이저 (3열 배치) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* 1-1. Polling Visualizer */}
        <div className="border border-amber-100 dark:border-amber-950/40 rounded-2xl p-3 bg-amber-50/10 dark:bg-amber-950/5 overflow-hidden flex flex-col">
          <div className="text-xs font-bold text-amber-600 dark:text-amber-400 text-center mb-2">🔄 Polling Flow</div>
          <div className="relative border border-border/40 rounded-xl bg-card overflow-hidden">
            <svg viewBox="0 0 320 280" className="w-full h-auto block select-none rounded-lg">
              <defs>
                <pattern id="grid-polling" width="20" height="20" patternUnits="userSpaceOnUse">
                  <path d="M 20 0 L 0 0 0 20" fill="none" stroke="currentColor" strokeWidth="0.5" className="text-slate-200/50 dark:text-slate-800/20" />
                </pattern>
                <filter id="shadow-polling" x="-20%" y="-20%" width="140%" height="140%">
                  <feDropShadow dx="0" dy="1.5" stdDeviation="2" floodColor="#000" floodOpacity="0.05" />
                </filter>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid-polling)" rx="10" ry="10" />

              {/* 연결선 */}
              <line
                x1={160} y1={65} x2={160} y2={215}
                stroke={activeStep >= 0 ? "#f59e0b" : "#e2e8f0"}
                strokeWidth="1.5"
                strokeDasharray={activeStep === 2 ? "0" : "3 3"}
                className="dark:stroke-slate-800 transition-all duration-300"
              />

              {/* 패킷 */}
              {activeStep === 0 && (
                <motion.circle
                  key={`polling-p0-${activeStep}`}
                  r="5" cx={160} fill="#f59e0b"
                  initial={{ cy: 65 }} animate={{ cy: 215 }}
                  transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
                />
              )}
              {activeStep === 1 && (
                <motion.circle
                  key={`polling-p1-${activeStep}`}
                  r="5" cx={160} fill="#f43f5e"
                  initial={{ cy: 65 }} animate={{ cy: 215 }}
                  transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
                />
              )}
              {activeStep === 2 && (
                <motion.circle
                  key={`polling-p2-${activeStep}`}
                  r="5" cx={160} fill="#10b981"
                  initial={{ cy: 215 }} animate={{ cy: 65 }}
                  transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
                />
              )}
              {activeStep === 3 && (
                <motion.circle
                  key={`polling-p3-${activeStep}`}
                  r="5" cx={160} fill="#f59e0b"
                  initial={{ cy: 65 }} animate={{ cy: 215 }}
                  transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
                />
              )}

              {/* 텍스트 가이드 */}
              {activeStep === 1 && (
                <text x={160} y={145} textAnchor="middle" fill="#f43f5e" fontSize="9" fontWeight="bold" className="fill-rose-500 font-sans">
                  HTTP Request (단발성)
                </text>
              )}
              {activeStep === 2 && (
                <text x={160} y={145} textAnchor="middle" fill="#10b981" fontSize="9" fontWeight="bold" className="fill-emerald-500 font-sans">
                  HTTP Response (연결 종료)
                </text>
              )}

              {/* Nodes */}
              <g transform="translate(160, 40)" filter="url(#shadow-polling)">
                <rect x="-30" y="-18" width="60" height="36" rx="6" fill="var(--card, #ffffff)" stroke="currentColor" className="text-slate-200 dark:text-slate-800" strokeWidth="1" />
                <text x="0" y="2" textAnchor="middle" fontSize="13">📱</text>
                <text x="0" y="12" textAnchor="middle" fontSize="8" fontWeight="bold" className="fill-slate-700 dark:fill-slate-300">Client</text>
              </g>
              <g transform="translate(160, 240)" filter="url(#shadow-polling)">
                <rect x="-30" y="-18" width="60" height="36" rx="6" fill="var(--card, #ffffff)" stroke="#f59e0b" strokeWidth="1" />
                <text x="0" y="2" textAnchor="middle" fontSize="13">🖥️</text>
                <text x="0" y="12" textAnchor="middle" fontSize="8" fontWeight="bold" className="fill-slate-700 dark:fill-slate-300">Server</text>
              </g>
            </svg>
          </div>
        </div>

        {/* 1-2. SSE Visualizer */}
        <div className="border border-blue-100 dark:border-blue-950/40 rounded-2xl p-3 bg-blue-50/10 dark:bg-blue-950/5 overflow-hidden flex flex-col">
          <div className="text-xs font-bold text-blue-600 dark:text-blue-400 text-center mb-2">🌊 SSE Flow</div>
          <div className="relative border border-border/40 rounded-xl bg-card overflow-hidden">
            <svg viewBox="0 0 320 280" className="w-full h-auto block select-none rounded-lg">
              <defs>
                <pattern id="grid-sse" width="20" height="20" patternUnits="userSpaceOnUse">
                  <path d="M 20 0 L 0 0 0 20" fill="none" stroke="currentColor" strokeWidth="0.5" className="text-slate-200/50 dark:text-slate-800/20" />
                </pattern>
                <filter id="shadow-sse" x="-20%" y="-20%" width="140%" height="140%">
                  <feDropShadow dx="0" dy="1.5" stdDeviation="2" floodColor="#000" floodOpacity="0.05" />
                </filter>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid-sse)" rx="10" ry="10" />

              {/* 스트림 유지용 중앙선 */}
              <line
                x1={160} y1={65} x2={160} y2={215}
                stroke={activeStep >= 0 ? "#3b82f6" : "#e2e8f0"}
                strokeWidth="2"
                className="dark:stroke-slate-800 transition-all duration-300"
              />

              {/* 클라이언트 송신용 좌측 POST 보조선 */}
              {activeStep === 1 && (
                <line x1={120} y1={65} x2={120} y2={215} stroke="#f43f5e" strokeWidth="1.5" strokeDasharray="3 3" />
              )}

              {/* 패킷 */}
              {activeStep === 0 && (
                <motion.circle
                  key={`sse-p0-${activeStep}`}
                  r="5" cx={160} fill="#3b82f6"
                  initial={{ cy: 65 }} animate={{ cy: 215 }}
                  transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
                />
              )}
              {activeStep === 1 && (
                <motion.circle
                  key={`sse-p1-${activeStep}`}
                  r="4.5" cx={120} fill="#f43f5e"
                  initial={{ cy: 65 }} animate={{ cy: 215 }}
                  transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
                />
              )}
              {activeStep === 2 && (
                <motion.circle
                  key={`sse-p2-${activeStep}`}
                  r="5" cx={160} fill="#10b981"
                  initial={{ cy: 215 }} animate={{ cy: 65 }}
                  transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
                />
              )}

              {/* 텍스트 가이드 */}
              {activeStep === 1 && (
                <text x={110} y={145} textAnchor="end" fill="#f43f5e" fontSize="9" fontWeight="bold" className="fill-rose-500 font-sans">
                  별도 POST
                </text>
              )}
              {activeStep === 2 && (
                <text x={170} y={145} textAnchor="start" fill="#3b82f6" fontSize="9" fontWeight="bold" className="fill-blue-500 font-sans">
                  Server Push
                </text>
              )}

              {/* Nodes */}
              <g transform="translate(160, 40)" filter="url(#shadow-sse)">
                <rect x="-30" y="-18" width="60" height="36" rx="6" fill="var(--card, #ffffff)" stroke="currentColor" className="text-slate-200 dark:text-slate-800" strokeWidth="1" />
                <text x="0" y="2" textAnchor="middle" fontSize="13">📱</text>
                <text x="0" y="12" textAnchor="middle" fontSize="8" fontWeight="bold" className="fill-slate-700 dark:fill-slate-300">Client</text>
              </g>
              <g transform="translate(160, 240)" filter="url(#shadow-sse)">
                <rect x="-30" y="-18" width="60" height="36" rx="6" fill="var(--card, #ffffff)" stroke="#3b82f6" strokeWidth="1" />
                <text x="0" y="2" textAnchor="middle" fontSize="13">🖥️</text>
                <text x="0" y="12" textAnchor="middle" fontSize="8" fontWeight="bold" className="fill-slate-700 dark:fill-slate-300">Server</text>
              </g>
            </svg>
          </div>
        </div>

        {/* 1-3. WebSocket Visualizer */}
        <div className="border border-violet-100 dark:border-violet-955/40 rounded-2xl p-3 bg-violet-50/10 dark:bg-violet-950/5 overflow-hidden flex flex-col">
          <div className="text-xs font-bold text-violet-600 dark:text-violet-400 text-center mb-2">⚡ WebSocket Flow</div>
          <div className="relative border border-border/40 rounded-xl bg-card overflow-hidden">
            <svg viewBox="0 0 320 280" className="w-full h-auto block select-none rounded-lg">
              <defs>
                <pattern id="grid-ws" width="20" height="20" patternUnits="userSpaceOnUse">
                  <path d="M 20 0 L 0 0 0 20" fill="none" stroke="currentColor" strokeWidth="0.5" className="text-slate-200/50 dark:text-slate-800/20" />
                </pattern>
                <filter id="shadow-ws" x="-20%" y="-20%" width="140%" height="140%">
                  <feDropShadow dx="0" dy="1.5" stdDeviation="2" floodColor="#000" floodOpacity="0.05" />
                </filter>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid-ws)" rx="10" ry="10" />

              {/* 연결 파이프라인 */}
              {activeStep <= 0 ? (
                // 1단계: 연결 수립 (Upgrade 단계) - 중앙 1선 점선
                <line
                  x1={160} y1={65} x2={160} y2={215}
                  stroke="#cbd5e1" strokeWidth="1.5" strokeDasharray="3 3"
                  className="dark:stroke-slate-800 transition-all duration-300"
                />
              ) : (
                // 2단계 이상: 양방향 파이프라인 (좌측 Tx 송신로, 우측 Rx 수신로)
                <g>
                  {/* 좌측 Tx 송신 파이프 */}
                  <line x1={125} y1={65} x2={125} y2={215} stroke="#8b5cf6" strokeWidth="2" className="opacity-70 dark:opacity-90" />
                  <text x={115} y={145} textAnchor="end" fill="#8b5cf6" fontSize="8" fontWeight="bold" className="fill-violet-500 font-sans">Tx</text>

                  {/* 우측 Rx 수신 파이프 */}
                  <line x1={195} y1={65} x2={195} y2={215} stroke="#10b981" strokeWidth="2" className="opacity-70 dark:opacity-90" />
                  <text x={205} y={145} textAnchor="start" fill="#10b981" fontSize="8" fontWeight="bold" className="fill-emerald-500 font-sans">Rx</text>
                </g>
              )}

              {/* 패킷 */}
              {activeStep === 0 && (
                <motion.circle
                  key={`ws-p0-${activeStep}`}
                  r="5" cx={160} fill="#8b5cf6"
                  initial={{ cy: 65 }} animate={{ cy: 215 }}
                  transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
                />
              )}
              {activeStep === 1 && (
                <motion.circle
                  key={`ws-p1-${activeStep}`}
                  r="5" cx={125} fill="#8b5cf6"
                  initial={{ cy: 65 }} animate={{ cy: 215 }}
                  transition={{ duration: 1.0, repeat: Infinity, ease: "linear" }}
                />
              )}
              {activeStep === 2 && (
                <motion.circle
                  key={`ws-p2-${activeStep}`}
                  r="5" cx={195} fill="#10b981"
                  initial={{ cy: 215 }} animate={{ cy: 65 }}
                  transition={{ duration: 1.0, repeat: Infinity, ease: "linear" }}
                />
              )}
              {activeStep === 3 && (
                <g>
                  <motion.circle
                    key={`ws-p3-tx-${activeStep}`}
                    r="4" cx={125} fill="#a78bfa"
                    initial={{ cy: 65 }} animate={{ cy: 215 }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                  />
                  <motion.circle
                    key={`ws-p3-rx-${activeStep}`}
                    r="4" cx={195} fill="#34d399"
                    initial={{ cy: 215 }} animate={{ cy: 65 }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                  />
                </g>
              )}

              {/* 텍스트 가이드 */}
              {activeStep === 0 && (
                <text x={165} y={120} textAnchor="start" fill="#8b5cf6" fontSize="9" fontWeight="bold" className="fill-violet-500 font-sans">
                  HTTP Upgrade
                </text>
              )}
              {activeStep === 1 && (
                <text x={160} y={120} textAnchor="middle" fill="#8b5cf6" fontSize="9" fontWeight="bold" className="fill-violet-500 font-sans">
                  Tx 송신
                </text>
              )}
              {activeStep === 2 && (
                <text x={160} y={120} textAnchor="middle" fill="#10b981" fontSize="9" fontWeight="bold" className="fill-emerald-500 font-sans">
                  Rx 수신
                </text>
              )}

              {/* Nodes */}
              <g transform="translate(160, 40)" filter="url(#shadow-ws)">
                <rect x="-30" y="-18" width="60" height="36" rx="6" fill="var(--card, #ffffff)" stroke="currentColor" className="text-slate-200 dark:text-slate-800" strokeWidth="1" />
                <text x="0" y="2" textAnchor="middle" fontSize="13">📱</text>
                <text x="0" y="12" textAnchor="middle" fontSize="8" fontWeight="bold" className="fill-slate-700 dark:fill-slate-300">Client</text>
              </g>
              <g transform="translate(160, 240)" filter="url(#shadow-ws)">
                <rect x="-30" y="-18" width="60" height="36" rx="6" fill="var(--card, #ffffff)" stroke="#8b5cf6" strokeWidth="1" />
                <text x="0" y="2" textAnchor="middle" fontSize="13">🖥️</text>
                <text x="0" y="12" textAnchor="middle" fontSize="8" fontWeight="bold" className="fill-slate-700 dark:fill-slate-300">Server</text>
              </g>
            </svg>
          </div>
        </div>

      </div>

      {/* 2. 3개 프로토콜 페이로드 인스펙터 (3열 배치) */}
      <div className="space-y-2">
        <div className="text-xs sm:text-sm font-semibold text-foreground">
          실시간 HTTP/WS Frame 페이로드 인스펙터 (병렬 대조)
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Polling Payload */}
          <div className="space-y-1">
            <span className="text-[10px] font-mono text-amber-600 dark:text-amber-400 font-bold uppercase">Polling Payload</span>
            <pre className="p-3 bg-muted rounded-xl text-[10.5px] font-mono text-foreground leading-relaxed overflow-x-auto h-[120px] border border-border/60">
              {stepData ? stepData.pollingPayload : "// 대기 중"}
            </pre>
          </div>

          {/* SSE Payload */}
          <div className="space-y-1">
            <span className="text-[10px] font-mono text-blue-600 dark:text-blue-400 font-bold uppercase">SSE Payload</span>
            <pre className="p-3 bg-muted rounded-xl text-[10.5px] font-mono text-foreground leading-relaxed overflow-x-auto h-[120px] border border-border/60">
              {stepData ? stepData.ssePayload : "// 대기 중"}
            </pre>
          </div>

          {/* WebSocket Payload */}
          <div className="space-y-1">
            <span className="text-[10px] font-mono text-violet-600 dark:text-violet-400 font-bold uppercase">WebSocket Payload</span>
            <pre className="p-3 bg-muted rounded-xl text-[10.5px] font-mono text-foreground leading-relaxed overflow-x-auto h-[120px] border border-border/60">
              {stepData ? stepData.wsPayload : "// 대기 중"}
            </pre>
          </div>
        </div>
      </div>



      {/* 4. 3개 프로토콜 설명 HUD (3열 배치) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Polling Info */}
        <div className="p-4 rounded-xl border border-amber-100 dark:border-amber-955/40 bg-amber-50/20 dark:bg-amber-950/5 shadow-sm text-xs sm:text-sm">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-900 text-amber-600 dark:text-amber-400">
              🔄 Polling
            </span>
          </div>
          <h5 className="font-bold text-foreground mb-1">
            {stepData ? stepData.title : "대기 중"}
          </h5>
          <p className="text-muted-foreground leading-relaxed">
            {stepData ? stepData.pollingDesc : "시뮬레이션을 시작하면 Polling 단계별 설명이 여기에 표시됩니다."}
          </p>
        </div>

        {/* SSE Info */}
        <div className="p-4 rounded-xl border border-blue-100 dark:border-blue-955/40 bg-blue-50/20 dark:bg-blue-950/5 shadow-sm text-xs sm:text-sm">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-white dark:bg-slate-900 border border-blue-200 dark:border-blue-900 text-blue-600 dark:text-blue-400">
              🌊 SSE
            </span>
          </div>
          <h5 className="font-bold text-foreground mb-1">
            {stepData ? stepData.title : "대기 중"}
          </h5>
          <p className="text-muted-foreground leading-relaxed">
            {stepData ? stepData.sseDesc : "시뮬레이션을 시작하면 SSE 단계별 설명이 여기에 표시됩니다."}
          </p>
        </div>

        {/* WebSocket Info */}
        <div className="p-4 rounded-xl border border-violet-100 dark:border-violet-955/40 bg-violet-50/20 dark:bg-violet-950/5 shadow-sm text-xs sm:text-sm">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-white dark:bg-slate-900 border border-violet-200 dark:border-violet-900 text-violet-600 dark:text-violet-400">
              ⚡ WebSocket
            </span>
          </div>
          <h5 className="font-bold text-foreground mb-1">
            {stepData ? stepData.title : "대기 중"}
          </h5>
          <p className="text-muted-foreground leading-relaxed">
            {stepData ? stepData.wsDesc : "시뮬레이션을 시작하면 WebSocket 단계별 설명이 여기에 표시됩니다."}
          </p>
        </div>
      </div>

    </div>
  );
}
