---
name: architecture-visualizer
description: 아키텍처 다이어그램 및 네트워크 시각화 모듈 설계 및 프롬프트 가이드
---

# 아키텍처 시각화 설계 가이드 (architecture-visualizer)

이 가이드는 사용자가 네트워크 아키텍처, 프로토콜 동작 원리, 분산 시스템 흐름의 시각화 모듈을 개발하거나 수정할 때 에이전트가 반드시 준수해야 하는 설계 프레임워크입니다. 본 가이드는 `Visualization-Workflow-Architecture` 명세를 완벽히 준수합니다.

---

## 1. 핵심 설계 원칙

### ① Clarity (시인성)
* 모든 시각화는 인지 부하(Cognitive Load)를 최소화해야 합니다.
* 강한 시각적 계층 구조, 점진적 정보 공개(Progressive Disclosure), 최소한의 시각적 노이즈를 지향합니다.
* 애니메이션은 이해를 돕기 위한 보조 도구이며, 시선을 어지럽히지 않아야 합니다.

### ② Motion (동적 전달)
* 모션은 설명의 핵심 수단입니다.
* 순서(Sequence), 의존성(Dependency), 방향(Direction), 상태 변경(State Changes), 변형(Transformation), 타이밍(Timing)을 명확하게 전달해야 합니다.
* 장식용/의미 없는 무한 루프 애니메이션(예: 지속적인 회전 등)은 지양하고, 실제 패킷 이동이나 연결 통신 흐름에 집중합니다.

### ③ Reusability (재사용성)
* 시각화 모듈은 독립적이고 재사용 가능한 구성 요소(레이어)로 이루어져야 합니다.
* 배경 격자(Grid), 파티클(Particles), 노드(Nodes), 연결선(Edges), 헤드업 디스플레이(HUD) 등을 계층적으로 분리하여 관리합니다.

### ④ Dynamic & Adaptive Theme (동적 테마 및 디자인 커스텀)
* **테마 유연성**: 고정된 네온 다크모드에만 국한되지 않고, 서비스 전반의 라이트/다크 모드 토글에 반응하여 동적으로 색상과 스타일이 전환되도록 설계합니다. Tailwind CSS의 `dark:` 클래스나 CSS 변수를 적극 활용합니다.
* **사전 디자인 합의**: 시각화 컴포넌트나 모듈을 구현하기 전에 사용자에게 어떤 디자인 스타일(예: 네온 다크, 미니멀 플랫, 고대비 라이트/다크 대응형 등)로 구축할지 제안하고, 요구사항에 맞춰 커스텀 스타일을 정의해야 합니다.

---

## 2. 5대 계층 아키텍처 (Layer Responsibilities)

모든 시각화 모듈은 다음 5가지 계층 구조에 따라 논리적/물리적으로 분리되어 드로잉 및 제어됩니다.

```text
App / Scene Manager (상태 및 재생 제어)
 ├── Background Layer (Grid, Glow, Particles - 테마 대응)
 ├── Diagram Layer (100% SVG Nodes, SVG Edges, Labels, Icons)
 ├── Animation Layer (GSAP Timeline, Packet Motion, Camera Controller)
 └── HUD Layer (Metrics, Captions, Explanations, Code Tracer)
```

### ① Scene Manager (씬 매니저)
* `activeStep`과 `isPlaying` 상태를 관리하며, 각 씬(Scene)의 타임라인 예약과 재생을 제어합니다.
* **자동 실행 기본값 (Auto-play on Mount)**: 번거롭게 매번 첫 진입 시 시작 버튼을 누를 필요 없도록, 컴포넌트 마운트와 동시에 자동으로 시뮬레이션이 시작되도록 `isPlaying` 초기값을 `true`로, `activeStep` 초기값을 `0`으로 시작하는 구성을 권장합니다.
* 이전, 다음, 재생/일시정지, 초기화(Reset)의 표준 UX 인터페이스를 일체화하여 제공합니다.
* **플랫 컨트롤러 규격 일치**: 상단 컨트롤바는 무거운 배경 상자(`p-4 border bg-muted/20 shadow-sm`)를 씌우지 않고, 다른 페이지들과 동일하게 플랫하게 나열되는 `flex items-center gap-3 flex-wrap` 레이아웃 구조를 유지해야 합니다. 또한 `data-testid` 속성 및 `aria-label` 등도 완벽하게 맞추어 스케일을 통일합니다.

### ② Background Layer (배경 레이어)
* 사용자의 현재 테마(라이트/다크 모드)에 맞추어 시각화의 깊이와 분위기를 살리는 배경을 형성합니다.
* 예: 라이트 모드에서는 아주 연한 미니멀 격자와 깔끔한 은회색 배경, 다크 모드에서는 깊은 다크 배경과 발광 격자/파티클(Particles) 등을 동적으로 렌더링합니다.

### ③ Diagram Layer (다이어그램 레이어)
* **100% 순수 SVG 설계**: HTML `div` 태그나 SVG의 `foreignObject`를 복합 사용하면 해상도나 배율에 따라 좌표계가 어긋납니다. 모든 노드(`<rect>`, `<text>`), 에지/연결선(`<line>`, `<path>`)은 **단일 고정 viewBox 규격의 SVG 내에서만** 드로잉되어야 합니다.
* **SVG 테두리 투명 버그 해결 (`stroke="currentColor"` + `text-[color]`)**: Tailwind CSS v4 환경 등에서 SVG `rect`나 `path`에 직접 Tailwind `stroke-slate-400` 유틸리티를 적용하면 브라우저 렌더링 시 테두리가 누락되는 호환성 버그가 발생할 수 있습니다. 이를 원천 차단하기 위해 SVG 요소에 **`stroke="currentColor"`와 `strokeWidth`를 인라인 속성으로 명시**하고, 색상 제어는 Tailwind의 **`text-[color]`** 클래스를 통해 상속받도록 설계합니다.
* **스포트라이트 가독성 보장 (배경색 고정 + 테두리 변동)**: 활성화 상태에 따라 노드의 배경색(fill)을 어둡게 하거나 변화시키면 내부의 이모지와 글씨(텍스트)가 뭉쳐 가독성이 완전히 깨지게 됩니다. 노드의 채우기 속성은 **`fill-white dark:fill-zinc-900` 등으로 항상 고정**하고, 오직 **테두리선(stroke)의 두께(2px -> 3px)와 색상 변화만으로 활성 상태를 표출**하십시오.
* **SVG 수직 거대화 방지 (`max-h-[480px]`)**: 세로로 긴 다이어그램을 배치할 경우 데스크톱 큰 해상도에서 수직 공간을 지나치게 낭비하지 않도록, SVG 요소의 클래스에 **`max-h-[480px]`**(또는 화면 비율에 맞는 높이 상한선)를 부여하여 화면 한눈에 쏙 들어오게 통일합니다.

### ④ Animation Layer (애니메이션 레이어)
* **GSAP 타임라인**: 엣지 드로잉, 패킷(원) 이동, 순차 애니메이션, 카메라 줌인/줌아웃(viewBox 보간)은 **GSAP**를 사용하여 정밀하고 부드럽게 구현합니다. (프로젝트 사정에 따라 CSS/Framer Motion도 병행 가능)
* **모션 보간 버그 방지**: `activeStep` 변경 시 모션 그래픽 요소가 이전 단계의 잔여 궤적으로 인해 엉뚱한 좌표로 튀는 현상을 방지하기 위해, 모든 동적 드로잉 엘리먼트에는 `key={activeStep}` 또는 고유 Key를 주입하여 정위치에서 깨끗하게 시작하도록 보장합니다.

### ⑤ HUD Layer (HUD 레이어)
* 단계별 텍스트 설명(Callout 박스), 코드 트레이서(Code Tracer), 실시간 변수 검사기(State Inspector), 성능 지표(Metrics)를 렌더링합니다.
* 설명 Callout 박스는 여유로운 패딩(`p-5 rounded-2xl`)과 큰 폰트 크기(제목 `text-base sm:text-lg font-bold`, 설명 `text-sm sm:text-base`)를 고수해야 합니다.
* **텍스트 마크다운 볼드체 기호 `**` 절대 사용 금지** 지침을 엄격히 준수합니다.

---

## 3. 라이브러리 분담 전략

| 레이어/역할 | 추천 라이브러리 | 핵심 설명 |
| :--- | :--- | :--- |
| **렌더링 기본** | **SVG** | 고품질 렌더링, 정밀 경로 제어, GSAP/Framer Motion 연동 |
| **애니메이션 타임라인** | **GSAP / Framer Motion** | 복합 타임라인 스케줄링, 패킷 이동, 카메라 viewBox 트위닝 |
| **노드 및 HUD 트랜지션** | **Framer Motion** | 컴포넌트 마운트/언마운트 페이드, 스케일, 호버 이펙트 |
| **스타일링** | **Tailwind CSS** | 반응형 레이아웃, Vanilla CSS 커스텀 테마 연동 |

---

## 4. 애니메이션 및 UX 가이드라인 (Gotchas)

### 4.1. 불필요한 지속성 회전 애니메이션의 금지
* 노드나 이모지(예: 🔄, ⚙️)에 무분별한 무한 회전(`animate-spin`)을 주면 불필요한 시각적 피로를 유발합니다.
* **해결책**: 활성화 시 1회성 펄스/스케일 스케일링 또는 테두리 발광(Glow) 효과를 활용하고 회전은 피하십시오.

### 4.2. 마지막 단계 지연 틱 보장 (End-of-Loop Step Dwell)
* 자동 재생 중 마지막 단계(`activeStep === total - 1`)에 다다르자마자 즉시 1단계로 가버리면 사용자가 마지막 연출을 보지 못합니다.
* **해결책**: 마지막 단계에 진입했을 때도 지정된 딜레이만큼 머무른 후 리셋되도록 타이머(`setTimeout` 틱)를 설정하십시오.

### 4.3. SVG DropShadow 필터 에러 방지
* React JSX 타입 스펙 상 `<filter>` 내에서 `<dropShadow>`를 직접 사용하면 타입 에러가 발생하므로 표준 명세인 **`<feDropShadow>`**를 사용해야 합니다.
