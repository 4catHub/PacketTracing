import { Suspense, lazy } from "react";
import { useLocation, Link } from "wouter";
import { ChevronRight, Home, Loader2 } from "lucide-react";
import { contentData } from "@/data/content";

const GoogleDnsViz = lazy(() => import("@/visualizations/GoogleDnsViz"));
const RestVsGrpcViz = lazy(() => import("@/visualizations/RestVsGrpcViz"));
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
    if (slug === "cicd") return wrap(CiCdViz);
    if (slug === "docker-before-after") return wrap(DockerViz);
    if (slug === "k8s-before-after") return wrap(K8sViz);
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
    <div className="max-w-4xl mx-auto space-y-10">
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
