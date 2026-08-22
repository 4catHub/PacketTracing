import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import {
  Play,
  Pause,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  Clock,
  Cpu,
  Zap,
  Code2,
  Workflow,
  History,
  Scale,
  Terminal,
  CheckCircle2,
  AlertTriangle
} from "lucide-react";

// 메인 파이프라인 단계 정의
const PIPELINE_STEPS = [
  {
    step: 0,
    title: "1. 트리거 (Trigger)",
    badge: "Event / Action",
    subtext: "setState() 호출 및 Lane 우선순위 할당",
    desc: "사용자 이벤트나 비동기 액션으로 setState()가 호출되면 스케줄러(Scheduler)에 업데이트가 등록되고 Sync/Transition 등의 Lane 우선순위가 부여됩니다.",
    nodeActive: "trigger",
    color: "#f59e0b" // amber
  },
  {
    step: 1,
    title: "2. 렌더 단계 (Render Phase)",
    badge: "WIP Fiber 생성",
    subtext: "컴포넌트 함수 재실행 및 JSX 파싱",
    desc: "컴포넌트 함수가 재실행되며 JSX가 _jsx() 호출을 통해 가상 DOM 엘리먼트로 변환되고, 백그라운드 메모리에 Work-in-Progress(WIP) Fiber 트리가 빌드됩니다.",
    nodeActive: "render",
    color: "#0284c7" // sky/blue
  },
  {
    step: 2,
    title: "3. 재조정 (Reconciliation & Diffing)",
    badge: "O(n) Heuristic Diffing",
    subtext: "Current 트리와 WIP 트리 비교 및 Effect Tag 마킹",
    desc: "Fiber Reconciler가 Current 트리와 WIP 트리를 비교(Diffing)하여 변경된 노드에 작업 플래그(Placement, Update, Deletion)를 마킹합니다.",
    nodeActive: "reconcile",
    color: "#8b5cf6" // purple
  },
  {
    step: 3,
    title: "4. 커밋 단계 (Commit Phase)",
    badge: "Batch Mutation",
    subtext: "실제 브라우저 DOM 일괄 적용 및 포인터 교체",
    desc: "수집된 변경 사항들을 실제 브라우저 DOM에 단일 배치로 일괄 적용(Mutation)한 후, Root의 current 포인터를 WIP 트리로 스왑(Double Buffering)합니다.",
    nodeActive: "commit",
    color: "#10b981" // emerald
  },
  {
    step: 4,
    title: "5. 페인트 및 비동기 훅 (Paint & Effects)",
    badge: "Passive Effects",
    subtext: "브라우저 화면 픽셀 렌더링 및 useEffect 실행",
    desc: "브라우저 엔진이 변경된 DOM을 바탕으로 레이아웃/페인트를 완료하면, 비동기로 등록된 useEffect 훅들이 순차적으로 실행되며 렌더링 루프가 완료됩니다.",
    nodeActive: "paint",
    color: "#ec4899" // pink
  }
];

// 프레임워크 비교 표 데이터
const FRAMEWORK_TABLE_DATA = [
  {
    name: "Vanilla HTML/JS",
    category: "기본 웹 표준",
    paradigm: "명령형 (Imperative)",
    domMechanism: "직접 DOM 변이 (No VDOM)",
    reactivity: "수동 제어 (이벤트 리스너 & 직접 쿼리)",
    pros: "추가 런타임 제로, 극도로 가벼움",
    cons: "상태 동기화 복잡도 증가, 잦은 Reflow/Repaint 위험",
    badgeColor: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30"
  },
  {
    name: "React (Fiber)",
    category: "선언형 라이브러리",
    paradigm: "선언형 & 함수형",
    domMechanism: "Virtual DOM & Fiber Reconciler",
    reactivity: "불변성(Immutability) 기반 얕은 비교",
    pros: "강력한 컴포넌트 모델, 거대한 생태계, 유연한 동시성",
    cons: "런타임 Reconciler 오버헤드, 수동 최적화 필요(memo)",
    badgeColor: "bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/30"
  },
  {
    name: "Vue 3",
    category: "반응형 프레임워크",
    paradigm: "반응형 템플릿/컴포지션",
    domMechanism: "Proxy 반응성 + 국소 가상 DOM 패치",
    reactivity: "Getter/Setter 자동 의존성 수집",
    pros: "정밀한 국소 업데이트, 수동 최적화 부담 최소",
    cons: "템플릿 기반 제약, Proxy 객체 래핑 오버헤드",
    badgeColor: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
  },
  {
    name: "Svelte 5",
    category: "컴파일 타임 프레임워크",
    paradigm: "컴파일 타임 반응형 (Runes)",
    domMechanism: "No VDOM (컴파일된 직접 DOM 갱신)",
    reactivity: "빌드 타임 정적 분석 및 신호(Signal)",
    pros: "가상 DOM 런타임 비용 제로, 극초소형 번들 크기",
    cons: "컴파일러 의존성, 생태계 규모 상대적 작음",
    badgeColor: "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/30"
  },
  {
    name: "Angular",
    category: "엔터프라이즈 통합",
    paradigm: "풀스택 MVC / 컴포넌트",
    domMechanism: "증분 DOM (Incremental DOM)",
    reactivity: "Zone.js 변경 감지 / Signals",
    pros: "DI, 라우팅, 폼 내장 일체형 구조, 표준화 용이",
    cons: "높은 학습 곡선, 무거운 초기 로드 번들 용량",
    badgeColor: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30"
  }
];

// React 진화 타임라인 탑다운 데이터
const EVOLUTION_TIMELINE = [
  {
    version: "React 0.3 ~ 15",
    period: "2013 - 2016",
    title: "Stack Reconciler & 선언적 UI의 탄생",
    tags: ["React.createClass", "Virtual DOM", "동기식 재귀 렌더링"],
    desc: "UI = f(state)라는 선언형 모델을 세상에 알렸으나, 자바스크립트 Call Stack 기반의 동기식 재귀 Reconciler로 인해 대규모 컴포넌트 트리 렌더링 시 브라우저 메인 스레드가 완전히 멈추는 Jank 현상이 발생했습니다."
  },
  {
    version: "React 16.0",
    period: "2017",
    title: "Fiber 아키텍처 전면 도입",
    tags: ["Fiber Reconciler", "Time Slicing", "Error Boundaries", "Portals"],
    desc: "재조정 엔진을 링크드 리스트 기반의 Fiber 구조로 전면 재작성하여 렌더링 연산을 잘게 쪼개어 중단, 재개, 폐기할 수 있는 스케줄링 기반 아키텍처를 완성했습니다."
  },
  {
    version: "React 16.8",
    period: "2019",
    title: "React Hooks 공식 출시",
    tags: ["useState / useEffect", "Custom Hooks", "함수형 컴포넌트 표준"],
    desc: "클래스 컴포넌트의 복잡한 this 바인딩과 분산된 생명주기 메서드(componentDidMount, componentDidUpdate) 문제를 해결하고, 함수형 컴포넌트에서 상태와 부작용 로직을 독립적으로 재사용하는 패러다임 전환을 완성했습니다."
  },
  {
    version: "React 17",
    period: "2020",
    title: "점진적 업그레이드 지원 (Stepping Stone)",
    tags: ["새 JSX 트랜스폼(_jsx)", "루트 컨테이너 이벤트 위임"],
    desc: "document 전역 이벤트 바인딩을 React Root 컨테이너로 이전하여 단일 웹 애플리케이션 내에서 서로 다른 React 버전이 충돌 없이 공존할 수 있는 기반을 마련했습니다."
  },
  {
    version: "React 18",
    period: "2022",
    title: "동시성 렌더러 (Concurrent Mode) & Suspense",
    tags: ["useTransition", "Automatic Batching", "Streaming SSR with Suspense"],
    desc: "동시성(Concurrency) 렌더링 엔진이 정식 활성화되어 긴급한 입력과 화면 전환 작업의 우선순위를 분리하고, 서버 사이드 렌더링 시 Suspense 기반 HTML 스트리밍 및 점진적 하이드레이션을 지원했습니다."
  },
  {
    version: "React 19+",
    period: "2024 ~ 현재",
    title: "React Server Components (RSC) & React Compiler",
    tags: ["RSC 표준화", "Server Actions", "React Compiler (자동 메모이제이션)"],
    desc: "서버에서만 실행되어 클라이언트 번들 크기를 0으로 만드는 RSC가 공식 도입되었으며, React Compiler가 빌드 시 컴포넌트와 훅의 종속성을 자동 분석하여 useMemo/useCallback 수동 작성의 번거로움을 완전히 제거했습니다."
  }
];

export default function ReactArchitectureViz() {
  const [activeTab, setActiveTab] = useState<"pipeline" | "fiber" | "concurrent">("pipeline");
  const [activeStep, setActiveStep] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(2400); // 1200ms ~ 4000ms
  const [subView, setSubView] = useState<"compare" | "timeline" | "code">("compare");

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const totalSteps = PIPELINE_STEPS.length;
  const currentStepData = PIPELINE_STEPS[activeStep];

  // Auto-play 타이머
  useEffect(() => {
    if (!isPlaying) return;

    timerRef.current = setTimeout(() => {
      setActiveStep((prev) => (prev >= totalSteps - 1 ? 0 : prev + 1));
    }, playbackSpeed);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [isPlaying, activeStep, playbackSpeed, totalSteps]);

  const handlePrev = () => {
    setActiveStep((prev) => (prev > 0 ? prev - 1 : totalSteps - 1));
  };

  const handleNext = () => {
    setActiveStep((prev) => (prev < totalSteps - 1 ? prev + 1 : 0));
  };

  const handleReset = () => {
    setActiveStep(0);
    setIsPlaying(false);
  };

  // 노드 활성화 판별
  const isNodeActive = (nodeId: string) => {
    return currentStepData.nodeActive === nodeId;
  };

  // 패킷 궤적 좌표: 화살표의 시작과 끝을 완벽하게 1:1로 일치 (SVG viewBox 0 0 940 430)
  const getPacketMotion = () => {
    switch (activeStep) {
      case 0:
        // Trigger (x=115, y=110) -> Render Phase Entry (x=115, y=215 -> x=175, y=215)
        return {
          path: "M 115 110 L 115 215 L 175 215",
          cx: [115, 115, 175],
          cy: [110, 215, 215]
        };
      case 1:
        // Render Phase Box (x=335, y=215) -> WIP Fiber Box (x=380, y=215)
        return {
          path: "M 335 215 L 380 215",
          cx: [335, 380],
          cy: [215, 215]
        };
      case 2:
        // WIP Fiber Box (x=545, y=215) -> Commit Phase Box (x=585, y=215)
        return {
          path: "M 545 215 L 585 215",
          cx: [545, 585],
          cy: [215, 215]
        };
      case 3:
        // Commit Phase Box (x=735, y=215) -> Real DOM Tree Box (x=765, y=215)
        return {
          path: "M 735 215 L 765 215",
          cx: [735, 765],
          cy: [215, 215]
        };
      case 4:
        // Real DOM Tree Box (x=840, y=265) -> Screen Paint Box (x=840, y=310) 수직 하향
        return {
          path: "M 840 265 L 840 310",
          cx: [840, 840],
          cy: [265, 310]
        };
      default:
        return {
          path: "M 115 110 L 175 215",
          cx: [115, 175],
          cy: [110, 215]
        };
    }
  };

  const packetMotion = getPacketMotion();

  return (
    <div className="w-full max-w-5xl mx-auto space-y-5">
      {/* 1. 상단 모드 셀렉터 탭 */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 p-1 bg-muted/40 border border-border/70 rounded-xl">
        <button
          onClick={() => {
            setActiveTab("pipeline");
            setActiveStep(0);
          }}
          className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg font-medium text-xs sm:text-sm transition-all ${
            activeTab === "pipeline"
              ? "bg-card text-sky-600 dark:text-sky-400 shadow-2xs border border-sky-500/30 font-semibold"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Workflow className="w-4 h-4 text-sky-500" />
          <span>핵심 렌더 파이프라인 (5단계)</span>
        </button>

        <button
          onClick={() => {
            setActiveTab("fiber");
            setActiveStep(2);
          }}
          className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg font-medium text-xs sm:text-sm transition-all ${
            activeTab === "fiber"
              ? "bg-card text-purple-600 dark:text-purple-400 shadow-2xs border border-purple-500/30 font-semibold"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Cpu className="w-4 h-4 text-purple-500" />
          <span>Fiber 구조 & 더블 버퍼링</span>
        </button>

        <button
          onClick={() => {
            setActiveTab("concurrent");
            setActiveStep(0);
          }}
          className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg font-medium text-xs sm:text-sm transition-all ${
            activeTab === "concurrent"
              ? "bg-card text-emerald-600 dark:text-emerald-400 shadow-2xs border border-emerald-500/30 font-semibold"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Zap className="w-4 h-4 text-emerald-500" />
          <span>동시성(Concurrent) & RSC</span>
        </button>
      </div>

      {/* 2. 컴팩트 슬림 플레이어 컨트롤러 */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 bg-card border border-border/80 rounded-xl text-xs sm:text-sm">
        {/* 컨트롤 버튼 */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={handleReset}
            className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
            title="처음으로 리셋"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <button
            onClick={handlePrev}
            className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
            title="이전 단계"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold transition-colors shadow-2xs"
          >
            {isPlaying ? (
              <>
                <Pause className="w-3.5 h-3.5" /> 일시정지
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" /> 재생
              </>
            )}
          </button>
          <button
            onClick={handleNext}
            className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
            title="다음 단계"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* 속도 조절 */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" /> 속도: {(playbackSpeed / 1000).toFixed(1)}초
          </span>
          <input
            type="range"
            min="1200"
            max="3600"
            step="400"
            value={playbackSpeed}
            onChange={(e) => setPlaybackSpeed(Number(e.target.value))}
            className="w-20 sm:w-24 accent-sky-500 cursor-pointer h-1.5 bg-muted rounded-lg appearance-none"
          />
        </div>

        {/* 현재 단계 진행 바 */}
        <div className="flex-1 min-w-[220px] flex items-center gap-3">
          <div className="text-xs font-semibold text-foreground shrink-0 flex items-center gap-2">
            <span
              className="px-2 py-0.5 rounded text-xs font-bold"
              style={{
                backgroundColor: `${currentStepData.color}20`,
                color: currentStepData.color
              }}
            >
              {currentStepData.badge}
            </span>
            <span className="font-mono text-xs">{activeStep + 1} / {totalSteps}</span>
          </div>
          <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-sky-500 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${((activeStep + 1) / totalSteps) * 100}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>
      </div>

      {/* 3. 메인 SVG 시각화 캔버스 영역 (오버플로우 방지 및 정밀 박스 튜닝) */}
      <div className="relative border border-border/80 rounded-2xl bg-card overflow-hidden shadow-sm">
        {/* 상단 상태 바 */}
        <div className="px-4 py-3 bg-muted/25 border-b border-border/70 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span
              className="w-2.5 h-2.5 rounded-full animate-pulse"
              style={{ backgroundColor: currentStepData.color }}
            />
            <span className="font-bold text-sm text-foreground">{currentStepData.title}</span>
            <span className="text-xs text-muted-foreground hidden sm:inline">— {currentStepData.subtext}</span>
          </div>
          <span className="text-xs font-mono font-medium text-muted-foreground bg-muted/80 px-2.5 py-1 rounded-md border border-border/50">
            React Lifecycle Engine
          </span>
        </div>

        {/* 탭 1: 핵심 5단계 렌더 파이프라인 (박스 및 텍스트 튜닝 완료) */}
        {activeTab === "pipeline" && (
          <div className="p-3 sm:p-5 flex justify-center">
            <svg
              viewBox="0 0 940 430"
              className="w-full h-auto max-h-[460px] select-none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                <pattern id="grid-dots" width="24" height="24" patternUnits="userSpaceOnUse">
                  <circle cx="2" cy="2" r="1.2" className="fill-zinc-300 dark:fill-zinc-800" />
                </pattern>

                <filter id="glow-react" x="-30%" y="-30%" width="160%" height="160%">
                  <feDropShadow dx="0" dy="0" stdDeviation="5" floodColor="#38bdf8" floodOpacity="0.9" />
                </filter>
                <filter id="glow-purple" x="-30%" y="-30%" width="160%" height="160%">
                  <feDropShadow dx="0" dy="0" stdDeviation="5" floodColor="#a855f7" floodOpacity="0.9" />
                </filter>
                <filter id="glow-emerald" x="-30%" y="-30%" width="160%" height="160%">
                  <feDropShadow dx="0" dy="0" stdDeviation="5" floodColor="#10b981" floodOpacity="0.9" />
                </filter>

                <marker id="arrow" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="6" markerHeight="6" orient="auto">
                  <path d="M 0 1.5 L 8 5 L 0 8.5 z" className="fill-zinc-400 dark:fill-zinc-600" />
                </marker>
                <marker id="arrow-active" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="6" markerHeight="6" orient="auto">
                  <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#0284c7" />
                </marker>
                <marker id="arrow-commit" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="6" markerHeight="6" orient="auto">
                  <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#10b981" />
                </marker>
                <marker id="arrow-paint" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="6" markerHeight="6" orient="auto">
                  <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#ec4899" />
                </marker>
              </defs>

              <rect width="940" height="430" fill="url(#grid-dots)" />

              {/* 렌더 / 커밋 단계 배경 영역 표시 */}
              <g opacity="0.65">
                <rect x="20" y="20" width="545" height="390" rx="14" fill="none" stroke="#38bdf8" strokeWidth="1.5" strokeDasharray="5 5" opacity="0.45" />
                <text x="35" y="44" className="text-xs font-bold fill-sky-600 dark:fill-sky-400 tracking-wider uppercase">
                  Render Phase (비동기 계산 / 순수 함수 / 중단 및 재개 가능)
                </text>

                <rect x="575" y="20" width="345" height="390" rx="14" fill="none" stroke="#10b981" strokeWidth="1.5" strokeDasharray="5 5" opacity="0.45" />
                <text x="590" y="44" className="text-xs font-bold fill-emerald-600 dark:fill-emerald-400 tracking-wider uppercase">
                  Commit Phase (동기 일괄 적용 / DOM 변경)
                </text>
              </g>

              {/* ───────────────── 연결 파이프라인 화살표 선들 ───────────────── */}
              <g fill="none" strokeWidth="2.5">
                {/* 1. Trigger -> Render Phase (직각 꺾임) */}
                <path
                  d="M 115 110 L 115 215 L 175 215"
                  stroke={activeStep >= 1 ? "#0284c7" : "currentColor"}
                  className="stroke-zinc-300 dark:stroke-zinc-750 transition-colors duration-300"
                  markerEnd={activeStep >= 1 ? "url(#arrow-active)" : "url(#arrow)"}
                />

                {/* 2. Render Phase -> Work-in-Progress Fiber Tree (직선 우측 이동) */}
                <path
                  d="M 335 215 L 380 215"
                  stroke={activeStep >= 2 ? "#0284c7" : "currentColor"}
                  className="stroke-zinc-300 dark:stroke-zinc-750 transition-colors duration-300"
                  markerEnd={activeStep >= 2 ? "url(#arrow-active)" : "url(#arrow)"}
                />

                {/* 3. WIP Fiber Tree -> Commit Phase (직선 우측 이동) */}
                <path
                  d="M 545 215 L 585 215"
                  stroke={activeStep >= 3 ? "#8b5cf6" : "currentColor"}
                  className="stroke-zinc-300 dark:stroke-zinc-750 transition-colors duration-300"
                  markerEnd={activeStep >= 3 ? "url(#arrow-active)" : "url(#arrow)"}
                />

                {/* 4. Commit Phase -> Real DOM Tree (직선 우측 이동) */}
                <path
                  d="M 735 215 L 765 215"
                  stroke={activeStep >= 4 ? "#10b981" : "currentColor"}
                  className="stroke-zinc-300 dark:stroke-zinc-750 transition-colors duration-300"
                  markerEnd={activeStep >= 4 ? "url(#arrow-commit)" : "url(#arrow)"}
                />

                {/* 5. Real DOM Tree -> Browser Paint (수직 하향 이동) */}
                <path
                  d="M 840 265 L 840 310"
                  stroke={activeStep === 4 ? "#ec4899" : "currentColor"}
                  className="stroke-zinc-300 dark:stroke-zinc-750 transition-colors duration-300"
                  markerEnd={activeStep === 4 ? "url(#arrow-paint)" : "url(#arrow)"}
                />
              </g>

              {/* ───────────────── 흘러가는 패킷 애니메이션 (화살표 경로와 100% 일치) ───────────────── */}
              {packetMotion && (
                <motion.circle
                  key={`packet-${activeStep}`}
                  initial={{
                    cx: packetMotion.cx[0],
                    cy: packetMotion.cy[0],
                    opacity: 0,
                    scale: 0.8
                  }}
                  animate={{
                    cx: packetMotion.cx,
                    cy: packetMotion.cy,
                    opacity: [0, 1, 1],
                    scale: [0.9, 1.3, 1.1]
                  }}
                  transition={{
                    duration: Math.max(0.65, playbackSpeed / 2200),
                    ease: "easeInOut"
                  }}
                  r={7}
                  fill={currentStepData.color}
                  filter="url(#glow-react)"
                />
              )}

              {/* 노드 1: Trigger / State Update (x: 30~200, y: 50~110, width=170) */}
              <g className="transition-all duration-300">
                <rect
                  x={30}
                  y={50}
                  width={170}
                  height={60}
                  rx={10}
                  className="fill-white dark:fill-zinc-900 stroke-zinc-200 dark:stroke-zinc-800"
                  stroke={isNodeActive("trigger") ? "#f59e0b" : undefined}
                  strokeWidth={isNodeActive("trigger") ? 3 : 1.5}
                />
                <circle cx={52} cy={72} r={8} fill="#f59e0b" fillOpacity="0.25" />
                <circle cx={52} cy={72} r={4} fill="#f59e0b" />
                <text x={68} y={76} className="text-xs font-bold fill-zinc-900 dark:fill-zinc-100">
                  State / Action 변경
                </text>
                <text x={115} y={96} textAnchor="middle" className="text-xs font-mono font-medium fill-amber-600 dark:fill-amber-400">
                  setCount(c =&gt; c + 1)
                </text>
              </g>

              {/* 노드 2: Component Run & JSX (x: 175~335, y: 155~275, width=160) */}
              <g className="transition-all duration-300">
                <rect
                  x={175}
                  y={155}
                  width={160}
                  height={120}
                  rx={10}
                  className="fill-white dark:fill-zinc-900 stroke-zinc-200 dark:stroke-zinc-800"
                  stroke={isNodeActive("render") ? "#0284c7" : undefined}
                  strokeWidth={isNodeActive("render") ? 3 : 1.5}
                  filter={isNodeActive("render") ? "url(#glow-react)" : undefined}
                />
                <text x={255} y={178} textAnchor="middle" className="text-xs font-bold fill-sky-600 dark:fill-sky-400 uppercase tracking-wider">
                  Render Phase
                </text>
                <text x={255} y={198} textAnchor="middle" className="text-xs sm:text-sm font-bold fill-zinc-900 dark:fill-zinc-100">
                  Component() 실행
                </text>
                <rect x={187} y={210} width={136} height={52} rx={6} className="fill-zinc-100 dark:fill-zinc-800/90 stroke-zinc-200 dark:stroke-zinc-700" strokeWidth="1" />
                <text x={255} y={228} textAnchor="middle" className="text-[11px] font-mono fill-zinc-700 dark:fill-zinc-300">
                  JSX → _jsx("button")
                </text>
                <text x={255} y={248} textAnchor="middle" className="text-[11px] font-mono font-bold fill-sky-600 dark:fill-sky-400">
                  가상 DOM 객체 반환
                </text>
              </g>

              {/* 노드 3: Fiber WIP Tree (x: 380~545, y: 145~285, width=165) */}
              <g className="transition-all duration-300">
                <rect
                  x={380}
                  y={145}
                  width={165}
                  height={140}
                  rx={10}
                  className="fill-white dark:fill-zinc-900 stroke-zinc-200 dark:stroke-zinc-800"
                  stroke={isNodeActive("reconcile") ? "#8b5cf6" : undefined}
                  strokeWidth={isNodeActive("reconcile") ? 3 : 1.5}
                  filter={isNodeActive("reconcile") ? "url(#glow-purple)" : undefined}
                />
                <text x={462} y={168} textAnchor="middle" className="text-xs font-bold fill-purple-600 dark:fill-purple-400 uppercase tracking-wider">
                  Reconciliation
                </text>
                <text x={462} y={188} textAnchor="middle" className="text-xs sm:text-sm font-bold fill-zinc-900 dark:fill-zinc-100">
                  Fiber WIP 트리 Diffing
                </text>

                {/* 미니 Fiber 트리 구조 */}
                <circle cx={462} cy={210} r={5.5} className="fill-zinc-300 dark:fill-zinc-700" />
                <circle cx={432} cy={234} r={5.5} className="fill-zinc-300 dark:fill-zinc-700" />
                <circle cx={492} cy={234} r={5.5} fill={isNodeActive("reconcile") ? "#8b5cf6" : "#cbd5e1"} />
                <line x1={462} y1={210} x2={432} y2={234} stroke="currentColor" className="stroke-zinc-300 dark:stroke-zinc-700" strokeWidth="1.5" />
                <line x1={462} y1={210} x2={492} y2={234} stroke="currentColor" className="stroke-zinc-300 dark:stroke-zinc-700" strokeWidth="1.5" />
                
                <rect x={395} y={250} width={135} height={24} rx={4} className="fill-purple-500/10 stroke-purple-500/30" strokeWidth="1" />
                <text x={462} y={266} textAnchor="middle" className="text-[11px] font-mono font-bold fill-purple-600 dark:fill-purple-300">
                  [Flags: Update]
                </text>
              </g>

              {/* 노드 4: Commit Phase (x: 585~735, y: 155~275, width=150) */}
              <g className="transition-all duration-300">
                <rect
                  x={585}
                  y={155}
                  width={150}
                  height={120}
                  rx={10}
                  className="fill-white dark:fill-zinc-900 stroke-zinc-200 dark:stroke-zinc-800"
                  stroke={isNodeActive("commit") ? "#10b981" : undefined}
                  strokeWidth={isNodeActive("commit") ? 3 : 1.5}
                  filter={isNodeActive("commit") ? "url(#glow-emerald)" : undefined}
                />
                <text x={660} y={178} textAnchor="middle" className="text-xs font-bold fill-emerald-600 dark:fill-emerald-400 uppercase tracking-wider">
                  Commit Phase
                </text>
                <text x={660} y={198} textAnchor="middle" className="text-xs sm:text-sm font-bold fill-zinc-900 dark:fill-zinc-100">
                  Mutation 일괄 반영
                </text>
                <text x={660} y={218} textAnchor="middle" className="text-[11px] fill-zinc-600 dark:fill-zinc-400">
                  DOM Insert / Update
                </text>
                <rect x={597} y={230} width={126} height={30} rx={4} className="fill-emerald-500/10 stroke-emerald-500/30" strokeWidth="1" />
                <text x={660} y={249} textAnchor="middle" className="text-[11px] font-mono font-bold fill-emerald-600 dark:fill-emerald-400">
                  Double Buffer Swap
                </text>
              </g>

              {/* 노드 5: Real DOM Tree (x: 765~915, y: 155~265, width=150) */}
              <g className="transition-all duration-300">
                <rect
                  x={765}
                  y={155}
                  width={150}
                  height={110}
                  rx={10}
                  className="fill-white dark:fill-zinc-900 stroke-zinc-200 dark:stroke-zinc-800"
                  stroke={isNodeActive("commit") || isNodeActive("paint") ? "#10b981" : undefined}
                  strokeWidth={isNodeActive("commit") || isNodeActive("paint") ? 2.5 : 1.5}
                />
                <text x={840} y={178} textAnchor="middle" className="text-xs font-bold fill-zinc-800 dark:fill-zinc-200">
                  Browser Real DOM
                </text>
                
                {/* Real DOM Tree Nodes */}
                <circle cx={815} cy={200} r={5} className="fill-zinc-300 dark:fill-zinc-700" />
                <circle cx={840} cy={200} r={5} className="fill-zinc-300 dark:fill-zinc-700" />
                <circle cx={865} cy={200} r={5} fill={isNodeActive("commit") || isNodeActive("paint") ? "#10b981" : "#cbd5e1"} />
                
                <text x={840} y={228} textAnchor="middle" className="text-[11px] font-mono font-bold fill-emerald-600 dark:fill-emerald-400">
                  &lt;button&gt; 텍스트 변경
                </text>
                <text x={840} y={246} textAnchor="middle" className="text-[10.5px] text-zinc-500">
                  배치(Batch) 반영 완료
                </text>
              </g>

              {/* 노드 6: Browser Paint & Passive Effects (x: 765~915, y: 310~395, width=150) */}
              <g className="transition-all duration-300">
                <rect
                  x={765}
                  y={310}
                  width={150}
                  height={88}
                  rx={10}
                  className="fill-white dark:fill-zinc-900 stroke-zinc-200 dark:stroke-zinc-800"
                  stroke={isNodeActive("paint") ? "#ec4899" : undefined}
                  strokeWidth={isNodeActive("paint") ? 3 : 1.5}
                />
                <text x={840} y={332} textAnchor="middle" className="text-xs font-bold fill-pink-600 dark:fill-pink-400">
                  Screen Paint
                </text>
                <text x={840} y={350} textAnchor="middle" className="text-xs font-semibold fill-zinc-800 dark:fill-zinc-200">
                  화면 픽셀 렌더링 완료
                </text>
                <rect x={775} y={358} width={130} height={26} rx={4} className="fill-pink-500/10 stroke-pink-500/30" strokeWidth="1" />
                <text x={840} y={375} textAnchor="middle" className="text-[10.5px] font-mono font-bold fill-pink-600 dark:fill-pink-400">
                  useEffect() 비동기 실행
                </text>
              </g>
            </svg>
          </div>
        )}

        {/* 탭 2: Fiber 노드 구조 & 더블 버퍼링 상세 */}
        {activeTab === "fiber" && (
          <div className="p-3 sm:p-5 flex justify-center">
            <svg
              viewBox="0 0 940 430"
              className="w-full h-auto max-h-[460px] select-none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                <pattern id="grid-dots-fiber" width="24" height="24" patternUnits="userSpaceOnUse">
                  <circle cx="2" cy="2" r="1.2" className="fill-zinc-300 dark:fill-zinc-800" />
                </pattern>
                <marker id="fiber-arr" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="6" markerHeight="6" orient="auto">
                  <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#0284c7" />
                </marker>
                <marker id="wip-arr" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="6" markerHeight="6" orient="auto">
                  <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#8b5cf6" />
                </marker>
                <marker id="alt-arr" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="6" markerHeight="6" orient="auto">
                  <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#f59e0b" />
                </marker>
              </defs>

              <rect width="940" height="430" fill="url(#grid-dots-fiber)" />

              {/* 2단 더블 버퍼링 구획 */}
              <rect x="30" y="40" width="415" height="260" rx="14" fill="none" stroke="#0284c7" strokeWidth="1.5" strokeDasharray="5 5" className="opacity-45" />
              <text x="50" y="65" className="text-xs font-bold fill-sky-600 dark:fill-sky-400 uppercase tracking-wider">
                Current Fiber Tree (현재 화면에 렌더링 중)
              </text>

              <rect x="495" y="40" width="415" height="260" rx="14" fill="none" stroke="#8b5cf6" strokeWidth="1.5" strokeDasharray="5 5" className="opacity-45" />
              <text x="515" y="65" className="text-xs font-bold fill-purple-600 dark:fill-purple-400 uppercase tracking-wider">
                Work-in-Progress Tree (백그라운드 Diffing 연산 중)
              </text>

              {/* FiberRoot Node */}
              <rect x="395" y="10" width="150" height="40" rx="8" className="fill-zinc-900 text-white dark:fill-zinc-100 stroke-zinc-300 dark:stroke-zinc-700" />
              <text x="470" y="34" textAnchor="middle" className="text-xs font-bold fill-white dark:fill-zinc-900">
                FiberRootNode
              </text>
              <path d="M 430 50 L 260 85" stroke="#0284c7" strokeWidth="2" markerEnd="url(#fiber-arr)" />
              <path d="M 510 50 L 680 85" stroke="#8b5cf6" strokeWidth="2" strokeDasharray="4 4" markerEnd="url(#wip-arr)" />

              {/* Current Root: App Fiber */}
              <g>
                <rect x="180" y="90" width="165" height="75" rx="10" className="fill-white dark:fill-zinc-900 stroke-sky-500/60" strokeWidth="2" />
                <text x="262" y="112" textAnchor="middle" className="text-sm font-bold fill-sky-600 dark:fill-sky-400">App (Fiber)</text>
                <text x="262" y="132" textAnchor="middle" className="text-[11px] font-mono fill-zinc-600 dark:fill-zinc-300">memoizedState: Hook</text>
                <text x="262" y="150" textAnchor="middle" className="text-[10.5px] font-mono fill-zinc-500">child: &lt;Header&gt;</text>
              </g>

              {/* WIP Root: App Fiber */}
              <g>
                <rect x="600" y="90" width="165" height="75" rx="10" className="fill-white dark:fill-zinc-900 stroke-purple-500" strokeWidth="2.5" />
                <text x="682" y="112" textAnchor="middle" className="text-sm font-bold fill-purple-600 dark:fill-purple-400">App (WIP Fiber)</text>
                <text x="682" y="132" textAnchor="middle" className="text-[11px] font-mono font-bold fill-purple-500">stateQueue: count + 1</text>
                <text x="682" y="150" textAnchor="middle" className="text-[10.5px] font-mono fill-zinc-500">flags: Update | Subtree</text>
              </g>

              {/* Alternate 양방향 포인터 */}
              <path d="M 345 127 L 600 127" stroke="#f59e0b" strokeWidth="2" strokeDasharray="4 4" markerEnd="url(#alt-arr)" />
              <text x="472" y="120" textAnchor="middle" className="text-[11px] font-mono font-bold fill-amber-500">alternate ⇄ swap</text>

              {/* Current Child 1: Header */}
              <g>
                <rect x="55" y="200" width="145" height="65" rx="8" className="fill-white dark:fill-zinc-900 stroke-zinc-300 dark:stroke-zinc-700" strokeWidth="1.5" />
                <text x="127" y="224" textAnchor="middle" className="text-xs font-bold fill-zinc-800 dark:fill-zinc-200">&lt;Header /&gt;</text>
                <text x="127" y="244" textAnchor="middle" className="text-[10.5px] font-mono fill-zinc-500">sibling: &lt;Content&gt;</text>
              </g>

              {/* Current Child 2: Content */}
              <g>
                <rect x="255" y="200" width="145" height="65" rx="8" className="fill-white dark:fill-zinc-900 stroke-zinc-300 dark:stroke-zinc-700" strokeWidth="1.5" />
                <text x="327" y="224" textAnchor="middle" className="text-xs font-bold fill-zinc-800 dark:fill-zinc-200">&lt;Content /&gt;</text>
                <text x="327" y="244" textAnchor="middle" className="text-[10.5px] font-mono fill-zinc-500">child: &lt;Button&gt;</text>
              </g>

              {/* WIP Child 1: Header (Bailout) */}
              <g>
                <rect x="520" y="200" width="150" height="65" rx="8" className="fill-white dark:fill-zinc-900 stroke-zinc-300 dark:stroke-zinc-700" strokeWidth="1.5" />
                <text x="595" y="224" textAnchor="middle" className="text-xs font-bold fill-zinc-800 dark:fill-zinc-200">&lt;Header /&gt; (Bailout)</text>
                <text x="595" y="244" textAnchor="middle" className="text-[10.5px] font-mono font-bold fill-emerald-500">재사용 (No Change)</text>
              </g>

              {/* WIP Child 2: Content (Diffing) */}
              <g>
                <rect x="720" y="200" width="150" height="65" rx="8" className="fill-white dark:fill-zinc-900 stroke-purple-500" strokeWidth="2.5" />
                <text x="795" y="224" textAnchor="middle" className="text-xs font-bold fill-purple-600 dark:fill-purple-400">&lt;Content /&gt; (Diffing)</text>
                <text x="795" y="244" textAnchor="middle" className="text-[10.5px] font-mono font-bold fill-purple-500">flags: Update</text>
              </g>

              {/* 포인터 화살표 연결선 */}
              <path d="M 220 165 L 160 200" stroke="#0284c7" strokeWidth="1.5" markerEnd="url(#fiber-arr)" />
              <path d="M 200 232 L 255 232" stroke="#0284c7" strokeWidth="1.5" markerEnd="url(#fiber-arr)" />
              <path d="M 645 165 L 585 200" stroke="#8b5cf6" strokeWidth="1.5" markerEnd="url(#wip-arr)" />
              <path d="M 670 232 L 720 232" stroke="#8b5cf6" strokeWidth="1.5" markerEnd="url(#wip-arr)" />

              {/* 하단 상세 설명 카드 */}
              <g>
                <rect x="50" y="320" width="840" height="78" rx="10" className="fill-muted/70 stroke-border" strokeWidth="1.5" />
                <text x="75" y="346" className="text-sm font-bold fill-foreground">
                  Fiber Reconciler의 3대 링크드 리스트 포인터 체인
                </text>
                <text x="75" y="367" className="text-xs fill-muted-foreground">
                  • child (첫 번째 자식) | • sibling (다음 형제 노드) | • return (완료 후 복귀할 부모 노드)
                </text>
                <text x="75" y="386" className="text-xs fill-muted-foreground">
                  더블 버퍼링: 렌더 완료 시 FiberRoot.current가 WIP 트리를 가리키도록 단일 포인터 연산만으로 고속 교체(Double Buffering Swap)
                </text>
              </g>
            </svg>
          </div>
        )}

        {/* 탭 3: 모던 동시성 & RSC 아키텍처 (텍스트 초과 완벽 교정) */}
        {activeTab === "concurrent" && (
          <div className="p-3 sm:p-5 flex justify-center">
            <svg
              viewBox="0 0 940 430"
              className="w-full h-auto max-h-[460px] select-none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                <pattern id="grid-dots-rsc" width="24" height="24" patternUnits="userSpaceOnUse">
                  <circle cx="2" cy="2" r="1.2" className="fill-zinc-300 dark:fill-zinc-800" />
                </pattern>
                <marker id="stream-arr" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="6" markerHeight="6" orient="auto">
                  <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#10b981" />
                </marker>
              </defs>

              <rect width="940" height="430" fill="url(#grid-dots-rsc)" />

              {/* 서버 영역 */}
              <rect x="25" y="25" width="415" height="380" rx="14" fill="none" stroke="#10b981" strokeWidth="1.5" strokeDasharray="5 5" className="opacity-45" />
              <text x="45" y="50" className="text-xs font-bold fill-emerald-600 dark:fill-emerald-400 uppercase tracking-wider">
                Server Environment (Node.js / Edge Runtime)
              </text>

              {/* 클라이언트 영역 */}
              <rect x="495" y="25" width="420" height="380" rx="14" fill="none" stroke="#0284c7" strokeWidth="1.5" strokeDasharray="5 5" className="opacity-45" />
              <text x="515" y="50" className="text-xs font-bold fill-sky-600 dark:fill-sky-400 uppercase tracking-wider">
                Client Browser (Concurrent Scheduler)
              </text>

              {/* 1. React Server Component (RSC) */}
              <g>
                <rect x="45" y="75" width="180" height="100" rx="10" className="fill-white dark:fill-zinc-900 stroke-emerald-500" strokeWidth="2" />
                <text x="135" y="100" textAnchor="middle" className="text-sm font-bold fill-emerald-600 dark:fill-emerald-400">&lt;ProductList /&gt;</text>
                <text x="135" y="122" textAnchor="middle" className="text-xs font-mono fill-zinc-500">Server Component</text>
                <text x="135" y="142" textAnchor="middle" className="text-[11px] font-mono font-bold fill-emerald-600 dark:fill-emerald-400">DB 직접 쿼리 (SQL)</text>
                <text x="135" y="162" textAnchor="middle" className="text-[10.5px] font-mono fill-zinc-500">0KB Bundle to Client</text>
              </g>

              {/* 2. Flight Stream Payload (박스 너비 확장 및 폰트 크기 튜닝) */}
              <g>
                <rect x="45" y="210" width="375" height="85" rx="8" className="fill-zinc-100 dark:fill-zinc-800/90 stroke-emerald-500/40" strokeWidth="1.5" />
                <text x="65" y="234" className="text-xs font-bold fill-emerald-600 dark:fill-emerald-400">
                  RSC Flight JSON 스트림 (스트리밍 페이로드)
                </text>
                <text x="65" y="255" className="text-[10px] font-mono fill-zinc-700 dark:fill-zinc-300">
                  M1:&#123;"id":"./ClientButton.js","name":"default"&#125;
                </text>
                <text x="65" y="275" className="text-[10px] font-mono fill-zinc-700 dark:fill-zinc-300">
                  J0:["$","div",null,&#123;"children":["$","$L1",null,&#123;&#125;]&#125;]
                </text>
              </g>

              {/* 스트리밍 경로 화살표 */}
              <path d="M 420 252 L 515 252" stroke="#10b981" strokeWidth="2.5" strokeDasharray="5 5" markerEnd="url(#stream-arr)" />
              <text x="467" y="242" textAnchor="middle" className="text-[11px] font-bold fill-emerald-600 dark:fill-emerald-400">
                HTTP 스트림
              </text>

              {/* 3. Client Component */}
              <g>
                <rect x="515" y="75" width="180" height="100" rx="10" className="fill-white dark:fill-zinc-900 stroke-sky-500" strokeWidth="2" />
                <text x="605" y="100" textAnchor="middle" className="text-sm font-bold fill-sky-600 dark:fill-sky-400">&lt;LikeButton /&gt;</text>
                <text x="605" y="122" textAnchor="middle" className="text-xs font-mono fill-zinc-500">'use client' 지시문</text>
                <text x="605" y="142" textAnchor="middle" className="text-[11px] font-mono font-bold fill-sky-600">useState / 이벤트 처리</text>
                <text x="605" y="162" textAnchor="middle" className="text-[10.5px] font-mono fill-zinc-500">Hydration 대상 컴포넌트</text>
              </g>

              {/* 4. Concurrent Scheduler Lane Model (박스 380px 확장 및 텍스트 넘침 완전 교정) */}
              <g>
                <rect x="515" y="200" width="380" height="175" rx="10" className="fill-white dark:fill-zinc-900 stroke-purple-500/60" strokeWidth="1.5" />
                <text x="535" y="224" className="text-xs font-bold fill-purple-600 dark:fill-purple-400 uppercase tracking-wider">
                  Concurrent Scheduler (Lane 우선순위 모델)
                </text>
                
                {/* Lane 1: SyncLane */}
                <rect x="535" y="236" width="340" height="26" rx="4" className="fill-rose-500/10 stroke-rose-500/30" strokeWidth="1" />
                <text x="548" y="253" className="text-[11px] font-mono font-bold fill-rose-600 dark:fill-rose-400">
                  SyncLane (긴급: 키보드 입력, 즉각 클릭)
                </text>

                {/* Lane 2: InputContinuousLane */}
                <rect x="535" y="268" width="340" height="26" rx="4" className="fill-amber-500/10 stroke-amber-500/30" strokeWidth="1" />
                <text x="548" y="285" className="text-[11px] font-mono font-bold fill-amber-600 dark:fill-amber-400">
                  ContinuousLane (드래그, 스크롤 인터랙션)
                </text>

                {/* Lane 3: TransitionLane */}
                <rect x="535" y="300" width="340" height="26" rx="4" className="fill-sky-500/10 stroke-sky-500/30" strokeWidth="1" />
                <text x="548" y="317" className="text-[11px] font-mono font-bold fill-sky-600 dark:fill-sky-400">
                  TransitionLane (useTransition 전환 / 양보 가능)
                </text>

                {/* Lane 4: IdleLane */}
                <rect x="535" y="332" width="340" height="26" rx="4" className="fill-zinc-500/10 stroke-zinc-500/20" strokeWidth="1" />
                <text x="548" y="349" className="text-[10.5px] font-mono fill-zinc-500">
                  IdleLane / Offscreen (화면 밖 백그라운드 프리렌더)
                </text>
              </g>
            </svg>
          </div>
        )}
      </div>

      {/* 4. 하단 상세 인스펙터 서브 탭 (표 기반 비교 및 탑다운 타임라인 가시성 대폭 향상) */}
      <div className="space-y-4 pt-2">
        <div className="flex flex-wrap items-center gap-2 border-b border-border/80 pb-3">
          <button
            onClick={() => setSubView("compare")}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
              subView === "compare"
                ? "bg-primary text-primary-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            }`}
          >
            <Scale className="w-4 h-4" />
            <span>프레임워크 vs Vanilla JS 종합 비교표</span>
          </button>

          <button
            onClick={() => setSubView("timeline")}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
              subView === "timeline"
                ? "bg-primary text-primary-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            }`}
          >
            <History className="w-4 h-4" />
            <span>React 세대별 진화 타임라인 (0.3 → 19+)</span>
          </button>

          <button
            onClick={() => setSubView("code")}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
              subView === "code"
                ? "bg-primary text-primary-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            }`}
          >
            <Code2 className="w-4 h-4" />
            <span>Fiber & JSX 렌더링 코드 구조</span>
          </button>
        </div>

        {/* 서브 뷰 1: 종합 비교표 (Table 형태) */}
        {subView === "compare" && (
          <div className="rounded-xl border border-border/80 bg-card overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-muted/40 border-b border-border/80 text-foreground font-bold">
                    <th className="py-3 px-4 w-[160px]">프레임워크 / 기술</th>
                    <th className="py-3 px-4 w-[140px]">패러다임</th>
                    <th className="py-3 px-4 w-[200px]">DOM 제어 방식</th>
                    <th className="py-3 px-4 w-[180px]">반응성 / 상태 추적</th>
                    <th className="py-3 px-4">핵심 장점</th>
                    <th className="py-3 px-4">주요 한계점</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {FRAMEWORK_TABLE_DATA.map((row, idx) => (
                    <tr
                      key={idx}
                      className="hover:bg-muted/20 transition-colors"
                    >
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-foreground text-sm">{row.name}</div>
                        <span className={`inline-block mt-1 px-1.5 py-0.5 rounded text-[10px] font-mono border ${row.badgeColor}`}>
                          {row.category}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-foreground">
                        {row.paradigm}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-[11px] text-foreground/90">
                        {row.domMechanism}
                      </td>
                      <td className="py-3.5 px-4 text-muted-foreground">
                        {row.reactivity}
                      </td>
                      <td className="py-3.5 px-4 text-emerald-600 dark:text-emerald-400 font-medium">
                        <div className="flex items-start gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                          <span>{row.pros}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-rose-600 dark:text-rose-400 font-medium">
                        <div className="flex items-start gap-1">
                          <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                          <span>{row.cons}</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 서브 뷰 2: React 진화 타임라인 (탑다운 세로 직렬 흐름) */}
        {subView === "timeline" && (
          <div className="relative pl-6 sm:pl-8 border-l-2 border-sky-500/40 space-y-6 ml-3 my-2">
            {EVOLUTION_TIMELINE.map((item, idx) => (
              <div key={idx} className="relative group">
                {/* 타임라인 원형 앵커 포인트 */}
                <div className="absolute -left-[31px] sm:-left-[39px] top-1.5 w-4 h-4 rounded-full bg-card border-2 border-sky-500 flex items-center justify-center">
                  <div className="w-1.5 h-1.5 rounded-full bg-sky-500" />
                </div>

                {/* 타임라인 카드 */}
                <div className="p-4 sm:p-5 rounded-xl border border-border/80 bg-card hover:border-sky-500/40 transition-all shadow-2xs space-y-2.5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <span className="px-2.5 py-1 rounded-md bg-sky-500/10 text-sky-600 dark:text-sky-400 font-mono font-bold text-xs sm:text-sm border border-sky-500/20">
                        {item.version}
                      </span>
                      <h4 className="text-sm sm:text-base font-bold text-foreground">
                        {item.title}
                      </h4>
                    </div>
                    <span className="text-xs font-mono font-semibold text-muted-foreground bg-muted px-2.5 py-0.5 rounded-md">
                      {item.period}
                    </span>
                  </div>

                  {/* 주요 태그들 */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {item.tags.map((tag, tIdx) => (
                      <span
                        key={tIdx}
                        className="px-2 py-0.5 rounded text-[11px] font-mono bg-muted/60 text-muted-foreground border border-border/60"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>

                  {/* 상세 설명 */}
                  <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed pt-1">
                    {item.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 서브 뷰 3: Fiber & JSX 코드 예시 */}
        {subView === "code" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl border border-border/80 bg-card space-y-2.5">
              <div className="flex items-center justify-between border-b border-border/60 pb-2.5">
                <span className="text-xs sm:text-sm font-bold text-foreground flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-sky-500" />
                  JSX 변환 및 가상 DOM 객체 생성
                </span>
                <span className="text-xs font-mono text-muted-foreground bg-muted px-2 py-0.5 rounded">
                  React 19 JSX
                </span>
              </div>
              <pre className="text-xs font-mono leading-relaxed bg-muted/40 p-3.5 rounded-lg overflow-x-auto text-foreground whitespace-pre-wrap">
{`// 1. 개발자가 작성한 선언적 JSX
function Counter() {
  const [count, setCount] = useState(0);
  return (
    <button onClick={() => setCount(c => c + 1)}>
      Count: {count}
    </button>
  );
}

// 2. 컴파일러가 변환한 _jsx 함수 호출 결과 (가상 DOM 객체)
{
  $$typeof: Symbol.for('react.element'),
  type: 'button',
  key: null,
  props: {
    onClick: [Function],
    children: ['Count: ', 0]
  }
}`}
              </pre>
            </div>

            <div className="p-4 rounded-xl border border-border/80 bg-card space-y-2.5">
              <div className="flex items-center justify-between border-b border-border/60 pb-2.5">
                <span className="text-xs sm:text-sm font-bold text-foreground flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-purple-500" />
                  Fiber 노드 내부 링크드 리스트 구조
                </span>
                <span className="text-xs font-mono text-purple-600 dark:text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded">
                  fiberNode.ts
                </span>
              </div>
              <pre className="text-xs font-mono leading-relaxed bg-muted/40 p-3.5 rounded-lg overflow-x-auto text-foreground whitespace-pre-wrap">
{`// React 내부 FiberNode 핵심 속성 구조
interface FiberNode {
  tag: WorkTag;              // 컴포넌트 종류 (Function, HostComponent 등)
  type: any;                 // 함수 참조 또는 DOM 태그명 ('div')
  stateNode: any;            // 실제 브라우저 DOM 노드 인스턴스
  
  // 3대 링크드 리스트 트리 포인터
  return: FiberNode | null;  // 부모 Fiber
  child: FiberNode | null;   // 첫 번째 자식 Fiber
  sibling: FiberNode | null; // 다음 형제 Fiber
  
  // 상태 및 더블 버퍼링
  memoizedState: any;        // Hook 링크드 리스트 체인
  alternate: FiberNode;      // Current ⇄ Work-in-Progress 쌍
  flags: Flags;              // Placement | Update | Deletion
  lanes: Lanes;              // 우선순위 스케줄 비트마스크
}`}
              </pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
