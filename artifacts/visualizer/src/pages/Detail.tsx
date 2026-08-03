import { Suspense } from "react";
import { useLocation, Link } from "wouter";
import { ChevronRight, Home, Loader2, ArrowRight, Link2 } from "lucide-react";
import { contentData } from "@/data/content";
import ReactMarkdown from "react-markdown";
import { VISUALIZER_REGISTRY } from "@/visualizations/registry";

function VizFallback() {
  return (
    <div className="flex items-center justify-center h-48 text-muted-foreground gap-2">
      <Loader2 size={18} className="animate-spin" />
      <span className="text-sm">시각화 로드 중...</span>
    </div>
  );
}

function renderVisualization(categoryPath: string, slug: string) {
  const Component = VISUALIZER_REGISTRY[categoryPath]?.[slug];

  if (!Component) {
    return (
      <div className="flex items-center justify-center h-48 bg-muted rounded-xl text-muted-foreground text-sm">
        시각화 준비 중입니다.
      </div>
    );
  }

  return (
    <Suspense fallback={<VizFallback />}>
      <Component />
    </Suspense>
  );
}

const categoryLabels: Record<string, string> = {
  workflows: "워크플로우",
  algorithms: "알고리즘",
};

const categoryTagColors: Record<string, string> = {
  workflow: "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400",
  algorithm: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
};

export default function Detail() {
  const [location] = useLocation();
  const parts = location.split("/").filter(Boolean);
  const categoryPath = parts[0] ?? "";
  const slug = parts[1] ?? "";
  const category = categoryPath === "workflows" ? "workflow" : "algorithm";

  const item = contentData.find((d) => d.category === category && d.slug === slug);

  if (!item) {
    return (
      <div className="py-20 text-center space-y-4">
        <h2 className="text-2xl font-bold text-foreground">항목을 찾을 수 없습니다</h2>
        <p className="text-muted-foreground">요청하신 컨텐츠가 존재하지 않습니다.</p>
        <Link href="/" className="inline-flex items-center gap-2 text-primary hover:underline text-sm">
          <Home size={14} /> 홈으로 돌아가기
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-10">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-sm text-muted-foreground" data-testid="breadcrumb">
        <Link href="/" className="hover:text-foreground transition-colors flex items-center gap-1">
          <Home size={13} />
          홈
        </Link>
        <ChevronRight size={13} />
        <Link href={`/category/${categoryPath}`} className="hover:text-foreground transition-colors">
          {categoryLabels[categoryPath] ?? categoryPath}
        </Link>
        <ChevronRight size={13} />
        <span className="text-foreground font-medium truncate max-w-[200px] sm:max-w-none">
          {item.title}
        </span>
      </nav>

      {/* Header */}
      <header className="space-y-3">
        <div className="flex flex-wrap gap-2">
          <span
            className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
              categoryTagColors[item.category]
            }`}
          >
            {item.category === "workflow" ? "워크플로우" : "알고리즘"}
          </span>
          {item.tags.map((tag) => (
            <span
              key={tag}
              className="inline-block px-3 py-1 rounded-full text-xs bg-muted text-muted-foreground"
            >
              {tag}
            </span>
          ))}
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground leading-snug">
          {item.title}
        </h1>
        <p className="text-muted-foreground text-sm">{item.subtitle}</p>
      </header>

      {/* Visualization — full width */}
      <section
        className="bg-card border border-card-border rounded-2xl p-4 sm:p-6"
        data-testid="visualization-panel"
      >
        {renderVisualization(categoryPath, slug)}
      </section>

      {/* Overview — detailed description */}
      <section className="space-y-6" data-testid="description-section">
        {item.complexity && (
          <div className="space-y-3 pb-2">
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">알고리즘 복잡도</h2>
            <div className="flex flex-wrap gap-2 text-xs sm:text-sm font-medium">
              {[
                ["최선", item.complexity.best],
                ["평균", item.complexity.avg],
                ["최악", item.complexity.worst],
                ["공간", item.complexity.space],
              ].map(([label, val]) => (
                <div key={label} className="flex items-center gap-1.5 px-3 py-1.5 bg-muted/60 rounded-md border border-border/40">
                  <span className="text-muted-foreground">{label}</span>
                  <span className="font-mono font-semibold text-foreground">{val}</span>
                </div>
              ))}
              {item.complexity.stable !== undefined && (
                <div
                  className={`px-3 py-1.5 rounded-md text-xs sm:text-sm font-semibold border ${
                    item.complexity.stable
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200/50 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/30"
                      : "bg-muted text-muted-foreground border-border/40"
                  }`}
                >
                  {item.complexity.stable ? "안정 정렬 ✓" : "불안정 정렬"}
                </div>
              )}
            </div>
          </div>
        )}

        <h2 className="text-xl font-semibold text-foreground border-b border-border pb-2">개요</h2>
        <div className="space-y-4">
          <ReactMarkdown
            components={{
              h1: ({ children }) => (
                <h1 className="text-2xl font-bold text-foreground mt-8 first:mt-0 mb-4 border-b border-border/40 pb-2">
                  {children}
                </h1>
              ),
              h2: ({ children }) => (
                <h2 className="text-xl font-bold text-foreground mt-6 first:mt-0 mb-3">
                  {children}
                </h2>
              ),
              h3: ({ children }) => (
                <h3 className="text-lg font-semibold text-foreground mt-4 first:mt-0 mb-2">
                  {children}
                </h3>
              ),
              p: ({ children }) => (
                <p className="text-base text-muted-foreground leading-relaxed">
                  {children}
                </p>
              ),
              ul: ({ children }) => (
                <ul className="space-y-1.5 ml-1">
                  {children}
                </ul>
              ),
              li: ({ children }) => (
                <li className="flex items-start gap-2 text-base text-muted-foreground leading-relaxed">
                  <span className="mt-2 flex-shrink-0 w-1.5 h-1.5 rounded-full bg-primary/60" />
                  <span>{children}</span>
                </li>
              ),
              strong: ({ children }) => (
                <strong className="font-semibold text-foreground">
                  {children}
                </strong>
              ),
              code: ({ children }) => (
                <code className="px-1.5 py-0.5 rounded bg-muted font-mono text-sm text-foreground">
                  {children}
                </code>
              )
            }}
          >
            {item.description}
          </ReactMarkdown>
        </div>

        {/* 글로벌 서비스 게시글 조회 시에 한하여 실제 레이턴시 레퍼런스 비교 표 노출 */}
        {item.slug === "global-post-retrieval" && (
          <div className="mt-8 border border-border/60 rounded-2xl p-5 bg-card text-card-foreground shadow-sm space-y-4">
            <div className="space-y-1">
              <h3 className="text-base font-bold text-foreground">실제 레이턴시 레퍼런스 비교</h3>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                가장 빠른 L1 캐시 참조 시간(0.5ns)을 1초(배수 1)로 가정하여 스케일을 확장했을 때, 각 단계별 접근 속도가 컴퓨터 시스템 전체에 미치는 현실적 상대 지연 지표 대조군입니다.
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs sm:text-sm text-left border-collapse">
                <thead>
                  <tr className="border-b border-border text-muted-foreground font-semibold">
                    <th className="py-2.5 px-3">작업 분류</th>
                    <th className="py-2.5 px-3">나노초 (ns)</th>
                    <th className="py-2.5 px-3">자연 단위</th>
                    <th className="py-2.5 px-3">배수 (L1 대비)</th>
                    <th className="py-2.5 px-3">비고 (상세 설명)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40 font-mono text-muted-foreground">
                  {[
                    { job: "L1 캐시 참조", ns: "0.5 ns", natural: "0.5 ns", multiplier: 1, note: "CPU 코어 내부 최단 거리 고속 접근" },
                    { job: "분기 예측 실패", ns: "5 ns", natural: "5 ns", multiplier: 10, note: "예측 오류 시 파이프라인 리셋 페널티" },
                    { job: "L2 캐시 참조", ns: "7 ns", natural: "7 ns", multiplier: 14, note: "L1 캐시 미스 시 다음 단계 내부 캐시조회" },
                    { job: "뮤텍스 Lock/Unlock", ns: "25 ns", natural: "25 ns", multiplier: 50, note: "스레드 간 자원 공유를 위한 잠금 제어" },
                    { job: "메인 메모리(RAM) 참조", ns: "100 ns", natural: "100 ns", multiplier: 200, note: "DRAM 메모리 버스 경유 및 버퍼 로딩" },
                    { job: "1MB 메모리 순차 읽기", ns: "3,000 ns", natural: "3 μs", multiplier: 6000, note: "메모리 영역에서의 순차 고속 블록 읽기" },
                    { job: "SSD 랜덤 읽기", ns: "150,000 ns", natural: "150 μs", multiplier: 300000, note: "NVMe SSD를 이용한 임의 블록 액세스" },
                    { job: "데이터센터 내부 RTT", ns: "500,000 ns", natural: "0.5 ms", multiplier: 1000000, note: "동일 데이터센터 리전 내 네트워크 RTT" },
                    { job: "1MB SSD 순차 읽기", ns: "1,000,000 ns", natural: "1 ms", multiplier: 2000000, note: "SSD 이미지 바이너리 덤프 로딩" },
                    { job: "HDD Seek (탐색)", ns: "10,000,000 ns", natural: "10 ms", multiplier: 20000000, note: "물리 헤더 암 이동 및 플래터 회전 대기" },
                    { job: "대륙 간 패킷 왕복", ns: "150,000,000 ns", natural: "150 ms", multiplier: 300000000, note: "미국-한국 간 광케이블 네트워크 RTT" }
                  ].map((row, idx) => (
                    <tr key={idx} className="hover:bg-muted/10">
                      <td className="py-2.5 px-3 text-foreground font-sans font-semibold">{row.job}</td>
                      <td className="py-2.5 px-3">{row.ns}</td>
                      <td className="py-2.5 px-3">{row.natural}</td>
                      <td className="py-2.5 px-3 font-bold text-foreground">{row.multiplier.toLocaleString()}배</td>
                      <td className="py-2.5 px-3 font-sans text-xs">{row.note}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 프레임워크 렌더링 비교 표 노출 */}
        {item.slug === "framework-rendering" && (
          <div className="mt-8 border border-border/60 rounded-2xl p-5 bg-card text-card-foreground shadow-sm space-y-4">
            <div className="space-y-1">
              <h3 className="text-base font-bold text-foreground">프레임워크별 렌더링 패러다임 비교</h3>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                전통적인 Vanilla JS와 현대적인 3대 프론트엔드 프레임워크가 상태를 감지하고 DOM을 업데이트하는 방식의 핵심 기술 차이점입니다.
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs sm:text-sm text-left border-collapse">
                <thead>
                  <tr className="border-b border-border text-muted-foreground font-semibold">
                    <th className="py-2.5 px-3">비교 항목</th>
                    <th className="py-2.5 px-3 text-amber-600 dark:text-amber-400 font-bold">Vanilla JS</th>
                    <th className="py-2.5 px-3 text-sky-600 dark:text-sky-400 font-bold">React</th>
                    <th className="py-2.5 px-3 text-emerald-600 dark:text-emerald-400 font-bold">Vue</th>
                    <th className="py-2.5 px-3 text-orange-600 dark:text-orange-400 font-bold">Svelte</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40 font-sans text-muted-foreground">
                  {[
                    { label: "주요 패러다임", vanilla: "Imperative (명령형)", react: "Declarative (선언형)", vue: "Declarative (선언형)", svelte: "Declarative (선언형)" },
                    { label: "DOM 갱신 매커니즘", vanilla: "수동 직접 조작", react: "가상 DOM 비교 (Fiber)", vue: "reactive 컴포넌트 패치", svelte: "컴파일 정적 DOM 매핑" },
                    { label: "데이터 감지 방식", vanilla: "수동 이벤트 리스너", react: "useState / 얕은 비교", vue: "ES6 Proxy 반응형", svelte: "컴파일 타임 할당문 감지" },
                    { label: "런타임 VDOM 오버헤드", vanilla: "없음", react: "존재 (Fiber Diffing)", vue: "존재 (Component-level)", svelte: "없음 (No VDOM)" },
                    { label: "성능적 주요 강점", vanilla: "단순 UI 최고 속도", react: "대규모 일괄 최적화", vue: "효율적 국소 갱신", svelte: "가벼운 번들 및 초고속 런타임" },
                  ].map((row, idx) => (
                    <tr key={idx} className="hover:bg-muted/10">
                      <td className="py-2.5 px-3 text-foreground font-semibold bg-muted/10">{row.label}</td>
                      <td className="py-2.5 px-3">{row.vanilla}</td>
                      <td className="py-2.5 px-3">{row.react}</td>
                      <td className="py-2.5 px-3">{row.vue}</td>
                      <td className="py-2.5 px-3">{row.svelte}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 실시간 프로토콜 비교 표 노출 */}
        {item.slug === "realtime-protocols" && (
          <div className="mt-8 border border-border/60 rounded-2xl p-5 bg-card text-card-foreground shadow-sm space-y-4">
            <div className="space-y-1">
              <h3 className="text-base font-bold text-foreground">실시간 통신 프로토콜 비교</h3>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                Polling, SSE, WebSocket 기술의 통신 방식, 오버헤드, 생명주기 및 적합한 서비스 환경 비교입니다.
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs sm:text-sm text-left border-collapse">
                <thead>
                  <tr className="border-b border-border text-muted-foreground font-semibold">
                    <th className="py-2.5 px-3">비교 항목</th>
                    <th className="py-2.5 px-3 text-amber-600 dark:text-amber-400 font-bold text-center">Polling</th>
                    <th className="py-2.5 px-3 text-blue-600 dark:text-blue-400 font-bold text-center">SSE</th>
                    <th className="py-2.5 px-3 text-violet-600 dark:text-violet-400 font-bold text-center">WebSocket</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40 font-sans text-muted-foreground">
                  {[
                    { feature: "통신 유형", polling: "단방향 (클라이언트 요청 시에만 응답)", sse: "단방향 (서버 ➔ 클라이언트 푸시 전용)", ws: "양방향 (상시 자유로운 양방향 통신)" },
                    { feature: "연결 생명주기", polling: "요청/응답 사이클 후 즉시 닫힘", sse: "HTTP 연결 반영구 유지 (자동 재연결)", ws: "웹소켓 소켓 연결 영구 유지 (수동 복구)" },
                    { feature: "헤더 오버헤드", polling: "매 요청마다 쿠키/헤더 전송 (800B+)", sse: "최초 1회만 헤더 전송 후 텍스트 스트림", ws: "초기 1회 이후 2~10 바이트 프레임 통신" },
                    { feature: "연결 유지 방식", polling: "단발성 연결 소멸 반복", sse: "지속성 연결 (Persistent)", ws: "지속성 연결 (Persistent)" },
                    { feature: "적합한 서비스", polling: "어드민 대시보드, 빈도 낮은 모니터링", sse: "알림 피드, 실시간 스포츠 중계, 뉴스 피드", ws: "실시간 채팅, 웹게임, 주식 HTS, 협업 보드" },
                  ].map((row, idx) => (
                    <tr key={idx} className="hover:bg-muted/10">
                      <td className="py-2.5 px-3 text-foreground font-semibold bg-muted/10">{row.feature}</td>
                      <td className="py-2.5 px-3 text-center">{row.polling}</td>
                      <td className="py-2.5 px-3 text-center">{row.sse}</td>
                      <td className="py-2.5 px-3 text-center">{row.ws}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {item.steps && item.steps.length > 0 && (
          <div className="mt-6 space-y-3">
            <h3 className="text-base font-semibold text-foreground">핵심 단계</h3>
            <ol className="space-y-2">
              {item.steps.map((step, i) => (
                <li key={i} className="flex items-start gap-3 p-3 bg-muted/40 rounded-lg">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center mt-0.5">
                    {i + 1}
                  </span>
                  <p className="text-sm text-muted-foreground leading-relaxed">{step}</p>
                </li>
              ))}
            </ol>
          </div>
        )}

        {/* 연관 포스트 영역 (Related Visualizations) */}
        {item.related && item.related.length > 0 && (
          <div className="mt-10 pt-8 border-t border-border space-y-4" data-testid="related-section">
            <div className="flex items-center gap-2">
              <Link2 size={18} className="text-primary" />
              <h3 className="text-lg font-bold text-foreground">연관 포스트</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {item.related.map((rel) => {
                const targetCategoryPath = rel.category === "workflow" ? "workflows" : "algorithms";
                const relItem = contentData.find(
                  (d) => d.category === rel.category && d.slug === rel.slug
                );
                if (!relItem) return null;

                return (
                  <Link
                    key={`${rel.category}-${rel.slug}`}
                    href={`/${targetCategoryPath}/${rel.slug}`}
                    className="group flex flex-col justify-between p-4 rounded-xl border border-border/70 bg-card hover:bg-accent/40 hover:border-primary/50 transition-all shadow-sm"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                            categoryTagColors[rel.category]
                          }`}
                        >
                          {rel.category === "workflow" ? "워크플로우" : "알고리즘"}
                        </span>
                        <ArrowRight
                          size={14}
                          className="text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all"
                        />
                      </div>
                      <h4 className="text-sm font-bold text-foreground group-hover:text-primary transition-colors line-clamp-1">
                        {relItem.title}
                      </h4>
                      <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                        {relItem.subtitle}
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

