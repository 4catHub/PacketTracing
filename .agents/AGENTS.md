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
*   [Detail.tsx](file:///Users/yyh/IdeaProjects/PacketTracing/artifacts/visualizer/src/pages/Detail.tsx): 주제별 상세 페이지 바인딩 및 시각화 모듈 lazy loading 라우팅 처리. 개요(Overview) 탭에는 모던 카드형 인포그래픽 렌더러인 [UniversalOverview.tsx](file:///Users/yyh/IdeaProjects/PacketTracing/artifacts/visualizer/src/components/overviews/UniversalOverview.tsx) 또는 전용 컴포넌트([ReactArchitectureOverview.tsx](file:///Users/yyh/IdeaProjects/PacketTracing/artifacts/visualizer/src/components/overviews/ReactArchitectureOverview.tsx))를 바인딩하여 렌더링합니다.
*   [content.ts](file:///Users/yyh/IdeaProjects/PacketTracing/artifacts/visualizer/src/data/content.ts): 각 주제의 분리된 텍스트 데이터를 임포트하여 취합 및 등록하는 엔트리 포인트.
*   `src/data/content/algorithms/` & `src/data/content/workflows/`: 각 주제의 세부 설명, 핵심 단계, 예시 등이 개별 파일로 완전히 분리되어 관리됩니다.
    *   **개요 포맷팅 규칙:** 각 파일의 `description`은 마크다운 헤더(`### 소제목`)로 단락을 구분하고, 각 설명 항목은 `- **핵심키워드:** 세부 설명` 형식으로 명확하게 볼드 처리 및 인라인 코드를 적용하여 구조화합니다.
    *   **Gotcha:** 모든 분리된 콘텐츠 파일의 객체는 `ContentItem` 타입을 준수해야 하며, **`examples` 배열 속성이 필수**로 정의되어 있어야 합니다. 누락 시 타입 컴파일 에러가 발생합니다.
*   `src/visualizations/`: 실제 시각화 모듈 컴포넌트들의 보관소

### 상태 연동 및 등록 아키텍처 규칙
1.  **정적 데이터 디커플링:** 개별 시각화 컴포넌트는 오직 자신의 `activeStep` 상태(-1에서 `total - 1`로 증감)만을 제어합니다. 하단 설명 Callout 텍스트 및 제목은 `content.ts` 내 정의된 단계별 배열과 실시간 동기화되어 `Detail.tsx`에 의해 동적으로 상속 렌더링됩니다.
2.  **지연 임포트(Lazy Loading) 필수:** 새로운 시각화 모듈을 개발할 경우, [registry.ts](file:///Users/yyh/IdeaProjects/PacketTracing/artifacts/visualizer/src/visualizations/registry.ts)에 `lazy(() => import(...))` 형태로 동적 바인딩하고 `VISUALIZER_REGISTRY` 레코드 타입 매핑을 처리하여 빌드 용량 최적화 성능을 보장해야 합니다.
3.  **기존 컴포넌트와의 일관성:** `DfsVsBfsViz.tsx` (방문 노드 Stack/Queue 연동) 및 `GoogleDnsViz.tsx` (DNS recursive query 흐름) 등 작업하지 않은 기존 테두리 모듈들과 제어 흐름(Next, Prev, Reset, Auto Play)의 UX 메커니즘 인터페이스를 일체화해야 합니다.

---

## 2. 시각화 모듈 핵심 설계 원칙

단순히 텍스트만 렌더링되거나 활성 노드 색상만 바뀌는 밋밋한 MVP 수준을 배제하고, 사용자에게 **"동적이고 프리미엄한 지각(Visual) 경험"**을 주는 것을 골자로 합니다.

### ① 100% 순수 SVG 설계 규칙 (가장 중요)
*   **좌표 어긋남 원천 차단:** HTML `div` 태그나 SVG의 `foreignObject`를 혼용하면 브라우저 크기, 윈도우 배율, 디바이스 픽셀 밀도에 따라 좌표계 스케일이 불일치하여 연결 화살표나 흐르는 패킷(원)의 경로가 빗나가는 현상이 발생합니다.
*   **해결책:** 모든 다이어그램 노드(둥근 사각형 `<rect>`, 이모지 및 텍스트 `<text>`)와 연결 경로 및 패킷은 **반드시 100% SVG 요소 내에서 고정 viewBox 스펙**으로 드로잉되어야 합니다.

### ② Framer Motion 보간 버그 및 리셋 규칙
*   **문제 현상:** 단계가 바뀔 때(activeStep 변경) 기존의 `<motion.circle>`이나 `<motion.line>`을 재사용하면, 이전 단계의 잔여 궤적 값이 다음 단계 출발 좌표와 보간(Interpolation)되어 **출발지가 빗나가거나 엉뚱한 지점에서 솟구치듯 출발하는 버그**가 생깁니다.
*   **해결책:** 모든 모션 드로잉 엘리먼트에는 반드시 `key={activeStep}` 또는 `key={`line-${activeStep}`}`과 같이 **activeStep 기반의 고유 Key를 주입**하여, 상태 전이 시 엘리먼트가 즉각 마운트/운마운트되며 온전히 `0%` 정위치에서 정시 출발하도록 보장하십시오.
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
*   **시뮬레이션 단계(Step) 진행 시 스크롤 자동 이동 금지:** 시각화 내의 재생 단계(Step)나 로깅 콘솔 등이 업데이트될 때 `scrollIntoView()` 등을 호출하여 브라우저 창이나 레이아웃의 스크롤 위치를 임의로 이동시키는 행위를 금지합니다. 사용자의 뷰포트 시선 흐름을 고정하고 방해하지 않아야 합니다.

### ⑤ 폰트 및 레이아웃 가이드라인 규격
*   **상세 페이지 최대 너비:** 시각화 패널과 설명글의 가독성을 극대화하기 위해 전체 컨테이너 너비는 `max-w-5xl` (1024px) 규격을 유지합니다.
*   **컴포넌트 폰트 통일화:** 개별 시각화 컴포넌트 내부 텍스트 스타일은 사용자 가독성을 통일하기 위해 다음 스펙을 따릅니다:
    *   버튼 레이블: `text-sm font-medium`
    *   타이틀 및 핵심 헤더: `text-sm sm:text-base font-semibold`
    *   상세 설명 및 범례/부가 정보: `text-xs sm:text-sm text-muted-foreground`
    *   도표/목록 및 그리드 인덱스: `text-xs sm:text-sm font-mono` 또는 일부 미니 가이드만 `text-[10px]`으로 제한. **일반 가독성을 위해 과도하게 작은 `text-[10px]` 이하 크기 사용을 지양하고 최소 `text-xs` (12px) 이상을 기본 준수합니다.**
*   **코드 영역 자동 줄바꿈:** Python 구현 코드 등 코드 텍스트 영역의 `<pre>` 태그에는 반드시 `className="whitespace-pre-wrap font-mono"` 속성을 추가하여, 긴 명령어가 잘리지 않고 한눈에 줄바꿈되도록 구현합니다.
*   **반응형 레이아웃 오버플로우 방지:** Docker나 K8s와 같이 좌우 2열로 나열되는 그리드는 좁은 가로 폭 환경(모바일/태블릿)에서 찌그러지지 않고 1열로 떨어지도록 `grid-cols-1 md:grid-cols-2` 구성을 강제하고, 카드 내외 패딩을 타이트하게 조율하여 레이아웃 경계를 넘어가거나 잘리지 않도록 설계해야 합니다.

### ⑥ 동적 테마 연동 및 사용자 디자인 커스텀 (컨셉 합의 필수)
*   **동적 테마 연동**: 고정된 네온 다크모드만을 고집하지 마십시오. 웹 서비스 자체의 다크모드/라이트모드 토글에 부합하도록, 비주얼라이저의 선, 격자, 노드 배경, 패킷 등의 모든 스타일이 테마 전환에 맞게 동적으로 전환되어야 합니다. Tailwind의 `dark:` 프리픽스나 CSS 변수를 다각도로 활용하십시오.
*   **검정색 도배 지양 및 전체 색상 대비 밸런싱 (Anti-Black-Out Rule)**: 씬이나 패널, 혹은 시각화 영역의 배경을 고정적으로 `#000000`이나 `#0B0F19`(어두운 남색/검정) 등의 검정색으로 도배하지 마십시오. 라이트 모드에서는 연한 회색/흰색(`bg-slate-50`, `bg-zinc-50`), 다크 모드에서는 깊은 무채색(`dark:bg-zinc-950`) 등으로 분기 제어하여 테마의 일관성을 높이십시오.
*   **포인트/말풍선 가독성 강화**: 패킷 포인트나 정보 말풍선의 배경을 무조건 검정색(`fill="#0F172A"`, `bg-slate-900`)으로 채우지 마십시오. 글자의 색상이 어두운 배경에 묻히지 않도록, 고대비 색상을 사용하여 투명도가 없으면서 텍스트가 명확히 분리되는 연출을 고수하십시오.
*   **사용자 디자인 커스텀 조율**: 개발이나 리팩토링에 들어가기 전, 사용자에게 어떤 디자인 테마 컨셉(예: 네온 다크, 미니멀 클린, 플랫 고대비 등)으로 화면을 구축할지 물어보고, 사용자 요구에 맞춰 커스텀 스타일을 조율한 뒤 개발을 착수하십시오.

### ⑦ 단일 뷰(Unified View) 및 세로 직렬 흐름 설계
*   **통합 시뮬레이션 지향**: 사용자가 단계를 일일이 클릭하며 조작해야 하는 번거로운 스텝 기반 UI보다는, 하나의 통합된 시각화 캔버스 안에서 복수의 시나리오/단계(예: 정상 -> 지연 -> 차단 등)가 시간 경과에 따라 부드럽게 자동 순환(Auto-cycling Loop)하며 재생되는 형태를 선호합니다.
*   **세로 직렬(Top-to-Bottom) 레이아웃**: 요청 및 데이터의 흐름이 위에서 아래(예: Client -> Control Area -> Backend/Blocked Path)로 흐르도록 물리적 구조를 세로 방향으로 직렬화하고, 다이어그램과 인스펙터(HTTP Header/JSON Payload, 실시간 지표 변수) 역시 세로로 차곡차곡 배치하여 높은 가독성을 유도합니다. (한 행에는 자료 하나만 배치 권장)
*   **진행 상태 HUD 및 수동 병행**: 자동 순환 시 현재 상태의 Latency나 남은 초 단위를 시각적으로 보여주는 진행률 및 타이머 표시를 동반하며, 사용자가 직접 수동으로 흐름을 제어하거나 탭을 선택해 특정 상태에 머무를 수 있도록 Play/Pause 제어 및 탭 메뉴를 함께 제공합니다.

### ⑧ 알고리즘 시각화 페이지 표준 레이아웃 및 설계 규칙
*   **고유 알고리즘 명칭 적용:** 단순 기법 분류(예: 동적 계획법)보다는 구체적인 해결 대상을 명시한 고유 알고리즘 명칭(예: 냅색 알고리즘 (Knapsack), 다익스트라 최단 경로 등)을 컴포넌트 및 문서 타이틀로 설정합니다.
*   **좌우 2열 Grid 구조(기본)**: 알고리즘 시각화(DFS/BFS, 정렬, 에라토스테네스의 체 등) 페이지는 좌측 7열(`lg:col-span-7`) 및 우측 5열(`lg:col-span-5`) 구조의 그리드 레이아웃을 사용합니다.
*   **좌측 열 배치 순서**:
    1. 알고리즘 모드 셀렉터 (필요 시)
    2. **최소화된 컨트롤 플레이어:** 재생/일시정지/리셋 버튼과 속도 조절 슬라이더는 큰 면적을 차지하지 않도록 1행 구성(`flex-row` 콤팩트 구성)으로 얇게 통합 배치합니다. 재생기 상단에 불필요한 중복 뱃지 태그를 삽입하는 행위는 금지합니다.
    3. 진행도 프로그레스 바 및 단계 정보
    4. 변수 상태 추적 (Variables HUD) - 3열 혹은 4열 그리드로 실시간 주요 변수의 값을 출력.
    5. 시각화 그래프/차트 영역 (Visual Canvas Area)
*   **시각화 영역 내 복수 레이아웃 비율 조율:** 좌측 영역 내에 여러 visual 컴포넌트(예: 배낭 상태 + 아이템 카드 그리드)가 동시에 포함될 때는 핵심 시뮬레이션 영역의 비율을 더 넓히고 항목 리스트 영역을 축소하여 균형을 맞춥니다. (예: 배낭 적재 박스 `flex-[1.3] max-w-[240px]`, 아이템 선택 목록 그리드 `flex-1`)
*   **DP 테이블 점화식 비교 가시화:** 2차원 테이블 격자를 렌더링할 때는 단순 숫자만 나열하지 않고, 연산 결과가 도출되는 과정(`target` 셀 - 파란색 강조)과 이를 비교 연산하기 위해 참조하는 이전 행 값(`prevBest` 제외 셀 - 하늘색 강조), 대각선 값(`withCurrent` 선택 셀 - 주황색 강조)을 컬러 배색과 상단 뱃지 텍스트로 명확히 명기하여 점화식 원리를 직관적으로 이해시킵니다.
*   **우측 열 배치 순서**:
    1. Python 구현 코드 패널 (표준 라이브러리 임포트문 `from ~`은 제거한 순수 함수 형태 및 2칸 들여쓰기 준수, 스크롤바가 생기지 않도록 `h-auto` 자동 높이)
    2. 알고리즘 단계별 상태 분석 자료구조 카드 (Stack/Queue, Visited 등) - 가로 2분할이 아니라, 각각 개별적인 가로 1행씩 세로로 직렬 나열.
*   **단계별 설명 영역 제거**: 시뮬레이션 내부의 독자적인 단계별 설명 Callout 박스(Step Callout)는 완전히 삭제하고, `content.ts` 및 `Detail.tsx` 공통 상속 영역에 텍스트 노출 역할을 일임하여 화면의 이중 텍스트 노이즈를 제거합니다.
*   **반응형 그래프 캔버스 및 절대좌표 노드 보정**:
    *   그래프/차트 캔버스 래퍼는 부모 너비에 꽉 차는 `w-full` 및 CSS `aspectRatio` 인라인 스타일(예: `style={{ aspectRatio: "400 / 220" }}`)을 부여하여 브라우저 수준에서 정확한 화면 비율을 제어합니다.
    *   캔버스 내의 노드는 미적 비주얼(테두리, ring-offset, animation 등)을 최대로 살릴 수 있는 HTML overlay (`motion.div`) 방식을 사용하며, 해상도 변화로 인해 SVG 연결선과 노드 중심이 어긋나지 않도록 노드의 위치(left, top)를 백분율 퍼센트 비율(`left: (x / viewBoxWidth) * 100%`)로 계산하여 동적 배치합니다.

### ⑨ 컨트롤러 최소화, 자동 재생 및 개요(Overview) 모던 카드형 인포그래픽 표준화 규칙
*   **진행 바 및 컨트롤러 UI 최소화:** 시각화 조작용 플레이어 컨트롤러(Play, Pause, Reset, Next, Prev)와 속도 슬라이더, 그리고 단계 진행률을 표시하는 게이지 바(Progress Bar)는 캔버스 주변의 큰 면적을 차지하지 않도록 얇은 단일 행(Horizontal Bar)으로 컴팩트하게 통합하여 배치합니다.
*   **자동 재생(Autoplay) 및 자동 순환(Auto-cycling):** 사용자가 시뮬레이션을 손수 일일이 조작할 필요가 없도록 페이지 로드 시 즉시 자동 재생이 활성화되어야 하며, 탐색/워크플로우의 마지막 단계에 도달하면 적절한 딜레이(예: 3초)를 두고 다시 처음 단계로 돌아가 루핑 재생되는 자동 순환 상태 메커니즘을 기본 적용합니다.
*   **개요 영역 1행 1카드(Full-width) 직렬 배치:** 개요 영역은 여러 열로 쪼개져 텍스트가 좁아지지 않도록, 각 소문단/소주제마다 1행에 카드 1개(`rounded-2xl border bg-card p-5 sm:p-6 shadow-xs`)를 배치하여 넉넉한 너비와 여백을 제공합니다.
*   **색채 절제 및 가독성 집중 (Minimal Tone):** 인포그래픽 카드 내부에서는 과도하게 많은 색상을 남발하지 않고 모노톤 베이스에 포인트 강조(Border, Dot, Badge)만을 사용하여 내용 읽기에 몰입할 수 있도록 설계합니다. 단, 세대별 히스토리 타임라인과 같이 시각적 구분이 명확해야 하는 영역은 포인트 컬러를 적절히 활용합니다.
*   **핵심 키워드 볼드 및 인라인 코드 필수:** 각 설명 항목의 첫머리는 `- **핵심키워드:** 세부 설명` 또는 `- **용어 (Term):** 세부 설명` 형태로 명확하게 볼드 처리하고, 프로토콜, 함수명, 키워드 등은 `<code />` 인라인 태그로 감싸 시각적 계층 구조를 뚜렷하게 제공합니다. 불릿 기호(`-`)와 번호(`01.`)가 중복으로 겹쳐 노출되지 않도록 깔끔하게 정돈합니다.

### ⑩ 연관 포스트 (Related Visualizations) 연결 및 UI 규칙
*   **상호 연관 데이터 매핑 (`related`):** 모든 콘텐츠(`ContentItem`)는 개념적으로 연관된 다른 워크플로우/알고리즘 포스트들을 교차 참조할 수 있도록 `related: Array<{ slug: string; category: Category; relation?: string }>` 속성을 정의합니다.
*   **상세 페이지 영역 배치:** [Detail.tsx](file:///Users/yyh/IdeaProjects/PacketTracing/artifacts/visualizer/src/pages/Detail.tsx)에서 개요(Overview) 및 핵심 단계(Steps) 다음 하단 섹션에 **"연관 포스트"** 헤더(`h3 text-lg font-bold`)를 배치하고 3열 반응형 그리드(`grid-cols-1 md:grid-cols-2 lg:grid-cols-3`)로 카드를 렌더링합니다. 링크 경로는 `/category` 접두사 없이 `/${categoryPath}/${slug}` (예: `/workflows/api-gateway`)로 직접 연결합니다.
*   **카드 UI 구성 규격:** 각 연관 카드는 **카테고리 뱃지(워크플로우/알고리즘), 제목(`relItem.title`), 서브타이틀(`relItem.subtitle`)**만을 깔끔하게 표시하며, 시각적 노이즈를 줄이기 위해 카드 내부의 부가 설명 문구는 노출하지 않습니다.

---

## 3. 개발 중 주의해야 할 Gotchas (기술적 제약)

*   **SVG DropShadow 필터 에러:** React JSX 타입 스펙상 SVG `<filter>` 내부에서 표준 명세인 `<feDropShadow>` 대신 `<dropShadow>`를 사용하면 JSX 타입 검사 시 `Property 'dropShadow' does not exist on type 'JSX.IntrinsicElements'` 에러가 발생하므로 반드시 표준 명세인 **`feDropShadow`**를 써야 합니다.
*   **Vite 환경변수 의존성:** `vite.config.ts` 빌드 시 `PORT` 및 `BASE_PATH` 환경 변수가 필수적으로 입력되어 구동되므로 로컬 구동 가이드 시 이를 누락하지 않도록 합니다.


