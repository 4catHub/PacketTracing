import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Pause, RotateCcw, ChevronLeft, ChevronRight, Clock } from "lucide-react";

// content.ts와 정합되는 11단계 정의 (설명 볼드체 기호 ** 절대 사용 금지)
const STEPS = [
  { title: "1. Browser DNS 캐시 확인", timing: "< 1ms", desc: "이전 방문 기록이 브라우저 캐시에 존재하는지 확인하여 빠르게 IP를 반환받고자 시도합니다." },
  { title: "2. OS 캐시 & hosts 파일 확인", timing: "~1ms", desc: "브라우저 캐시 미스 시, 운영체제(OS)의 DNS 캐시 및 로컬 hosts 설정 파일을 확인합니다." },
  { title: "3. 재귀 DNS Resolver 질의", timing: "~10–20ms", desc: "로컬 캐시가 모두 없을 때 OS는 ISP 또는 공개 DNS(예: 8.8.8.8)인 재귀 DNS Resolver에 IP 조회를 위임합니다." },
  { title: "4. Root Nameserver 질의", timing: "~20–40ms", desc: "Resolver는 루트 네임서버에 질의하여 .com 도메인을 담당하는 TLD 네임서버의 주소를 획득합니다." },
  { title: "5. TLD Nameserver 질의", timing: "~30–50ms", desc: "Resolver는 .com TLD 네임서버에 질의하여 google.com 권한 네임서버(Authoritative NS)의 주소를 획득합니다." },
  { title: "6. Authoritative NS 질의 -> IP 반환", timing: "~40–60ms", desc: "최종 권한 네임서버에서 google.com의 실제 IP 주소(예: 142.250.196.36)를 획득하여 브라우저까지 역순으로 반환합니다." },
  { title: "7. TCP 3-way Handshake", timing: "1 RTT", desc: "획득한 IP로 서버와 연결을 맺기 위해 SYN -> SYN-ACK -> ACK 과정을 거쳐 신뢰할 수 있는 TCP 채널을 엽니다." },
  { title: "8. TLS 1.3 Handshake", timing: "1 RTT", desc: "보안 강화를 위해 TLS 1.3 규격으로 단 1-RTT만에 디피-힐만 세션 대칭키 교환 및 암호화 연결을 맺습니다." },
  { title: "9. HTTP/2 GET 요청 전송", timing: "~1–5ms", desc: "연결된 보안 터널을 통해 브라우저가 필요한 리소스를 요청하는 HTTP GET 메시지를 보냅니다." },
  { title: "10. 서버 응답 수신", timing: "~20–100ms", desc: "웹 서버가 요청된 HTML 문서와 스타일시트(CSS), 자바스크립트(JS) 리소스를 암호화하여 응답합니다." },
  { title: "11. HTML 파싱 & 페이지 렌더링", timing: "~50–500ms", desc: "브라우저가 HTML을 DOM Tree로 파싱하고 CSSOM과 병합하여 Render Tree를 형성한 뒤 레이아웃과 페인트를 거쳐 화면에 출력합니다." }
];

// 우측에 노출할 파이썬(슈도코드) 소스 코드
const PYTHON_CODE = [
  "def request_google(url):",                     // idx 0
  "    # 1. DNS 조회로 IP 획득",                   // idx 1
  "    ip = dns_resolve(url)",                    // idx 2
  "    ",                                         // idx 3
  "    # 2. TCP 연결 수립",                       // idx 4
  "    sock = tcp_connect(ip, port=443)",         // idx 5
  "    ",                                         // idx 6
  "    # 3. TLS 1.3 보안 세션 합의",              // idx 7
  "    session = tls_handshake(sock)",            // idx 8
  "    ",                                         // idx 9
  "    # 4. HTTP/2 GET 요청 및 응답",              // idx 10
  "    response = session.get('/')",              // idx 11
  "    ",                                         // idx 12
  "    # 5. 브라우저 파싱 및 화면 렌더링",          // idx 13
  "    browser.render(response.html)"             // idx 14
];

// 각 activeStep에 매핑되는 하이라이트 코드 라인 인덱스 및 변수 모니터 스냅샷
const STATE_MAPS = [
  { highlightIdxs: [1, 2], variables: { url: "google.com", cache: "CHECKING", ip: "None", conn: "None", step: "DNS_LOCAL" } },
  { highlightIdxs: [1, 2], variables: { url: "google.com", cache: "CHECK_OS", ip: "None", conn: "None", step: "DNS_OS" } },
  { highlightIdxs: [2], variables: { url: "google.com", cache: "MISS", ip: "resolving...", conn: "None", step: "DNS_RESOLVER" } },
  { highlightIdxs: [2], variables: { url: "google.com", cache: "MISS", ip: "resolving...", conn: "None", step: "DNS_ROOT" } },
  { highlightIdxs: [2], variables: { url: "google.com", cache: "MISS", ip: "resolving...", conn: "None", step: "DNS_TLD" } },
  { highlightIdxs: [2], variables: { url: "google.com", cache: "CACHED", ip: "142.250.196.36", conn: "None", step: "DNS_DONE" } },
  { highlightIdxs: [5], variables: { url: "google.com", cache: "CACHED", ip: "142.250.196.36", conn: "TCP_HANDSHAKE", step: "TCP_CONNECT" } },
  { highlightIdxs: [8], variables: { url: "google.com", cache: "CACHED", ip: "142.250.196.36", conn: "TLS_1.3_NEGOTIATING", step: "TLS_HANDSHAKE" } },
  { highlightIdxs: [11], variables: { url: "google.com", cache: "CACHED", ip: "142.250.196.36", conn: "HTTPS_SECURE", step: "HTTP_SEND" } },
  { highlightIdxs: [11], variables: { url: "google.com", cache: "CACHED", ip: "142.250.196.36", conn: "HTTPS_SECURE", step: "HTTP_RECV" } },
  { highlightIdxs: [14], variables: { url: "google.com", cache: "CACHED", ip: "142.250.196.36", conn: "HTTPS_SECURE", step: "BROWSER_RENDER" } }
];

// 카메라 무빙을 위한 각 단계별 SVG viewBox (x y width height)
const VIEWBOXES = [
  "0 30 500 450",   // 0단계: Browser & OS
  "0 60 500 450",   // 1단계: Browser & OS
  "100 80 550 450",  // 2단계: OS & Resolver
  "200 20 600 450",  // 3단계: Resolver & Root
  "220 50 600 450",  // 4단계: Resolver & TLD
  "200 100 600 450", // 5단계: Resolver & Auth -> Browser
  "0 80 500 450",   // 6단계: Browser -> TCP/TLS -> Server
  "0 80 500 450",   // 7단계: Browser -> TCP/TLS -> Server
  "0 80 500 450",   // 8단계: HTTP GET
  "0 80 500 450",   // 9단계: Server Response
  "0 40 450 540"    // 10단계: HTML Parse & Render
];

export default function GoogleDnsViz() {
  const [activeStep, setActiveStep] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const total = STEPS.length;
  const isComplete = activeStep >= total - 1;
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // 단계별 딜레이 시간 정의 (Handshake 등 연속 연출을 위해 단계를 길게 배치)
  const getStepDuration = (step: number) => {
    if (step === 6) return 4000; // TCP 3-way Handshake (3회 왕복)
    if (step === 7) return 3000; // TLS 1.3 Handshake (2회 왕복)
    return 3200; // 기본 DNS 및 HTTP 트래픽
  };

  const tick = useCallback(() => {
    setActiveStep((current) => {
      if (current >= total - 1) {
        // 마지막 단계 지연시간이 완료되면 처음(0단계)으로 루프 백
        timerRef.current = setTimeout(tick, getStepDuration(0));
        return 0;
      }
      const nextStep = current + 1;
      // 다음 틱 예약
      timerRef.current = setTimeout(tick, getStepDuration(nextStep));
      return nextStep;
    });
  }, [total]);

  // 재생 / 일시정지 제어
  useEffect(() => {
    if (isPlaying) {
      if (activeStep >= total - 1) {
        // 마지막 단계인 상태에서 재생할 경우 즉시 리셋하지 않고,
        // 마지막 단계 지연시간만큼 머물렀다가 처음으로 진행하도록 대기 타이머 설정
        timerRef.current = setTimeout(tick, getStepDuration(total - 1));
      } else {
        const nextStep = activeStep === -1 ? 0 : activeStep + 1;
        if (activeStep === -1) setActiveStep(0);
        timerRef.current = setTimeout(tick, getStepDuration(nextStep));
      }
    } else {
      if (timerRef.current) clearTimeout(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [isPlaying, activeStep, tick, total]);

  const handlePlay = useCallback(() => {
    if (isComplete) {
      setActiveStep(-1);
      setTimeout(() => setIsPlaying(true), 50);
    } else {
      setIsPlaying((p) => !p);
    }
  }, [isComplete]);

  const handleNext = useCallback(() => {
    setIsPlaying(false);
    if (activeStep < total - 1) {
      setActiveStep((p) => p + 1);
    }
  }, [activeStep, total]);

  const handlePrev = useCallback(() => {
    setIsPlaying(false);
    if (activeStep >= 0) {
      setActiveStep((p) => p - 1);
    }
  }, [activeStep]);

  const handleReset = useCallback(() => {
    setIsPlaying(false);
    setActiveStep(-1);
  }, []);

  const progress = ((activeStep + 1) / total) * 100;
  const isDnsSection = activeStep >= 0 && activeStep <= 5;
  const isTcpTlsSection = activeStep === 6 || activeStep === 7;
  const isHttpSection = activeStep === 8 || activeStep === 9;
  const isRenderSection = activeStep === 10;

  return (
    <div className="space-y-6">
      {/* 1. 상단 컨트롤 바 */}
      <div className="flex items-center gap-3 flex-wrap">
        <button
          onClick={handleReset}
          className="p-2.5 rounded-lg border border-card-border bg-card hover:bg-muted transition-colors text-muted-foreground"
          data-testid="button-reset"
          aria-label="초기화"
        >
          <RotateCcw size={16} />
        </button>
        <button
          onClick={handlePrev}
          disabled={activeStep < 0}
          className="p-2.5 rounded-lg border border-card-border bg-card hover:bg-muted text-muted-foreground disabled:opacity-40 transition-colors"
          data-testid="button-prev"
          aria-label="이전 단계"
        >
          <ChevronLeft size={16} />
        </button>
        <button
          onClick={handlePlay}
          className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary text-primary-foreground hover:opacity-90 text-sm font-medium transition-opacity"
          data-testid="button-play-pause"
        >
          {isPlaying ? <Pause size={15} /> : <Play size={15} />}
          {isComplete ? "다시 보기" : isPlaying ? "일시정지" : activeStep < 0 ? "자동 실행" : "계속"}
        </button>
        <button
          onClick={handleNext}
          disabled={isComplete}
          className="p-2.5 rounded-lg border border-card-border bg-card hover:bg-muted text-muted-foreground disabled:opacity-40 transition-colors"
          data-testid="button-next"
          aria-label="다음 단계"
        >
          <ChevronRight size={16} />
        </button>

        <div className="flex-1 min-w-[200px] space-y-1">
          <div className="flex justify-between text-xs sm:text-sm text-muted-foreground">
            <span>
              {activeStep >= 0 ? `단계 ${activeStep + 1} / ${total} — ${STEPS[activeStep].title}` : "자동 실행을 누르면 전체 흐름이 시작됩니다."}
            </span>
            {activeStep >= 0 && (
              <span className="flex items-center gap-1">
                <Clock size={12} /> {STEPS[activeStep].timing}
              </span>
            )}
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

      {/* 2. 대시보드 그리드 레이아웃 (좌: 100% SVG 다이어그램, 우: 소스 코드 & 변수 상태 추적) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* 좌측: SVG 시뮬레이터 (카메라 줌 지원) */}
        <div className="lg:col-span-2 relative border border-border/60 rounded-2xl bg-[#0B0F19] overflow-hidden flex justify-center py-4">
          <motion.svg
            viewBox="0 0 800 600"
            className="w-full h-auto select-none"
            xmlns="http://www.w3.org/2000/svg"
            animate={{ viewBox: activeStep >= 0 ? VIEWBOXES[activeStep] : "0 0 800 600" }}
            transition={{ duration: 1.2, ease: "easeInOut" }}
          >
            <defs>
              {/* 네온 글로우 효과 필터 */}
              <filter id="glow-cyan" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="4" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
              <filter id="glow-green" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="4" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
              <filter id="glow-purple" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="4" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* ── 연결 경로 백그라운드 ── */}
            <g stroke="#1E293B" strokeWidth="2.5" fill="none">
              {/* Local DNS Check Link */}
              <line x1="100" y1="100" x2="100" y2="240" strokeDasharray="5,5" />
              {/* Resolver Link */}
              <line x1="100" y1="240" x2="320" y2="240" />
              {/* Nameserver Queries */}
              <line x1="320" y1="240" x2="480" y2="80" />
              <line x1="320" y1="240" x2="580" y2="180" />
              <line x1="320" y1="240" x2="480" y2="280" />
              {/* Server Connection Link */}
              <line x1="100" y1="100" x2="100" y2="420" />
              <line x1="100" y1="420" x2="320" y2="420" />
              {/* Render Pipeline Link */}
              <line x1="100" y1="100" x2="100" y2="530" strokeDasharray="5,5" />
            </g>

            {/* ── 노드 그룹 렌더링 ── */}
            {/* 1. Browser Node (100, 100) */}
            <g transform="translate(100, 100)">
              <rect x="-35" y="-30" width="70" height="44" rx="6" fill="#1E293B" stroke={activeStep === 0 || activeStep === 10 ? "#38BDF8" : "#334155"} strokeWidth="2" />
              <rect x="-15" y="14" width="30" height="12" fill="#334155" />
              <ellipse cx="0" cy="24" rx="20" ry="4" fill="#334155" />
              <text x="0" y="5" textAnchor="middle" fill="#FFFFFF" fontSize="18" fontWeight="bold">🌐</text>
              <text x="0" y="-36" textAnchor="middle" fill="#94A3B8" fontSize="10.5" fontWeight="bold">Browser</text>
            </g>

            {/* 2. OS / hosts Cache Node (100, 240) */}
            <g transform="translate(100, 240)">
              <rect x="-35" y="-22" width="70" height="44" rx="8" fill="#1E293B" stroke={activeStep === 1 ? "#38BDF8" : "#334155"} strokeWidth="2" />
              <text x="0" y="5" textAnchor="middle" fill="#FFFFFF" fontSize="18">💻</text>
              <text x="0" y="-28" textAnchor="middle" fill="#64748B" fontSize="9.5" fontWeight="bold">OS / hosts</text>
            </g>

            {/* 3. DNS Resolver Node (320, 240) */}
            <g transform="translate(320, 240)">
              <rect x="-38" y="-24" width="76" height="48" rx="8" fill="#0F172A" stroke={isDnsSection && activeStep >= 2 ? "#38BDF8" : "#334155"} strokeWidth="2" />
              <text x="0" y="6" textAnchor="middle" fill="#FFFFFF" fontSize="18">🔍</text>
              <text x="0" y="-30" textAnchor="middle" fill={isDnsSection && activeStep >= 2 ? "#38BDF8" : "#64748B"} fontSize="10" fontWeight="bold">DNS Resolver</text>
            </g>

            {/* 4. Root Nameserver (480, 80) */}
            <g transform="translate(480, 80)">
              <rect x="-25" y="-20" width="50" height="40" rx="4" fill="#1E293B" stroke={activeStep === 3 ? "#F59E0B" : "#334155"} strokeWidth="2" />
              <line x1="-25" y1="-5" x2="25" y2="-5" stroke="#334155" />
              <line x1="-25" y1="10" x2="25" y2="10" stroke="#334155" />
              <circle cx="15" cy="-12" r="2.5" fill={activeStep === 3 ? "#F59E0B" : "#475569"} />
              <circle cx="15" cy="2" r="2.5" fill={activeStep === 3 ? "#F59E0B" : "#475569"} />
              <circle cx="15" cy="16" r="2.5" fill={activeStep === 3 ? "#F59E0B" : "#475569"} />
              <text x="-6" y="5" textAnchor="middle" fill="#FFFFFF" fontSize="16">🌍</text>
              <text x="0" y="-28" textAnchor="middle" fill={activeStep === 3 ? "#F59E0B" : "#64748B"} fontSize="9.5" fontWeight="bold">Root NS</text>
            </g>

            {/* 5. TLD Nameserver (580, 180) */}
            <g transform="translate(580, 180)">
              <rect x="-25" y="-20" width="50" height="40" rx="4" fill="#1E293B" stroke={activeStep === 4 ? "#F59E0B" : "#334155"} strokeWidth="2" />
              <line x1="-25" y1="-5" x2="25" y2="-5" stroke="#334155" />
              <line x1="-25" y1="10" x2="25" y2="10" stroke="#334155" />
              <circle cx="15" cy="-12" r="2.5" fill={activeStep === 4 ? "#F59E0B" : "#475569"} />
              <circle cx="15" cy="2" r="2.5" fill={activeStep === 4 ? "#F59E0B" : "#475569"} />
              <circle cx="15" cy="16" r="2.5" fill={activeStep === 4 ? "#F59E0B" : "#475569"} />
              <text x="-6" y="5" textAnchor="middle" fill="#FFFFFF" fontSize="16">📋</text>
              <text x="0" y="-28" textAnchor="middle" fill={activeStep === 4 ? "#F59E0B" : "#64748B"} fontSize="9.5" fontWeight="bold">.com TLD NS</text>
            </g>

            {/* 6. Authoritative Nameserver (480, 280) */}
            <g transform="translate(480, 280)">
              <rect x="-25" y="-20" width="50" height="40" rx="4" fill="#1E293B" stroke={activeStep === 5 ? "#10B981" : "#334155"} strokeWidth="2" />
              <line x1="-25" y1="-5" x2="25" y2="-5" stroke="#334155" />
              <line x1="-25" y1="10" x2="25" y2="10" stroke="#334155" />
              <circle cx="15" cy="-12" r="2.5" fill={activeStep === 5 ? "#10B981" : "#475569"} />
              <circle cx="15" cy="2" r="2.5" fill={activeStep === 5 ? "#10B981" : "#475569"} />
              <circle cx="15" cy="16" r="2.5" fill={activeStep === 5 ? "#10B981" : "#475569"} />
              <text x="-6" y="5" textAnchor="middle" fill="#FFFFFF" fontSize="16">🔑</text>
              <text x="0" y="-28" textAnchor="middle" fill={activeStep === 5 ? "#10B981" : "#64748B"} fontSize="9.5" fontWeight="bold">Auth NS</text>
            </g>

            {/* 7. TCP / TLS Handshake Zone (100, 420) */}
            <g transform="translate(100, 420)">
              <rect x="-35" y="-22" width="70" height="44" rx="8" fill="#0F172A" stroke={isTcpTlsSection ? (activeStep === 6 ? "#38BDF8" : "#10B981") : "#334155"} strokeWidth="2" />
              <text x="0" y="6" textAnchor="middle" fill="#FFFFFF" fontSize="18">{activeStep === 7 ? "🔒" : "🤝"}</text>
              <text x="0" y="-28" textAnchor="middle" fill={isTcpTlsSection ? "#38BDF8" : "#64748B"} fontSize="9.5" fontWeight="bold">TCP/TLS 1.3</text>
            </g>

            {/* 8. Web Server Server (320, 420) */}
            <g transform="translate(320, 420)">
              <rect x="-38" y="-24" width="76" height="48" rx="6" fill="#1E293B" stroke={isHttpSection ? "#10B981" : "#334155"} strokeWidth="2" />
              <line x1="-38" y1="-8" x2="38" y2="-8" stroke="#334155" />
              <line x1="-38" y1="8" x2="38" y2="8" stroke="#334155" />
              <circle cx="-25" cy="-16" r="2" fill={isHttpSection ? "#10B981" : "#475569"} />
              <circle cx="-25" cy="0" r="2" fill={isHttpSection ? "#10B981" : "#475569"} />
              <circle cx="-25" cy="16" r="2" fill={isHttpSection ? "#10B981" : "#475569"} />
              <text x="10" y="6" textAnchor="middle" fill="#FFFFFF" fontSize="18">🖥️</text>
              <text x="0" y="-30" textAnchor="middle" fill={isHttpSection ? "#10B981" : "#64748B"} fontSize="10" fontWeight="bold">Web Server</text>
            </g>

            {/* 9. Render Screen (100, 530) */}
            <g transform="translate(100, 530)">
              <rect x="-42" y="-20" width="84" height="40" rx="4" fill="#0F172A" stroke={isRenderSection ? "#10B981" : "#334155"} strokeWidth="2" />
              {isRenderSection ? (
                // 렌더 완료 상태: 구글 홈페이지 구조화
                <g>
                  <text x="0" y="-1" textAnchor="middle" fill="#38BDF8" fontSize="8" fontWeight="bold" fontFamily="sans-serif">Google</text>
                  <rect x="-24" y="6" width="48" height="6" rx="2" fill="#334155" />
                </g>
              ) : (
                <g>
                  <text x="0" y="5" textAnchor="middle" fill="#FFFFFF" fontSize="18" opacity="0.3">🎨</text>
                </g>
              )}
              <text x="0" y="-26" textAnchor="middle" fill={isRenderSection ? "#10B981" : "#64748B"} fontSize="9.5" fontWeight="bold">Render Engine</text>
            </g>

            {/* ── 궤적 애니메이션 패킷(원 + 페이로드 툴팁) ── */}
            <AnimatePresence>
              {activeStep >= 0 && (
                <g key={`step-packet-${activeStep}`}>
                  {/* Step 0: Browser -> OS */}
                  {activeStep === 0 && (
                    <g>
                      <motion.circle cx="100" cy="100" r="6" fill="#38BDF8" filter="url(#glow-cyan)" animate={{ cy: [100, 240] }} transition={{ duration: 1.5, ease: "easeInOut" }} />
                      <motion.g animate={{ x: [100, 100], y: [100, 240], opacity: [0, 1, 1, 0] }} transition={{ duration: 1.5, ease: "easeInOut" }}>
                        <rect x="15" y="-12" width="105" height="24" rx="6" fill="#1E293B" stroke="#38BDF8" strokeWidth="1.5" />
                        <text x="67" y="3" textAnchor="middle" fill="#FFFFFF" fontSize="9" fontWeight="bold" fontFamily="monospace">Cache Check</text>
                      </motion.g>
                    </g>
                  )}

                  {/* Step 1: OS 캐시 확인 */}
                  {activeStep === 1 && (
                    <g>
                      <motion.circle cx="100" cy="240" r="6.5" fill="#38BDF8" filter="url(#glow-cyan)" animate={{ scale: [1, 1.4, 1] }} transition={{ duration: 1.5, repeat: Infinity }} />
                      <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
                        <rect x="115" y="228" width="95" height="24" rx="6" fill="#1E293B" stroke="#38BDF8" strokeWidth="1.5" />
                        <text x="162" y="243" textAnchor="middle" fill="#FFFFFF" fontSize="9" fontWeight="bold" fontFamily="monospace">Local MISS</text>
                      </motion.g>
                    </g>
                  )}

                  {/* Step 2: OS -> Resolver */}
                  {activeStep === 2 && (
                    <g>
                      <motion.circle cx="100" cy="240" r="6" fill="#38BDF8" filter="url(#glow-cyan)" animate={{ cx: [100, 320] }} transition={{ duration: 1.8, ease: "easeInOut" }} />
                      <motion.g animate={{ x: [100, 320], y: [240, 240] }} transition={{ duration: 1.8, ease: "easeInOut" }}>
                        <rect x="-55" y="-35" width="110" height="24" rx="6" fill="#1E293B" stroke="#38BDF8" strokeWidth="1.5" />
                        <text x="0" y="-20" textAnchor="middle" fill="#FFFFFF" fontSize="8.5" fontWeight="bold" fontFamily="monospace">Find: google.com</text>
                      </motion.g>
                    </g>
                  )}

                  {/* Step 3: Resolver -> Root NS -> Resolver */}
                  {activeStep === 3 && (
                    <g>
                      <motion.circle
                        cx="320" cy="240" r="5.5" fill="#F59E0B" filter="url(#glow-cyan)"
                        animate={{ cx: [320, 480, 320], cy: [240, 80, 240] }}
                        transition={{ duration: 2.8, ease: "easeInOut" }}
                      />
                      <motion.g
                        animate={{
                          x: [320, 480, 320],
                          y: [240, 80, 240]
                        }}
                        transition={{ duration: 2.8, ease: "easeInOut" }}
                      >
                        <rect x="15" y="-12" width="100" height="24" rx="6" fill="#0F172A" stroke="#F59E0B" strokeWidth="1.5" />
                        <text x="65" y="3" textAnchor="middle" fill="#F59E0B" fontSize="8.5" fontWeight="bold" fontFamily="monospace">Root Query</text>
                      </motion.g>
                    </g>
                  )}

                  {/* Step 4: Resolver -> TLD NS -> Resolver */}
                  {activeStep === 4 && (
                    <g>
                      <motion.circle
                        cx="320" cy="240" r="5.5" fill="#F59E0B" filter="url(#glow-cyan)"
                        animate={{ cx: [320, 580, 320], cy: [240, 180, 240] }}
                        transition={{ duration: 2.8, ease: "easeInOut" }}
                      />
                      <motion.g animate={{ x: [320, 580, 320], y: [240, 180, 240] }} transition={{ duration: 2.8, ease: "easeInOut" }}>
                        <rect x="15" y="-12" width="105" height="24" rx="6" fill="#0F172A" stroke="#F59E0B" strokeWidth="1.5" />
                        <text x="67" y="3" textAnchor="middle" fill="#F59E0B" fontSize="8.5" fontWeight="bold" fontFamily="monospace">TLD Query</text>
                      </motion.g>
                    </g>
                  )}

                  {/* Step 5: Resolver -> Auth NS -> Resolver -> Browser */}
                  {activeStep === 5 && (
                    <g>
                      {/* Resolver -> Auth NS -> Resolver */}
                      <motion.circle
                        cx="320" cy="240" r="5.5" fill="#10B981" filter="url(#glow-green)"
                        animate={{ cx: [320, 480, 320, 100], cy: [240, 280, 240, 100] }}
                        transition={{ duration: 3.2, ease: "easeInOut" }}
                      />
                      <motion.g animate={{ x: [320, 480, 320, 100], y: [240, 280, 240, 100] }} transition={{ duration: 3.2, ease: "easeInOut" }}>
                        <rect x="15" y="-12" width="115" height="24" rx="6" fill="#0F172A" stroke="#10B981" strokeWidth="1.5" />
                        <text x="72" y="3" textAnchor="middle" fill="#10B981" fontSize="8" fontWeight="bold" fontFamily="monospace">IP: 142.250.196.36</text>
                      </motion.g>
                    </g>
                  )}

                  {/* Step 6: TCP 3-way Handshake (SYN -> SYN-ACK -> ACK 왕복 자동 연출) */}
                  {activeStep === 6 && (
                    <g>
                      {/* SYN (Client -> TCP -> Server) */}
                      <motion.circle
                        cx="100" cy="100" r="5.5" fill="#38BDF8" filter="url(#glow-cyan)"
                        animate={{
                          cx: [100, 100, 320, 320, 100, 100, 320],
                          cy: [100, 420, 420, 420, 420, 100, 420],
                          opacity: [1, 1, 1, 1, 1, 1, 1]
                        }}
                        transition={{ duration: 3.8, ease: "easeInOut" }}
                      />
                      <motion.g
                        animate={{
                          x: [100, 100, 320, 320, 100, 100, 320],
                          y: [100, 420, 420, 420, 420, 100, 420]
                        }}
                        transition={{ duration: 3.8, ease: "easeInOut" }}
                      >
                        <rect x="15" y="-12" width="70" height="24" rx="6" fill="#0F172A" stroke="#38BDF8" strokeWidth="1.5" />
                        <motion.text
                          x="50" y="3" textAnchor="middle" fill="#FFFFFF" fontSize="9" fontWeight="bold" fontFamily="monospace"
                          animate={{
                            fill: ["#38BDF8", "#38BDF8", "#F59E0B", "#F59E0B", "#10B981", "#10B981", "#10B981"]
                          }}
                          transition={{ duration: 3.8 }}
                        >
                          TCP Req
                        </motion.text>
                      </motion.g>
                    </g>
                  )}

                  {/* Step 7: TLS 1.3 Handshake (Client Hello -> Server Hello -> Session Key) */}
                  {activeStep === 7 && (
                    <g>
                      <motion.circle
                        cx="100" cy="100" r="5.5" fill="#A855F7" filter="url(#glow-purple)"
                        animate={{
                          cx: [100, 320, 320, 100],
                          cy: [100, 420, 420, 100]
                        }}
                        transition={{ duration: 2.8, ease: "easeInOut" }}
                      />
                      <motion.g
                        animate={{
                          x: [100, 320, 320, 100],
                          y: [100, 420, 420, 100]
                        }}
                        transition={{ duration: 2.8, ease: "easeInOut" }}
                      >
                        <rect x="15" y="-12" width="105" height="24" rx="6" fill="#0F172A" stroke="#A855F7" strokeWidth="1.5" />
                        <text x="67" y="3" textAnchor="middle" fill="#A855F7" fontSize="8" fontWeight="bold" fontFamily="monospace">TLS 1.3 Key Share</text>
                      </motion.g>
                    </g>
                  )}

                  {/* Step 8: HTTP/2 GET Request */}
                  {activeStep === 8 && (
                    <g>
                      <motion.circle
                        cx="100" cy="100" r="6" fill="#10B981" filter="url(#glow-green)"
                        animate={{ cx: [100, 100, 320], cy: [100, 420, 420] }}
                        transition={{ duration: 1.8, ease: "easeInOut" }}
                      />
                      <motion.g animate={{ x: [100, 100, 320], y: [100, 420, 420] }} transition={{ duration: 1.8, ease: "easeInOut" }}>
                        <rect x="15" y="-12" width="85" height="24" rx="6" fill="#0F172A" stroke="#10B981" strokeWidth="1.5" />
                        <text x="57" y="3" textAnchor="middle" fill="#10B981" fontSize="8.5" fontWeight="bold" fontFamily="monospace">HTTP GET /</text>
                      </motion.g>
                    </g>
                  )}

                  {/* Step 9: Server Response */}
                  {activeStep === 9 && (
                    <g>
                      <motion.circle
                        cx="320" cy="420" r="6" fill="#10B981" filter="url(#glow-green)"
                        animate={{ cx: [320, 100, 100], cy: [420, 420, 100] }}
                        transition={{ duration: 2.2, ease: "easeInOut" }}
                      />
                      <motion.g animate={{ x: [320, 100, 100], y: [420, 420, 100] }} transition={{ duration: 2.2, ease: "easeInOut" }}>
                        <rect x="15" y="-12" width="115" height="24" rx="6" fill="#0F172A" stroke="#10B981" strokeWidth="1.5" />
                        <text x="72" y="3" textAnchor="middle" fill="#10B981" fontSize="8.5" fontWeight="bold" fontFamily="monospace">200 OK (HTML/JS)</text>
                      </motion.g>
                    </g>
                  )}

                  {/* Step 10: HTML Parsing & Rendering */}
                  {activeStep === 10 && (
                    <g>
                      <motion.circle
                        cx="100" cy="100" r="6" fill="#10B981" filter="url(#glow-green)"
                        animate={{ cy: [100, 530] }}
                        transition={{ duration: 1.8, ease: "easeInOut" }}
                      />
                      <motion.g animate={{ x: [100, 100], y: [100, 530] }} transition={{ duration: 1.8, ease: "easeInOut" }}>
                        <rect x="15" y="-12" width="95" height="24" rx="6" fill="#0F172A" stroke="#10B981" strokeWidth="1.5" />
                        <text x="62" y="3" textAnchor="middle" fill="#10B981" fontSize="8.5" fontWeight="bold" fontFamily="monospace">Layout & Paint</text>
                      </motion.g>
                    </g>
                  )}
                </g>
              )}
            </AnimatePresence>
          </motion.svg>
        </div>

        {/* 우측: Python 코드 트레이서 및 변수 인스펙터 */}
        <div className="space-y-4 flex flex-col justify-between">
          
          {/* 파이썬 실행 추적 모니터 */}
          <div className="p-4 rounded-2xl bg-card border border-card-border font-mono text-xs overflow-x-auto space-y-1">
            <div className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider mb-2">💻 Python Tracer</div>
            {PYTHON_CODE.map((line, idx) => {
              const currentMap = activeStep >= 0 ? STATE_MAPS[activeStep] : null;
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

          {/* 변수 정보 상태 검사기 (State Inspector) */}
          <div className="p-4 rounded-2xl bg-muted/30 border border-border font-mono text-xs">
            <div className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider mb-2.5">🔍 State Inspector</div>
            {activeStep >= 0 && STATE_MAPS[activeStep] ? (
              <div className="grid grid-cols-1 gap-y-1.5">
                {Object.entries(STATE_MAPS[activeStep].variables).map(([key, val]) => (
                  <div key={key} className="flex justify-between border-b border-border/20 pb-1">
                    <span className="text-muted-foreground uppercase text-[10px] font-bold">{key}</span>
                    <span className="text-foreground font-semibold">{String(val)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <span className="text-muted-foreground/60 italic text-center block py-4">대기 중 — 자동 실행을 시작해주세요</span>
            )}
          </div>

        </div>
      </div>

      {/* 3. 하단 단계 설명 Callout 박스 */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeStep}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -15 }}
          transition={{ duration: 0.3 }}
          className="p-5 rounded-2xl bg-card border border-card-border shadow-lg space-y-2.5"
        >
          <h3 className="text-base sm:text-lg font-bold text-foreground">
            {activeStep >= 0 ? STEPS[activeStep].title : "Google 접속 흐름 시뮬레이터 안내"}
          </h3>
          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
            {activeStep >= 0
              ? STEPS[activeStep].desc
              : "자동 실행 버튼을 클릭하면 URL 주소창 입력부터 페이지 렌더링까지 전체 11단계 통신 흐름이 카메라 줌, 코드 추적, 동적 패킷과 함께 논스톱(Seamless) 시뮬레이션됩니다."}
          </p>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
