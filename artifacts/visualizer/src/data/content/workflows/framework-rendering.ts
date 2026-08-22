import { ContentItem } from "../content-types";

export const frameworkRenderingContent: ContentItem = {
  slug: "framework-rendering",
  category: "workflow",
  title: "프론트엔드 프레임워크 렌더링",
  subtitle: "Vanilla JS vs React vs Vue vs Svelte 렌더링 파이프라인 비교",
  tags: [
    "Frontend",
    "Rendering",
    "React",
    "Vue",
    "Svelte",
    "DOM"
  ],
  description: `웹 애플리케이션의 상태 변화를 화면에 반영하는 방식은 프론트엔드의 렌더링 성능과 개발 생산성에 결정적인 영향을 미칩니다. 브라우저 네이티브 조작부터 가상 DOM 및 빌드 타임 컴파일러 기법까지 4대 프론트엔드 렌더링 파이프라인을 비교합니다.

### 1. Vanilla JS (명령형 직접 DOM 조작)
- **동작 방식:** 별도의 프레임워크 런타임 없이 \`document.getElementById\`, \`textContent\`, \`classList\` 등의 표준 DOM API를 수동 호출합니다.
- **특성:** 런타임 라이브러리 오버헤드가 제로(0)여서 단순 페이지에서는 가장 빠르지만, 복잡한 상태 동기화 시 잦은 Reflow/Repaint가 유발되고 유지보수성이 급감합니다.

### 2. React (선언형 런타임 가상 DOM & Fiber 재조정)
- **동작 방식:** 상태 변경 시 컴포넌트 함수를 재실행하여 새로운 가상 DOM(JSX)을 생성하고, Fiber Reconciler가 이전 트리와 비교(Diffing)하여 변경 사항만 단일 배치로 실제 DOM에 커밋합니다.
- **특성:** 선언적 컴포넌트 모델(\`UI = f(state)\`)로 대규모 애플리케이션의 상태 관리가 매우 안전하며, Fiber 스케줄러를 통한 동시성(Concurrent) 렌더링을 지원합니다.

### 3. Vue (Proxy 기반 미세 반응성 & 국소 VDOM 패치)
- **동작 방식:** ES6 \`Proxy\`로 데이터 접근을 가로채 렌더링 시점에 종속성(Dependency)을 자동 수집합니다.
- **특성:** 상태가 변경되면 전체 컴포넌트 트리를 돌지 않고 오직 해당 상태를 참조하는 컴포넌트 블록만 가상 DOM 패치(Patch)를 수행하므로 수동 최적화 부담이 적습니다.

### 4. Svelte (컴파일 타임 반응성 & No Virtual DOM)
- **동작 방식:** 런타임 가상 DOM을 완전히 배제하고, 빌드 시점에 Svelte 컴파일러가 상태 변경 할당문(\`=\`)을 감지하여 대상 DOM 노드를 직접 수정하는 초경량 JS 코드를 생성합니다.
- **특성:** 브라우저 런타임 엔진 및 VDOM Diffing 오버헤드가 전혀 없어 극소 번들 크기와 초고속 런타임 성능을 자랑합니다.`,
  steps: [
    "1단계: 브라우저 공통 로드 — HTML, CSS, JS 다운로드 및 브라우저 파싱 시작",
    "2단계: Vanilla DOM 빌드 — 브라우저가 DOM 및 CSSOM 트리 생성 후 Render Tree 결합",
    "3단계: Vanilla 레이아웃 & 페인트 — 화면 배치를 계산(Layout)하고 픽셀로 드로잉(Paint)",
    "4단계: React 렌더링 루프 — 상태 변경 시 JSX가 가상 DOM으로 변환되어 Fiber Reconciler에서 Diffing 수행",
    "5단계: React DOM 커밋 — 계산된 차이점을 실제 DOM에 일괄 반영하여 Paint 유발",
    "6단계: Vue 반응형 추적 — Proxy가 데이터 접근을 가로채 렌더링 종속성을 추적 및 수집",
    "7단계: Vue 가상 DOM 패치 — 상태 변경 시 종속된 컴포넌트의 가상 DOM만 생성 후 Patch로 반영",
    "8단계: Svelte 컴파일 분석 — 빌드 타임에 상태 변경과 DOM 업데이트 코드를 매핑하여 컴파일",
    "9단계: Svelte 직접 DOM 갱신 — 가상 DOM 없이 런타임 상태 변화 시 해당 DOM 노드를 직접 변경"
  ],
  examples: [
    "각 프레임워크의 동작 원리에 따른 렌더링 성능 최적화",
    "Virtual DOM의 유무에 따른 브라우저 자원 및 메모리 사용량 차이 비교",
    "컴파일 타임 프레임워크(Svelte)와 런타임 프레임워크(React, Vue)의 특징 이해"
  ],
  related: [
    { slug: "realtime-protocols", category: "workflow", relation: "서버 수신 데이터를 프론트엔드 DOM에 반응형으로 업데이트" }
  ]
};
