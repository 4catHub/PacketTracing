import { useState } from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { Search, ArrowRight, GitBranch, Cpu } from "lucide-react";
import { contentData, type Category } from "@/data/content";

const categoryMeta: Record<Category, { label: string; color: string; icon: React.ReactNode }> = {
  workflow: {
    label: "워크플로우",
    color: "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400",
    icon: <GitBranch size={16} />,
  },
  algorithm: {
    label: "알고리즘",
    color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
    icon: <Cpu size={16} />,
  },
};

function getHref(item: (typeof contentData)[0]) {
  const cat = item.category === "workflow" ? "workflows" : "algorithms";
  return `/${cat}/${item.slug}`;
}

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
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="flex items-end justify-between flex-wrap gap-4"
        >
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            PackeTracing
          </h1>
          <div className="flex gap-6 text-sm">
            <div>
              <span className="text-xl font-bold text-foreground">
                {contentData.filter((d) => d.category === "workflow").length}
              </span>
              <span className="ml-1.5 text-muted-foreground">워크플로우</span>
            </div>
            <div className="w-px bg-border" />
            <div>
              <span className="text-xl font-bold text-foreground">
                {contentData.filter((d) => d.category === "algorithm").length}
              </span>
              <span className="ml-1.5 text-muted-foreground">알고리즘</span>
            </div>
          </div>
        </motion.div>
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
        <div className="flex gap-2">
          {(["all", "workflow", "algorithm"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setActiveFilter(f)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeFilter === f
                  ? "bg-primary text-primary-foreground"
                  : "bg-card border border-card-border text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
              data-testid={`filter-${f}`}
            >
              {f === "all" ? "전체" : f === "workflow" ? "워크플로우" : "알고리즘"}
            </button>
          ))}
        </div>
      </div>

      {/* Cards grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {filtered.map((item, i) => {
          const meta = categoryMeta[item.category];
          return (
            <motion.div
              key={item.slug}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07 }}
            >
              <Link href={getHref(item)} data-testid={`card-${item.slug}`}>
                <div className="group h-full bg-card border border-card-border rounded-xl p-5 hover:border-primary/40 hover:shadow-md transition-all cursor-pointer space-y-4">
                  <div className="flex items-start justify-between">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${meta.color}`}
                    >
                      {meta.icon}
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
