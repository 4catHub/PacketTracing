# PacketTracing 프로젝트 에이전트 가이드라인 (AGENTS.md)

이 가이드라인은 `PacketTracing` 시각화 프론트엔드 프로젝트의 전체적인 아키텍처와 시각화 구현 메커니즘, 그리고 사용자가 지향하는 고품질 디자인 방향성을 정의합니다. 새로운 에이전트는 작업을 시작하기 전 이 가이드를 반드시 숙독해야 합니다.

---

## 1. 프로젝트 개요 및 구조

본 프로젝트는 네트워크 패킷 트레이싱, 프로토콜 동작 원리, 알고리즘 흐름을 사용자가 단계별로 제어하며 직관적으로 이해할 수 있게 도와주는 **인터랙티브 웹 비주얼라이저**입니다.

### 핵심 기술 스택
*   **프론트엔드:** React, TypeScript, Vite
*   **라우터:** wouter
*   **스타일링:** Tailwind CSS (Vanilla CSS 테마 및 다크모드 대응)
*   **애니메이션:** Framer Motion (SVG 패킷 모션 및 컴포넌트 상태 전이)

### 디렉토리 구조 및 핵심 파일
*   [App.tsx](file:///Users/yyh/IdeaProjects/PacketTracing/artifacts/visualizer/src/App.tsx): 글로벌 네비게이션 및 스크롤 탑 라우팅 래퍼 관리
*   [Detail.tsx](file:///Users/yyh/IdeaProjects/PacketTracing/artifacts/visualizer/src/pages/Detail.tsx): 주제별 상세 페이지 바인딩 및 시각화 모듈 lazy loading 라우팅 처리
*   [content.ts](file:///Users/yyh/IdeaProjects/PacketTracing/artifacts/visualizer/src/data/content.ts): 각 주제의 텍스트 데이터(설명글, 핵심 단계 메타) 정의 (*설명 텍스트 내 마크다운 볼드체 기호 `**` 제거 지침 준수*)
*   `src/visualizations/`: 실제 시각화 모듈 컴포넌트들의 보관소

### 상태 연동 및 등록 아키텍처 규칙
1.  **정적 데이터 디커플링:** 개별 시각화 컴포넌트는 오직 자신의 `activeStep` 상태(-1에서 `total - 1`로 증감)만을 제어합니다. 하단 설명 Callout 텍스트 및 제목은 `content.ts` 내 정의된 단계별 배열과 실시간 동기화되어 `Detail.tsx`에 의해 동적으로 상속 렌더링됩니다.
2.  **지연 임포트(Lazy Loading) 필수:** 새로운 시각화 모듈을 개발할 경우, `Detail.tsx`에 `lazy(() => import(...))` 형태로 동적 바인딩하고 `VISUALIZERS` 레코드 타입 매핑을 처리하여 빌드 용량 최적화 성능을 보장해야 합니다.
3.  **기존 컴포넌트와의 일관성:** `DfsVsBfsViz.tsx` (방문 노드 Stack/Queue 연동) 및 `GoogleDnsViz.tsx` (DNS recursive query 흐름) 등 작업하지 않은 기존 테두리 모듈들과 제어 흐름(Next, Prev, Reset, Auto Play)의 UX 메커니즘 인터페이스를 일체화해야 합니다.

---

## 2. 시각화 모듈 핵심 설계 원칙

단순히 텍스트만 렌더링되거나 활성 노드 색상만 바뀌는 밋밋한 MVP 수준을 배제하고, 사용자에게 **"동적이고 프리미엄한 지각(Visual) 경험"**을 주는 것을 골자로 합니다.

### ① 100% 순수 SVG 설계 규칙 (가장 중요)
*   **좌표 어긋남 원천 차단:** HTML `div` 태그나 SVG의 `foreignObject`를 혼용하면 브라우저 크기, 윈도우 배율, 디바이스 픽셀 밀도에 따라 좌표계 스케일이 불일치하여 연결 화살표나 흐르는 패킷(원)의 경로가 빗나가는 현상이 발생합니다.
*   **해결책:** 모든 다이어그램 노드(둥근 사각형 `<rect>`, 이모지 및 텍스트 `<text>`)와 연결 경로 및 패킷은 **반드시 100% SVG 요소 내에서 고정 viewBox 스펙**으로 드로잉되어야 합니다.

### ② Framer Motion 보간 버그 및 리셋 규칙
*   **문제 현상:** 단계가 바뀔 때(activeStep 변경) 기존의 `<motion.circle>`이나 `<motion.line>`을 재사용하면, 이전 단계의 잔여 궤적 값이 다음 단계 출발 좌표와 보간(Interpolation)되어 **출발지가 빗나가거나 엉뚱한 지점에서 솟구치듯 출발하는 버그**가 생깁니다.
*   **해결책:** 모든 모션 드로잉 엘리먼트에는 반드시 `key={activeStep}` 또는 `key={`line-${activeStep}`}`과 같이 **activeStep 기반의 고유 Key를 주입**하여, 상태 전이 시 엘리먼트가 즉각 마운트/언마운트되며 온전히 `0%` 정위치에서 정시 출발하도록 보장하십시오.
*   **직선/점선 완성도:** 화살표를 나타내는 `<line>` 컴포넌트를 정의할 때, 수평/수직의 정밀도를 유지하기 위해 시작 높이(`y1`)와 끝 높이(`y2`)가 완벽히 매치되도록 설정해야 합니다. (`y2` 속성 누락 시 기본값 `0` 대입으로 사선 솟구침 오류 야기)

### ③ 프로토콜 및 데이터 포맷의 구체적 시각화
*   단순한 흐름 묘사에 그치지 말고, 네트워크상에서 오가는 **실제 데이터 구조 및 페이로드**를 코드 블록 등으로 명확히 함께 시각화해야 합니다.
    *   **REST vs gRPC:** JSON 텍스트 원본 데이터와 Protocol Buffers의 콤팩트한 Hex 이진 바이너리 데이터 포맷 대조.
    *   **JWT vs Session:** Cookie에 적히는 무작위 세션 키 데이터와 JWT의 삼색 컬러 구조(`Header.Payload.Signature`) 및 JWT 해독 페이로드 정보 시각 대조.
    *   **HTTPS Handshake:** CA 인증서 카드 날아가는 연출, 수학적 디피-힐만 대칭키 연산 중인 CPU 기어 회전 모션, 대칭 세션키 생성 후 연결선 보안 녹색 활성화 및 암호 터널 쉴드 가시화.
    *   **WebSocket:** 초기 Upgrade 단계에서는 1선 HTTP 점선을 타다가, 연결 확립 시 상/하 2가닥의 영구 양방향 소켓 파이프(Tx 송신로, Rx 수신로)가 켜지고, 송신 시에는 위쪽 선(`cy="35%"`)을, 수신 시에는 아래쪽 선(`cy="65%"`)을 타고 패킷이 자유롭게 흘러가는 양방향 묘사 준수.

### ④ 가독성 및 가시성 보장
*   단계별 설명 Callout 박스는 사용자 가독성을 극대화하기 위해 여유로운 패딩(`p-5 rounded-2xl`)과 확실하게 큰 폰트 크기(**제목 `text-base sm:text-lg font-bold`**, **설명 `text-sm sm:text-base`**)를 고수해야 합니다.
*   라우트가 변경되거나 Detail 페이지 진입 시에는 브라우저 스크롤을 항상 최상단(`window.scrollTo({ top: 0, behavior: "instant" })`)으로 초기화합니다.

### ⑤ 폰트 및 레이아웃 가이드라인 규격
*   **상세 페이지 최대 너비:** 시각화 패널과 설명글의 가독성을 극대화하기 위해 전체 컨테이너 너비는 `max-w-5xl` (1024px) 규격을 유지합니다.
*   **컴포넌트 폰트 통일화:** 개별 시각화 컴포넌트 내부 텍스트 스타일은 사용자 가독성을 통일하기 위해 다음 스펙을 따릅니다:
    *   버튼 레이블: `text-sm font-medium`
    *   타이틀 및 핵심 헤더: `text-sm sm:text-base font-semibold`
    *   상세 설명 및 범례/부가 정보: `text-xs sm:text-sm text-muted-foreground`
    *   도표/목록 및 그리드 인덱스: `text-xs sm:text-sm font-mono` 또는 `text-[10px]` 등
*   **반응형 레이아웃 오버플로우 방지:** Docker나 K8s와 같이 좌우 2열로 나열되는 그리드는 좁은 가로 폭 환경(모바일/태블릿)에서 찌그러지지 않고 1열로 떨어지도록 `grid-cols-1 md:grid-cols-2` 구성을 강제하고, 카드 내외 패딩을 타이트하게 조율하여 레이아웃 경계를 넘어가거나 잘리지 않도록 설계해야 합니다.

### ⑥ 동적 테마 연동 및 사용자 디자인 커스텀 (컨셉 합의 필수)
*   **동적 테마 연동**: 고정된 네온 다크모드만을 고집하지 마십시오. 웹 서비스 자체의 다크모드/라이트모드 토글에 부합하도록, 비주얼라이저의 선, 격자, 노드 배경, 패킷 등의 모든 스타일이 테마 전환에 맞게 동적으로 전환되어야 합니다. Tailwind의 `dark:` 프리픽스나 CSS 변수를 다각도로 활용하십시오.
*   **사용자 디자인 커스텀 조율**: 개발이나 리팩토링에 들어가기 전, 사용자에게 어떤 디자인 테마 컨셉(예: 네온 다크, 미니멀 클린, 플랫 고대비 등)으로 화면을 구축할지 물어보고, 사용자 요구에 맞춰 커스텀 스타일을 조율한 뒤 개발을 착수하십시오.

### ⑦ 단일 뷰(Unified View) 및 세로 직렬 흐름 설계
*   **통합 시뮬레이션 지향**: 사용자가 단계를 일일이 클릭하며 조작해야 하는 번거로운 스텝 기반 UI보다는, 하나의 통합된 시각화 캔버스 안에서 복수의 시나리오/단계(예: 정상 -> 지연 -> 차단 등)가 시간 경과에 따라 부드럽게 자동 순환(Auto-cycling Loop)하며 재생되는 형태를 선호합니다.
*   **세로 직렬(Top-to-Bottom) 레이아웃**: 요청 및 데이터의 흐름이 위에서 아래(예: Client -> Control Area -> Backend/Blocked Path)로 흐르도록 물리적 구조를 세로 방향으로 직렬화하고, 다이어그램과 인스펙터(HTTP Header/JSON Payload, 실시간 지표 변수) 역시 세로로 차곡차곡 배치하여 높은 가독성을 유도합니다. (한 행에는 자료 하나만 배치 권장)
*   **진행 상태 HUD 및 수동 병행**: 자동 순환 시 현재 상태의 Latency나 남은 초 단위를 시각적으로 보여주는 진행률 및 타이머 표시를 동반하며, 사용자가 직접 수동으로 흐름을 제어하거나 탭을 선택해 특정 상태에 머무를 수 있도록 Play/Pause 제어 및 탭 메뉴를 함께 제공합니다.


---

## 3. 개발 중 주의해야 할 Gotchas (기술적 제약)

*   **SVG DropShadow 필터 에러:** React JSX 타입 스펙상 SVG `<filter>` 내부에서 표준 명세인 `<feDropShadow>` 대신 `<dropShadow>`를 사용하면 JSX 타입 검사 시 `Property 'dropShadow' does not exist on type 'JSX.IntrinsicElements'` 에러가 발생하므로 반드시 표준 명세인 **`feDropShadow`**를 써야 합니다.
*   **Vite 환경변수 의존성:** `vite.config.ts` 빌드 시 `PORT` 및 `BASE_PATH` 환경 변수가 필수적으로 입력되어 구동되므로 로컬 구동 가이드 시 이를 누락하지 않도록 합니다.
