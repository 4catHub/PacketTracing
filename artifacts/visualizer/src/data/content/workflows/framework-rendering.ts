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
    description: `웹 애플리케이션의 상태 변화를 화면에 반영하는 방식은 성능과 유지보수성에 결정적인 영향을 미칩니다. 브라우저 본연의 동작부터 현대 컴파일러 기법까지 각 프레임워크의 핵심 렌더링 파이프라인과 그 차이점을 상세히 비교합니다.

## Vanilla JS
- 핵심 동작: 프레임워크나 가상 DOM 없이 브라우저 본래의 DOM API를 직접 조작하는 가장 가볍고 직관적인 방식입니다.
- 주요 차이: 상태 업데이트 시 개발자가 직접 엘리먼트를 쿼리하고 변경해야 하므로 대규모 앱에서 오류 발생 확률이 높고, 불필요한 레이아웃 연산(Reflow)이 반복될 수 있습니다.

## React
- 핵심 동작: 상태가 변경되면 새로운 가상 DOM 트리를 메모리 상에 구축하고, 이를 이전 트리와 비교(Diffing)하여 달라진 부분만 실제 DOM에 일괄 반영(Commit)합니다.
- 주요 차이: 런타임에 비교 엔진(Fiber Reconciler)이 구동되어 번들 용량 및 가상 DOM 메모리 사용량은 늘어나지만, 일괄 배치 업데이트를 통해 개발 효율과 UI 안정성을 높입니다.

## Vue
- 핵심 동작: ES6 Proxy를 기반으로 데이터의 읽기/쓰기를 가로채며, 컴포넌트 렌더링 단계에서 해당 데이터에 대한 종속성(Dependency)을 지능적으로 자동 수집합니다.
- 주요 차이: 데이터가 변했을 때 전체 트리를 돌지 않고, 해당 변화에 영향받는 컴포넌트 단위로 가상 DOM 패치(Patch)를 수행하기 때문에 React보다 런타임 업데이트 범위가 더욱 국소적입니다.

## Svelte
- 핵심 동작: 런타임 가상 DOM을 완전히 배제하고, 빌드 타임에 컴포넌트 구조를 AST로 정적 분석하여 상태 변경 시 실제 DOM의 특정 노드를 갱신하는 타겟팅 JS 코드로 사전 컴파일합니다.
- 주요 차이: 가상 DOM 생성 및 비교 연산의 런타임 비용이 전혀 없으며, 코드 실행 시 메모리에 연결된 노드가 직접(Direct) 갱신되므로 런타임 오버헤드가 극도로 적습니다.`,
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

