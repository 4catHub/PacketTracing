import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Pause, RotateCcw, ChevronLeft, ChevronRight } from "lucide-react";

const STEPS = [
  {
    title: "1. 요청 시작 & 데이터 직렬화 (Serialization)",
    restDesc: "REST는 사람이 읽을 수 있는 텍스트 포맷인 JSON으로 데이터를 인코딩합니다. 속성은 명확하지만 빈 공간, 필드명 문자열 등 불필요한 텍스트 오버헤드가 큽니다.",
    grpcDesc: "gRPC는 스키마 규격(.proto)에 기반하여 이진(Binary) 포맷인 Protocol Buffers로 데이터를 직렬화합니다. 속성명이 숫자로 압축되어 용량이 대단히 작습니다.",
    restData: '{\n  "id": 1,\n  "name": "Alice",\n  "role": "Admin"\n}',
    grpcData: '0x08 0x01 0x12 0x05 0x41 0x6c 0x69 0x63 0x65 0x1a 0x05 0x41 0x64 0x6d 0x69 0x6e (이진 바이너리)',
    restPackets: [0],
    grpcPackets: [0],
  },
  {
    title: "2. 연결 방식 및 전송 (Multiplexing vs Sequential)",
    restDesc: "HTTP/1.1은 하나의 커넥션에서 한 번에 하나의 요청/응답만 보냅니다. 여러 자원을 조회하려면 요청들이 대기(Head-of-Line Blocking)하거나 새 TCP 소켓을 파야 합니다.",
    grpcDesc: "HTTP/2 기반의 gRPC는 단일 TCP 커넥션 안에서 수많은 독립된 데이터 스트림을 쪼개어 병렬(Multiplexing)로 동시에 밀어넣습니다. 대기 현상이 없습니다.",
    restData: '[Request A] --------> 대기 [Request B]',
    grpcData: '[Stream 1 (A)][Stream 2 (B)] ===> 병렬 스트림',
    restPackets: [1],
    grpcPackets: [1, 2, 3], // 다중화 패킷들
  },
  {
    title: "3. 서버 데이터 검색 및 가공 (N+1 vs Single RPC)",
    restDesc: "연관 데이터(예: User와 그에 딸린 Posts)를 수집하기 위해 REST는 GET /users/1 호출 후 수신한 ID로 GET /posts?userId=1을 다시 호출해야 하는 N+1 문제가 잦습니다.",
    grpcDesc: "gRPC는 정의된 RPC(예: GetUserWithPosts)를 단 한 번 호출하면, 서버 측에서 일괄 가집계하여 클라이언트에 콤팩트하게 내려줍니다.",
    restData: '1. GET /users/1\n2. GET /posts?userId=1 (2회 왕복)',
    grpcData: 'GetUserWithPosts(id: 1) -> 단일 RPC 호출 (1회 왕복)',
    restPackets: [2],
    grpcPackets: [4],
  },
  {
    title: "4. 응답 반환 및 최종 페이로드 (Response Payload)",
    restDesc: "클라이언트에게 JSON 형태의 긴 문자열 텍스트로 응답을 돌려줍니다. 사람이 디버깅하긴 편하나 파싱 연산 오버헤드와 네트워크 비용이 상대적으로 큽니다.",
    grpcDesc: "바이너리 스트림(Protobuf) 상태 그대로 응답을 클라이언트에 쏘아주며, 클라이언트는 고속 디코더를 돌려 수 마이크로초 내로 데이터를 객체화합니다.",
    restData: 'JSON 응답 완료 (~9.7 KB)',
    grpcData: 'Protobuf 이진 스트리밍 완료 (~1.4 KB, 최대 70% 압축)',
    restPackets: [3],
    grpcPackets: [5],
  },
];

const COMPARISON = [
  { feature: "프로토콜 계층", rest: "HTTP/1.1 (기본)", grpc: "HTTP/2 (필수)" },
  { feature: "데이터 포맷", rest: "JSON (텍스트, 용량 큼)", grpc: "Protocol Buffers (이진, 용량 작음)" },
  { feature: "전송 메커니즘", rest: "요청/응답 별도 직렬 연결 (HOLB 발생)", grpc: "단일 커넥션 양방향 멀티플렉싱 스트림" },
  { feature: "API 호출 설계", rest: "URL 및 HTTP Method 중심 (CRUD)", grpc: "원격 함수 호출(RPC) 중심 (.proto 정의)" },
  { feature: "타입 안전성", rest: "없음 (JSON 데이터 런타임 검증 필요)", grpc: "높음 (.proto로 컴파일 시 타입 자동 보장)" },
  { feature: "실시간성", rest: "단방향 (SSE / 폴링 필요)", grpc: "양방향 스트리밍 (Bidirectional Streaming)" },
];

export default function RestVsGrpcViz() {
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
    const t = setTimeout(() => setActiveStep((p) => p + 1), 2400);
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
          <div className="text-xs sm:text-sm text-muted-foreground">
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

      {/* Visual Workspace (Side-by-Side Visual Comparison) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Left Column: REST API (JSON / HTTP/1.1) */}
        <div className="border border-border rounded-2xl p-4 bg-muted/5 flex flex-col justify-between min-h-[380px]">
          <div>
            <div className="flex justify-between items-center mb-3">
              <span className="text-sm font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                🌐 REST API (JSON / HTTP/1.1)
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 font-bold">
                텍스트 기반
              </span>
            </div>
            
            {/* Network / Pipe simulation */}
            <div className="relative border border-border/60 rounded-xl p-3 h-[130px] flex items-center justify-between bg-card overflow-hidden">
              <div className="flex flex-col items-center">
                <span className="text-xl">👤</span>
                <span className="text-xs font-bold mt-1 text-foreground">Client</span>
              </div>

              {/* Data Flow Channel (HTTP 1.1 Pipe) */}
              <div className="relative flex-1 h-6 mx-4 border-y border-dashed border-border/80 flex items-center justify-around bg-muted/10 rounded-sm">
                <span className="absolute left-2 text-[8px] text-muted-foreground uppercase font-bold tracking-tight">HTTP/1.1 Pipe</span>
                
                {/* Flowing Packet (Sequential REST Packet) */}
                <AnimatePresence>
                  {activeStep >= 0 && stepData?.restPackets && (
                    <motion.div
                      initial={{ x: -60, opacity: 0 }}
                      animate={{ x: 60, opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
                      className="px-2 py-0.5 rounded bg-blue-500 text-white text-[9px] font-bold shadow-md flex items-center gap-1 shrink-0 z-10"
                    >
                      <span>JSON Req</span>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="flex flex-col items-center">
                <span className="text-xl">🖥️</span>
                <span className="text-xs font-bold mt-1 text-foreground">REST Server</span>
              </div>
            </div>

            {/* Code / Data representation box */}
            <div className="mt-4">
              <span className="text-xs font-semibold text-muted-foreground block mb-1">
                실제 전송 데이터 형태 (Payload)
              </span>
              <pre className="p-3 bg-muted rounded-xl text-xs font-mono text-foreground leading-relaxed overflow-x-auto h-[120px] border border-border/60">
                {stepData ? stepData.restData : '// 비교를 시작해 주세요.'}
              </pre>
            </div>
          </div>

          <AnimatePresence mode="wait">
            {stepData && (
              <motion.p
                key={activeStep}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-sm sm:text-base text-muted-foreground leading-relaxed mt-4 bg-blue-50/30 dark:bg-blue-900/10 p-4 rounded-2xl border border-blue-100 dark:border-blue-900/40"
              >
                {stepData.restDesc}
              </motion.p>
            )}
          </AnimatePresence>
        </div>

        {/* Right Column: gRPC (Protobuf / HTTP/2) */}
        <div className="border border-border rounded-2xl p-4 bg-muted/5 flex flex-col justify-between min-h-[380px]">
          <div>
            <div className="flex justify-between items-center mb-3">
              <span className="text-sm font-bold text-violet-600 dark:text-violet-400 uppercase tracking-wider">
                ⚡ gRPC (Protobuf / HTTP/2)
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-400 font-bold">
                이진 바이너리
              </span>
            </div>
            
            {/* Network / Pipe simulation */}
            <div className="relative border border-border/60 rounded-xl p-3 h-[130px] flex items-center justify-between bg-card overflow-hidden">
              <div className="flex flex-col items-center">
                <span className="text-xl">👤</span>
                <span className="text-xs font-bold mt-1 text-foreground">Client</span>
              </div>

              {/* Data Flow Channel (HTTP 2 Pipe) */}
              <div className="relative flex-1 h-12 mx-4 border border-dashed border-border/80 flex flex-col justify-around bg-muted/20 rounded-md">
                <span className="absolute left-2 top-0.5 text-[8px] text-muted-foreground uppercase font-bold tracking-tight">HTTP/2 Multiplexing</span>
                
                {/* Flowing Packets (Parallel gRPC Stream) */}
                <div className="flex flex-col gap-1 w-full px-1 z-10">
                  <AnimatePresence>
                    {activeStep >= 0 && stepData?.grpcPackets && (
                      <div className="space-y-1">
                        <motion.div
                          initial={{ x: -50, opacity: 0 }}
                          animate={{ x: 50, opacity: 1 }}
                          transition={{ duration: 1.2, repeat: Infinity, ease: "linear", delay: 0.1 }}
                          className="px-1.5 py-0.5 w-[70px] text-center rounded bg-violet-600 text-white text-[8px] font-bold shadow-sm"
                        >
                          Stream 1
                        </motion.div>
                        <motion.div
                          initial={{ x: -30, opacity: 0 }}
                          animate={{ x: 70, opacity: 1 }}
                          transition={{ duration: 1.4, repeat: Infinity, ease: "linear", delay: 0.3 }}
                          className="px-1.5 py-0.5 w-[70px] text-center rounded bg-emerald-600 text-white text-[8px] font-bold shadow-sm"
                        >
                          Stream 2
                        </motion.div>
                      </div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              <div className="flex flex-col items-center">
                <span className="text-xl">🖥️</span>
                <span className="text-xs font-bold mt-1 text-foreground">gRPC Server</span>
              </div>
            </div>

            {/* Code / Data representation box */}
            <div className="mt-4">
              <span className="text-xs font-semibold text-muted-foreground block mb-1">
                실제 전송 데이터 형태 (Payload)
              </span>
              <pre className="p-3 bg-muted rounded-xl text-xs font-mono text-foreground leading-relaxed overflow-x-auto h-[120px] border border-border/60 whitespace-pre-wrap">
                {stepData ? stepData.grpcData : '// 비교를 시작해 주세요.'}
              </pre>
            </div>
          </div>

          <AnimatePresence mode="wait">
            {stepData && (
              <motion.p
                key={activeStep}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-sm sm:text-base text-muted-foreground leading-relaxed mt-4 bg-violet-50/30 dark:bg-violet-900/10 p-4 rounded-2xl border border-violet-100 dark:border-violet-900/40"
              >
                {stepData.grpcDesc}
              </motion.p>
            )}
          </AnimatePresence>
        </div>

      </div>

      {/* Comparison table */}
      <div className="overflow-x-auto">
        <table className="w-full text-xs sm:text-sm border-collapse">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left py-2.5 px-3 text-muted-foreground font-semibold uppercase tracking-wider text-xs">비교 항목</th>
              <th className="text-center py-2.5 px-3 text-blue-600 dark:text-blue-400 font-bold">REST API</th>
              <th className="text-center py-2.5 px-3 text-violet-600 dark:text-violet-400 font-bold">gRPC</th>
            </tr>
          </thead>
          <tbody>
            {COMPARISON.map((row, i) => (
              <tr key={row.feature} className={`border-b border-border/40 ${i % 2 === 0 ? "bg-muted/10" : ""}`}>
                <td className="py-3 px-3 font-semibold text-foreground text-xs sm:text-sm">{row.feature}</td>
                <td className="py-3 px-3 text-center text-muted-foreground text-xs sm:text-sm leading-relaxed">{row.rest}</td>
                <td className="py-3 px-3 text-center text-muted-foreground text-xs sm:text-sm leading-relaxed">{row.grpc}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
