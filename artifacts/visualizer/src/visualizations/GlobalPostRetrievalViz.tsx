import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Pause, RotateCcw, Clock, AlertTriangle, Cpu, HardDrive, Network } from "lucide-react";

// 글로벌 게시글 조회 8단계 메타정보 (원주제인 '글로벌 게시글 조회 워크플로우' 구성요소 기반 설계)
const STEPS = [
  { 
    title: "1. 미국 사용자 -> 한국 API 서버", 
    timing: "150ms", 
    layer: "macro", 
    isBottleneck: true, 
    component: "사용자 브라우저 (미국 서부) → API 게이트웨이 (한국)", 
    desc: "태평양 횡단 해저 광케이블을 통한 대륙 간 요청 패킷 전송 왕복 지연입니다." 
  },
  { 
    title: "2. API 서버 내부 진입", 
    timing: "0.5ms", 
    layer: "infra", 
    isBottleneck: false, 
    component: "API 게이트웨이 → 백엔드 WAS 서버", 
    desc: "데이터센터 내부 VPC 스위칭 인프라를 거쳐 대상 포드 애플리케이션으로의 라우팅 시간입니다." 
  },
  { 
    title: "3. 디스크 데이터베이스 조회", 
    timing: "10ms", 
    layer: "infra", 
    isBottleneck: true, 
    component: "게시글 메타 DB (HDD)", 
    desc: "인덱싱되지 않은 게시글 메타데이터를 하드디스크 디스크 헤더가 탐색(Seek)하는 시간입니다. (SSD는 150μs)" 
  },
  { 
    title: "4. 스토리지 대용량 이미지 로드", 
    timing: "1ms", 
    layer: "infra", 
    isBottleneck: true, 
    component: "본문 이미지 스토리지 (SSD)", 
    desc: "게시글에 삽입된 1MB 크기의 이미지 바이너리를 SSD로부터 블록 단위로 순차 읽기하는 시간입니다." 
  },
  { 
    title: "5. RAM 영역 데이터 참조", 
    timing: "100ns", 
    layer: "micro", 
    isBottleneck: false, 
    component: "로그인 세션 캐시 (DRAM)", 
    desc: "사용자의 인가 토큰 세션이 활성화 상태인지 메모리(DRAM) 버스에 접근하여 검증 데이터를 참조합니다." 
  },
  { 
    title: "6. 문자열 필터링 연산", 
    timing: "7ns", 
    layer: "micro", 
    isBottleneck: false, 
    component: "비속어 텍스트 필터링 (L2 캐시)", 
    desc: "CPU 코어가 게시글 텍스트 내 비속어 매칭 루프 연산을 수행할 때 L2 캐시에 히트하여 극도로 빠르게 처리합니다." 
  },
  { 
    title: "7. 조건문 분기 처리", 
    timing: "5ns", 
    layer: "micro", 
    isBottleneck: false, 
    component: "권한 검증 분기 예측 (CPU)", 
    desc: "필터링 완료 후 어드민 권한에 따른 가시성 조건문을 처리하던 중 분기 예측에 실패해 파이프라인이 리셋됩니다." 
  },
  { 
    title: "8. 자원 경합 동기화", 
    timing: "25ns", 
    layer: "micro", 
    isBottleneck: false, 
    component: "조회수 누적 증가 뮤텍스 락", 
    desc: "동시에 들어온 여러 조회수 업데이트 스레드의 동기화를 위해 뮤텍스(Mutex) 잠금/잠금해제를 수행합니다." 
  }
];

// 우측에 노출할 파이썬 소스 코드 (원주제인 '게시글 조회 로직' 모사, 2칸 들여쓰기 준수)
const PYTHON_CODE = [
  "def get_post_details(post_id, client_location):",          // 0
  "  # 1. 대륙 간 네트워크 요청 전송 (Macro)",                   // 1
  "  req = send_request_to_korea(post_id, client_location)",  // 2
  "  ",                                                       // 3
  "  # 2. API 게이트웨이 및 서버 내부 진입 (Infra)",               // 4
  "  handler = route_to_app_server(req)",                     // 5
  "  ",                                                       // 6
  "  # 3. 디스크 데이터베이스 조회 (Infra)",                      // 7
  "  post = handler.db.query_by_id(post_id)  # 10ms HDD",     // 8
  "  ",                                                       // 9
  "  # 4. 이미지 스토리지 순차 읽기 (Infra)",                     // 10
  "  img = handler.storage.read(post.img_path)  # 1ms SSD",   // 11
  "  ",                                                       // 12
  "  # 5. 세션 검증을 위한 RAM 참조 (Micro)",                    // 13
  "  session = read_ram_memory(handler.token)  # 100ns",      // 14
  "  ",                                                       // 15
  "  # 6. L2 캐시 문자열 필터링 (Micro)",                       // 16
  "  clean_text = filter_profanity(post.content)  # L2 7ns",  // 17
  "  ",                                                       // 18
  "  # 7. 권한 분기 예측 처리 (Micro)",                          // 19
  "  if clean_text and session.role == 'admin':  # 5ns",      // 20
  "    is_visible = True",                                    // 21
  "  ",                                                       // 22
  "  # 8. 조회수 증가 뮤텍스 동기화 (Micro)",                     // 23
  "  with handler.counter_mutex:  # Lock/Unlock 25ns",        // 24
  "    handler.increment_view_count()",                       // 25
  "  ",                                                       // 26
  "  return build_response(clean_text, img)"                  // 27
];

// 각 단계 변수 및 패킷 인스펙터 매핑 정보
const STATE_MAPS = [
  {
    highlightIdxs: [1, 2],
    variables: { layer: "Macro (거시 네트워크)", latency: "150 ms", total_latency: "150 ms", bottleneck: "예", action: "태평양 RTT 패킷 왕복" },
    payload: `[HTTP GET Request Packet]\nGET /posts/123 HTTP/2\nHost: api.service.com\nUser-Agent: Client-US-West\nAuthorization: Bearer session.jwt.token`
  },
  {
    highlightIdxs: [4, 5],
    variables: { layer: "Infra (인프라/스토리지)", latency: "0.5 ms", total_latency: "150.5 ms", bottleneck: "아니오", action: "VPC 내부 포드 인입" },
    payload: `[Gateway Router Forwarding]\nForwarded: for=123.45.67.89\nX-Target-Service: backend-was-pod-7c\nRouting-Delay: 0.5ms`
  },
  {
    highlightIdxs: [7, 8],
    variables: { layer: "Infra (인프라/스토리지)", latency: "10 ms (HDD)", total_latency: "160.5 ms", bottleneck: "예", action: "SQL 질의 및 DB 블록 디스크 로드" },
    payload: `[Database Disk Page IO]\nQuery: SELECT * FROM posts WHERE id = 123;\nResponse Payload: { title: "글로벌 아키텍처", content: "...", img_path: "/cdn/assets/1.png" }\nHDD Seek Overhead: 10,000,000ns`
  },
  {
    highlightIdxs: [10, 11],
    variables: { layer: "Infra (인프라/스토리지)", latency: "1 ms", total_latency: "161.5 ms", bottleneck: "예", action: "SSD 정적 이미지 순차 로딩" },
    payload: `[Object Storage Sequent Read]\nPath: /images/global_architecture_123.png\nRead Size: 1,048,576 bytes (1MB)\nInterface: PCIe NVMe SSD\nData Transfer Delay: 1ms`
  },
  {
    highlightIdxs: [13, 14],
    variables: { layer: "Micro (CPU/메모리)", latency: "100 ns", total_latency: "161.5001 ms", bottleneck: "아니오", action: "DRAM 세션 토큰 매핑 참조" },
    payload: `[DRAM Controller Read]\nDRAM Address: 0x7FFF3B82C000\nCAS Latency: CL-14-14-14\nFetched Session: { user_id: 9948, role: "admin", expires_at: 1783383000 }`
  },
  {
    highlightIdxs: [16, 17],
    variables: { layer: "Micro (CPU/메모리)", latency: "7 ns", total_latency: "161.500100007 ms", bottleneck: "아니오", action: "비속어 매칭 CPU 연산 (L2 히트)" },
    payload: `[CPU Core Execution]\nL2 Cache Hit (Latency: 7ns)\nAssembly Inst: CMP [EBX + ESI], AX\nL1 Cache Hit 대조: L1 히트 시 0.5ns`
  },
  {
    highlightIdxs: [19, 20, 21],
    variables: { layer: "Micro (CPU/메모리)", latency: "5 ns", total_latency: "161.500100012 ms", bottleneck: "아니오", action: "조건 분기 예측 오류 복구" },
    payload: `[CPU Pipeline Control]\nBranch Predictor Unit: MISPREDICTED\nPipeline Flush Penalty: 18 cycles\nRecovery Delay: 5ns`
  },
  {
    highlightIdxs: [23, 24, 25],
    variables: { layer: "Micro (CPU/메모리)", latency: "25 ns", total_latency: "161.500100037 ms", bottleneck: "아니오", action: "Atomic CAS 기반 뮤텍스 잠금" },
    payload: `[Thread Sync Mutex]\nMutex Address: 0x00FF8E12C450\nAtomic CAS (Compare-And-Swap) operation completed\nContended thread count: 0 (Fast Path RTT: 25ns)`
  }
];

// 카메라 줌인/줌아웃을 위한 단계별 SVG viewBox
const VIEWBOXES = [
  "100 20 600 250",  // 1. 사용자 브라우저 -> API 게이트웨이 (Macro)
  "200 120 400 200", // 2. API 게이트웨이 -> WAS 서버 (Infra)
  "100 150 500 250", // 3. 게시글 메타 DB 조회 (Infra)
  "200 150 400 250", // 4. 이미지 스토리지 로드 (Infra)
  "300 150 500 250", // 5. 사용자 세션 캐시 조회 (Infra)
  "100 350 500 250", // 6. 비속어 필터링 L2 캐시 연산 (Micro)
  "200 350 400 250", // 7. 권한 검증 분기 (Micro)
  "300 350 500 250", // 8. 조회수 뮤텍스 락 (Micro)
];

export default function GlobalPostRetrievalViz() {
  const [activeStep, setActiveStep] = useState(0); // 0단계 시작
  const [isPlaying, setIsPlaying] = useState(true); // 자동 실행
  const [speed, setSpeed] = useState(1.5); // 컴포넌트 재생 속도 기본 배속
  const total = STEPS.length;
  const isComplete = activeStep >= total - 1;
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // 배속 설정에 따른 단계별 기본 지연시간 (단위: ms)
  const getStepDuration = useCallback((step: number) => {
    const baseDuration = step === 0 ? 4500 : step === 2 ? 4000 : 3500;
    return baseDuration / speed;
  }, [speed]);

  const tick = useCallback(() => {
    setActiveStep((current) => {
      if (current >= total - 1) {
        timerRef.current = setTimeout(tick, getStepDuration(0));
        return 0;
      }
      const nextStep = current + 1;
      timerRef.current = setTimeout(tick, getStepDuration(nextStep));
      return nextStep;
    });
  }, [total, getStepDuration]);

  // 재생 및 타이머 제어
  useEffect(() => {
    if (isPlaying) {
      if (activeStep >= total - 1) {
        timerRef.current = setTimeout(tick, getStepDuration(total - 1));
      } else {
        const nextStep = activeStep === -1 ? 0 : activeStep;
        if (activeStep === -1) setActiveStep(0);
        timerRef.current = setTimeout(tick, getStepDuration(nextStep));
      }
    } else {
      if (timerRef.current) clearTimeout(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [isPlaying, activeStep, tick, total, getStepDuration]);

  const handlePlay = useCallback(() => {
    if (isComplete) {
      setActiveStep(0);
      setIsPlaying(true);
    } else {
      setIsPlaying((p) => !p);
    }
  }, [isComplete]);

  const handleReset = useCallback(() => {
    setIsPlaying(false);
    setActiveStep(0);
  }, []);

  const progress = ((activeStep + 1) / total) * 100;

  return (
    <div className="space-y-6">
      {/* 2열 레이아웃: 좌측 7열 (시뮬레이터 + 컨트롤 UI), 우측 5열 (코드 트레이서 + 인스펙터) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* 좌측 7열 */}
        <div className="lg:col-span-7 space-y-4">
          
          {/* 최소화된 미니멀 컨트롤러 */}
          <div className="flex items-center gap-3 p-2 bg-muted/15 border border-border/30 rounded-xl">
            <button
              onClick={handlePlay}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground hover:opacity-90 text-xs font-semibold transition-opacity"
            >
              {isPlaying ? <Pause size={12} /> : <Play size={12} />}
              {isComplete ? "루프 재개" : isPlaying ? "정지" : "시작"}
            </button>
            <button
              onClick={handleReset}
              className="p-1.5 rounded-lg border border-border bg-card hover:bg-muted text-muted-foreground transition-colors"
              aria-label="초기화"
            >
              <RotateCcw size={12} />
            </button>

            <div className="h-4 w-px bg-border/40" />

            {/* 배속 조절 컴팩트 칩스 */}
            <div className="flex items-center gap-1 text-xs">
              <span className="text-muted-foreground mr-1">배속:</span>
              {[1, 1.5, 2, 3].map((val) => (
                <button
                  key={val}
                  onClick={() => setSpeed(val)}
                  className={`px-2 py-0.5 rounded font-mono text-[11px] border transition-colors ${
                    speed === val
                      ? "bg-primary text-primary-foreground border-primary font-bold"
                      : "bg-card text-muted-foreground border-border hover:bg-muted"
                  }`}
                >
                  {val}x
                </button>
              ))}
            </div>

            {/* 컴팩트 진행 알림 */}
            <span className="ml-auto text-[11px] font-medium text-muted-foreground/80 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              자동 진행 중
            </span>
          </div>

          {/* 진행도 정보 및 프로그레스 바 */}
          <div className="space-y-1.5 px-1">
            <div className="flex justify-between text-xs sm:text-sm">
              <span className="text-foreground font-semibold flex items-center gap-1.5">
                <span className="px-1.5 py-0.5 bg-primary/10 text-primary rounded text-xs font-mono">Step {activeStep + 1}</span>
                {STEPS[activeStep].title}
              </span>
              <span className="flex items-center gap-1 text-muted-foreground font-mono">
                <Clock size={11} /> {STEPS[activeStep].timing}
              </span>
            </div>
            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-primary rounded-full"
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
          </div>

          {/* 실시간 상태 추적 HUD (Variables HUD) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {([
              ["계층 (Layer)", STATE_MAPS[activeStep].variables.layer, false],
              ["단계 지연 (Latency)", STATE_MAPS[activeStep].variables.latency, STEPS[activeStep].isBottleneck],
              ["누적 지연 (Cumulative)", STATE_MAPS[activeStep].variables.total_latency, false],
              ["병목 구간 (Bottleneck)", STATE_MAPS[activeStep].variables.bottleneck, STEPS[activeStep].isBottleneck],
            ] as const).map(([label, val, highlight]) => (
              <div
                key={label}
                className={`p-2.5 rounded-xl border font-mono text-center transition-colors ${
                  highlight
                    ? "bg-red-500/10 border-red-500/30 text-red-500 dark:bg-red-500/5 dark:border-red-500/20"
                    : "bg-muted/30 border-border/30 text-muted-foreground"
                }`}
              >
                <div className="text-[10px] text-muted-foreground/80 uppercase font-semibold mb-1">{label}</div>
                <div className="text-xs sm:text-sm font-bold flex items-center justify-center gap-1">
                  {highlight && <AlertTriangle size={12} className="text-red-500 flex-shrink-0" />}
                  <span className={highlight ? "text-red-500" : "text-foreground"}>{String(val)}</span>
                </div>
              </div>
            ))}
          </div>

          {/* 시각화 그래프/차트 영역 (Visual Canvas Area - 글로벌 게시글 조회 흐름 최적화) */}
          <div className="relative border border-slate-200 dark:border-zinc-800 rounded-2xl bg-slate-50 dark:bg-zinc-950 overflow-hidden flex justify-center py-4">
            <motion.svg
              viewBox="0 0 800 600"
              className="w-full h-auto select-none max-h-[480px]"
              xmlns="http://www.w3.org/2000/svg"
              animate={{ viewBox: VIEWBOXES[activeStep] }}
              transition={{ duration: 1.0, ease: "easeInOut" }}
              style={{ aspectRatio: "400 / 300" }}
            >
              <defs>
                {/* 글로우 필터 */}
                <filter id="glow-cyan" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="3.5" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
                <filter id="glow-red" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="3.5" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
                <filter id="glow-green" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="3.5" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>

              {/* ── 연결 경로 백그라운드 (비즈니스 흐름 기준 스포트라이트 및 단선 오류 방지) ── */}
              <g stroke="currentColor" strokeWidth="2" fill="none" className="text-slate-300 dark:text-zinc-800">
                {/* 1단계 연결선: 사용자 브라우저 -> API 게이트웨이 */}
                <path
                  d="M 400 70 L 400 180"
                  strokeDasharray={activeStep === 0 ? "5, 5" : "none"}
                  className={`transition-colors duration-300 ${activeStep === 0 ? "text-blue-600 dark:text-sky-400" : ""}`}
                  strokeWidth={activeStep === 0 ? 3 : 2}
                />

                {/* 2단계 연결선: API 게이트웨이 내부 인입 (이전 버전의 단선 버그 해결) */}
                <path
                  d="M 400 180 L 400 230"
                  className={`transition-colors duration-300 ${activeStep === 1 ? "text-blue-600 dark:text-sky-400" : ""}`}
                  strokeWidth={activeStep === 1 ? 3 : 2}
                />

                {/* 데이터 I/O 연결선 (3~5단계) */}
                <path
                  d="M 400 230 L 250 300"
                  className={`transition-colors duration-300 ${activeStep === 2 ? "text-red-600 dark:text-red-500" : ""}`}
                  strokeWidth={activeStep === 2 ? 3 : 2}
                />
                <path
                  d="M 400 230 L 400 300"
                  className={`transition-colors duration-300 ${activeStep === 3 ? "text-red-600 dark:text-red-500" : ""}`}
                  strokeWidth={activeStep === 3 ? 3 : 2}
                />
                <path
                  d="M 400 230 L 550 300"
                  className={`transition-colors duration-300 ${activeStep === 4 ? "text-emerald-600 dark:text-emerald-400" : ""}`}
                  strokeWidth={activeStep === 4 ? 3 : 2}
                />

                {/* WAS 내부 코어로의 데이터 인입 연결선 (5단계 이후 동작) */}
                <path
                  d="M 400 300 L 400 420"
                  className={`transition-colors duration-300 ${activeStep >= 5 ? "text-emerald-600 dark:text-emerald-400" : ""}`}
                  strokeWidth={activeStep >= 5 ? 3 : 2}
                />

                {/* CPU Core 내 연산 연결선 (6~8단계) */}
                <path
                  d="M 400 420 L 250 520"
                  className={`transition-colors duration-300 ${activeStep === 5 ? "text-emerald-600 dark:text-emerald-400" : ""}`}
                  strokeWidth={activeStep === 5 ? 3 : 2}
                />
                <path
                  d="M 400 420 L 400 520"
                  className={`transition-colors duration-300 ${activeStep === 6 ? "text-emerald-600 dark:text-emerald-400" : ""}`}
                  strokeWidth={activeStep === 6 ? 3 : 2}
                />
                <path
                  d="M 400 420 L 550 520"
                  className={`transition-colors duration-300 ${activeStep === 7 ? "text-emerald-600 dark:text-emerald-400" : ""}`}
                  strokeWidth={activeStep === 7 ? 3 : 2}
                />
              </g>

              {/* ── 노드 그룹 렌더링 (원주제인 '글로벌 게시글 조회' 명세 반영) ── */}
              
              {/* 1. 사용자 브라우저 Node */}
              <g transform="translate(400, 70)">
                <rect
                  x="-70"
                  y="-22"
                  width="140"
                  height="44"
                  rx="8"
                  fill="white"
                  className={`dark:fill-zinc-900 transition-colors duration-300 ${
                    activeStep === 0
                      ? "text-blue-600 dark:text-sky-400"
                      : "text-slate-300 dark:text-zinc-700"
                  }`}
                  stroke="currentColor"
                  strokeWidth={activeStep === 0 ? 3.5 : 2}
                />
                <text x="-48" y="5" textAnchor="middle" fontSize="16" fontWeight="bold">💻</text>
                <text x="12" y="4" textAnchor="middle" className="fill-slate-800 dark:fill-slate-100 font-bold" fontSize="10">브라우저 (미국서부)</text>
              </g>

              {/* 2. KR API Gateway Node */}
              <g transform="translate(400, 180)">
                <rect
                  x="-70"
                  y="-24"
                  width="140"
                  height="48"
                  rx="8"
                  fill="white"
                  className={`dark:fill-zinc-900 transition-colors duration-300 ${
                    activeStep === 1
                      ? "text-blue-600 dark:text-sky-400"
                      : "text-slate-300 dark:text-zinc-700"
                  }`}
                  stroke="currentColor"
                  strokeWidth={activeStep === 1 ? 3.5 : 2}
                />
                <text x="-48" y="5" textAnchor="middle" fontSize="16">🖥️</text>
                <text x="12" y="4" textAnchor="middle" className="fill-slate-800 dark:fill-slate-100 font-bold" fontSize="10">API 게이트웨이 (한국)</text>
              </g>

              {/* 3. Disk DB Node (HDD) - 게시글 메타 조회 */}
              <g transform="translate(250, 300)">
                <rect
                  x="-70"
                  y="-22"
                  width="140"
                  height="44"
                  rx="8"
                  fill="white"
                  className={`dark:fill-zinc-900 transition-colors duration-300 ${
                    activeStep === 2
                      ? "text-red-600 dark:text-red-500"
                      : "text-slate-300 dark:text-zinc-700"
                  }`}
                  stroke="currentColor"
                  strokeWidth={activeStep === 2 ? 3.5 : 2}
                />
                <text x="-48" y="5" textAnchor="middle" fontSize="16">💾</text>
                <text x="12" y="4" textAnchor="middle" className="fill-slate-800 dark:fill-slate-100 font-bold" fontSize="9">게시글 메타 DB (HDD)</text>
              </g>

              {/* 4. SSD Image Storage Node - 본문 이미지 로드 */}
              <g transform="translate(400, 300)">
                <rect
                  x="-70"
                  y="-22"
                  width="140"
                  height="44"
                  rx="8"
                  fill="white"
                  className={`dark:fill-zinc-900 transition-colors duration-300 ${
                    activeStep === 3
                      ? "text-red-600 dark:text-red-500"
                      : "text-slate-300 dark:text-zinc-700"
                  }`}
                  stroke="currentColor"
                  strokeWidth={activeStep === 3 ? 3.5 : 2}
                />
                <text x="-48" y="5" textAnchor="middle" fontSize="16">🖼️</text>
                <text x="12" y="4" textAnchor="middle" className="fill-slate-800 dark:fill-slate-100 font-bold" fontSize="9">이미지 스토리지 (SSD)</text>
              </g>

              {/* 5. User Session RAM Cache Node - 세션 데이터 참조 */}
              <g transform="translate(550, 300)">
                <rect
                  x="-70"
                  y="-22"
                  width="140"
                  height="44"
                  rx="8"
                  fill="white"
                  className={`dark:fill-zinc-900 transition-colors duration-300 ${
                    activeStep === 4
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-slate-300 dark:text-zinc-700"
                  }`}
                  stroke="currentColor"
                  strokeWidth={activeStep === 4 ? 3.5 : 2}
                />
                <text x="-48" y="5" textAnchor="middle" fontSize="16">🧠</text>
                <text x="12" y="4" textAnchor="middle" className="fill-slate-800 dark:fill-slate-100 font-bold" fontSize="9">사용자 세션 캐시 (RAM)</text>
              </g>

              {/* 6. Application WAS CPU Core Node */}
              <g transform="translate(400, 420)">
                <rect
                  x="-75"
                  y="-24"
                  width="150"
                  height="48"
                  rx="8"
                  fill="white"
                  className={`dark:fill-zinc-900 transition-colors duration-300 ${
                    activeStep >= 5
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-slate-300 dark:text-zinc-700"
                  }`}
                  stroke="currentColor"
                  strokeWidth={activeStep >= 5 ? 3.5 : 2}
                />
                <text x="-50" y="6" textAnchor="middle" fontSize="16">⚙️</text>
                <text x="12" y="4" textAnchor="middle" className="fill-slate-800 dark:fill-slate-100 font-bold" fontSize="10">백엔드 WAS 코어 CPU</text>
              </g>

              {/* 7. L2 Cache (비속어 필터링) */}
              <g transform="translate(250, 520)">
                <rect
                  x="-70"
                  y="-22"
                  width="140"
                  height="44"
                  rx="8"
                  fill="white"
                  className={`dark:fill-zinc-900 transition-colors duration-300 ${
                    activeStep === 5
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-slate-300 dark:text-zinc-700"
                  }`}
                  stroke="currentColor"
                  strokeWidth={activeStep === 5 ? 3.5 : 2}
                />
                <text x="-48" y="5" textAnchor="middle" fontSize="16">⚡</text>
                <text x="12" y="4" textAnchor="middle" className="fill-slate-800 dark:fill-slate-100 font-bold" fontSize="9">비속어 필터링 (L2캐시)</text>
              </g>

              {/* 8. Branch Pred (권한 검증 분기) */}
              <g transform="translate(400, 520)">
                <rect
                  x="-70"
                  y="-22"
                  width="140"
                  height="44"
                  rx="8"
                  fill="white"
                  className={`dark:fill-zinc-900 transition-colors duration-300 ${
                    activeStep === 6
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-slate-300 dark:text-zinc-700"
                  }`}
                  stroke="currentColor"
                  strokeWidth={activeStep === 6 ? 3.5 : 2}
                />
                <text x="-48" y="5" textAnchor="middle" fontSize="16">🎯</text>
                <text x="12" y="4" textAnchor="middle" className="fill-slate-800 dark:fill-slate-100 font-bold" fontSize="9">권한 검증 분기 (CPU)</text>
              </g>

              {/* 9. Mutex Lock (조회수 잠금) */}
              <g transform="translate(550, 520)">
                <rect
                  x="-70"
                  y="-22"
                  width="140"
                  height="44"
                  rx="8"
                  fill="white"
                  className={`dark:fill-zinc-900 transition-colors duration-300 ${
                    activeStep === 7
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-slate-300 dark:text-zinc-700"
                  }`}
                  stroke="currentColor"
                  strokeWidth={activeStep === 7 ? 3.5 : 2}
                />
                <text x="-48" y="5" textAnchor="middle" fontSize="16">🔒</text>
                <text x="12" y="4" textAnchor="middle" className="fill-slate-800 dark:fill-slate-100 font-bold" fontSize="9">조회수 뮤텍스 락</text>
              </g>

              {/* ── 고대비 말풍선 패킷 이동 애니메이션 (가독성 개선 및 상세 의미 묘사) ── */}
              <AnimatePresence>
                {activeStep === 0 && (
                  <g key="packet-step-1">
                    <motion.circle
                      cx="400" cy="70" r="6" className="text-blue-600 dark:text-sky-400 fill-current" filter="url(#glow-cyan)"
                      animate={{ cy: [70, 180] }}
                      transition={{ duration: 2.0 / speed, ease: "linear" }}
                    />
                    <motion.g
                      animate={{ x: [400, 400], y: [70, 180] }}
                      transition={{ duration: 2.0 / speed, ease: "linear" }}
                    >
                      {/* 고대비 테마에 맞추어 밝은 파랑 배경에 굵은 흰색 글씨 적용 */}
                      <rect x="15" y="-12" width="165" height="24" rx="6" className="fill-blue-600 dark:fill-sky-500 stroke-blue-700 dark:stroke-sky-300" strokeWidth="1.5" />
                      <text x="97.5" y="3.5" textAnchor="middle" fill="#FFFFFF" fontSize="8.5" fontWeight="black" fontFamily="sans-serif">브라우저 요청 (게시글 상세 ID: 123)</text>
                    </motion.g>
                  </g>
                )}

                {activeStep === 1 && (
                  <g key="packet-step-2">
                    <motion.circle
                      cx="400" cy="180" r="6" className="text-blue-600 dark:text-sky-400 fill-current" filter="url(#glow-cyan)"
                      animate={{ cy: [180, 230] }}
                      transition={{ duration: 1.0 / speed, ease: "easeOut" }}
                    />
                    <motion.g
                      animate={{ x: [400, 400], y: [180, 230] }}
                      transition={{ duration: 1.0 / speed, ease: "easeOut" }}
                    >
                      <rect x="15" y="-12" width="135" height="24" rx="6" className="fill-blue-600 dark:fill-sky-500 stroke-blue-700 dark:stroke-sky-300" strokeWidth="1.5" />
                      <text x="82.5" y="3.5" textAnchor="middle" fill="#FFFFFF" fontSize="8.5" fontWeight="black" fontFamily="sans-serif">API 게이트웨이 내부 라우팅</text>
                    </motion.g>
                  </g>
                )}

                {activeStep === 2 && (
                  <g key="packet-step-3">
                    <motion.circle
                      cx="400" cy="230" r="6" className="text-red-600 dark:text-red-500 fill-current" filter="url(#glow-red)"
                      animate={{ cx: [400, 250], cy: [230, 300] }}
                      transition={{ duration: 1.5 / speed, ease: "easeInOut" }}
                    />
                    <motion.g
                      animate={{ x: [400, 250], y: [230, 300] }}
                      transition={{ duration: 1.5 / speed, ease: "easeInOut" }}
                    >
                      <rect x="-180" y="-12" width="165" height="24" rx="6" className="fill-red-600 dark:fill-red-500 stroke-red-700 dark:stroke-red-400" strokeWidth="1.5" />
                      <text x="-97.5" y="3.5" textAnchor="middle" fill="#FFFFFF" fontSize="8.5" fontWeight="black" fontFamily="sans-serif">게시글 메타 데이터베이스 조회 (HDD)</text>
                    </motion.g>
                  </g>
                )}

                {activeStep === 3 && (
                  <g key="packet-step-4">
                    <motion.circle
                      cx="400" cy="230" r="6" className="text-red-600 dark:text-red-500 fill-current" filter="url(#glow-red)"
                      animate={{ cy: [230, 300] }}
                      transition={{ duration: 1.2 / speed, ease: "easeInOut" }}
                    />
                    <motion.g
                      animate={{ x: [400, 400], y: [230, 300] }}
                      transition={{ duration: 1.2 / speed, ease: "easeInOut" }}
                    >
                      <rect x="15" y="-12" width="155" height="24" rx="6" className="fill-red-600 dark:fill-red-500 stroke-red-700 dark:stroke-red-400" strokeWidth="1.5" />
                      <text x="92.5" y="3.5" textAnchor="middle" fill="#FFFFFF" fontSize="8.5" fontWeight="black" fontFamily="sans-serif">본문 대용량 이미지 버퍼 로딩 (SSD)</text>
                    </motion.g>
                  </g>
                )}

                {activeStep === 4 && (
                  <g key="packet-step-5">
                    <motion.circle
                      cx="400" cy="230" r="6" className="text-emerald-600 dark:text-emerald-400 fill-current" filter="url(#glow-green)"
                      animate={{ cx: [400, 550], cy: [230, 300] }}
                      transition={{ duration: 1.2 / speed, ease: "easeInOut" }}
                    />
                    <motion.g
                      animate={{ x: [400, 550], y: [230, 300] }}
                      transition={{ duration: 1.2 / speed, ease: "easeInOut" }}
                    >
                      <rect x="15" y="-12" width="165" height="24" rx="6" className="fill-emerald-600 dark:fill-emerald-500 stroke-emerald-700 dark:stroke-emerald-400" strokeWidth="1.5" />
                      <text x="97.5" y="3.5" textAnchor="middle" fill="#FFFFFF" fontSize="8.5" fontWeight="black" fontFamily="sans-serif">사용자 로그인 세션 정보 참조 (DRAM)</text>
                    </motion.g>
                  </g>
                )}

                {activeStep === 5 && (
                  <g key="packet-step-6">
                    <motion.circle
                      cx="400" cy="420" r="6" className="text-emerald-600 dark:text-emerald-400 fill-current" filter="url(#glow-green)"
                      animate={{ cx: [400, 250], cy: [420, 520] }}
                      transition={{ duration: 1.0 / speed, ease: "easeInOut" }}
                    />
                    <motion.g
                      animate={{ x: [400, 250], y: [420, 520] }}
                      transition={{ duration: 1.0 / speed, ease: "easeInOut" }}
                    >
                      <rect x="-180" y="-12" width="165" height="24" rx="6" className="fill-emerald-600 dark:fill-emerald-500 stroke-emerald-700 dark:stroke-emerald-400" strokeWidth="1.5" />
                      <text x="-97.5" y="3.5" textAnchor="middle" fill="#FFFFFF" fontSize="8.5" fontWeight="black" fontFamily="sans-serif">게시글 본문 비속어 필터링 (L2캐시)</text>
                    </motion.g>
                  </g>
                )}

                {activeStep === 6 && (
                  <g key="packet-step-7">
                    <motion.circle
                      cx="400" cy="420" r="6" className="text-emerald-600 dark:text-emerald-400 fill-current" filter="url(#glow-green)"
                      animate={{ cy: [420, 520] }}
                      transition={{ duration: 1.0 / speed, ease: "easeInOut" }}
                    />
                    <motion.g
                      animate={{ x: [400, 400], y: [420, 520] }}
                      transition={{ duration: 1.0 / speed, ease: "easeInOut" }}
                    >
                      <rect x="15" y="-12" width="155" height="24" rx="6" className="fill-emerald-600 dark:fill-emerald-500 stroke-emerald-700 dark:stroke-emerald-400" strokeWidth="1.5" />
                      <text x="92.5" y="3.5" textAnchor="middle" fill="#FFFFFF" fontSize="8.5" fontWeight="black" fontFamily="sans-serif">사용자 권한 검증 분기 예측 (CPU)</text>
                    </motion.g>
                  </g>
                )}

                {activeStep === 7 && (
                  <g key="packet-step-8">
                    <motion.circle
                      cx="400" cy="420" r="6" className="text-emerald-600 dark:text-emerald-400 fill-current" filter="url(#glow-green)"
                      animate={{ cx: [400, 550], cy: [420, 520] }}
                      transition={{ duration: 1.0 / speed, ease: "easeInOut" }}
                    />
                    <motion.g
                      animate={{ x: [400, 550], y: [420, 520] }}
                      transition={{ duration: 1.0 / speed, ease: "easeInOut" }}
                    >
                      <rect x="15" y="-12" width="155" height="24" rx="6" className="fill-emerald-600 dark:fill-emerald-500 stroke-emerald-700 dark:stroke-emerald-400" strokeWidth="1.5" />
                      <text x="92.5" y="3.5" textAnchor="middle" fill="#FFFFFF" fontSize="8.5" fontWeight="black" fontFamily="sans-serif">게시글 조회수 누적 뮤텍스 락 획득</text>
                    </motion.g>
                  </g>
                )}
              </AnimatePresence>
            </motion.svg>
          </div>

          {/* 변수 정보 상태 검사기 (State Inspector) - 시각화 다이어그램 영역 아래로 배치 */}
          <div className="p-4 rounded-2xl bg-muted/30 border border-border font-mono text-xs">
            <div className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider mb-2.5">🔍 State Inspector</div>
            {STATE_MAPS[activeStep] ? (
              <div className="grid grid-cols-1 gap-y-1.5">
                {Object.entries(STATE_MAPS[activeStep].variables).map(([key, val]) => (
                  <div key={key} className="flex justify-between border-b border-border/20 pb-1">
                    <span className="text-muted-foreground uppercase text-[10px] font-bold">{key}</span>
                    <span className="text-foreground font-semibold">{String(val)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <span className="text-muted-foreground/60 italic text-center block py-4">대기 중...</span>
            )}
          </div>

        </div>

        {/* 우측 5열 */}
        <div className="lg:col-span-5 flex flex-col justify-between space-y-4">
          
          {/* 파이썬 실행 추적 모니터 */}
          <div className="p-4 rounded-2xl bg-card border border-card-border font-mono text-xs overflow-x-auto space-y-1">
            <div className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider mb-2">💻 Python Tracer</div>
            {PYTHON_CODE.map((line, idx) => {
              const currentMap = STATE_MAPS[activeStep];
              const isHighlighted = currentMap?.highlightIdxs.includes(idx);
              return (
                <div
                  key={idx}
                  className={`px-2 py-0.5 rounded transition-all duration-300 ${
                    isHighlighted 
                      ? "bg-primary/20 text-primary font-bold border-l-4 border-primary -ml-2" 
                      : "text-muted-foreground opacity-60"
                  }`}
                >
                  <span className="inline-block w-4 text-[10px] text-muted-foreground/45 mr-2">{idx + 1}</span>
                  {line}
                </div>
              );
            })}
          </div>

          {/* 페이로드 및 패킷 원본 검사기 (Payload Inspector) - 데이터 부분 회색 배경 제거 */}
          <div className="p-4 rounded-2xl bg-muted/40 border border-border font-mono text-xs flex-1">
            <div className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider mb-2">📦 Payload / Packet Inspector</div>
            {STATE_MAPS[activeStep] ? (
              <pre className="text-[11px] text-foreground/90 bg-transparent p-3 rounded-lg border border-border/40 overflow-x-auto whitespace-pre-wrap leading-relaxed h-32">
                {STATE_MAPS[activeStep].payload}
              </pre>
            ) : (
              <span className="text-muted-foreground/60 italic text-center block py-4">대기 중...</span>
            )}
          </div>

        </div>

      </div>

      {/* 글로벌 게시글 조회 워크플로우 지표 요약 표 */}
      <div className="border border-border/60 rounded-2xl p-5 bg-card text-card-foreground shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <Network size={16} className="text-primary" />
          <h3 className="text-sm sm:text-base font-bold text-foreground">글로벌 게시글 조회 워크플로우 레이턴시 지표 요약</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs sm:text-sm text-left border-collapse">
            <thead>
              <tr className="border-b border-border text-muted-foreground font-semibold">
                <th className="py-2.5 px-3">단계</th>
                <th className="py-2.5 px-3">계층</th>
                <th className="py-2.5 px-3">아키텍처 구성요소</th>
                <th className="py-2.5 px-3">지연시간</th>
                <th className="py-2.5 px-3">상세 설명</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40 font-mono">
              {STEPS.map((step, idx) => (
                <tr
                  key={idx}
                  className={`transition-colors duration-200 ${
                    activeStep === idx 
                      ? "bg-primary/5 font-semibold text-foreground border-l-2 border-primary" 
                      : "text-muted-foreground hover:bg-muted/10"
                  }`}
                >
                  <td className="py-2.5 px-3 font-semibold">{idx + 1}</td>
                  <td className="py-2.5 px-3 uppercase text-[10px] font-bold">
                    <span className={`px-2 py-0.5 rounded-full ${
                      step.layer === "macro" 
                        ? "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
                        : step.layer === "infra"
                        ? "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400"
                        : "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400"
                    }`}>
                      {step.layer}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-foreground font-sans">{step.component}</td>
                  <td className={`py-2.5 px-3 font-bold ${step.isBottleneck ? "text-red-500 flex items-center gap-1" : "text-foreground"}`}>
                    {step.isBottleneck && <AlertTriangle size={11} className="text-red-500 flex-shrink-0" />}
                    {step.timing}
                  </td>
                  <td className="py-2.5 px-3 font-sans text-xs sm:text-sm text-muted-foreground/90">{step.desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
