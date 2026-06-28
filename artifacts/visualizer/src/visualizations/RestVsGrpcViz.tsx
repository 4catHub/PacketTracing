import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Pause, RotateCcw } from "lucide-react";

const STEPS = [
  { title: "클라이언트 요청 시작", nodes: { rest: [0], grpc: [5] }, restDesc: "HTTP GET /users/1 요청을 준비합니다.", grpcDesc: "GetUser(id: 1) RPC를 호출합니다." },
  { title: "데이터 직렬화", nodes: { rest: [0, 1], grpc: [5, 6] }, restDesc: "요청을 JSON 텍스트로 직렬화합니다. 사람이 읽기 쉽지만 크기가 큽니다.", grpcDesc: "요청을 Protocol Buffers 이진 포맷으로 직렬화합니다. 최대 70% 작습니다." },
  { title: "네트워크 전송", nodes: { rest: [1, 2], grpc: [6, 7] }, restDesc: "HTTP/1.1로 전송합니다. 매 요청마다 새 연결을 수립(HOL Blocking)합니다.", grpcDesc: "HTTP/2로 전송합니다. 하나의 연결에서 다중화 스트리밍을 지원합니다." },
  { title: "서버 처리", nodes: { rest: [2, 3], grpc: [7, 8] }, restDesc: "서버가 REST 엔드포인트를 처리합니다. N+1 문제가 발생할 수 있습니다.", grpcDesc: "서버가 단일 RPC로 모든 데이터를 한 번에 처리합니다." },
  { title: "응답 반환", nodes: { rest: [3, 4], grpc: [8, 9] }, restDesc: "JSON 응답을 반환합니다. 총 페이로드 ~9.7KB (여러 요청 합계).", grpcDesc: "Protobuf 응답을 스트리밍으로 반환합니다. 총 페이로드 ~1.4KB." },
];

const REST_NODES = [
  { id: 0, icon: "👤", label: "Client" },
  { id: 1, icon: "📝", label: "JSON 직렬화", sub: "텍스트 포맷" },
  { id: 2, icon: "🌐", label: "HTTP/1.1", sub: "요청·응답 각각" },
  { id: 3, icon: "🖥️", label: "REST 서버", sub: "N+1 처리" },
  { id: 4, icon: "📥", label: "JSON 응답", sub: "~9.7KB" },
];

const GRPC_NODES = [
  { id: 5, icon: "👤", label: "Client" },
  { id: 6, icon: "⚡", label: "Protobuf", sub: "이진 포맷" },
  { id: 7, icon: "🔗", label: "HTTP/2", sub: "다중화 스트림" },
  { id: 8, icon: "🖥️", label: "gRPC 서버", sub: "단일 RPC" },
  { id: 9, icon: "📥", label: "Proto 응답", sub: "~1.4KB" },
];

const COMPARISON = [
  { feature: "프로토콜", rest: "HTTP/1.1", grpc: "HTTP/2" },
  { feature: "데이터 포맷", rest: "JSON (텍스트)", grpc: "Protocol Buffers (이진)" },
  { feature: "페이로드 크기", rest: "상대적으로 큼", grpc: "최대 70% 감소" },
  { feature: "스트리밍", rest: "단방향 (SSE)", grpc: "양방향 스트리밍" },
  { feature: "브라우저 지원", rest: "네이티브 지원", grpc: "gRPC-Web 필요" },
  { feature: "코드 생성", rest: "선택 사항", grpc: ".proto 파일 필수" },
  { feature: "주요 사용 사례", rest: "Public API, CRUD", grpc: "마이크로서비스, 실시간" },
];

type Status = "idle" | "active" | "done" | "dim";

function layerStatus(nodeId: number, activeStep: number): Status {
  if (activeStep < 0) return "idle";
  const cur = STEPS[activeStep];
  const allActive = [...(cur?.nodes.rest ?? []), ...(cur?.nodes.grpc ?? [])];
  if (allActive.includes(nodeId)) return "active";
  for (let i = 0; i < activeStep; i++) {
    const s = STEPS[i];
    if ([...(s.nodes.rest), ...(s.nodes.grpc)].includes(nodeId)) return "done";
  }
  return "dim";
}

function edgeStatus(srcId: number, dstId: number, activeStep: number): Status {
  if (activeStep < 0) return "idle";
  const cur = STEPS[activeStep];
  const allActive = [...(cur?.nodes.rest ?? []), ...(cur?.nodes.grpc ?? [])];
  if (allActive.includes(srcId) && allActive.includes(dstId)) return "active";
  for (let i = 0; i < activeStep; i++) {
    const s = STEPS[i];
    const prev = [...s.nodes.rest, ...s.nodes.grpc];
    if (prev.includes(srcId) && prev.includes(dstId)) return "done";
  }
  return "dim";
}

const NODE_BASE = "flex flex-col items-center gap-1 px-2.5 py-2.5 rounded-xl border-2 text-center transition-all duration-300 w-[90px] shrink-0";
const NODE_STATUS: Record<Status, string> = {
  idle: "border-border bg-card",
  active: "border-blue-400 bg-blue-50 dark:bg-blue-900/20 ring-2 ring-blue-400 ring-offset-1 dark:ring-offset-background shadow-lg shadow-blue-500/20",
  done: "border-emerald-400 bg-emerald-50 dark:bg-emerald-900/20",
  dim: "border-border bg-card opacity-20",
};

function StackNode({ node, activeStep }: { node: typeof REST_NODES[number]; activeStep: number }) {
  const s = layerStatus(node.id, activeStep);
  return (
    <motion.div
      animate={s === "active" ? { scale: [1, 1.05, 1] } : { scale: 1 }}
      transition={s === "active" ? { repeat: Infinity, duration: 1.2, ease: "easeInOut" } : {}}
      className={`${NODE_BASE} ${NODE_STATUS[s]}`}
    >
      <span className="text-xl leading-none">{node.icon}</span>
      <span className="text-[10px] font-bold leading-tight">{node.label}</span>
      {node.sub && <span className="text-[9px] text-muted-foreground leading-tight">{node.sub}</span>}
    </motion.div>
  );
}

function StackArrowV({ srcId, dstId, activeStep, stepIdx }: { srcId: number; dstId: number; activeStep: number; stepIdx: number }) {
  const s = edgeStatus(srcId, dstId, activeStep);
  const started = activeStep >= 0;
  const line = s === "active" ? "bg-blue-500" : s === "done" ? "bg-emerald-400" : started ? "bg-border/25" : "bg-border/50";
  const head = s === "active" ? "border-t-blue-500" : s === "done" ? "border-t-emerald-400" : started ? "border-t-border/25" : "border-t-border/50";
  const badge = s === "active" ? "bg-blue-500 text-white shadow" : s === "done" ? "bg-emerald-500 text-white" : "bg-muted text-muted-foreground/50";
  return (
    <div className="relative flex flex-col items-center h-7 shrink-0 my-0.5">
      <div className={`w-0.5 flex-1 transition-colors duration-300 ${line}`} />
      <div className={`w-0 h-0 border-l-[4px] border-r-[4px] border-t-[6px] border-transparent transition-colors duration-300 ${head}`} />
      <div className={`absolute -right-6 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full text-[9px] font-bold flex items-center justify-center transition-all duration-300 ${badge}`}>
        {stepIdx + 1}
      </div>
    </div>
  );
}

function ArchStack({
  title, nodes, activeStep, headerColor, stepDescs,
}: {
  title: string; nodes: typeof REST_NODES; activeStep: number; headerColor: string; stepDescs: string[];
}) {
  const currentDesc = activeStep >= 0 && activeStep < stepDescs.length ? stepDescs[activeStep] : null;
  return (
    <div className="flex-1 min-w-0 flex flex-col items-center gap-0">
      {/* Header */}
      <div className={`w-full py-2 px-3 rounded-lg text-center text-sm font-bold text-white mb-3 ${headerColor}`}>
        {title}
      </div>

      {/* Stack of nodes */}
      {nodes.map((node, i) => (
        <div key={node.id} className="flex flex-col items-center">
          <StackNode node={node} activeStep={activeStep} />
          {i < nodes.length - 1 && (
            <StackArrowV srcId={node.id} dstId={nodes[i + 1].id} activeStep={activeStep} stepIdx={i + 1} />
          )}
        </div>
      ))}

      {/* Per-stack step description */}
      <AnimatePresence mode="wait">
        {currentDesc && (
          <motion.div key={activeStep} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="mt-3 w-full p-2 rounded-lg bg-muted/40 text-[11px] text-muted-foreground leading-relaxed text-center">
            {currentDesc}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function RestVsGrpcViz() {
  const [activeStep, setActiveStep] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const total = STEPS.length;
  const isComplete = activeStep >= total - 1;

  useEffect(() => {
    if (!isPlaying) return;
    if (isComplete) { setIsPlaying(false); return; }
    const t = setTimeout(() => setActiveStep(p => p + 1), 1100);
    return () => clearTimeout(t);
  }, [isPlaying, activeStep, isComplete]);

  const handleReset = useCallback(() => { setIsPlaying(false); setActiveStep(-1); }, []);
  const handlePlay = useCallback(() => {
    if (isComplete) { handleReset(); setTimeout(() => setIsPlaying(true), 50); }
    else setIsPlaying(p => !p);
  }, [isComplete, handleReset]);

  const progress = ((activeStep + 1) / total) * 100;
  const restDescs = STEPS.map(s => s.restDesc);
  const grpcDescs = STEPS.map(s => s.grpcDesc);

  return (
    <div className="space-y-5">
      {/* Controls */}
      <div className="flex items-center gap-3 flex-wrap">
        <button onClick={handleReset} className="p-2 rounded-lg border border-card-border bg-card hover:bg-muted transition-colors text-muted-foreground" data-testid="button-reset">
          <RotateCcw size={16} />
        </button>
        <button onClick={handlePlay} className="flex items-center gap-2 px-5 py-2 rounded-lg bg-primary text-primary-foreground hover:opacity-90 text-sm font-medium" data-testid="button-play-pause">
          {isPlaying ? <Pause size={15} /> : <Play size={15} />}
          {isComplete ? "다시 보기" : isPlaying ? "일시정지" : activeStep < 0 ? "비교 시작" : "계속"}
        </button>
        <div className="flex-1 space-y-1">
          <div className="text-xs text-muted-foreground">
            {activeStep >= 0 ? `단계 ${activeStep + 1} / ${total} — ${STEPS[activeStep].title}` : `총 ${total}단계`}
          </div>
          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
            <motion.div className="h-full bg-primary rounded-full" animate={{ width: `${Math.max(0, progress)}%` }} transition={{ duration: 0.4 }} />
          </div>
        </div>
      </div>

      {/* Side-by-side architecture stacks */}
      <div className="flex gap-4 items-start">
        <ArchStack title="REST API" nodes={REST_NODES} activeStep={activeStep} headerColor="bg-blue-600" stepDescs={restDescs} />
        <div className="w-px bg-border self-stretch mt-10" />
        <ArchStack title="gRPC" nodes={GRPC_NODES} activeStep={activeStep} headerColor="bg-violet-600" stepDescs={grpcDescs} />
      </div>

      {/* Comparison table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left py-2 px-3 text-muted-foreground font-medium text-xs uppercase tracking-wide">항목</th>
              <th className="text-center py-2 px-3 text-blue-600 dark:text-blue-400 font-semibold">REST API</th>
              <th className="text-center py-2 px-3 text-violet-600 dark:text-violet-400 font-semibold">gRPC</th>
            </tr>
          </thead>
          <tbody>
            {COMPARISON.map((row, i) => (
              <tr key={row.feature} className={`border-b border-border/50 ${i % 2 === 0 ? "bg-muted/20" : ""}`}>
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
