import { Link, useParams } from "wouter";
import { motion } from "framer-motion";
import { ArrowRight, ChevronRight, Home } from "lucide-react";
import { contentData } from "@/data/content";
import { categoryForPath, CONTENT_CATEGORIES, contentPath } from "@/data/content/categories";
import NotFound from "./not-found";

export default function Category() {
  const params = useParams<{ cat: string }>();
  const category = categoryForPath(params.cat ?? "");
  if (!category) return <NotFound />;

  const config = CONTENT_CATEGORIES[category];
  const Icon = config.icon;
  const items = contentData.filter((item) => item.category === category);

  return (
    <div className="space-y-10">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-sm text-muted-foreground">
        <Link href="/" className="hover:text-foreground transition-colors flex items-center gap-1">
          <Home size={13} /> 홈
        </Link>
        <ChevronRight size={13} />
        <span className="text-foreground font-medium">{config.label}</span>
      </nav>

      {/* Header */}
      <header className="space-y-4">
        <div
          className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-semibold ${config.badge}`}
        >
          <Icon size={18} aria-hidden="true" />
          {config.label}
        </div>
        <h1 className={`text-3xl font-bold ${config.color}`}>{config.label}{" "}{"englishLabel" in config && <span className="ml-2 text-lg font-medium text-muted-foreground">{config.englishLabel}</span>}</h1>
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
            initial={false}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07 }}
          >
            <Link href={contentPath(item.category, item.slug)} data-testid={`card-${item.slug}`}>
              <div className="group h-full bg-card border border-card-border rounded-xl p-5 hover:border-primary/40 hover:shadow-md transition-all cursor-pointer space-y-4">
                <div className="flex items-start justify-between">
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${config.badge}`}>
                    <Icon size={18} aria-hidden="true" />
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
