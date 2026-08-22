import { ContentItem } from "../content-types";

export const reactArchitectureContent: ContentItem = {
  slug: "react-architecture",
  category: "workflow",
  title: "React 아키텍처 및 내부 원리",
  subtitle: "가상 DOM, Fiber 재조정자, 렌더/커밋 파이프라인과 모던 리액트의 진화",
  tags: [
    "React",
    "Architecture",
    "Virtual DOM",
    "Fiber",
    "Reconciliation",
    "Concurrent",
    "RSC",
    "Hooks"
  ],
  description: `React는 선언적이고 효율적인 사용자 인터페이스를 구축하기 위한 자바스크립트 라이브러리입니다. UI를 순수 함수의 결과물로 모델링하며, 상태 변화를 화면에 반영하기 위해 독창적인 2단계 렌더링 파이프라인(Render Phase와 Commit Phase) 및 Fiber 재조정 엔진을 운영합니다.

### 1. React의 핵심 런타임 아키텍처

React 애플리케이션은 상태(State)와 속성(Props)이 변경될 때마다 화면 전체를 처음부터 다시 그리지 않고, 변경된 최소 단위만을 찾아내어 브라우저 DOM에 고속으로 반영합니다.

- **컴포넌트 트리와 JSX:** JSX 문법은 빌드 시점에 React.createElement 또는 최신 JSX 트랜스폼(_jsx) 함수 호출로 변환되며, 실행 시 가상 DOM 엘리먼트 객체(JavaScript Object)를 반환합니다.
- **Render Phase (렌더 단계):** 새로운 상태가 주어지면 컴포넌트 함수를 실행하고 가상 DOM 트리를 메모리에 구성합니다. Fiber Reconciler가 이전 트리(Current)와 새로운 트리(Work-in-Progress)를 비교(Diffing)하여 실제 변경이 필요한 노드들에 작업 플래그(Effect Tag: Placement, Update, Deletion)를 마킹합니다. 이 단계는 순수 계산 과정이므로 비동기로 실행되며 중간에 일시 중단되거나 우선순위에 따라 재시작될 수 있습니다.
- **Commit Phase (커밋 단계):** 렌더 단계에서 마킹된 Effect 목록을 기반으로 실제 브라우저 DOM 트리에 변경 사항을 단일 배치(Batch)로 일괄 적용합니다. 이 단계는 브라우저 UI의 일관성을 위해 동기적으로 중단 없이 실행됩니다.
- **Passive Effects (부작용 처리 단계):** 브라우저가 화면 페인트(Paint)를 완료한 직후, 비동기로 등록된 useEffect 훅 콜백들이 실행되어 네트워크 요청이나 구독 등의 사이드 이펙트를 처리합니다.

### 2. Fiber Reconciler와 더블 버퍼링

React 16에서 도입된 Fiber 아키텍처는 과거 재귀적 동기 호출로 메인 스레드를 블로킹하던 Stack Reconciler의 한계를 극복하기 위해 설계되었습니다.

- **Fiber 노드 구조:** 컴포넌트 인스턴스, DOM 노드 정보, 상태, 작업 우선순위를 담고 있는 자바스크립트 객체입니다. 3가지 링크드 리스트 포인터(child: 첫 번째 자식, sibling: 다음 형제, return: 부모)를 통해 트리 구조를 선형 작업 단위로 연결합니다.
- **Double Buffering (더블 버퍼링):** 현재 화면에 렌더링된 상태를 나타내는 current 트리와, 백그라운드에서 다음 렌더링을 계산하는 workInProgress 트리를 동시에 유지합니다. 렌더 단계 동안 workInProgress 트리에서 계산을 완료한 후, 커밋 단계의 마지막에 포인터 하나만 교체(workInProgress -> current)함으로써 깜빡임 없이 즉각적으로 화면 상태를 전환합니다.
- **휴리스틱 Diffing 알고리즘:** 완전한 트리 비교(O(n^3)) 대신 React는 두 가지 가정을 기반으로 O(n)의 고속 비교를 수행합니다. 첫째, 서로 다른 타입의 두 엘리먼트는 서로 다른 트리를 만들어냅니다. 둘째, 개발자가 key prop을 제공하면 여러 렌더링 사이에서 어떤 자식 엘리먼트가 고유하게 유지되는지 즉시 식별할 수 있습니다.
- **Hooks의 내부 링크드 리스트:** 함수형 컴포넌트의 Fiber 노드는 memoizedState 필드에 Hook 객체들을 단방향 링크드 리스트 형태로 체이닝하여 보관합니다. 이 때문에 React Hook은 조건문이나 반복문 내부가 아닌 컴포넌트 최상단에서 일정한 순서로 호출되어야 합니다.

### 3. Vanilla JS 및 타 프론트엔드 프레임워크와의 차이점

React는 선언형 UI, 런타임 가상 DOM, 불변성(Immutability) 기반의 단방향 데이터 흐름을 특징으로 합니다. 이는 직접 DOM을 조작하는 Vanilla JS나 다른 프레임워크들과 설계 철학에서 큰 차이를 보입니다.

- **Vanilla HTML/CSS/JS vs React
  - 패러다임 차이:** Vanilla JS는 명령형(Imperative) 방식으로 개발자가 document.getElementById, textContent, classList 등을 직접 호출하여 변경 사항을 지시합니다. 반면 React는 선언형(Declarative)으로 상태(State)를 정의하면 UI가 상태의 함수(UI = f(state))로 자동 계산됩니다.
  - **렌더링 성능 및 최적화:** Vanilla JS에서 연쇄적인 DOM 조작은 잦은 브라우저 Reflow와 Repaint를 유발하여 성능 저하를 일으키기 쉽습니다. React는 Virtual DOM과 Fiber 배치 렌더링을 통해 필요한 DOM 변경을 한 번에 모아서 반영하므로 대규모 애플리케이션에서도 일관된 성능을 보장합니다.
  - **유지보수성:** Vanilla JS는 상태와 DOM의 동기화를 개발자가 직접 관리해야 하므로 규모가 커질수록 사이드 이펙트와 버그가 급증합니다. React는 컴포넌트 기반 아키텍처와 단방향 데이터 바인딩으로 코드의 예측 가능성과 재사용성을 극대화합니다.

- **React vs Vue vs Svelte vs Angular
  - React:** 런타임 가상 DOM과 Fiber 스케줄러를 채택하여 불변성 기반 얕은 비교(Shallow Compare)를 수행합니다. 컴포넌트 단위의 유연한 제어와 방대한 생태계를 자랑합니다.
  - **Vue:** ES6 Proxy를 사용한 미세 반응성(Fine-grained Reactivity) 시스템으로 컴포넌트 렌더링 시 의존성을 자동 추적합니다. 데이터 변경 시 해당 상태를 참조하는 국소 블록만 가상 DOM 패치(Patch)를 수행하여 수동 최적화 부담이 적습니다.
  - **Svelte:** 런타임 가상 DOM을 완전히 배제하고 빌드 타임 컴파일러가 상태 변경 시 해당 DOM 노드를 직접 변경하는 고성능 자바스크립트 코드를 생성합니다. 가상 DOM 오버헤드가 없고 번들 크기가 매우 작습니다.
  - **Angular:** 완전 통합형 엔터프라이즈 프레임워크로 양방향 데이터 바인딩, 의존성 주입(DI), RxJS 기반 반응형 프로그래밍, 엄격한 계층 구조를 기본 제공합니다.

### 4. React의 세대별 주요 아키텍처 진화 과정

- React 0.3 ~ 15 (2013-2016) — 선언적 UI와 Stack Reconciler의 태동
  - React.createClass와 가상 DOM 개념 최초 도입
  - **Stack Reconciler:** 자바스크립트 호출 스택을 통한 재귀적 동기 렌더링. 대규모 컴포넌트 트리에서 렌더링이 시작되면 메인 스레드가 완전히 점유되어 애니메이션 끊김 및 사용자 입력 지연(Jank)이 발생하는 한계가 존재했습니다.

- React 16 (2017) — Fiber 아키텍처 전면 도입
  - Reconciler를 처음부터 다시 작성하여 렌더링 작업을 중단, 재개, 폐기할 수 있는 링크드 리스트 기반 작업 단위(Fiber)로 전환
  - 에러 바운더리(Error Boundaries), Portals, Fragments(다중 루트 노드 반환) 공식 지원

- React 16.8 (2019) — React Hooks 혁명
  - 클래스 컴포넌트의 복잡한 생명주기 메서드(componentDidMount, componentDidUpdate 등)와 this 바인딩 문제를 해결
  - useState, useEffect, useContext 등의 내장 훅과 커스텀 훅을 통해 로직의 분리와 재사용성을 극대화하며 함수형 컴포넌트를 표준으로 정립

- React 17 (2020) — 점진적 업그레이드 지원 (Stepping Stone)
  - 새로운 JSX 변환 엔진(React 임포트 불필요) 도입
  - 이벤트 위임 방식을 document 객체에서 React 루트 DOM 컨테이너 노드로 이전하여 단일 웹페이지 내 다중 React 버전 공존 지원

- React 18 (2022) — 동시성 렌더러(Concurrent Renderer)와 Suspense
  - 동시성(Concurrency) 렌더링 엔진 정식 활성화
  - Automatic Batching: Promise, setTimeout, 네이티브 이벤트 핸들러 내부의 모든 상태 변경을 단일 배치로 자동 병합
  - **Transitions API:** useTransition, useDeferredValue를 통해 긴급한 입력(Urgent)과 화면 전환 작업(Non-urgent Transition)의 우선순위를 분리하여 인터랙션 반응 속도 개선
  - **Streaming SSR:** Suspense를 통한 서버 사이드 렌더링 HTML 스트리밍 및 점진적 하이드레이션(Selective Hydration) 지원

- React 19 (2024~현재) — React Server Components(RSC) 및 React Compiler
  - **React Server Components (RSC):** 서버에서만 실행되는 번들 용량 0의 컴포넌트를 공식 표준화하여 클라이언트 자바스크립트 번들 크기를 획기적으로 감축하고 데이터베이스 직접 접근 허용
  - Server Actions & useActionState: 폼 제출 및 비동기 서버 변경 작업을 간결하게 처리하고 useOptimistic을 통한 낙관적 UI 업데이트 지원
  - **React Compiler (Forget):** 빌드 타임에 컴포넌트와 훅의 종속성을 자동 분석하여 메모이제이션을 기계적으로 적용함으로써 개발자가 useMemo, useCallback을 수동 작성할 필요성을 제거`,
  steps: [
    "1단계: 상태 변경 트리거 — setState 또는 Action 발생으로 스케줄러에 렌더 작업 예약 및 Lane 우선순위 부여",
    "2단계: 렌더 단계 & VDOM 생성 — 컴포넌트 함수 재실행 및 새로운 JSX 기반 Work-in-Progress Fiber 노드 트리 구축",
    "3단계: Fiber 재조정 & Diffing — Current 트리와 WIP 트리를 비교하여 변경 노드에 작업 태그(Placement/Update/Deletion) 마킹",
    "4단계: 커밋 단계 & DOM 일괄 반영 — 마킹된 변경 사항들을 실제 브라우저 DOM에 단일 배치(Mutation)로 일괄 적용",
    "5단계: 페인트 & 비동기 훅 실행 — 브라우저 픽셀 페인트 후 LayoutEffect 및 Passive useEffect 비동기 훅 실행",
    "6단계: 모던 동시성 & RSC — 서버 컴포넌트(Flight 스트림)와 우선순위 기반 동시성 스케줄링으로 메인 스레드 블로킹 방지"
  ],
  examples: [
    "Fiber Reconciler의 더블 버퍼링과 O(n) 휴리스틱 Diffing 알고리즘 원리",
    "Render Phase(비동기 중단 가능)와 Commit Phase(동기 일괄 적용)의 책임 분리 메커니즘",
    "Vanilla JS 직접 조작과 React 가상 DOM의 성능 및 패러다임 차이 비교",
    "React 16 Fiber부터 React 19 Server Components/Compiler까지의 아키텍처 진화 분석"
  ],
  related: [
    { slug: "framework-rendering", category: "workflow", relation: "프론트엔드 프레임워크별(Vanilla/React/Vue/Svelte) 렌더링 파이프라인 비교" },
    { slug: "realtime-protocols", category: "workflow", relation: "실시간 웹소켓/SSE 데이터를 수신하여 React 상태 및 DOM 업데이트 연동" },
    { slug: "virtual-threads", category: "workflow", relation: "백엔드 동시성 모델과 프론트엔드 Concurrent 동시성 스케줄러의 개념 비교" }
  ]
};
