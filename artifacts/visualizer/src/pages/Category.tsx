import { Link, useParams } from "wouter";
import { motion } from "framer-motion";
import { ArrowRight, GitBranch, Cpu, ChevronRight, Home } from "lucide-react";
import { contentData, type Category } from "@/data/content";

const categoryConfig: Record<
  string,
  { category: Category; label: string; plural: string; color: string; bgColor: string; icon: React.ReactNode; description: string }
> = {
  workflows: {
    category: "workflow",
    label: "워크플로우",
    plural: "워크플로우",
    color: "text-violet-700 dark:text-violet-400",
    bgColor: "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400",
    icon: <GitBranch size={18} />,
    description: "복잡한 시스템의 동작 과정을 단계별로 시각화합니다. 네트워크, 프로토콜, 서버 동작 등 실제 시스템이 어떻게 작동하는지 인터랙티브하게 탐색하세요.",
  },
  algorithms: {
    category: "algorithm",
    label: "알고리즘",
    plural: "알고리즘",
    color: "text-emerald-700 dark:text-emerald-400",
    bgColor: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
    icon: <Cpu size={18} />,
    description: "고전 알고리즘의 실행 과정을 눈으로 확인하세요. 정렬, 탐색, 수학적 알고리즘 등을 직접 조작하며 원리를 이해할 수 있습니다.",
  },
};

function getHref(item: (typeof contentData)[0]) {
  const cat = item.category === "workflow" ? "workflows" : "algorithms";
  return `/${cat}/${item.slug}`;
}

export default function Category() {
  const params = useParams<{ cat: string }>();
  const catKey = params.cat ?? "";
  const config = categoryConfig[catKey];

  if (!config) {
    return (
      <div className="py-20 text-center space-y-4">
        <h2 className="text-2xl font-bold text-foreground">카테고리를 찾을 수 없습니다</h2>
        <Link href="/" className="inline-flex items-center gap-2 text-primary hover:underline text-sm">
          <Home size={14} /> 홈으로 돌아가기
        </Link>
      </div>
    );
  }

  const items = contentData.filter((d) => d.category === config.category);

  return (
    <div className="space-y-10">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-sm text-muted-foreground">
        <Link href="/" className="hover:text-foreground transition-colors flex items-center gap-1">
          <Home size={13} /> 홈
        </Link>
        <ChevronRight size={13} />
        <span className="text-foreground font-medium">{config.plural}</span>
      </nav>

      {/* Header */}
      <header className="space-y-4">
        <div
          className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-semibold ${config.bgColor}`}
        >
          {config.icon}
          {config.label}
        </div>
        <h1 className={`text-3xl font-bold ${config.color}`}>{config.plural}</h1>
        <p className="text-muted-foreground max-w-xl leading-relaxed">{config.description}</p>
        <p className="text-sm text-muted-foreground">
          총 <span className="font-bold text-foreground">{items.length}</span>개 항목
        </p>
      </header>

      {/* Card grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {items.map((item, i) => (
          <motion.div
            key={item.slug}
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07 }}
          >
            <Link href={getHref(item)} data-testid={`card-${item.slug}`}>
              <div className="group h-full bg-card border border-card-border rounded-xl p-5 hover:border-primary/40 hover:shadow-md transition-all cursor-pointer space-y-4">
                <div className="flex items-start justify-between">
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${config.bgColor}`}>
                    {config.icon}
                    {config.label}
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
                  {item.tags.map((tag) => (
                    <span key={tag} className="px-2 py-0.5 rounded text-xs bg-muted text-muted-foreground">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </Link>
          </motion.div>
        ))}

        {items.length === 0 && (
          <div className="col-span-full py-16 text-center text-muted-foreground">
            아직 준비된 항목이 없습니다.
          </div>
        )}
      </div>
    </div>
  );
}
