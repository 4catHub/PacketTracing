import { motion } from "framer-motion";

const COMPARISON = [
  { feature: "프로토콜 계층", rest: "HTTP/1.1 (기본)", grpc: "HTTP/2 (필수)" },
  { feature: "데이터 포맷", rest: "JSON (텍스트, 용량 큼)", grpc: "Protocol Buffers (이진, 용량 작음)" },
  {
    feature: "전송 데이터 예시 (Payload)",
    rest: '{\n  "id": 1,\n  "name": "Alice",\n  "role": "Admin"\n}',
    grpc: "0x08 0x01 0x12 0x05 0x41\n0x6c 0x69 0x63 0x65 0x1a\n0x05 0x41 0x64 0x6d 0x69 0x6e\n(이진 바이너리)",
  },
  { feature: "전송 메커니즘", rest: "요청/응답 별도 직렬 연결 (HOLB 발생)", grpc: "단일 커넥션 양방향 멀티플렉싱 스트림" },
  { feature: "API 호출 설계", rest: "URL 및 HTTP Method 중심 (CRUD)", grpc: "원격 함수 호출(RPC) 중심 (.proto 정의)" },
  { feature: "타입 안전성", rest: "없음 (JSON 데이터 런타임 검증 필요)", grpc: "높음 (.proto로 컴파일 시 타입 자동 보장)" },
  { feature: "실시간성", rest: "단방향 (SSE / 폴링 필요)", grpc: "양방향 스트리밍 (Bidirectional Streaming)" },
];

export default function RestVsGrpcViz() {
  return (
    <div className="space-y-8">
      {/* Visual Workspace - Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Left Column: REST (JSON / HTTP/1.1) */}
        <div className="border border-border rounded-2xl p-4 bg-muted/5 flex flex-col gap-4">
          <div className="flex justify-between items-center">
            <span className="text-sm font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
              🌐 REST (JSON / HTTP/1.1)
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 font-bold">
              텍스트 기반
            </span>
          </div>

          {/* 100% SVG Diagram for REST Workflow */}
          <div className="relative border border-border/60 rounded-xl bg-card overflow-hidden">
            <svg viewBox="0 0 400 800" className="w-full h-auto">
              <defs>
                <pattern id="grid-rest" width="20" height="20" patternUnits="userSpaceOnUse">
                  <path d="M 20 0 L 0 0 0 20" fill="none" className="stroke-zinc-200/40 dark:stroke-zinc-800/30" strokeWidth="1" />
                </pattern>
              </defs>

              {/* Grid Background */}
              <rect width="400" height="800" fill="url(#grid-rest)" />

              {/* Central vertical flow line */}
              <line x1="200" y1="0" x2="200" y2="800" stroke="currentColor" className="text-border/20" strokeDasharray="2 2" />

              {/* LEVEL 1: Client Node & Serializer */}
              <g>
                <rect x="25" y="20" width="350" height="90" rx="12" className="fill-background stroke-border stroke-1.5" />
                <text x="200" y="45" textAnchor="middle" className="text-xs font-bold fill-foreground font-sans">Level 1: Client (Browser Client)</text>
                
                {/* Serializer */}
                <rect x="60" y="60" width="280" height="36" rx="6" className="fill-muted/40 stroke-border/60 stroke-1" />
                <text x="200" y="82" textAnchor="middle" className="text-[11px] font-semibold fill-blue-600 dark:fill-blue-400 font-mono">Serializer: JSON (Heavy Text)</text>
                
                {/* Autoplay Serializer Highlight */}
                <motion.rect
                  x="60" y="60" width="280" height="36" rx="6"
                  className="stroke-blue-500 dark:stroke-blue-400 stroke-2 fill-none"
                  animate={{ opacity: [0, 1, 1, 0] }}
                  transition={{
                    duration: 8,
                    repeat: Infinity,
                    ease: "easeInOut",
                    times: [0, 0.01, 0.09, 0.10]
                  }}
                />
              </g>

              {/* LEVEL 2: Connection Pipe & Payload Transmitting */}
              <g>
                <text x="200" y="132" textAnchor="middle" className="text-[10px] font-bold fill-muted-foreground/80 uppercase tracking-wider">Level 2: HTTP/1.1 Connection (Sequential)</text>
                
                {/* HTTP/1.1 Pipe */}
                <rect x="150" y="145" width="100" height="150" rx="8" className="fill-muted/10 stroke-border/40 stroke-1" />
                
                {/* HOLB Waiting Queue */}
                <rect x="60" y="155" width="280" height="24" rx="6" className="fill-red-500/5 stroke-red-500/20 stroke-1" />
                <text x="200" y="171" textAnchor="middle" className="text-[10px] font-bold fill-red-500 dark:fill-red-400">HOLB Waiting Queue (Request #2 Blocked)</text>
                
                {/* Blinking HOLB warning overlay */}
                <motion.rect
                  x="60" y="155" width="280" height="24" rx="6"
                  className="stroke-red-500 dark:stroke-red-400 stroke-1.5 fill-red-500/10"
                  animate={{ opacity: [0, 1, 0.5, 1, 0.5, 1, 0, 0] }}
                  transition={{
                    duration: 8,
                    repeat: Infinity,
                    ease: "easeInOut",
                    times: [0, 0.05, 0.10, 0.15, 0.20, 0.25, 0.26, 1.0]
                  }}
                />
              </g>

              {/* LEVEL 3: Web Server */}
              <g>
                <rect x="25" y="320" width="350" height="90" rx="12" className="fill-background stroke-border stroke-1.5" />
                <text x="200" y="345" textAnchor="middle" className="text-xs font-bold fill-foreground font-sans">Level 3: REST Server</text>
                
                <rect x="60" y="360" width="280" height="36" rx="6" className="fill-muted/40 stroke-border/60 stroke-1" />
                <text x="200" y="382" textAnchor="middle" className="text-[11px] font-semibold fill-muted-foreground font-mono">Endpoint: GET /users/1</text>
              </g>

              {/* LEVEL 4: Database Queries */}
              <g>
                {/* Server to DB Lines */}
                <line x1="105" y1="410" x2="105" y2="460" className="stroke-border/60 stroke-1.5" strokeDasharray="2 2" />
                <line x1="295" y1="410" x2="295" y2="460" className="stroke-border/60 stroke-1.5" strokeDasharray="2 2" />

                {/* DB 1 Node (Users) */}
                <rect x="25" y="460" width="160" height="85" rx="10" className="fill-background stroke-border stroke-1.5" />
                <text x="105" y="482" textAnchor="middle" className="text-xs font-bold fill-foreground">DB: Users Table</text>
                <text x="105" y="502" textAnchor="middle" className="text-[9px] fill-muted-foreground font-mono">Query 1 (Sequential)</text>
                <text x="105" y="522" textAnchor="middle" className="text-[9px] fill-amber-500 font-bold font-mono">SELECT * FROM users</text>
                
                {/* Active Highlight for DB 1 */}
                <motion.rect
                  x="25" y="460" width="160" height="85" rx="10"
                  className="stroke-amber-500 dark:stroke-amber-400 stroke-2 fill-none"
                  animate={{ opacity: [0, 1, 1, 0, 0] }}
                  transition={{
                    duration: 8,
                    repeat: Infinity,
                    ease: "easeInOut",
                    times: [0.09, 0.10, 0.22, 0.23, 1.0]
                  }}
                />

                {/* DB 2 Node (Posts) */}
                <rect x="215" y="460" width="160" height="85" rx="10" className="fill-background stroke-border stroke-1.5" />
                <text x="295" y="482" textAnchor="middle" className="text-xs font-bold fill-foreground">DB: Posts Table</text>
                <text x="295" y="502" textAnchor="middle" className="text-[9px] fill-muted-foreground font-mono">Query 2 (N+1 Request)</text>
                <text x="295" y="522" textAnchor="middle" className="text-[9px] fill-amber-500 font-bold font-mono">SELECT * FROM posts</text>

                {/* Active Highlight for DB 2 */}
                <motion.rect
                  x="215" y="460" width="160" height="85" rx="10"
                  className="stroke-amber-500 dark:stroke-amber-400 stroke-2 fill-none"
                  animate={{ opacity: [0, 1, 1, 0, 0] }}
                  transition={{
                    duration: 8,
                    repeat: Infinity,
                    ease: "easeInOut",
                    times: [0.34, 0.35, 0.47, 0.48, 1.0]
                  }}
                />

                <text x="200" y="568" textAnchor="middle" className="text-[11px] font-bold fill-amber-600 dark:fill-amber-400 font-sans">Level 4: N+1 Query (2 sequential DB queries)</text>
              </g>

              {/* LEVEL 5: Response & Client Handling */}
              <g>
                <rect x="25" y="605" width="350" height="155" rx="12" className="fill-background stroke-border stroke-1.5" />
                <text x="200" y="628" textAnchor="middle" className="text-sm font-bold fill-foreground">Level 5: Response &amp; Client Handling</text>
                
                {/* Heavy Payload */}
                <rect x="60" y="648" width="280" height="38" rx="6" className="fill-red-500/5 stroke-red-500/20 stroke-1" />
                <text x="200" y="671" textAnchor="middle" className="text-[11px] font-semibold fill-red-500 dark:fill-red-400 font-mono">Payload: Heavy JSON Text (~9.7 KB)</text>
                
                {/* Processing */}
                <rect x="60" y="698" width="280" height="38" rx="6" className="fill-red-500/10 stroke-red-500/30 stroke-1" />
                <text x="200" y="721" textAnchor="middle" className="text-[11px] font-bold fill-red-500 dark:fill-red-400 font-sans">JSON.parse() High CPU Overhead (Slow)</text>
                
                {/* Level 5 Node Highlight */}
                <motion.rect
                  x="25" y="605" width="350" height="155" rx="12"
                  className="stroke-red-500 dark:stroke-red-400 stroke-2 fill-none"
                  animate={{ opacity: [0, 1, 1, 0, 0] }}
                  transition={{
                    duration: 8,
                    repeat: Infinity,
                    ease: "easeInOut",
                    times: [0.80, 0.8125, 0.99, 1.0, 1.0]
                  }}
                />

                {/* Level 5 Processing Box Highlight */}
                <motion.rect
                  x="60" y="698" width="280" height="38" rx="6"
                  className="stroke-red-500 dark:stroke-red-400 stroke-2 fill-none"
                  animate={{ opacity: [0, 1, 1, 0, 0] }}
                  transition={{
                    duration: 8,
                    repeat: Infinity,
                    ease: "easeInOut",
                    times: [0.80, 0.8125, 0.99, 1.0, 1.0]
                  }}
                />
              </g>

              {/* ANIMATION ELEMENTS: Packet Flow (REST Side) */}
              
              {/* Request 1 Packet (Client -> Server -> DB1 -> Server) */}
              <motion.circle
                r="6"
                className="fill-blue-500 dark:fill-blue-400"
                animate={{
                  cx: [200, 200, 105, 200, 200],
                  cy: [70, 320, 460, 320, 320],
                  opacity: [0, 1, 1, 1, 0]
                }}
                transition={{
                  duration: 8,
                  repeat: Infinity,
                  ease: "easeInOut",
                  times: [0, 0.10, 0.1625, 0.225, 0.23]
                }}
              />

              {/* Database Query 1 Packet (Server -> DB1 -> Server) */}
              <motion.circle
                r="4.5"
                className="fill-amber-500"
                animate={{
                  cx: [105, 105, 105, 105],
                  cy: [320, 460, 320, 320],
                  opacity: [0, 1, 1, 0]
                }}
                transition={{
                  duration: 8,
                  repeat: Infinity,
                  ease: "easeInOut",
                  times: [0.09, 0.1625, 0.225, 0.23]
                }}
              />

              {/* Request 2 Packet (Client -> Queue -> Server -> DB2 -> Server) */}
              <motion.circle
                r="6"
                className="fill-blue-500 dark:fill-blue-400"
                animate={{
                  cx: [200, 200, 200, 200, 295, 200, 200],
                  cy: [70, 165, 165, 320, 460, 320, 320],
                  opacity: [0, 1, 1, 1, 1, 1, 0]
                }}
                transition={{
                  duration: 8,
                  repeat: Infinity,
                  ease: "easeInOut",
                  times: [0, 0.05, 0.25, 0.35, 0.4125, 0.475, 0.48]
                }}
              />

              {/* Database Query 2 Packet (Server -> DB2 -> Server) */}
              <motion.circle
                r="4.5"
                className="fill-amber-500"
                animate={{
                  cx: [295, 295, 295, 295],
                  cy: [320, 460, 320, 320],
                  opacity: [0, 1, 1, 0]
                }}
                transition={{
                  duration: 8,
                  repeat: Infinity,
                  ease: "easeInOut",
                  times: [0.34, 0.4125, 0.475, 0.48]
                }}
              />

              {/* Heavy JSON Response Payload (Server -> Client) */}
              <motion.g
                animate={{
                  y: [320, 320, 80, 80],
                  opacity: [0, 1, 1, 0]
                }}
                transition={{
                  duration: 8,
                  repeat: Infinity,
                  ease: "linear",
                  times: [0.49, 0.50, 0.80, 0.81]
                }}
              >
                <rect x={100} y={-14} width={200} height={28} rx={6} className="fill-blue-500/90 dark:fill-blue-600/90 stroke-blue-400/50 stroke-1 shadow-md shadow-blue-500/10" />
                <text x={200} y={4} textAnchor="middle" className="text-[10px] fill-white font-bold font-mono">📦 JSON Response (~9.7 KB)</text>
              </motion.g>

            </svg>
          </div>
        </div>

        {/* Right Column: gRPC (Protobuf / HTTP/2) */}
        <div className="border border-border rounded-2xl p-4 bg-muted/5 flex flex-col gap-4">
          <div className="flex justify-between items-center">
            <span className="text-sm font-bold text-violet-600 dark:text-violet-400 uppercase tracking-wider">
              ⚡ gRPC (Protobuf / HTTP/2)
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-400 font-bold">
              이진 바이너리
            </span>
          </div>

          {/* 100% SVG Diagram for gRPC Workflow */}
          <div className="relative border border-border/60 rounded-xl bg-card overflow-hidden">
            <svg viewBox="0 0 400 800" className="w-full h-auto">
              <defs>
                <pattern id="grid-grpc" width="20" height="20" patternUnits="userSpaceOnUse">
                  <path d="M 20 0 L 0 0 0 20" fill="none" className="stroke-zinc-200/40 dark:stroke-zinc-800/30" strokeWidth="1" />
                </pattern>
              </defs>

              {/* Grid Background */}
              <rect width="400" height="800" fill="url(#grid-grpc)" />

              {/* Central vertical flow line */}
              <line x1="200" y1="0" x2="200" y2="800" stroke="currentColor" className="text-border/20" strokeDasharray="2 2" />

              {/* LEVEL 1: Client Node & Serializer */}
              <g>
                <rect x="25" y="20" width="350" height="90" rx="12" className="fill-background stroke-border stroke-1.5" />
                <text x="200" y="45" textAnchor="middle" className="text-xs font-bold fill-foreground font-sans">Level 1: Client (App SDK)</text>
                
                {/* Serializer */}
                <rect x="60" y="60" width="280" height="36" rx="6" className="fill-muted/40 stroke-border/60 stroke-1" />
                <text x="200" y="82" textAnchor="middle" className="text-[11px] font-semibold fill-violet-600 dark:fill-violet-400 font-mono">Serializer: Protobuf (Binary)</text>
                
                {/* Autoplay Serializer Highlight */}
                <motion.rect
                  x="60" y="60" width="280" height="36" rx="6"
                  className="stroke-violet-500 dark:stroke-violet-400 stroke-2 fill-none"
                  animate={{ opacity: [0, 1, 1, 0] }}
                  transition={{
                    duration: 4,
                    repeat: Infinity,
                    ease: "easeInOut",
                    times: [0, 0.01, 0.09, 0.10]
                  }}
                />
              </g>

              {/* LEVEL 2: Connection Pipe & Payload Transmitting */}
              <g>
                <text x="200" y="132" textAnchor="middle" className="text-[10px] font-bold fill-muted-foreground/80 uppercase tracking-wider">Level 2: HTTP/2 Streams (Multiplexed)</text>
                
                {/* HTTP/2 Pipe */}
                <rect x="120" y="145" width="160" height="150" rx="8" className="fill-muted/10 stroke-border/40 stroke-1" />
                
                {/* Lanes */}
                <line x1="160" y1="145" x2="160" y2="295" className="stroke-border/30 stroke-dashed" strokeDasharray="3 3" />
                <text x="160" y="160" textAnchor="middle" className="text-[8px] fill-muted-foreground/60 font-mono">Stream 1</text>
                
                <line x1="240" y1="145" x2="240" y2="295" className="stroke-border/30 stroke-dashed" strokeDasharray="3 3" />
                <text x="240" y="160" textAnchor="middle" className="text-[8px] fill-muted-foreground/60 font-mono">Stream 2</text>
              </g>

              {/* LEVEL 3: Web/Backend Server */}
              <g>
                <rect x="25" y="320" width="350" height="90" rx="12" className="fill-background stroke-border stroke-1.5" />
                <text x="200" y="345" textAnchor="middle" className="text-xs font-bold fill-foreground font-sans">Level 3: gRPC Server</text>
                
                <rect x="60" y="360" width="280" height="36" rx="6" className="fill-muted/40 stroke-border/60 stroke-1" />
                <text x="200" y="382" textAnchor="middle" className="text-[11px] font-semibold fill-muted-foreground font-mono">Service: GetUserWithPosts()</text>
              </g>

              {/* LEVEL 4: Database Queries */}
              <g>
                {/* Server to DB Line */}
                <line x1="200" y1="410" x2="200" y2="460" className="stroke-border/60 stroke-1.5" strokeDasharray="2 2" />

                {/* DB Users+Posts Joint Node */}
                <rect x="60" y="460" width="280" height="85" rx="10" className="fill-background stroke-border stroke-1.5" />
                <text x="200" y="482" textAnchor="middle" className="text-xs font-bold fill-foreground">DB: Users + Posts (Joined)</text>
                <text x="200" y="502" textAnchor="middle" className="text-[9px] fill-muted-foreground font-mono">Single JOIN Query (1 DB roundtrip)</text>
                <text x="200" y="522" textAnchor="middle" className="text-[9px] fill-emerald-500 font-bold font-mono">SELECT * FROM users LEFT JOIN posts ON ...</text>
                
                {/* Active Highlight for DB */}
                <motion.rect
                  x="60" y="460" width="280" height="85" rx="10"
                  className="stroke-emerald-500 dark:stroke-emerald-400 stroke-2 fill-none"
                  animate={{ opacity: [0, 1, 1, 0, 0] }}
                  transition={{
                    duration: 4,
                    repeat: Infinity,
                    ease: "easeInOut",
                    times: [0.19, 0.20, 0.40, 0.41, 1.0]
                  }}
                />

                <text x="200" y="568" textAnchor="middle" className="text-[11px] font-bold fill-emerald-600 dark:fill-emerald-400 font-sans">Level 4: Single JOIN DB query</text>
              </g>

              {/* LEVEL 5: Response & Client Handling */}
              <g>
                <rect x="25" y="605" width="350" height="155" rx="12" className="fill-background stroke-border stroke-1.5" />
                <text x="200" y="628" textAnchor="middle" className="text-sm font-bold fill-foreground">Level 5: Response &amp; Client Handling</text>
                
                {/* Light Payload */}
                <rect x="60" y="648" width="280" height="38" rx="6" className="fill-emerald-500/5 stroke-emerald-500/20 stroke-1" />
                <text x="200" y="671" textAnchor="middle" className="text-[11px] font-semibold fill-emerald-600 dark:fill-emerald-400 font-mono">Payload: Light Binary Protobuf (~1.4 KB)</text>
                
                {/* Processing */}
                <rect x="60" y="698" width="280" height="38" rx="6" className="fill-emerald-500/10 stroke-emerald-500/30 stroke-1" />
                <text x="200" y="721" textAnchor="middle" className="text-[11px] font-bold fill-emerald-600 dark:fill-emerald-400 font-sans">Fast Binary Decoding (Sub-millisecond)</text>
                
                {/* Level 5 Node Highlight */}
                <motion.rect
                  x="25" y="605" width="350" height="155" rx="12"
                  className="stroke-emerald-500 dark:stroke-emerald-400 stroke-2 fill-none"
                  animate={{ opacity: [0, 1, 1, 0, 0] }}
                  transition={{
                    duration: 4,
                    repeat: Infinity,
                    ease: "easeInOut",
                    times: [0.64, 0.65, 0.99, 1.0, 1.0]
                  }}
                />

                {/* Level 5 Processing Box Highlight */}
                <motion.rect
                  x="60" y="698" width="280" height="38" rx="6"
                  className="stroke-emerald-500 dark:stroke-emerald-400 stroke-2 fill-none"
                  animate={{ opacity: [0, 1, 1, 0, 0] }}
                  transition={{
                    duration: 4,
                    repeat: Infinity,
                    ease: "easeInOut",
                    times: [0.64, 0.65, 0.99, 1.0, 1.0]
                  }}
                />
              </g>

              {/* ANIMATION ELEMENTS: Packet Flow (gRPC Side - Fast Loop) */}
              
              {/* Stream 1 Packet (Client -> Server) */}
              <motion.circle
                r="5"
                className="fill-violet-500 dark:fill-violet-400"
                animate={{
                  cx: [160, 160, 160],
                  cy: [70, 320, 320],
                  opacity: [0, 1, 0]
                }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  ease: "easeInOut",
                  times: [0.02, 0.175, 0.18]
                }}
              />

              {/* Stream 2 Packet (Client -> Server - slightly staggered) */}
              <motion.circle
                r="5"
                className="fill-emerald-500 dark:fill-emerald-400"
                animate={{
                  cx: [240, 240, 240],
                  cy: [70, 320, 320],
                  opacity: [0, 1, 0]
                }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  ease: "easeInOut",
                  times: [0.07, 0.225, 0.23]
                }}
              />

              {/* DB Query Packet (Server -> DB -> Server) */}
              <motion.circle
                r="5"
                className="fill-emerald-500"
                animate={{
                  cx: [200, 200, 200, 200],
                  cy: [320, 460, 320, 320],
                  opacity: [0, 1, 1, 0]
                }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  ease: "easeInOut",
                  times: [0.19, 0.30, 0.40, 0.41]
                }}
              />

              {/* Compact Binary Response Payload (Server -> Client) */}
              <motion.g
                animate={{
                  y: [320, 320, 80, 80],
                  opacity: [0, 1, 1, 0]
                }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  ease: "linear",
                  times: [0.44, 0.45, 0.65, 0.66]
                }}
              >
                <rect x={100} y={-14} width={200} height={28} rx={6} className="fill-emerald-500/90 dark:fill-emerald-600/90 stroke-emerald-400/50 stroke-1 shadow-md shadow-emerald-500/10" />
                <text x={200} y={4} textAnchor="middle" className="text-[10px] fill-white font-bold font-mono">⚡ Protobuf Response (~1.4 KB)</text>
              </motion.g>

            </svg>
          </div>
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
            {COMPARISON.map((row, i) => {
              const isPayload = row.feature.includes("Payload");
              return (
                <tr key={row.feature} className={`border-b border-border/40 last:border-none ${i % 2 === 0 ? "bg-muted/10" : ""}`}>
                  <td className="py-2.5 px-3 font-semibold text-foreground text-xs sm:text-sm align-middle">{row.feature}</td>
                  <td className="py-2.5 px-3 text-muted-foreground text-xs sm:text-sm leading-relaxed align-middle">
                    {isPayload ? (
                      <pre className="text-left font-mono text-[10px] sm:text-[11px] bg-muted/30 rounded p-2 overflow-x-auto whitespace-pre leading-normal border border-border/40">
                        {row.rest}
                      </pre>
                    ) : (
                      <span className="text-center block">{row.rest}</span>
                    )}
                  </td>
                  <td className="py-2.5 px-3 text-muted-foreground text-xs sm:text-sm leading-relaxed align-middle">
                    {isPayload ? (
                      <pre className="text-left font-mono text-[10px] sm:text-[11px] bg-muted/30 rounded p-2 overflow-x-auto whitespace-pre leading-normal border border-border/40">
                        {row.grpc}
                      </pre>
                    ) : (
                      <span className="text-center block">{row.grpc}</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
