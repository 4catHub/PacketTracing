import { Suspense, lazy } from "react";
import { useLocation, Link } from "wouter";
import { ChevronRight, Home, Loader2 } from "lucide-react";
import { contentData } from "@/data/content";

const GoogleDnsViz = lazy(() => import("@/visualizations/GoogleDnsViz"));
const RestVsGrpcViz = lazy(() => import("@/visualizations/RestVsGrpcViz"));
const OauthFlowViz = lazy(() => import("@/visualizations/OauthFlowViz"));
const JwtVsSessionViz = lazy(() => import("@/visualizations/JwtVsSessionViz"));
const RealtimeProtocolsViz = lazy(() => import("@/visualizations/RealtimeProtocolsViz"));
const HttpsHandshakeViz = lazy(() => import("@/visualizations/HttpsHandshakeViz"));
const ApiGatewayViz = lazy(() => import("@/visualizations/ApiGatewayViz"));
const MonolithVsMsaViz = lazy(() => import("@/visualizations/MonolithVsMsaViz"));
const SieveViz = lazy(() => import("@/visualizations/SieveViz"));
const CiCdViz = lazy(() => import("@/visualizations/CiCdViz"));
const DockerViz = lazy(() => import("@/visualizations/DockerViz"));
const K8sViz = lazy(() => import("@/visualizations/K8sViz"));
const BubbleSortViz = lazy(() => import("@/visualizations/BubbleSortViz"));
const SelectionSortViz = lazy(() => import("@/visualizations/SelectionSortViz"));
const InsertionSortViz = lazy(() => import("@/visualizations/InsertionSortViz"));
const MergeSortViz = lazy(() => import("@/visualizations/MergeSortViz"));
const QuickSortViz = lazy(() => import("@/visualizations/QuickSortViz"));
const HeapSortViz = lazy(() => import("@/visualizations/HeapSortViz"));
const CountingSortViz = lazy(() => import("@/visualizations/CountingSortViz"));
const RadixSortViz = lazy(() => import("@/visualizations/RadixSortViz"));
const DfsVsBfsViz = lazy(() => import("@/visualizations/DfsVsBfsViz"));
const GlobalPostRetrievalViz = lazy(() => import("@/visualizations/GlobalPostRetrievalViz"));

function VizFallback() {
  return (
    <div className="flex items-center justify-center h-48 text-muted-foreground gap-2">
      <Loader2 size={18} className="animate-spin" />
      <span className="text-sm">시각화 로드 중...</span>
    </div>
  );
}

function renderVisualization(categoryPath: string, slug: string) {
  const wrap = (Component: React.LazyExoticComponent<React.ComponentType>) => (
    <Suspense fallback={<VizFallback />}>
      <Component />
    </Suspense>
  );

  if (categoryPath === "workflows") {
    if (slug === "google-dns") return wrap(GoogleDnsViz);
    if (slug === "rest-vs-grpc") return wrap(RestVsGrpcViz);
    if (slug === "oauth-flow") return wrap(OauthFlowViz);
    if (slug === "jwt-vs-session") return wrap(JwtVsSessionViz);
    if (slug === "realtime-protocols") return wrap(RealtimeProtocolsViz);
    if (slug === "https-handshake") return wrap(HttpsHandshakeViz);
    if (slug === "api-gateway") return wrap(ApiGatewayViz);
    if (slug === "monolith-vs-msa") return wrap(MonolithVsMsaViz);
    if (slug === "cicd") return wrap(CiCdViz);
    if (slug === "docker-before-after") return wrap(DockerViz);
    if (slug === "k8s-before-after") return wrap(K8sViz);
    if (slug === "global-post-retrieval") return wrap(GlobalPostRetrievalViz);
  }
  if (categoryPath === "algorithms") {
    if (slug === "sieve-of-eratosthenes") return wrap(SieveViz);
    if (slug === "bubble-sort") return wrap(BubbleSortViz);
    if (slug === "selection-sort") return wrap(SelectionSortViz);
    if (slug === "insertion-sort") return wrap(InsertionSortViz);
    if (slug === "merge-sort") return wrap(MergeSortViz);
    if (slug === "quick-sort") return wrap(QuickSortViz);
    if (slug === "heap-sort") return wrap(HeapSortViz);
    if (slug === "counting-sort") return wrap(CountingSortViz);
    if (slug === "radix-sort") return wrap(RadixSortViz);
    if (slug === "dfs-vs-bfs") return wrap(DfsVsBfsViz);
  }
  return (
    <div className="flex items-center justify-center h-48 bg-muted rounded-xl text-muted-foreground text-sm">
      시각화 준비 중입니다.
    </div>
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

        <h2 className="text-lg font-semibold text-foreground border-b border-border pb-2">개요</h2>
        <div className="space-y-4">
          {item.description.split("\n\n").filter(Boolean).map((para, i) => {
            if (para.startsWith("##")) {
              const heading = para.replace(/^##\s*/, "");
              return (
                <h3 key={i} className="text-base font-semibold text-foreground mt-6 first:mt-0">
                  {heading}
                </h3>
              );
            }
            if (para.startsWith("-") || para.includes("\n-")) {
              const lines = para.split("\n").filter(Boolean);
              return (
                <ul key={i} className="space-y-1.5 ml-1">
                  {lines.map((line, j) => (
                    <li key={j} className="flex items-start gap-2 text-sm text-muted-foreground leading-relaxed">
                      <span className="mt-1.5 flex-shrink-0 w-1.5 h-1.5 rounded-full bg-primary/60" />
                      <span>{line.replace(/^-\s*/, "")}</span>
                    </li>
                  ))}
                </ul>
              );
            }
            return (
              <p key={i} className="text-sm text-muted-foreground leading-relaxed">
                {para}
              </p>
            );
          })}
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
      </section>
    </div>
  );
}
