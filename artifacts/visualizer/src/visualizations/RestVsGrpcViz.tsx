import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Pause, RotateCcw } from "lucide-react";

interface Message {
  id: number;
  direction: "request" | "response" | "stream";
  label: string;
  sublabel?: string;
  color: string;
}

const REST_MESSAGES: Message[] = [
  { id: 0, direction: "request", label: "HTTP GET /users/1", sublabel: "JSON 요청", color: "bg-blue-500" },
  { id: 1, direction: "response", label: "200 OK { user: {...} }", sublabel: "JSON 응답 (1.2KB)", color: "bg-emerald-500" },
  { id: 2, direction: "request", label: "HTTP GET /users/1/posts", sublabel: "JSON 요청 (N+1 문제)", color: "bg-blue-500" },
  { id: 3, direction: "response", label: "200 OK [{ post: {...} }, ...]", sublabel: "JSON 응답 (8.5KB)", color: "bg-emerald-500" },
];

const GRPC_MESSAGES: Message[] = [
  { id: 0, direction: "request", label: "GetUser(id: 1)", sublabel: "Protobuf 직렬화", color: "bg-violet-500" },
  { id: 1, direction: "stream", label: "Stream: UserWithPosts", sublabel: "단일 스트림 (HTTP/2)", color: "bg-amber-500" },
  { id: 2, direction: "stream", label: "→ user { id:1, name:... }", sublabel: "Protobuf 응답 (0.3KB)", color: "bg-violet-500" },
  { id: 3, direction: "stream", label: "→ posts [...]", sublabel: "Protobuf 응답 (1.1KB)", color: "bg-violet-500" },
];

const COMPARISON = [
  { feature: "프로토콜", rest: "HTTP/1.1 (기본)", grpc: "HTTP/2" },
  { feature: "데이터 포맷", rest: "JSON (텍스트)", grpc: "Protocol Buffers (이진)" },
  { feature: "페이로드 크기", rest: "상대적으로 큼", grpc: "최대 70% 감소" },
  { feature: "스트리밍", rest: "단방향 (SSE)", grpc: "양방향 스트리밍" },
  { feature: "브라우저 지원", rest: "네이티브 지원", grpc: "gRPC-Web 필요" },
  { feature: "코드 생성", rest: "선택 사항", grpc: ".proto 파일 필수" },
  { feature: "주요 사용 사례", rest: "Public API, CRUD", grpc: "마이크로서비스, 실시간" },
];

function SequenceLane({
  title: laneTitle,
  messages,
  activeIdx,
  color,
  headerColor,
}: {
  title: string;
  messages: Message[];
  activeIdx: number;
  color: string;
  headerColor: string;
}) {
  return (
    <div className="flex-1 min-w-0 space-y-3">
      <div className={`py-2 px-4 rounded-lg text-center text-sm font-bold text-white ${headerColor}`}>
        {laneTitle}
      </div>

      <div className="relative flex flex-col items-center gap-1">
        {/* Client */}
        <div className={`w-full py-2 rounded-lg border-2 ${color} text-center text-xs font-semibold text-foreground bg-card`}>
          Client
        </div>

        {/* Messages */}
        <div className="w-full space-y-1.5 py-2">
          {messages.map((msg, i) => {
            const visible = i <= activeIdx;
            const isActive = i === activeIdx;
            const isReq = msg.direction === "request";
            const isStream = msg.direction === "stream";

            return (
              <AnimatePresence key={msg.id}>
                {visible && (
                  <motion.div
                    initial={{ opacity: 0, x: isReq ? -20 : 20, scaleX: 0.8 }}
                    animate={{ opacity: 1, x: 0, scaleX: 1 }}
                    transition={{ duration: 0.35 }}
                    className={`relative flex ${isReq || isStream ? "justify-start" : "justify-end"}`}
                  >
                    <div
                      className={`max-w-[90%] px-3 py-2 rounded-lg text-xs space-y-0.5 ${
                        isActive ? "ring-2 ring-offset-1 ring-primary/50" : ""
                      } ${
                        isReq
                          ? "bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800"
                          : isStream
                          ? "bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800"
                          : "bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800"
                      }`}
                    >
                      <div className="flex items-center gap-1.5">
                        <div className={`w-2 h-2 rounded-full flex-shrink-0 ${msg.color}`} />
                        <span className="font-mono font-semibold text-foreground">{msg.label}</span>
                      </div>
                      {msg.sublabel && (
                        <p className="text-muted-foreground ml-3.5">{msg.sublabel}</p>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            );
          })}
        </div>

        {/* Server */}
        <div className={`w-full py-2 rounded-lg border-2 ${color} text-center text-xs font-semibold text-foreground bg-card`}>
          Server
        </div>
      </div>
    </div>
  );
}

export default function RestVsGrpcViz() {
  const [restIdx, setRestIdx] = useState(-1);
  const [grpcIdx, setGrpcIdx] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [tick, setTick] = useState(0);

  const maxSteps = Math.max(REST_MESSAGES.length, GRPC_MESSAGES.length);
  const isComplete = restIdx >= REST_MESSAGES.length - 1 && grpcIdx >= GRPC_MESSAGES.length - 1;

  useEffect(() => {
    if (!isPlaying) return;
    if (isComplete) {
      setIsPlaying(false);
      return;
    }
    const timer = setTimeout(() => setTick((t) => t + 1), 900);
    return () => clearTimeout(timer);
  }, [isPlaying, isComplete, tick]);

  useEffect(() => {
    if (!isPlaying) return;
    setRestIdx((prev) => Math.min(prev + 1, REST_MESSAGES.length - 1));
    setGrpcIdx((prev) => Math.min(prev + 1, GRPC_MESSAGES.length - 1));
  }, [tick]);

  const handleReset = useCallback(() => {
    setIsPlaying(false);
    setRestIdx(-1);
    setGrpcIdx(-1);
    setTick(0);
  }, []);

  const handlePlay = useCallback(() => {
    if (isComplete) {
      handleReset();
      setTimeout(() => setIsPlaying(true), 50);
    } else {
      setIsPlaying((p) => !p);
    }
  }, [isComplete, handleReset]);

  const progress = Math.max(restIdx, grpcIdx) + 1;

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex items-center gap-3 flex-wrap">
        <button
          onClick={handleReset}
          className="p-2 rounded-lg border border-card-border bg-card hover:bg-muted transition-colors text-muted-foreground"
          data-testid="button-reset"
        >
          <RotateCcw size={16} />
        </button>
        <button
          onClick={handlePlay}
          className="flex items-center gap-2 px-5 py-2 rounded-lg bg-primary text-primary-foreground hover:opacity-90 text-sm font-medium"
          data-testid="button-play-pause"
        >
          {isPlaying ? <Pause size={15} /> : <Play size={15} />}
          {isComplete ? "다시 보기" : isPlaying ? "일시정지" : restIdx < 0 ? "비교 시작" : "계속"}
        </button>
        <div className="flex-1 space-y-1">
          <div className="text-xs text-muted-foreground">
            메시지 {Math.max(0, progress)} / {maxSteps}
          </div>
          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-primary rounded-full"
              animate={{ width: `${(Math.max(0, progress) / maxSteps) * 100}%` }}
              transition={{ duration: 0.4 }}
            />
          </div>
        </div>
      </div>

      {/* Sequence diagrams side-by-side */}
      <div className="flex gap-4 items-start">
        <SequenceLane
          title="REST API"
          messages={REST_MESSAGES}
          activeIdx={restIdx}
          color="border-blue-400 dark:border-blue-600"
          headerColor="bg-blue-600"
        />
        {/* Divider */}
        <div className="w-px bg-border self-stretch" />
        <SequenceLane
          title="gRPC"
          messages={GRPC_MESSAGES}
          activeIdx={grpcIdx}
          color="border-violet-400 dark:border-violet-600"
          headerColor="bg-violet-600"
        />
      </div>

      {/* Summary callouts */}
      {isComplete && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid sm:grid-cols-2 gap-3 text-sm"
        >
          <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <p className="font-semibold text-blue-700 dark:text-blue-400 mb-1">REST API 특징</p>
            <ul className="text-xs text-muted-foreground space-y-0.5">
              <li>4개의 별도 HTTP 요청 (N+1 문제)</li>
              <li>JSON 페이로드 합계: 9.7KB</li>
              <li>사람이 읽기 쉬운 포맷</li>
            </ul>
          </div>
          <div className="p-3 bg-violet-50 dark:bg-violet-900/20 border border-violet-200 dark:border-violet-800 rounded-lg">
            <p className="font-semibold text-violet-700 dark:text-violet-400 mb-1">gRPC 특징</p>
            <ul className="text-xs text-muted-foreground space-y-0.5">
              <li>단일 연결 + 스트리밍 (HTTP/2)</li>
              <li>Protobuf 페이로드 합계: 1.4KB</li>
              <li>컴파일된 .proto 스키마 필요</li>
            </ul>
          </div>
        </motion.div>
      )}

      {/* Comparison table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left py-2 px-3 text-muted-foreground font-medium text-xs uppercase tracking-wide">
                항목
              </th>
              <th className="text-center py-2 px-3 text-blue-600 dark:text-blue-400 font-semibold">
                REST API
              </th>
              <th className="text-center py-2 px-3 text-violet-600 dark:text-violet-400 font-semibold">
                gRPC
              </th>
            </tr>
          </thead>
          <tbody>
            {COMPARISON.map((row, i) => (
              <tr
                key={row.feature}
                className={`border-b border-border/50 ${i % 2 === 0 ? "bg-muted/20" : ""}`}
              >
                <td className="py-2.5 px-3 font-medium text-foreground text-xs">{row.feature}</td>
                <td className="py-2.5 px-3 text-center text-xs text-muted-foreground">{row.rest}</td>
                <td className="py-2.5 px-3 text-center text-xs text-muted-foreground">{row.grpc}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
