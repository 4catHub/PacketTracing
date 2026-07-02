---
name: architecture-visualizer
description: 아키텍처 다이어그램 및 네트워크 시각화 모듈 설계 및 프롬프트 가이드
---

# 아키텍처 시각화 설계 가이드 (architecture-visualizer)

이 가이드는 사용자가 네트워크 아키텍처, 프로토콜 동작 원리, 분산 시스템 흐름의 시각화 모듈을 새로 개발하거나 수정해 달라고 요청할 때 에이전트가 반드시 준수해야 하는 설계 프레임워크입니다.

## 1. 프롬프트 수집 체크리스트
사용자가 아키텍처 시각화를 요청할 때, 아래의 5가지 축이 명확히 정의되어 있는지 먼저 검증하십시오. 누락된 내용이 있다면 사용자에게 명확히 다시 질문하여 설계를 고도화한 후 구현에 착수해야 합니다.
1. **주제 및 레이아웃**: 대조 구도(Grid), 단일 관문(Hub-and-Spoke), 선형 흐름(Chain) 등.
2. **컴포넌트 구성**: 등장할 노드(클라이언트, 게이트웨이, 서버, DB, 캐시 등)들의 역할과 개수.
3. **단계별 시나리오**: `activeStep`에 연동되어 순차적으로 변화할 단계별 메타 데이터(최대 3~5단계 권장).
4. **애니메이션 및 물리 연출**: 무한 루프 파티클 밀도, 쉴드 이펙트, 기어 회전, 튕겨 나가는 폭포수 드롭 등.
5. **동적 지표 업데이트**: 실시간 트래픽 증가에 따른 비선형 카운터 업데이트 및 경고 시스템.

## 2. 100% 순수 SVG 구현 원칙 (가장 중요)
HTML `div` 태그나 SVG의 `foreignObject`를 복합 사용하면 해상도나 크기 배율에 따라 좌표계가 어긋납니다.
* 모든 요소(둥근 사각형 `<rect>`, 이모지/텍스트 `<text>`, 연결선 `<line>`, 궤적 `<path>`)는 **단일 고정 viewBox 규격의 SVG 요소 내**에서 드로잉되어야 합니다.
* 모션 보간 버그를 원천 차단하기 위해 모든 `<motion.circle>`이나 `<motion.line>` 등 모션 그래픽 요소에는 반드시 `key={activeStep}` 또는 `key={`particle-${idx}-${activeStep}`}`과 같이 **activeStep 기반의 고유 Key를 명시**하십시오.
* 직선이나 화살표 드로잉 시 `y1`과 `y2` 높이를 정밀하게 매치하여 튀어 오르는 버그를 방지하십시오.

## 3. 프리미엄 시각화 컴포넌트 템플릿 코드 구조
신규 컴포넌트를 설계할 때는 항상 아래의 표준 구도를 유지하십시오.

```tsx
import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Pause, RotateCcw, ChevronLeft, ChevronRight, Clock } from "lucide-react";

// 1. 정적 단계 정의 (설명 볼드체 기호 ** 절대 사용 금지)
const STEPS = [
  { title: "1. 정상 요청", timing: "< 10ms", desc: "정상 트래픽 흐름 설명" },
  { title: "2. 이벤트 발생", timing: "~100ms", desc: "이펙트 변화 설명" },
];

export default function NewArchitectureViz() {
  const [activeStep, setActiveStep] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [counter, setCounter] = useState(0);
  
  // 2. 타이머 및 자동 재생 로직
  // 3. 상태별 카운터 스케줄러 로직
  // 4. 컨트롤러 UI 렌더링 (동작 인터페이스 일체화)
  // 6. 하단 단계 설명 Callout 박스 (여유로운 패딩 p-5 rounded-2xl, 타이틀 text-base sm:text-lg font-bold, 설명 text-sm sm:text-base)
}
```

## 4. 코드 실행 추적 시각화 기법 (Code Stepping & Line Highlighting)
사용자가 알고리즘 또는 아키텍처 흐름에 대한 파이썬(또는 슈도코드) 한 줄씩 실행되는 코딩 추적 연출을 요구할 경우, 다음 패턴에 맞춰 레이아웃과 데이터 모델을 바인딩하십시오.

### 4.1. 코드 라인 데이터 및 activeStep 매핑 설계
각 실행 줄을 배열로 선언하고, `activeStep`의 값에 따라 하이라이트할 라인 번호와 동적 변수들의 값을 기록합니다.

```typescript
// 1. 시각화할 소스 코드 정의 (Python 예시)
const PYTHON_CODE = [
  "def search_flow(request):",                  // lineIdx: 0
  "    token = get_token()",                    // lineIdx: 1
  "    if token > 0:",                          // lineIdx: 2
  "        route_request(request)",             // lineIdx: 3
  "    else:",                                  // lineIdx: 4
  "        block_request(request)"              // lineIdx: 5
];

// 2. 각 activeStep에 매핑되는 하이라이트 라인 인덱스 및 변수 스냅샷 정의
const CODE_STEPS = [
  { highlightIdxs: [1], variables: { token: 4, status: "Init" } },       // 1단계 (정상 시작)
  { highlightIdxs: [2, 3], variables: { token: 3, status: "Routed" } },   // 2단계 (토큰 차감 및 라우팅)
  { highlightIdxs: [2, 5], variables: { token: 0, status: "Blocked" } }   // 3단계 (토큰 부족 및 차단)
];
```

### 4.2. UI 레이아웃 구성 (Diagram + Code Tracer + State Inspector)
시각화 화면 내부의 가로 너비 제한을 고려하여, 데스크톱에서는 2열(또는 3열) 그리드 형태로 다이어그램과 코드 트레이서를 나란히 구성하고 모바일 환경에서는 위아래로 자연스럽게 정렬되도록 Tailwind 클래스를 설계합니다.

* **좌측 열 (다이어그램 SVG)**: `w-full lg:w-2/3`
* **우측 열 (코드 트레이서 & 변수 뷰어)**: `w-full lg:w-1/3 space-y-4`

```tsx
<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
  {/* 1. 다이어그램 영역 (2열 차지) */}
  <div className="lg:col-span-2">
    <svg viewBox="0 0 600 500">...</svg>
  </div>

  {/* 2. 코드 & 변수 상태 영역 (1열 차지) */}
  <div className="space-y-4 flex flex-col justify-between">
    {/* 코드 하이라이터 */}
    <div className="p-4 rounded-xl bg-card border border-card-border font-mono text-xs overflow-x-auto space-y-1">
      <div className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider mb-2">💻 Python Tracer</div>
      {PYTHON_CODE.map((line, idx) => {
        const isHighlighted = activeStep >= 0 && CODE_STEPS[activeStep]?.highlightIdxs.includes(idx);
        return (
          <div
            key={idx}
            className={`px-2 py-0.5 rounded transition-colors ${
              isHighlighted 
                ? "bg-amber-500/25 text-amber-300 font-bold border-l-4 border-amber-500 -ml-2" 
                : "text-muted-foreground"
            }`}
          >
            <span className="inline-block w-4 text-[10px] text-muted-foreground/50 mr-2">{idx + 1}</span>
            {line}
          </div>
        );
      })}
    </div>

    {/* 변수 상태(Variables Inspector) 모니터 */}
    <div className="p-4 rounded-xl bg-muted/40 border border-border font-mono text-xs">
      <div className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider mb-2">🔍 State Inspector</div>
      {activeStep >= 0 ? (
        <div className="grid grid-cols-2 gap-y-1">
          {Object.entries(CODE_STEPS[activeStep].variables).map(([key, val]) => (
            <div key={key} className="flex justify-between border-b border-border/30 pb-0.5">
              <span className="text-muted-foreground">{key}:</span>
              <span className="text-foreground font-semibold">{String(val)}</span>
            </div>
          ))}
        </div>
      ) : (
        <span className="text-muted-foreground/60 italic">대기 중...</span>
      )}
    </div>
  </div>
</div>
```

## 5. 애니메이션 및 UX 세부 가이드라인 (UX & Animation Best Practices)
시각화 구성 시 사용자 피로도를 낮추고 흐름의 인과관계를 매끄럽게 인지시키기 위해 다음 수칙들을 엄격히 적용하십시오.

### 5.1. 불필요한 지속성 회전 애니메이션의 금지
* 노드나 이모지(예: 🔄, ⚙️)에 무분별하게 지속적인 회전 애니메이션(`animate-spin` 등)을 적용하면 새로고침 아이콘 등 다른 UI와 혼동을 일으키거나 불필요한 주의 분산과 시각적 피로를 야기합니다.
* **해결책**: 활성화 상태는 1회성 애니메이션, 부드러운 펄스 스케일링(`animate={{ scale: [1, 1.03, 1] }}`), 또는 테두리 발광(Glow) 효과 등으로 세련되게 표현하고, 회전 모션은 지양하십시오.

### 5.2. 마지막 단계 지연 틱 보장 (End-of-Loop Step Dwell)
* 자동 재생이나 순환 루프 틱에서 마지막 단계(`activeStep === total - 1`)에 도달하자마자 즉시 1단계로 강제 리셋되거나 정지 상태로 전환되어 버리면 사용자가 마지막 연출을 미처 확인하기 전에 화면이 넘어가 버립니다.
* **해결책**: 마지막 단계에 진입했을 때도 해당 단계의 지정된 지연시간(Step Duration) 만큼 머무르게 한 후 틱이 불려 리셋되거나 재생 정지 상태(`isPlaying = false`)로 전환되도록 타이머 큐(`setTimeout`) 설정을 설계하십시오.

