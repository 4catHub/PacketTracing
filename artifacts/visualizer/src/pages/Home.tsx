import { useState } from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { Search, ArrowRight } from "lucide-react";
import { contentData, type Category } from "@/data/content";
import { CATEGORIES, CONTENT_CATEGORIES, contentPath } from "@/data/content/categories";

export default function Home() {
  const [query, setQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<"all" | Category>("all");

  const filtered = contentData.filter((item) => {
    const matchesQuery =
      !query ||
      item.title.toLowerCase().includes(query.toLowerCase()) ||
      item.tags.some((t) => t.toLowerCase().includes(query.toLowerCase()));
    const matchesFilter = activeFilter === "all" || item.category === activeFilter;
    return matchesQuery && matchesFilter;
  });

  return (
    <div className="space-y-12">
      {/* Hero */}
      <section className="pt-6 pb-2">
        <motion.div
          initial={false}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="flex items-end justify-between flex-wrap gap-4"
        >
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            PackeTracing
          </h1>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
            {CATEGORIES.map((category) => (
              <div key={category} className="whitespace-nowrap">
                <span className="text-xl font-bold text-foreground">
                  {contentData.filter((item) => item.category === category).length}
                </span>
                <span className="ml-1.5 text-muted-foreground">{CONTENT_CATEGORIES[category].label}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </section>

      <section className="max-w-4xl space-y-4 text-sm sm:text-base leading-relaxed text-muted-foreground" aria-label="서비스 이용 안내">
        <h2 className="text-xl font-semibold text-foreground">시스템의 동작 흐름과 기술의 구성 구조를 이해하기</h2>
        <p>PackeTracing은 네트워크와 분산 시스템의 처리 흐름, 보안 공격, 소프트웨어 장애, 알고리즘 실행 과정뿐 아니라 SaaS·프레임워크·플랫폼이 제공하는 기능 구조를 시각적으로 탐색하는 학습 사이트입니다.</p>
        <p>워크플로우에서는 상태 변화를 단계별로, 아키텍처에서는 전체 구성요소를 하나의 장면에서 살펴봅니다. 아래의 개요, 기술 설명, 실제 활용 사례와 연관 주제도 함께 읽을 수 있습니다.</p>
        <p>처음 방문했다면 <Link href="/workflows/api-gateway" className="text-primary hover:underline">API Gateway 요청 제한</Link>, <Link href="/workflows/db-indexing" className="text-primary hover:underline">데이터베이스 인덱싱</Link>, <Link href="/algorithms/bubble-sort" className="text-primary hover:underline">버블 정렬</Link>부터 살펴보세요.</p>
      </section>

      {/* Filter bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="search"
            placeholder="제목 또는 태그 검색..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm bg-card border border-card-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/40"
            data-testid="input-search"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {(["all", ...CATEGORIES] as const).map((f) => (
            <button
              key={f}
              onClick={() => setActiveFilter(f)}
              aria-pressed={activeFilter === f}
              className={`px-2.5 sm:px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeFilter === f
                  ? "bg-primary text-primary-foreground"
                  : "bg-card border border-card-border text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
              data-testid={`filter-${f}`}
            >
              {f === "all" ? "전체" : CONTENT_CATEGORIES[f].label}
            </button>
          ))}
        </div>
      </div>

      {/* Cards grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {filtered.map((item, i) => {
          const meta = CONTENT_CATEGORIES[item.category];
          const Icon = meta.icon;
          return (
            <motion.div
              key={item.slug}
              initial={false}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07 }}
            >
              <Link href={contentPath(item.category, item.slug)} data-testid={`card-${item.slug}`}>
                <div className="group h-full bg-card border border-card-border rounded-xl p-5 hover:border-primary/40 hover:shadow-md transition-all cursor-pointer space-y-4">
                  <div className="flex items-start justify-between">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${meta.badge}`}
                    >
                      <Icon size={16} aria-hidden="true" />
                      {meta.label}
                    </span>
                    <ArrowRight
                      size={16}
                      className="text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all mt-1"
                    />
                  </div>

                  <div>
                    <h2 className="font-semibold text-foreground leading-snug group-hover:text-primary transition-colors">
                      {item.title}
                    </h2>
                    <p className="mt-1 text-xs text-muted-foreground">{item.subtitle}</p>
                  </div>

                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {item.description.split("\n")[0]}
                  </p>

                  <div className="flex flex-wrap gap-1.5">
                    {item.tags?.map((tag) => (
                      <span
                        key={tag}
                        className="px-2 py-0.5 rounded text-xs bg-muted text-muted-foreground"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </Link>
            </motion.div>
          );
        })}

        {filtered.length === 0 && (
          <div className="col-span-full py-16 text-center text-muted-foreground">
            검색 결과가 없습니다.
          </div>
        )}
      </div>
    </div>
  );
}
