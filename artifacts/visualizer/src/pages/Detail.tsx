import { Suspense, lazy } from "react";
import { useLocation, Link } from "wouter";
import { ChevronRight, Home, Loader2 } from "lucide-react";
import { contentData } from "@/data/content";

const GoogleDnsViz = lazy(() => import("@/visualizations/GoogleDnsViz"));
const RestVsGrpcViz = lazy(() => import("@/visualizations/RestVsGrpcViz"));
const SieveViz = lazy(() => import("@/visualizations/SieveViz"));

function VizFallback() {
  return (
    <div className="flex items-center justify-center h-48 text-muted-foreground gap-2">
      <Loader2 size={18} className="animate-spin" />
      <span className="text-sm">시각화 로드 중...</span>
    </div>
  );
}

function renderVisualization(categoryPath: string, slug: string) {
  if (categoryPath === "workflows" && slug === "google-dns") {
    return (
      <Suspense fallback={<VizFallback />}>
        <GoogleDnsViz />
      </Suspense>
    );
  }
  if (categoryPath === "workflows" && slug === "rest-vs-grpc") {
    return (
      <Suspense fallback={<VizFallback />}>
        <RestVsGrpcViz />
      </Suspense>
    );
  }
  if (categoryPath === "algorithms" && slug === "sieve-of-eratosthenes") {
    return (
      <Suspense fallback={<VizFallback />}>
        <SieveViz />
      </Suspense>
    );
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

  const descParagraphs = item.description.split("\n\n").filter(Boolean);

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
      <header className="space-y-4">
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
        <p className="text-muted-foreground">{item.subtitle}</p>
      </header>

      {/* Visualization */}
      <section
        className="bg-card border border-card-border rounded-2xl p-4 sm:p-6"
        data-testid="visualization-panel"
      >
        {renderVisualization(categoryPath, slug)}
      </section>

      {/* Description */}
      <section className="space-y-4" data-testid="description-section">
        <h2 className="text-lg font-semibold text-foreground border-b border-border pb-2">개요</h2>
        {descParagraphs.map((para, i) => (
          <p key={i} className="text-muted-foreground leading-relaxed">
            {para}
          </p>
        ))}
      </section>

      {/* Examples */}
      <section className="space-y-4" data-testid="examples-section">
        <h2 className="text-lg font-semibold text-foreground border-b border-border pb-2">
          실생활 예시
        </h2>
        <div className="grid sm:grid-cols-2 gap-3">
          {item.examples.map((ex, i) => (
            <div
              key={i}
              className="flex items-start gap-3 p-4 bg-card border border-card-border rounded-xl"
            >
              <span className="mt-0.5 flex-shrink-0 w-5 h-5 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center">
                {i + 1}
              </span>
              <p className="text-sm text-muted-foreground">{ex}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Related — placeholder */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-foreground border-b border-border pb-2">
          관련 항목
        </h2>
        <div className="flex items-center justify-center h-24 bg-muted/50 rounded-xl border border-dashed border-border">
          <p className="text-sm text-muted-foreground">준비 중입니다</p>
        </div>
      </section>
    </div>
  );
}
