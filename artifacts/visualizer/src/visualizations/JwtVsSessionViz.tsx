import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Pause, ChevronLeft, ChevronRight, RotateCcw, Database } from "lucide-react";

// Steps for Side-by-Side Comparison
const STEPS = [
  {
    title: "1. 로그인 요청 (Login Request)",
    nodes: { session: [0], jwt: [3] },
    sessionDesc: "클라이언트가 사용자 ID와 비밀번호를 평문으로 서버에 전송하며 로그인을 요청합니다.",
    jwtDesc: "클라이언트가 동일하게 사용자 ID와 비밀번호를 서버에 전송하며 인증을 요청합니다.",
  },
  {
    title: "2. 인증 및 저장소 처리 (Auth & Store)",
    nodes: { session: [0, 1, 2], jwt: [3, 4] },
    sessionDesc: "서버가 정보를 검증한 뒤 세션 ID를 생성하고, 세션 DB/Redis에 세션 ID와 사용자 세부 정보(권한 등)를 저장합니다.",
    jwtDesc: "서버가 정보를 검증한 뒤, 사용자 정보와 만료 시간을 담은 JSON 데이터(Payload)에 서버만 아는 시크릿 키로 디지털 서명하여 JWT 토큰을 발행합니다. (서버 측 저장소 이용 없음)",
  },
  {
    title: "3. 응답 반환 (Login Response)",
    nodes: { session: [1, 0], jwt: [4, 3] },
    sessionDesc: "서버는 클라이언트 브라우저로 'Set-Cookie: session_id=XYZ' 헤더를 전달해 쿠키에 세션 ID를 자동 저장하도록 합니다.",
    jwtDesc: "서버는 HTTP 응답 본문(JSON)에 JWT 토큰을 담아 반환하며, 클라이언트는 이를 LocalStorage 또는 쿠키에 직접 보관합니다.",
  },
  {
    title: "4. 다음 API 요청 (API Request with Auth)",
    nodes: { session: [0, 1], jwt: [3, 4] },
    sessionDesc: "클라이언트가 회원 정보를 조회하는 API를 호출할 때, 브라우저가 쿠키에 들어있던 세션 ID를 HTTP 헤더에 담아 자동으로 전송합니다.",
    jwtDesc: "클라이언트가 API를 호출할 때, 헤더에 'Authorization: Bearer <JWT>' 포맷으로 직접 토큰을 실어서 요청을 보냅니다.",
  },
  {
    title: "5. 유효성 검증 (Validation)",
    nodes: { session: [1, 2], jwt: [4] },
    sessionDesc: "서버가 들어온 세션 ID로 세션 DB를 조회하여 해당 세션이 유효한지 확인하고 사용자의 데이터를 가져옵니다. (매 요청마다 DB 접근 오버헤드 발생)",
    jwtDesc: "서버는 들어온 JWT의 서명(Signature)을 자신의 시크릿 키로 디코딩하여 검증한 후, 유효하다면 토큰 내 Payload를 즉시 파싱해 사용자를 식별합니다. (DB 접근 없이 로컬 메모리 연산만으로 해결)",
  },
];

const SESSION_NODES = [
  { id: 0, icon: "👤", label: "Client", sub: "세션 쿠키 전송" },
  { id: 1, icon: "🖥️", label: "Server", sub: "세션 상태 관리" },
  { id: 2, icon: "💾", label: "Session DB", sub: "사용자 세션 보관" },
];

const JWT_NODES = [
  { id: 3, icon: "👤", label: "Client", sub: "Bearer 토큰 전송" },
  { id: 4, icon: "🖥️", label: "Server", sub: "서명 키 즉시 검증" },
];

const COMPARISON = [
  { feature: "인증 상태 보관", session: "서버 측 저장소 (Memory/DB/Redis)", jwt: "클라이언트 측 (쿠키/LocalStorage)" },
  { feature: "확장성 (Scalability)", session: "서버 증설 시 세션 클러스터링/공유 필요", jwt: "서버가 상태를 안 가지므로 무한 확장 용이" },
  { feature: "보안 제어력", session: "의심스러운 세션 즉시 서버에서 강제 로그아웃 가능", jwt: "토큰이 탈취되면 만료될 때까지 제어 불가능" },
  { feature: "데이터 전송 크기", session: "단순 세션 ID 문자열만 쿠키로 전송 (작음)", jwt: "페이로드 정보가 담겨서 토큰 길이가 김 (큼)" },
  { feature: "네트워크 통신", session: "매 요청 검증 시 DB/캐시 저장소 조회 발생", jwt: "DB 조회 없이 CPU 자체 메모리 연산으로 검증" },
  { feature: "주요 사용 사례", session: "전통적 모놀리식 웹, 보안이 민감한 어플리케이션", jwt: "MSA (마이크로서비스), 모바일 앱 API, SPA 웹" },
];

type Status = "idle" | "active" | "done" | "dim";

function layerStatus(nodeId: number, activeStep: number): Status {
  if (activeStep < 0) return "idle";
  const cur = STEPS[activeStep];
  const allActive = [...(cur?.nodes.session ?? []), ...(cur?.nodes.jwt ?? [])];
  if (allActive.includes(nodeId)) return "active";

  for (let i = 0; i < activeStep; i++) {
    const s = STEPS[i];
    if ([...(s.nodes.session), ...(s.nodes.jwt)].includes(nodeId)) return "done";
  }
  return "dim";
}

function edgeStatus(srcId: number, dstId: number, activeStep: number): Status {
  if (activeStep < 0) return "idle";
  const cur = STEPS[activeStep];
  const allActive = [...(cur?.nodes.session ?? []), ...(cur?.nodes.jwt ?? [])];
  if (allActive.includes(srcId) && allActive.includes(dstId)) return "active";

  for (let i = 0; i < activeStep; i++) {
    const s = STEPS[i];
    const prev = [...s.nodes.session, ...s.nodes.jwt];
    if (prev.includes(srcId) && prev.includes(dstId)) return "done";
  }
  return "dim";
}

const NODE_BASE = "flex flex-col items-center gap-1 px-2 py-2.5 rounded-xl border-2 text-center transition-all duration-300 w-[95px] shrink-0 bg-card";
const NODE_STATUS: Record<Status, string> = {
  idle: "border-border",
  active: "border-blue-400 ring-2 ring-blue-400 ring-offset-1 dark:ring-offset-background shadow-lg shadow-blue-500/20",
  done: "border-emerald-400 bg-emerald-50/50 dark:bg-emerald-950/20",
  dim: "border-border opacity-20",
};

function StackNode({ node, activeStep }: { node: typeof SESSION_NODES[number]; activeStep: number }) {
  const s = layerStatus(node.id, activeStep);
  return (
    <motion.div
      animate={s === "active" ? { scale: [1, 1.05, 1] } : { scale: 1 }}
      transition={s === "active" ? { repeat: Infinity, duration: 1.2, ease: "easeInOut" } : {}}
      className={`${NODE_BASE} ${NODE_STATUS[s]}`}
    >
      <span className="text-xl leading-none">{node.icon}</span>
      <span className="text-[10px] font-bold leading-tight">{node.label}</span>
      <span className="text-[8px] text-muted-foreground leading-tight">{node.sub}</span>
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
    <div className="relative flex flex-col items-center h-8 shrink-0 my-0.5">
      <div className={`w-0.5 flex-1 transition-colors duration-300 ${line}`} />
      <div className={`w-0 h-0 border-l-[4px] border-r-[4px] border-t-[6px] border-transparent transition-colors duration-300 ${head}`} />
      <div className={`absolute -right-6 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full text-[9px] font-bold flex items-center justify-center transition-all duration-300 ${badge}`}>
        {stepIdx}
      </div>
    </div>
  );
}

function ArchStack({
  title, nodes, activeStep, headerColor, stepDescs,
}: {
  title: string; nodes: typeof SESSION_NODES; activeStep: number; headerColor: string; stepDescs: string[];
}) {
  const currentDesc = activeStep >= 0 && activeStep < stepDescs.length ? stepDescs[activeStep] : null;
  return (
    <div className="flex-1 min-w-0 flex flex-col items-center gap-0">
      {/* Header */}
      <div className={`w-full py-2 px-3 rounded-lg text-center text-xs font-bold text-white mb-3 ${headerColor}`}>
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
          <motion.div
            key={activeStep}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mt-3 w-full p-2.5 rounded-lg bg-muted/40 text-[10px] text-muted-foreground leading-relaxed text-center min-h-[50px]"
          >
            {currentDesc}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function JwtVsSessionViz() {
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
  const sessionDescs = STEPS.map((s) => s.sessionDesc);
  const jwtDescs = STEPS.map((s) => s.jwtDesc);

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

      {/* Side-by-side architecture stacks */}
      <div className="flex gap-4 items-start pb-2 overflow-x-auto">
        <ArchStack
          title="세션 기반 인증 (Stateful)"
          nodes={SESSION_NODES}
          activeStep={activeStep}
          headerColor="bg-blue-600"
          stepDescs={sessionDescs}
        />
        <div className="w-px bg-border self-stretch mt-10" />
        <ArchStack
          title="JWT 토큰 인증 (Stateless)"
          nodes={JWT_NODES}
          activeStep={activeStep}
          headerColor="bg-violet-600"
          stepDescs={jwtDescs}
        />
      </div>

      {/* Comparison table */}
      <div className="overflow-x-auto">
        <table className="w-full text-xs border-collapse">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left py-2 px-3 text-muted-foreground font-medium uppercase tracking-wide">항목</th>
              <th className="text-center py-2 px-3 text-blue-600 dark:text-blue-400 font-semibold">세션 기반</th>
              <th className="text-center py-2 px-3 text-violet-600 dark:text-violet-400 font-semibold">JWT 토큰</th>
            </tr>
          </thead>
          <tbody>
            {COMPARISON.map((row, i) => (
              <tr key={row.feature} className={`border-b border-border/50 ${i % 2 === 0 ? "bg-muted/20" : ""}`}>
                <td className="py-2 px-3 font-semibold text-foreground">{row.feature}</td>
                <td className="py-2 px-3 text-center text-muted-foreground leading-relaxed">{row.session}</td>
                <td className="py-2 px-3 text-center text-muted-foreground leading-relaxed">{row.jwt}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
