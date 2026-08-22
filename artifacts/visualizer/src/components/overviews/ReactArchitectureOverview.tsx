import React from "react";
import {
  Atom,
  Cpu,
  Layers,
  GitCommit,
  Sparkles,
  Zap,
  CheckCircle2,
  RefreshCw,
  GitBranch,
  FileCode
} from "lucide-react";

export function ReactArchitectureOverview() {
  return (
    <div className="space-y-6 text-foreground" data-testid="react-architecture-overview">
      {/* 1. Intro Summary Card */}
      <div className="rounded-2xl border border-border/80 bg-card p-5 sm:p-6 shadow-xs space-y-3">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-muted text-foreground text-xs font-semibold">
            <Atom size={14} className="text-cyan-500" />
            React Core Concept
          </span>
          <span className="text-xs text-muted-foreground font-mono">UI = f(state)</span>
        </div>
        <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
          React는 UI를 순수 함수의 결과물로 모델링하며, 상태 변화를 화면에 효율적으로 반영하기 위해 비동기 렌더 단계(Render Phase)와 동기 커밋 단계(Commit Phase)로 분리된 Fiber 재조정 엔진을 운영합니다.
        </p>
      </div>

      {/* 2. 핵심 런타임 렌더링 파이프라인 (행마다 카드 1개) */}
      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <div className="w-1 h-4 rounded-full bg-cyan-500" />
          <h3 className="text-base sm:text-lg font-bold text-foreground">
            1. React의 핵심 런타임 아키텍처
          </h3>
        </div>

        <div className="rounded-2xl border border-border/80 bg-card p-5 sm:p-6 shadow-xs space-y-4">
          <p className="text-sm text-muted-foreground leading-relaxed">
            React 애플리케이션은 상태(State)와 속성(Props)이 변경될 때마다 화면 전체를 처음부터 다시 그리지 않고, 변경된 최소 단위만을 찾아내어 브라우저 DOM에 고속으로 반영합니다.
          </p>

          <div className="divide-y divide-border/50 space-y-3 pt-1">
            {/* Stage 1 */}
            <div className="pt-3 first:pt-0 space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-cyan-600 dark:text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded">
                  01
                </span>
                <h4 className="text-sm font-bold text-foreground">컴포넌트 트리와 JSX</h4>
              </div>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed pl-7">
                JSX 문법은 빌드 시점에 <code className="px-1.5 py-0.5 rounded bg-muted font-mono text-xs text-foreground">React.createElement</code> 또는 최신 JSX 트랜스폼(<code className="px-1.5 py-0.5 rounded bg-muted font-mono text-xs text-foreground">_jsx</code>) 함수 호출로 변환되며, 실행 시 가상 DOM 엘리먼트 객체(JavaScript Object)를 반환합니다.
              </p>
            </div>

            {/* Stage 2 */}
            <div className="pt-3 space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-cyan-600 dark:text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded">
                  02
                </span>
                <h4 className="text-sm font-bold text-foreground">Render Phase (렌더 단계)</h4>
              </div>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed pl-7">
                새로운 상태가 주어지면 컴포넌트 함수를 실행하고 가상 DOM 트리를 메모리에 구성합니다. Fiber Reconciler가 이전 트리(Current)와 새로운 트리(Work-in-Progress)를 비교(Diffing)하여 실제 변경이 필요한 노드들에 작업 플래그(Effect Tag: Placement, Update, Deletion)를 마킹합니다. 이 단계는 순수 계산 과정이므로 비동기로 실행되며 중간에 일시 중단되거나 우선순위에 따라 재시작될 수 있습니다.
              </p>
            </div>

            {/* Stage 3 */}
            <div className="pt-3 space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-cyan-600 dark:text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded">
                  03
                </span>
                <h4 className="text-sm font-bold text-foreground">Commit Phase (커밋 단계)</h4>
              </div>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed pl-7">
                렌더 단계에서 마킹된 Effect 목록을 기반으로 실제 브라우저 DOM 트리에 변경 사항을 단일 배치(Batch)로 일괄 적용합니다. 이 단계는 브라우저 UI의 일관성을 위해 동기적으로 중단 없이 실행됩니다.
              </p>
            </div>

            {/* Stage 4 */}
            <div className="pt-3 space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-cyan-600 dark:text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded">
                  04
                </span>
                <h4 className="text-sm font-bold text-foreground">Passive Effects (부작용 처리 단계)</h4>
              </div>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed pl-7">
                브라우저가 화면 페인트(Paint)를 완료한 직후, 비동기로 등록된 <code className="px-1.5 py-0.5 rounded bg-muted font-mono text-xs text-foreground">useEffect</code> 훅 콜백들이 실행되어 네트워크 요청이나 구독 등의 사이드 이펙트를 처리합니다.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Fiber Reconciler와 더블 버퍼링 (행마다 카드 1개) */}
      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <div className="w-1 h-4 rounded-full bg-cyan-500" />
          <h3 className="text-base sm:text-lg font-bold text-foreground">
            2. Fiber Reconciler와 더블 버퍼링
          </h3>
        </div>

        <div className="rounded-2xl border border-border/80 bg-card p-5 sm:p-6 shadow-xs space-y-4">
          <p className="text-sm text-muted-foreground leading-relaxed">
            React 16에서 도입된 Fiber 아키텍처는 과거 재귀적 동기 호출로 메인 스레드를 블로킹하던 Stack Reconciler의 한계를 극복하기 위해 설계되었습니다.
          </p>

          <div className="divide-y divide-border/50 space-y-3 pt-1">
            <div className="pt-3 first:pt-0 space-y-1">
              <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground" />
                Fiber 노드 구조
              </h4>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed pl-3.5">
                컴포넌트 인스턴스, DOM 노드 정보, 상태, 작업 우선순위를 담고 있는 자바스크립트 객체입니다. 3가지 링크드 리스트 포인터(<code className="px-1 py-0.5 rounded bg-muted font-mono text-xs text-foreground">child</code>: 첫 번째 자식, <code className="px-1 py-0.5 rounded bg-muted font-mono text-xs text-foreground">sibling</code>: 다음 형제, <code className="px-1 py-0.5 rounded bg-muted font-mono text-xs text-foreground">return</code>: 부모)를 통해 트리 구조를 선형 작업 단위로 연결합니다.
              </p>
            </div>

            <div className="pt-3 space-y-1">
              <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground" />
                Double Buffering (더블 버퍼링)
              </h4>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed pl-3.5">
                현재 화면에 렌더링된 상태를 나타내는 <code className="px-1 py-0.5 rounded bg-muted font-mono text-xs text-foreground">current</code> 트리와, 백그라운드에서 다음 렌더링을 계산하는 <code className="px-1 py-0.5 rounded bg-muted font-mono text-xs text-foreground">workInProgress</code> 트리를 동시에 유지합니다. 렌더 단계 동안 workInProgress 트리에서 계산을 완료한 후, 커밋 단계의 마지막에 포인터 하나만 교체함으로써 깜빡임 없이 즉각적으로 화면 상태를 전환합니다.
              </p>
            </div>

            <div className="pt-3 space-y-1">
              <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground" />
                휴리스틱 Diffing 알고리즘
              </h4>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed pl-3.5">
                완전한 트리 비교(O(n³)) 대신 React는 두 가지 가정을 기반으로 O(n)의 고속 비교를 수행합니다. 첫째, 서로 다른 타입의 두 엘리먼트는 서로 다른 트리를 만들어냅니다. 둘째, 개발자가 <code className="px-1 py-0.5 rounded bg-muted font-mono text-xs text-foreground">key</code> prop을 제공하면 여러 렌더링 사이에서 어떤 자식 엘리먼트가 고유하게 유지되는지 즉시 식별할 수 있습니다.
              </p>
            </div>

            <div className="pt-3 space-y-1">
              <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground" />
                Hooks의 내부 링크드 리스트
              </h4>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed pl-3.5">
                함수형 컴포넌트의 Fiber 노드는 <code className="px-1 py-0.5 rounded bg-muted font-mono text-xs text-foreground">memoizedState</code> 필드에 Hook 객체들을 단방향 링크드 리스트 형태로 체이닝하여 보관합니다. 이 때문에 React Hook은 조건문이나 반복문 내부가 아닌 컴포넌트 최상단에서 일정한 순서로 호출되어야 합니다.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Vanilla JS 및 타 프론트엔드 프레임워크와의 차이점 (행마다 카드 1개) */}
      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <div className="w-1 h-4 rounded-full bg-cyan-500" />
          <h3 className="text-base sm:text-lg font-bold text-foreground">
            3. Vanilla JS 및 타 프론트엔드 프레임워크와의 차이점
          </h3>
        </div>

        <div className="rounded-2xl border border-border/80 bg-card p-5 sm:p-6 shadow-xs space-y-5">
          <p className="text-sm text-muted-foreground leading-relaxed">
            React는 선언형 UI, 런타임 가상 DOM, 불변성(Immutability) 기반의 단방향 데이터 흐름을 특징으로 합니다. 이는 직접 DOM을 조작하는 Vanilla JS나 다른 프레임워크들과 설계 철학에서 큰 차이를 보입니다.
          </p>

          <div className="space-y-4">
            {/* Subsection 1 */}
            <div className="p-4 rounded-xl bg-muted/30 border border-border/50 space-y-2">
              <h4 className="text-sm font-bold text-foreground">Vanilla HTML/CSS/JS vs React</h4>
              <ul className="space-y-1.5 text-xs sm:text-sm text-muted-foreground leading-relaxed">
                <li>
                  <strong className="text-foreground font-semibold">패러다임 차이:</strong> Vanilla JS는 개발자가 DOM 메서드를 직접 호출하여 변경 사항을 지시하는 명령형(Imperative) 방식인 반면, React는 상태를 정의하면 UI가 상태의 함수(UI = f(state))로 자동 계산되는 선언형(Declarative) 방식입니다.
                </li>
                <li>
                  <strong className="text-foreground font-semibold">렌더링 성능 및 최적화:</strong> Vanilla JS에서 연쇄적인 DOM 조작은 잦은 브라우저 Reflow와 Repaint를 유발하기 쉽습니다. React는 Virtual DOM과 Fiber 배치 렌더링을 통해 필요한 DOM 변경을 한 번에 모아서 반영하므로 대규모 애플리케이션에서도 일관된 성능을 보장합니다.
                </li>
                <li>
                  <strong className="text-foreground font-semibold">유지보수성:</strong> Vanilla JS는 상태와 DOM의 동기화를 개발자가 직접 관리해야 하므로 규모가 커질수록 버그가 급증합니다. React는 컴포넌트 기반 아키텍처와 단방향 데이터 바인딩으로 코드의 예측 가능성과 재사용성을 극대화합니다.
                </li>
              </ul>
            </div>

            {/* Subsection 2 */}
            <div className="p-4 rounded-xl bg-muted/30 border border-border/50 space-y-2">
              <h4 className="text-sm font-bold text-foreground">주요 프론트엔드 프레임워크 대조</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs sm:text-sm text-muted-foreground">
                <div className="space-y-0.5">
                  <span className="font-semibold text-foreground">React:</span> 런타임 가상 DOM과 Fiber 스케줄러를 채택하여 불변성 기반 얕은 비교를 수행하며, 컴포넌트 단위의 유연한 제어와 방대한 생태계를 제공합니다.
                </div>
                <div className="space-y-0.5">
                  <span className="font-semibold text-foreground">Vue:</span> ES6 Proxy를 사용한 미세 반응성 시스템으로 컴포넌트 렌더링 시 의존성을 자동 추적하며, 상태 변경 시 해당 국소 블록만 가상 DOM 패치를 수행합니다.
                </div>
                <div className="space-y-0.5">
                  <span className="font-semibold text-foreground">Svelte:</span> 런타임 가상 DOM을 완전히 배제하고 빌드 타임 컴파일러가 상태 변경 시 해당 DOM 노드를 직접 변경하는 고성능 자바스크립트 코드를 생성합니다.
                </div>
                <div className="space-y-0.5">
                  <span className="font-semibold text-foreground">Angular:</span> 완전 통합형 엔터프라이즈 프레임워크로 양방향 데이터 바인딩, 의존성 주입(DI), RxJS 기반 반응형 프로그래밍을 기본 제공합니다.
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. React 세대별 10년 진화 타임라인 (색채 유지) */}
      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <div className="w-1 h-4 rounded-full bg-cyan-500" />
          <h3 className="text-base sm:text-lg font-bold text-foreground">
            4. React의 세대별 주요 아키텍처 진화 과정
          </h3>
        </div>

        <div className="relative pl-6 border-l-2 border-border/80 space-y-4">
          {/* v0.3 ~ 15 */}
          <div className="relative group">
            <div className="absolute -left-[31px] top-1 w-4 h-4 rounded-full bg-background border-2 border-sky-500 group-hover:scale-125 transition-transform" />
            <div className="rounded-xl border border-border/70 bg-card p-4 space-y-1.5 shadow-xs">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs sm:text-sm font-bold text-sky-600 dark:text-sky-400">
                  React 0.3 ~ 15 (2013-2016)
                </span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-sky-500/10 text-sky-600 dark:text-sky-400">
                  Stack Reconciler
                </span>
              </div>
              <h4 className="text-sm font-bold text-foreground">선언적 UI와 가상 DOM의 태동</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                React.createClass와 가상 DOM 개념 최초 도입. 단, 재귀적 동기 호출로 대규모 트리 렌더링 시 메인 스레드가 블로킹되어 UI가 멈추는 한계가 있었습니다.
              </p>
            </div>
          </div>

          {/* v16 */}
          <div className="relative group">
            <div className="absolute -left-[31px] top-1 w-4 h-4 rounded-full bg-background border-2 border-violet-500 group-hover:scale-125 transition-transform" />
            <div className="rounded-xl border border-border/70 bg-card p-4 space-y-1.5 shadow-xs">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs sm:text-sm font-bold text-violet-600 dark:text-violet-400">
                  React 16 (2017)
                </span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-violet-500/10 text-violet-600 dark:text-violet-400">
                  Fiber Architecture
                </span>
              </div>
              <h4 className="text-sm font-bold text-foreground">Fiber 재조정자 전면 도입</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                재조정 엔진을 링크드 리스트 기반 작업 단위(Fiber)로 처음부터 재작성하여 렌더링 중단, 재개, 우선순위 배치가 가능해졌습니다. Error Boundaries와 Fragments 공식 지원.
              </p>
            </div>
          </div>

          {/* v16.8 */}
          <div className="relative group">
            <div className="absolute -left-[31px] top-1 w-4 h-4 rounded-full bg-background border-2 border-emerald-500 group-hover:scale-125 transition-transform" />
            <div className="rounded-xl border border-border/70 bg-card p-4 space-y-1.5 shadow-xs">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs sm:text-sm font-bold text-emerald-600 dark:text-emerald-400">
                  React 16.8 (2019)
                </span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  Hooks Revolution
                </span>
              </div>
              <h4 className="text-sm font-bold text-foreground">React Hooks 혁명</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                클래스 컴포넌트의 복잡한 생명주기 및 this 바인딩을 탈피하고, useState/useEffect 등의 훅을 통해 로직 재사용성을 극대화하며 함수형 컴포넌트를 표준으로 정립했습니다.
              </p>
            </div>
          </div>

          {/* v18 */}
          <div className="relative group">
            <div className="absolute -left-[31px] top-1 w-4 h-4 rounded-full bg-background border-2 border-cyan-500 group-hover:scale-125 transition-transform" />
            <div className="rounded-xl border border-border/70 bg-card p-4 space-y-1.5 shadow-xs">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs sm:text-sm font-bold text-cyan-600 dark:text-cyan-400">
                  React 18 (2022)
                </span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-600 dark:text-cyan-400">
                  Concurrent Renderer
                </span>
              </div>
              <h4 className="text-sm font-bold text-foreground">동시성 렌더러와 Streaming SSR</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Automatic Batching, Transitions API(useTransition)로 긴급/비긴급 작업 우선순위 분리, Suspense 기반 점진적 스트리밍 하이드레이션 지원.
              </p>
            </div>
          </div>

          {/* v19 */}
          <div className="relative group">
            <div className="absolute -left-[31px] top-1 w-4 h-4 rounded-full bg-background border-2 border-rose-500 group-hover:scale-125 transition-transform" />
            <div className="rounded-xl border border-border/70 bg-card p-4 space-y-1.5 shadow-xs">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs sm:text-sm font-bold text-rose-600 dark:text-rose-400">
                  React 19 (2024~현재)
                </span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400">
                  RSC & React Compiler
                </span>
              </div>
              <h4 className="text-sm font-bold text-foreground">React Server Components & React Compiler</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                서버 전용 컴포넌트(RSC)로 번들 크기 감축 및 DB 직접 접근, Server Actions 지원, React Compiler(Forget)를 통한 자동 메모이제이션으로 useMemo/useCallback 수동 작성 제거.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
