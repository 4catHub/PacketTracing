import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { RotateCcw, ChevronLeft, ChevronRight, Clock, Info } from "lucide-react";

// 글로벌 프레임워크 순서 정의
const FRAMEWORK_ORDER = ["vanilla", "react", "vue", "svelte"];

interface Step {
  title: string;
  subtext: string;
  desc: string;
  nodeActive: "trigger" | "engine" | "buffer" | "dom" | "screen";
}

interface FrameworkData {
  name: string;
  colorClass: string;
  glowColor: string;
  themeColor: string;
  steps: Step[];
}

const FRAMEWORK_DATA: Record<string, FrameworkData> = {
  vanilla: {
    name: "Vanilla JS",
    colorClass: "text-amber-500 dark:text-amber-400 border-amber-500/50 bg-amber-500/5",
    glowColor: "#f59e0b",
    themeColor: "rgb(245, 158, 11)",
    steps: [
      {
        title: "1. 사용자 이벤트 발생",
        subtext: "상태 변경 및 DOM 수동 제어 시작",
        desc: "버튼 클릭 등의 사용자 액션이 발생하여, 상태 값을 변경하고 DOM을 조작하기 위한 자바스크립트 콜백 함수를 실행합니다.",
        nodeActive: "trigger"
      },
      {
        title: "2. DOM 검색 (Query)",
        subtext: "document.getElementById 실행",
        desc: "브라우저 전체 DOM 트리를 순회하여 수정하고자 하는 HTML 요소를 직접 검색하고, 해당 메모리 주소 참조 객체를 획득합니다. (가상 DOM 없음)",
        nodeActive: "dom"
      },
      {
        title: "3. 직접 속성 수정",
        subtext: "element.textContent 변경",
        desc: "검색한 DOM 노드의 내부 텍스트 속성을 메모리 상에서 직접 수정하여 브라우저에 갱신할 텍스트 정보를 주입합니다.",
        nodeActive: "buffer"
      },
      {
        title: "4. 클래스 및 스타일 수정",
        subtext: "classList.add로 스타일 갱신",
        desc: "요소의 스타일 클래스를 직접 변경하여 상태에 맞는 시각적 표현을 준비합니다. 이 과정에서 렌더 트리가 즉시 수정됩니다.",
        nodeActive: "dom"
      },
      {
        title: "5. 브라우저 페인트 완료",
        subtext: "화면 픽셀 리페인트 수행",
        desc: "수정 사항이 브라우저 렌더 엔진에 접수되어 화면을 새로 그립니다. 잦은 직접 조작은 대규모 UI 환경에서 성능 저하를 초래합니다.",
        nodeActive: "screen"
      }
    ]
  },
  react: {
    name: "React (Fiber)",
    colorClass: "text-sky-500 dark:text-sky-400 border-sky-500/50 bg-sky-500/5",
    glowColor: "#38bdf8",
    themeColor: "rgb(56, 189, 248)",
    steps: [
      {
        title: "1. State 상태 변경 요청",
        subtext: "setDone(true) 상태 변경 예약",
        desc: "상태 변수가 업데이트되면 React는 컴포넌트가 업데이트될 대상임을 감지하고, Fiber 스케줄러에 가상 DOM 리렌더링을 예약합니다.",
        nodeActive: "trigger"
      },
      {
        title: "2. 컴포넌트 실행 & VDOM 빌드",
        subtext: "가상 DOM 트리 새로 생성",
        desc: "React 컴포넌트가 재실행되며 새로운 JSX 요소 기반의 가상 DOM 트리를 생성하고, 기존 트리와 구조적 비교(Reconciliation)를 준비합니다.",
        nodeActive: "engine"
      },
      {
        title: "3. Fiber Diffing (비교 연산)",
        subtext: "이전 VDOM과 새로운 VDOM 비교",
        desc: "Fiber Reconciler가 동적 스케줄링을 통해 컴포넌트 변경 사항(Effect List)을 찾아내고, 업데이트가 필요한 DOM 노드만 추려냅니다.",
        nodeActive: "buffer"
      },
      {
        title: "4. DOM Commit (일괄 커밋)",
        subtext: "추출된 변경 정보 일괄 반영",
        desc: "계산된 변경 사항들을 실제 브라우저 DOM에 단 한 번에 배치(Batch) 업데이트 방식으로 일괄 적용(Commit)합니다.",
        nodeActive: "dom"
      },
      {
        title: "5. 브라우저 페인트",
        subtext: "실제 DOM 변경에 따른 리페인트",
        desc: "커밋 완료 후 브라우저가 변경된 실제 DOM 정보를 받아 레이아웃을 다듬고 픽셀을 다시 그려 렌더링 과정을 끝마칩니다.",
        nodeActive: "screen"
      }
    ]
  },
  vue: {
    name: "Vue (Proxy)",
    colorClass: "text-emerald-500 dark:text-emerald-400 border-emerald-500/50 bg-emerald-500/5",
    glowColor: "#10b981",
    themeColor: "rgb(16, 185, 129)",
    steps: [
      {
        title: "1. reactive 상태 쓰기",
        subtext: "반응형 데이터 직접 수정",
        desc: "Vue setup 내 반응형 상태인 ref나 reactive 데이터를 변경합니다. 겉보기에는 값을 할당하는 일반 동작입니다.",
        nodeActive: "trigger"
      },
      {
        title: "2. Proxy Setter 감지",
        subtext: "ES6 Proxy 객체가 값 할당 가로채기",
        desc: "Vue의 반응형 시스템이 Proxy 객체의 set() 트랩을 통해 값이 변경되었음을 즉각 감지하고 인터셉트합니다.",
        nodeActive: "engine"
      },
      {
        title: "3. 종속성 Watcher 통보",
        subtext: "영향을 받는 컴포넌트 목록 수집",
        desc: "미리 추적(Track)해 두었던 종속성 목록 중에서, 해당 값이 변경되었을 때 다시 그려야 하는 Watcher들을 활성화하고 실행 큐에 올립니다.",
        nodeActive: "buffer"
      },
      {
        title: "4. 가상 DOM Patch (정밀 패치)",
        subtext: "컴포넌트 가상 DOM 블록 패치",
        desc: "Watcher가 실행되어 해당 컴포넌트 내부에서 변경된 특정 블록의 가상 DOM만 생성 후 비교(Patch)하여 실시간 변경을 감지합니다.",
        nodeActive: "dom"
      },
      {
        title: "5. 화면 업데이트 & 페인트",
        subtext: "미크로태스크 플러시 및 렌더링",
        desc: "컴포넌트 갱신 마무리에 이어 실제 DOM에 반영하고 브라우저가 화면을 갱신합니다. React 대비 변경 탐색 컴포넌트 범위가 좁아 효율적입니다.",
        nodeActive: "screen"
      }
    ]
  },
  svelte: {
    name: "Svelte (Compiler)",
    colorClass: "text-orange-500 dark:text-orange-400 border-orange-500/50 bg-orange-500/5",
    glowColor: "#f97316",
    themeColor: "rgb(249, 115, 22)",
    steps: [
      {
        title: "1. 변수 할당문 감지",
        subtext: "done = true 일반 할당 감지",
        desc: "코드상에서 일반 변수에 새로운 값을 할당(done = true)하는 동작이 일어납니다. 프레임워크 래퍼 함수가 필요 없습니다.",
        nodeActive: "trigger"
      },
      {
        title: "2. 컴파일 훅 (Dirty Flag 지정)",
        subtext: "더티 비트 마스크에 비트 플래그 설정",
        desc: "Svelte 컴파일러가 빌드할 때 삽입해 둔 $$invalidate() 함수가 실행되어, 값이 바뀐 변수의 고유 인덱스 번호에 해당하는 더티 비트를 켭니다.",
        nodeActive: "engine"
      },
      {
        title: "3. Direct Updater 호출",
        subtext: "컴파일된 p(changed, ctx) 함수 수행",
        desc: "마이크로태스크 큐를 통해 다음 틱에 컴파일 결과물인 업데이트 함수 p()가 호출되며, 변경 상태 인덱(더티 마스크)를 파라미터로 넘깁니다.",
        nodeActive: "buffer"
      },
      {
        title: "4. 가상 DOM 없는 직접 DOM 조작",
        subtext: "해당 요소의 class 직접 토글",
        desc: "가상 DOM이나 런타임에 리프 트리를 통째로 비교하는 과정 없이, 메모리 상에 존재하는 실제 DOM 노드의 주소를 직접 수정합니다.",
        nodeActive: "dom"
      },
      {
        title: "5. 브라우저 페인트 완료",
        subtext: "오버헤드 없는 즉각 화면 갱신",
        desc: "런타임 분석이나 Diffing 가상 돔 엔진 로드가 전혀 없으므로 CPU 연산과 메모리 낭비 없이 매우 빠르고 가볍게 브라우저 화면이 갱신됩니다.",
        nodeActive: "screen"
      }
    ]
  }
};

interface FrameworkDetail {
  title: string;
  concept: string;
  diffs: { title: string; text: string }[];
  description: string;
}

const TAB_DETAILS: Record<string, FrameworkDetail> = {
  vanilla: {
    title: "Vanilla JS",
    concept: "명령형 DOM 조작 & 직접 업데이트",
    description: "Vanilla JS는 가상 DOM이나 별도의 컴포넌트 추적 시스템 없이, 개발자가 브라우저 API를 사용하여 직접 DOM 노드를 제어하는 고전적인 렌더링 방식입니다. 상태가 바뀔 때 마다 직접 타겟 엘리먼트를 수색하고 텍스트 및 클래스명을 하나씩 수정해 줘야 합니다.",
    diffs: [
      { title: "가상 DOM 없음", text: "어떠한 중개 버퍼나 메모리상의 가상 복제본 없이 실시간 DOM에 바로 쓰기 작업을 실행합니다." },
      { title: "수동 의존성 관리", text: "UI 갱신을 위해 수동으로 요소를 검색(document.getElementById 등)하고 동기화하는 보일러플레이트 코드가 필연적입니다." },
      { title: "성능 병목 가능성", text: "연쇄적인 DOM 쓰기 작업이 일어날 때, 변경사항을 한데 모으는 스케줄러가 없으므로 불필요한 브라우저 Reflow와 Repaint가 다발적으로 발생할 수 있습니다." }
    ]
  },
  react: {
    title: "React (Fiber)",
    concept: "가상 DOM 재조정 & 점진적 렌더링",
    description: "React는 가상 DOM(Virtual DOM)을 활용하는 선언형 UI 라이브러리입니다. 상태 변경(setState)이 일어나면 컴포넌트 함수를 다시 실행하여 새 VDOM 트리를 생성한 뒤, Fiber 엔진이 기존 트리와 차이점(Diffing)을 계산하여 실제 변경된 부위만 한꺼번에 DOM에 꽂아 넣습니다.",
    diffs: [
      { title: "불변성 기반 데이터 비교", text: "React는 데이터 불변성(Immutability)을 원칙으로 삼아, 상태의 얕은 비교를 통해 갱신이 일어났는지를 쉽고 빠르게 판단합니다." },
      { title: "Fiber 아키텍처", text: "렌더링 연산을 가벼운 작업 단위(Fiber)로 쪼개어 스케줄러가 실행 우선순위를 가질 수 있게 하여 복잡한 UI에서도 끊김 없는 사용자 경험을 유지시킵니다." },
      { title: "트리 단위 갱신", text: "컴포넌트 변경 발생 시, 기본적으로 해당 노드 하위의 서브트리를 재렌더링하는 범위를 가져가므로 렌더링 최적화(React.memo 등)가 필수적입니다." }
    ]
  },
  vue: {
    title: "Vue (Proxy)",
    concept: "Proxy 기반 반응성 가로채기 & 로컬 컴포넌트 패치",
    description: "Vue 3는 자바스크립트 ES6 Proxy 객체를 사용하여 데이터의 접근(Getter)과 수정(Setter)을 추적합니다. 컴포넌트 렌더링 단계에서 해당 컴포넌트가 참조하는 상태 속성을 자동으로 의존성으로 등록(Track)하여, 데이터 수정 시 해당 컴포넌트의 가상 DOM 패치만 정확히 수행합니다.",
    diffs: [
      { title: "세분화된 반응형 의존성", text: "데이터 수준에서 의존 컴포넌트 목록을 관리하므로 React와 같은 컴포넌트 범위 최적화가 필요하지 않으며, 값 변경 시 정확한 대상만 갱신됩니다." },
      { title: "템플릿 정적 분석 최적화", text: "컴포넌트 빌드 시 템플릿 내의 정적 노드와 동적 노드를 미리 구분하여 가상 DOM 비교 속도를 고속화시킵니다." },
      { title: "가상 DOM 사용", text: "여전히 가상 DOM을 사용하여 컴포넌트 레벨 내에서의 세부 수정을 비교 판단(Patch)합니다." }
    ]
  },
  svelte: {
    title: "Svelte (Compiler)",
    concept: "비동기 컴파일 & 직접적 DOM 업데이트 (No VDOM)",
    description: "Svelte는 런타임에 작동하는 가상 DOM 엔진을 갖지 않는 독특한 아키텍처를 가집니다. 대신, 빌드 타임 컴파일 단계에서 컴포넌트 소스코드를 분석하여 어떤 변수가 변할 때 어느 DOM 엘리먼트의 속성을 변경해야 하는지 매핑된 네이티브 자바스크립트 업데이트 함수를 기계적으로 생성합니다.",
    diffs: [
      { title: "가상 DOM 배제", text: "런타임에 2개의 가상 DOM 트리를 메모리에 띄우고 비교하는 오버헤드가 원천적으로 존재하지 않아 모바일 기기 등에서 극도로 높은 리소스 효율성을 보여줍니다." },
      { title: "더티 비트 플래그", text: "업데이트 발생 시 어떤 변수 인덱스가 오염(Dirty)되었는지를 비트 연산 마스크로 감지하여 해당 DOM 요소만 즉각 변경합니다." },
      { title: "런타임 라이브러리 최소화", text: "프레임워크 자체의 코드 크기가 매우 가벼워 초기 로딩 성능(FCP) 향상에 유리합니다." }
    ]
  }
};

const FRAMEWORK_CODES: Record<string, string> = {
  vanilla: `// 1. 이벤트 리스너를 수동으로 바인딩
const button = document.getElementById("toggle-btn");
const statusEl = document.getElementById("status");

button.addEventListener("click", () => {
  // 2. DOM에서 상태 관련 엘리먼트를 수동 검색
  // 3 & 4. 가상 DOM 없이 실제 DOM의 속성 직접 Mutation
  statusEl.textContent = "Done";
  statusEl.className = "status-active";
  
  // 5. 브라우저가 변경 사항 감지 후 Reflow/Repaint 즉시 수행
});`,
  react: `import React, { useState } from "react";

function TodoItem() {
  // 1. 컴포넌트 내 불변 상태 Hook 정의
  const [done, setDone] = useState(false);
  
  // 2 & 3. 렌더링 함수 실행 및 Fiber VDOM Diffing
  // 4. 변경된 사항만 실제 DOM에 일괄 Commit 적용
  return (
    <button onClick={() => setDone(true)}>
      <div className={done ? "active" : "pending"}>
        {done ? "Done" : "Pending"}
      </div>
    </button>
  );
}`,
  vue: `<script setup>
import { reactive } from "vue";

// 1. Proxy 기반의 반응성 상태 객체 선언
const state = reactive({ done: false });

function toggle() {
  // 2. Proxy Setter 가로채기 작동
  // 3. 의존성 목록에 등록된 Watcher 알림
  // 4. 로컬 컴포넌트 가상 DOM 패치 수행
  state.done = true; 
}
</script>

<template>
  <div :class="{ active: state.done }" @click="toggle">
    {{ state.done ? 'Done' : 'Pending' }}
  </div>
</template>`,
  svelte: `<script>
  // 1. 일반 변수로 반응형 변수 정의 (가상 DOM 없음)
  let done = false;

  function toggle() {
    // 2. 변수 할당문 감지 -> 빌드 타임 컴파일된 $$invalidate() 작동
    // 3. 더티 플래그 마스크 비트 연산 수행
    // 4. p(changed, ctx) 함수가 메모리 상의 DOM 요소 직접 제어
    done = true;
  }
</script>

<div class:active={done} on:click={toggle}>
  {done ? 'Done' : 'Pending'}
</div>`
};

export default function FrameworkRenderingViz() {
  const [activeFramework, setActiveFramework] = useState<string>("vanilla");
  const [activeStep, setActiveStep] = useState<number>(0);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(2000); // 1000ms ~ 3000ms

  // 상시 재생 상태 (isPlaying 고정)
  const isPlaying = true;

  const frameworkData = FRAMEWORK_DATA[activeFramework];
  const currentStep = frameworkData.steps[activeStep];
  const themeColor = frameworkData.themeColor;
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 자동 재생 틱 로직 (선택된 프레임워크 내 0~4단계 순환)
  useEffect(() => {
    if (!isPlaying) return;

    const runTick = () => {
      setActiveStep((prev) => {
        if (prev >= 4) {
          return 0; // 해당 프레임워크 마지막 단계를 머문 뒤 0단계로 루프
        }
        return prev + 1;
      });
    };

    timerRef.current = setTimeout(runTick, playbackSpeed);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [isPlaying, activeStep, playbackSpeed]);

  const handlePrev = () => {
    setActiveStep((prev) => (prev > 0 ? prev - 1 : 4));
  };

  const handleNext = () => {
    setActiveStep((prev) => (prev < 4 ? prev + 1 : 0));
  };

  const handleReset = () => {
    setActiveStep(0);
  };

  // 2nd Row 탭 선택 핸들러
  const handleTabChange = (key: string) => {
    setActiveFramework(key);
    setActiveStep(0);
  };

  // 현재 활성화 노드 판별 함수
  const isNodeActive = (nodeId: string): boolean => {
    if (nodeId === "trigger") {
      return activeStep === 0;
    }
    if (nodeId === "engine") {
      return activeStep === 1 && activeFramework !== "vanilla";
    }
    if (nodeId === "buffer") {
      return activeStep === 2;
    }
    if (nodeId === "dom") {
      if (activeFramework === "vanilla") {
        return activeStep === 1 || activeStep === 3;
      }
      return activeStep === 3;
    }
    if (nodeId === "screen") {
      return activeStep === 4;
    }
    return false;
  };

  const getNodeStroke = (nodeId: string) => {
    return isNodeActive(nodeId) ? themeColor : undefined;
  };

  const getNodeStrokeWidth = (nodeId: string) => {
    return isNodeActive(nodeId) ? 2.5 : 1.5;
  };

  const getNodeFilter = (nodeId: string) => {
    return isNodeActive(nodeId) ? `url(#glow-${activeFramework})` : undefined;
  };

  // 패킷 궤적 좌표 추출 헬퍼 함수 (직선 linear 벡터로 수정)
  const getPacketCoords = () => {
    if (activeStep === 0) {
      return { cx: 400, cy: 35 };
    }

    if (activeFramework === "vanilla") {
      switch (activeStep) {
        case 1: // DOM 검색: Trigger (400, 35) -> DOM (400, 340)
          return { cx: [400, 400], cy: [35, 340] };
        case 2: // 직접 속성 수정: DOM (400, 340) -> Buffer (400, 230)
          return { cx: [400, 400], cy: [340, 230] };
        case 3: // 클래스/스타일 지정: Buffer (400, 230) -> DOM (400, 340)
          return { cx: [400, 400], cy: [230, 340] };
        case 4: // 화면 페인트 완료: DOM (400, 340) -> Browser Screen (400, 445)
          return { cx: [400, 400], cy: [340, 445] };
        default:
          return { cx: 400, cy: 35 };
      }
    } else {
      const targetX = activeFramework === "react" ? 200 : activeFramework === "vue" ? 400 : 600;
      switch (activeStep) {
        case 1: // Trigger (400, 35) -> Core Engine (targetX, 130)
          return { cx: [400, targetX], cy: [35, 130] };
        case 2: // Core Engine (targetX, 130) -> Buffer (400, 230)
          return { cx: [targetX, 400], cy: [130, 230] };
        case 3: // Buffer (400, 230) -> DOM (400, 340)
          return { cx: [400, 400], cy: [230, 340] };
        case 4: // DOM (400, 340) -> Browser Screen (400, 445)
          return { cx: [400, 400], cy: [340, 445] };
        default:
          return { cx: 400, cy: 35 };
      }
    }
  };

  const packetCoords = getPacketCoords();

  // 패스 하이라이트 활성화 판별
  const isLineActive = (lineId: string): boolean => {
    if (activeStep < 1) return false;
    if (activeFramework === "vanilla") {
      if (activeStep === 1 && lineId === "vanilla-query") return true;
      if (activeStep === 2 && lineId === "vanilla-mutate") return true;
      if (activeStep === 3 && lineId === "buffer-to-dom") return true;
      if (activeStep === 4 && lineId === "dom-to-screen") return true;
    } else if (activeFramework === "react") {
      if (activeStep === 1 && lineId === "react-trigger-to-engine") return true;
      if (activeStep === 2 && lineId === "react-engine-to-buffer") return true;
      if (activeStep === 3 && lineId === "buffer-to-dom") return true;
      if (activeStep === 4 && lineId === "dom-to-screen") return true;
    } else if (activeFramework === "vue") {
      if (activeStep === 1 && lineId === "vue-trigger-to-engine") return true;
      if (activeStep === 2 && lineId === "vue-engine-to-buffer") return true;
      if (activeStep === 3 && lineId === "buffer-to-dom") return true;
      if (activeStep === 4 && lineId === "dom-to-screen") return true;
    } else if (activeFramework === "svelte") {
      if (activeStep === 1 && lineId === "svelte-trigger-to-engine") return true;
      if (activeStep === 2 && lineId === "svelte-engine-to-buffer") return true;
      if (activeStep === 3 && lineId === "buffer-to-dom") return true;
      if (activeStep === 4 && lineId === "dom-to-screen") return true;
    }
    return false;
  };

  const selectedTabDetails = TAB_DETAILS[activeFramework];
  const progressPercent = ((activeStep + 1) / 5) * 100;

  return (
    <div className="space-y-6">
      {/* 1st Row: w-full HUD & 시뮬레이션 영역 */}
      <div className="w-full space-y-4">
        {/* HUD 컨트롤 및 현재 프레임워크 진행도 인디케이터 (자동재생 버튼 제거) */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-200 dark:border-zinc-800 pb-3">
          <div className="flex items-center gap-1.5">
            <button
              onClick={handleReset}
              className="p-1.5 rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 hover:bg-zinc-100 dark:hover:bg-zinc-900 text-zinc-500 dark:text-zinc-400 transition-colors"
              title="초기화"
            >
              <RotateCcw size={14} />
            </button>
            <button
              onClick={handlePrev}
              className="p-1.5 rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 hover:bg-zinc-100 dark:hover:bg-zinc-900 text-zinc-500 dark:text-zinc-400 transition-colors"
              title="이전 단계"
            >
              <ChevronLeft size={14} />
            </button>
            <button
              onClick={handleNext}
              className="p-1.5 rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 hover:bg-zinc-100 dark:hover:bg-zinc-900 text-zinc-500 dark:text-zinc-400 transition-colors"
              title="다음 단계"
            >
              <ChevronRight size={14} />
            </button>
          </div>

          {/* 속도 제어 슬라이더 */}
          <div className="flex items-center gap-2 text-[11px] text-zinc-500 w-full sm:w-auto">
            <span className="flex items-center gap-1 shrink-0">
              <Clock size={11} /> 속도: {(playbackSpeed / 1000).toFixed(1)}s
            </span>
            <input
              type="range"
              min="1000"
              max="3000"
              step="500"
              value={playbackSpeed}
              onChange={(e) => setPlaybackSpeed(Number(e.target.value))}
              className="w-full sm:w-24 accent-zinc-900 dark:accent-zinc-50 cursor-pointer h-0.5 bg-zinc-200 dark:bg-zinc-800 rounded-lg appearance-none"
            />
          </div>

          {/* 현재 프레임워크 시뮬레이션 진행도 */}
          <div className="flex-1 min-w-[200px] sm:ml-3">
            <div className="flex justify-between items-center text-[11px] text-zinc-500 mb-1">
              <span className="font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                <span className="px-1 py-0.5 rounded text-[9px] uppercase font-bold tracking-wider" style={{ backgroundColor: `${themeColor}20`, color: themeColor }}>
                  {frameworkData.name}
                </span>
                <span>{activeStep + 1} / 5 단계</span>
              </span>
              <span className="shrink-0 font-mono text-[9px]">
                진행률: {progressPercent}%
              </span>
            </div>
            <div className="h-1 w-full bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
              <motion.div
                className="h-full"
                style={{ backgroundColor: themeColor }}
                initial={{ width: 0 }}
                animate={{ width: `${progressPercent}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
          </div>
        </div>

        {/* 7개 노드를 일원화하여 세로 레이아웃으로 배치한 SVG 캔버스 (직선으로 변경) */}
        <div className="relative border border-zinc-200 dark:border-zinc-800 rounded-2xl bg-white dark:bg-zinc-950/20 overflow-hidden flex justify-center py-6 shadow-sm">
          <svg
            viewBox="0 0 800 500"
            className="w-full h-auto max-h-[480px] select-none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              {/* 각 프레임워크 고유 색상 글로우 필터 */}
              {Object.entries(FRAMEWORK_DATA).map(([key, data]) => (
                <filter id={`glow-${key}`} key={key} x="-30%" y="-30%" width="160%" height="160%">
                  <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor={data.themeColor} floodOpacity="0.8" />
                </filter>
              ))}
              
              {/* 엔지니어링 격자 패턴 */}
              <pattern id="dot-grid" width="24" height="24" patternUnits="userSpaceOnUse">
                <circle cx="2" cy="2" r="1.2" className="fill-zinc-200 dark:fill-zinc-850" />
              </pattern>
            </defs>

            {/* 격자 채우기 */}
            <rect width="800" height="500" fill="url(#dot-grid)" />

            {/* ───────────────── 연결 경로 (완전한 직선 벡터) ───────────────── */}
            <g fill="none" strokeWidth="2.5">
              {/* 1. React 경로 */}
              <g opacity={activeFramework === "react" ? 1.0 : 0.15}>
                <path
                  d="M 400 35 L 200 130"
                  stroke={isLineActive("react-trigger-to-engine") ? themeColor : "currentColor"}
                  style={{ color: isLineActive("react-trigger-to-engine") ? themeColor : "var(--stroke-color, rgba(228, 228, 231, 0.4))" }}
                  strokeWidth={isLineActive("react-trigger-to-engine") ? 3.5 : 2}
                  className="transition-colors duration-300"
                />
                <path
                  d="M 200 130 L 400 230"
                  stroke={isLineActive("react-engine-to-buffer") ? themeColor : "currentColor"}
                  style={{ color: isLineActive("react-engine-to-buffer") ? themeColor : "var(--stroke-color, rgba(228, 228, 231, 0.4))" }}
                  strokeWidth={isLineActive("react-engine-to-buffer") ? 3.5 : 2}
                  className="transition-colors duration-300"
                />
              </g>

              {/* 2. Vue 경로 */}
              <g opacity={activeFramework === "vue" ? 1.0 : 0.15}>
                <path
                  d="M 400 35 L 400 130"
                  stroke={isLineActive("vue-trigger-to-engine") ? themeColor : "currentColor"}
                  style={{ color: isLineActive("vue-trigger-to-engine") ? themeColor : "var(--stroke-color, rgba(228, 228, 231, 0.4))" }}
                  strokeWidth={isLineActive("vue-trigger-to-engine") ? 3.5 : 2}
                  className="transition-colors duration-300"
                />
                <path
                  d="M 400 130 L 400 230"
                  stroke={isLineActive("vue-engine-to-buffer") ? themeColor : "currentColor"}
                  style={{ color: isLineActive("vue-engine-to-buffer") ? themeColor : "var(--stroke-color, rgba(228, 228, 231, 0.4))" }}
                  strokeWidth={isLineActive("vue-engine-to-buffer") ? 3.5 : 2}
                  className="transition-colors duration-300"
                />
              </g>

              {/* 3. Svelte 경로 */}
              <g opacity={activeFramework === "svelte" ? 1.0 : 0.15}>
                <path
                  d="M 400 35 L 600 130"
                  stroke={isLineActive("svelte-trigger-to-engine") ? themeColor : "currentColor"}
                  style={{ color: isLineActive("svelte-trigger-to-engine") ? themeColor : "var(--stroke-color, rgba(228, 228, 231, 0.4))" }}
                  strokeWidth={isLineActive("svelte-trigger-to-engine") ? 3.5 : 2}
                  className="transition-colors duration-300"
                />
                <path
                  d="M 600 130 L 400 230"
                  stroke={isLineActive("svelte-engine-to-buffer") ? themeColor : "currentColor"}
                  style={{ color: isLineActive("svelte-engine-to-buffer") ? themeColor : "var(--stroke-color, rgba(228, 228, 231, 0.4))" }}
                  strokeWidth={isLineActive("svelte-engine-to-buffer") ? 3.5 : 2}
                  className="transition-colors duration-300"
                />
              </g>

              {/* 4. Vanilla 바이패스 경로 */}
              <g opacity={activeFramework === "vanilla" ? 1.0 : 0.15}>
                <path
                  d="M 400 35 L 400 340"
                  stroke={isLineActive("vanilla-query") ? themeColor : "currentColor"}
                  style={{ color: isLineActive("vanilla-query") ? themeColor : "rgba(228, 228, 231, 0.3)" }}
                  strokeWidth={isLineActive("vanilla-query") ? 3.5 : 2}
                  strokeDasharray="4,4"
                  className="transition-all duration-300"
                  fill="none"
                />
                <path
                  d="M 400 340 L 400 230"
                  stroke={isLineActive("vanilla-mutate") ? themeColor : "currentColor"}
                  style={{ color: isLineActive("vanilla-mutate") ? themeColor : "rgba(228, 228, 231, 0.3)" }}
                  strokeWidth={isLineActive("vanilla-mutate") ? 3.5 : 2}
                  strokeDasharray="4,4"
                  className="transition-all duration-300"
                  fill="none"
                />
              </g>

              {/* 5. 공통 하단 경로 (Buffer -> DOM -> Screen) */}
              <g>
                <path
                  d="M 400 230 L 400 340"
                  stroke={isLineActive("buffer-to-dom") ? themeColor : "currentColor"}
                  style={{ color: isLineActive("buffer-to-dom") ? themeColor : "var(--stroke-color, rgba(228, 228, 231, 0.4))" }}
                  strokeWidth={isLineActive("buffer-to-dom") ? 3.5 : 2}
                  className="transition-colors duration-300"
                />
                <path
                  d="M 400 340 L 400 445"
                  stroke={isLineActive("dom-to-screen") ? themeColor : "currentColor"}
                  style={{ color: isLineActive("dom-to-screen") ? themeColor : "var(--stroke-color, rgba(228, 228, 231, 0.4))" }}
                  strokeWidth={isLineActive("dom-to-screen") ? 3.5 : 2}
                  className="transition-colors duration-300"
                />
              </g>
            </g>

            {/* ───────────────── 흘러가는 패킷 애니메이션 (직선 linear 벡터) ───────────────── */}
            {packetCoords && (
              <motion.circle
                key={`packet-vert-${activeFramework}-${activeStep}`}
                initial={
                  Array.isArray(packetCoords.cx) && Array.isArray(packetCoords.cy)
                    ? { cx: packetCoords.cx[0], cy: packetCoords.cy[0], opacity: 0, scale: 0.8 }
                    : { cx: packetCoords.cx as number, cy: packetCoords.cy as number, opacity: 0, scale: 0.8 }
                }
                animate={
                  Array.isArray(packetCoords.cx) && Array.isArray(packetCoords.cy)
                    ? { cx: packetCoords.cx, cy: packetCoords.cy, opacity: [0, 1, 1, 0.8], scale: 1.2 }
                    : { cx: packetCoords.cx as number, cy: packetCoords.cy as number, opacity: 1, scale: 1.2 }
                }
                transition={{
                  duration: Math.max(0.6, playbackSpeed / 2000),
                  ease: "easeInOut",
                }}
                r={7}
                fill={themeColor}
                filter={`url(#glow-${activeFramework})`}
              />
            )}

            {/* ───────────────── 노드 1: Trigger Event (Top center, y=35) ───────────────── */}
            <g className="transition-all duration-300">
              <rect
                x={340}
                y={12.5}
                width={120}
                height={45}
                rx={6}
                className="fill-white dark:fill-zinc-900 stroke-zinc-200 dark:stroke-zinc-800"
                stroke={getNodeStroke("trigger")}
                strokeWidth={getNodeStrokeWidth("trigger")}
                filter={getNodeFilter("trigger")}
              />
              <text x={400} y={28} textAnchor="middle" className="text-[8.5px] font-bold fill-zinc-400 dark:fill-zinc-500 uppercase tracking-wider">Trigger Event</text>
              <text x={400} y={43} textAnchor="middle" className="text-[10px] font-bold fill-zinc-900 dark:fill-zinc-100">
                {activeFramework === "vanilla" ? "Click Event" : activeFramework === "react" ? "setDone(true)" : activeFramework === "vue" ? "state.done=true" : "done = true"}
              </text>
            </g>

            {/* ───────────────── 노드 2: React Engine (Left, y=130) ───────────────── */}
            <g className="transition-all duration-300" opacity={activeFramework === "react" ? 1.0 : 0.15}>
              <rect
                x={130}
                y={92.5}
                width={140}
                height={75}
                rx={8}
                className="fill-white dark:fill-zinc-900 stroke-zinc-200 dark:stroke-zinc-800"
                stroke={getNodeStroke("engine")}
                strokeWidth={getNodeStrokeWidth("engine")}
                filter={getNodeFilter("engine")}
              />
              <text x={200} y={108} textAnchor="middle" className="text-[8.5px] font-bold fill-sky-500 uppercase tracking-wider">React Fiber</text>
              <circle cx={175} cy={126} r={3} className="fill-zinc-300 dark:fill-zinc-700" />
              <circle cx={167} cy={138} r={3} className="fill-zinc-300 dark:fill-zinc-700" />
              <circle cx={183} cy={138} r={3} className="fill-zinc-300 dark:fill-zinc-700" />
              <line x1={175} y1={126} x2={167} y2={138} stroke="currentColor" className="stroke-zinc-200 dark:stroke-zinc-800" strokeWidth={0.8} />
              <line x1={175} y1={126} x2={183} y2={138} stroke="currentColor" className="stroke-zinc-200 dark:stroke-zinc-800" strokeWidth={0.8} />
              
              <text x={200} y={134} textAnchor="middle" className="text-[8px] fill-zinc-400 dark:fill-zinc-500 font-bold">vs</text>

              <circle cx={225} cy={126} r={3} className="fill-zinc-300 dark:fill-zinc-700" />
              <circle cx={217} cy={138} r={3} className="fill-zinc-300 dark:fill-zinc-700" />
              <circle cx={233} cy={138} r={3} fill={activeFramework === "react" ? themeColor : "#d4d4d8"} />
              <line x1={225} y1={126} x2={217} y2={138} stroke="currentColor" className="stroke-zinc-200 dark:stroke-zinc-800" strokeWidth={0.8} />
              <line x1={225} y1={126} x2={233} y2={138} stroke="currentColor" className="stroke-zinc-200 dark:stroke-zinc-800" strokeWidth={0.8} />
              
              <text x={200} y={158} textAnchor="middle" className="text-[7.5px] fill-zinc-500 dark:fill-zinc-400">VDOM Diffing</text>
            </g>

            {/* ───────────────── 노드 3: Vue Engine (Center, y=130) ───────────────── */}
            <g className="transition-all duration-300" opacity={activeFramework === "vue" ? 1.0 : 0.15}>
              <rect
                x={330}
                y={92.5}
                width={140}
                height={75}
                rx={8}
                className="fill-white dark:fill-zinc-900 stroke-zinc-200 dark:stroke-zinc-800"
                stroke={getNodeStroke("engine")}
                strokeWidth={getNodeStrokeWidth("engine")}
                filter={getNodeFilter("engine")}
              />
              <text x={400} y={108} textAnchor="middle" className="text-[8.5px] font-bold fill-emerald-500 uppercase tracking-wider">Vue Proxy</text>
              <circle cx={400} cy={129} r={11} fill="none" stroke={activeFramework === "vue" ? themeColor : "currentColor"} className="stroke-zinc-200 dark:stroke-zinc-800" strokeWidth={1} strokeDasharray="2,2" />
              <circle cx={400} cy={129} r={6} fill="none" stroke={activeFramework === "vue" ? themeColor : "currentColor"} strokeWidth={1.5} />
              <text x={400} y={131.5} textAnchor="middle" className="text-[6.5px] font-mono font-bold fill-zinc-700 dark:fill-zinc-300">Proxy</text>
              <text x={400} y={158} textAnchor="middle" className="text-[7.5px] fill-zinc-500 dark:fill-zinc-400 font-mono">Reactive Tracker</text>
            </g>

            {/* ───────────────── 노드 4: Svelte Engine (Right, y=130) ───────────────── */}
            <g className="transition-all duration-300" opacity={activeFramework === "svelte" ? 1.0 : 0.15}>
              <rect
                x={530}
                y={92.5}
                width={140}
                height={75}
                rx={8}
                className="fill-white dark:fill-zinc-900 stroke-zinc-200 dark:stroke-zinc-800"
                stroke={getNodeStroke("engine")}
                strokeWidth={getNodeStrokeWidth("engine")}
                filter={getNodeFilter("engine")}
              />
              <text x={600} y={108} textAnchor="middle" className="text-[8.5px] font-bold fill-orange-500 uppercase tracking-wider">Svelte Compiler</text>
              <rect x={550} y={121} width={100} height={13} rx={2} className="fill-zinc-50 dark:fill-zinc-800 stroke-zinc-200 dark:stroke-zinc-700" strokeWidth={0.8} />
              <text x={600} y={130} textAnchor="middle" className="text-[7px] font-mono fill-zinc-700 dark:fill-zinc-300">Dirty Mask: [1,0,0,0]</text>
              <text x={600} y={158} textAnchor="middle" className="text-[7.5px] fill-zinc-500 dark:fill-zinc-400">AST Update Match</text>
            </g>

            {/* ───────────────── 노드 5: Updates Buffer (Center, y=230) ───────────────── */}
            <g className="transition-all duration-300">
              <rect
                x={335}
                y={202.5}
                width={130}
                height={55}
                rx={8}
                className="fill-white dark:fill-zinc-900 stroke-zinc-200 dark:stroke-zinc-800"
                stroke={getNodeStroke("buffer")}
                strokeWidth={getNodeStrokeWidth("buffer")}
                filter={getNodeFilter("buffer")}
              />
              <text x={400} y={217} textAnchor="middle" className="text-[9px] font-bold fill-zinc-400 dark:fill-zinc-500 uppercase tracking-wider">Updates Buffer</text>
              <text x={400} y={235} textAnchor="middle" className="text-[10.5px] font-bold fill-zinc-800 dark:fill-zinc-200">
                {activeFramework === "vanilla" ? "Direct Mutator" : activeFramework === "react" ? "Commit Queue" : activeFramework === "vue" ? "Scheduler Queue" : "Direct Binding"}
              </text>
              <text x={400} y={248} textAnchor="middle" className="text-[8px] fill-zinc-400 dark:fill-zinc-500">
                {activeFramework === "vanilla" ? "속성 직접 수정값" : activeFramework === "react" ? "Effect List 배치" : activeFramework === "vue" ? "마이크로태스크 병합" : "p(changed, ctx) 갱신"}
              </text>
            </g>

            {/* ───────────────── 노드 6: Real DOM Tree (Center, y=340) ───────────────── */}
            <g className="transition-all duration-300">
              <rect
                x={335}
                y={305}
                width={130}
                height={70}
                rx={6}
                className="fill-white dark:fill-zinc-900 stroke-zinc-200 dark:stroke-zinc-800"
                stroke={getNodeStroke("dom")}
                strokeWidth={getNodeStrokeWidth("dom")}
                filter={getNodeFilter("dom")}
              />
              <text x={400} y={317} textAnchor="middle" className="text-[8.5px] font-bold fill-zinc-400 dark:fill-zinc-500 uppercase tracking-wider">Real DOM Tree</text>

              {/* DOM 트리 드로잉 */}
              <circle cx={400} cy={328} r={3} className="fill-zinc-300 dark:fill-zinc-700" />
              <line x1={400} y1={328} x2={388} y2={341} stroke="currentColor" className="stroke-zinc-200 dark:stroke-zinc-850" strokeWidth={0.8} />
              <line x1={400} y1={328} x2={412} y2={341} stroke="currentColor" className="stroke-zinc-200 dark:stroke-zinc-850" strokeWidth={0.8} />
              
              <circle cx={388} cy={341} r={3} className="fill-zinc-300 dark:fill-zinc-700" />
              <circle
                cx={412}
                cy={341}
                r={3}
                fill={isNodeActive("dom") ? themeColor : "currentColor"}
                className="transition-colors duration-300"
                style={{ color: "var(--stroke-color, #d4d4d8)" }}
                stroke={isNodeActive("dom") ? themeColor : undefined}
                strokeWidth={isNodeActive("dom") ? 1 : 0}
              />
              
              <line x1={388} y1={341} x2={388} y2={354} stroke="currentColor" className="stroke-zinc-200 dark:stroke-zinc-850" strokeWidth={0.8} />
              <line x1={412} y1={341} x2={412} y2={354} stroke="currentColor" className="stroke-zinc-200 dark:stroke-zinc-850" strokeWidth={0.8} />
              
              <circle cx={388} cy={354} r={2} className="fill-zinc-300 dark:fill-zinc-700" />
              <circle cx={412} cy={354} r={2} className="fill-zinc-300 dark:fill-zinc-700" />
            </g>

            {/* ───────────────── 노드 7: Browser Screen (Center, y=445) ───────────────── */}
            <g className="transition-all duration-300">
              <rect
                x={330}
                y={402.5}
                width={140}
                height={85}
                rx={6}
                className="fill-white dark:fill-zinc-900 stroke-zinc-200 dark:stroke-zinc-800"
                stroke={getNodeStroke("screen")}
                strokeWidth={getNodeStrokeWidth("screen")}
                filter={getNodeFilter("screen")}
              />
              
              {/* 브라우저 상단바 */}
              <rect x={331} y={403.5} width={138} height={10} rx={2} className="fill-zinc-100 dark:fill-zinc-800" />
              <circle cx={336} cy={408.5} r={1} className="fill-red-400" />
              <circle cx={340} cy={408.5} r={1} className="fill-yellow-400" />
              <circle cx={344} cy={408.5} r={1} className="fill-green-400" />

              {/* 뷰포트 상태 */}
              {isNodeActive("screen") ? (
                <g>
                  <rect x={348} y={423} width={8} height={8} rx={1} fill={themeColor} />
                  <path d="M 350 427 L 352 429 L 354 425" fill="none" stroke="white" strokeWidth={0.8} strokeLinecap="round" strokeLinejoin="round" />
                  <text x={362} y={430} className="text-[8.5px] font-bold fill-zinc-900 dark:fill-zinc-100">Done!</text>
                  <rect x={348} y={437} width={100} height={5} rx={1} className="fill-zinc-100 dark:fill-zinc-800" />
                  
                  <line x1={331} y1={458} x2={469} y2={458} stroke={themeColor} strokeWidth={1} strokeDasharray="2,2" />
                  <text x={400} y={468} textAnchor="middle" className="text-[7.5px] font-bold" fill={themeColor}>Repaint Phase</text>
                </g>
              ) : (
                <g>
                  <rect x={348} y={423} width={8} height={8} rx={1} fill="none" stroke="currentColor" className="stroke-zinc-300 dark:stroke-zinc-700" strokeWidth={0.8} />
                  <text x={362} y={430} className="text-[8px] fill-zinc-400 dark:fill-zinc-650">Pending...</text>
                  <rect x={348} y={437} width={100} height={5} rx={1} className="fill-zinc-100 dark:fill-zinc-800" />
                  <text x={400} y={465} textAnchor="middle" className="text-[7.5px] fill-zinc-400 dark:fill-zinc-650">Browser Viewport</text>
                </g>
              )}
            </g>
          </svg>
        </div>

        {/* 현재 단계별 세부 설명 박스 (글자 크기 스케일링 적용) */}
        <AnimatePresence mode="wait">
          <motion.div
            key={`desc-vert-${activeFramework}-${activeStep}`}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.15 }}
            className="bg-zinc-50 dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800/60 rounded-xl p-3.5 sm:p-4 text-xs text-zinc-650 dark:text-zinc-400 leading-relaxed shadow-sm flex gap-3 w-full"
          >
            <Info className="w-5 h-5 text-zinc-400 dark:text-zinc-500 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <div className="font-bold text-zinc-900 dark:text-zinc-100 flex flex-wrap items-center gap-2">
                <span className="text-sm sm:text-base md:text-lg font-bold">{currentStep.title}</span>
                <span className="text-[9px] font-mono px-2 py-0.5 rounded text-white" style={{ backgroundColor: themeColor }}>
                  {currentStep.subtext}
                </span>
              </div>
              <p className="text-zinc-650 dark:text-zinc-450 text-xs sm:text-sm md:text-base leading-relaxed mt-1">
                {currentStep.desc}
              </p>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* 2nd Row: w-full 탭 스위처 & 비교 분석 영역 */}
      <div className="w-full space-y-4 border-t border-zinc-200 dark:border-zinc-800 pt-6">
        
        {/* 탭 인터페이스 */}
        <div className="flex flex-wrap gap-1.5 p-1 bg-zinc-100 dark:bg-zinc-900 rounded-lg w-fit">
          {FRAMEWORK_ORDER.map((key) => {
            const isSelected = activeFramework === key;
            const fw = FRAMEWORK_DATA[key];
            return (
              <button
                key={key}
                onClick={() => handleTabChange(key)}
                className={`px-4 py-2 rounded-md text-xs sm:text-sm font-semibold transition-all ${
                  isSelected
                    ? "bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-55 shadow-sm border border-zinc-200/50 dark:border-zinc-800"
                    : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300"
                }`}
              >
                {fw.name}
              </button>
            );
          })}
        </div>

        {/* 2열 상세 정보 그리드 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Column 1 (Left): 구조적 렌더링 원리 및 타 도구 대비 상세 아키텍처 비교 */}
          <div className="border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 bg-white dark:bg-zinc-950/20 shadow-sm space-y-4">
            <div>
              <h3 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
                <span className="w-2.5 h-4 rounded-sm" style={{ backgroundColor: themeColor }} />
                {selectedTabDetails.title}
              </h3>
              <p className="text-xs text-zinc-400 dark:text-zinc-500 font-mono mt-1">
                기본 원리: {selectedTabDetails.concept}
              </p>
            </div>
            
            <p className="text-zinc-650 dark:text-zinc-400 text-xs sm:text-sm leading-relaxed">
              {selectedTabDetails.description}
            </p>

            <div className="space-y-2.5 pt-2">
              <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-200 uppercase tracking-wider">
                주요 아키텍처 차별점
              </h4>
              <ul className="space-y-2 text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed pl-4 list-disc">
                {selectedTabDetails.diffs.map((diff, index) => (
                  <li key={index} className="marker:text-zinc-455 dark:marker:text-zinc-700">
                    <strong className="text-zinc-900 dark:text-zinc-100 font-semibold">{diff.title}</strong>: {diff.text}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Column 2 (Right): 코어 문법 및 설정 테마 대응 정적 코드 뷰 */}
          <div className="border border-zinc-200 dark:border-zinc-850 rounded-xl overflow-hidden flex flex-col shadow-sm bg-zinc-50 dark:bg-zinc-950 text-zinc-800 dark:text-zinc-300">
            <div className="px-4 py-2 border-b border-zinc-200 dark:border-zinc-850 bg-zinc-100/50 dark:bg-zinc-900/50 text-[10px] font-semibold text-zinc-450 tracking-wider flex justify-between items-center select-none">
              <span>{frameworkData.name} CORE SYNTAX</span>
              <span className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: themeColor }} />
            </div>
            <div className="p-4 font-mono text-[11.5px] sm:text-xs overflow-x-auto select-text leading-relaxed bg-transparent">
              <pre className="whitespace-pre">
                <code>{FRAMEWORK_CODES[activeFramework]}</code>
              </pre>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
