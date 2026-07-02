import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Pause, RotateCcw, ChevronLeft, ChevronRight } from "lucide-react";

const STEPS = [
  {
    title: "1. 요청 시작 & 데이터 직렬화 (Serialization)",
    restDesc: "REST는 사람이 읽을 수 있는 텍스트 포맷인 JSON으로 데이터를 인코딩합니다. 속성 명칭이 그대로 포함되므로 무겁고 파싱 오버헤드가 큽니다.",
    grpcDesc: "gRPC는 .proto 규격에 기반하여 이진(Binary) 포맷인 Protocol Buffers로 데이터를 직렬화합니다. 필드명이 숫자로 매핑되어 용량이 대단히 작고 직렬화 속도가 빠릅니다.",
    restData: '{\n  "id": 1,\n  "name": "Alice",\n  "role": "Admin"\n}',
    grpcData: '0x08 0x01 0x12 0x05 0x41 0x6c 0x69 0x63 0x65 0x1a 0x05 0x41 0x64 0x6d 0x69 0x6e (이진 바이너리)',
  },
  {
    title: "2. 연결 방식 및 전송 (Multiplexing vs Sequential)",
    restDesc: "HTTP/1.1은 하나의 TCP 커넥션에서 한 번에 하나의 요청/응답만 보냅니다. Request A가 완료되기 전까지 Request B는 대기하거나(Head-of-Line Blocking) 새로운 커넥션을 맺어야 합니다.",
    grpcDesc: "HTTP/2 기반의 gRPC는 단일 TCP 커넥션 안에서 수많은 독립된 데이터 스트림을 프레임 단위로 쪼개어 병렬(Multiplexing)로 동시에 밀어넣습니다. 대기 현상이 전혀 없습니다.",
    restData: 'GET /users/1 [보냄]\nGET /posts?userId=1 [Request A 완료 대기...]',
    grpcData: '[Stream 1: GetUser] + [Stream 2: GetPosts] 동시 병렬 전송',
  },
  {
    title: "3. 서버 데이터 검색 및 가공 (N+1 vs Single RPC)",
    restDesc: "연관 데이터(유저 정보 + 포스트 목록)를 가져오기 위해 REST는 유저 정보 조회 API 응답을 받은 후, 다시 포스트 목록 API를 호출하는 2회 왕복(N+1 문제)이 자주 발생합니다.",
    grpcDesc: "gRPC는 필요한 연관 데이터를 스키마에 선언하고 하나의 RPC(GetUserWithPosts)로 정의하여, 단 한 번의 요청으로 서버에서 데이터를 조합해 응답을 즉시 수집합니다.",
    restData: 'DB 요청 1: SELECT * FROM users WHERE id=1;\nDB 요청 2: SELECT * FROM posts WHERE user_id=1;',
    grpcData: 'DB 요청 1: SELECT * FROM users u LEFT JOIN posts p ON u.id=p.user_id WHERE u.id=1; (단일 조회)',
  },
  {
    title: "4. 응답 반환 및 최종 페이로드 (Response Payload)",
    restDesc: "서버가 클라이언트에게 JSON 텍스트 문자열 형태로 응답을 반환합니다. 사람이 읽기는 쉬우나 데이터 크기가 크고, 브라우저/클라이언트의 JSON.parse 연산에 오버헤드가 발생합니다.",
    grpcDesc: "서버가 바이너리 바이트 스트림(Protobuf) 상태 그대로 응답을 전송합니다. 클라이언트는 이미 알고 있는 스펙에 따라 별도의 텍스트 파싱 없이 고속 디코더를 돌려 데이터를 즉각 객체화합니다.",
    restData: 'JSON 응답 완료 (~9.7 KB)\n파싱 오버헤드: 높음',
    grpcData: 'Protobuf 이진 스트리밍 완료 (~1.4 KB, 최대 70% 압축)\n파싱 오버헤드: 거의 없음 (고속 디코딩)',
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
    const t = setTimeout(() => setActiveStep((p) => p + 1), 3000);
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
          {`<`}
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
          {`>`}
        </button>
        <div className="flex-1 space-y-1">
          <div className="text-xs sm:text-sm text-muted-foreground font-medium">
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

      {/* Visual Workspace - Wide Canvas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Left Column: REST (JSON / HTTP/1.1) */}
        <div className="border border-border rounded-2xl p-4 bg-muted/5 flex flex-col justify-between min-h-[500px]">
          <div>
            <div className="flex justify-between items-center mb-3">
              <span className="text-sm font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                🌐 REST (JSON / HTTP/1.1)
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 font-bold">
                텍스트 기반
              </span>
            </div>

            {/* 100% SVG Diagram for REST Workflow */}
            <div className="relative border border-border/60 rounded-xl bg-card overflow-hidden">
              <svg viewBox="0 0 400 360" className="w-full h-auto">
                {/* Background Grid Lines (Subtle decoration) */}
                <line x1="200" y1="0" x2="200" y2="360" stroke="currentColor" className="text-border/20" strokeDasharray="2 2" />
                
                {/* Connection Pipes */}
                {/* HTTP/1.1 Pipe */}
                <rect x="180" y="66" width="40" height="134" fill="none" stroke="currentColor" strokeDasharray="4 4" className="text-muted-foreground/30" />
                <text x="200" y="130" textAnchor="middle" className="text-[9px] font-bold fill-muted-foreground/50 rotate-90 origin-[200px_130px] tracking-wider">HTTP/1.1 PIPE</text>

                {/* DB Query Connections */}
                {/* DB 1 Line */}
                <line x1="200" y1="246" x2="95" y2="290" stroke="currentColor" className={activeStep === 2 ? "text-amber-400 stroke-2" : "text-border stroke-1"} />
                {/* DB 2 Line */}
                <line x1="200" y1="246" x2="305" y2="290" stroke="currentColor" className={activeStep === 2 ? "text-amber-400 stroke-2" : "text-border stroke-1"} />

                {/* Client Node */}
                <g className="transition-all duration-300">
                  <rect x="120" y="20" width="160" height="46" rx="8" className={`fill-card stroke-2 ${activeStep === 0 ? "stroke-blue-500 fill-blue-50/20 dark:fill-blue-950/10 shadow-lg shadow-blue-500/10" : "stroke-border"}`} />
                  <text x="200" y="40" textAnchor="middle" className="text-xs font-bold fill-foreground">Client (Browser)</text>
                  <text x="200" y="53" textAnchor="middle" className="text-[9px] fill-muted-foreground font-mono">Serializer: JSON</text>
                </g>

                {/* REST Server Node */}
                <g className="transition-all duration-300">
                  <rect x="120" y="200" width="160" height="46" rx="8" className={`fill-card stroke-2 ${activeStep === 2 || activeStep === 3 ? "stroke-blue-500 fill-blue-50/20 dark:fill-blue-950/10" : "stroke-border"}`} />
                  <text x="200" y="220" textAnchor="middle" className="text-xs font-bold fill-foreground">REST Server</text>
                  <text x="200" y="233" textAnchor="middle" className="text-[9px] fill-muted-foreground font-mono">GET /users/1</text>
                </g>

                {/* Database Node 1: Users */}
                <g className="transition-all duration-300">
                  <rect x="40" y="290" width="110" height="40" rx="6" className={`fill-card stroke-2 ${activeStep === 2 ? "stroke-amber-400 fill-amber-50/20 dark:fill-amber-950/10" : "stroke-border"}`} />
                  <text x="95" y="308" textAnchor="middle" className="text-[11px] font-bold fill-foreground">DB: Users Table</text>
                  <text x="95" y="320" textAnchor="middle" className="text-[8px] fill-muted-foreground font-mono">1. User Query</text>
                </g>

                {/* Database Node 2: Posts */}
                <g className="transition-all duration-300">
                  <rect x="250" y="290" width="110" height="40" rx="6" className={`fill-card stroke-2 ${activeStep === 2 ? "stroke-amber-400 fill-amber-50/20 dark:fill-amber-950/10" : "stroke-border"}`} />
                  <text x="305" y="308" textAnchor="middle" className="text-[11px] font-bold fill-foreground">DB: Posts Table</text>
                  <text x="305" y="320" textAnchor="middle" className="text-[8px] fill-muted-foreground font-mono">2. Posts Query (N+1)</text>
                </g>

                {/* --- Packet Motion Animations --- */}
                {/* Step 1: Sequential requests down to Server */}
                {activeStep === 1 && (
                  <>
                    {/* Request A Packet - Moving down to Server */}
                    <motion.circle
                      key="rest-p1-a"
                      cx={200}
                      cy={70}
                      r={6}
                      className="fill-blue-500"
                      animate={{ cy: [70, 200] }}
                      transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                    />
                    {/* Request B Packet - HOLB Point placed on the LEFT side of the pipe */}
                    <motion.g
                      key="rest-p1-b"
                      initial={{ opacity: 0.3 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.5 }}
                    >
                      <circle cx={145} cy={90} r={5} className="fill-red-400 stroke-red-600 stroke-1 animate-pulse" />
                      <text x="145" y="104" textAnchor="middle" className="text-[8px] fill-red-500 font-bold">HOLB 대기</text>
                    </motion.g>
                  </>
                )}

                {/* Step 2: N+1 Server-to-DB round-trips via a SINGLE alternating packet */}
                {activeStep === 2 && (
                  <motion.circle
                    key="rest-db-single-flow"
                    cx={200}
                    cy={246}
                    r={6}
                    className="fill-amber-500"
                    animate={{
                      cx: [200, 95, 200, 200, 305, 200],
                      cy: [246, 290, 246, 246, 290, 246]
                    }}
                    transition={{ duration: 3.0, repeat: Infinity, ease: "easeInOut" }}
                  />
                )}

                {/* Step 3: Server responses. Heavy payload */}
                {activeStep === 3 && (
                  <>
                    {/* Integrated packet box and text group moving together */}
                    <motion.g
                      key="rest-res-packet-group"
                      animate={{ y: [200, 66] }}
                      transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
                    >
                      <rect
                        x={175}
                        y={0}
                        width={50}
                        height={24}
                        rx={4}
                        className="fill-red-400/80 stroke-red-500 stroke-1"
                      />
                      <text
                        x={200}
                        y={15}
                        textAnchor="middle"
                        className="text-[9px] fill-white font-bold font-mono"
                      >
                        JSON
                      </text>
                    </motion.g>

                    {/* Client side parsing label placed on the LEFT side */}
                    <text x="110" y="46" textAnchor="end" className="text-[9px] fill-red-500 font-bold font-mono animate-pulse">Parsing JSON...</text>
                  </>
                )}
              </svg>
            </div>

            {/* Code / Data representation box - Height increased by one line */}
            <div className="mt-4">
              <span className="text-xs font-semibold text-muted-foreground block mb-1">
                실제 전송 데이터 형태 (Payload)
              </span>
              <pre className="p-3 bg-muted rounded-xl text-xs font-mono text-foreground leading-relaxed overflow-x-auto h-[130px] border border-border/60">
                {stepData ? stepData.restData : '// 비교를 시작해 주세요.'}
              </pre>
            </div>
          </div>

          <AnimatePresence mode="wait">
            {stepData && (
              <motion.p
                key={activeStep}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-xs sm:text-sm text-muted-foreground leading-relaxed mt-4 bg-blue-50/30 dark:bg-blue-900/10 p-4 rounded-2xl border border-blue-100 dark:border-blue-900/40"
              >
                {stepData.restDesc}
              </motion.p>
            )}
          </AnimatePresence>
        </div>

        {/* Right Column: gRPC (Protobuf / HTTP/2) */}
        <div className="border border-border rounded-2xl p-4 bg-muted/5 flex flex-col justify-between min-h-[500px]">
          <div>
            <div className="flex justify-between items-center mb-3">
              <span className="text-sm font-bold text-violet-600 dark:text-violet-400 uppercase tracking-wider">
                ⚡ gRPC (Protobuf / HTTP/2)
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-400 font-bold">
                이진 바이너리
              </span>
            </div>

            {/* 100% SVG Diagram for gRPC Workflow */}
            <div className="relative border border-border/60 rounded-xl bg-card overflow-hidden">
              <svg viewBox="0 0 400 360" className="w-full h-auto">
                {/* Background Grid Lines (Subtle decoration) */}
                <line x1="200" y1="0" x2="200" y2="360" stroke="currentColor" className="text-border/20" strokeDasharray="2 2" />

                {/* HTTP/2 Multiplexing Pipe */}
                <rect x="165" y="66" width="70" height="134" fill="none" stroke="currentColor" strokeDasharray="4 4" className="text-muted-foreground/30" />
                {/* Multiplexing Lanes */}
                <line x1="185" y1="66" x2="185" y2="200" stroke="currentColor" className="text-border/30" strokeDasharray="2 2" />
                <line x1="215" y1="66" x2="215" y2="200" stroke="currentColor" className="text-border/30" strokeDasharray="2 2" />
                <text x="200" y="130" textAnchor="middle" className="text-[9px] font-bold fill-muted-foreground/50 rotate-90 origin-[200px_130px] tracking-wider">HTTP/2 STREAM</text>

                {/* DB Query Connections */}
                {/* Single DB query path */}
                <line x1="200" y1="246" x2="200" y2="290" stroke="currentColor" className={activeStep === 2 ? "text-emerald-400 stroke-2" : "text-border stroke-1"} />

                {/* Client Node */}
                <g className="transition-all duration-300">
                  <rect x="120" y="20" width="160" height="46" rx="8" className={`fill-card stroke-2 ${activeStep === 0 ? "stroke-violet-500 fill-violet-50/20 dark:fill-violet-950/10 shadow-lg shadow-violet-500/10" : "stroke-border"}`} />
                  <text x="200" y="40" textAnchor="middle" className="text-xs font-bold fill-foreground">Client (App SDK)</text>
                  <text x="200" y="53" textAnchor="middle" className="text-[9px] fill-muted-foreground font-mono">Serializer: Protobuf</text>
                </g>

                {/* gRPC Server Node */}
                <g className="transition-all duration-300">
                  <rect x="120" y="200" width="160" height="46" rx="8" className={`fill-card stroke-2 ${activeStep === 2 || activeStep === 3 ? "stroke-violet-500 fill-violet-50/20 dark:fill-violet-950/10" : "stroke-border"}`} />
                  <text x="200" y="220" textAnchor="middle" className="text-xs font-bold fill-foreground">gRPC Backend Server</text>
                  <text x="200" y="233" textAnchor="middle" className="text-[9px] fill-muted-foreground font-mono">GetUserWithPosts()</text>
                </g>

                {/* Database Node: Combined Query */}
                <g className="transition-all duration-300">
                  <rect x="120" y="290" width="160" height="40" rx="6" className={`fill-card stroke-2 ${activeStep === 2 ? "stroke-emerald-400 fill-emerald-50/20 dark:fill-emerald-950/10 shadow-lg shadow-emerald-500/10" : "stroke-border"}`} />
                  <text x="200" y="308" textAnchor="middle" className="text-[11px] font-bold fill-foreground">DB: User + Posts Table</text>
                  <text x="200" y="320" textAnchor="middle" className="text-[8px] fill-muted-foreground font-mono">Single Joined DB Query</text>
                </g>

                {/* --- Packet Motion Animations --- */}
                {/* Step 1: Parallel Multiplexed Stream transmission */}
                {activeStep === 1 && (
                  <>
                    {/* Stream 1 (User Request) on Lane 1 */}
                    <motion.circle
                      key="grpc-p1-a"
                      cx={185}
                      cy={70}
                      r={5}
                      className="fill-violet-500"
                      animate={{ cy: [70, 200] }}
                      transition={{ duration: 1.1, repeat: Infinity, ease: "linear" }}
                    />
                    {/* Stream 2 (Posts Request) on Lane 2 */}
                    <motion.circle
                      key="grpc-p1-b"
                      cx={215}
                      cy={70}
                      r={5}
                      className="fill-emerald-500"
                      animate={{ cy: [70, 200] }}
                      transition={{ duration: 1.3, repeat: Infinity, ease: "linear", delay: 0.3 }}
                    />
                    <text x="260" y="110" className="text-[8px] fill-emerald-500 font-bold">Multiplexed (병렬 전송)</text>
                  </>
                )}

                {/* Step 2: Combined single DB query */}
                {activeStep === 2 && (
                  <motion.circle
                    key="grpc-db-packet"
                    cx={200}
                    cy={246}
                    r={6}
                    className="fill-emerald-500"
                    animate={{
                      cy: [246, 290, 246]
                    }}
                    transition={{ duration: 1.1, repeat: Infinity, ease: "easeInOut" }}
                  />
                )}

                {/* Step 3: Response. Small binary payload */}
                {activeStep === 3 && (
                  <>
                    {/* Protobuf payload packet */}
                    <motion.circle
                      key="grpc-res-packet"
                      cx={200}
                      cy={200}
                      r={5}
                      className="fill-emerald-500"
                      animate={{ cy: [200, 70] }}
                      transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
                    />
                    <motion.text
                      key="grpc-res-label"
                      x={200}
                      y={120}
                      textAnchor="middle"
                      className="text-[8px] fill-emerald-500 font-bold"
                      animate={{ opacity: [0.4, 1, 0.4] }}
                      transition={{ repeat: Infinity, duration: 1 }}
                    >
                      Fast Binary (1.4 KB)
                    </motion.text>
                    {/* Client side instant decode label placed on the LEFT side */}
                    <text x="110" y="46" textAnchor="end" className="text-[9px] fill-emerald-500 font-bold font-mono">Instant Decoded ✓</text>
                  </>
                )}
              </svg>
            </div>

            {/* Code / Data representation box - Height increased by one line */}
            <div className="mt-4">
              <span className="text-xs font-semibold text-muted-foreground block mb-1">
                실제 전송 데이터 형태 (Payload)
              </span>
              <pre className="p-3 bg-muted rounded-xl text-xs font-mono text-foreground leading-relaxed overflow-x-auto h-[130px] border border-border/60 whitespace-pre-wrap">
                {stepData ? stepData.grpcData : '// 비교를 시작해 주세요.'}
              </pre>
            </div>
          </div>

          <AnimatePresence mode="wait">
            {stepData && (
              <motion.p
                key={activeStep}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-xs sm:text-sm text-muted-foreground leading-relaxed mt-4 bg-violet-50/30 dark:bg-violet-900/10 p-4 rounded-2xl border border-violet-100 dark:border-violet-900/40"
              >
                {stepData.grpcDesc}
              </motion.p>
            )}
          </AnimatePresence>
        </div>

      </div>

      {/* Comparison table */}
      <div className="overflow-x-auto border border-border/60 rounded-xl bg-card">
        <table className="w-full text-xs sm:text-sm border-collapse">
          <thead>
            <tr className="border-b border-border bg-muted/40">
              <th className="text-left py-2.5 px-3 text-muted-foreground font-semibold uppercase tracking-wider text-xs">비교 항목</th>
              <th className="text-center py-2.5 px-3 text-blue-600 dark:text-blue-400 font-bold">REST</th>
              <th className="text-center py-2.5 px-3 text-violet-600 dark:text-violet-400 font-bold">gRPC</th>
            </tr>
          </thead>
          <tbody>
            {COMPARISON.map((row, i) => (
              <tr key={row.feature} className={`border-b border-border/40 last:border-none ${i % 2 === 0 ? "bg-muted/10" : ""}`}>
                <td className="py-2.5 px-3 font-semibold text-foreground text-xs sm:text-sm">{row.feature}</td>
                <td className="py-2.5 px-3 text-center text-muted-foreground text-xs sm:text-sm leading-relaxed">{row.rest}</td>
                <td className="py-2.5 px-3 text-center text-muted-foreground text-xs sm:text-sm leading-relaxed">{row.grpc}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
