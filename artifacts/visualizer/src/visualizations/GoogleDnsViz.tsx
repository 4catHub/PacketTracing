import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Pause, ChevronLeft, ChevronRight, RotateCcw, CheckCircle, Clock } from "lucide-react";

interface Step {
  id: number;
  actor: string;
  actorColor: string;
  title: string;
  shortDesc: string;
  detail: string;
  timing: string;
}

const STEPS: Step[] = [
  {
    id: 0,
    actor: "Browser",
    actorColor: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
    title: "Browser DNS Cache 확인",
    shortDesc: "브라우저 내부 캐시에서 IP 주소를 검색합니다",
    detail:
      "브라우저는 자체 DNS 캐시를 가장 먼저 확인합니다. 이전에 방문한 도메인의 경우 TTL(Time-To-Live)이 만료되지 않았다면 바로 IP 주소를 반환합니다. Chrome에서는 chrome://net-internals/#dns에서 현재 캐시 상태를 볼 수 있습니다.",
    timing: "< 1ms",
  },
  {
    id: 1,
    actor: "OS",
    actorColor: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300",
    title: "OS DNS Cache & hosts 파일 확인",
    shortDesc: "운영체제 캐시와 로컬 hosts 파일을 조회합니다",
    detail:
      "브라우저 캐시에 없으면 운영체제의 DNS Resolver Cache를 확인합니다. 그 전에 /etc/hosts(Linux/Mac) 또는 C:\\Windows\\System32\\drivers\\etc\\hosts(Windows) 파일도 먼저 참조됩니다. 이 파일에 도메인이 있으면 DNS 조회 없이 해당 IP를 사용합니다.",
    timing: "~1ms",
  },
  {
    id: 2,
    actor: "DNS Resolver",
    actorColor: "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300",
    title: "재귀 DNS Resolver 질의",
    shortDesc: "ISP 또는 기업의 재귀 DNS 서버에 질의를 보냅니다",
    detail:
      "로컬 캐시에도 없으면 운영체제는 설정된 DNS Resolver(보통 ISP의 서버 또는 8.8.8.8 같은 공개 DNS)에 질의합니다. 이 재귀 Resolver는 최종 IP를 찾을 때까지 DNS 계층을 대신 탐색해주는 역할을 합니다.",
    timing: "~10-20ms",
  },
  {
    id: 3,
    actor: "Root NS",
    actorColor: "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300",
    title: "Root Nameserver 질의",
    shortDesc: "DNS 계층의 최상위 루트 서버에서 TLD 서버 정보를 얻습니다",
    detail:
      "재귀 Resolver가 캐시에 없으면 루트 Nameserver(a.root-servers.net 등 13개 클러스터)에 질의합니다. 루트 서버는 최종 IP를 모르지만 '.com' TLD를 담당하는 Nameserver의 주소를 반환합니다. 전 세계에 수백 개의 애니캐스트 노드로 운영됩니다.",
    timing: "~20-40ms",
  },
  {
    id: 4,
    actor: "TLD NS",
    actorColor: "bg-fuchsia-100 text-fuchsia-700 dark:bg-fuchsia-900/40 dark:text-fuchsia-300",
    title: "TLD Nameserver 질의",
    shortDesc: ".com 도메인을 관리하는 TLD 서버에서 권한 있는 NS 주소를 받습니다",
    detail:
      ".com TLD Nameserver(Verisign 운영)는 google.com의 Authoritative Nameserver 주소(예: ns1.google.com)를 반환합니다. 각 TLD(.kr, .org 등)마다 별도의 Nameserver 집합이 존재합니다.",
    timing: "~30-50ms",
  },
  {
    id: 5,
    actor: "Auth NS",
    actorColor: "bg-pink-100 text-pink-700 dark:bg-pink-900/40 dark:text-pink-300",
    title: "Authoritative Nameserver 질의",
    shortDesc: "google.com의 공식 DNS 서버에서 최종 IP 주소를 받습니다",
    detail:
      "구글이 직접 운영하는 Authoritative Nameserver(ns1~ns4.google.com)에 질의하면 google.com의 실제 IP 주소(예: 142.250.196.36)와 TTL 값을 반환합니다. 이 결과는 각 단계의 Resolver에 캐시됩니다.",
    timing: "~40-60ms",
  },
  {
    id: 6,
    actor: "Browser",
    actorColor: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
    title: "IP 주소 수신 완료",
    shortDesc: "브라우저가 최종 IP 주소를 받아 TCP 연결을 시작합니다",
    detail:
      "재귀 Resolver가 IP 주소(예: 142.250.196.36)를 브라우저에 전달합니다. 브라우저는 이 IP를 캐시하고, 이제 실제 HTTP 통신을 위한 TCP 연결 과정을 시작합니다. DNS 조회가 완료되었습니다.",
    timing: "~0ms (수신)",
  },
  {
    id: 7,
    actor: "Network",
    actorColor: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-300",
    title: "TCP 3-way Handshake",
    shortDesc: "브라우저와 구글 서버 간 신뢰할 수 있는 TCP 연결을 수립합니다",
    detail:
      "1) 브라우저 → 서버: SYN (연결 요청)\n2) 서버 → 브라우저: SYN-ACK (요청 수락)\n3) 브라우저 → 서버: ACK (확인)\n이 세 단계를 거쳐 신뢰성 있는 양방향 통신 채널이 열립니다. 포트 443(HTTPS)으로 연결됩니다.",
    timing: "1 RTT",
  },
  {
    id: 8,
    actor: "Network",
    actorColor: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-300",
    title: "TLS Handshake (HTTPS)",
    shortDesc: "암호화 통신을 위한 TLS 세션을 협상합니다",
    detail:
      "TCP 연결 위에 TLS 1.3을 협상합니다. ClientHello → ServerHello + 인증서 → 키 교환 → Finished 과정을 거칩니다. TLS 1.3은 1-RTT(또는 0-RTT 재연결)로 이전 버전보다 빠릅니다. 이후 모든 통신은 대칭키로 암호화됩니다.",
    timing: "1 RTT (TLS 1.3)",
  },
  {
    id: 9,
    actor: "Browser",
    actorColor: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
    title: "HTTP GET 요청 전송",
    shortDesc: "브라우저가 서버에 웹 페이지를 요청합니다",
    detail:
      "브라우저는 HTTP/2 GET 요청을 전송합니다:\nGET / HTTP/2\nHost: www.google.com\nUser-Agent: Chrome/...\nAccept: text/html,...\nAccept-Encoding: gzip, deflate, br\n\n요청 헤더에는 쿠키, 언어 설정 등 다양한 메타데이터가 포함됩니다.",
    timing: "~1-5ms",
  },
  {
    id: 10,
    actor: "Server",
    actorColor: "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300",
    title: "서버 응답 수신",
    shortDesc: "구글 서버가 HTML, CSS, JS 등 리소스를 응답합니다",
    detail:
      "구글의 로드 밸런서와 웹 서버(GWS)가 요청을 처리하여 HTTP 200 OK 응답을 반환합니다. 응답에는 HTML 문서와 함께 CSS, JavaScript 파일 등의 참조가 포함됩니다. HTTP/2의 서버 푸시로 추가 리소스를 미리 전송하기도 합니다.",
    timing: "~20-100ms",
  },
  {
    id: 11,
    actor: "Browser",
    actorColor: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
    title: "HTML 파싱 및 페이지 렌더링",
    shortDesc: "브라우저가 HTML을 파싱하고 DOM, CSSOM을 구성하여 화면에 표시합니다",
    detail:
      "브라우저는 수신한 HTML을 파싱하여 DOM(Document Object Model) 트리를 구성합니다. 동시에 CSS를 파싱하여 CSSOM을 만들고, 이 둘을 결합하여 Render Tree를 생성합니다. Layout → Paint → Composite 과정을 거쳐 최종적으로 화면에 픽셀이 그려집니다(First Contentful Paint).",
    timing: "~50-500ms",
  },
];

export default function GoogleDnsViz() {
  const [activeStep, setActiveStep] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(false);

  const isComplete = activeStep >= STEPS.length - 1;

  useEffect(() => {
    if (!isPlaying) return;
    if (isComplete) {
      setIsPlaying(false);
      return;
    }
    const timer = setTimeout(() => {
      setActiveStep((prev) => prev + 1);
    }, 2000);
    return () => clearTimeout(timer);
  }, [isPlaying, activeStep, isComplete]);

  const handlePlay = useCallback(() => {
    if (isComplete) {
      setActiveStep(-1);
      setIsPlaying(true);
    } else {
      setIsPlaying((p) => !p);
    }
  }, [isComplete]);

  const handleNext = useCallback(() => {
    setIsPlaying(false);
    if (activeStep < STEPS.length - 1) setActiveStep((p) => p + 1);
  }, [activeStep]);

  const handlePrev = useCallback(() => {
    setIsPlaying(false);
    if (activeStep > -1) setActiveStep((p) => p - 1);
  }, [activeStep]);

  const handleReset = useCallback(() => {
    setIsPlaying(false);
    setActiveStep(-1);
  }, []);

  const progress = ((activeStep + 1) / STEPS.length) * 100;

  return (
    <div className="space-y-5">
      {/* Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex items-center gap-2">
          <button
            onClick={handleReset}
            className="p-2 rounded-lg border border-card-border bg-card hover:bg-muted transition-colors text-muted-foreground"
            data-testid="button-reset"
            title="처음으로"
          >
            <RotateCcw size={16} />
          </button>
          <button
            onClick={handlePrev}
            disabled={activeStep < 0}
            className="p-2 rounded-lg border border-card-border bg-card hover:bg-muted transition-colors text-muted-foreground disabled:opacity-40 disabled:cursor-not-allowed"
            data-testid="button-prev"
            title="이전 단계"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            onClick={handlePlay}
            className="flex items-center gap-2 px-5 py-2 rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition-opacity text-sm font-medium"
            data-testid="button-play-pause"
          >
            {isPlaying ? <Pause size={15} /> : <Play size={15} />}
            {isComplete ? "다시 보기" : isPlaying ? "일시정지" : activeStep < 0 ? "시작" : "계속"}
          </button>
          <button
            onClick={handleNext}
            disabled={isComplete}
            className="p-2 rounded-lg border border-card-border bg-card hover:bg-muted transition-colors text-muted-foreground disabled:opacity-40 disabled:cursor-not-allowed"
            data-testid="button-next"
            title="다음 단계"
          >
            <ChevronRight size={16} />
          </button>
        </div>
        <div className="flex-1 space-y-1">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>
              단계 {Math.max(0, activeStep + 1)} / {STEPS.length}
            </span>
            {activeStep >= 0 && (
              <span className="flex items-center gap-1">
                <Clock size={11} />
                {STEPS[activeStep].timing}
              </span>
            )}
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

      <div className="grid lg:grid-cols-[1fr_360px] gap-5">
        {/* Steps list */}
        <div className="space-y-2 overflow-y-auto max-h-[520px] pr-1">
          {STEPS.map((step, i) => {
            const isActive = i === activeStep;
            const isDone = i < activeStep;
            const isFuture = i > activeStep;

            return (
              <motion.div
                key={step.id}
                layout
                className={`relative rounded-xl border transition-colors cursor-pointer ${
                  isActive
                    ? "border-primary/50 bg-primary/5"
                    : isDone
                    ? "border-card-border bg-card opacity-70"
                    : "border-card-border bg-card"
                }`}
                onClick={() => {
                  setIsPlaying(false);
                  setActiveStep(i);
                }}
                data-testid={`step-${step.id}`}
              >
                <div className="flex items-start gap-3 p-3">
                  {/* Step number / status */}
                  <div
                    className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold mt-0.5 transition-all ${
                      isDone
                        ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400"
                        : isActive
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {isDone ? <CheckCircle size={14} /> : i + 1}
                  </div>

                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full font-medium ${step.actorColor}`}
                      >
                        {step.actor}
                      </span>
                      <span
                        className={`text-sm font-semibold ${
                          isActive ? "text-primary" : isFuture ? "text-muted-foreground" : "text-foreground"
                        }`}
                      >
                        {step.title}
                      </span>
                    </div>
                    {!isActive && (
                      <p className="text-xs text-muted-foreground">{step.shortDesc}</p>
                    )}
                  </div>
                </div>

                {/* Expanded detail panel */}
                <AnimatePresence>
                  {isActive && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25 }}
                      className="overflow-hidden"
                    >
                      <div className="px-3 pb-4 pt-1 ml-10 space-y-2">
                        <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-line">
                          {step.detail}
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>

        {/* Flow diagram (simplified SVG) */}
        <div className="hidden lg:block">
          <div className="sticky top-4 bg-card border border-card-border rounded-xl p-4 space-y-1">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3">
              흐름도
            </p>
            <div className="flex flex-col items-center gap-0">
              {STEPS.map((step, i) => {
                const isDone = i <= activeStep;
                const isActive = i === activeStep;
                return (
                  <div key={step.id} className="flex flex-col items-center w-full">
                    <div
                      className={`w-full py-1.5 px-3 rounded-md text-xs text-center transition-all duration-300 ${
                        isActive
                          ? "bg-primary text-primary-foreground font-semibold shadow-sm"
                          : isDone
                          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {step.title}
                    </div>
                    {i < STEPS.length - 1 && (
                      <div
                        className={`w-0.5 h-3 transition-colors duration-300 ${
                          isDone ? "bg-emerald-400" : "bg-muted-foreground/20"
                        }`}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {isComplete && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl text-center"
        >
          <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">
            전체 과정 완료! 브라우저 주소창에 google.com을 입력하면 이 모든 과정이 수백 밀리초 안에 일어납니다.
          </p>
        </motion.div>
      )}
    </div>
  );
}
