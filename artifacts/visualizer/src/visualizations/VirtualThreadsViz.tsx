import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Play, Pause, RotateCcw, ChevronLeft, ChevronRight, Zap, Server, Layers } from "lucide-react";

const STEPS_COUNT = 4;

// 동시성 기술 종합 비교 표 데이터 (100% 한글)
const COMPARISON_DATA = [
  {
    feature: "동시성 매커니즘",
    vt: "JVM 런타임 M:N 경량 스레드 (캐리어 스레드 분리)",
    webflux: "이벤트 루프 기반 논블로킹 I/O (Netty / Reactor)",
    coroutines: "언어 컴파일러 기반 CPS (컨티뉴에이션 전파) 상태머신"
  },
  {
    feature: "프로그래밍 스타일",
    vt: "기존 동기 / 직렬 스타일 (작업당 스레드 할당)",
    webflux: "반응형 스트림 함수형 (Mono / Flux 연산자 체인)",
    coroutines: "비동기-동기 통합 (suspend 키워드 & async/await)"
  },
  {
    feature: "블로킹 I/O 처리",
    vt: "자동 언마운트 (캐리어 스레드 자동 해제 및 즉시 재사용)",
    webflux: "블로킹 호출 금지 (이벤트 루프 마비 위험, R2DBC 필수)",
    coroutines: "Dispatchers.IO 스레드 풀로 명시적 이관 처리"
  },
  {
    feature: "기존 코드 호환성",
    vt: "100% 완벽 호환 (JPA, JDBC, Spring MVC 등 기존 코드 그대로)",
    webflux: "낮음 (Reactive 라이브러리로 전체 재작성 필요)",
    coroutines: "중간 (Kotlin 전용, Java 연동 시 CompletableFuture 래핑)"
  },
  {
    feature: "디버깅 & 콜스택",
    vt: "우수 (기존 스레드 Callstack 온전히 유지)",
    webflux: "어려움 (Reactive 연산자 체인으로 Callstack 유실)",
    coroutines: "양호 (코루틴 스택트레이스 및 구조적 동시성 지원)"
  },
  {
    feature: "주요 제약 및 주의점",
    vt: "synchronized 블록 / Native 메서드 내 블로킹 시 핀닝(Pinning) 발생",
    webflux: "높은 학습 곡선, 실수로 블로킹 코드 유입 시 전체 서비스 장애",
    coroutines: "suspend 키워드가 호출 함수 체인 전체로 전파됨"
  }
];

export default function VirtualThreadsViz() {
  const [activeTab, setActiveTab] = useState<"before" | "after">("after");
  const [activeStep, setActiveStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  // 1.5배 느린 4500ms속도 고정
  const speedMs = 4500;

  // Auto-play 타이머 설정
  useEffect(() => {
    if (!isPlaying) return;

    const timer = setTimeout(() => {
      setActiveStep((prev) => {
        if (prev >= STEPS_COUNT - 1) {
          return 0;
        }
        return prev + 1;
      });
    }, speedMs);

    return () => clearTimeout(timer);
  }, [isPlaying, activeStep, speedMs]);

  const handleNext = () => {
    setActiveStep((prev) => (prev < STEPS_COUNT - 1 ? prev + 1 : 0));
  };

  const handlePrev = () => {
    setActiveStep((prev) => (prev > 0 ? prev - 1 : STEPS_COUNT - 1));
  };

  const handleReset = () => {
    setActiveStep(0);
    setIsPlaying(false);
  };

  return (
    <div className="w-full max-w-5xl mx-auto space-y-4">
      {/* 가상 스레드 적용 전/후 선택 탭 2개 */}
      <div className="grid grid-cols-2 gap-2.5 p-1 bg-muted/30 border border-border/80 rounded-xl">
        <button
          onClick={() => {
            setActiveTab("before");
            setActiveStep(0);
          }}
          className={`flex items-center justify-center gap-2 py-2 px-4 rounded-lg font-semibold text-xs sm:text-sm transition-all ${
            activeTab === "before"
              ? "bg-card text-amber-600 dark:text-amber-400 shadow-2xs border border-amber-500/30"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-amber-500"></span>
          <span>적용 전: 기존 플랫폼 스레드 (1:1 매핑)</span>
        </button>

        <button
          onClick={() => {
            setActiveTab("after");
            setActiveStep(0);
          }}
          className={`flex items-center justify-center gap-2 py-2 px-4 rounded-lg font-semibold text-xs sm:text-sm transition-all ${
            activeTab === "after"
              ? "bg-card text-blue-600 dark:text-blue-400 shadow-2xs border border-blue-500/30"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Zap className="w-3.5 h-3.5 text-blue-500" />
          <span>적용 후: Java 21 가상 스레드 (M:N 매핑)</span>
        </button>
      </div>

      {/* 부가설명 및 속도 UI가 제거된 순수 극초슬림 재생 바 */}
      <div className="flex items-center justify-between gap-3 px-3 py-1.5 bg-card/80 backdrop-blur-xs border border-border/70 rounded-lg text-xs">
        {/* 미니멀 컨트롤 버튼들 */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={handlePrev}
            className="p-1 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
            title="이전 단계"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-primary text-primary-foreground text-[11px] font-medium hover:bg-primary/90 transition-colors"
          >
            {isPlaying ? (
              <>
                <Pause className="w-3 h-3" /> 정지
              </>
            ) : (
              <>
                <Play className="w-3 h-3" /> 재생
              </>
            )}
          </button>
          <button
            onClick={handleNext}
            className="p-1 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
            title="다음 단계"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleReset}
            className="p-1 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors ml-0.5"
            title="처음으로"
          >
            <RotateCcw className="w-3 h-3" />
          </button>
        </div>

        {/* 게이지 바 & 인덱스 뱃지 */}
        <div className="flex-1 flex items-center gap-3.5 mx-2">
          <div className="flex-1 bg-muted/60 h-1 rounded-full overflow-hidden">
            <motion.div
              className={`h-full rounded-full ${activeTab === "before" ? "bg-amber-500" : "bg-blue-500"}`}
              initial={false}
              animate={{ width: `${((activeStep + 1) / STEPS_COUNT) * 100}%` }}
              transition={{ duration: 0.4 }}
            />
          </div>
          <span className="font-mono text-[11px] font-semibold text-muted-foreground shrink-0">
            {activeStep + 1} / {STEPS_COUNT}
          </span>
        </div>
      </div>

      {/* 시각화 캔버스 (800x400) */}
      <div className="relative border border-border/80 rounded-2xl bg-card overflow-hidden shadow-xs">
        <div className="p-2.5 bg-muted/20 border-b border-border/60 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 font-semibold text-foreground">
            <Server className="w-4 h-4 text-blue-500" />
            <span>
              {activeTab === "before"
                ? "기존 플랫폼 스레드 세로 흐름 (1:1 매핑)"
                : "Java 21 가상 스레드 세로 흐름 (M:N 매핑)"}
            </span>
          </div>
          <div className="flex items-center gap-3 text-[11px] text-muted-foreground font-sans">
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block"></span> 1. 요청
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block"></span> 2. 스레드
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span> 3. I/O &amp; 응답
            </span>
          </div>
        </div>

        <div className="w-full aspect-[800/400] relative">
          <svg viewBox="0 0 800 400" className="w-full h-full">
            <defs>
              <pattern id="vt-grid-v-full-clean" width="20" height="20" patternUnits="userSpaceOnUse">
                <path d="M 20 0 L 0 0 0 20" fill="none" className="stroke-zinc-200/50 dark:stroke-zinc-800/40" strokeWidth="1" />
              </pattern>
            </defs>

            {/* Background Grid */}
            <rect width="800" height="400" fill="url(#vt-grid-v-full-clean)" className="fill-slate-50/50 dark:fill-zinc-950/50" />

            {/* Central vertical flow line */}
            <line x1="400" y1="12" x2="400" y2="388" className="stroke-border/40" strokeDasharray="3 3" />

            {/* 1층: [상단] 클라이언트 HTTP 요청 진입 (height 72) */}
            <g>
              <rect x="25" y="12" width="750" height="72" rx="10" className="fill-blue-500/5 stroke-blue-500/20 stroke-1" />
              <text x="400" y="28" textAnchor="middle" className="text-xs font-bold fill-blue-600 dark:fill-blue-400 font-sans">
                [1층] 클라이언트 HTTP 요청 진입
              </text>

              <g>
                {["요청 1 (DB 조회)", "요청 2 (연산)", "요청 3 (연산)", "요청 4 (대기)"].map((req, i) => (
                  <g key={i}>
                    <rect
                      x={40 + i * 185}
                      y={36}
                      width="165"
                      height="38"
                      rx="6"
                      className={
                        activeStep >= 0 && i === 3 && activeTab === "before"
                          ? "fill-red-500/15 stroke-red-500/40 stroke-1.5"
                          : activeStep >= 0 && i < 3
                          ? "fill-background stroke-blue-400 stroke-1.5"
                          : "fill-background stroke-border stroke-1"
                      }
                    />
                    <text x={122 + i * 185} y={59} textAnchor="middle" className="text-xs font-bold fill-foreground font-sans">
                      {req}
                    </text>
                  </g>
                ))}
              </g>
            </g>

            {/* 2층: [중상단] 스레드 레이어 (height 100) */}
            {activeTab === "before" ? (
              /* 적용 전: 플랫폼 스레드 */
              <g key="tab-before-full-clean">
                <rect x="25" y="96" width="750" height="100" rx="10" className="fill-amber-500/5 stroke-amber-500/30 stroke-1" />
                <text x="400" y="114" textAnchor="middle" className="text-xs font-bold fill-amber-600 dark:fill-amber-400 font-sans">
                  [2층] JVM 플랫폼 스레드 풀 (1:1 OS 스레드 매핑)
                </text>

                <g>
                  {/* 스레드 1 */}
                  <rect x="40" y="124" width="225" height="62" rx="7" className={activeStep >= 1 ? "fill-amber-500/10 stroke-amber-500 stroke-1.5" : "fill-background stroke-border stroke-1"} />
                  <text x="152" y="144" textAnchor="middle" className="text-xs font-bold fill-amber-600 dark:fill-amber-400 font-sans">스레드 #1 (~1MB)</text>
                  <text x="152" y="160" textAnchor="middle" className="text-[10px] fill-foreground font-sans">담당: 요청 1</text>
                  <text x="152" y="176" textAnchor="middle" className={`text-[10px] font-bold font-sans ${activeStep >= 1 ? "fill-red-500" : "fill-muted-foreground"}`}>
                    {activeStep >= 1 ? "상태: WAITING 락" : "상태: 준비 완료"}
                  </text>

                  {/* 스레드 2 */}
                  <rect x="287" y="124" width="225" height="62" rx="7" className="fill-background stroke-border stroke-1" />
                  <text x="400" y="144" textAnchor="middle" className="text-xs font-bold fill-foreground font-sans">스레드 #2 (~1MB)</text>
                  <text x="400" y="160" textAnchor="middle" className="text-[10px] fill-foreground font-sans">담당: 요청 2</text>
                  <text x="400" y="176" textAnchor="middle" className="text-[10px] fill-emerald-600 dark:fill-emerald-400 font-sans font-bold">상태: 연산 실행 중</text>

                  {/* 스레드 3 */}
                  <rect x="535" y="124" width="225" height="62" rx="7" className="fill-background stroke-border stroke-1" />
                  <text x="647" y="144" textAnchor="middle" className="text-xs font-bold fill-foreground font-sans">스레드 #3 (~1MB)</text>
                  <text x="647" y="160" textAnchor="middle" className="text-[10px] fill-foreground font-sans">담당: 요청 3</text>
                  <text x="647" y="176" textAnchor="middle" className="text-[10px] fill-emerald-600 dark:fill-emerald-400 font-sans font-bold">상태: 연산 실행 중</text>
                </g>
              </g>
            ) : (
              /* 적용 후: 가상 스레드 & 캐리어 스레드 */
              <g key="tab-after-full-clean">
                <rect x="25" y="96" width="750" height="100" rx="10" className="fill-blue-500/5 stroke-blue-500/30 stroke-1" />
                <text x="400" y="114" textAnchor="middle" className="text-xs font-bold fill-blue-600 dark:fill-blue-400 font-sans">
                  [2층] Java 21 가상 스레드 큐 &amp; 캐리어 스레드 (M:N 매핑)
                </text>

                <g>
                  {/* 캐리어 스레드 1 */}
                  <rect x="40" y="124" width="350" height="62" rx="7" className="fill-background stroke-blue-500 stroke-1.5" />
                  <text x="215" y="143" textAnchor="middle" className="text-xs font-bold fill-amber-600 dark:fill-amber-400 font-sans">캐리어 스레드 #1 (OS 스레드)</text>
                  <rect x="50" y="150" width="330" height="30" rx="5" className={activeStep === 2 ? "fill-emerald-500/20 stroke-emerald-500 stroke-1" : "fill-blue-500/15 stroke-blue-500 stroke-1"} />
                  <text x="215" y="169" textAnchor="middle" className="text-xs font-bold fill-blue-600 dark:fill-blue-400 font-sans">
                    {activeStep === 2 ? "마운트: 가상스레드 3 (즉시 마운트)" : "마운트: 가상스레드 1"}
                  </text>

                  {/* 캐리어 스레드 2 */}
                  <rect x="410" y="124" width="350" height="62" rx="7" className="fill-background stroke-blue-500 stroke-1.5" />
                  <text x="585" y="143" textAnchor="middle" className="text-xs font-bold fill-amber-600 dark:fill-amber-400 font-sans">캐리어 스레드 #2 (OS 스레드)</text>
                  <rect x="420" y="150" width="330" height="30" rx="5" className={activeStep === 3 ? "fill-emerald-500/20 stroke-emerald-500 stroke-1" : "fill-blue-500/15 stroke-blue-500 stroke-1"} />
                  <text x="585" y="169" textAnchor="middle" className="text-xs font-bold fill-blue-600 dark:fill-blue-400 font-sans">
                    {activeStep === 3 ? "리마운트: 가상스레드 1" : "마운트: 가상스레드 2"}
                  </text>
                </g>
              </g>
            )}

            {/* 3층: [중하단] 상태 저장 & 대기 메모리 (height 85) */}
            {activeTab === "before" ? (
              /* 적용 전: 스레드 WAITING 락킹 박스 */
              <g key="tab-before-mem-full-clean">
                <rect x="25" y="208" width="750" height="85" rx="10" className="fill-red-500/5 stroke-red-500/30 stroke-1.5" />
                <text x="400" y="226" textAnchor="middle" className="text-xs font-bold fill-red-500 dark:fill-red-400 font-sans">
                  [3층] 스레드 WAITING 차단 현상 (자원 낭비 발생)
                </text>

                <rect x="40" y="235" width="720" height="48" rx="6" className="fill-background stroke-red-400 stroke-1" />
                <text x="400" y="255" textAnchor="middle" className="text-xs font-bold fill-red-500 font-sans">
                  {activeStep >= 1
                    ? "🔴 스레드 #1이 DB 응답을 기다리며 OS 스레드 전체가 멈춤!"
                    : "⚪ DB 호출 준비 중"}
                </text>
                <text x="400" y="272" textAnchor="middle" className="text-[10px] fill-muted-foreground font-sans">
                  응답이 올 때까지 스레드 #1은 다른 작업을 절대 수행하지 못함 (스레드 고갈 원인)
                </text>
              </g>
            ) : (
              /* 적용 후: 컨티뉴에이션 힙 언마운트 박스 */
              <g key="tab-after-mem-full-clean">
                <rect x="25" y="208" width="750" height="85" rx="10" className="fill-purple-500/5 stroke-purple-500/30 stroke-1.5" />
                <text x="400" y="226" textAnchor="middle" className="text-xs font-bold fill-purple-600 dark:fill-purple-400 font-sans">
                  [3층] 컨티뉴에이션 힙 메모리 (언마운트 저장소)
                </text>

                <rect x="40" y="235" width="720" height="48" rx="6" className="fill-background stroke-purple-400 stroke-1" />
                <text x="400" y="255" textAnchor="middle" className="text-xs font-bold fill-purple-600 dark:fill-purple-400 font-sans">
                  {activeStep >= 2 && activeStep < 3
                    ? "⚡ 가상스레드 1 상태 힙에 저장(언마운트) ➔ 캐리어 스레드 #1 즉시 해제!"
                    : activeStep >= 3
                    ? "✅ DB 응답 수신 ➔ 힙에서 깨어나 가용 캐리어 스레드 #2에 리마운트!"
                    : "⚪ 가상스레드 정상 연산 실행 중"}
                </text>
                <text x="400" y="272" textAnchor="middle" className="text-[10px] fill-muted-foreground font-sans">
                  I/O 대기 시 OS 스레드를 붙잡지 않고 즉시 양보하여 최고 동시성 달성
                </text>
              </g>
            )}

            {/* 4층: [하단] 데이터베이스 / 외부 API (height 80) */}
            <g>
              <rect x="25" y="305" width="750" height="80" rx="10" className="fill-emerald-500/5 stroke-emerald-500/30 stroke-1.5" />
              <text x="400" y="323" textAnchor="middle" className="text-xs font-bold fill-emerald-600 dark:fill-emerald-400 font-sans">
                [4층] 데이터베이스 / 외부 API (I/O 작업 수행)
              </text>

              <rect x="40" y="331" width="720" height="46" rx="6" className="fill-background stroke-border stroke-1" />
              <text x="400" y="348" textAnchor="middle" className="text-xs font-bold fill-foreground font-sans">
                SQL 쿼리 및 네트워크 패킷 처리 (~500ms 소모)
              </text>

              <rect x="60" y="354" width="680" height="20" rx="4" className={activeStep >= 3 ? "fill-emerald-500/20 stroke-emerald-500 stroke-1" : "fill-muted/30 stroke-border stroke-1"} />
              <text x="400" y="368" textAnchor="middle" className="text-[10px] font-bold font-sans fill-emerald-600 dark:fill-emerald-400">
                {activeStep >= 3 ? "📦 SQL 결과 데이터 생성 ➔ 클라이언트로 응답 전송 완료!" : "⏳ DB 연산 처리 중..."}
              </text>
            </g>

            {/* 단계별 이동 애니메이션 패킷 */}
            {activeStep === 0 && (
              <motion.circle
                key={`flow-step-0-${activeTab}`}
                r="5"
                className="fill-blue-500"
                animate={{ cx: [122, 122], cy: [74, 124] }}
                transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
              />
            )}

            {activeStep === 1 && (
              <motion.circle
                key={`flow-step-1-${activeTab}`}
                r="5"
                className="fill-amber-500"
                animate={{ cx: [152, 152], cy: [186, 331] }}
                transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
              />
            )}

            {activeStep === 2 && (
              <motion.circle
                key={`flow-step-2-${activeTab}`}
                r="5"
                className={activeTab === "before" ? "fill-red-500" : "fill-purple-500"}
                animate={{
                  cx: activeTab === "before" ? [152, 152] : [215, 400],
                  cy: activeTab === "before" ? [186, 235] : [186, 235]
                }}
                transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
              />
            )}

            {activeStep === 3 && (
              <motion.circle
                key={`flow-step-3-${activeTab}`}
                r="5"
                className="fill-emerald-500"
                animate={{ cx: [400, 400], cy: [354, 74] }}
                transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut" }}
              />
            )}
          </svg>
        </div>
      </div>

      {/* 동시성 기술 종합 비교 표 (Comparison Table) - 시각화 하단 배치 */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <h3 className="text-sm sm:text-base font-semibold text-foreground flex items-center gap-2">
            <Layers className="w-4 h-4 text-blue-500" />
            <span>동시성 기술 종합 비교표 (가상 스레드 vs WebFlux vs 코루틴)</span>
          </h3>
          <span className="text-xs text-muted-foreground font-sans font-semibold">Java 21 LTS 기준</span>
        </div>

        <div className="overflow-x-auto border border-border/60 rounded-xl bg-card shadow-2xs">
          <table className="w-full text-xs sm:text-sm border-collapse">
            <thead>
              <tr className="border-b border-border bg-muted/40 text-muted-foreground font-semibold">
                <th className="text-left py-3 px-4 w-1/5 text-xs uppercase tracking-wider font-sans">비교 항목</th>
                <th className="text-left py-3 px-4 w-4/15 text-blue-600 dark:text-blue-400 font-bold font-sans">
                  Java 가상 스레드
                </th>
                <th className="text-left py-3 px-4 w-4/15 text-emerald-600 dark:text-emerald-400 font-bold font-sans">
                  Spring WebFlux
                </th>
                <th className="text-left py-3 px-4 w-4/15 text-purple-600 dark:text-purple-400 font-bold font-sans">
                  Kotlin 코루틴
                </th>
              </tr>
            </thead>
            <tbody>
              {COMPARISON_DATA.map((row, idx) => (
                <tr
                  key={row.feature}
                  className={`border-b border-border/40 last:border-none hover:bg-muted/20 transition-colors ${
                    idx % 2 === 0 ? "bg-muted/10" : ""
                  }`}
                >
                  <td className="py-3 px-4 font-semibold text-foreground text-xs sm:text-sm align-top font-sans">
                    {row.feature}
                  </td>
                  <td className="py-3 px-4 text-xs sm:text-sm text-foreground/90 leading-relaxed align-top font-sans">
                    {row.vt}
                  </td>
                  <td className="py-3 px-4 text-xs sm:text-sm text-foreground/90 leading-relaxed align-top font-sans">
                    {row.webflux}
                  </td>
                  <td className="py-3 px-4 text-xs sm:text-sm text-foreground/90 leading-relaxed align-top font-sans">
                    {row.coroutines}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
